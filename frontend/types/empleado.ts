export type RolEmpleadoForm = 'admin' | 'empleado';
export type RolEmpleado = 'admin' | 'empleado' | 'superadmin';

export interface Empleado {
  id: string;
  gimnasio_id?: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolEmpleado;
  activo?: boolean;
  created_at?: string;
}

export interface NuevoEmpleadoParams {
  nombre: string;
  apellido: string;
  email: string;
  rol: RolEmpleadoForm;
  contrasena: string;
}
