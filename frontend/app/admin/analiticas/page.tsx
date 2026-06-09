"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { obtenerResumenMetricas, obtenerClientesEnRiesgo, obtenerEstadisticasHorarios } from './actions';

// Loader inline de Cloudinary para next/image
const cloudinaryLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
};

export default function AnaliticasRetencionPage() {
  const [metricas, setMetricas] = useState<any>(null);
  const [enRiesgo, setEnRiesgo] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [resMetricas, resRiesgo, resHorarios] = await Promise.all([
        obtenerResumenMetricas(),
        obtenerClientesEnRiesgo(),
        obtenerEstadisticasHorarios()
      ]);
      
      setMetricas(resMetricas);
      setEnRiesgo(resRiesgo);
      
      // Filtramos horarios razonables para la gráfica de barras (6 AM a 10 PM)
      const activeHours = resHorarios.filter(h => h.hora >= 6 && h.hora <= 22);
      setHorarios(activeHours);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const generarLinkWa = (socio: any) => {
    if (!socio.telefono) return '#';
    const num = socio.telefono.replace(/\D/g, ''); 
    // Añadimos el prefijo de Bolivia automáticamente si es un número local de 8 dígitos
    const parsedNum = num.length === 8 ? `591${num}` : num;
    const msg = `Hola ${socio.nombre}, te extrañamos en el gimnasio. Notamos que llevas ${socio.diasAusente} días sin venir a entrenar. ¡Anímate a retomar tu rutina! 💪`;
    return `https://wa.me/${parsedNum}?text=${encodeURIComponent(msg)}`;
  };

  // Cálculos para el gráfico de barras
  const maxConteo = horarios.length > 0 ? Math.max(...horarios.map(h => h.conteo)) : 0;
  // Para la hora muerta, consideramos el menor valor que sea mayor a 0 (si existe alguno)
  const conteosPositivos = horarios.map(h => h.conteo).filter(c => c > 0);
  const minConteo = conteosPositivos.length > 0 ? Math.min(...conteosPositivos) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inteligencia y Retención</h1>
          <p className="text-slate-500 mt-1">Monitorea tus KPIs, la concurrencia y recupera clientes inactivos.</p>
        </div>

        {/* 1. KPIs (Tarjetas Superiores) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta Socios Activos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30 relative z-10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Socios Activos</p>
              {loading ? (
                <div className="h-10 w-24 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-4xl font-black text-slate-800">{metricas?.sociosActivos}</p>
              )}
            </div>
          </div>

          {/* Tarjeta Ingresos */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 relative z-10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Ingresos (Mes)</p>
              {loading ? (
                <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-4xl font-black text-slate-800">Bs {metricas?.ingresosMes?.toLocaleString('es-BO')}</p>
              )}
            </div>
          </div>

          {/* Tarjeta Alertas */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full blur-2xl"></div>
             <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30 relative z-10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Clientes Alerta</p>
              {loading ? (
                <div className="h-10 w-24 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-4xl font-black text-slate-800">{metricas?.clientesAlerta}</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Sección Principal Dividida (Gráfico y Retención) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Gráfico de Horarios Concurrentes (Ocupa 2 columnas) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Concurrencia por Hora
            </h3>
            <p className="text-slate-500 mb-8">Volumen histórico de asistencias agrupadas por hora del día.</p>
            
            <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 h-64 mt-auto">
              {loading ? (
                // Skeletons de barras
                Array(16).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 bg-slate-100 rounded-t-md animate-pulse" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                ))
              ) : (
                horarios.map((h, i) => {
                  const heightPercent = maxConteo > 0 ? (h.conteo / maxConteo) * 100 : 0;
                  const isPico = maxConteo > 0 && h.conteo === maxConteo;
                  const isMuerta = maxConteo > 0 && h.conteo > 0 && h.conteo === minConteo;

                  let barColor = "bg-red-200 group-hover:bg-red-300";
                  let labelColor = "text-slate-400";
                  if (isPico) {
                    barColor = "bg-red-600 group-hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
                    labelColor = "text-red-600 font-bold";
                  } else if (isMuerta) {
                    barColor = "bg-green-400 group-hover:bg-green-500";
                    labelColor = "text-green-600 font-bold";
                  } else if (h.conteo > 0) {
                    barColor = "bg-red-50 group-hover:bg-red-100 border border-red-200";
                  }

                  return (
                    <div key={h.hora} className="flex flex-col items-center flex-1 h-full justify-end group">
                      {/* Tooltip Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {h.conteo}
                      </div>
                      
                      {/* Barra */}
                      <div 
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 ${barColor}`} 
                        style={{ height: `${Math.max(heightPercent, 2)}%` }} // Mínimo 2% para que se vea la barra si es 0
                      ></div>
                      
                      {/* Etiqueta de Hora */}
                      <div className={`mt-3 text-[10px] sm:text-xs text-center -rotate-45 sm:rotate-0 transform origin-top-left sm:origin-center ${labelColor}`}>
                        {h.label}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {!loading && maxConteo > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-6 pt-6 border-t border-slate-100 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600"></div><span className="font-medium text-slate-700">Hora Pico</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-300"></div><span className="font-medium text-slate-700">Trafico Normal</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400"></div><span className="font-medium text-slate-700">Hora Muerta</span></div>
              </div>
            )}
          </div>

          {/* Módulo de Retención (Alertas de Abandono) */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px] lg:h-auto">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Alertas de Abandono
              </h3>
              <p className="text-sm text-slate-500 mt-1">Socios ausentes por 14 días o más.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 animate-pulse">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="flex-1 py-1"><div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-200 rounded w-1/2"></div></div>
                    </div>
                  ))}
                </div>
              ) : enRiesgo.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <p className="text-lg font-medium text-slate-600">¡Excelente retención!</p>
                  <p className="text-sm mt-1">No hay clientes en riesgo de abandono.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {enRiesgo.map(socio => (
                    <li key={socio.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                           {socio.foto_url ? (
                            <Image loader={cloudinaryLoader} src={socio.foto_url} alt={socio.nombre} fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{socio.nombre}</p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${socio.diasAusente > 21 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                              {socio.diasAusente} días ausente
                            </span>
                            {socio.esVencido && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500">
                                Vencido
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <a 
                        href={generarLinkWa(socio)} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                          socio.telefono 
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                        onClick={(e) => { if(!socio.telefono) e.preventDefault(); }}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                        </svg>
                        {socio.telefono ? 'Recuperar por WhatsApp' : 'Sin número registrado'}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
