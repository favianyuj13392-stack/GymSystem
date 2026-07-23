"use client";

import { useState } from 'react';
import { PlanConfigured } from '@/types/plan';
import { usePlanes } from '@/hooks/usePlanes';
import TarjetaPlan from '@/components/planes/TarjetaPlan';
import ModalEditorPlan from '@/components/planes/ModalEditorPlan';

export default function PlanesPage() {
  const { planes, loading, refetchPlanes, handleToggleEstado } = usePlanes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfigured | null>(null);

  const abrirModalCrear = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (plan: PlanConfigured) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/15 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Catálogo de Planes y Tarifas</h1>
            <p className="text-zinc-400 mt-1">Configura las opciones de membresía, ofertas y beneficios disponibles.</p>
          </div>
          <button 
            type="button"
            onClick={abrirModalCrear}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-amber-500/15 transition-colors flex items-center cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Plan
          </button>
        </div>

        {/* Grid de Tarjetas de Planes */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            <div className="flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando catálogo de planes...
            </div>
          </div>
        ) : planes.length === 0 ? (
          <div className="bg-zinc-900/40 p-12 rounded-3xl border border-zinc-800 text-center text-zinc-500">
            <svg className="w-12 h-12 mx-auto mb-3 stroke-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="font-bold text-white mb-1">No tenés ningún plan configurado</p>
            <p className="text-xs text-zinc-400 mb-4">Creá tu primer plan para que los socios puedan contratar membresías.</p>
            <button
              type="button"
              onClick={abrirModalCrear}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md"
            >
              Crear Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planes.map((plan) => (
              <TarjetaPlan
                key={plan.id}
                plan={plan}
                onEdit={abrirModalEditar}
                onToggleEstado={handleToggleEstado}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modal Editor de Plan */}
      <ModalEditorPlan
        isOpen={isModalOpen}
        editingPlan={editingPlan}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
        }}
        onSuccess={() => refetchPlanes()}
      />
    </div>
  );
}
