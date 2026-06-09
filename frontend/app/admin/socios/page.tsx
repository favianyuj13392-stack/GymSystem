"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { obtenerListaSocios, obtenerPlanesDisponibles, renovarMembresia } from './actions';

export default function AdminSociosPage() {
  const [socios, setSocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modal de Renovación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [socioARenovar, setSocioARenovar] = useState<any>(null);
  const [planes, setPlanes] = useState<any[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [montoPago, setMontoPago] = useState<number | string>('');
  const [renovando, setRenovando] = useState(false);
  const [errorRenovacion, setErrorRenovacion] = useState('');

  // Loader inline de Cloudinary para next/image
  const cloudinaryLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
  };

  // Cargar lista de socios
  const fetchSocios = async () => {
    setLoading(true);
    const data = await obtenerListaSocios(busqueda, filtroEstado);
    setSocios(data);
    setLoading(false);
  };

  // Cargar planes (solo se hace una vez al abrir el modal)
  const fetchPlanes = async () => {
    if (planes.length === 0) {
      const data = await obtenerPlanesDisponibles();
      setPlanes(data);
    }
  };

  // Efecto para buscar y filtrar
  useEffect(() => {
    // Implementar un pequeño debounce para la búsqueda
    const timer = setTimeout(() => {
      fetchSocios();
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroEstado]);

  // Manejo de Modal
  const abrirModalRenovacion = (socio: any) => {
    setSocioARenovar(socio);
    fetchPlanes();
    setIsModalOpen(true);
    setErrorRenovacion('');
    setPlanSeleccionado('');
    setMontoPago('');
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSocioARenovar(null);
  };

  const handleRenovarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planSeleccionado || !montoPago) {
      setErrorRenovacion('Por favor selecciona un plan e ingresa el monto pagado.');
      return;
    }

    setRenovando(true);
    setErrorRenovacion('');

    const res = await renovarMembresia(socioARenovar.id, planSeleccionado, Number(montoPago));
    
    setRenovando(false);

    if (res.success) {
      cerrarModal();
      fetchSocios(); // Refrescar la tabla
    } else {
      setErrorRenovacion(res.error || 'Error al renovar la membresía.');
    }
  };

  // Efecto para autocompletar el monto cuando seleccionas un plan
  useEffect(() => {
    if (planSeleccionado && planes.length > 0) {
      const plan = planes.find(p => p.id === planSeleccionado);
      if (plan) {
        setMontoPago(plan.precio);
      }
    }
  }, [planSeleccionado, planes]);


  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Socios</h1>
            <p className="text-slate-500 mt-1">Administra los registros, estado de membresías y renovaciones.</p>
          </div>
          <button 
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center"
            onClick={() => window.location.href = '/socios/nuevo'}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Nuevo Socio
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-hidden">
            {['Todos', 'Activos', 'Vencidos'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  filtroEstado === estado 
                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Socios */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Socio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan Actual</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando registros...
                      </div>
                    </td>
                  </tr>
                ) : socios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron socios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  socios.map((socio) => (
                    <tr key={socio.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                            {socio.foto_url ? (
                              <Image 
                                loader={cloudinaryLoader}
                                src={socio.foto_url} 
                                alt={socio.nombre} 
                                fill 
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{socio.nombre}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {socio.codigo_qr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{socio.dni}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{socio.telefono || 'Sin teléfono'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                          {socio.membresiaActual?.planes?.nombre || 'Ninguno'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-800">{socio.membresiaActual?.fecha_fin || '---'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {socio.estadoCalculado === 'activo' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            ACTIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            VENCIDO
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <a
                          href={`/socio/${socio.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 p-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center"
                          title="Ver Carnet Digital / Generar QR"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                        {socio.estadoCalculado !== 'activo' && (
                          <button 
                            onClick={() => abrirModalRenovacion(socio)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 hover:border-transparent px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
                          >
                            Renovar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Flotante de Renovación */}
      {isModalOpen && socioARenovar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Renovar Membresía</h3>
                <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleRenovarSubmit} className="p-6">
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  {socioARenovar.foto_url ? (
                    <Image loader={cloudinaryLoader} src={socioARenovar.foto_url} alt="Foto" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full bg-slate-300"></div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800 leading-tight">{socioARenovar.nombre}</p>
                  <p className="text-xs text-slate-500 font-medium">{socioARenovar.dni}</p>
                </div>
              </div>

              {errorRenovacion && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {errorRenovacion}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nuevo Plan</label>
                  <select
                    required
                    value={planSeleccionado}
                    onChange={(e) => setPlanSeleccionado(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white cursor-pointer"
                    disabled={renovando || planes.length === 0}
                  >
                    <option value="" disabled>Selecciona un plan</option>
                    {planes.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nombre} - Bs. {plan.precio} ({plan.duracion_meses} meses)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Monto Pagado (Bs.)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium">Bs.</span>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white font-medium"
                      placeholder="0.00"
                      disabled={renovando}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  disabled={renovando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={renovando}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium px-4 py-3 shadow-md shadow-red-500/20 transition-all flex items-center justify-center"
                >
                  {renovando ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
      )}
    </div>
  );
}
