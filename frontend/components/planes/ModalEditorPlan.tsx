"use client";

import { useState, useEffect, FormEvent } from 'react';
import { PlanConfigured } from '@/types/plan';
import { crearPlan, actualizarPlan } from '@/app/admin/planes/actions';

interface ModalEditorPlanProps {
  isOpen: boolean;
  editingPlan: PlanConfigured | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditorPlan({
  isOpen,
  editingPlan,
  onClose,
  onSuccess,
}: ModalEditorPlanProps) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number | string>('');
  const [duracionDias, setDuracionDias] = useState<number | string>(30);
  const [descripcion, setDescripcion] = useState('');
  const [limiteAccesos, setLimiteAccesos] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  // Checkboxes servicios
  const [hasSauna, setHasSauna] = useState(false);
  const [hasTrainer, setHasTrainer] = useState(false);
  const [hasClasses, setHasClasses] = useState(false);
  const [hasLocker, setHasLocker] = useState(false);
  const [customExtras, setCustomExtras] = useState('');
  const [activo, setActivo] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingPlan) {
        setNombre(editingPlan.nombre);
        setPrecio(editingPlan.precio);
        setDuracionDias(editingPlan.duracion_dias || 30);
        setDescripcion(editingPlan.descripcion || '');
        setLimiteAccesos(editingPlan.limite_accesos ? String(editingPlan.limite_accesos) : '');
        setHoraInicio(editingPlan.hora_inicio || '');
        setHoraFin(editingPlan.hora_fin || '');
        setActivo(editingPlan.activo);

        const extras = editingPlan.servicios_extras || [];
        setHasSauna(extras.includes('Sauna / Jacuzzi'));
        setHasTrainer(extras.includes('Entrenador Personal'));
        setHasClasses(extras.includes('Clases Dirigidas'));
        setHasLocker(extras.includes('Locker Privado'));

        const standard = ['Sauna / Jacuzzi', 'Entrenador Personal', 'Clases Dirigidas', 'Locker Privado'];
        const custom = extras.filter((x) => !standard.includes(x)).join(', ');
        setCustomExtras(custom);
      } else {
        setNombre('');
        setPrecio('');
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
      }
      setErrorForm('');
      setSaving(false);
    }
  }, [isOpen, editingPlan]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorForm('');

    if (!nombre.trim()) {
      setErrorForm('El nombre del plan es obligatorio.');
      return;
    }

    if (!precio || Number(precio) < 0) {
      setErrorForm('Ingresa un precio válido.');
      return;
    }

    // Construir array de servicios extras
    const extras: string[] = [];
    if (hasSauna) extras.push('Sauna / Jacuzzi');
    if (hasTrainer) extras.push('Entrenador Personal');
    if (hasClasses) extras.push('Clases Dirigidas');
    if (hasLocker) extras.push('Locker Privado');

    if (customExtras.trim()) {
      customExtras
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => extras.push(s));
    }

    const planPayload = {
      nombre: nombre.trim(),
      precio: Number(precio),
      duracion_dias: Number(duracionDias) || 30,
      descripcion: descripcion.trim() || undefined,
      limite_accesos: limiteAccesos ? Number(limiteAccesos) : null,
      hora_inicio: horaInicio || null,
      hora_fin: horaFin || null,
      servicios_extras: extras,
      activo,
    };

    setSaving(true);
    try {
      let res;
      if (editingPlan) {
        res = await actualizarPlan(editingPlan.id, planPayload);
      } else {
        res = await crearPlan(planPayload);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorForm(res.error || 'Error al guardar el plan.');
      }
    } catch (err: any) {
      setErrorForm(err.message || 'Error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">
              {editingPlan ? 'Editar Plan de Membresía' : 'Nuevo Plan de Membresía'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white bg-zinc-950 rounded-full p-1 border border-zinc-850 cursor-pointer transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errorForm && (
            <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
              {errorForm}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nombre del Plan *</label>
            <input
              type="text"
              required
              placeholder="Ej. Plan Trimestral VIP"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Precio (Bs.) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                placeholder="250.00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-bold text-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Duración (Días) *</label>
              <input
                type="number"
                min="1"
                required
                value={duracionDias}
                onChange={(e) => setDuracionDias(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Descripción Corta</label>
            <textarea
              rows={2}
              placeholder="Ej. Incluye pase libre a todas las áreas de pesas y cardio..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Restricción de Horarios y Accesos */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Restricciones de Acceso (Opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Límite de Accesos (Vacío = Ilimitado)</label>
              <input
                type="number"
                placeholder="Ej. 12 entradas al mes"
                value={limiteAccesos}
                onChange={(e) => setLimiteAccesos(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Servicios Incluidos */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Servicios Incluidos</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
              <label className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={hasSauna}
                  onChange={(e) => setHasSauna(e.target.checked)}
                  className="accent-amber-500"
                />
                Sauna / Jacuzzi
              </label>
              <label className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={hasTrainer}
                  onChange={(e) => setHasTrainer(e.target.checked)}
                  className="accent-amber-500"
                />
                Entrenador Personal
              </label>
              <label className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={hasClasses}
                  onChange={(e) => setHasClasses(e.target.checked)}
                  className="accent-amber-500"
                />
                Clases Dirigidas
              </label>
              <label className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={hasLocker}
                  onChange={(e) => setHasLocker(e.target.checked)}
                  className="accent-amber-500"
                />
                Locker Privado
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Otros Servicios (separados por coma)</label>
              <input
                type="text"
                placeholder="Ej. Toalla, Proteína de regalo, Acceso 24/7"
                value={customExtras}
                onChange={(e) => setCustomExtras(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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
  );
}
