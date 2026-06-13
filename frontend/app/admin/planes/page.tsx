"use client"

import { useState, useEffect } from 'react';
import { obtenerPlanes, crearPlan, actualizarPlan, toggleEstadoPlan, PlanData } from './actions';

export default function PlanesPage() {
  const [planes, setPlanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [duracionDias, setDuracionDias] = useState<number>(30);
  const [descripcion, setDescripcion] = useState('');
  const [limiteAccesos, setLimiteAccesos] = useState<string>(''); // empty string for unlimited
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  
  // Servicios extras checkboxes
  const [hasSauna, setHasSauna] = useState(false);
  const [hasTrainer, setHasTrainer] = useState(false);
  const [hasClasses, setHasClasses] = useState(false);
  const [hasLocker, setHasLocker] = useState(false);
  const [customExtras, setCustomExtras] = useState('');

  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const fetchPlanes = async () => {
    setLoading(true);
    const data = await obtenerPlanes();
    setPlanes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlanes();
  }, []);

  const abrirModalCrear = () => {
    setEditingPlanId(null);
    setNombre('');
    setPrecio(0);
    setDuracionDias(30);
    setDescripcion('');
    setLimiteAccesos('');
    setHoraInicio('');
    setHoraFin('');
    setHasSauna(false);
    setHasTrainer(false);
    setHasClasses(false);
    setHasLocker(false);
    setCustomExtras('');
    setActivo(true);
    setErrorForm('');
    setIsModalOpen(true);
  };

  const abrirModalEditar = (plan: any) => {
    setEditingPlanId(plan.id);
    setNombre(plan.nombre || '');
    setPrecio(Number(plan.precio) || 0);
    setDuracionDias(Number(plan.duracion_dias) || 30);
    setDescripcion(plan.descripcion || '');
    setLimiteAccesos(plan.limite_accesos !== null && plan.limite_accesos !== undefined ? String(plan.limite_accesos) : '');
    setHoraInicio(plan.hora_inicio || '');
    setHoraFin(plan.hora_fin || '');
    
    // Parse extras
    const extrasList = Array.isArray(plan.servicios_extras) ? plan.servicios_extras : [];
    setHasSauna(extrasList.includes('Sauna'));
    setHasTrainer(extrasList.includes('Entrenador Personal'));
    setHasClasses(extrasList.includes('Clases Grupales'));
    setHasLocker(extrasList.includes('Casillero Privado'));
    
    const standardExtras = ['Sauna', 'Entrenador Personal', 'Clases Grupales', 'Casillero Privado'];
    const customList = extrasList.filter((e: string) => !standardExtras.includes(e));
    setCustomExtras(customList.join(', '));

    setActivo(plan.activo !== undefined ? plan.activo : true);
    setErrorForm('');
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
  };

  const handleToggleEstado = async (planId: string, currentActivo: boolean) => {
    const nuevoEstado = !currentActivo;
    const res = await toggleEstadoPlan(planId, nuevoEstado);
    if (res.success) {
      fetchPlanes();
    } else {
      alert(res.error || 'No se pudo cambiar el estado del plan.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || precio <= 0 || duracionDias <= 0) {
      setErrorForm('Por favor completa los campos obligatorios (Nombre, Precio y Duración).');
      return;
    }

    setSaving(true);
    setErrorForm('');

    // Compile extras list
    const extras: string[] = [];
    if (hasSauna) extras.push('Sauna');
    if (hasTrainer) extras.push('Entrenador Personal');
    if (hasClasses) extras.push('Clases Grupales');
    if (hasLocker) extras.push('Casillero Privado');
    if (customExtras.trim()) {
      customExtras.split(',').forEach(item => {
        const cleaned = item.trim();
        if (cleaned && !extras.includes(cleaned)) {
          extras.push(cleaned);
        }
      });
    }

    const payload: PlanData = {
      nombre,
      precio,
      duracion_dias: duracionDias,
      descripcion,
      limite_accesos: limiteAccesos.trim() ? Number(limiteAccesos) : null,
      hora_inicio: horaInicio.trim() ? horaInicio : null,
      hora_fin: horaFin.trim() ? horaFin : null,
      servicios_extras: extras,
      activo
    };

    let res;
    if (editingPlanId) {
      res = await actualizarPlan(editingPlanId, payload);
    } else {
      res = await crearPlan(payload);
    }

    setSaving(false);

    if (res.success) {
      cerrarModal();
      fetchPlanes();
    } else {
      setErrorForm(res.error || 'Ocurrió un error al guardar el plan.');
    }
  };

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-900/30 tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Configuración del Gimnasio
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Planes de Membresía</h1>
            <p className="text-zinc-400 mt-1">Crea y edita los planes tarifarios, vigencias y reglas de acceso.</p>
          </div>
          
          <button
            onClick={abrirModalCrear}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-amber-500/10 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Agregar Plan
          </button>
        </div>

        {/* Listado de Planes */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Cargando planes de membresía...
          </div>
        ) : planes.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 font-medium">
            No hay planes registrados. Hacé click en "Agregar Plan" para crear el primero.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planes.map((plan) => {
              const accessLimit = plan.limite_accesos ? `${plan.limite_accesos} accesos` : 'Accesos ilimitados';
              const hoursText = plan.hora_inicio && plan.hora_fin ? `${plan.hora_inicio.slice(0, 5)} - ${plan.hora_fin.slice(0, 5)}` : 'Horario libre';
              const services = Array.isArray(plan.servicios_extras) ? plan.servicios_extras : [];

              return (
                <div 
                  key={plan.id} 
                  className={`bg-zinc-900/60 backdrop-blur-xl border rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all relative overflow-hidden ${
                    plan.activo 
                      ? 'border-zinc-800 hover:border-amber-500/50' 
                      : 'border-zinc-900 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div>
                        <h3 className="font-black text-xl text-white tracking-tight">{plan.nombre}</h3>
                        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mt-0.5">{plan.duracion_dias} días de vigencia</p>
                      </div>
                      <span className="text-2xl font-black text-amber-500 shrink-0">Bs {plan.precio}</span>
                    </div>

                    {/* Descripción */}
                    {plan.descripcion && (
                      <p className="text-zinc-400 text-sm line-clamp-2 mb-4 leading-relaxed">{plan.descripcion}</p>
                    )}

                    <div className="border-t border-zinc-800/80 my-4"></div>

                    {/* Reglas de acceso */}
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <span>{accessLimit}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{hoursText}</span>
                      </div>
                    </div>

                    {/* Servicios extras */}
                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {services.map((extra: string, i: number) => (
                          <span key={i} className="text-[10px] font-bold bg-zinc-950 text-zinc-400 px-2.5 py-1 rounded-full border border-zinc-850">
                            {extra}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-850">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleEstado(plan.id, plan.activo)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                          plan.activo 
                            ? 'bg-amber-950/20 border-amber-900/30 text-amber-400' 
                            : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-400'
                        }`}
                      >
                        {plan.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>

                    <button
                      onClick={() => abrirModalEditar(plan)}
                      className="text-xs font-bold bg-zinc-950 hover:bg-zinc-850 text-white px-3.5 py-1.5 rounded-xl border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Plan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {editingPlanId ? 'Editar Plan de Membresía' : 'Agregar Nuevo Plan'}
                </h3>
                <button onClick={cerrarModal} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-full p-1 border border-zinc-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorForm && (
                <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  {errorForm}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nombre del Plan *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Plan Mensual Básico"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={saving}
                />
              </div>

              {/* Costo & Duración */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Precio / Costo (Bs) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="ej. 150"
                    value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Vigencia (Días) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="ej. 30"
                    value={duracionDias}
                    onChange={(e) => setDuracionDias(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Descripción</label>
                <textarea
                  placeholder="Detalles sobre qué incluye este plan..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors h-20 resize-none"
                  disabled={saving}
                />
              </div>

              {/* Límite de Accesos */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Límite de Accesos (Opcional)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="ej. 12 (Dejar vacío para accesos ilimitados)"
                  value={limiteAccesos}
                  onChange={(e) => setLimiteAccesos(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={saving}
                />
              </div>

              {/* Restricción Horaria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Hora Entrada Permitida</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Hora Salida Máxima</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Servicios Incluidos / Extras */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">Servicios Incluidos / Extras</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={hasSauna} 
                      onChange={(e) => setHasSauna(e.target.checked)} 
                      className="accent-amber-500 w-4 h-4 rounded" 
                    />
                    <span>Área de Sauna</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={hasTrainer} 
                      onChange={(e) => setHasTrainer(e.target.checked)} 
                      className="accent-amber-500 w-4 h-4 rounded" 
                    />
                    <span>Entrenador Personal</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={hasClasses} 
                      onChange={(e) => setHasClasses(e.target.checked)} 
                      className="accent-amber-500 w-4 h-4 rounded" 
                    />
                    <span>Clases Grupales</span>
                  </label>
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input 
                      type="checkbox" 
                      checked={hasLocker} 
                      onChange={(e) => setHasLocker(e.target.checked)} 
                      className="accent-amber-500 w-4 h-4 rounded" 
                    />
                    <span>Casillero Privado</span>
                  </label>
                </div>

                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Otros Extras (Separados por coma)</label>
                  <input
                    type="text"
                    placeholder="ej. Nutricionista, Acceso VIP Domingos"
                    value={customExtras}
                    onChange={(e) => setCustomExtras(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Estado Activo */}
              {editingPlanId && (
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="activo-chk"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded"
                    disabled={saving}
                  />
                  <label htmlFor="activo-chk" className="text-xs font-bold text-zinc-400 uppercase cursor-pointer">
                    Habilitar oferta de este plan (Estado Activo)
                  </label>
                </div>
              )}

              {/* Botones */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl font-medium transition-colors cursor-pointer text-sm"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center cursor-pointer text-sm"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
