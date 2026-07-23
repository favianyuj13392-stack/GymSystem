export interface PlanConfigured {
  id: string;
  gimnasio_id?: string;
  nombre: string;
  precio: number;
  duracion_meses?: number;
  duracion_dias?: number;
  descripcion?: string | null;
  limite_accesos?: number | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  servicios_extras?: string[] | null;
  activo: boolean;
  created_at?: string;
}

export interface PlanFormData {
  nombre: string;
  precio: number;
  duracion_dias: number;
  descripcion: string;
  limite_accesos?: number | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  servicios_extras?: string[];
  activo: boolean;
}
