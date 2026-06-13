"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export async function obtenerPlanes() {
  const { data, error } = await supabaseServer
    .from('planes')
    .select('id, nombre, precio, duracion_meses')
    .order('precio', { ascending: true });

  if (error) {
    console.error('Error al obtener planes:', error);
    return [];
  }
  return data;
}

export async function crearSocio(datosSocio: {
  nombre: string;
  apellido: string;
  email: string;
  fecha_nacimiento: string;
  dni: string;
  telefono: string;
  foto_url: string;
  plan_id: string;
}) {
  try {
    // Generar código QR único, usando un hash corto para que el QR no sea muy pesado
    // El DNI combinado con unos caracteres aleatorios funciona muy bien
    const codigoQr = `${datosSocio.dni}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

    // 1. Insertar el nuevo registro en la tabla socios
    const { data: nuevoSocio, error: socioError } = await supabaseServer
      .from('socios')
      .insert({
        nombre: datosSocio.nombre,
        apellido: datosSocio.apellido,
        email: datosSocio.email,
        fecha_nacimiento: datosSocio.fecha_nacimiento,
        dni: datosSocio.dni,
        telefono: datosSocio.telefono,
        foto_url: datosSocio.foto_url,
        codigo_qr: codigoQr,
      })
      .select('id')
      .single();

    if (socioError || !nuevoSocio) {
      console.error('Error insertando socio:', socioError);
      return { success: false, error: 'No se pudo crear el socio. Es probable que el DNI ya esté registrado.' };
    }

    // 2. Obtener la duración del plan seleccionado (meses), el precio y el nombre
    const { data: plan, error: planError } = await supabaseServer
      .from('planes')
      .select('duracion_meses, precio, nombre')
      .eq('id', datosSocio.plan_id)
      .single();

    if (planError || !plan) {
      console.error('Error obteniendo plan:', planError);
      return { success: false, error: 'No se pudo obtener la configuración del plan.' };
    }

    const meses = plan.duracion_meses || 1;
    
    // 3. Calcular fecha de inicio y fecha de fin (duración del plan)
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + meses);

    const formatISODate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 4. Insertar la membresía en estado activo
    const { data: nuevaMembresia, error: membresiaError } = await supabaseServer
      .from('membresias')
      .insert({
        socio_id: nuevoSocio.id,
        plan_id: datosSocio.plan_id,
        fecha_inicio: formatISODate(fechaInicio),
        fecha_fin: formatISODate(fechaFin),
        estado: 'activo'
      })
      .select('id')
      .single();

    if (membresiaError || !nuevaMembresia) {
      console.error('Error insertando membresía:', membresiaError);
      return { success: false, error: 'Socio registrado, pero ocurrió un error al asignar la membresía.' };
    }

    // 5. Insertar el pago inicial del plan
    const { error: pagoError } = await supabaseServer
      .from('pagos')
      .insert({
        socio_id: nuevoSocio.id,
        membresia_id: nuevaMembresia.id,
        monto: plan.precio || 0,
        metodo_pago: 'Efectivo',
        concepto: `Inscripción - Plan ${plan.nombre || ''}`,
        tipo: 'Plan',
        fecha_pago: new Date().toISOString()
      });

    if (pagoError) {
      console.error('Atención: El socio y la membresía se crearon pero el pago no se registró:', pagoError);
    }

    return { success: true, codigoQr, socioId: nuevoSocio.id };
  } catch (err: any) {
    console.error('Error interno en crearSocio:', err);
    return { success: false, error: err.message };
  }
}
