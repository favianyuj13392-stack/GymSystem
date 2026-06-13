"use server"

import { supabaseServer } from '@/lib/supabaseServer';

export interface PlanData {
  id?: string;
  nombre: string;
  precio: number;
  duracion_dias: number;
  descripcion?: string;
  limite_accesos?: number | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  servicios_extras?: string[];
  activo?: boolean;
}

export async function obtenerPlanes() {
  try {
    const { data, error } = await supabaseServer
      .from('planes')
      .select('*')
      .order('activo', { ascending: false })
      .order('precio', { ascending: true });

    if (error) {
      console.error('Error al obtener planes:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error en obtenerPlanes:', error);
    return [];
  }
}

export async function crearPlan(plan: PlanData) {
  try {
    // Para retrocompatibilidad con campos viejos, calculamos duracion_meses
    const duracion_meses = Math.max(1, Math.round(plan.duracion_dias / 30));

    const { data, error } = await supabaseServer
      .from('planes')
      .insert({
        nombre: plan.nombre,
        precio: plan.precio,
        duracion_meses, // retrocompatibilidad
        duracion_dias: plan.duracion_dias,
        descripcion: plan.descripcion,
        limite_accesos: plan.limite_accesos || null,
        hora_inicio: plan.hora_inicio || null,
        hora_fin: plan.hora_fin || null,
        servicios_extras: plan.servicios_extras || [],
        activo: plan.activo !== undefined ? plan.activo : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear plan:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en crearPlan:', error);
    return { success: false, error: error.message };
  }
}

export async function actualizarPlan(id: string, plan: PlanData) {
  try {
    const duracion_meses = Math.max(1, Math.round(plan.duracion_dias / 30));

    const { data, error } = await supabaseServer
      .from('planes')
      .update({
        nombre: plan.nombre,
        precio: plan.precio,
        duracion_meses, // retrocompatibilidad
        duracion_dias: plan.duracion_dias,
        descripcion: plan.descripcion,
        limite_accesos: plan.limite_accesos || null,
        hora_inicio: plan.hora_inicio || null,
        hora_fin: plan.hora_fin || null,
        servicios_extras: plan.servicios_extras || [],
        activo: plan.activo,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar plan:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('Error en actualizarPlan:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleEstadoPlan(id: string, activo: boolean) {
  try {
    const { error } = await supabaseServer
      .from('planes')
      .update({ activo })
      .eq('id', id);

    if (error) {
      console.error('Error al cambiar estado del plan:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error en toggleEstadoPlan:', error);
    return { success: false, error: error.message };
  }
}
