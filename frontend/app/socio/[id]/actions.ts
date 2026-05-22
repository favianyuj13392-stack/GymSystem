"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerDatosSocio(socioId: string) {
  try {
    const { data: socio, error } = await supabaseServer
      .from('socios')
      .select(`
        *,
        membresias (
          fecha_fin,
          estado,
          planes (nombre)
        )
      `)
      .eq('id', socioId)
      .single();

    if (error || !socio) {
      return { success: false, error: 'Socio no encontrado' };
    }

    // Ordenar membresías para obtener la más reciente
    const membresiasOrdenadas = (socio.membresias || []).sort((a: any, b: any) => {
      return new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime();
    });

    const membresiaActual = membresiasOrdenadas.length > 0 ? membresiasOrdenadas[0] : null;

    // Calcular estado
    const hoyObj = new Date();
    const hoyFormat = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth()+1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
    
    let estado = 'vencido';
    if (membresiaActual && membresiaActual.fecha_fin >= hoyFormat && membresiaActual.estado === 'activo') {
      estado = 'activo';
    }

    return {
      success: true,
      socio: {
        nombre: socio.nombre,
        dni: socio.dni,
        codigo_qr: socio.codigo_qr,
        foto_url: socio.foto_url,
      },
      membresia: membresiaActual,
      estado
    };
  } catch (error) {
    console.error('Error al cargar carnet:', error);
    return { success: false, error: 'Error interno' };
  }
}
