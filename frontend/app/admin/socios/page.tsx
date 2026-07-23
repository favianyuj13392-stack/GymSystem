"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Socio, Plan, Asistencia, FiltroEstadoSocio } from '@/types/socio';
import { useSocios } from '@/hooks/useSocios';
import {
  obtenerPlanesDisponibles,
  eliminarSocioLogico,
  obtenerAsistenciasSocio,
} from './actions';

import ModalRenovacion from '@/components/socios/ModalRenovacion';
import ModalEdicion from '@/components/socios/ModalEdicion';
import ModalAsistencias from '@/components/socios/ModalAsistencias';
import ModalBaja from '@/components/socios/ModalBaja';

export default function AdminSociosPage() {
  const { socios, loading, busqueda, setBusqueda, filtroEstado, setFiltroEstado, refetchSocios } = useSocios();

  // Modales
  const [isRenovacionOpen, setIsRenovacionOpen] = useState(false);
  const [socioARenovar, setSocioARenovar] = useState<Socio | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);

  const [isEdicionOpen, setIsEdicionOpen] = useState(false);
  const [socioAEditar, setSocioAEditar] = useState<Socio | null>(null);

  const [isAsistenciasOpen, setIsAsistenciasOpen] = useState(false);
  const [socioAsistencias, setSocioAsistencias] = useState<Socio | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);

  const [isBajaOpen, setIsBajaOpen] = useState(false);
  const [socioAEliminar, setSocioAEliminar] = useState<Socio | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cloudinaryLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality || 75}/${src}`;
  };

  // Handlers para abrir modales
  const abrirRenovacion = async (socio: Socio) => {
    setSocioARenovar(socio);
    setIsRenovacionOpen(true);
    const data = await obtenerPlanesDisponibles();
    setPlanes(data);
  };

  const abrirEdicion = (socio: Socio) => {
    setSocioAEditar(socio);
    setIsEdicionOpen(true);
  };

  const abrirAsistencias = async (socio: Socio) => {
    setSocioAsistencias(socio);
    setIsAsistenciasOpen(true);
    setLoadingAsistencias(true);
    const data = await obtenerAsistenciasSocio(socio.id);
    setAsistencias(data as Asistencia[]);
    setLoadingAsistencias(false);
  };

  const abrirBaja = (socio: Socio) => {
    setSocioAEliminar(socio);
    setIsBajaOpen(true);
  };

  const handleDeactivate = async () => {
    if (!socioAEliminar) return;
    setEliminando(true);
    try {
      const res = await eliminarSocioLogico(socioAEliminar.id);
      if (res.success) {
        setIsBajaOpen(false);
        setSocioAEliminar(null);
        refetchSocios();
      }
    } catch (error) {
      console.error('Error al dar de baja:', error);
    } finally {
      setEliminando(false);
    }
  };

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
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Socio
          </button>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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
            {(['Todos', 'Activos', 'Vencidos'] as FiltroEstadoSocio[]).map((estado) => (
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
                        <svg className="animate-spin h-8 w-8 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
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
                          onClick={() => abrirAsistencias(socio)}
                          className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-800 p-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
                          title="Historial de Asistencia"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button
                          onClick={() => abrirEdicion(socio)}
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
                            onClick={() => abrirRenovacion(socio)}
                            className="bg-amber-950/40 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-900/30 hover:border-transparent px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
                          >
                            Renovar
                          </button>
                        )}
                        <button
                          onClick={() => abrirBaja(socio)}
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

      {/* Modales desacoplados */}
      <ModalRenovacion
        isOpen={isRenovacionOpen}
        socio={socioARenovar}
        planes={planes}
        onClose={() => {
          setIsRenovacionOpen(false);
          setSocioARenovar(null);
        }}
        onSuccess={() => refetchSocios()}
      />

      <ModalEdicion
        isOpen={isEdicionOpen}
        socio={socioAEditar}
        onClose={() => {
          setIsEdicionOpen(false);
          setSocioAEditar(null);
        }}
        onSuccess={() => refetchSocios()}
      />

      <ModalAsistencias
        isOpen={isAsistenciasOpen}
        socio={socioAsistencias}
        asistencias={asistencias}
        loading={loadingAsistencias}
        onClose={() => {
          setIsAsistenciasOpen(false);
          setSocioAsistencias(null);
        }}
      />

      <ModalBaja
        isOpen={isBajaOpen}
        socio={socioAEliminar}
        loading={eliminando}
        onClose={() => {
          setIsBajaOpen(false);
          setSocioAEliminar(null);
        }}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
