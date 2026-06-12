"use client"

import { useState, useEffect } from 'react';
import { obtenerEmpleados, crearEmpleado, eliminarEmpleado } from './actions';

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'admin' | 'empleado'>('empleado');
  const [contrasena, setContrasena] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState('');

  // Modal de Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchEmpleados = async () => {
    setLoading(true);
    const data = await obtenerEmpleados();
    setEmpleados(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const abrirModalCrear = () => {
    setNombre('');
    setEmail('');
    setRol('empleado');
    setContrasena('');
    setErrorCreacion('');
    setIsCreateModalOpen(true);
  };

  const cerrarModalCrear = () => {
    setIsCreateModalOpen(false);
  };

  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !contrasena.trim()) {
      setErrorCreacion('Por favor completa todos los campos.');
      return;
    }
    if (contrasena.length < 6) {
      setErrorCreacion('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreando(true);
    setErrorCreacion('');

    const res = await crearEmpleado(nombre, email, rol, contrasena);
    setCreando(false);

    if (res.success) {
      cerrarModalCrear();
      fetchEmpleados();
    } else {
      setErrorCreacion(res.error || 'Ocurrió un error al registrar al empleado.');
    }
  };

  const abrirModalEliminar = (empleado: any) => {
    setEmpleadoAEliminar(empleado);
    setIsDeleteModalOpen(true);
  };

  const cerrarModalEliminar = () => {
    setIsDeleteModalOpen(false);
    setEmpleadoAEliminar(null);
  };

  const handleEliminarSubmit = async () => {
    if (!empleadoAEliminar) return;
    setEliminando(true);

    const res = await eliminarEmpleado(empleadoAEliminar.id);
    setEliminando(false);

    if (res.success) {
      cerrarModalEliminar();
      fetchEmpleados();
    } else {
      alert(res.error || 'No se pudo eliminar al empleado.');
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
              Gestión del Personal
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Empleados</h1>
            <p className="text-zinc-400 mt-1">Crea y administra los perfiles y permisos del equipo administrativo.</p>
          </div>
          
          <button
            onClick={abrirModalCrear}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-amber-500/10 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Agregar Empleado
          </button>
        </div>

        {/* Tabla de Empleados */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-zinc-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Nombre</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Email</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Rol</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Fecha Registro</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg className="animate-spin h-7 w-7 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando personal...
                      </div>
                    </td>
                  </tr>
                ) : empleados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">
                      No hay empleados registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  empleados.map((emp) => {
                    const fecha = emp.created_at ? new Date(emp.created_at) : null;
                    const fechaFormat = fecha ? fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---';

                    return (
                      <tr key={emp.id} className="hover:bg-zinc-850/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-white text-sm">
                          {emp.nombre}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm font-mono">
                          {emp.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                            emp.rol === 'admin' 
                              ? 'bg-amber-950/20 border-amber-900/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]' 
                              : 'bg-zinc-950 border-zinc-700 text-zinc-300'
                          }`}>
                            {emp.rol.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm">
                          {fechaFormat}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => abrirModalEliminar(emp)}
                            className="bg-zinc-900 hover:bg-amber-950/30 text-zinc-400 hover:text-amber-400 border border-zinc-800 hover:border-amber-900/30 p-2 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                            title="Eliminar Cuenta"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Registrar Nuevo Empleado</h3>
                <button onClick={cerrarModalCrear} className="text-zinc-400 hover:text-white bg-zinc-800 rounded-full p-1 border border-zinc-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCrearSubmit} className="p-6 space-y-4">
              {errorCreacion && (
                <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  {errorCreacion}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={creando}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ej. juan@gym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={creando}
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Rol / Permisos</label>
                <select
                  value={rol}
                  onChange={(e: any) => setRol(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  disabled={creando}
                >
                  <option value="empleado">Empleado (Solo Recepción y Socios)</option>
                  <option value="admin">Administrador (Acceso Completo)</option>
                </select>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Contraseña Temporal</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 caracteres"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  disabled={creando}
                />
              </div>

              {/* Botones */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarModalCrear}
                  className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl font-medium transition-colors cursor-pointer text-sm"
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center cursor-pointer text-sm"
                >
                  {creando ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Registrando...
                    </>
                  ) : (
                    'Guardar Empleado'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {isDeleteModalOpen && empleadoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-950/40 text-amber-400 border border-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Eliminar Cuenta de Personal</h3>
              <p className="text-sm text-zinc-400 mb-6">
                ¿Estás seguro de que deseas eliminar la cuenta de <strong>{empleadoAEliminar.nombre}</strong>? Esta acción revocará su acceso al sistema de forma permanente.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cerrarModalEliminar}
                className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl font-medium transition-colors cursor-pointer text-sm"
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarSubmit}
                disabled={eliminando}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center cursor-pointer text-sm"
              >
                {eliminando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Eliminando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
