import { Socio } from './socio';

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Tarjeta';
export type FiltroMetodoPago = 'Todos' | MetodoPago;
export type TipoPago = 'Membresia' | 'Producto' | 'Otros';

export interface Pago {
  id: string;
  gimnasio_id?: string;
  socio_id?: string | null;
  membresia_id?: string | null;
  concepto: string;
  monto: number;
  metodo_pago: MetodoPago | string;
  tipo: TipoPago | string;
  fecha_pago: string;
  created_at: string;
  socios?: Socio | null;
}

export interface ProductoConfigurado {
  id: string;
  nombre: string;
  precio: number;
  categoria?: string;
}

export interface FiltrosPagoParams {
  busqueda?: string;
  metodoPago?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
