"use client"

import { useState, useEffect } from 'react';
import { obtenerHistorialPagos, obtenerSumaIngresosMes } from './actions';

export default function PagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [sumaMes, setSumaMes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [metodoPago, setMetodoPago] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchDatos = async () => {
    setLoading(true);
    const [historial, totalSuma] = await Promise.all([
      obtenerHistorialPagos({
        busqueda: busqueda.trim(),
        metodoPago,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
      }),
      obtenerSumaIngresosMes()
    ]);
    
    setPagos(historial);
    setSumaMes(totalSuma);
    setLoading(false);
  };

  // Trigger search and filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDatos();
    }, 450);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, metodoPago, fechaInicio, fechaFin]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setMetodoPago('Todos');
    setFechaInicio('');
    setFechaFin('');
  };

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-900/30 tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Historial de Transacciones
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Registro de Pagos</h1>
            <p className="text-zinc-400 mt-1">Busca, filtra y audita los cobros realizados a los socios.</p>
          </div>
          
          {/* Card Indicador de Ingresos del Mes */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-lg shrink-0 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-900/30 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total del Mes Actual</p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">Bs {sumaMes.toLocaleString('es-BO')}</p>
            </div>
          </div>
        </div>

        {/* Panel de Filtros */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filtros de Búsqueda
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Buscador */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Socio (Nombre / DNI)</label>
              <input
                type="text"
                placeholder="Nombre o DNI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Método</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="Todos">Todos los métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Limpiar Filtros */}
          {(busqueda || metodoPago !== 'Todos' || fechaInicio || fechaFin) && (
            <div className="flex justify-end mt-4">
              <button
                onClick={limpiarFiltros}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-zinc-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Fecha y Hora</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Socio</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">DNI</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Método</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg className="animate-spin h-7 w-7 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando transacciones...
                      </div>
                    </td>
                  </tr>
                ) : pagos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">
                      No se encontraron transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  pagos.map((pago) => {
                    const fecha = new Date(pago.fecha_pago);
                    const fechaFormat = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const horaFormat = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const metodo = pago.metodo_pago || 'Efectivo';

                    return (
                      <tr key={pago.id} className="hover:bg-zinc-850/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-zinc-200 text-sm font-semibold">{fechaFormat}</span>
                          <span className="text-zinc-500 text-xs block mt-0.5">{horaFormat}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white text-sm">
                          {pago.socios?.nombre || 'Socio Eliminado'}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm font-mono">
                          {pago.socios?.dni || '---'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                            metodo === 'Transferencia' 
                              ? 'bg-zinc-950 border-zinc-700 text-zinc-300' 
                              : 'bg-amber-950/20 border-amber-900/30 text-amber-400'
                          }`}>
                            {metodo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-white text-sm">
                          Bs {Number(pago.monto).toLocaleString('es-BO')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
