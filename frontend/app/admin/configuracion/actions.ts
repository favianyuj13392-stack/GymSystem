"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerConfiguraciones() {
  try {
    const { data, error } = await supabaseServer
      .from('configuraciones')
      .select('*');

    if (error) {
      console.warn('Error al obtener configuraciones (puede que la tabla no exista aún):', error);
      return {
        capacidadGlobal: 100,
        zonas: [
          { nombre: 'Sala Principal', capacidad: 60 },
          { nombre: 'Clases Grupales', capacidad: 25 },
          { nombre: 'Cardio', capacidad: 15 }
        ]
      };
    }

    const capacidadRow = data?.find(c => c.clave === 'capacidad_maxima_simultanea');
    const zonasRow = data?.find(c => c.clave === 'capacidad_zonas');

    const capacidadGlobal = capacidadRow ? Number(capacidadRow.valor) : 100;
    
    let zonas = [
      { nombre: 'Sala Principal', capacidad: 60 },
      { nombre: 'Clases Grupales', capacidad: 25 },
      { nombre: 'Cardio', capacidad: 15 }
    ];

    if (zonasRow && zonasRow.valor) {
      try {
        zonas = JSON.parse(zonasRow.valor);
      } catch (e) {
        console.error('Error al parsear capacidad_zonas:', e);
      }
    }

    return { capacidadGlobal, zonas };
  } catch (error) {
    console.error('Error fatal al obtener configuraciones:', error);
    return {
      capacidadGlobal: 100,
      zonas: [
        { nombre: 'Sala Principal', capacidad: 60 },
        { nombre: 'Clases Grupales', capacidad: 25 },
        { nombre: 'Cardio', capacidad: 15 }
      ]
    };
  }
}

export async function guardarConfiguraciones(capacidadGlobal: number, zonas: any[]) {
  try {
    // Intentar upsert de la capacidad global
    const { error: errGlobal } = await supabaseServer
      .from('configuraciones')
      .upsert(
        { clave: 'capacidad_maxima_simultanea', valor: String(capacidadGlobal), descripcion: 'Capacidad máxima simultánea recomendada para el gimnasio' },
        { onConflict: 'clave' }
      );

    if (errGlobal) {
      console.error('Error guardando capacidad global:', errGlobal);
      return { success: false, error: 'No se pudo guardar la capacidad global en la base de datos.' };
    }

    // Intentar upsert de la capacidad por zonas
    const { error: errZonas } = await supabaseServer
      .from('configuraciones')
      .upsert(
        { clave: 'capacidad_zonas', valor: JSON.stringify(zonas), descripcion: 'Subdivisión de capacidad por zonas' },
        { onConflict: 'clave' }
      );

    if (errZonas) {
      console.error('Error guardando capacidad por zonas:', errZonas);
      return { success: false, error: 'No se pudo guardar la configuración por zonas en la base de datos.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error fatal al guardar configuraciones:', error);
    return { success: false, error: error.message || 'Error interno del servidor.' };
  }
}
