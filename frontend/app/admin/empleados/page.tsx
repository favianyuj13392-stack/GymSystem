"use client";

import { useState } from 'react';
import { Empleado } from '@/types/empleado';
import { useEmpleados } from '@/hooks/useEmpleados';
import { eliminarEmpleado } from './actions';
import TablaEmpleados from '@/components/empleados/TablaEmpleados';
import ModalCrearEmpleado from '@/components/empleados/ModalCrearEmpleado';
import ModalEliminarEmpleado from '@/components/empleados/ModalEliminarEmpleado';

export default function EmpleadosPage() {
  const { empleados, loading, refetchEmpleados } = useEmpleados();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState<Empleado | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const handleEliminar = async () => {
    if (!empleadoAEliminar) return;
    setEliminando(true);
    try {
      const res = await eliminarEmpleado(empleadoAEliminar.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setEmpleadoAEliminar(null);
        refetchEmpleados();
      }
    } catch (err) {
      console.error('Error al eliminar empleado:', err);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/15 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Empleados y Equipo</h1>
            <p className="text-zinc-400 mt-1">Administra los accesos del personal y recepcionistas del gimnasio.</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-amber-500/15 transition-colors flex items-center cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Personal
          </button>
        </div>

        {/* Tabla de Empleados */}
        <TablaEmpleados
          empleados={empleados}
          loading={loading}
          onEliminar={(emp) => {
            setEmpleadoAEliminar(emp);
            setIsDeleteModalOpen(true);
          }}
        />

      </div>

      {/* Modal Crear Empleado */}
      <ModalCrearEmpleado
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetchEmpleados()}
      />

      {/* Modal Eliminar Empleado */}
      <ModalEliminarEmpleado
        isOpen={isDeleteModalOpen}
        empleado={empleadoAEliminar}
        loading={eliminando}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEmpleadoAEliminar(null);
        }}
        onConfirm={handleEliminar}
      />
    </div>
  );
}
