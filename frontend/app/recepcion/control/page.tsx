"use client"

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { procesarAcceso, obtenerSociosActivosEnGym, registrarSalida } from './actions';

type StatusType = 'idle' | 'loading' | 'concedido' | 'vencido' | 'no_registrado' | 'error';

// Loader inline de Cloudinary para next/image
const cloudinaryLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
};

export default function RecepcionControlPage() {
  const [status, setStatus] = useState<StatusType>('idle');
  const [resultado, setResultado] = useState<any>(null);
  const [sociosActivos, setSociosActivos] = useState<any[]>([]);
  const [cameraError, setCameraError] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'list'>('scanner');

  const isProcessingRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  // 1. Cargar Socios Activos Iniciales
  useEffect(() => {
    const fetchActivos = async () => {
      const activos = await obtenerSociosActivosEnGym();
      setSociosActivos(activos);
    };
    fetchActivos();
  }, []);

  // 2. Inicializar Escáner de Cámara (import dinámico para evitar errores SSR en Vercel)
  useEffect(() => {
    let isMounted = true;

    const initScanner = async () => {
      try {
        // Import dinámico: solo se ejecuta en el browser, nunca en el servidor
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        scannerRef.current = new Html5Qrcode("qr-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            handleScan(decodedText);
          },
          () => {
            // Ignorar errores continuos de lectura frame por frame
          }
        );
        if (isMounted) setCameraError(false);
      } catch (err) {
        console.error("Error iniciando cámara:", err);
        if (isMounted) setCameraError(true);
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Lógica de Procesamiento del Código QR
  const handleScan = async (codigoQr: string) => {
    if (isProcessingRef.current) return;
    
    // Pausar escáner para no leer el mismo QR 10 veces por segundo
    isProcessingRef.current = true;
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.pause();
    }

    setStatus('loading');
    setResultado(null);

    const response = await procesarAcceso(codigoQr.trim());

    setStatus(response.status as StatusType);
    setResultado({
      socio: 'socio' in response ? response.socio : null,
      membresia: 'membresia' in response ? response.membresia : null,
    });

    // Si es exitoso, añadirlo a la lista de activos
    if (response.status === 'concedido' && 'socio' in response) {
      const nuevoActivo = {
        id: response.socio.id,
        nombre: response.socio.nombre,
        foto_url: response.socio.foto_url,
        dni: response.socio.dni,
        horaEntrada: new Date().toISOString()
      };
      
      setSociosActivos(prev => {
        // Evitar duplicados si lee muy rápido
        if (prev.find(s => s.id === nuevoActivo.id)) return prev;
        return [nuevoActivo, ...prev];
      });
    }

    // Reactivar escáner después de 3 segundos para el siguiente socio
    setTimeout(() => {
      setStatus('idle');
      setResultado(null);
      isProcessingRef.current = false;
      if (scannerRef.current && scannerRef.current.getState() === 2 /* PAUSED */) {
        scannerRef.current.resume();
      }
    }, 4000);
  };

  // 4. Lógica para dar Salida a un Socio
  const handleDarSalida = async (socioId: string) => {
    setRemovingId(socioId); // Para animación
    const res = await registrarSalida(socioId);
    
    if (res.success) {
      setTimeout(() => {
        setSociosActivos(prev => prev.filter(s => s.id !== socioId));
        setRemovingId(null);
      }, 300); // Esperar que termine la animación
    } else {
      setRemovingId(null);
      alert('Error al registrar la salida.');
    }
  };

  // Render Panel Principal
  const renderPanel = () => {
    if (status === 'idle') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in zoom-in duration-300">
          <svg className="w-24 h-24 mb-4 opacity-50 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-8v4h8v-4zm-6-6h.01M12 12h.01M16 12h.01M12 16h.01M16 16h.01M8 12h.01M8 16h.01M4 8h16M4 16h16M4 12h16m-2-8H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2z" /></svg>
          <h2 className="text-3xl font-semibold text-slate-700">Listo para escanear</h2>
          <p className="mt-2 text-lg">Muestre el código QR del socio a la cámara</p>
        </div>
      );
    }

    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-red-500 mb-6"></div>
          <h2 className="text-4xl font-bold animate-pulse">Verificando Identidad...</h2>
        </div>
      );
    }

    if (status === 'concedido') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-green-500 text-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <svg className="w-64 h-64" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
          </div>
          
          <div className="z-10 flex flex-col items-center w-full">
            <div className="relative w-44 h-44 mb-6 rounded-full overflow-hidden border-8 border-white shadow-2xl bg-slate-200">
              {resultado?.socio?.foto_url ? (
                <Image loader={cloudinaryLoader} src={resultado.socio.foto_url} alt="Foto Socio" fill className="object-cover" sizes="176px" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500"><svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
              )}
            </div>

            <h1 className="text-5xl lg:text-7xl font-black mb-2 tracking-tight drop-shadow-md text-center">¡ACCESO CONCEDIDO!</h1>
            <h2 className="text-4xl font-bold mb-6 drop-shadow-sm">{resultado?.socio?.nombre}</h2>
            
            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center">
                <p className="text-sm uppercase tracking-widest opacity-90 mb-1 font-semibold">Plan Actual</p>
                <p className="text-2xl font-bold">{resultado?.membresia?.planes?.nombre || 'Activo'}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center">
                <p className="text-sm uppercase tracking-widest opacity-90 mb-1 font-semibold">Vencimiento</p>
                <p className="text-2xl font-bold">{resultado?.membresia?.fecha_fin}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'vencido') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-red-600 text-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <svg className="w-64 h-64" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>

          <div className="z-10 flex flex-col items-center w-full">
            <div className="relative w-44 h-44 mb-6 rounded-full overflow-hidden border-8 border-white shadow-2xl bg-slate-200">
              {resultado?.socio?.foto_url ? (
                <Image loader={cloudinaryLoader} src={resultado.socio.foto_url} alt="Foto Socio" fill className="object-cover" sizes="176px" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500"><svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
              )}
            </div>

            <h1 className="text-5xl lg:text-7xl font-black mb-2 tracking-tight drop-shadow-md text-center">ACCESO DENEGADO</h1>
            <h2 className="text-3xl font-bold mb-4 drop-shadow-sm text-red-200">MEMBRESÍA VENCIDA</h2>
            <h3 className="text-4xl font-bold mb-6 drop-shadow-sm">{resultado?.socio?.nombre}</h3>
            
            <div className="bg-red-900/40 backdrop-blur-md rounded-2xl p-6 border border-red-500/30 text-center w-full max-w-2xl">
              <p className="text-sm uppercase tracking-widest opacity-90 mb-2 font-semibold text-red-200">Por favor, regularice su situación</p>
              <p className="text-2xl font-bold mb-1">Teléfono: {resultado?.socio?.telefono || 'No registrado'}</p>
              <p className="text-xl opacity-90">Venció el: {resultado?.membresia?.fecha_fin || 'N/A'}</p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'no_registrado') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-orange-500 text-white rounded-[2rem] shadow-2xl p-8 animate-in zoom-in duration-300">
          <div className="bg-white text-orange-500 rounded-full p-6 mb-6 shadow-xl">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black mb-4 tracking-tight text-center drop-shadow-md">CÓDIGO NO REGISTRADO</h1>
          <p className="text-2xl mt-2 opacity-90 text-center max-w-2xl font-medium">
            El código escaneado es inválido o no existe en la base de datos.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-4rem)] lg:m-8 lg:gap-8 bg-slate-50">
      
      {/* Pestañas para mobile/tablet */}
      <div className="flex lg:hidden bg-slate-100 p-1.5 rounded-2xl mx-4 mt-4 shrink-0 border border-slate-200">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === 'scanner'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Escanear / Acceso
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === 'list'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Socios en el Gym
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
            {sociosActivos.length}
          </span>
        </button>
      </div>

      {/* Columna Izquierda: Escáner y Resultados */}
      <div className={`flex-1 flex flex-col gap-6 h-full min-w-0 p-4 lg:p-0 ${activeTab === 'scanner' ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Lector de QR de Video */}
        <div className={`bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden shrink-0 flex flex-col items-center justify-center relative min-h-[300px] ${status === 'idle' ? 'block' : 'hidden lg:block'}`}>
          {cameraError ? (
            <div className="p-8 text-center text-red-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="font-bold">No se pudo acceder a la cámara</p>
              <p className="text-sm mt-2 text-slate-500">Por favor, verifica los permisos del navegador o conecta una cámara web.</p>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <div id="qr-reader" className="w-full h-full object-cover border-none !border-0"></div>
              {/* Overlay estilizado para el escáner */}
              <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900/10 z-10 flex flex-col items-center justify-between py-6">
                 <div className="bg-black/50 text-white px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide backdrop-blur-md">CÁMARA EN VIVO</div>
                 <div className="w-48 h-48 border-4 border-white/60 rounded-[2rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
                 <div></div>
              </div>
            </div>
          )}
        </div>

        {/* Zona de Resultado */}
        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative">
          {renderPanel()}
        </div>
      </div>

      {/* Columna Derecha: Socios en el Gym */}
      <div className={`w-full lg:w-[420px] flex flex-col bg-white lg:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden shrink-0 h-full lg:h-full ${activeTab === 'list' ? 'flex p-4 lg:p-0' : 'hidden lg:flex'}`}>
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Socios en el Gym
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">{sociosActivos.length} personas actualmente</p>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {sociosActivos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4M8 16l-4-4 4-4M16 8l4 4-4 4" /></svg>
              <p className="text-lg font-medium">El gimnasio está vacío.</p>
              <p className="text-sm mt-1">Los socios aparecerán aquí cuando escaneen su entrada.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {sociosActivos.map((socio) => (
                <li 
                  key={socio.id} 
                  className={`bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all ${
                    removingId === socio.id ? 'opacity-0 scale-95 duration-300 pointer-events-none' : 'opacity-100 scale-100 duration-300'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0 border-2 border-green-100">
                      {socio.foto_url ? (
                        <Image loader={cloudinaryLoader} src={socio.foto_url} alt={socio.nombre} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="text-base font-bold text-slate-800 truncate">{socio.nombre}</p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Entró a las {new Date(socio.horaEntrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDarSalida(socio.id)}
                    disabled={removingId === socio.id}
                    className="shrink-0 flex items-center justify-center w-10 h-10 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-xl transition-colors group"
                    title="Dar Salida"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
    </div>
  );
}
