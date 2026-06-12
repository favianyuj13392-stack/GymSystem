"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerListaSocios(busqueda?: string, filtroEstado?: string) {
  try {
    let query = supabaseServer.from('socios').select(`
      *,
      membresias (
        id,
        plan_id,
        fecha_inicio,
        fecha_fin,
        estado,
        planes (
          nombre,
          precio,
          duracion_meses
        )
      )
    `).eq('activo', true);

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`);
    }

    const { data: sociosDB, error } = await query;

    if (error) {
      console.error('Error al obtener socios:', error);
      return [];
    }

    // Determinar la fecha de hoy para el cálculo de estados
    const hoyObj = new Date();
    const hoyFormat = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth()+1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;

    // Procesar los datos para agregar la membresía más reciente
    const sociosProcesados = sociosDB.map((socio: any) => {
      // Ordenar por fecha_fin más reciente
      const membresiasOrdenadas = (socio.membresias || []).sort((a: any, b: any) => {
        return new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime();
      });

      const membresiaActual = membresiasOrdenadas.length > 0 ? membresiasOrdenadas[0] : null;
      
      let estado = 'sin_membresia';
      if (membresiaActual) {
        if (membresiaActual.fecha_fin >= hoyFormat && membresiaActual.estado === 'activo') {
          estado = 'activo';
        } else {
          estado = 'vencido';
        }
      }

      return {
        ...socio,
        membresiaActual,
        estadoCalculado: estado
      };
    });

    // Filtrado en memoria por estado
    let filtrados = sociosProcesados;
    if (filtroEstado && filtroEstado !== 'Todos') {
      const filtro = filtroEstado.toLowerCase(); // 'activo' o 'vencido'
      filtrados = sociosProcesados.filter(s => s.estadoCalculado === filtro);
    }

    // Ordenar por nombre alfabéticamente por defecto
    filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return filtrados;

  } catch (error) {
    console.error('Error interno en obtenerListaSocios:', error);
    return [];
  }
}

export async function obtenerPlanesDisponibles() {
  const { data, error } = await supabaseServer
    .from('planes')
    .select('*')
    .order('precio', { ascending: true });
    
  if (error) {
    console.error('Error obteniendo planes:', error);
    return [];
  }
  return data;
}

export async function renovarMembresia(socioId: string, planId: string, montoPagado: number, metodoPago: string = 'Efectivo') {
  try {
    // 1. Cambiar el estado de las membresías previas activas a "reemplazado" o "vencido"
    await supabaseServer
      .from('membresias')
      .update({ estado: 'reemplazado' })
      .eq('socio_id', socioId)
      .eq('estado', 'activo');

    // 2. Obtener los meses del nuevo plan
    const { data: plan, error: planError } = await supabaseServer
      .from('planes')
      .select('duracion_meses')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return { success: false, error: 'No se encontró el plan especificado.' };
    }

    const meses = plan.duracion_meses || 1;
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + meses);

    const formatISODate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 3. Insertar la nueva membresía
    const { data: nuevaMembresia, error: memError } = await supabaseServer
      .from('membresias')
      .insert({
        socio_id: socioId,
        plan_id: planId,
        fecha_inicio: formatISODate(fechaInicio),
        fecha_fin: formatISODate(fechaFin),
        estado: 'activo'
      })
      .select('id')
      .single();

    if (memError || !nuevaMembresia) {
      return { success: false, error: 'Error al registrar la nueva membresía.' };
    }

    // 4. Insertar en la tabla de pagos
    const { error: pagoError } = await supabaseServer
      .from('pagos')
      .insert({
        socio_id: socioId,
        membresia_id: nuevaMembresia.id,
        monto: montoPagado,
        metodo_pago: metodoPago,
      });

    if (pagoError) {
      console.error('Atención: La membresía se renovó pero el pago no se registró:', pagoError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error interno renovando membresía:', error);
    return { success: false, error: error.message };
  }
}

export async function actualizarSocio(id: string, datosSocio: {
  nombre: string;
  dni: string;
  telefono: string;
  foto_url?: string;
}) {
  try {
    const updateData: any = {
      nombre: datosSocio.nombre,
      dni: datosSocio.dni,
      telefono: datosSocio.telefono,
    };
    if (datosSocio.foto_url) {
      updateData.foto_url = datosSocio.foto_url;
    }

    const { error } = await supabaseServer
      .from('socios')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar socio:', error);
      return { success: false, error: 'No se pudo actualizar el socio. Es probable que el DNI ya esté registrado.' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error en actualizarSocio:', err);
    return { success: false, error: err.message };
  }
}

export async function eliminarSocioLogico(id: string) {
  try {
    const { error } = await supabaseServer
      .from('socios')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      console.error('Error al desactivar socio:', error);
      return { success: false, error: 'No se pudo dar de baja al socio.' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error en eliminarSocioLogico:', err);
    return { success: false, error: err.message };
  }
}

export async function obtenerAsistenciasSocio(socioId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('asistencias')
      .select('*')
      .eq('socio_id', socioId)
      .order('registrado_at', { ascending: false });

    if (error) {
      console.error('Error al obtener asistencias del socio:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error en obtenerAsistenciasSocio:', err);
    return [];
  }
}
