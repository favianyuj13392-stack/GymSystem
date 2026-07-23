"use client";

import { Socio, Asistencia } from '@/types/socio';

interface ModalAsistenciasProps {
  isOpen: boolean;
  socio: Socio | null;
  asistencias: Asistencia[];
  loading: boolean;
  onClose: () => void;
}

export default function ModalAsistencias({
  isOpen,
  socio,
  asistencias,
  loading,
  onClose,
}: ModalAsistenciasProps) {
  if (!isOpen || !socio) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">Historial de Asistencia</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {socio.nombre} {socio.apellido || ''}
              </p>
            </div>
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

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-zinc-500">
              <svg className="animate-spin h-7 w-7 text-amber-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando historial...
            </div>
          ) : asistencias.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-medium">
              Este socio no registra asistencias.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase">
                  <th className="py-2.5">Fecha</th>
                  <th className="py-2.5">Hora</th>
                  <th className="py-2.5 text-right">Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {asistencias.map((ast) => {
                  const fecha = new Date(ast.registrado_at);
                  const fechaFormat = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const horaFormat = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={ast.id} className="text-sm">
                      <td className="py-3 text-zinc-300 font-medium">{fechaFormat}</td>
                      <td className="py-3 text-zinc-500 font-mono">{horaFormat}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ast.tipo === 'entrada'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {ast.tipo === 'entrada' ? 'ENTRADA' : 'SALIDA'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
