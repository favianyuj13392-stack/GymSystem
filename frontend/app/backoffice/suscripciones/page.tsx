'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Gimnasio {
  id: string;
  nombre: string;
  activo_hasta: string | null;
  suscripcion_activa_id: string | null;
  suscripcion_activa: boolean;
}

export default function SuscripcionesPage() {
  const [gimnasios, setGimnasios] = useState<Gimnasio[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const jwtData = user?.app_metadata as { rol?: string };

      if (jwtData?.rol !== 'system_admin') {
        router.replace('/');
        return;
      }
      setAuthorized(true);
      cargarGimnasios();
    }
    checkAuth();
  }, [router, supabase]);

  async function cargarGimnasios() {
    setLoading(true);
    try {
      // Obtener todos los gimnasios con su estado de suscripción
      const { data, error } = await supabase
        .from('gimnasios')
        .select(`
          id,
          nombre,
          activo_hasta,
          suscripcion_activa_id
        `)
        .order('nombre');

      if (error) throw error;

      // Enriquecer con estado actual
      const gimnasiosConEstado = await Promise.all(
        (data || []).map(async (gym) => {
          let activo = false;

          if (gym.suscripcion_activa_id) {
            const { data: suscripcion } = await supabase
              .from('suscripciones')
              .select('estado, fecha_fin')
              .eq('id', gym.suscripcion_activa_id)
              .single();

            if (suscripcion) {
                activo =
                  suscripcion.estado === 'activa' &&
                  new Date(suscripcion.fecha_fin) >= new Date();
            }
          }

          return {
            ...gym,
            suscripcion_activa: activo,
          };
        })
      );

      setGimnasios(gimnasiosConEstado);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleRenovar(gimnasioId: string) {
    // Redirigir al formulario de pago pre-llenado
    router.push(`/backoffice/suscripciones/nuevo?gimnasio=${gimnasioId}`);
  }

  if (loading) return <div className="text-white">Cargando...</div>;
  if (!authorized) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          Gestión de Suscripciones
        </h2>
        <Link
          href="/backoffice/suscripciones/nuevo"
          className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400"
        >
          + Registrar Pago
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-zinc-100 text-sm">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-4 py-2">Gimnasio</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Válido hasta</th>
              <th className="px-4 py-2">Días restantes</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gimnasios.map((gym) => {
              const diasRestantes = gym.activo_hasta
                ? Math.ceil(
                    (new Date(gym.activo_hasta).getTime() -
                     new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                  )
                : -1;

              const statusColor =
                diasRestantes < 0 ? 'text-red-500' :
                diasRestantes < 7 ? 'text-yellow-500' :
                'text-green-500';

              return (
                <tr key={gym.id} className="border-b border-zinc-700">
                  <td className="px-4 py-3 font-medium">{gym.nombre}</td>
                  <td className={`px-4 py-3 font-bold ${statusColor}`}>
                    {gym.suscripcion_activa ? 'ACTIVO' : 'EXPIRADO'}
                  </td>
                  <td className="px-4 py-3">
                    {gym.activo_hasta
                      ? new Date(gym.activo_hasta).toLocaleDateString('es-AR')
                      : '—'}
                  </td>
                  <td className={`px-4 py-3 ${statusColor}`}>
                    {diasRestantes >= 0 ? `${diasRestantes} días` : 'VENCIDO'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/backoffice/suscripciones/${gym.id}`}
                      className="text-amber-500 hover:text-amber-400 mr-4"
                    >
                      Ver detalles
                    </Link>
                    <button
                      onClick={() => handleRenovar(gym.id)}
                      className="text-green-500 hover:text-green-400"
                    >
                      Renovar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}