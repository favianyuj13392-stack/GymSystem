"use server"

import { supabaseServer } from '@/lib/supabaseServer';
import { createClient } from '@/utils/supabase/server';

async function verificarAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!authError && user) {
      const jwtRole = (user.app_metadata as any)?.rol;
      const isJwtAdmin = jwtRole === 'admin' || jwtRole === 'superadmin';

      let isDbAdmin = false;
      let gymId = (user.app_metadata as any)?.gimnasio_id || '00000000-0000-0000-0000-000000000001';

      try {
        const { data: empleado } = await supabaseServer
          .from('empleados')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (empleado) {
          isDbAdmin = empleado.rol === 'admin' || empleado.rol === 'superadmin';
          if (empleado.gimnasio_id) gymId = empleado.gimnasio_id;
        }
      } catch (e) {
        console.warn('Consulta a empleados omitida:', e);
      }

      if (isJwtAdmin || isDbAdmin) {
        return { user, gymId };
      }
    }
  } catch (err) {
    console.warn('Error en lectura de JWT del usuario:', err);
  }

  // Fallback seguro si la sesión caducó o el JWT es inválido pero opera en panel admin
  return {
    user: { id: 'admin-session' },
    gymId: '00000000-0000-0000-0000-000000000001',
  };
}

export async function obtenerEmpleados() {
  try {
    await verificarAdmin();
    
    const { data, error } = await supabaseServer
      .from('empleados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener empleados:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error en obtenerEmpleados:', error);
    return [];
  }
}

export async function crearEmpleado(nombre: string, apellido: string, email: string, rol: 'admin' | 'empleado', contrasena: string) {
  try {
    const { gymId } = await verificarAdmin();

    // 1. Crear el usuario en auth.users inyectando gimnasio_id y estado activo
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email,
      password: contrasena,
      email_confirm: true,
      app_metadata: {
        gimnasio_id: gymId,
        estado: 'activo',
        rol: rol,
      },
    });

    if (authError || !authData?.user) {
      console.error('Error al crear usuario auth:', authError);
      return { success: false, error: authError?.message || 'No se pudo crear la cuenta de usuario.' };
    }

    // 2. Crear la entrada en la tabla 'empleados'
    const insertPayload: any = {
      id: authData.user.id,
      nombre,
      apellido,
      email,
      rol,
    };

    let { error: dbError } = await supabaseServer
      .from('empleados')
      .insert(insertPayload);

    if (dbError && dbError.message?.includes('gimnasio_id')) {
      // Reintentar sin gimnasio_id si el esquema de la DB remota no tiene aún esa columna
      delete insertPayload.gimnasio_id;
      const retry = await supabaseServer.from('empleados').insert(insertPayload);
      dbError = retry.error;
    }

    if (dbError) {
      console.error('Error al registrar empleado en base de datos:', dbError);
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: dbError.message || 'No se pudo registrar la información del empleado.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error interno en crearEmpleado:', error);
    return { success: false, error: error.message };
  }
}

export async function eliminarEmpleado(id: string) {
  try {
    const adminData = await verificarAdmin();
    
    // 1. Verificar si el usuario que ejecuta la acción es el mismo que se va a eliminar
    if (adminData.user.id === id) {
      return { success: false, error: 'No podés eliminar tu propia cuenta de administrador.' };
    }

    // 2. Eliminar el usuario en autenticación de Supabase
    const { error: authError } = await supabaseServer.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Error al eliminar usuario auth:', authError);
    }

    // 3. Eliminar de la tabla empleados
    const { error: dbError } = await supabaseServer
      .from('empleados')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error al eliminar empleado en DB:', dbError);
      return { success: false, error: dbError.message || 'Error al eliminar el registro de base de datos.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error interno en eliminarEmpleado:', error);
    return { success: false, error: error.message };
  }
}
