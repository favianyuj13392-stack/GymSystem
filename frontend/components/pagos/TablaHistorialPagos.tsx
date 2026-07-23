"use client";

import { Pago } from '@/types/pago';

interface TablaHistorialPagosProps {
  pagos: Pago[];
  loading: boolean;
}

export default function TablaHistorialPagos({ pagos, loading }: TablaHistorialPagosProps) {
  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return '---';
    const f = new Date(fechaStr);
    return f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'Membresia':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Producto':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  return (
    <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 border-b border-zinc-800">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Socio / Cliente</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Concepto</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Método</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando historial de pagos...
                  </div>
                </td>
              </tr>
            ) : pagos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No se registraron transacciones que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              pagos.map((pago) => (
                <tr key={pago.id} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-zinc-300">{formatFecha(pago.fecha_pago)}</p>
                  </td>
                  <td className="px-6 py-4">
                    {pago.socios ? (
                      <div>
                        <p className="font-bold text-white">
                          {pago.socios.nombre} {pago.socios.apellido || ''}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">DNI: {pago.socios.dni}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-500 italic">Venta General / Anónimo</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-white">{pago.concepto}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getTipoBadge(pago.tipo)}`}>
                      {pago.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-zinc-400 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg">
                      {pago.metodo_pago}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-base font-black text-amber-400">
                      Bs. {Number(pago.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
