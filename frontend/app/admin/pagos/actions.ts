"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerHistorialPagos(filtros?: {
  busqueda?: string;
  metodoPago?: string;
  fechaInicio?: string;
  fechaFin?: string;
}) {
  try {
    let query = supabaseServer
      .from('pagos')
      .select(`
        *,
        socios (
          nombre,
          dni,
          telefono
        )
      `)
      .order('fecha_pago', { ascending: false });

    // Filtro por método de pago
    if (filtros?.metodoPago && filtros.metodoPago !== 'Todos') {
      query = query.eq('metodo_pago', filtros.metodoPago);
    }

    // Filtro por rango de fechas
    if (filtros?.fechaInicio) {
      // Inicio del día en UTC
      query = query.gte('fecha_pago', `${filtros.fechaInicio}T00:00:00.000Z`);
    }
    if (filtros?.fechaFin) {
      // Fin del día en UTC
      query = query.lte('fecha_pago', `${filtros.fechaFin}T23:59:59.999Z`);
    }

    // Filtro de búsqueda (nombre/DNI del socio)
    if (filtros?.busqueda) {
      const { data: sociosMatch, error: errMatch } = await supabaseServer
        .from('socios')
        .select('id')
        .or(`nombre.ilike.%${filtros.busqueda}%,dni.ilike.%${filtros.busqueda}%`);

      if (errMatch) {
        console.error('Error buscando socios para pagos:', errMatch);
        return [];
      }

      if (sociosMatch && sociosMatch.length > 0) {
        const socioIds = sociosMatch.map(s => s.id);
        query = query.in('socio_id', socioIds);
      } else {
        // No hay socios que coincidan
        return [];
      }
    }

    const { data: pagos, error } = await query;

    if (error) {
      console.error('Error al obtener historial de pagos:', error);
      return [];
    }

    return pagos || [];

  } catch (error) {
    console.error('Error interno en obtenerHistorialPagos:', error);
    return [];
  }
}

export async function obtenerSumaIngresosMes() {
  try {
    const hoyObj = new Date();
    const startOfMonth = new Date(hoyObj.getFullYear(), hoyObj.getMonth(), 1).toISOString();

    const { data, error } = await supabaseServer
      .from('pagos')
      .select('monto')
      .gte('fecha_pago', startOfMonth);

    if (error) {
      console.error('Error al obtener sumatoria de pagos del mes:', error);
      return 0;
    }

    const total = data ? data.reduce((sum, item) => sum + Number(item.monto), 0) : 0;
    return total;
  } catch (error) {
    console.error('Error interno en obtenerSumaIngresosMes:', error);
    return 0;
  }
}
