"use client";

interface KpiIngresosMesProps {
  sumaMes: number;
}

export default function KpiIngresosMes({ sumaMes }: KpiIngresosMesProps) {
  return (
    <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 shadow-xl flex items-center justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Ingresos del Mes</p>
        <h2 className="text-3xl lg:text-4xl font-black text-amber-400 mt-1 tracking-tight">
          Bs. {sumaMes.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
        </h2>
      </div>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
}
