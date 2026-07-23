"use client";

import { useState } from 'react';
import { FiltroMetodoPago } from '@/types/pago';
import { usePagos } from '@/hooks/usePagos';
import KpiIngresosMes from '@/components/pagos/KpiIngresosMes';
import TablaHistorialPagos from '@/components/pagos/TablaHistorialPagos';
import ModalRegistrarPago from '@/components/pagos/ModalRegistrarPago';

export default function PagosPage() {
  const {
    pagos,
    sumaMes,
    loading,
    busqueda,
    setBusqueda,
    metodoPago,
    setMetodoPago,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    refetchPagos,
  } = usePagos();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/15 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Historial de Pagos e Ingresos</h1>
            <p className="text-zinc-400 mt-1">Monitorea los cobros por membresías y ventas de productos en tiempo real.</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-amber-500/15 transition-colors flex items-center cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Registrar Cobro
          </button>
        </div>

        {/* Métrica KPI de Ingresos */}
        <KpiIngresosMes sumaMes={sumaMes} />

        {/* Filtros de Búsqueda */}
        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-lg">
          {/* Búsqueda por concepto o socio */}
          <div className="relative w-full lg:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente o concepto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-zinc-950 focus:bg-zinc-900 text-white text-sm"
            />
          </div>

          {/* Filtros de Método y Rango de Fechas */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
            {/* Método de pago */}
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as FiltroMetodoPago)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="Todos" className="bg-zinc-950 text-white">Todos los Métodos</option>
              <option value="Efectivo" className="bg-zinc-950 text-white">Efectivo</option>
              <option value="Transferencia" className="bg-zinc-950 text-white">Transferencia</option>
              <option value="Tarjeta" className="bg-zinc-950 text-white">Tarjeta</option>
            </select>

            {/* Fechas */}
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              title="Fecha Inicio"
            />
            <span className="text-zinc-600 text-xs">-</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              title="Fecha Fin"
            />

            {(busqueda || metodoPago !== 'Todos' || fechaInicio || fechaFin) && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setMetodoPago('Todos');
                  setFechaInicio('');
                  setFechaFin('');
                }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline px-2 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Historial */}
        <TablaHistorialPagos pagos={pagos} loading={loading} />

      </div>

      {/* Modal Registrar Cobro */}
      <ModalRegistrarPago
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => refetchPagos()}
      />
    </div>
  );
}
