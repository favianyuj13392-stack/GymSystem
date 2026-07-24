"use client";

import Image from 'next/image';
import { ResultadoAcceso } from '@/types/recepcion';

interface TarjetasResultadoAccesoProps {
  resultado: ResultadoAcceso | null;
  onReset: () => void;
}

export default function TarjetasResultadoAcceso({
  resultado,
  onReset,
}: TarjetasResultadoAccesoProps) {
  if (!resultado) return null;

  const cloudinaryLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
  };

  const { status, socio, membresia } = resultado;

  if (status === 'concedido' && socio) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-green-600 text-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-300 relative overflow-hidden">
        <button
          type="button"
          onClick={onReset}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative w-44 h-44 mb-6 rounded-full overflow-hidden border-4 border-white/60 shadow-2xl bg-zinc-950 shrink-0">
          {socio.foto_url ? (
            <Image loader={cloudinaryLoader} src={socio.foto_url} alt={socio.nombre} fill className="object-cover" sizes="176px" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-4xl lg:text-5xl font-black mb-2 tracking-tight text-center drop-shadow-md">
          {socio.nombre} {socio.apellido || ''}
        </h1>
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-black text-xl tracking-wider mb-6 border border-white/30 shadow-lg">
          <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
          ACCESO CONCEDIDO
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center min-w-0">
            <p className="text-xs uppercase font-bold text-white/80 tracking-wider">Plan Contratado</p>
            <p className="text-lg font-black mt-1 truncate">{membresia?.planes?.nombre || 'General'}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center min-w-0">
            <p className="text-xs uppercase font-bold text-white/80 tracking-wider">Vencimiento</p>
            <p className="text-lg font-black mt-1 truncate">{membresia?.fecha_fin || '---'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'vencido' && socio) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-600 text-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-300 relative overflow-hidden">
        <button
          type="button"
          onClick={onReset}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative w-44 h-44 mb-6 rounded-full overflow-hidden border-4 border-white/60 shadow-2xl bg-zinc-950 shrink-0">
          {socio.foto_url ? (
            <Image loader={cloudinaryLoader} src={socio.foto_url} alt={socio.nombre} fill className="object-cover" sizes="176px" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-4xl lg:text-5xl font-black mb-2 tracking-tight text-center drop-shadow-md">
          {socio.nombre} {socio.apellido || ''}
        </h1>
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-black text-xl tracking-wider mb-6 border border-white/30 shadow-lg">
          <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
          MEMBRESÍA VENCIDA
        </div>

        <p className="text-sm font-medium bg-black/20 px-4 py-2 rounded-xl text-center">
          Venció el: <span className="font-bold">{membresia?.fecha_fin || '---'}</span>. Por favor renovar en recepción.
        </p>
      </div>
    );
  }

  if (status === 'no_registrado') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-orange-600 text-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-300 relative overflow-hidden">
        <button
          type="button"
          onClick={onReset}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-white text-orange-600 rounded-full p-6 mb-6 shadow-xl">
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight text-center drop-shadow-md">
          CÓDIGO NO REGISTRADO
        </h1>
        <p className="text-lg opacity-90 text-center max-w-md font-medium">
          El código QR escaneado no pertenece a ningún socio en el sistema.
        </p>
      </div>
    );
  }

  if (status === 'denegado') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-amber-600 text-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-300 relative overflow-hidden">
        <button
          type="button"
          onClick={onReset}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-white text-amber-600 rounded-full p-6 mb-6 shadow-xl">
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl lg:text-4xl font-black mb-3 tracking-tight text-center drop-shadow-md">
          ACCESO DENEGADO
        </h1>
        <p className="text-base lg:text-lg font-bold opacity-95 text-center max-w-md bg-black/20 px-6 py-3 rounded-2xl border border-white/20">
          {resultado.razon || 'El socio ya se encuentra registrado dentro del gimnasio.'}
        </p>
      </div>
    );
  }

  return null;
}
