"use client";

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { Socio, Plan } from '@/types/socio';
import { renovarMembresia } from '@/app/admin/socios/actions';

interface ModalRenovacionProps {
  isOpen: boolean;
  socio: Socio | null;
  planes: Plan[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalRenovacion({
  isOpen,
  socio,
  planes,
  onClose,
  onSuccess,
}: ModalRenovacionProps) {
  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [montoPago, setMontoPago] = useState<number | string>('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [renovando, setRenovando] = useState(false);
  const [errorRenovacion, setErrorRenovacion] = useState('');

  if (!isOpen || !socio) return null;

  const handlePlanChange = (planId: string) => {
    setPlanSeleccionado(planId);
    const planEncontrado = planes.find((p) => p.id === planId);
    if (planEncontrado) {
      setMontoPago(planEncontrado.precio);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!planSeleccionado) {
      setErrorRenovacion('Por favor selecciona un plan.');
      return;
    }

    setRenovando(true);
    setErrorRenovacion('');

    try {
      const res = await renovarMembresia(socio.id, planSeleccionado, Number(montoPago), metodoPago);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorRenovacion(res.error || 'Error al renovar la membresía.');
      }
    } catch (err: any) {
      setErrorRenovacion(err.message || 'Error inesperado al renovar.');
    } finally {
      setRenovando(false);
    }
  };

  const cloudinaryLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Renovar Membresía</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white bg-zinc-950 rounded-full p-1 border border-zinc-850 cursor-pointer transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-900 shrink-0 border border-zinc-850">
              {socio.foto_url ? (
                <Image
                  loader={cloudinaryLoader}
                  src={socio.foto_url}
                  alt="Foto de socio"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full bg-zinc-950 flex items-center justify-center text-zinc-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-white leading-tight">
                {socio.nombre} {socio.apellido || ''}
              </p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">DNI: {socio.dni}</p>
            </div>
          </div>

          {errorRenovacion && (
            <div className="mb-4 text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
              {errorRenovacion}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nuevo Plan</label>
              <select
                required
                value={planSeleccionado}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer font-medium"
                disabled={renovando || planes.length === 0}
              >
                <option value="" disabled className="text-zinc-450 bg-zinc-950">
                  Selecciona un plan
                </option>
                {planes.map((plan) => (
                  <option key={plan.id} value={plan.id} className="text-white bg-zinc-950">
                    {plan.nombre} - Bs. {plan.precio} ({plan.duracion_meses} meses)
                  </option>
                ))}
              </select>
            </div>

            {planSeleccionado && (
              <div className="bg-amber-500/10 border border-amber-900/30 p-4 rounded-xl flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-400">Monto del Plan:</span>
                <span className="text-lg font-black text-amber-400">Bs. {montoPago}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Método de Pago</label>
              <select
                required
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer font-medium"
                disabled={renovando}
              >
                <option value="Efectivo" className="text-white bg-zinc-950">
                  Efectivo
                </option>
                <option value="Transferencia" className="text-white bg-zinc-950">
                  Transferencia Bancaria
                </option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={renovando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={renovando}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
            >
              {renovando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                'Confirmar Pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
