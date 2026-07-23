"use client";

import { useState, useEffect, FormEvent } from 'react';
import { RolEmpleadoForm } from '@/types/empleado';
import { crearEmpleado } from '@/app/admin/empleados/actions';

interface ModalCrearEmpleadoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCrearEmpleado({
  isOpen,
  onClose,
  onSuccess,
}: ModalCrearEmpleadoProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolEmpleadoForm>('empleado');
  const [contrasena, setContrasena] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setApellido('');
      setEmail('');
      setRol('empleado');
      setContrasena('');
      setErrorCreacion('');
      setCreando(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorCreacion('');

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !contrasena.trim()) {
      setErrorCreacion('Por favor completa todos los campos.');
      return;
    }

    if (contrasena.length < 6) {
      setErrorCreacion('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreando(true);
    try {
      const res = await crearEmpleado(
        nombre.trim(),
        apellido.trim(),
        email.trim().toLowerCase(),
        rol,
        contrasena
      );

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorCreacion(res.error || 'Error al crear el usuario.');
      }
    } catch (err: any) {
      setErrorCreacion(err.message || 'Error inesperado al crear el empleado.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Nuevo Personal</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorCreacion && (
            <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
              {errorCreacion}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nombre *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                disabled={creando}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Apellido *</label>
              <input
                type="text"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                disabled={creando}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Email de Acceso *</label>
            <input
              type="email"
              required
              placeholder="usuario@gimnasio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              disabled={creando}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Rol / Permisos</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolEmpleadoForm)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
              disabled={creando}
            >
              <option value="empleado" className="bg-zinc-950 text-white">Recepcionista / Empleado</option>
              <option value="admin" className="bg-zinc-950 text-white">Administrador (Acceso Total)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Contraseña Inicial *</label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              disabled={creando}
            />
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={creando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creando}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
            >
              {creando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
