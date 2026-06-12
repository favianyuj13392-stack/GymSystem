import { createClient } from "@/utils/supabase/server";
import { cerrarSesion } from "@/app/login/actions";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DarkoGym - Control de Accesos y Finanzas de Gimnasios",
  description: "Optimiza la facturación, controla asistencia por QR y automatiza la retención de socios con el respaldo tecnológico de DarkoSync.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirección inteligente de panel según rol si está logueado
  let dashboardLink = "/login";
  if (user) {
    const { data: empleado } = await supabase
      .from("empleados")
      .select("rol")
      .eq("id", user.id)
      .single();
    
    if (empleado?.rol === "empleado") {
      dashboardLink = "/admin/socios";
    } else {
      dashboardLink = "/admin/dashboard";
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#020204] text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* Glowes de fondo decorativos premium (Amber/Obsidian blur effects) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-amber-500/10 to-transparent blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
      
      {/* Grid de fondo sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e05_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"></div>

      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-white tracking-tight leading-none">
              Darko<span className="text-amber-500">Gym</span>
            </span>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
              by DarkoSync
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              <span className="hidden md:inline text-xs text-zinc-400 font-bold bg-zinc-900/60 px-4 py-2.5 rounded-xl border border-zinc-800">
                Sesión activa: <span className="text-white">{user.email}</span>
              </span>
              <Link
                href={dashboardLink}
                className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10"
              >
                Panel de Control
              </Link>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Salir
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10"
            >
              Ingresar al Sistema
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-16 pb-12 md:pt-24 relative z-10 flex flex-col items-center text-center">
        
        {/* Badge de confianza e introducción */}
        <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black bg-amber-950/40 text-amber-400 border border-amber-900/30 tracking-widest uppercase shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Desarrollado por DarkoSync • Soluciones de Nivel Empresarial
        </div>

        {/* Titular Impactante */}
        <h1 className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.15] max-w-5xl">
          El sistema de gestión y control que{" "}
          <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
            cuida las finanzas
          </span>{" "}
          de tu gimnasio
        </h1>
        
        {/* Subtítulo enfocado al dolor de cabeza del cliente */}
        <p className="max-w-3xl text-zinc-400 text-sm md:text-base mb-10 leading-relaxed font-medium">
          Evitá la pérdida de dinero por errores en caja, controlá la asistencia al instante por QR con cualquier dispositivo y recuperá socios inactivos de forma proactiva con plantillas de contacto integradas.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto">
          <Link
            href={user ? dashboardLink : "/login"}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-95"
          >
            Comenzar Ahora
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <a
            href="https://mistyrose-otter-694958.hostingersite.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 px-8 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center active:scale-95"
          >
            Contactar Soporte
          </a>
        </div>

        {/* Pilares de Confianza / Estadísticas Reales de Impacto */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-5xl border-y border-zinc-900 py-10 mb-24">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-black text-amber-500 tracking-tight">-40%</p>
            <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Morosidad en Socios</p>
          </div>
          <div className="text-center border-l border-zinc-900">
            <p className="text-3xl md:text-4xl font-black text-white tracking-tight">99.9%</p>
            <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Uptime de Supabase</p>
          </div>
          <div className="text-center border-l border-zinc-900">
            <p className="text-3xl md:text-4xl font-black text-white tracking-tight">15 Min</p>
            <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Instalación Inicial</p>
          </div>
          <div className="text-center border-l border-zinc-900">
            <p className="text-3xl md:text-4xl font-black text-amber-500 tracking-tight">100%</p>
            <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Auditoría Antifraude</p>
          </div>
        </div>

      </section>

      {/* Sección 2: Módulos del Sistema e Información de Valor */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        <div className="text-center mb-16">
          <p className="text-xs text-amber-500 font-black tracking-widest uppercase mb-2">Diseño Inteligente</p>
          <h2 className="text-2xl md:text-4xl font-black text-white">Todo lo que tu Gimnasio necesita en una Plataforma</h2>
          <p className="text-zinc-500 text-sm mt-3 max-w-xl mx-auto">DarkoGym te proporciona herramientas críticas de administración que impactan directamente en tu caja diaria.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
          
          {/* Card 1: Recepcion */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/60 hover:border-amber-900/30 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-950/40 text-amber-500 border border-amber-900/30 flex items-center justify-center mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM17.25 12v1.5m0 0v1.5m0-1.5h1.5m-1.5 0h-1.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Recepción y Control QR</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Terminal de escaneo instantáneo para tabletas, celulares o PC. Valida al instante si la membresía del socio está vigente o requiere renovación.
              </p>
            </div>
            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-6">Cero Instalación Requerida</div>
          </div>

          {/* Card 2: Churn Prevention */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/60 hover:border-amber-900/30 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-950/40 text-amber-500 border border-amber-900/30 flex items-center justify-center mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Retención y Churn Risk</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                El sistema detecta automáticamente a los socios que llevan más de 7 días sin entrenar. Genera plantillas de contacto listas para mandar vía WhatsApp.
              </p>
            </div>
            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-6">Mensajes con 1 Solo Click</div>
          </div>

          {/* Card 3: Cash Audits */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/60 hover:border-amber-900/30 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-950/40 text-amber-500 border border-amber-900/30 flex items-center justify-center mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cruce de Membresía vs Pago</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Auditoría automatizada que detecta anomalías. Si se activa un plan en recepción pero el monto registrado en caja no coincide, te salta la alerta en el acto.
              </p>
            </div>
            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-6">Prevención de Pérdida Activa</div>
          </div>

        </div>

      </section>

      {/* Sección 3: Pilares de Seguridad y Estabilidad */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs text-amber-500 font-black tracking-widest uppercase mb-2">Seguridad Absoluta</p>
            <h2 className="text-3xl font-black text-white leading-tight">Respaldado por el motor de datos de Supabase</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mt-4">
              Desarrollado sobre la arquitectura de datos más moderna de la industria. Al usar tecnologías en la nube robustas como Postgres y Supabase Auth, DarkoGym garantiza que tu información financiera y los datos de tus socios estén protegidos con cifrado de grado bancario.
            </p>
            
            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Cifrado SSL de Extremo a Extremo</p>
                  <p className="text-zinc-500 text-[11px]">Toda la información viaja protegida y encriptada por canales seguros.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Privilegios y Roles Segregados</p>
                  <p className="text-zinc-500 text-[11px]">Los recepcionistas tienen bloqueado el acceso a analíticas, eliminación de socios y reportes de caja.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Copias de Seguridad Automáticas</p>
                  <p className="text-zinc-500 text-[11px]">Tu información se resguarda diariamente en servidores redundantes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen de fondo premium o maqueta sutil */}
          <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl h-80 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Base de Datos Protegida</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">ONLINE</span>
              </div>
              <h3 className="text-xl font-bold text-white">Integración Inmediata con Supabase</h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                Sin configuraciones de red complejas ni bases de datos locales vulnerables a cortes de luz o robos de equipamiento físico.
              </p>
            </div>
            
            <div className="text-zinc-600 text-xs font-mono select-none">
              $ select rol, count(*) from empleados group by rol;
              <br />
              &gt; admin: 1 | empleado: 3
            </div>
          </div>
        </div>
      </section>

      {/* Sección 4: FAQ (Preguntas Frecuentes) - Genera confianza */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20 relative z-10 border-t border-zinc-900">
        <div className="text-center mb-12">
          <p className="text-xs text-amber-500 font-black tracking-widest uppercase mb-2">FAQ</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">Preguntas Frecuentes</h2>
          <p className="text-zinc-500 text-xs mt-2">Todo lo que necesitás saber sobre la plataforma.</p>
        </div>

        <div className="space-y-4">
          
          <details className="group border-b border-zinc-900 py-5">
            <summary className="flex justify-between items-center font-bold text-sm md:text-base text-white cursor-pointer list-none select-none">
              <span>¿Cómo funciona el escaneo de accesos por QR?</span>
              <span className="transition-transform group-open:rotate-180 text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </summary>
            <p className="mt-4 text-zinc-400 text-xs md:text-sm leading-relaxed">
              El sistema utiliza la cámara integrada o webcam de cualquier dispositivo conectado en recepción (tablet, celular o PC). El socio muestra su código QR digital y el sistema verifica su estado al instante en la base de datos de Supabase.
            </p>
          </details>

          <details className="group border-b border-zinc-900 py-5">
            <summary className="flex justify-between items-center font-bold text-sm md:text-base text-white cursor-pointer list-none select-none">
              <span>¿Qué necesito para empezar a operar en el gimnasio?</span>
              <span className="transition-transform group-open:rotate-180 text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </summary>
            <p className="mt-4 text-zinc-400 text-xs md:text-sm leading-relaxed">
              Solo un navegador web moderno y conexión a internet. Al ser un desarrollo en la nube de DarkoSync, no requerís servidores locales ni contratar costosas licencias de instalación física.
            </p>
          </details>

          <details className="group border-b border-zinc-900 py-5">
            <summary className="flex justify-between items-center font-bold text-sm md:text-base text-white cursor-pointer list-none select-none">
              <span>¿Cómo detecta el sistema las inconsistencias de caja?</span>
              <span className="transition-transform group-open:rotate-180 text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </summary>
            <p className="mt-4 text-zinc-400 text-xs md:text-sm leading-relaxed">
              Cruzamos de forma lógica y automática los montos cobrados en la tabla de pagos con el precio establecido del plan que se le activó al socio en su membresía vigente. Si hay un desfase (ej. se activa un plan de 200 Bs pero se registra un pago de 150 Bs), el sistema genera una alerta roja de fuga en tu panel de control.
            </p>
          </details>

          <details className="group border-b border-zinc-900 py-5">
            <summary className="flex justify-between items-center font-bold text-sm md:text-base text-white cursor-pointer list-none select-none">
              <span>¿Cómo se manejan los recordatorios de WhatsApp?</span>
              <span className="transition-transform group-open:rotate-180 text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </summary>
            <p className="mt-4 text-zinc-400 text-xs md:text-sm leading-relaxed">
              El panel genera accesos directos de WhatsApp en un click. Conectamos con la API web oficial del servicio para abrir una conversación pre-redactada con el mensaje correcto (cobros o alertas de inactividad) formateando automáticamente el código de país.
            </p>
          </details>

        </div>
      </section>

      {/* Sección 5: Tarjeta de Llamado a la Acción (CTA) Final */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 relative z-10">
        <div className="bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Llevá la administración de tu gimnasio al siguiente nivel
          </h2>
          <p className="max-w-xl text-zinc-400 text-xs md:text-sm mx-auto mb-10 leading-relaxed font-medium">
            Registrate hoy y comenzá a optimizar tus flujos de recepción, auditar tus cobros en efectivo y fidelizar a tu comunidad de socios con el soporte de DarkoSync.
          </p>

          <Link
            href={user ? dashboardLink : "/login"}
            className="w-full sm:w-auto inline-flex bg-amber-500 hover:bg-amber-600 text-black px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-amber-500/15 items-center justify-center gap-2 active:scale-95"
          >
            Acceder al Panel
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-12 border-t border-zinc-900 z-10 flex flex-col items-center justify-center gap-2 relative">
        <p className="text-[10px] text-zinc-750 font-bold tracking-widest uppercase">
          DARKOGYM • DESARROLLADO POR DARKOSYNC
        </p>
        <p className="text-[10px] text-zinc-600">
          © {new Date().getFullYear()} Todos los derechos reservados. Redirección oficial de soporte técnico a{" "}
          <a
            href="https://mistyrose-otter-694958.hostingersite.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500/80 hover:text-amber-500 hover:underline"
          >
            DarkoSync Web
          </a>
        </p>
      </footer>

    </div>
  );
}
