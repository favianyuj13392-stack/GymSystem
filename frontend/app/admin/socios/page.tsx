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
  const [editApellido, setEditApellido] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('');
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
    setEditApellido(socio.apellido || '');
    setEditEmail(socio.email || '');
    setEditFechaNacimiento(socio.fecha_nacimiento || '');
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
    if (!editNombre.trim() || !editApellido.trim() || !editDni.trim()) {
      setEditError('Por favor completa los campos obligatorios (Nombre, Apellido y DNI).');
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
        apellido: editApellido,
        email: editEmail,
        fecha_nacimiento: editFechaNacimiento,
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
    if (!planSeleccionado) {
      setErrorRenovacion('Por favor selecciona un plan.');
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
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/15 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Socios</h1>
            <p className="text-zinc-400 mt-1">Administra los registros, estado de membresías y renovaciones.</p>
          </div>
          <button 
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-amber-500/15 transition-colors flex items-center cursor-pointer"
            onClick={() => window.location.href = '/socios/nuevo'}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Nuevo Socio
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-zinc-950 focus:bg-zinc-900 text-white"
            />
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl w-full md:w-auto border border-zinc-850 overflow-hidden">
            {['Todos', 'Activos', 'Vencidos'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  filtroEstado === estado 
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Socios */}
        <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-zinc-800">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Socio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Plan Actual</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Vencimiento</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando registros...
                      </div>
                    </td>
                  </tr>
                ) : socios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron socios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  socios.map((socio) => (
                    <tr key={socio.id} className="hover:bg-zinc-900/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                            {socio.foto_url ? (
                              <Image 
                                loader={cloudinaryLoader}
                                src={socio.foto_url} 
                                alt={`${socio.nombre} ${socio.apellido || ''}`} 
                                fill 
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{socio.nombre} {socio.apellido || ''}</p>
                            <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {socio.codigo_qr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-zinc-300">{socio.dni}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{socio.telefono || 'Sin teléfono'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-900/30 px-3 py-1 rounded-full">
                          {socio.membresiaActual?.planes?.nombre || 'Ninguno'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-zinc-300">{socio.membresiaActual?.fecha_fin || '---'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {socio.estadoCalculado === 'activo' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            ACTIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            VENCIDO
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalAsistencias(socio)}
                          className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 p-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
                          title="Historial de Asistencia"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button
                          onClick={() => abrirModalEdicion(socio)}
                          className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 p-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
                          title="Editar Socio"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <a
                          href={`/socio/${socio.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 p-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center"
                          title="Ver Carnet Digital / Generar QR"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                        {socio.estadoCalculado !== 'activo' && (
                          <button 
                            onClick={() => abrirModalRenovacion(socio)}
                            className="bg-amber-950/40 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-900/30 hover:border-transparent px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
                          >
                            Renovar
                          </button>
                        )}
                        <button
                          onClick={() => abrirModalDesactivar(socio)}
                          className="bg-zinc-950 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 p-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Renovar Membresía</h3>
                <button onClick={cerrarModal} className="text-zinc-500 hover:text-white bg-zinc-950 rounded-full p-1 border border-zinc-850 cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleRenovarSubmit} className="p-6">
              <div className="mb-6 bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-900 shrink-0 border border-zinc-850">
                  {socioARenovar.foto_url ? (
                    <Image loader={cloudinaryLoader} src={socioARenovar.foto_url} alt="Foto" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full bg-zinc-950"></div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-white leading-tight">{socioARenovar.nombre} {socioARenovar.apellido || ''}</p>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">{socioARenovar.dni}</p>
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
                    onChange={(e) => setPlanSeleccionado(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer font-medium"
                    disabled={renovando || planes.length === 0}
                  >
                    <option value="" disabled className="text-zinc-450 bg-zinc-950">Selecciona un plan</option>
                    {planes.map(plan => (
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
                    <option value="Efectivo" className="text-white bg-zinc-950">Efectivo</option>
                    <option value="Transferencia" className="text-white bg-zinc-950">Transferencia Bancaria</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Editar Socio</h3>
                <button onClick={cerrarModalEdicion} className="text-zinc-500 hover:text-white bg-zinc-950 rounded-full p-1 border border-zinc-850 cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {editError && (
                <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={editApellido}
                      onChange={(e) => setEditApellido(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                </div>

                {/* Email y Fecha de Nacimiento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Fecha Nacimiento</label>
                    <input
                      type="date"
                      value={editFechaNacimiento}
                      onChange={(e) => setEditFechaNacimiento(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                </div>

                {/* DNI & Teléfono */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">DNI *</label>
                    <input
                      type="text"
                      required
                      value={editDni}
                      onChange={(e) => setEditDni(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Teléfono</label>
                    <input
                      type="tel"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      disabled={editStatus === 'uploading' || editStatus === 'saving'}
                    />
                  </div>
                </div>

                {/* Foto de Perfil */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">Foto de Perfil</label>
                  <div className="flex items-center gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                      {editFotoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editFotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
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
                          className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          Cámara
                        </button>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
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
              <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModalEdicion}
                  className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                  disabled={editStatus === 'uploading' || editStatus === 'saving'}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editStatus === 'uploading' || editStatus === 'saving'}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 p-6 text-slate-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dar de baja socio</h3>
              <p className="text-sm text-zinc-400 mb-6">
                ¿Estás seguro de que deseas dar de baja a <strong>{socioAEliminar.nombre} {socioAEliminar.apellido || ''}</strong>? El socio no podrá ingresar al gimnasio y sus datos quedarán inactivos.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cerrarModalDesactivar}
                className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivateSubmit}
                disabled={eliminando}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Historial de Asistencia</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">{socioAsistencias.nombre} {socioAsistencias.apellido || ''}</p>
                </div>
                <button onClick={cerrarModalAsistencias} className="text-zinc-500 hover:text-white bg-zinc-950 rounded-full p-1 border border-zinc-850 cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingAsistencias ? (
                <div className="py-12 text-center text-zinc-500">
                  <svg className="animate-spin h-7 w-7 text-amber-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ast.tipo === 'entrada'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
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
