"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerResumenMetricas() {
  try {
    const hoyObj = new Date();
    const hoyFormat = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth()+1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
    
    // 1. Total Socios Activos Hoy
    const { count: activosCount, error: errActivos } = await supabaseServer
      .from('membresias')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo')
      .gte('fecha_fin', hoyFormat);

    // 2. Ingresos del Mes
    const startOfMonth = new Date(hoyObj.getFullYear(), hoyObj.getMonth(), 1).toISOString();
    const { data: pagos, error: errPagos } = await supabaseServer
      .from('pagos')
      .select('monto')
      .gte('fecha_pago', startOfMonth);

    let ingresosMes = 0;
    if (pagos) {
      ingresosMes = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
    }

    // 3. Clientes en Riesgo (Cantidad)
    const clientesRiesgo = await obtenerClientesEnRiesgo();

    return {
      sociosActivos: activosCount || 0,
      ingresosMes,
      clientesAlerta: clientesRiesgo.length
    };
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    return { sociosActivos: 0, ingresosMes: 0, clientesAlerta: 0 };
  }
}

export async function obtenerClientesEnRiesgo() {
  try {
    const hoyObj = new Date();
    const hoyFormat = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth()+1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
    
    // Calcular la fecha límite de hace 30 días para no enviar mensajes a clientes perdidos hace meses
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const hace30DiasFormat = `${hace30Dias.getFullYear()}-${String(hace30Dias.getMonth()+1).padStart(2, '0')}-${String(hace30Dias.getDate()).padStart(2, '0')}`;

    // Obtenemos todos los socios con sus membresías recientes y asistencias (solo entradas)
    const { data: socios, error } = await supabaseServer
      .from('socios')
      .select(`
        id,
        nombre,
        telefono,
        foto_url,
        membresias (
          fecha_fin,
          estado
        ),
        asistencias (
          registrado_at,
          tipo
        )
      `);

    if (error || !socios) return [];

    const enRiesgo = [];

    for (const socio of socios) {
      // 1. Validar estado de membresía
      const membresias = (socio.membresias || []).sort((a: any, b: any) => 
        new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime()
      );
      const membresiaActual = membresias.length > 0 ? membresias[0] : null;

      if (!membresiaActual) continue;

      const estaVigente = membresiaActual.estado === 'activo' && membresiaActual.fecha_fin >= hoyFormat;
      const esRecientementeVencida = membresiaActual.fecha_fin >= hace30DiasFormat && membresiaActual.fecha_fin < hoyFormat;

      if (!estaVigente && !esRecientementeVencida) continue;

      // 2. Calcular última asistencia
      const entradas = (socio.asistencias || [])
        .filter((a: any) => a.tipo === 'entrada')
        .sort((a: any, b: any) => new Date(b.registrado_at).getTime() - new Date(a.registrado_at).getTime());

      let diasAusente = 0;
      
      if (entradas.length === 0) {
        // Si no tiene entradas registradas, asumimos alerta inicial
        diasAusente = 14; 
      } else {
        const ultimaEntrada = new Date(entradas[0].registrado_at);
        const diffTime = Math.abs(hoyObj.getTime() - ultimaEntrada.getTime());
        diasAusente = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Filtro de retención: mayor o igual a 14 días
      if (diasAusente >= 14) {
        enRiesgo.push({
          id: socio.id,
          nombre: socio.nombre,
          telefono: socio.telefono,
          foto_url: socio.foto_url,
          diasAusente,
          esVencido: !estaVigente
        });
      }
    }

    // Ordenar por los que llevan más días ausentes
    return enRiesgo.sort((a, b) => b.diasAusente - a.diasAusente);
  } catch (error) {
    console.error('Error calculando riesgo:', error);
    return [];
  }
}

export async function obtenerEstadisticasHorarios() {
  try {
    const { data: asistencias, error } = await supabaseServer
      .from('asistencias')
      .select('registrado_at')
      .eq('tipo', 'entrada');

    if (error || !asistencias) return [];

    // Inicializar arreglo de 24 horas
    const horarios = Array(24).fill(0).map((_, i) => ({
      hora: i,
      conteo: 0,
      label: `${String(i).padStart(2, '0')}:00`
    }));

    // Agrupar por hora
    for (const ast of asistencias) {
      const fecha = new Date(ast.registrado_at);
      const hora = fecha.getHours(); // 0-23
      horarios[hora].conteo += 1;
    }

    return horarios;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return [];
  }
}
