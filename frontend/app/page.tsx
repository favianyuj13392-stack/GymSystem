import { createClient } from "@/utils/supabase/server";
import { cerrarSesion } from "@/app/login/actions";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DarkoSync - Gestión Inteligente de Gimnasios",
  description: "Optimiza la facturación, controla la asistencia en tiempo real y automatiza la retención de socios.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si está logueado, podemos opcionalmente consultar su rol para dirigirlo al lugar correcto
  let dashboardLink = "/login";
  if (user) {
    // Buscar su rol en la tabla empleados para decidir a dónde enviarlo
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
    <div className="min-h-screen w-full bg-[#020204] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/10 via-zinc-950 to-black text-slate-100 flex flex-col justify-between font-sans">
      
      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M3 12l-3 3m3-3l3 3" />
            </svg>
          </div>
          <span className="font-black text-xl text-white tracking-tight">
            Darko<span className="text-amber-500">Sync</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              <span className="hidden md:inline text-xs text-zinc-400 font-bold bg-zinc-900/60 px-4 py-2.5 rounded-xl border border-zinc-800">
                Sesión: <span className="text-white">{user.email}</span>
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
      <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 z-10 flex flex-col items-center text-center">
        
        {/* Badge de Lanzamiento */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black bg-amber-950/40 text-amber-400 border border-amber-900/30 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Software de Gestión Fitness Inteligente
        </div>

        {/* Titular Principal */}
        <h1 className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.15] max-w-4xl">
          El control total de tu gimnasio que{" "}
          <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
            cuida tu bolsillo
          </span>
        </h1>
        
        {/* Subtítulo vendedor */}
        <p className="max-w-2xl text-zinc-400 text-sm md:text-base mb-10 leading-relaxed font-medium">
          DarkoSync combina un control de accesos ágil por QR con un sistema de alertas proactivas para prevenir pérdidas de caja, automatizar los reclamos de pago y retener a tus socios antes de que abandonen.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            href={user ? dashboardLink : "/login"}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2"
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
            className="w-full sm:w-auto bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 px-8 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center"
          >
            Saber Más
          </a>
        </div>

        {/* Características Destacadas (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          
          {/* Card 1: Recepcion */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 hover:border-amber-900/20 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/50 text-amber-500 border border-amber-900/30 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 16.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V16.5zM16.5 13.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V13.5zM13.5 13.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V13.5zM16.5 16.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V16.5zM19.5 13.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V13.5zM19.5 16.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V16.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Recepción por QR</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Terminal de escaneo instantáneo para control de accesos. Validación de membresías activas al segundo con retroalimentación visual limpia.
            </p>
          </div>

          {/* Card 2: Churn alerts */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 hover:border-amber-900/20 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/50 text-amber-500 border border-amber-900/30 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Retención Activa</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Detección automática de socios inactivos hace más de 7 días. Generación de enlaces de contacto directo por WhatsApp para recuperarlos al instante.
            </p>
          </div>

          {/* Card 3: Cash Inconsistencies */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 hover:border-amber-900/20 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/50 text-amber-500 border border-amber-900/30 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Auditoría Financiera</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Detección automática de inconsistencias de cobros y discrepancias entre las membresías vigentes y los pagos registrados en caja.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-zinc-900/50 z-10 flex flex-col items-center justify-center gap-2">
        <p className="text-xs text-zinc-650 font-bold tracking-widest uppercase">
          DARKOSYNC • ENTERPRISE EDITION
        </p>
        <p className="text-[10px] text-zinc-700">
          © {new Date().getFullYear()} Todos los derechos reservados. Redirección oficial a{" "}
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
