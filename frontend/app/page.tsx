import { createClient } from "@/utils/supabase/server";
import { cerrarSesion } from "@/app/login/actions";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GymControl - Portal de Acceso",
  description: "Portal de ingreso para el control de asistencia y administración del gimnasio.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen w-full bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/30 via-zinc-950 to-black text-slate-100 flex flex-col justify-between font-sans">
      
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-black text-xl text-white tracking-tight">
            Gym<span className="text-red-500">Control</span>
          </span>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-sm text-zinc-400 font-medium bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
                Sesión: <span className="text-zinc-200 font-bold">{user.email}</span>
              </span>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="bg-zinc-900 hover:bg-red-950/30 text-zinc-300 hover:text-red-400 border border-zinc-800 hover:border-red-900/30 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center flex-1 z-10 text-center">
        
        {/* Badge superior */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-red-950/40 text-red-400 border border-red-900/30 tracking-widest uppercase animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Sistema de Acceso GymControl
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
          Control de asistencia y{" "}
          <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
            retención inteligente
          </span>
        </h1>
        
        <p className="max-w-xl text-zinc-400 text-base md:text-lg mb-12 leading-relaxed">
          Portal centralizado para el personal administrativo y terminal de escaneo de accesos. Gestioná tu comunidad fitness de manera profesional.
        </p>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
          
          {/* Card 1: Recepcion */}
          <Link
            href="/recepcion/control"
            className="group bg-zinc-950/60 backdrop-blur-xl border border-zinc-900 hover:border-red-900/40 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(239,68,68,0.08)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-400 group-hover:text-red-400 group-hover:bg-red-950/30 flex items-center justify-center mb-6 transition-all duration-300 border border-zinc-800 group-hover:border-red-900/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-8v4h8v-4zm-6-6h.01M12 12h.01M16 12h.01M12 16h.01M16 16h.01M8 12h.01M8 16h.01M4 8h16M4 16h16M4 12h16m-2-8H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                Terminal de Recepción
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Escáner QR en tiempo real para el control de accesos de socios. Feedback visual inmediato de asistencia.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-red-500 group-hover:text-red-400 mt-auto">
              Iniciar Terminal
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 2: Administracion */}
          <Link
            href="/admin/socios"
            className="group bg-zinc-950/60 backdrop-blur-xl border border-zinc-900 hover:border-red-900/40 p-8 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(239,68,68,0.08)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-400 group-hover:text-red-400 group-hover:bg-red-950/30 flex items-center justify-center mb-6 transition-all duration-300 border border-zinc-800 group-hover:border-red-900/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                Panel de Administración
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Gestión de socios, cobros, renovación de membresías, alertas de WhatsApp y analíticas de concurrencia.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-red-500 group-hover:text-red-400 mt-auto">
              Acceder al Panel
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-zinc-900 z-10">
        <p className="text-xs text-zinc-600 font-medium">
          © {new Date().getFullYear()} GymControl. Todos los derechos reservados.
        </p>
      </footer>

    </div>
  );
}
