"use client";

import { useState, useEffect, useCallback } from 'react';
import { PlanConfigured } from '@/types/plan';
import { obtenerPlanes, toggleEstadoPlan } from '@/app/admin/planes/actions';

export function usePlanes() {
  const [planes, setPlanes] = useState<PlanConfigured[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlanes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerPlanes();
      setPlanes(data as PlanConfigured[]);
    } catch (err) {
      console.error('Error al obtener lista de planes:', err);
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]);

  const handleToggleEstado = async (planId: string, estadoActual: boolean) => {
    try {
      const res = await toggleEstadoPlan(planId, !estadoActual);
      if (res.success) {
        setPlanes((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, activo: !estadoActual } : p))
        );
      }
    } catch (err) {
      console.error('Error al cambiar estado del plan:', err);
    }
  };

  return {
    planes,
    loading,
    refetchPlanes: fetchPlanes,
    handleToggleEstado,
  };
}
