"use server"

import { supabaseServer } from '@/lib/supabaseServer';
import { createClient } from '@/utils/supabase/server';

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('No autorizado: Sesión no válida');
  }
  
  const { data: empleado, error: dbError } = await supabaseServer
    .from('empleados')
    .select('rol')
    .eq('id', user.id)
    .single();
    
  if (dbError || empleado?.rol !== 'admin') {
    throw new Error('No autorizado: Se requiere rol de administrador');
  }
  return user;
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
    await verificarAdmin();

    // 1. Crear el usuario en la sección de autenticación de Supabase (con el rol de administrador del servidor)
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email,
      password: contrasena,
      email_confirm: true
    });

    if (authError || !authData?.user) {
      console.error('Error al crear usuario auth:', authError);
      return { success: false, error: authError?.message || 'No se pudo crear la cuenta de usuario.' };
    }

    // 2. Crear la entrada en la tabla 'empleados'
    const { error: dbError } = await supabaseServer
      .from('empleados')
      .insert({
        id: authData.user.id,
        nombre,
        apellido,
        email,
        rol
      });

    if (dbError) {
      console.error('Error al registrar empleado en base de datos:', dbError);
      // Intenta revertir la creación de autenticación
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
    const user = await verificarAdmin();
    
    // 1. Verificar si el usuario que ejecuta la acción es el mismo que se va a eliminar
    if (user.id === id) {
      return { success: false, error: 'No podés eliminar tu propia cuenta de administrador.' };
    }

    // 2. Eliminar el usuario en autenticación de Supabase
    const { error: authError } = await supabaseServer.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Error al eliminar usuario auth:', authError);
      // Intentamos continuar por si el usuario de auth ya no existe pero sí en la base de datos
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
