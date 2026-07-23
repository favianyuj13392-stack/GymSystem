'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NuevoPagoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [authorized, setAuthorized] = useState(false);
  const [gimnasioId, setGimnasioId] = useState(
    searchParams.get('gimnasio') || ''
  );
  const [gimnasios, setGimnasios] = useState<{id: string, nombre: string}[]>([]);
  const [monto, setMonto] = useState('');
  const [meses, setMeses] = useState(1);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true); // Loading auth initially
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const jwtData = user?.app_metadata as { rol?: string };

      if (jwtData?.rol !== 'system_admin') {
        router.replace('/');
        return;
      }
      setAuthorized(true);
      setLoading(false);
      cargarGimnasios();
    }
    checkAuth();
  }, [router, supabase]);

  async function cargarGimnasios() {
    try {
      const { data } = await supabase
        .from('gimnasios')
        .select('id, nombre')
        .order('nombre');
      setGimnasios(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error('Usuario no autenticado');

      // Calcular fechas
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + meses);

      // Llamar al RPC para procesar todo el pago en una transacción desde la base de datos
      const { data, error: rpcError } = await supabase.rpc('registrar_pago_suscripcion', {
        p_gimnasio_id: gimnasioId,
        p_monto: parseFloat(monto),
        p_meses: meses,
        p_notas: notas
      });

      if (rpcError) throw rpcError;

      // Refrescar sesión para actualizar cualquier token local
      await supabase.auth.refreshSession();

      // Redirigir al dashboard
      router.push('/backoffice/suscripciones');
    } catch (err: unknown) {
      let message = 'Error al registrar pago';

      if (err instanceof Error) {
        // Parsear errores de Supabase lanzados desde el RPC
        if (err.message.includes('No tienes permiso')) {
          message = 'No tienes permiso para registrar pagos (se requiere system_admin).';
        } else if (err.message.includes('Gimnasio no encontrado')) {
          message = 'El gimnasio seleccionado no existe.';
        } else if (err.message.includes('El monto debe ser mayor a 0')) {
          message = 'El monto del pago debe ser mayor a $0.';
        } else if (err.message.includes('Los meses deben estar entre 1 y 36')) {
          message = 'La cantidad de meses debe estar entre 1 y 36.';
        } else if (err.message.includes('Este gimnasio ya tiene una suscripción activa')) {
          message = 'Este gimnasio ya tiene una suscripción activa. No se pueden registrar pagos superpuestos por ahora.';
        } else {
          message = err.message;
        }
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-white">Verificando permisos...</div>;
  if (!authorized) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">
        Registrar Nuevo Pago
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-zinc-800 p-6 rounded-lg space-y-4"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded">
            {error}
          </div>
        )}

        {/* Seleccionar Gimnasio */}
        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            Gimnasio
          </label>
          <select
            value={gimnasioId}
            onChange={(e) => setGimnasioId(e.target.value)}
            required
            className="w-full bg-black text-white border border-zinc-700 px-3 py-2 rounded"
          >
            <option value="">Seleccionar gimnasio...</option>
            {gimnasios.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Monto Pagado */}
        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            Monto Pagado ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
            className="w-full bg-black text-white border border-zinc-700 px-3 py-2 rounded"
            placeholder="5000"
          />
        </div>

        {/* Cantidad de Meses */}
        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            Meses pagados
          </label>
          <select
            value={meses}
            onChange={(e) => setMeses(parseInt(e.target.value))}
            className="w-full bg-black text-white border border-zinc-700 px-3 py-2 rounded"
          >
            <option value={1}>1 mes</option>
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-zinc-300 font-medium mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full bg-black text-white border border-zinc-700 px-3 py-2 rounded"
            placeholder="Ej: Comprobante de transferencia, número de ticket, etc."
            rows={3}
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400 disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Registrar Pago'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-600"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}