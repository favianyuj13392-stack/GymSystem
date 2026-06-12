"use client"

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { obtenerListaSocios, obtenerPlanesDisponibles, renovarMembresia, actualizarSocio, eliminarSocioLogico, obtenerAsistenciasSocio } from './actions';

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
  const [metodoPago, setMetodoPago] = useState('Efectivo');

  // Modal de Asistencias
  const [isAsistenciasModalOpen, setIsAsistenciasModalOpen] = useState(false);
  const [socioAsistencias, setSocioAsistencias] = useState<any>(null);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);

  // Modal de Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [socioAEditar, setSocioAEditar] = useState<any>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null);
  const [editFotoPreview, setEditFotoPreview] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'idle' | 'uploading' | 'saving' | 'error'>('idle');
  const [editError, setEditError] = useState('');

  // Modal de Desactivación (Borrado Lógico)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [socioAEliminar, setSocioAEliminar] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);

  // Referencias para la cámara/archivos en edición
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editCameraInputRef = useRef<HTMLInputElement>(null);

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
    setMetodoPago('Efectivo');
  };

  const abrirModalAsistencias = async (socio: any) => {
    setSocioAsistencias(socio);
    setIsAsistenciasModalOpen(true);
    setLoadingAsistencias(true);
    const data = await obtenerAsistenciasSocio(socio.id);
    setAsistencias(data);
    setLoadingAsistencias(false);
  };

  const cerrarModalAsistencias = () => {
    setIsAsistenciasModalOpen(false);
    setSocioAsistencias(null);
    setAsistencias([]);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSocioARenovar(null);
  };

  // Manejo de Modal Edición
  const abrirModalEdicion = (socio: any) => {
    setSocioAEditar(socio);
    setEditNombre(socio.nombre || '');
    setEditDni(socio.dni || '');
    setEditTelefono(socio.telefono || '');
    setEditFotoFile(null);
    setEditFotoPreview(socio.foto_url ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${socio.foto_url}` : null);
    setEditError('');
    setEditStatus('idle');
    setIsEditModalOpen(true);
  };

  const cerrarModalEdicion = () => {
    setIsEditModalOpen(false);
    setSocioAEditar(null);
  };

  // Manejo de Modal Desactivación
  const abrirModalDesactivar = (socio: any) => {
    setSocioAEliminar(socio);
    setIsDeleteModalOpen(true);
  };

  const cerrarModalDesactivar = () => {
    setIsDeleteModalOpen(false);
    setSocioAEliminar(null);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setEditFotoFile(file);
       setEditFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim() || !editDni.trim()) {
      setEditError('Por favor completa los campos obligatorios (Nombre y DNI).');
      return;
    }

    setEditStatus('uploading');
    setEditError('');

    try {
      let uploadedFotoUrl = undefined;

      if (editFotoFile) {
        const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudinaryCloudName || !cloudinaryPreset) {
          throw new Error('Faltan las variables de entorno de Cloudinary.');
        }

        const uploadData = new FormData();
        uploadData.append('file', editFotoFile);
        uploadData.append('upload_preset', cloudinaryPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
          method: 'POST',
          body: uploadData,
        });

        if (!res.ok) {
          throw new Error('Error de conexión al subir la nueva imagen a Cloudinary.');
        }

        const cloudinaryResponse = await res.json();
        uploadedFotoUrl = cloudinaryResponse.public_id;
      }

      setEditStatus('saving');
      const res = await actualizarSocio(socioAEditar.id, {
        nombre: editNombre,
        dni: editDni,
        telefono: editTelefono,
        foto_url: uploadedFotoUrl
      });

      if (res.success) {
        cerrarModalEdicion();
        fetchSocios();
      } else {
        setEditError(res.error || 'Error al actualizar el socio.');
        setEditStatus('error');
      }
    } catch (err: any) {
      setEditError(err.message || 'Ocurrió un error inesperado al guardar los cambios.');
      setEditStatus('error');
    }
  };

  const handleDeactivateSubmit = async () => {
    setEliminando(true);
    const res = await eliminarSocioLogico(socioAEliminar.id);
    setEliminando(false);
    if (res.success) {
      cerrarModalDesactivar();
      fetchSocios();
    } else {
      alert(res.error || 'Error al dar de baja al socio.');
    }
  };

  const handleRenovarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planSeleccionado || !montoPago) {
      setErrorRenovacion('Por favor selecciona un plan e ingresa el monto pagado.');
      return;
    }

    setRenovando(true);
    setErrorRenovacion('');

    const res = await renovarMembresia(socioARenovar.id, planSeleccionado, Number(montoPago), metodoPago);
    
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
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center"
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-slate-50 focus:bg-white"
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
                        <svg className="animate-spin h-8 w-8 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            VENCIDO
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalAsistencias(socio)}
                          className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 p-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          title="Historial de Asistencia"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button
                          onClick={() => abrirModalEdicion(socio)}
                          className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 p-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          title="Editar Socio"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
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
                            className="bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-600 border border-amber-200 hover:border-transparent px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Renovar
                          </button>
                        )}
                        <button
                          onClick={() => abrirModalDesactivar(socio)}
                          className="bg-white hover:bg-amber-50 text-slate-400 hover:text-amber-600 border border-slate-200 hover:border-amber-200 p-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer"
                          title="Dar de Baja (Desactivar)"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
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
                <div className="mb-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white cursor-pointer"
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
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white font-medium"
                      placeholder="0.00"
                      disabled={renovando}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Método de Pago</label>
                  <select
                    required
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white cursor-pointer font-medium"
                    disabled={renovando}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                  </select>
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
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium px-4 py-3 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center"
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

      {/* Modal Flotante de Edición */}
      {isEditModalOpen && socioAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Editar Socio</h3>
                <button onClick={cerrarModalEdicion} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {editError && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-slate-50 focus:bg-white text-slate-900"
                    disabled={editStatus === 'uploading' || editStatus === 'saving'}
                  />
                </div>

                {/* DNI & Teléfono */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
                    <input
                      type="text"
                      required
                      value={editDni}
                      onChange={(e) => setEditDni(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-slate-50 focus:bg-white text-slate-900"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-slate-50 focus:bg-white text-slate-900"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                </div>

                {/* Foto de Perfil */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Foto de Perfil</label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {editFotoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editFotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={editFileInputRef}
                        onChange={handleEditFileChange}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        ref={editCameraInputRef}
                        onChange={handleEditFileChange}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editCameraInputRef.current?.click()}
                          className="bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          Cámara
                        </button>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          Subir archivo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModalEdicion}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                  disabled={editStatus === 'uploading' || editStatus === 'saving'}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editStatus === 'uploading' || editStatus === 'saving'}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium px-4 py-3 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center cursor-pointer"
                >
                  {editStatus === 'uploading' || editStatus === 'saving' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Desactivación */}
      {isDeleteModalOpen && socioAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Dar de baja socio</h3>
              <p className="text-sm text-slate-500 mb-6">
                ¿Estás seguro de que deseas dar de baja a <strong>{socioAEliminar.nombre}</strong>? El socio no podrá ingresar al gimnasio y sus datos quedarán inactivos.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cerrarModalDesactivar}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivateSubmit}
                disabled={eliminando}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium px-4 py-3 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center cursor-pointer"
              >
                {eliminando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Procesando...
                  </>
                ) : (
                  'Confirmar Baja'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Flotante de Historial de Asistencia */}
      {isAsistenciasModalOpen && socioAsistencias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Historial de Asistencia</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{socioAsistencias.nombre}</p>
                </div>
                <button onClick={cerrarModalAsistencias} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingAsistencias ? (
                <div className="py-12 text-center text-slate-400">
                  <svg className="animate-spin h-7 w-7 text-amber-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Cargando historial...
                </div>
              ) : asistencias.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-medium">
                  Este socio no registra asistencias.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <th className="py-2.5">Fecha</th>
                      <th className="py-2.5">Hora</th>
                      <th className="py-2.5 text-right">Evento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {asistencias.map((ast) => {
                      const fecha = new Date(ast.registrado_at);
                      const fechaFormat = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      const horaFormat = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <tr key={ast.id} className="text-sm">
                          <td className="py-3 text-slate-700 font-medium">{fechaFormat}</td>
                          <td className="py-3 text-slate-500 font-mono">{horaFormat}</td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ast.tipo === 'entrada'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
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
      )}
    </div>
  );
}
