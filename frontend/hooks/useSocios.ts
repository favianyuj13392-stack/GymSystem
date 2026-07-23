"use client";

import { useState, useEffect, useCallback } from 'react';
import { Socio, FiltroEstadoSocio } from '@/types/socio';
import { obtenerListaSocios } from '@/app/admin/socios/actions';

export function useSocios() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoSocio>('Todos');

  const fetchSocios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerListaSocios(busqueda, filtroEstado);
      setSocios(data as Socio[]);
    } catch (err) {
      console.error('Error al obtener la lista de socios:', err);
      setSocios([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroEstado]);

  useEffect(() => {
    fetchSocios();
  }, [fetchSocios]);

  return {
    socios,
    loading,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    refetchSocios: fetchSocios,
  };
}
