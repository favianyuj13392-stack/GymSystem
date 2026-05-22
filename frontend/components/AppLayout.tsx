"use client"

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Excluir la barra lateral en el carnet digital
  const isPublicRoute = pathname?.startsWith('/socio/');

  if (isPublicRoute) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  const navItems = [
    { 
      name: 'Recepción', 
      href: '/recepcion/control', 
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-8v4h8v-4zm-6-6h.01M12 12h.01M16 12h.01M12 16h.01M16 16h.01M8 12h.01M8 16h.01M4 8h16M4 16h16M4 12h16m-2-8H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2z" /></svg>
      )
    },
    { 
      name: 'Nuevo Socio', 
      href: '/socios/nuevo', 
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
      )
    },
    { 
      name: 'Gestión', 
      href: '/admin/socios', 
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    { 
      name: 'Analíticas', 
      href: '/admin/analiticas', 
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      )
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 w-full overflow-hidden">
      
      {/* Sidebar para PC (Izquierda Fija) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 fixed inset-y-0 left-0 z-50">
        
        {/* Header/Logo */}
        <div className="h-20 flex items-center px-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="font-black text-xl text-white tracking-tight">GymControl</span>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          <div className="px-4 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Menú Principal</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </div>
                <span className={`font-semibold ${isActive ? 'text-blue-400' : ''}`}>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-slate-300">AD</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">Administrador</p>
              <p className="text-xs text-slate-500 truncate">Recepción Principal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Barra de Navegación Inferior (Mobile/Tablet) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center justify-between px-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 relative ${
                isActive ? 'text-blue-400' : 'hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-500 mx-auto w-8 shadow-[0_2px_8px_rgba(59,130,246,0.8)]"></div>
              )}
              <div className="mb-1">{item.icon}</div>
              <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Contenedor Principal (Donde van las páginas) */}
      <main className="flex-1 flex flex-col w-full lg:pl-64 pb-20 lg:pb-0 h-screen overflow-y-auto">
        <div className="flex-1 w-full relative">
          {children}
        </div>
      </main>

    </div>
  );
}
