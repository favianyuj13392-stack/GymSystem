"use client";

import { useState } from 'react';
import Image from 'next/image';
import { SocioActivoGym } from '@/types/recepcion';

interface ListaSociosEnGymProps {
  sociosActivos: SocioActivoGym[];
  removingId: string | null;
  onRegistrarSalida: (asistenciaId: string) => void;
}

export default function ListaSociosEnGym({
  sociosActivos,
  removingId,
  onRegistrarSalida,
}: ListaSociosEnGymProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const cloudinaryLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
  };

  const formatHoraBolivia = (horaStr: string) => {
    if (!horaStr) return '--:--';
    try {
      const date = new Date(horaStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('es-BO', {
          timeZone: 'America/La_Paz',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch (e) {
      // Fallback
    }
    return horaStr.length > 5 ? horaStr.slice(11, 16) : horaStr;
  };

  const handleSalidaClick = (asistenciaId: string) => {
    if (confirmingId === asistenciaId) {
      setConfirmingId(null);
      onRegistrarSalida(asistenciaId);
    } else {
      setConfirmingId(asistenciaId);
      setTimeout(() => {
        setConfirmingId((current) => (current === asistenciaId ? null : current));
      }, 4000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-900/40 rounded-[2rem] border border-zinc-800 p-6 overflow-hidden shadow-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Socios en el Gym
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {sociosActivos.length} {sociosActivos.length === 1 ? 'persona actualmente' : 'personas actualmente'}
          </p>
        </div>
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
        {sociosActivos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-600">
            <svg className="w-12 h-12 mb-3 stroke-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="font-bold text-sm text-zinc-400">El gimnasio está vacío.</p>
            <p className="text-xs text-zinc-600 mt-1">Los socios aparecerán aquí cuando escaneen su entrada.</p>
          </div>
        ) : (
          sociosActivos.map((socio) => (
            <div
              key={socio.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300 ${
                removingId === socio.id ? 'opacity-0 scale-95 transition-all duration-300' : 'animate-in fade-in'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                  {socio.foto_url ? (
                    <Image
                      loader={cloudinaryLoader}
                      src={socio.foto_url}
                      alt={socio.nombre}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{socio.nombre} {socio.apellido || ''}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-amber-400 font-bold px-2 py-0.5 rounded">
                      {formatHoraBolivia(socio.horaEntrada)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400">
                      <span className="w-1 h-1 rounded-full bg-green-500"></span>
                      DENTRO
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSalidaClick(socio.id)}
                disabled={removingId === socio.id}
                className={`p-2 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  removingId === socio.id
                    ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    : confirmingId === socio.id
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20 animate-pulse'
                    : 'bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border-zinc-800 hover:border-red-900/50'
                }`}
                title="Registrar Salida Manual"
              >
                {removingId === socio.id ? (
                  <svg className="animate-spin h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : confirmingId === socio.id ? (
                  <span>¿Confirmar?</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Salida</span>
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
