"use client"

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cerrarSesion } from '@/app/login/actions';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<'admin' | 'empleado'>('empleado');
  const [userName, setUserName] = useState<string>('Cargando...');
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Excluir la barra lateral en el carnet digital, landing page y pantalla de login
  const isPublicRoute = pathname?.startsWith('/socio/') || pathname === '/login' || pathname === '/';

  useEffect(() => {
    const supabase = createClient();
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          // Default user name from metadata or email prefix
          const defaultName = user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario';
          setUserName(defaultName);
          
          // Safe query to empleados table
          const { data, error } = await supabase
            .from('empleados')
            .select('rol, nombre')
            .eq('id', user.id)
            .single();
            
          if (data) {
            if (data.rol === 'admin' || data.rol === 'empleado') {
              setRole(data.rol);
            }
            if (data.nombre) {
              setUserName(data.nombre);
            }
          } else {
            // Safe fallback if not found
            setRole('empleado');
          }
        }
      } catch (err) {
        console.error('Error fetching user role, falling back to empleado:', err);
        setRole('empleado'); // fallback to empleado
      }
    }
    
    if (!isPublicRoute) {
      fetchUserRole();
    }
  }, [isPublicRoute]);

  if (isPublicRoute) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  const allNavItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      ),
      adminOnly: true
    },
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
      name: 'Pagos',
      href: '/admin/pagos',
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      adminOnly: true
    },
    {
      name: 'Empleados',
      href: '/admin/empleados',
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ),
      adminOnly: true
    },
    { 
      name: 'Analíticas', 
      href: '/admin/analiticas', 
      icon: (
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      ),
      adminOnly: true
    },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || role === 'admin');

  return (
    <div className="flex min-h-screen bg-slate-50 w-full overflow-hidden">
      
      {/* Sidebar para PC (Izquierda Fija) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 fixed inset-y-0 left-0 z-50">
        
        {/* Header/Logo */}
        <div className="h-20 flex items-center px-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="font-black text-xl text-white tracking-tight">DarkoGym</span>
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
                    ? 'bg-amber-500/10 text-amber-500' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </div>
                <span className={`font-semibold ${isActive ? 'text-amber-500' : ''}`}>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-6 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-slate-300">
                {userName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-[11px] text-slate-500 truncate">{userEmail || 'cargando...'}</p>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">
                {role === 'admin' ? 'Administrador' : 'Recepcionista'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => cerrarSesion()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-amber-950/50 text-slate-400 hover:text-amber-500 border border-slate-700 hover:border-amber-900/50 transition-colors text-sm font-bold"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
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
                isActive ? 'text-amber-500' : 'hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-500 mx-auto w-8 shadow-[0_2px_8px_rgba(245,158,11,0.8)]"></div>
              )}
              <div className="mb-1">{item.icon}</div>
              <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => cerrarSesion()}
          className="flex-1 flex flex-col items-center justify-center py-3 relative hover:text-amber-500 text-slate-400"
        >
          <div className="mb-1">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </div>
          <span className="text-[10px] font-bold tracking-wide">Salir</span>
        </button>
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
