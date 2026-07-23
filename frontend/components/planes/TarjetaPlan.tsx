"use client";

import { PlanConfigured } from '@/types/plan';

interface TarjetaPlanProps {
  plan: PlanConfigured;
  onEdit: (plan: PlanConfigured) => void;
  onToggleEstado: (planId: string, estadoActual: boolean) => void;
}

export default function TarjetaPlan({ plan, onEdit, onToggleEstado }: TarjetaPlanProps) {
  return (
    <div
      className={`bg-zinc-900/40 rounded-3xl border ${
        plan.activo ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-850 opacity-60'
      } p-6 flex flex-col justify-between shadow-xl transition-all duration-300 relative group overflow-hidden`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white tracking-tight">{plan.nombre}</h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              plan.activo
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {plan.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        <div className="mb-4">
          <span className="text-3xl font-black text-amber-400 tracking-tight">Bs. {plan.precio}</span>
          <span className="text-xs text-zinc-500 font-medium ml-1">/ {plan.duracion_dias || 30} días</span>
        </div>

        {plan.descripcion && (
          <p className="text-xs text-zinc-400 mb-4 line-clamp-2 leading-relaxed">{plan.descripcion}</p>
        )}

        {/* Detalles de Restricciones */}
        <div className="space-y-2 mb-6 pt-4 border-t border-zinc-850 text-xs">
          <div className="flex items-center text-zinc-300">
            <svg className="w-4 h-4 mr-2 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {plan.hora_inicio && plan.hora_fin
                ? `Horario: ${plan.hora_inicio} - ${plan.hora_fin}`
                : 'Acceso Horario Completo'}
            </span>
          </div>

          <div className="flex items-center text-zinc-300">
            <svg className="w-4 h-4 mr-2 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
            </svg>
            <span>
              {plan.limite_accesos
                ? `Límite: ${plan.limite_accesos} accesos`
                : 'Accesos Ilimitados'}
            </span>
          </div>
        </div>

        {/* Servicios Extras Badges */}
        {plan.servicios_extras && plan.servicios_extras.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {plan.servicios_extras.map((servicio, idx) => (
              <span
                key={idx}
                className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-md"
              >
                ✓ {servicio}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="pt-4 border-t border-zinc-850 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onToggleEstado(plan.id, plan.activo)}
          className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            plan.activo
              ? 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-red-900/50 hover:text-red-400'
              : 'bg-green-950/30 text-green-400 border-green-900/50 hover:bg-green-900/40'
          }`}
        >
          {plan.activo ? 'Desactivar' : 'Activar'}
        </button>

        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-600 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar Plan
        </button>
      </div>
    </div>
  );
}
