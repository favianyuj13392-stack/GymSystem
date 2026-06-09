"use client"

import { useState, useEffect, useRef } from 'react';
import { obtenerPlanes, crearSocio } from './actions';

export default function NuevoSocioPage() {
  const [planes, setPlanes] = useState<any[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    plan_id: ''
  });

  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const data = await obtenerPlanes();
        setPlanes(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, plan_id: data[0].id }));
        }
      } catch (error) {
        console.error("Error cargando planes", error);
      } finally {
        setLoadingPlanes(false);
      }
    };
    fetchPlanes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoto(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const clearForm = () => {
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      plan_id: planes.length > 0 ? planes[0].id : ''
    });
    setFoto(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const resetSuccess = () => {
    setSuccessData(null);
    setStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!formData.nombre.trim() || !formData.dni.trim() || !formData.plan_id) {
      setErrorMessage('Por favor, completa los campos obligatorios (Nombre, DNI y Plan).');
      return;
    }

    if (!foto) {
      setErrorMessage('Por favor, captura o sube una foto del socio.');
      return;
    }

    try {
      // 1. Subida a Cloudinary
      setStatus('uploading');
      
      const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudinaryCloudName || !cloudinaryPreset) {
        throw new Error('Faltan las variables de entorno de Cloudinary.');
      }

      const uploadData = new FormData();
      uploadData.append('file', foto);
      uploadData.append('upload_preset', cloudinaryPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) {
        throw new Error('Error de conexión al subir la imagen a Cloudinary.');
      }

      const cloudinaryResponse = await res.json();
      const publicId = cloudinaryResponse.public_id;

      // 2. Guardar en Base de Datos vía Server Action
      setStatus('saving');
      
      const result = await crearSocio({
        ...formData,
        foto_url: publicId
      });

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al crear el socio.');
      }

      setStatus('success');
      setSuccessData(result);
      clearForm();

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Ocurrió un error inesperado durante el registro.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-slate-100">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Socio Registrado!</h2>
          <p className="text-slate-600 mb-8">El socio ha sido guardado exitosamente en el sistema con su plan activo.</p>
          
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200 flex flex-col items-center">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Código de Acceso QR</p>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(successData?.codigoQr)}&margin=10`} 
                alt="QR de Acceso" 
                className="w-32 h-32 object-contain" 
              />
            </div>
            
            <p className="text-xl font-mono font-bold text-slate-800 tracking-widest mb-6">{successData?.codigoQr}</p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <a 
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(successData?.codigoQr)}&margin=10`} 
                download={`QR-${formData.nombre.replace(/\s+/g, '-')}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 px-4 rounded-xl text-sm text-center transition-colors shadow-sm"
              >
                Descargar QR
              </a>
              <a 
                href={`/socio/${successData?.socioId}`} 
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-xl text-sm text-center transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Ver Carnet <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          </div>

          <button 
            onClick={resetSuccess}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md shadow-red-500/20"
          >
            Registrar otro socio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Registrar Nuevo Socio</h1>
          <p className="text-slate-500 mt-2">Ingresa los datos personales y asigna un plan para dar de alta al nuevo miembro.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Columna Izquierda: Datos Personales */}
            <div className="lg:col-span-7 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Información del Socio
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900"
                    placeholder="Ej. Juan Pérez"
                    disabled={status === 'uploading' || status === 'saving'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-2">DNI / Documento *</label>
                    <input
                      type="text"
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900"
                      placeholder="Ej. 12345678"
                      disabled={status === 'uploading' || status === 'saving'}
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900"
                      placeholder="Ej. 70012345"
                      disabled={status === 'uploading' || status === 'saving'}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="plan_id" className="block text-sm font-medium text-slate-700 mb-2">Plan a Asignar *</label>
                  {loadingPlanes ? (
                    <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 animate-pulse">
                      Cargando planes disponibles...
                    </div>
                  ) : (
                    <select
                      id="plan_id"
                      name="plan_id"
                      value={formData.plan_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-slate-50 focus:bg-white appearance-none cursor-pointer text-slate-900"
                      disabled={status === 'uploading' || status === 'saving'}
                    >
                      <option value="" disabled>Seleccione un plan</option>
                      {planes.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre} - Bs. {plan.precio} ({plan.duracion_meses} {plan.duracion_meses === 1 ? 'mes' : 'meses'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Foto de Perfil */}
            <div className="lg:col-span-5 p-6 lg:p-10 bg-slate-50/50 flex flex-col">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Foto de Perfil *
              </h3>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 relative group flex items-center justify-center mb-8">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                  
                  {/* Overlay en hover para cambiar imagen */}
                  {previewUrl && status === 'idle' && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium drop-shadow-md">Cambiar Foto</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="user"
                    className="hidden" 
                    ref={cameraInputRef} 
                    onChange={handleFileChange}
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={status === 'uploading' || status === 'saving'}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    Tomar Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status === 'uploading' || status === 'saving'}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Subir Archivo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer y Acciones */}
          <div className="bg-slate-50/80 p-6 lg:px-10 lg:py-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="w-full sm:w-auto">
              {errorMessage && (
                <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 flex items-center">
                  <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {errorMessage}
                </div>
              )}
              {status === 'uploading' && (
                <div className="text-red-600 flex items-center font-medium">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Subiendo imagen a Cloudinary...
                </div>
              )}
              {status === 'saving' && (
                <div className="text-red-600 flex items-center font-medium">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Guardando socio en la base de datos...
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'uploading' || status === 'saving'}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 disabled:opacity-70 flex items-center justify-center min-w-[200px]"
            >
              {status === 'uploading' || status === 'saving' ? 'Procesando...' : 'Registrar Socio'}
            </button>
            
          </div>
        </form>
      </div>
    </div>
  );
}
