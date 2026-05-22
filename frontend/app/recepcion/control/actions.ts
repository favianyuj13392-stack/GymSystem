"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function procesarAcceso(codigoQr: string) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(codigoQr);

    const matchColumn = isUuid ? 'id' : 'codigo_qr';

    // 1. Buscar en la tabla socios
    const { data: socio, error: socioError } = await supabaseServer
      .from('socios')
      .select('*')
      .eq(matchColumn, codigoQr)
      .single();

    if (socioError || !socio) {
      if (isUuid && socioError) {
        const { data: socioRetry, error: retryError } = await supabaseServer
          .from('socios')
          .select('*')
          .eq('codigo_qr', codigoQr)
          .single();
        if (retryError || !socioRetry) {
          return { status: 'no_registrado' };
        }
        return await procesarMembresia(socioRetry);
      }
      return { status: 'no_registrado' };
    }

    return await procesarMembresia(socio);

  } catch (error) {
    console.error('Error procesando acceso:', error);
    return { status: 'error', message: 'Error interno del servidor.' };
  }
}

async function procesarMembresia(socio: any) {
  // 2. Buscar su membresía más reciente
  const { data: membresias, error: membresiaError } = await supabaseServer
    .from('membresias')
    .select('*, planes(nombre)')
    .eq('socio_id', socio.id)
    .order('fecha_fin', { ascending: false })
    .limit(1);

  if (membresiaError || !membresias || membresias.length === 0) {
    return { status: 'vencido', socio, membresia: null };
  }

  const membresia = membresias[0];

  // 3. Validar la fecha_fin contra la fecha actual
  const hoyObj = new Date();
  const hoyFormat = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth()+1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;

  if (membresia.fecha_fin < hoyFormat || membresia.estado !== 'activo') {
    return { status: 'vencido', socio, membresia };
  }

  // 4. Si está vigente, registrar la entrada
  const { error: insertError } = await supabaseServer
    .from('asistencias')
    .insert({
      socio_id: socio.id,
      tipo: 'entrada'
    });

  if (insertError) {
    console.error('Error al registrar asistencia:', insertError);
  }

  return { status: 'concedido', socio, membresia };
}

export async function obtenerSociosActivosEnGym() {
  try {
    const hoyObj = new Date();
    // Establecer la hora a medianoche (inicio del día)
    const startOfDay = new Date(hoyObj.getFullYear(), hoyObj.getMonth(), hoyObj.getDate()).toISOString();

    // Obtenemos todas las asistencias de hoy junto a la info del socio
    const { data: asistencias, error } = await supabaseServer
      .from('asistencias')
      .select('*, socios(id, nombre, foto_url, dni)')
      .gte('registrado_at', startOfDay)
      .order('registrado_at', { ascending: false });

    if (error || !asistencias) {
      console.error('Error obteniendo socios activos:', error);
      return [];
    }

    // Agrupar por socio para encontrar su último estado hoy
    const ultimosEstados = new Map<string, any>();
    
    for (const ast of asistencias) {
      if (!ultimosEstados.has(ast.socio_id)) {
        ultimosEstados.set(ast.socio_id, ast);
      }
    }

    // Filtrar los que su último estado es 'entrada'
    const activos = Array.from(ultimosEstados.values())
      .filter(ast => ast.tipo === 'entrada')
      .map(ast => ({
        id: ast.socios.id,
        nombre: ast.socios.nombre,
        foto_url: ast.socios.foto_url,
        dni: ast.socios.dni,
        horaEntrada: ast.registrado_at
      }));

    return activos;
  } catch (error) {
    console.error('Error fatal al obtener activos:', error);
    return [];
  }
}

export async function registrarSalida(socioId: string) {
  try {
    const { error } = await supabaseServer
      .from('asistencias')
      .insert({
        socio_id: socioId,
        tipo: 'salida'
      });

    if (error) {
      console.error('Error al registrar salida:', error);
      return { success: false, error: 'No se pudo registrar la salida' };
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
