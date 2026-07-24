import { Socio, Membresia } from './socio';

export type StatusAcceso = 'idle' | 'loading' | 'concedido' | 'vencido' | 'no_registrado' | 'error' | 'denegado';

export interface ResultadoAcceso {
  status: StatusAcceso;
  mensaje?: string;
  razon?: string;
  socio?: Socio | null;
  membresia?: Membresia | null;
  asistenciaId?: string;
}

export interface SocioActivoGym {
  id: string;
  socio_id?: string;
  nombre: string;
  apellido?: string | null;
  foto_url?: string | null;
  dni?: string;
  horaEntrada: string;
  registrado_at?: string;
  codigo_qr?: string;
}
