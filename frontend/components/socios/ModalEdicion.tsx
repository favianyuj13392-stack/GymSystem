"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { Socio } from '@/types/socio';
import { actualizarSocio } from '@/app/admin/socios/actions';

interface ModalEdicionProps {
  isOpen: boolean;
  socio: Socio | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEdicion({
  isOpen,
  socio,
  onClose,
  onSuccess,
}: ModalEdicionProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (socio) {
      setNombre(socio.nombre || '');
      setApellido(socio.apellido || '');
      setEmail(socio.email || '');
      setFechaNacimiento(socio.fecha_nacimiento || '');
      setDni(socio.dni || '');
      setTelefono(socio.telefono || '');
      setFotoPreview(socio.foto_url || null);
      setFotoFile(null);
      setErrorMsg('');
      setStatus('idle');
    }
  }, [socio]);

  if (!isOpen || !socio) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhotoToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'gymcontrol_unsigned');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error('Error al subir la imagen a Cloudinary');
    }

    const data = await res.json();
    return data.public_id;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (dni && !/^\d+$/.test(dni.trim())) {
      setErrorMsg('El DNI debe contener únicamente números.');
      return;
    }

    if (fechaNacimiento) {
      const birthDate = new Date(fechaNacimiento);
      const today = new Date();
      if (birthDate > today) {
        setErrorMsg('La fecha de nacimiento no puede ser una fecha futura.');
        return;
      }
    }

    try {
      let publicId = socio.foto_url || undefined;

      if (fotoFile) {
        setStatus('uploading');
        publicId = await uploadPhotoToCloudinary(fotoFile);
      }

      setStatus('saving');
      const res = await actualizarSocio(socio.id, {
        nombre,
        apellido,
        email,
        fecha_nacimiento: fechaNacimiento,
        dni,
        telefono,
        foto_url: publicId,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al actualizar socio.');
        setStatus('error');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error durante la actualización.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Editar Socio</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errorMsg && (
            <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nombre *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={status === 'uploading' || status === 'saving'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Apellido *</label>
                <input
                  type="text"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={status === 'uploading' || status === 'saving'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={status === 'uploading' || status === 'saving'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Fecha Nacimiento</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  disabled={status === 'uploading' || status === 'saving'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">DNI *</label>
                <input
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={status === 'uploading' || status === 'saving'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={status === 'uploading' || status === 'saving'}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">Foto de Perfil</label>
              <div className="flex items-center gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                  {fotoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <input type="file" accept="image/*" capture="user" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      Cámara
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Subir archivo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={status === 'uploading' || status === 'saving'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={status === 'uploading' || status === 'saving'}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
            >
              {status === 'uploading' || status === 'saving' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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
  );
}
