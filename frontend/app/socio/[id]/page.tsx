"use client"

import { useState, useEffect, useRef, use } from 'react';
import Image from 'next/image';
import { obtenerDatosSocio } from './actions';

const cloudinaryLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
};

export default function CarnetDigitalPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const socioId = unwrappedParams.id;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      });

      const link = document.createElement('a');
      link.download = `carnet-${data?.socio?.nombre || 'socio'}-${data?.socio?.dni || 'qr'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al generar la imagen del carnet:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl text-center max-w-sm w-full shadow-2xl">
          <h1 className="text-xl font-bold text-red-500 mb-2">Socio No Encontrado</h1>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { socio, membresia, estado } = data;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(socio.codigo_qr)}&margin=10`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      
      {/* Contenedor del Carnet para Descarga */}
      <div ref={cardRef} className="w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl relative border border-slate-200">
        
        {/* Banner Superior con color según estado */}
        <div className={`h-32 ${estado === 'activo' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
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
        <div className="text-center px-6 pt-4 pb-4">
          <h1 className="text-2xl font-black text-slate-800 leading-tight">{socio.nombre} {socio.apellido || ''}</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">DNI: {socio.dni}</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-slate-100">
            {estado === 'activo' ? (
              <><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-emerald-700 uppercase tracking-wider">Activo</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-red-700 uppercase tracking-wider">Vencido</span></>
            )}
          </div>
        </div>

        {/* Zona del QR */}
        <div className="bg-slate-50 px-6 py-6 border-t border-slate-100 flex flex-col items-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">Código de Acceso</p>
          
          <div className={`p-4 bg-white rounded-2xl shadow-sm border-2 ${estado === 'activo' ? 'border-emerald-100' : 'border-red-100'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="QR de Acceso" className="w-44 h-44 object-contain" />
          </div>

          <p className="text-[11px] text-slate-400 font-mono mt-3">ID: {socio.codigo_qr}</p>
        </div>
      </div>

      {/* Botones de Acción (Descargar / Compartir) */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {downloading ? (
            <span>Generando Imagen...</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Descargar Carnet</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {copied ? (
            <span className="text-emerald-400">¡Enlace Copiado!</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copiar Link</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
