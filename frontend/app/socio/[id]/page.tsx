"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { use } from 'react';
import { obtenerDatosSocio } from './actions';

// Loader inline de Cloudinary
const cloudinaryLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
};

export default function CarnetDigitalPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const socioId = unwrappedParams.id;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDatos = async () => {
      const result = await obtenerDatosSocio(socioId);
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Socio no encontrado');
      }
      setLoading(false);
    };
    fetchDatos();
  }, [socioId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const { socio, membresia, estado } = data;
  
  // Usamos una API pública para generar la imagen del QR rápidamente
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(socio.codigo_qr)}&margin=10`;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl relative">
        
        {/* Banner Superior con color según estado */}
        <div className={`h-32 ${estado === 'activo' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
        </div>

        {/* Foto Perfil Circular */}
        <div className="flex justify-center -mt-16 relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-lg relative">
            {socio.foto_url ? (
              <Image loader={cloudinaryLoader} src={socio.foto_url} alt={socio.nombre} fill className="object-cover" sizes="128px" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            )}
          </div>
        </div>

        {/* Info Textual */}
        <div className="text-center px-6 pt-4 pb-6">
          <h1 className="text-2xl font-black text-slate-800 leading-tight">{socio.nombre}</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">DNI: {socio.dni}</p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-slate-100">
            {estado === 'activo' ? (
              <><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-green-700 uppercase tracking-wider">Activo</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-red-700 uppercase tracking-wider">Vencido</span></>
            )}
          </div>
        </div>

        {/* Zona del QR */}
        <div className="bg-slate-50 px-6 py-8 border-t border-slate-100 flex flex-col items-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Código de Acceso</p>
          
          <div className={`p-4 bg-white rounded-2xl shadow-sm border-2 ${estado === 'activo' ? 'border-blue-100' : 'border-red-100'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="QR de Acceso" className="w-48 h-48 object-contain" />
          </div>
          
          <p className="text-xs text-slate-400 font-mono mt-4">ID: {socio.codigo_qr}</p>
        </div>

      </div>
    </div>
  );
}
