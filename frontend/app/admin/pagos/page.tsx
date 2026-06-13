"use client"

import { useState, useEffect } from 'react';
import { obtenerHistorialPagos, obtenerSumaIngresosMes, registrarPagoManual } from './actions';
import { obtenerListaSocios } from '../socios/actions';

export default function PagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [sumaMes, setSumaMes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [metodoPago, setMetodoPago] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Modal de registro manual
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newTipo, setNewTipo] = useState<'Producto' | 'Otros'>('Producto');
  const [newConcepto, setNewConcepto] = useState('');
  const [newMonto, setNewMonto] = useState<number>(0);
  const [newMetodo, setNewMetodo] = useState('Efectivo');
  const [newSocioId, setNewSocioId] = useState<string | null>(null);
  
  // Búsqueda de socio para asociar pago
  const [socios, setSocios] = useState<any[]>([]);
  const [socioSearchQuery, setSocioSearchQuery] = useState('');
  const [isSocioDropdownOpen, setIsSocioDropdownOpen] = useState(false);
  const [selectedSocioName, setSelectedSocioName] = useState('');

  const [savingManual, setSavingManual] = useState(false);
  const [errorManual, setErrorManual] = useState('');

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

  const loadSocios = async () => {
    const list = await obtenerListaSocios();
    setSocios(list);
  };

  // Trigger search and filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDatos();
    }, 450);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, metodoPago, fechaInicio, fechaFin]);

  useEffect(() => {
    loadSocios();
  }, []);

  const limpiarFiltros = () => {
    setBusqueda('');
    setMetodoPago('Todos');
    setFechaInicio('');
    setFechaFin('');
  };

  const abrirModalRegistro = () => {
    setNewTipo('Producto');
    setNewConcepto('');
    setNewMonto(0);
    setNewMetodo('Efectivo');
    setNewSocioId(null);
    setSocioSearchQuery('');
    setSelectedSocioName('');
    setIsSocioDropdownOpen(false);
    setErrorManual('');
    setIsRegisterModalOpen(true);
  };

  const cerrarModalRegistro = () => {
    setIsRegisterModalOpen(false);
  };

  const handleSocioSelect = (socio: any) => {
    setNewSocioId(socio.id);
    setSelectedSocioName(`${socio.nombre} ${socio.apellido || ''}`.trim());
    setIsSocioDropdownOpen(false);
  };

  const handleClearSocioSelection = () => {
    setNewSocioId(null);
    setSelectedSocioName('');
    setSocioSearchQuery('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcepto.trim() || newMonto <= 0) {
      setErrorManual('Por favor, ingresá un concepto válido y un monto mayor a cero.');
      return;
    }

    setSavingManual(true);
    setErrorManual('');

    const res = await registrarPagoManual({
      socio_id: newSocioId,
      concepto: newConcepto.trim(),
      monto: newMonto,
      metodo_pago: newMetodo,
      tipo: newTipo
    });

    setSavingManual(false);

    if (res.success) {
      cerrarModalRegistro();
      fetchDatos();
    } else {
      setErrorManual(res.error || 'Ocurrió un error al registrar el pago.');
    }
  };

  // Filtrar socios por texto de búsqueda en el input
  const filteredSocios = socios.filter(s => {
    const fullName = `${s.nombre} ${s.apellido || ''}`.toLowerCase();
    const dni = (s.dni || '').toLowerCase();
    const query = socioSearchQuery.toLowerCase();
    return fullName.includes(query) || dni.includes(query);
  });

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
            <p className="text-zinc-400 mt-1">Busca, filtra y registra cobros manuales de productos o servicios del gimnasio.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto shrink-0">
            {/* Card Indicador de Ingresos del Mes */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl px-6 py-3.5 flex items-center gap-4 shadow-lg w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-900/30 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total del Mes Actual</p>
                <p className="text-xl font-black text-amber-500 mt-0.5">Bs {sumaMes.toLocaleString('es-BO')}</p>
              </div>
            </div>

            <button
              onClick={abrirModalRegistro}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-3.5 rounded-2xl shadow-md shadow-amber-500/15 transition-colors flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Registrar Pago / Venta
            </button>
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
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Concepto / Tipo</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Cliente / Socio</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">DNI</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Método</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg className="animate-spin h-7 w-7 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando transacciones...
                      </div>
                    </td>
                  </tr>
                ) : pagos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-medium">
                      No se encontraron transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  pagos.map((pago) => {
                    const fecha = new Date(pago.fecha_pago);
                    const fechaFormat = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const horaFormat = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const metodo = pago.metodo_pago || 'Efectivo';
                    const tipoPago = pago.tipo || 'Plan';
                    const socioName = pago.socios 
                      ? `${pago.socios.nombre} ${pago.socios.apellido || ''}`.trim() 
                      : (pago.socio_id ? 'Socio Eliminado' : 'Cliente Casual');

                    return (
                      <tr key={pago.id} className="hover:bg-zinc-850/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-zinc-200 text-sm font-semibold">{fechaFormat}</span>
                          <span className="text-zinc-500 text-xs block mt-0.5">{horaFormat}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white text-sm font-bold block">{pago.concepto || 'Membresía'}</span>
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${
                            tipoPago === 'Plan'
                              ? 'bg-amber-950/20 border-amber-900/30 text-amber-400'
                              : tipoPago === 'Producto'
                              ? 'bg-zinc-950 border-zinc-800 text-emerald-400'
                              : 'bg-zinc-950 border-zinc-800 text-purple-400'
                          }`}>
                            {tipoPago.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-300 text-sm">
                          {socioName}
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

      {/* Modal Registrar Pago / Venta */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Registrar Pago / Venta</h3>
                <button onClick={cerrarModalRegistro} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-full p-1 border border-zinc-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {errorManual && (
                <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  {errorManual}
                </div>
              )}

              {/* Tipo de Venta */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Tipo de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTipo('Producto')}
                    className={`py-2 px-4 rounded-xl text-sm font-bold border transition-all ${
                      newTipo === 'Producto'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Producto / Extra
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTipo('Otros')}
                    className={`py-2 px-4 rounded-xl text-sm font-bold border transition-all ${
                      newTipo === 'Otros'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Otros Conceptos
                  </button>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Concepto / Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder={newTipo === 'Producto' ? 'ej. Agua 500ml, Batido de Proteína' : 'ej. Alquiler de Locker, Inscripción'}
                  value={newConcepto}
                  onChange={(e) => setNewConcepto(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={savingManual}
                />
              </div>

              {/* Monto & Método */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Monto (Bs) *</label>
                  <input
                    type="number"
                    required
                    min={0.5}
                    step="any"
                    placeholder="ej. 10"
                    value={newMonto || ''}
                    onChange={(e) => setNewMonto(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    disabled={savingManual}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Método *</label>
                  <select
                    value={newMetodo}
                    onChange={(e) => setNewMetodo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    disabled={savingManual}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              {/* Socio Asociado (Opcional) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Socio Asociado (Opcional)</label>
                {selectedSocioName ? (
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white">
                    <span className="font-bold text-amber-500">{selectedSocioName}</span>
                    <button 
                      type="button" 
                      onClick={handleClearSocioSelection}
                      className="text-zinc-500 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Buscar socio por nombre o DNI..."
                      value={socioSearchQuery}
                      onChange={(e) => {
                        setSocioSearchQuery(e.target.value);
                        setIsSocioDropdownOpen(true);
                      }}
                      onFocus={() => setIsSocioDropdownOpen(true)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      disabled={savingManual}
                    />

                    {isSocioDropdownOpen && socioSearchQuery.trim().length > 0 && (
                      <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 divide-y divide-zinc-850">
                        {filteredSocios.length === 0 ? (
                          <div className="p-3 text-xs text-zinc-500 text-center">No se encontraron socios</div>
                        ) : (
                          filteredSocios.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSocioSelect(s)}
                              className="w-full text-left p-3 hover:bg-zinc-850 transition-colors text-sm text-zinc-200 block"
                            >
                              <span className="font-bold block text-white">{s.nombre} {s.apellido || ''}</span>
                              <span className="text-xs text-zinc-500 font-mono">DNI: {s.dni}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Botones */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModalRegistro}
                  className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl font-medium transition-colors cursor-pointer text-sm"
                  disabled={savingManual}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center cursor-pointer text-sm"
                >
                  {savingManual ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Registrando...
                    </>
                  ) : (
                    'Guardar Pago'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
