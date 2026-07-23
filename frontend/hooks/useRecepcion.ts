"use client";

import { useState, useEffect, useCallback } from 'react';
import { SocioActivoGym, StatusAcceso, ResultadoAcceso } from '@/types/recepcion';
import { obtenerSociosActivosEnGym, registrarSalida } from '@/app/recepcion/control/actions';

export function useRecepcion() {
  const [sociosActivos, setSociosActivos] = useState<SocioActivoGym[]>([]);
  const [status, setStatus] = useState<StatusAcceso>('idle');
  const [resultado, setResultado] = useState<ResultadoAcceso | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchSociosActivos = useCallback(async () => {
    try {
      const data = await obtenerSociosActivosEnGym();
      setSociosActivos(data as SocioActivoGym[]);
    } catch (err) {
      console.error('Error al obtener socios activos:', err);
      setSociosActivos([]);
    }
  }, []);

  useEffect(() => {
    fetchSociosActivos();
  }, [fetchSociosActivos]);

  const handleSalida = async (asistenciaId: string) => {
    setRemovingId(asistenciaId);
    try {
      const res = await registrarSalida(asistenciaId);
      if (res.success) {
        setSociosActivos((prev) => prev.filter((item) => item.id !== asistenciaId));
      }
    } catch (err) {
      console.error('Error al registrar salida:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return {
    sociosActivos,
    status,
    setStatus,
    resultado,
    setResultado,
    removingId,
    handleSalida,
    refetchSociosActivos: fetchSociosActivos,
  };
}
