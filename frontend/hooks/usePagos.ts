"use client";

import { useState, useEffect, useCallback } from 'react';
import { Pago, FiltroMetodoPago } from '@/types/pago';
import { obtenerHistorialPagos, obtenerSumaIngresosMes } from '@/app/admin/pagos/actions';

export function usePagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [sumaMes, setSumaMes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [metodoPago, setMetodoPago] = useState<FiltroMetodoPago>('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      const [historial, totalSuma] = await Promise.all([
        obtenerHistorialPagos({
          busqueda: busqueda.trim(),
          metodoPago,
          fechaInicio: fechaInicio || undefined,
          fechaFin: fechaFin || undefined,
        }),
        obtenerSumaIngresosMes(),
      ]);

      setPagos(historial as Pago[]);
      setSumaMes(totalSuma);
    } catch (err) {
      console.error('Error cargando historial de pagos:', err);
      setPagos([]);
      setSumaMes(0);
    } finally {
      setLoading(false);
    }
  }, [busqueda, metodoPago, fechaInicio, fechaFin]);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  return {
    pagos,
    sumaMes,
    loading,
    busqueda,
    setBusqueda,
    metodoPago,
    setMetodoPago,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    refetchPagos: fetchPagos,
  };
}
