"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerResumenDashboard(rango: 'mensual' | 'trimestral' | 'semestral' | 'anual' = 'mensual') {
  try {
    const hoyObj = new Date();
    const hoyFormat = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
    const startOfMonth = new Date(Date.UTC(hoyObj.getUTCFullYear(), hoyObj.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();

    // 1. Total Socios (activos en el sistema)
    const { count: totalSocios, error: errTotal } = await supabaseServer
      .from('socios')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true);

    // 2. Socios Activos (con membresía vigente)
    const { count: activosCount, error: errActivos } = await supabaseServer
      .from('membresias')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'activo')
      .gte('fecha_fin', hoyFormat);

    const total = totalSocios || 0;
    const activos = activosCount || 0;
    const vencidos = Math.max(0, total - activos);

    // 3. Pagos del Mes actual
    const { data: pagos, error: errPagos } = await supabaseServer
      .from('pagos')
      .select('monto, metodo_pago, fecha_pago')
      .gte('fecha_pago', startOfMonth);

    let ingresosMes = 0;
    let efectivoTotal = 0;
    let transferenciaTotal = 0;

    if (pagos) {
      pagos.forEach((pago) => {
        const monto = Number(pago.monto) || 0;
        ingresosMes += monto;
        
        const metodo = (pago.metodo_pago || 'Efectivo').toLowerCase();
        if (metodo === 'transferencia') {
          transferenciaTotal += monto;
        } else {
          efectivoTotal += monto;
        }
      });
    }

    // 4. Concurrencia y tendencias (Filtrado por rango temporal)
    const limitDate = new Date();
    if (rango === 'trimestral') {
      limitDate.setDate(limitDate.getDate() - 90);
    } else if (rango === 'semestral') {
      limitDate.setDate(limitDate.getDate() - 180);
    } else if (rango === 'anual') {
      limitDate.setDate(limitDate.getDate() - 365);
    } else { // mensual por defecto
      limitDate.setDate(limitDate.getDate() - 30);
    }
    const limitStr = limitDate.toISOString();

    let asistencias: { registrado_at: string }[] = [];
    let from = 0;
    let to = 999;
    let hasMore = true;
    while (hasMore) {
      const { data: batch, error: errBatch } = await supabaseServer
        .from('asistencias')
        .select('registrado_at')
        .eq('tipo', 'entrada')
        .gte('registrado_at', limitStr)
        .range(from, to);
      
      if (errBatch) {
        console.error('Error al paginar asistencias:', errBatch);
        break;
      }
      
      if (batch && batch.length > 0) {
        asistencias = [...asistencias, ...batch];
        if (batch.length < 1000) {
          hasMore = false;
        } else {
          from += 1000;
          to += 1000;
        }
      } else {
        hasMore = false;
      }
    }

    // Obtener la capacidad máxima simultánea recomendada del gimnasio de configuraciones
    let capacidadMax = 18; // Fallback de 18 para que el mapa de calor de la demo tenga colores vistosos
    try {
      const { data: config } = await supabaseServer
        .from('configuraciones')
        .select('valor')
        .eq('clave', 'capacidad_maxima_simultanea')
        .single();
      if (config && config.valor) {
        capacidadMax = Number(config.valor) || 18;
      }
    } catch (err) {
      console.warn('Advertencia al consultar capacidad máxima (usando 18 por defecto):', err);
    }

    const jsDayToIdx = [6, 0, 1, 2, 3, 4, 5]; // 0=Dom -> 6, 1=Lun -> 0...
    const blockLabels: string[] = [];
    for (let h = 6; h <= 22; h++) {
      const hourStr = String(h).padStart(2, '0');
      blockLabels.push(`${hourStr}:00`);
      blockLabels.push(`${hourStr}:30`);
    }

    const diasSemanaNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Inicializar matriz 7x34
    const grid = Array(7).fill(0).map(() => Array(34).fill(0));

    // Función auxiliar para hallar el bloque de 30min en hora local boliviana
    const getBlockIndex = (date: Date) => {
      const formatter = new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const formatted = formatter.format(date);
      const [hStr, mStr] = formatted.split(':');
      const h = Number(hStr);
      const m = Number(mStr);
      
      if (h < 6 || h > 22 || (h === 22 && m > 30)) {
        return -1;
      }
      const base = (h - 6) * 2;
      const offset = m >= 30 ? 1 : 0;
      return base + offset;
    };

    if (asistencias) {
      asistencias.forEach((ast: any) => {
        const fecha = new Date(ast.registrado_at);
        const dayIdx = jsDayToIdx[fecha.getDay()];
        const blockIdx = getBlockIndex(fecha);
        if (blockIdx >= 0 && blockIdx < 34) {
          grid[dayIdx][blockIdx]++;
        }
      });
    }

    // Contar las ocurrencias de cada día de la semana en el rango temporal seleccionado
    const countWeekdays = Array(7).fill(0);
    let tempDate = new Date(limitDate);
    const end = new Date();
    while (tempDate <= end) {
      const day = tempDate.getDay();
      const idx = jsDayToIdx[day];
      countWeekdays[idx]++;
      tempDate.setDate(tempDate.getDate() + 1);
    }
    const divisors = countWeekdays.map(c => c || 1);

    // Mapear los datos de concurrencia promediada
    const heatmap: any[] = [];
    for (let d = 0; d < 7; d++) {
      for (let b = 0; b < 34; b++) {
        const totalVisits = grid[d][b];
        const avgVisits = totalVisits / divisors[d];
        const occupancy = (avgVisits / capacidadMax) * 100;
        
        let colorZone: 'verde' | 'amarillo' | 'rojo' = 'verde';
        if (occupancy >= 86) {
          colorZone = 'rojo';
        } else if (occupancy >= 66) {
          colorZone = 'amarillo';
        }

        heatmap.push({
          dia: d,
          diaNombre: diasSemanaNombres[d],
          bloque: b,
          bloqueLabel: blockLabels[b],
          avgVisits: Math.round(avgVisits * 10) / 10,
          occupancy: Math.round(occupancy * 10) / 10,
          colorZone
        });
      }
    }

    // --- CÁLCULO DE KPIS PREDICTIVOS ---
    let minDay = 0, minBlock = 18;
    let maxDay = 0, maxBlock = 26;
    
    let minVal = 999999;
    let maxVal = -1;

    for (let d = 0; d < 7; d++) {
      for (let b = 0; b < 34; b++) {
        const totalVisits = grid[d][b];
        const avgVisits = totalVisits / divisors[d];
        
        if (avgVisits < minVal) {
          minVal = avgVisits;
          minDay = d;
          minBlock = b;
        }
        if (avgVisits > maxVal) {
          maxVal = avgVisits;
          maxDay = d;
          maxBlock = b;
        }
      }
    }

    // Algoritmo de unificación de bloques continuos para Oportunidad (Vacío)
    // Se expande hacia bloques adyacentes si la ocupación es < 20%
    let minStart = minBlock;
    let minEnd = minBlock;

    while (minStart > 0) {
      const prevBlock = minStart - 1;
      const prevAvg = grid[minDay][prevBlock] / divisors[minDay];
      const prevOccupancy = (prevAvg / capacidadMax) * 100;
      if (prevOccupancy < 20) {
        minStart = prevBlock;
      } else {
        break;
      }
    }
    while (minEnd < 33) {
      const nextBlock = minEnd + 1;
      const nextAvg = grid[minDay][nextBlock] / divisors[minDay];
      const nextOccupancy = (nextAvg / capacidadMax) * 100;
      if (nextOccupancy < 20) {
        minEnd = nextBlock;
      } else {
        break;
      }
    }

    // Algoritmo de unificación de bloques continuos para Saturación (Crítico)
    // Se expande hacia bloques adyacentes si la ocupación es > 65%
    let maxStart = maxBlock;
    let maxEnd = maxBlock;

    while (maxStart > 0) {
      const prevBlock = maxStart - 1;
      const prevAvg = grid[maxDay][prevBlock] / divisors[maxDay];
      const prevOccupancy = (prevAvg / capacidadMax) * 100;
      if (prevOccupancy > 65) {
        maxStart = prevBlock;
      } else {
        break;
      }
    }
    while (maxEnd < 33) {
      const nextBlock = maxEnd + 1;
      const nextAvg = grid[maxDay][nextBlock] / divisors[maxDay];
      const nextOccupancy = (nextAvg / capacidadMax) * 100;
      if (nextOccupancy > 65) {
        maxEnd = nextBlock;
      } else {
        break;
      }
    }

    const formatTimeRange = (startIdx: number, endIdx: number) => {
      const formatLabel = (idx: number) => {
        if (idx === 34) return '23:00';
        return blockLabels[idx];
      };
      return `${formatLabel(startIdx)} a ${formatLabel(endIdx + 1)}`;
    };

    const oportunidadText = `${diasSemanaNombres[minDay]} de ${formatTimeRange(minStart, minEnd)}`;
    const saturacionText = `${diasSemanaNombres[maxDay]} de ${formatTimeRange(maxStart, maxEnd)}`;

    // Top 3 de días más concurrentes
    const daySums = Array(7).fill(0);
    heatmap.forEach(h => {
      daySums[h.dia] += h.avgVisits;
    });
    const totalDayVisits = daySums.reduce((acc, v) => acc + v, 0);
    const dayPercentages = daySums.map((sum, d) => ({
      diaNombre: diasSemanaNombres[d],
      percent: totalDayVisits > 0 ? Math.round((sum / totalDayVisits) * 100) : 0
    }));
    dayPercentages.sort((a, b) => b.percent - a.percent);
    const topDiasText = dayPercentages.slice(0, 3).map((d, i) => `${i + 1}. ${d.diaNombre} ${d.percent}%`).join(' | ');

    // --- NUEVAS ALERTAS DE NEGOCIO ---
    const tresDiasSiguientes = new Date(hoyObj.getTime() + 3 * 24 * 60 * 60 * 1000);
    const tresDiasFormat = `${tresDiasSiguientes.getFullYear()}-${String(tresDiasSiguientes.getMonth() + 1).padStart(2, '0')}-${String(tresDiasSiguientes.getDate()).padStart(2, '0')}`;

    const { data: vencimientosProximos, error: errVencimientos } = await supabaseServer
      .from('membresias')
      .select('fecha_fin, socios(id, nombre, dni, telefono)')
      .eq('estado', 'activo')
      .gte('fecha_fin', hoyFormat)
      .lte('fecha_fin', tresDiasFormat);

    const listaVencimientos = (vencimientosProximos || []).map((m: any) => ({
      socioId: m.socios?.id,
      nombre: m.socios?.nombre || 'Socio Desconocido',
      dni: m.socios?.dni,
      telefono: m.socios?.telefono || '',
      fechaFin: m.fecha_fin
    }));

    const { data: membresiasActivas, error: errMembresiasActivas } = await supabaseServer
      .from('membresias')
      .select('id, socio_id, plan_id, planes(nombre, precio), socios(id, nombre, dni, telefono)')
      .eq('estado', 'activo')
      .gte('fecha_fin', hoyFormat);

    const inactivos: any[] = [];
    const fugasCaja: any[] = [];

    if (membresiasActivas && membresiasActivas.length > 0) {
      const sieteDiasAtras = new Date(hoyObj.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: asistenciasRecientes, error: errAsistenciasRecientes } = await supabaseServer
        .from('asistencias')
        .select('socio_id')
        .eq('tipo', 'entrada')
        .gte('registrado_at', sieteDiasAtras);

      const sociosConAsistencia = new Set((asistenciasRecientes || []).map((a: any) => a.socio_id));
      const sociosInactivosRaw = membresiasActivas.filter((m: any) => m.socios && !sociosConAsistencia.has(m.socio_id));

      if (sociosInactivosRaw.length > 0) {
        const idsInactivos = sociosInactivosRaw.map((m: any) => m.socio_id);
        const { data: ultimasAsistencias } = await supabaseServer
          .from('asistencias')
          .select('socio_id, registrado_at')
          .eq('tipo', 'entrada')
          .in('socio_id', idsInactivos)
          .order('registrado_at', { ascending: false });

        const mapaUltimaAsistencia = new Map<string, string>();
        if (ultimasAsistencias) {
          ultimasAsistencias.forEach((ast: any) => {
            if (!mapaUltimaAsistencia.has(ast.socio_id)) {
              mapaUltimaAsistencia.set(ast.socio_id, ast.registrado_at);
            }
          });
        }

        sociosInactivosRaw.forEach((m: any) => {
          const ultimaFecha = mapaUltimaAsistencia.get(m.socio_id);
          inactivos.push({
            socioId: m.socios.id,
            nombre: m.socios.nombre,
            dni: m.socios.dni,
            telefono: m.socios.telefono || '',
            ultimaAsistencia: ultimaFecha ? new Date(ultimaFecha).toLocaleDateString('es-ES') : 'Nunca asistió'
          });
        });
      }

      const activeMemIds = membresiasActivas.map((m: any) => m.id);
      const { data: pagosActivos } = await supabaseServer
        .from('pagos')
        .select('membresia_id, monto')
        .in('membresia_id', activeMemIds);

      const mapaPagos = new Map<string, number>();
      if (pagosActivos) {
        pagosActivos.forEach((p: any) => {
          const totalPago = mapaPagos.get(p.membresia_id) || 0;
          mapaPagos.set(p.membresia_id, totalPago + Number(p.monto));
        });
      }

      membresiasActivas.forEach((m: any) => {
        const pagado = mapaPagos.get(m.id) || 0;
        const precioPlan = Number(m.planes?.precio) || 0;
        if (pagado < precioPlan) {
          fugasCaja.push({
            socioId: m.socios?.id,
            nombre: m.socios?.nombre || 'Socio Desconocido',
            dni: m.socios?.dni,
            telefono: m.socios?.telefono || '',
            planNombre: m.planes?.nombre || 'Plan Desconocido',
            precioPlan,
            pagado,
            diferencia: precioPlan - pagado
          });
        }
      });
    }

    return {
      metricas: {
        totalSocios: total,
        sociosActivos: activos,
        sociosVencidos: vencidos,
        ingresosMes
      },
      metodosPago: {
        efectivo: efectivoTotal,
        transferencia: transferenciaTotal
      },
      tendencias: {
        heatmap,
        kpis: {
          oportunidad: oportunidadText,
          saturacion: saturacionText,
          topDias: topDiasText
        }
      },
      alertas: {
        vencimientos: listaVencimientos.slice(0, 10),
        inactivos: inactivos.slice(0, 10),
        fugas: fugasCaja.slice(0, 10)
      }
    };

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return {
      metricas: { totalSocios: 0, sociosActivos: 0, sociosVencidos: 0, ingresosMes: 0 },
      metodosPago: { efectivo: 0, transferencia: 0 },
      tendencias: { heatmap: [], kpis: { oportunidad: '', saturacion: '', topDias: '' } },
      alertas: { vencimientos: [], inactivos: [], fugas: [] }
    };
  }
}
