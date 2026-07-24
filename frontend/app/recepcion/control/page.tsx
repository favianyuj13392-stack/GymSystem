"use client";

import { useState, useEffect, useRef } from 'react';
import { useRecepcion } from '@/hooks/useRecepcion';
import { StatusAcceso, ResultadoAcceso } from '@/types/recepcion';
import { procesarAcceso } from './actions';
import ListaSociosEnGym from '@/components/recepcion/ListaSociosEnGym';
import TarjetasResultadoAcceso from '@/components/recepcion/TarjetasResultadoAcceso';

export default function RecepcionControlPage() {
  const {
    sociosActivos,
    status,
    setStatus,
    resultado,
    setResultado,
    removingId,
    handleSalida,
    refetchSociosActivos,
  } = useRecepcion();

  const [cameraError, setCameraError] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'list'>('scanner');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const isProcessingRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeoutIdRef = useRef<any>(null);

  useEffect(() => {
    const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 1024;
    if (isMobileDevice) {
      setIsCameraActive(true);
    }
  }, []);

  const resetScanState = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setStatus('idle');
    setResultado(null);
    isProcessingRef.current = false;
    if (scannerRef.current) {
      try {
        if (typeof scannerRef.current.getState === 'function' && scannerRef.current.getState() === 3 /* PAUSED */) {
          scannerRef.current.resume();
        }
      } catch (err) {
        console.warn('Escáner no listo para reanudar:', err);
      }
    }
  };

  // Inicializar Escáner QR de la Cámara
  useEffect(() => {
    if (!isCameraActive) return;

    let isMounted = true;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');

        if (!isMounted) return;

        const scanner = new Html5QrcodeScanner(
          'reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scannerRef.current = scanner;

        const onScanSuccess = async (decodedText: string) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;

          if (scannerRef.current) {
            try {
              if (typeof scannerRef.current.getState === 'function' && scannerRef.current.getState() === 2) {
                scannerRef.current.pause(true);
              }
            } catch (err) {
              console.warn('Escáner no activo para pausar (modo imagen/archivo):', err);
            }
          }

          setStatus('loading');

          try {
            const res = await procesarAcceso(decodedText);
            if (!isMounted) return;

            setResultado(res as ResultadoAcceso);
            setStatus(res.status as StatusAcceso);

            if (res.status === 'concedido') {
              refetchSociosActivos();
            }

            timeoutIdRef.current = setTimeout(() => {
              if (isMounted) {
                resetScanState();
              }
            }, 6000);
          } catch (err) {
            console.error('Error al procesar QR:', err);
            if (isMounted) {
              setStatus('error');
              timeoutIdRef.current = setTimeout(() => {
                if (isMounted) resetScanState();
              }, 4000);
            }
          }
        };

        const onScanFailure = () => {
          // Ignorar cuadros fallidos silenciosamente
        };

        scanner.render(onScanSuccess, onScanFailure);
      } catch (error) {
        console.error('Error al iniciar escáner de cámara:', error);
        if (isMounted) setCameraError(true);
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err: unknown) => console.error('Error al limpiar cámara:', err));
      }
    };
  }, [isCameraActive, refetchSociosActivos, setResultado, setStatus]);

  return (
    <div className="h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/15 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 flex flex-col lg:flex-row gap-6 lg:gap-8 font-sans overflow-hidden">
      {/* Pestañas mobile/tablet */}
      <div className="flex lg:hidden bg-zinc-900/60 p-1.5 rounded-2xl mx-4 mt-4 shrink-0 border border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Escáner QR
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'list'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          En el Gym ({sociosActivos.length})
        </button>
      </div>

      {/* Columna Izquierda: Escáner QR o Pantalla de Resultado */}
      <div className={`lg:w-7/12 flex-col h-full ${activeTab === 'scanner' ? 'flex' : 'hidden lg:flex'}`}>
        {status !== 'idle' && status !== 'loading' ? (
          <TarjetasResultadoAcceso resultado={resultado} onReset={resetScanState} />
        ) : (
          <div className="flex-1 flex flex-col justify-between bg-zinc-900/40 rounded-[2rem] border border-zinc-800 p-6 shadow-xl relative overflow-hidden">
            {!isCameraActive ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Cámara Inactiva</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Por motivos de rendimiento y privacidad, la cámara está apagada. Hacé clic abajo para activarla e iniciar el escaneo de accesos.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCameraActive(true)}
                  className="mt-5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Activar Cámara
                </button>
              </div>
            ) : cameraError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-red-400">
                <svg className="w-12 h-12 mb-3 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-bold text-sm">No se pudo acceder a la cámara</p>
                <p className="text-xs text-zinc-500 mt-1">Verificá los permisos de cámara en tu navegador.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
                <div id="reader" className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"></div>

                {status === 'loading' && (
                  <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-20">
                    <svg className="animate-spin h-10 w-10 text-amber-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-bold text-white">Verificando pase de socio...</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center pt-4 border-t border-zinc-850 shrink-0">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Listo para escanear</p>
              <p className="text-xs text-zinc-500 mt-0.5">Muestre el código QR del socio a la cámara.</p>
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha: Socios en el Gym */}
      <div className={`lg:w-5/12 h-full ${activeTab === 'list' ? 'flex' : 'hidden lg:flex'}`}>
        <ListaSociosEnGym
          sociosActivos={sociosActivos}
          removingId={removingId}
          onRegistrarSalida={handleSalida}
        />
      </div>
    </div>
  );
}
