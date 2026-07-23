'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function PendienteActivacionPage() {
  const [checking, setChecking] = useState(false);
  const supabase = createClient();

  async function checkActivation() {
    setChecking(true);

    // Forzar el refresco de la sesión (actualiza el JWT local con los claims nuevos)
    await supabase.auth.refreshSession();

    // Volver a consultar el usuario con los claims actualizados
    const { data: { user } } = await supabase.auth.getUser();

    const jwtData = user?.app_metadata as { gimnasio_id?: string; estado?: string };

    // Si ya tiene el gimnasio_id y estado activo, redireccionamos a dashboard
    if (jwtData?.gimnasio_id && jwtData?.estado === 'activo') {
      window.location.href = '/admin/dashboard';
    } else {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center rounded-full mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">
          Cuenta Pendiente de Activación
        </h1>

        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          Tu gimnasio ha sido registrado correctamente. Para comenzar a utilizar GymControl, necesitamos verificar tu cuenta y procesar tu primera suscripción. Un administrador se pondrá en contacto contigo a la brevedad.
        </p>

        <div className="space-y-3">
          <button
            onClick={checkActivation}
            disabled={checking}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {checking ? 'Verificando...' : 'Verificar Activación'}
          </button>

          <Link href="mailto:soporte@gymcontrol.app" className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
            Contactar Soporte
          </Link>
        </div>
      </div>
    </div>
  );
}