"use client"

import { useState, useEffect } from 'react';
import { obtenerResumenDashboard } from './actions';

const getWhatsAppLink = (telefono: string, mensaje: string) => {
  const cleanNum = telefono.replace(/\D/g, '');
  if (!cleanNum) return '';
  let finalNum = cleanNum;
  if (cleanNum.length === 8) {
    finalNum = '591' + cleanNum;
  }
  return `https://wa.me/${finalNum}?text=${encodeURIComponent(mensaje)}`;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('mensual');

  // Tooltip flotante del heatmap
  const [hoveredCell, setHoveredCell] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const fetchDashboardData = async (filtroRango: 'mensual' | 'trimestral' | 'semestral' | 'anual') => {
    setLoading(true);
    const res = await obtenerResumenDashboard(filtroRango);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData(rango);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango]);

  const totalRevenue = data?.metricas?.ingresosMes || 0;
  const efectivoAmount = data?.metodosPago?.efectivo || 0;
  const transferenciaAmount = data?.metodosPago?.transferencia || 0;

  const efectivoPercent = totalRevenue > 0 ? (efectivoAmount / totalRevenue) * 100 : 0;
  const transferenciaPercent = totalRevenue > 0 ? (transferenciaAmount / totalRevenue) * 100 : 0;

  // Pre-indexar el heatmap en una matriz 34 bloques x 7 días
  const gridData: any[][] = Array(34).fill(0).map(() => Array(7).fill(null));
  if (data?.tendencias?.heatmap) {
    data.tendencias.heatmap.forEach((h: any) => {
      if (h.bloque >= 0 && h.bloque < 34 && h.dia >= 0 && h.dia < 7) {
        gridData[h.bloque][h.dia] = h;
      }
    });
  }

  const blockLabels: string[] = [];
  for (let h = 6; h <= 22; h++) {
    const hourStr = String(h).padStart(2, '0');
    blockLabels.push(`${hourStr}:00`);
    blockLabels.push(`${hourStr}:30`);
  }

  const diasSemanaNombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handleMouseMove = (e: React.MouseEvent, cell: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.parentElement?.parentElement;
    const containerRect = container?.getBoundingClientRect();
    
    // Posicionar respecto al contenedor del heatmap
    const x = e.clientX - (containerRect?.left || 0) + 15;
    const y = e.clientY - (containerRect?.top || 0) - 85;
    
    setHoveredCell(cell);
    setTooltipPos({ x, y });
  };

  const getCellColorClass = (occupancy: number) => {
    if (occupancy === 0) return 'bg-zinc-950/40 border border-zinc-900/30 text-zinc-650';
    if (occupancy >= 86) {
      return 'bg-red-500/20 border border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]';
    } else if (occupancy >= 66) {
      return 'bg-amber-500/20 border border-amber-500/20 text-amber-300';
    } else if (occupancy >= 41) {
      return 'bg-emerald-500/20 border border-emerald-500/20 text-emerald-300';
    } else if (occupancy >= 16) {
      return 'bg-emerald-900/30 border border-emerald-900/20 text-emerald-400';
    } else {
      return 'bg-emerald-950/15 border border-emerald-950/10 text-emerald-500';
    }
  };

  const getOcupacionLabel = (occupancy: number) => {
    if (occupancy === 0) return 'Vacío';
    if (occupancy >= 86) return 'Saturación Crítica (Pico)';
    if (occupancy >= 66) return 'Concurrencia Moderada/Alta';
    if (occupancy >= 41) return 'Concurrencia Saludable';
    return 'Baja Afluencia';
  };

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera & Filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-900/30 tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Panel de Control Principal
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Dashboard General</h1>
            <p className="text-zinc-400 mt-1">Análisis predictivo de concurrencia y aforo en tiempo real.</p>
          </div>

          {/* Selector de Filtros Temporales */}
          <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 backdrop-blur-md">
            {[
              { id: 'mensual', label: 'Mensual' },
              { id: 'trimestral', label: 'Trimestral' },
              { id: 'semestral', label: 'Semestral' },
              { id: 'anual', label: 'Anual' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setRango(f.id as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
                  rango === f.id
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. KPIs (Tarjetas Superiores) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Socios Activos */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 hover:border-amber-900/40 transition-colors duration-300">
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
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 hover:border-zinc-700 transition-colors duration-300">
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
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 hover:border-zinc-700 transition-colors duration-300">
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
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40 hover:border-amber-900/40 transition-colors duration-300">
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

        {/* 2. Sección del Medio: Mapa de Calor (Heatmap) y KPIs Predictivos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MAPA DE CALOR (Heatmap) - Toma 8 de 12 columnas en screens grandes */}
          <div className="lg:col-span-8 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-6 lg:p-8 shadow-xl relative transition-all duration-300">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  Distribución de Concurrencia (Mapa de Calor)
                </h3>
                <p className="text-zinc-500 text-xs mt-1">Ocupación promediada por día y bloques de 30 minutos.</p>
              </div>

              {/* Rango de Colores Leyenda */}
              <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-950/40 border border-emerald-900/40 inline-block"></span>
                  <span>0% - 65%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/20 inline-block"></span>
                  <span>66% - 85%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/20 inline-block animate-pulse"></span>
                  <span>86%+</span>
                </div>
              </div>
            </div>

            {/* Contenedor del Mapa de Calor */}
            <div className="relative border border-zinc-800 rounded-2xl p-4 bg-zinc-950/30 overflow-x-auto min-w-full">
              {loading ? (
                <div className="flex flex-col gap-2 py-20 items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-amber-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="text-zinc-500 text-xs font-medium">Procesando registros de check-ins...</p>
                </div>
              ) : (
                <div className="min-w-[640px] relative">
                  
                  {/* Tooltip Emergente */}
                  {hoveredCell && (
                    <div 
                      className="absolute z-40 bg-zinc-900 border border-zinc-750 text-white p-3 rounded-xl shadow-2xl flex flex-col gap-1.5 pointer-events-none text-xs w-52 backdrop-blur-md transition-all duration-75"
                      style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                    >
                      <div className="flex justify-between items-center font-black border-b border-zinc-800 pb-1 text-zinc-300">
                        <span>{hoveredCell.diaNombre}</span>
                        <span className="text-amber-500">{hoveredCell.bloqueLabel}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-zinc-500">Promedio:</span>
                        <span className="font-bold">{hoveredCell.avgVisits} {hoveredCell.avgVisits === 1 ? 'persona' : 'personas'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Ocupación:</span>
                        <span className={`font-black ${hoveredCell.occupancy >= 86 ? 'text-red-400' : hoveredCell.occupancy >= 66 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {hoveredCell.occupancy}%
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium italic mt-0.5 text-center">
                        {getOcupacionLabel(hoveredCell.occupancy)}
                      </div>
                    </div>
                  )}

                  {/* Layout Grid: 8 columnas (Labels + 7 días) */}
                  <div className="grid grid-cols-[70px_repeat(7,_1fr)] gap-1 text-center items-center">
                    
                    {/* Headers Fila 1 */}
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-left pl-1">Horas</div>
                    {diasSemanaNombres.map((name, i) => (
                      <div key={i} className="text-xs font-black text-white py-1">{name}</div>
                    ))}

                    {/* Filas de los 34 bloques */}
                    {blockLabels.map((label, bIdx) => {
                      // Solo mostramos etiquetas cada hora para evitar sobrecargar visualmente el eje Y
                      const showLabel = bIdx % 2 === 0;
                      
                      return (
                        <div key={bIdx} className="contents">
                          {/* Columna 1: Label del bloque */}
                          <div className="text-[10px] font-bold text-zinc-650 text-left pl-1 h-5 flex items-center">
                            {showLabel ? label : ''}
                          </div>

                          {/* Columnas 2 a 8: Celdas del día */}
                          {Array(7).fill(0).map((_, dIdx) => {
                            const cell = gridData[bIdx][dIdx];
                            const occupancy = cell ? cell.occupancy : 0;
                            const colorClass = getCellColorClass(occupancy);

                            return (
                              <div
                                key={dIdx}
                                onMouseMove={(e) => handleMouseMove(e, cell)}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`h-5 rounded-md cursor-pointer transition-all duration-300 ${colorClass}`}
                              ></div>
                            );
                          })}
                        </div>
                      );
                    })}

                  </div>

                </div>
              )}
            </div>

            {/* Leyenda del Eje / Top 3 de Días (Parte Inferior del Mapa) */}
            {!loading && data?.tendencias?.kpis?.topDias && (
              <div className="mt-4 border-t border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <span className="text-zinc-500">Top 3 días más concurridos:</span>
                <span className="font-black text-amber-500 tracking-wide bg-amber-950/20 px-4 py-1.5 rounded-full border border-amber-900/30">
                  {data.tendencias.kpis.topDias}
                </span>
              </div>
            )}

          </div>

          {/* KPIS PREDICTIVOS & MÉTODOS DE PAGO - Toma 4 de 12 columnas */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* KPI Predictivo 1: Rango más Vacío (Oportunidad Comercial) */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-xl flex items-center gap-4 hover:border-emerald-900/30 transition-colors duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rango más Vacío (Oportunidad)</span>
                {loading ? (
                  <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-sm font-black text-white mt-1 truncate" title={data?.tendencias?.kpis?.oportunidad}>
                    {data?.tendencias?.kpis?.oportunidad || 'Sin registros'}
                  </p>
                )}
                <p className="text-[10px] text-emerald-500/80 font-medium mt-0.5">Ideal para promociones u horas felices.</p>
              </div>
            </div>

            {/* KPI Predictivo 2: Rango más Crítico (Saturación) */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-xl flex items-center gap-4 hover:border-red-900/30 transition-colors duration-300">
              <div className="w-12 h-12 rounded-2xl bg-red-950/50 text-red-400 border border-red-900/30 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-sans">Rango más Crítico (Saturación)</span>
                {loading ? (
                  <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-sm font-black text-white mt-1 truncate" title={data?.tendencias?.kpis?.saturacion}>
                    {data?.tendencias?.kpis?.saturacion || 'Sin registros'}
                  </p>
                )}
                <p className="text-[10px] text-red-400/80 font-medium mt-0.5">Evitar congestión / Reforzar personal.</p>
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-72">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                  <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Métodos de Pago (Mes)
                </h3>
                <p className="text-zinc-500 text-[10px] leading-relaxed">Distribución de ingresos del mes calendario en curso.</p>
              </div>

              {loading ? (
                <div className="space-y-4 my-auto">
                  <div className="h-10 bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-10 bg-zinc-800 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-5 my-auto">
                  {/* Efectivo */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-zinc-400">Efectivo</span>
                      <span className="text-white">Bs {efectivoAmount.toLocaleString('es-BO')} <span className="text-zinc-500 text-[10px] font-normal">({efectivoPercent.toFixed(1)}%)</span></span>
                    </div>
                    <div className="w-full bg-zinc-950 border border-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                        style={{ width: `${efectivoPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Transferencia */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-zinc-400">Transferencia Bancaria</span>
                      <span className="text-white">Bs {transferenciaAmount.toLocaleString('es-BO')} <span className="text-zinc-500 text-[10px] font-normal">({transferenciaPercent.toFixed(1)}%)</span></span>
                    </div>
                    <div className="w-full bg-zinc-950 border border-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-zinc-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${transferenciaPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-[10px] text-zinc-500">
                <span>Monto Total Cobrado</span>
                <span className="font-bold text-zinc-300">Bs {totalRevenue.toLocaleString('es-BO')}</span>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Sección Inferior: Alertas Operativas / Impacto en el Bolsillo */}
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

            {/* Retención Inteligente */}
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

            {/* Fugas de Caja */}
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

      </div>
    </div>
  );
}
