"use client";

import { useState, useEffect, useCallback } from 'react';
import { Empleado } from '@/types/empleado';
import { obtenerEmpleados } from '@/app/admin/empleados/actions';

export function useEmpleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerEmpleados();
      setEmpleados(data as Empleado[]);
    } catch (err) {
      console.error('Error al obtener lista de empleados:', err);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  return {
    empleados,
    loading,
    refetchEmpleados: fetchEmpleados,
  };
}
