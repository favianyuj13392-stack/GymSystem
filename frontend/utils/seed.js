const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 120 Nombres Completos Únicos Bolivianos para evitar repetidos
const nombresCompletos = [
  { nombre: 'Juan', apellido: 'Mamani' },
  { nombre: 'Maria', apellido: 'Quispe' },
  { nombre: 'Carlos', apellido: 'Condori' },
  { nombre: 'Claudia', apellido: 'Flores' },
  { nombre: 'Christian', apellido: 'Beltran' },
  { nombre: 'Adriana', apellido: 'Lanza' },
  { nombre: 'Mauricio', apellido: 'Camacho' },
  { nombre: 'Sofia', apellido: 'Siles' },
  { nombre: 'Rodrigo', apellido: 'Mendoza' },
  { nombre: 'Gabriela', apellido: 'Choque' },
  { nombre: 'Jose', apellido: 'Gutierrez' },
  { nombre: 'Ana', apellido: 'Vargas' },
  { nombre: 'Luis', apellido: 'Ortiz' },
  { nombre: 'Sandra', apellido: 'Apaza' },
  { nombre: 'Ramiro', apellido: 'Torrico' },
  { nombre: 'Paola', apellido: 'Romero' },
  { nombre: 'Daniel', apellido: 'Guzman' },
  { nombre: 'Patricia', apellido: 'Murillo' },
  { nombre: 'David', apellido: 'Cabrera' },
  { nombre: 'Natalia', apellido: 'Justiniano' },
  { nombre: 'Miguel', apellido: 'Pinto' },
  { nombre: 'Beatriz', apellido: 'Alarcon' },
  { nombre: 'Oscar', apellido: 'Paz' },
  { nombre: 'Vanessa', apellido: 'Loza' },
  { nombre: 'Hugo', apellido: 'Siles' },
  { nombre: 'Carla', apellido: 'Choque' },
  { nombre: 'Diego', apellido: 'Mamani' },
  { nombre: 'Lucia', apellido: 'Flores' },
  { nombre: 'Fernando', apellido: 'Vargas' },
  { nombre: 'Silvia', apellido: 'Mendoza' },
  { nombre: 'Gabriel', apellido: 'Lanza' },
  { nombre: 'Elizabeth', apellido: 'Condori' },
  { nombre: 'Ruben', apellido: 'Apaza' },
  { nombre: 'Monica', apellido: 'Camacho' },
  { nombre: 'Ivan', apellido: 'Romero' },
  { nombre: 'Roxana', apellido: 'Siles' },
  { nombre: 'Alejandro', apellido: 'Beltran' },
  { nombre: 'Teresa', apellido: 'Ortiz' },
  { nombre: 'Gonzalo', apellido: 'Torrico' },
  { nombre: 'Mirian', apellido: 'Guzman' },
  { nombre: 'Ronaldo', apellido: 'Quispe' },
  { nombre: 'Julia', apellido: 'Mamani' },
  { nombre: 'Eduardo', apellido: 'Flores' },
  { nombre: 'Gisela', apellido: 'Vargas' },
  { nombre: 'Marcelo', apellido: 'Mendoza' },
  { nombre: 'Liliana', apellido: 'Choque' },
  { nombre: 'Raul', apellido: 'Camacho' },
  { nombre: 'Yolanda', apellido: 'Siles' },
  { nombre: 'Walter', apellido: 'Beltran' },
  { nombre: 'Miriam', apellido: 'Lanza' },
  { nombre: 'Gustavo', apellido: 'Ortiz' },
  { nombre: 'Laura', apellido: 'Condori' },
  { nombre: 'Patricia', apellido: 'Miranda' },
  { nombre: 'Diego', apellido: 'Torrico' },
  { nombre: 'Daniela', apellido: 'Siles' },
  { nombre: 'Jorge', apellido: 'Romero' },
  { nombre: 'Camila', apellido: 'Guzmán' },
  { nombre: 'Santiago', apellido: 'Murillo' },
  { nombre: 'Natalia', apellido: 'Cabrera' },
  { nombre: 'Hugo', apellido: 'Justiniano' },
  { nombre: 'Valeria', apellido: 'Pinto' },
  { nombre: 'Javier', apellido: 'Alarcón' },
  { nombre: 'Andrea', apellido: 'Paz' },
  { nombre: 'Oscar', apellido: 'Loza' },
  { nombre: 'Sergio', apellido: 'Gutierrez' },
  { nombre: 'Veronica', apellido: 'Vargas' },
  { nombre: 'Alvaro', apellido: 'Ortiz' },
  { nombre: 'Jessica', apellido: 'Apaza' },
  { nombre: 'Nelson', apellido: 'Torrico' },
  { nombre: 'Diana', apellido: 'Romero' },
  { nombre: 'Fabian', apellido: 'Guzman' },
  { nombre: 'Lorena', apellido: 'Murillo' },
  { nombre: 'Mario', apellido: 'Cabrera' },
  { nombre: 'Cynthia', apellido: 'Justiniano' },
  { nombre: 'Felipe', apellido: 'Pinto' },
  { nombre: 'Alejandra', apellido: 'Alarcon' },
  { nombre: 'Renato', apellido: 'Paz' },
  { nombre: 'Stefany', apellido: 'Loza' },
  { nombre: 'Edgar', apellido: 'Siles' },
  { nombre: 'Tatiana', apellido: 'Choque' },
  { nombre: 'Rolando', apellido: 'Mamani' },
  { nombre: 'Elena', apellido: 'Flores' },
  { nombre: 'Victor', apellido: 'Vargas' },
  { nombre: 'Katia', apellido: 'Mendoza' },
  { nombre: 'Reynaldo', apellido: 'Choque' },
  { nombre: 'Marisol', apellido: 'Camacho' },
  { nombre: 'Adolfo', apellido: 'Siles' },
  { nombre: 'Norma', apellido: 'Beltran' },
  { nombre: 'Isabel', apellido: 'Lanza' },
  { nombre: 'Boris', apellido: 'Ortiz' },
  { nombre: 'Nelly', apellido: 'Condori' },
  { nombre: 'German', apellido: 'Apaza' },
  { nombre: 'Gladys', apellido: 'Miranda' },
  { nombre: 'Edwin', apellido: 'Torrico' },
  { nombre: 'Lourdes', apellido: 'Siles' },
  { nombre: 'Wilmer', apellido: 'Romero' },
  { nombre: 'Nancy', apellido: 'Guzmán' },
  { nombre: 'Johnny', apellido: 'Murillo' },
  { nombre: 'Janet', apellido: 'Cabrera' },
  { nombre: 'Rene', apellido: 'Justiniano' },
  { nombre: 'Clara', apellido: 'Pinto' },
  { nombre: 'Rudy', apellido: 'Alarcón' },
  { nombre: 'Paola', apellido: 'Paz' },
  { nombre: 'Franklin', apellido: 'Loza' },
  { nombre: 'Pabel', apellido: 'Gutierrez' },
  { nombre: 'Ericka', apellido: 'Vargas' },
  { nombre: 'Omar', apellido: 'Ortiz' },
  { nombre: 'Shirley', apellido: 'Apaza' },
  { nombre: 'Jaime', apellido: 'Torrico' },
  { nombre: 'Sonia', apellido: 'Romero' },
  { nombre: 'Willy', apellido: 'Guzman' },
  { nombre: 'Mirtha', apellido: 'Murillo' },
  { nombre: 'Percy', apellido: 'Cabrera' },
  { nombre: 'Eliana', apellido: 'Justiniano' },
  { nombre: 'Freddy', apellido: 'Pinto' },
  { nombre: 'Rosario', apellido: 'Alarcon' },
  { nombre: 'Julio', apellido: 'Paz' },
  { nombre: 'Carmen', apellido: 'Loza' },
  { nombre: 'Zulma', apellido: 'Siles' }
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const formatISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function seed() {
  try {
    console.log('Iniciando carga de datos reales y de alta densidad para la demo...');

    // 1. Limpieza de base de datos anterior
    console.log('Limpiando datos antiguos...');
    await supabase.from('asistencias').delete().gt('id', 0);
    await supabase.from('pagos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('membresias').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('socios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('planes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Insertar Planes de Membresía
    console.log('Insertando planes...');
    const { data: planes, error: errPlanes } = await supabase.from('planes').insert([
      {
        nombre: 'Plan Mensual Básico',
        precio: 250,
        duracion_meses: 1,
        duracion_dias: 30,
        descripcion: 'Acceso ilimitado a sala de pesas y cardio de Lunes a Sábado',
        limite_accesos: null,
        hora_inicio: '06:00:00',
        hora_fin: '22:30:00',
        servicios_extras: ['Pesas', 'Cardio'],
        activo: true
      },
      {
        nombre: 'Pase Diario',
        precio: 30,
        duracion_meses: 0,
        duracion_dias: 1,
        descripcion: 'Acceso por un único día a todas las instalaciones',
        limite_accesos: 1,
        hora_inicio: '08:00:00',
        hora_fin: '20:00:00',
        servicios_extras: [],
        activo: true
      },
      {
        nombre: 'Plan Anual VIP',
        precio: 2400,
        duracion_meses: 12,
        duracion_dias: 365,
        descripcion: 'Acceso total + clases grupales + sauna + entrenador personal',
        limite_accesos: null,
        hora_inicio: '06:00:00',
        hora_fin: '22:30:00',
        servicios_extras: ['Pesas', 'Cardio', 'Sauna', 'Clases Grupales', 'Entrenador'],
        activo: true
      },
      {
        nombre: 'Plan Mañanero',
        precio: 180,
        duracion_meses: 1,
        duracion_dias: 30,
        descripcion: 'Acceso restringido en horario matutino de Lunes a Viernes',
        limite_accesos: null,
        hora_inicio: '06:00:00',
        hora_fin: '12:00:00',
        servicios_extras: ['Pesas'],
        activo: true
      }
    ]).select();

    if (errPlanes) throw errPlanes;
    console.log('Planes insertados con éxito.');

    const planMensual = planes.find(p => p.nombre === 'Plan Mensual Básico');
    const planAnual = planes.find(p => p.nombre === 'Plan Anual VIP');
    const planDiario = planes.find(p => p.nombre === 'Pase Diario');
    const planManana = planes.find(p => p.nombre === 'Plan Mañanero');

    // 3. Crear 120 Socios únicos reales
    console.log('Insertando 120 socios con nombres 100% únicos...');
    const sociosData = [];
    const usedDnis = new Set();
    
    for (let i = 0; i < nombresCompletos.length; i++) {
      const pData = nombresCompletos[i];
      let dni = String(getRandomInt(6500000, 8999999));
      while (usedDnis.has(dni)) {
        dni = String(getRandomInt(6500000, 8999999));
      }
      usedDnis.add(dni);
      
      const telefono = String(getRandomInt(60000000, 79999999));
      const email = `${pData.nombre.toLowerCase()}.${pData.apellido.toLowerCase()}@gmail.com`;
      const fechaNac = `${getRandomInt(1980, 2005)}-${String(getRandomInt(1, 12)).padStart(2, '0')}-${String(getRandomInt(1, 28)).padStart(2, '0')}`;
      const codigoQr = `${dni}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
      
      sociosData.push({
        nombre: pData.nombre,
        apellido: pData.apellido,
        dni: dni,
        telefono: telefono,
        email: email,
        fecha_nacimiento: fechaNac,
        codigo_qr: codigoQr,
        activo: true
      });
    }

    const { data: socios, error: errSocios } = await supabase.from('socios').insert(sociosData).select();
    if (errSocios) throw errSocios;
    console.log(`Socios creados: ${socios.length}`);

    // 4. Crear Membresías y Pagos
    console.log('Insertando membresías y pagos...');
    const hoy = new Date();
    const activeSocios = [];

    for (let i = 0; i < socios.length; i++) {
      const socio = socios[i];
      let plan = planMensual;
      let startOffset = 0;
      let durationDays = 30;
      let status = 'activo';
      let paymentAmount = 250;
      let concept = 'Membresía - Plan Mensual Básico';
      let diff = 0;

      if (i < 80) {
        plan = planMensual;
        startOffset = -getRandomInt(5, 25);
        paymentAmount = 250;
      } else if (i >= 80 && i < 90) {
        plan = planAnual;
        startOffset = -getRandomInt(30, 120);
        durationDays = 365;
        paymentAmount = 2400;
        concept = 'Membresía - Plan Anual VIP';
      } else if (i >= 90 && i < 105) {
        plan = planMensual;
        startOffset = -getRandomInt(35, 55);
        status = 'vencido';
        paymentAmount = 250;
      } else if (i >= 105 && i < 110) {
        plan = planMensual;
        startOffset = -28;
        paymentAmount = 250;
      } else if (i >= 110 && i < 114) {
        plan = planMensual;
        startOffset = -getRandomInt(2, 10);
        paymentAmount = 200; // Inconsistencia!
        diff = 50;
      } else {
        plan = planMensual;
        startOffset = -getRandomInt(15, 25);
        paymentAmount = 250;
      }

      const fInicio = new Date(hoy);
      fInicio.setDate(fInicio.getDate() + startOffset);
      const fFin = new Date(fInicio);
      fFin.setDate(fFin.getDate() + durationDays);

      const { data: mem, error: errMem } = await supabase.from('membresias').insert({
        socio_id: socio.id,
        plan_id: plan.id,
        fecha_inicio: formatISODate(fInicio),
        fecha_fin: formatISODate(fFin),
        estado: status
      }).select().single();

      if (errMem) throw errMem;

      const fPago = new Date(fInicio);
      fPago.setHours(getRandomInt(8, 20), getRandomInt(0, 59), 0);

      const { error: errPago } = await supabase.from('pagos').insert({
        socio_id: socio.id,
        membresia_id: mem.id,
        monto: paymentAmount,
        metodo_pago: i % 3 === 0 ? 'Transferencia' : 'Efectivo',
        tipo: 'Plan',
        concepto: concept,
        fecha_pago: fPago.toISOString()
      });

      if (errPago) throw errPago;

      if (status === 'activo') {
        activeSocios.push({
          id: socio.id,
          fInicio,
          fFin,
          retencionRiesgo: i >= 114
        });
      }
    }
    console.log('Membresías y pagos creados.');

    // 5. Insertar Ventas Extras
    console.log('Insertando ventas de productos...');
    const productos = [
      { concepto: 'Venta de Botella de Agua 500ml', monto: 5 },
      { concepto: 'Venta de Toalla de Mano', monto: 25 },
      { concepto: 'Servicio de Preentreno Scoop', monto: 15 },
      { concepto: 'Venta de Bebida de Proteína', monto: 20 },
      { concepto: 'Venta de Pañuelos Desechables', monto: 2 },
      { concepto: 'Alquiler de Casillero Mensual', monto: 35 }
    ];

    for (let dayOffset = -28; dayOffset <= 0; dayOffset++) {
      if (Math.random() > 0.4) {
        const cantVentas = getRandomInt(1, 3);
        for (let v = 0; v < cantVentas; v++) {
          const prod = getRandomItem(productos);
          const fPago = new Date(hoy);
          fPago.setDate(fPago.getDate() + dayOffset);
          fPago.setHours(getRandomInt(9, 21), getRandomInt(0, 59), 0);

          await supabase.from('pagos').insert({
            monto: prod.monto,
            metodo_pago: Math.random() > 0.75 ? 'Transferencia' : 'Efectivo',
            tipo: 'Producto',
            concepto: prod.concepto,
            fecha_pago: fPago.toISOString()
          });
        }
      }
    }
    console.log('Ventas de productos creadas.');

    // 6. Generar Asistencias de Concurrencia Estructuradas por Bloques (Heatmap de Alta Concentración)
    console.log('Insertando historial de asistencias estructuradas en bloques de alta ocupación...');
    const asistenciasData = [];

    for (let dayOffset = -30; dayOffset <= 0; dayOffset++) {
      const currentDay = new Date(hoy);
      currentDay.setDate(currentDay.getDate() + dayOffset);
      const dayOfWeek = currentDay.getDay();

      if (dayOfWeek === 0) continue; // Domingo cerrado

      const isSabado = dayOfWeek === 6;

      // Iteramos sobre todos los bloques operativos (06:00 a 22:00)
      for (let hora = 6; hora <= 22; hora++) {
        for (const minuto of [0, 30]) {
          if (isSabado && hora >= 14) continue; // Sábado cerrado en la tarde

          let numVisitas = 0;

          if (isSabado) {
            // Sábados de mañana: ocupación intermedia constante
            if (hora >= 8 && hora <= 12) {
              numVisitas = getRandomInt(6, 11); // Promedio de 8.5 personas (Medio/Amarillo)
            } else {
              numVisitas = getRandomInt(1, 3);
            }
          } else {
            // Lunes a Viernes
            if ((hora === 7 && minuto === 30) || (hora === 8 && minuto === 0) || (hora === 8 && minuto === 30)) {
              // Pico de la Mañana -> 12 a 14 visitas por bloque de 30m (Ocupación 66%-78% -> AMARILLO)
              numVisitas = getRandomInt(12, 14);
            } else if ((hora === 18 && minuto === 30) || (hora === 19 && minuto === 0) || (hora === 19 && minuto === 30) || (hora === 20 && minuto === 0)) {
              // Pico de la Noche -> 15 a 18 visitas por bloque de 30m (Ocupación 83%-100% -> ROJO)
              numVisitas = getRandomInt(15, 18);
            } else if (hora >= 11 && hora <= 15) {
              // Horas valle de la tarde -> 0 o 1 visita (Ocupación baja -> VERDE)
              numVisitas = getRandomInt(0, 1);
            } else {
              // Horas moderadas -> 3 a 5 visitas (Ocupación moderada/baja -> VERDE)
              numVisitas = getRandomInt(2, 5);
            }
          }

          // Generar check-ins
          for (let v = 0; v < numVisitas; v++) {
            const sociosDisponibles = activeSocios.filter(s => {
              if (s.retencionRiesgo && dayOffset >= -10) {
                return false; // Alertas de retención no asisten los últimos 10 días
              }
              return currentDay >= s.fInicio && currentDay <= s.fFin;
            });

            if (sociosDisponibles.length === 0) continue;
            const socioElegido = getRandomItem(sociosDisponibles);

            // Minuto natural variado
            let minutoDetalle = minuto + getRandomInt(-10, 15);
            if (minutoDetalle < 0) minutoDetalle = 0;
            if (minutoDetalle > 59) minutoDetalle = 59;

            const year = currentDay.getFullYear();
            const month = currentDay.getMonth() + 1;
            const day = currentDay.getDate();
            
            const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hora).padStart(2, '0')}:${String(minutoDetalle).padStart(2, '0')}:00-04:00`;
            const registradoAt = new Date(dateString).toISOString();

            asistenciasData.push({
              socio_id: socioElegido.id,
              tipo: 'entrada',
              registrado_at: registradoAt
            });
          }
        }
      }
    }

    console.log(`Guardando un total de ${asistenciasData.length} asistencias estructuradas en Supabase...`);
    const batchSize = 100;
    for (let i = 0; i < asistenciasData.length; i += batchSize) {
      const batch = asistenciasData.slice(i, i + batchSize);
      const { error: errAst } = await supabase.from('asistencias').insert(batch);
      if (errAst) throw errAst;
    }

    // 7. Ajustar Capacidad Máxima a 18 en la base de datos (por si ya existe la tabla configuraciones)
    console.log('Intentando actualizar configuraciones de capacidad recomendada a 18...');
    try {
      const { error: errConfig } = await supabase.from('configuraciones')
        .upsert(
          { clave: 'capacidad_maxima_simultanea', valor: '18', descripcion: 'Capacidad máxima simultánea recomendada para el gimnasio' },
          { onConflict: 'clave' }
        );
      if (errConfig) {
        console.warn('Advertencia: No se pudo escribir en configuraciones. Se usará el fallback de código de 18.');
      } else {
        console.log('Configuraciones guardadas en base de datos (Capacidad = 18).');
      }
    } catch (configErr) {
      console.warn('Advertencia: La tabla configuraciones no existe aún. El sistema usará el fallback por código de 18.');
    }

    console.log('¡Población de base de datos finalizada exitosamente!');
    process.exit(0);

  } catch (err) {
    console.error('Error durante la población de la base de datos:', err);
    process.exit(1);
  }
}

seed();
