"use client"

import { useState, useEffect } from 'react';
import { obtenerConfiguraciones, guardarConfiguraciones } from './actions';

export default function ConfigPage() {
  const [capacidadGlobal, setCapacidadGlobal] = useState<number>(100);
  const [zonas, setZonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Estados para agregar una nueva zona
  const [nuevaZonaNombre, setNuevaZonaNombre] = useState('');
  const [nuevaZonaCapacidad, setNuevaZonaCapacidad] = useState<number | ''>('');

  useEffect(() => {
    async function loadData() {
      const res = await obtenerConfiguraciones();
      setCapacidadGlobal(res.capacidadGlobal);
      setZonas(res.zonas);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMensajeExito('');
    setMensajeError('');

    const res = await guardarConfiguraciones(capacidadGlobal, zonas);
    setSaving(false);
    if (res.success) {
      setMensajeExito('Configuración guardada exitosamente.');
      setTimeout(() => setMensajeExito(''), 4000);
    } else {
      setMensajeError(res.error || 'Ocurrió un error al guardar la configuración.');
    }
  };

  const handleAgregarZona = () => {
    if (!nuevaZonaNombre.trim() || nuevaZonaCapacidad === '' || nuevaZonaCapacidad <= 0) {
      alert('Por favor ingresá un nombre válido y una capacidad mayor a cero.');
      return;
    }
    setZonas([...zonas, { nombre: nuevaZonaNombre.trim(), capacidad: Number(nuevaZonaCapacidad) }]);
    setNuevaZonaNombre('');
    setNuevaZonaCapacidad('');
  };

  const handleEliminarZona = (index: number) => {
    const updated = zonas.filter((_, i) => i !== index);
    setZonas(updated);
  };

  const handleEditZonaCapacidad = (index: number, valor: string) => {
    const num = Number(valor) || 0;
    const updated = zonas.map((z, i) => i === index ? { ...z, capacidad: num } : z);
    setZonas(updated);
  };

  const handleEditZonaNombre = (index: number, valor: string) => {
    const updated = zonas.map((z, i) => i === index ? { ...z, nombre: valor } : z);
    setZonas(updated);
  };

  const sumaZonas = zonas.reduce((acc, z) => acc + Number(z.capacidad), 0);

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-900/30 tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Configuración del Gimnasio
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Capacidad e Infraestructura</h1>
          <p className="text-zinc-400 mt-1">Configurá el aforo total y distribuí los límites de capacidad por zonas operativas.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-zinc-400 text-sm">Cargando variables de aforo...</p>
          </div>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-8">
            
            {/* Alertas */}
            {mensajeExito && (
              <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 p-4 rounded-2xl flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {mensajeExito}
              </div>
            )}
            {mensajeError && (
              <div className="bg-amber-950/40 text-amber-400 border border-amber-900/30 p-4 rounded-2xl flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {mensajeError}
              </div>
            )}

            {/* Aforo Global */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-lg space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Aforo Principal</h3>
                <p className="text-zinc-500 text-xs">Ajuste recomendado para el cálculo de porcentaje en horas de saturación crítica.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">Capacidad máxima simultánea recomendada</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    required
                    min={1}
                    value={capacidadGlobal}
                    onChange={(e) => setCapacidadGlobal(Number(e.target.value))}
                    className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-bold"
                  />
                  <span className="text-sm font-semibold text-zinc-500">personas en simultáneo</span>
                </div>
              </div>
            </div>

            {/* Aforo por Zonas */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-lg space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Distribución Multizona (Futura escala de monitores)
                </h3>
                <p className="text-zinc-500 text-xs">Define áreas secundarias del gimnasio para segmentar la afluencia interna.</p>
              </div>

              {/* Grid Zonas */}
              <div className="space-y-4">
                {zonas.map((zona, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Área / Zona</label>
                      <input
                        type="text"
                        value={zona.nombre}
                        onChange={(e) => handleEditZonaNombre(index, e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-zinc-800 focus:border-amber-500 focus:outline-none text-sm text-white py-1 font-semibold"
                        placeholder="Ej. Sala Pesas"
                      />
                    </div>
                    
                    <div className="w-full sm:w-32">
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Capacidad</label>
                      <input
                        type="number"
                        min={1}
                        value={zona.capacidad}
                        onChange={(e) => handleEditZonaCapacidad(index, e.target.value)}
                        className="w-full bg-transparent border-0 border-b border-zinc-800 focus:border-amber-500 focus:outline-none text-sm text-white py-1 font-bold"
                        placeholder="Capacidad"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEliminarZona(index)}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0 self-end sm:self-center"
                      title="Eliminar Zona"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Formulario Agregar Zona */}
              <div className="border-t border-zinc-800/80 pt-6">
                <p className="text-xs font-bold text-zinc-400 mb-3 uppercase">Agregar Nueva Área</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del Área (Ej. Sauna, Spinning)"
                    value={nuevaZonaNombre}
                    onChange={(e) => setNuevaZonaNombre(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Capacidad Max"
                    value={nuevaZonaCapacidad}
                    onChange={(e) => setNuevaZonaCapacidad(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full sm:w-36 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAgregarZona}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2.5 rounded-xl border border-zinc-750 transition-colors text-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Agregar
                  </button>
                </div>
              </div>

              {/* Resumen e Indicador */}
              <div className="flex justify-between items-center text-xs text-zinc-500 pt-4 border-t border-zinc-800/50">
                <span>Suma de capacidad distribuida</span>
                <span className="font-bold text-zinc-300">Bs {sumaZonas} personas (Global: {capacidadGlobal})</span>
              </div>
            </div>

            {/* Footer Guardar */}
            <div className="flex justify-end gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-amber-500/15 transition-all flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Guardar Configuración
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
