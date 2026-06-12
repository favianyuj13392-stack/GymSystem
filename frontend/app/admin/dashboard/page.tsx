"use client"

import { useState, useEffect } from 'react';
import { obtenerResumenDashboard } from './actions';

const getWhatsAppLink = (telefono: string, mensaje: string) => {
  const cleanNum = telefono.replace(/\D/g, '');
  if (!cleanNum) return '';
  let finalNum = cleanNum;
  // Si tiene 8 dígitos (típico celular en Bolivia) y no empieza con 591, le agregamos el código de país de Bolivia (591)
  if (cleanNum.length === 8) {
    finalNum = '591' + cleanNum;
  }
  return `https://wa.me/${finalNum}?text=${encodeURIComponent(mensaje)}`;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await obtenerResumenDashboard();
      setData(res);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalRevenue = data?.metricas?.ingresosMes || 0;
  const efectivoAmount = data?.metodosPago?.efectivo || 0;
  const transferenciaAmount = data?.metodosPago?.transferencia || 0;

  const efectivoPercent = totalRevenue > 0 ? (efectivoAmount / totalRevenue) * 100 : 0;
  const transferenciaPercent = totalRevenue > 0 ? (transferenciaAmount / totalRevenue) * 100 : 0;

  // Calculo de máximos para gráficas
  const maxHoraConteo = data?.tendencias?.horas?.length > 0 
    ? Math.max(...data.tendencias.horas.map((h: any) => h.conteo)) 
    : 0;

  const maxDiaConteo = data?.tendencias?.dias?.length > 0 
    ? Math.max(...data.tendencias.dias.map((d: any) => d.conteo)) 
    : 0;

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-900/30 tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Panel de Control Principal
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Dashboard General</h1>
            <p className="text-zinc-400 mt-1">Métricas de facturación, socios y asistencia en tiempo real.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Hoy</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* 1. KPIs (Tarjetas Superiores) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Socios Activos */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 group hover:border-amber-900/40 transition-colors duration-300">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Socios Activos</span>
              <div className="w-10 h-10 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-900/30 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-9 w-20 bg-zinc-800 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-black text-white tracking-tight">{data?.metricas?.sociosActivos}</p>
              )}
              <p className="text-xs text-zinc-500 mt-1">Acceso habilitado hoy</p>
            </div>
          </div>

          {/* Socios Vencidos */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 group hover:border-zinc-700 transition-colors duration-300">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Socios Vencidos</span>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-750 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-9 w-20 bg-zinc-800 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-black text-zinc-300 tracking-tight">{data?.metricas?.sociosVencidos}</p>
              )}
              <p className="text-xs text-zinc-500 mt-1">Requieren renovación</p>
            </div>
          </div>

          {/* Total Socios */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 group hover:border-zinc-700 transition-colors duration-300">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Registrados</span>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-750 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-9 w-20 bg-zinc-800 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-black text-white tracking-tight">{data?.metricas?.totalSocios}</p>
              )}
              <p className="text-xs text-zinc-500 mt-1">Cuentas activas totales</p>
            </div>
          </div>

          {/* Ingresos del Mes */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 group hover:border-amber-900/40 transition-colors duration-300">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ingresos del Mes</span>
              <div className="w-10 h-10 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-900/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-9 w-32 bg-zinc-800 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-black text-amber-500 tracking-tight">Bs {totalRevenue.toLocaleString('es-BO')}</p>
              )}
              <p className="text-xs text-zinc-500 mt-1">Mes en curso</p>
            </div>
          </div>
        </div>

        {/* --- ALERTAS DE IMPACTO EN EL BOLSILLO --- */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cobros Proactivos (Vencimiento Próximo) */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between min-h-[380px] hover:border-amber-900/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cobros Proactivos
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-950/50 text-amber-400 border border-amber-900/30">
                    {data?.alertas?.vencimientos?.length || 0} próx.
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mb-4">Socios con vencimiento en los próximos 3 días. Asegurá su renovación antes de que dejen de venir.</p>
                
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {data?.alertas?.vencimientos?.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">
                      No hay vencimientos detectados para los próximos 3 días.
                    </div>
                  ) : (
                    data?.alertas?.vencimientos?.map((v: any, index: number) => {
                      const msg = `Hola ${v.nombre}, te recordamos que tu membresía vence el ${new Date(v.fechaFin).toLocaleDateString('es-ES')}. Podés renovarla en recepción para seguir entrenando sin interrupciones. ¡Muchas gracias!`;
                      const link = getWhatsAppLink(v.telefono, msg);
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{v.nombre}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Vence: {new Date(v.fechaFin).toLocaleDateString('es-ES')}</p>
                          </div>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 transition-all duration-300 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm5.824-3.322l.41.244c1.6.953 3.53 1.458 5.72 1.46h.005c5.541 0 10.05-4.507 10.053-10.05.002-2.684-1.042-5.208-2.94-7.11C17.228 3.32 14.711 2.274 12.013 2.274c-5.547 0-10.057 4.51-10.06 10.054-.002 1.899.496 3.754 1.442 5.378l.267.458L2.66 21.3l3.221-.822z" />
                              </svg>
                              Cobrar
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-650 italic">Sin cel</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Retención Inteligente (Riesgo de Churn) */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between min-h-[380px] hover:border-amber-900/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Retención Activa
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-950/50 text-amber-400 border border-amber-900/30">
                    {data?.alertas?.inactivos?.length || 0} inact.
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mb-4">Socios con membresía activa pero que llevan más de 7 días sin venir. Contactalos antes de que abandonen.</p>
                
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {data?.alertas?.inactivos?.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">
                      Todos los socios activos asistieron recientemente. ¡Excelente retención!
                    </div>
                  ) : (
                    data?.alertas?.inactivos?.map((v: any, index: number) => {
                      const msg = `Hola ${v.nombre}, hace una semana que no te vemos por el gym. ¡Te extrañamos en los entrenamientos! Comentanos si necesitás algo o si tuviste algún inconveniente. ¡Esperamos verte pronto!`;
                      const link = getWhatsAppLink(v.telefono, msg);
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{v.nombre}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Último ingreso: {v.ultimaAsistencia}</p>
                          </div>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 transition-all duration-300 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm5.824-3.322l.41.244c1.6.953 3.53 1.458 5.72 1.46h.005c5.541 0 10.05-4.507 10.053-10.05.002-2.684-1.042-5.208-2.94-7.11C17.228 3.32 14.711 2.274 12.013 2.274c-5.547 0-10.057 4.51-10.06 10.054-.002 1.899.496 3.754 1.442 5.378l.267.458L2.66 21.3l3.221-.822z" />
                              </svg>
                              Contactar
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-650 italic">Sin cel</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Fugas de Caja / Alertas de Facturación */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between min-h-[380px] hover:border-amber-900/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Inconsistencias de Caja
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-950/50 text-amber-400 border border-amber-900/30">
                    {data?.alertas?.fugas?.length || 0} fugas
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mb-4">Membresías activas cuyo pago registrado es menor al precio del plan. Evitá pérdidas y desvíos de efectivo.</p>
                
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {data?.alertas?.fugas?.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">
                      No se detectaron inconsistencias de cobros. ¡Todo en orden!
                    </div>
                  ) : (
                    data?.alertas?.fugas?.map((v: any, index: number) => {
                      const msg = `Hola ${v.nombre}, registramos una inconsistencia administrativa en el pago de tu plan ${v.planNombre}. ¿Podrías acercarte a recepción en tu próxima visita? ¡Muchas gracias!`;
                      const link = getWhatsAppLink(v.telefono, msg);
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{v.nombre}</p>
                            <p className="text-[9px] text-zinc-500 mt-0.5">Plan: {v.planNombre} (Bs {v.precioPlan.toLocaleString('es-BO')})</p>
                            <p className="text-[10px] text-amber-500 font-black mt-0.5">Pendiente: Bs {(v.diferencia).toLocaleString('es-BO')}</p>
                          </div>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 transition-all duration-300 flex items-center gap-1"
                            >
                              Regularizar
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-650 italic">Sin cel</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 2. Sección del Medio: Métodos de Pago e Historial */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Métodos de Pago */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col justify-between h-96">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Métodos de Pago (Mes)
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Distribución de ingresos según el método seleccionado.</p>
            </div>

            {loading ? (
              <div className="space-y-4 my-auto">
                <div className="h-12 bg-zinc-800 rounded animate-pulse"></div>
                <div className="h-12 bg-zinc-800 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-6 my-auto">
                {/* Efectivo */}
                <div>
                  <div className="flex justify-between items-center text-sm font-bold mb-2">
                    <span className="text-zinc-300">Efectivo</span>
                    <span className="text-white">Bs {efectivoAmount.toLocaleString('es-BO')} <span className="text-zinc-500 text-xs font-normal">({efectivoPercent.toFixed(1)}%)</span></span>
                  </div>
                  <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                      style={{ width: `${efectivoPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Transferencia */}
                <div>
                  <div className="flex justify-between items-center text-sm font-bold mb-2">
                    <span className="text-zinc-300">Transferencia Bancaria</span>
                    <span className="text-white">Bs {transferenciaAmount.toLocaleString('es-BO')} <span className="text-zinc-500 text-xs font-normal">({transferenciaPercent.toFixed(1)}%)</span></span>
                  </div>
                  <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-zinc-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${transferenciaPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-zinc-800 pt-4 flex justify-between items-center text-xs text-zinc-500">
              <span>Monto Total Cobrado</span>
              <span className="font-bold text-zinc-300">Bs {totalRevenue.toLocaleString('es-BO')}</span>
            </div>
          </div>

          {/* Gráfico Ocupación por Hora (Ocupa 2 columnas) */}
          <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col justify-between h-96">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Ocupación Horaria (Entradas)
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Concurrencia acumulada de asistencia por hora en el rango operativo.</p>
            </div>

            <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 h-44 mt-4 overflow-hidden">
              {loading ? (
                Array(17).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 bg-zinc-800 rounded-t-md animate-pulse" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                ))
              ) : (
                data?.tendencias?.horas?.map((h: any) => {
                  const heightPercent = maxHoraConteo > 0 ? (h.conteo / maxHoraConteo) * 100 : 0;
                  const isPico = maxHoraConteo > 0 && h.conteo === maxHoraConteo;

                  let barColor = "bg-zinc-800 group-hover:bg-zinc-700";
                  let labelColor = "text-zinc-500";
                  
                  if (isPico) {
                    barColor = "bg-gradient-to-t from-amber-600 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]";
                    labelColor = "text-amber-400 font-bold";
                  } else if (h.conteo > 0) {
                    barColor = "bg-amber-950/40 border border-amber-900/40 text-amber-400";
                  }

                  return (
                    <div key={h.hora} className="flex flex-col items-center flex-1 h-full justify-end group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-[10px] font-bold text-white bg-zinc-800 px-1 rounded border border-zinc-750">
                        {h.conteo}
                      </div>
                      <div 
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${barColor}`} 
                        style={{ height: `${Math.max(heightPercent, 3)}%` }}
                      ></div>
                      <span className={`mt-2 text-[9px] sm:text-[10px] tracking-tight ${labelColor}`}>
                        {h.label.split(':')[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 3. Sección Inferior: Concurrencia por Día */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Asistencias por Día de la Semana
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">Distribución de check-ins acumulados según el día.</p>
            </div>

            <div className="grid grid-cols-7 gap-4 mt-8 h-48">
              {loading ? (
                Array(7).fill(0).map((_, i) => (
                  <div key={i} className="bg-zinc-800 rounded-2xl animate-pulse h-full"></div>
                ))
              ) : (
                data?.tendencias?.dias?.map((d: any) => {
                  const heightPercent = maxDiaConteo > 0 ? (d.conteo / maxDiaConteo) * 100 : 0;
                  const isMax = maxDiaConteo > 0 && d.conteo === maxDiaConteo;
                  
                  let barColor = "bg-zinc-800 group-hover:bg-zinc-700";
                  let labelColor = "text-zinc-400";
                  
                  if (isMax) {
                    barColor = "bg-gradient-to-t from-amber-700 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]";
                    labelColor = "text-amber-400 font-bold";
                  } else if (d.conteo > 0) {
                    barColor = "bg-amber-950/30 border border-amber-900/30";
                  }

                  return (
                    <div key={d.dia} className="flex flex-col items-center justify-end h-full group">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs font-bold text-white bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded shadow-lg">
                        {d.conteo}
                      </div>
                      <div className="w-full flex-1 flex flex-col justify-end">
                        <div 
                          className={`w-full rounded-t-2xl transition-all duration-700 ${barColor}`}
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        ></div>
                      </div>
                      <span className={`mt-3 text-xs sm:text-sm font-semibold uppercase tracking-wider ${labelColor}`}>
                        {d.nombre}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
