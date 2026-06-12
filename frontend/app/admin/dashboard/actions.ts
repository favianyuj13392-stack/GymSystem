"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerResumenDashboard() {
  try {
    const hoyObj = new Date();
    const hoyFormat = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
    const startOfMonth = new Date(hoyObj.getFullYear(), hoyObj.getMonth(), 1).toISOString();

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
        
        // Manejo seguro de metodo_pago por si la columna no existe o es nula
        const metodo = (pago.metodo_pago || 'Efectivo').toLowerCase();
        if (metodo === 'transferencia') {
          transferenciaTotal += monto;
        } else {
          efectivoTotal += monto;
        }
      });
    }

    // 4. Asistencias para tendencias (Horas y Días de la semana)
    const { data: asistencias, error: errAsistencias } = await supabaseServer
      .from('asistencias')
      .select('registrado_at')
      .eq('tipo', 'entrada');

    // Inicializar horas (6 AM a 10 PM es el rango útil)
    const horasOcupacion = Array(17).fill(0).map((_, i) => ({
      hora: i + 6,
      conteo: 0,
      label: `${String(i + 6).padStart(2, '0')}:00`
    }));

    // Inicializar días de la semana
    const diasSemana = [
      { dia: 1, nombre: 'Lun', conteo: 0 },
      { dia: 2, nombre: 'Mar', conteo: 0 },
      { dia: 3, nombre: 'Mié', conteo: 0 },
      { dia: 4, nombre: 'Jue', conteo: 0 },
      { dia: 5, nombre: 'Vie', conteo: 0 },
      { dia: 6, nombre: 'Sáb', conteo: 0 },
      { dia: 0, nombre: 'Dom', conteo: 0 }
    ];

    if (asistencias) {
      asistencias.forEach((ast) => {
        const fecha = new Date(ast.registrado_at);
        
        // Agrupar por hora
        const hora = fecha.getHours();
        const horaIndex = hora - 6;
        if (horaIndex >= 0 && horaIndex < horasOcupacion.length) {
          horasOcupacion[horaIndex].conteo += 1;
        }

        // Agrupar por día de la semana
        const dia = fecha.getDay(); // 0 (Dom) a 6 (Sáb)
        const diaObj = diasSemana.find(d => d.dia === dia);
        if (diaObj) {
          diaObj.conteo += 1;
        }
      });
    }

    // Ordenar días para que empiece por Lunes
    const diasOrdenados = [
      diasSemana[0], // Lun
      diasSemana[1], // Mar
      diasSemana[2], // Mié
      diasSemana[3], // Jue
      diasSemana[4], // Vie
      diasSemana[5], // Sáb
      diasSemana[6]  // Dom
    ];

    // --- NUEVAS ALERTAS DE NEGOCIO (IMPACTO DIRECTO EN EL BOLSILLO) ---
    
    // 1. Colección Proactiva: Vencimientos en los próximos 3 días
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

    // 2. Retención Inteligente: Socios activos sin asistencias en los últimos 7 días
    // Buscar todas las membresías activas hoy, incluyendo los datos del plan y del socio
    const { data: membresiasActivas, error: errMembresiasActivas } = await supabaseServer
      .from('membresias')
      .select('id, socio_id, plan_id, planes(nombre, precio), socios(id, nombre, dni, telefono)')
      .eq('estado', 'activo')
      .gte('fecha_fin', hoyFormat);

    const inactivos: any[] = [];
    const fugasCaja: any[] = [];

    if (membresiasActivas && membresiasActivas.length > 0) {
      // --- CÁLCULO DE RIESGO DE CHURN ---
      const sieteDiasAtras = new Date(hoyObj.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Obtener asistencias de los últimos 7 días
      const { data: asistenciasRecientes, error: errAsistenciasRecientes } = await supabaseServer
        .from('asistencias')
        .select('socio_id')
        .eq('tipo', 'entrada')
        .gte('registrado_at', sieteDiasAtras);

      const sociosConAsistencia = new Set((asistenciasRecientes || []).map((a: any) => a.socio_id));

      // Filtrar socios que NO asistieron en los últimos 7 días
      const sociosInactivosRaw = membresiasActivas.filter((m: any) => m.socios && !sociosConAsistencia.has(m.socio_id));

      // Buscar la última asistencia de estos socios inactivos para saber hace cuánto no vienen
      if (sociosInactivosRaw.length > 0) {
        const idsInactivos = sociosInactivosRaw.map((m: any) => m.socio_id);
        
        const { data: ultimasAsistencias, error: errUltimas } = await supabaseServer
          .from('asistencias')
          .select('socio_id, registrado_at')
          .eq('tipo', 'entrada')
          .in('socio_id', idsInactivos)
          .order('registrado_at', { ascending: false });

        // Mapear último check-in
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

      // --- CÁLCULO DE FUGAS DE CAJA (MEMBRESÍAS ACTIVAS SIN PAGO COMPLETO) ---
      const activeMemIds = membresiasActivas.map((m: any) => m.id);
      const { data: pagosActivos, error: errPagosActivos } = await supabaseServer
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
        horas: horasOcupacion,
        dias: diasOrdenados
      },
      alertas: {
        vencimientos: listaVencimientos.slice(0, 10), // Limit to top 10
        inactivos: inactivos.slice(0, 10), // Limit to top 10
        fugas: fugasCaja.slice(0, 10) // Limit to top 10
      }
    };

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return {
      metricas: { totalSocios: 0, sociosActivos: 0, sociosVencidos: 0, ingresosMes: 0 },
      metodosPago: { efectivo: 0, transferencia: 0 },
      tendencias: { horas: [], dias: [] },
      alertas: { vencimientos: [], inactivos: [], fugas: [] }
    };
  }
}
