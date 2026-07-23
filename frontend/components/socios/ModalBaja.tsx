"use client";

import { Socio } from '@/types/socio';

interface ModalBajaProps {
  isOpen: boolean;
  socio: Socio | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalBaja({
  isOpen,
  socio,
  loading,
  onClose,
  onConfirm,
}: ModalBajaProps) {
  if (!isOpen || !socio) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 p-6 text-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Dar de baja socio</h3>
          <p className="text-sm text-zinc-400 mb-6">
            ¿Estás seguro de que deseas dar de baja a <strong>{socio.nombre} {socio.apellido || ''}</strong>? El socio no podrá ingresar al gimnasio y sus datos quedarán inactivos.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              'Confirmar Baja'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
