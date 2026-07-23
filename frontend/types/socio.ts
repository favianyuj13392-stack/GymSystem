export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  duracion_meses: number;
}

export interface Membresia {
  id: string;
  gimnasio_id?: string;
  socio_id?: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'activo' | 'vencido' | 'cancelado';
  planes?: Plan | null;
}

export type EstadoCalculadoSocio = 'activo' | 'vencido' | 'sin_membresia';

export interface Socio {
  id: string;
  gimnasio_id?: string;
  nombre: string;
  apellido?: string | null;
  dni: string;
  telefono?: string | null;
  email?: string | null;
  fecha_nacimiento?: string | null;
  foto_url?: string | null;
  codigo_qr: string;
  activo: boolean;
  created_at: string;
  membresiaActual?: Membresia | null;
  estadoCalculado?: EstadoCalculadoSocio;
}

export interface Asistencia {
  id: string;
  socio_id: string;
  registrado_at: string;
  tipo: 'entrada' | 'salida';
}

export type FiltroEstadoSocio = 'Todos' | 'Activos' | 'Vencidos';
