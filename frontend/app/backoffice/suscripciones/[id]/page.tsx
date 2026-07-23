'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Suscripcion {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  monto_pagado: number;
  meses_pagados: number;
  notas: string;
  creado_at: string;
}

interface Evento {
  id: string;
  tipo_evento: string;
  descripcion: string;
  creado_at: string;
}

export default function DetallesGimnasioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const supabase = createClient();
  const router = useRouter();
  const [gimnasio, setGimnasio] = useState<{nombre: string} | null>(null);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function cargarDetalles() {
      const { data: { user } } = await supabase.auth.getUser();
      const jwtData = user?.app_metadata as { rol?: string };

      if (jwtData?.rol !== 'system_admin') {
        router.replace('/');
        return;
      }
      setAuthorized(true);
      setLoading(true);
      try {
        // Gimnasio
        const { data: gymData } = await supabase
          .from('gimnasios')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();
        setGimnasio(gymData);

        // Suscripciones
        const { data: subData } = await supabase
          .from('suscripciones')
          .select('*')
          .eq('gimnasio_id', resolvedParams.id)
          .order('creado_at', { ascending: false });
        setSuscripciones(subData || []);

        // Eventos
        const { data: evData } = await supabase
          .from('eventos_suscripcion')
          .select('*')
          .eq('gimnasio_id', resolvedParams.id)
          .order('creado_at', { ascending: false });
        setEventos(evData || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    cargarDetalles();
  }, [resolvedParams.id, supabase, router]);

  if (loading) return <div className="text-white">Cargando...</div>;
  if (!authorized) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">
        {gimnasio?.nombre}
      </h2>

      {/* Suscripciones */}
      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Historial de Pagos
        </h3>
        <div className="space-y-3">
          {suscripciones.length === 0 ? (
            <p className="text-zinc-400">No hay pagos registrados</p>
          ) : (
            suscripciones.map((sub) => (
              <div
                key={sub.id}
                className="bg-black p-3 rounded border border-zinc-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-bold">
                      ${sub.monto_pagado} - {sub.meses_pagados} mes(es)
                    </p>
                    <p className="text-sm text-zinc-400">
                      {new Date(sub.fecha_inicio).toLocaleDateString('es-AR')}
                      {' '} a {' '}
                      {new Date(sub.fecha_fin).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    sub.estado === 'activa'
                      ? 'bg-green-500/20 text-green-400'
                      : sub.estado === 'expirada'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {sub.estado.toUpperCase()}
                  </span>
                </div>
                {sub.notas && (
                  <p className="text-xs text-zinc-400 mt-2">
                    Notas: {sub.notas}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Evento Audit Log */}
      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Registro de Eventos
        </h3>
        <div className="space-y-2 text-sm">
          {eventos.length === 0 ? (
            <p className="text-zinc-400">No hay eventos</p>
          ) : (
            eventos.map((evt) => (
              <div key={evt.id} className="text-zinc-300 border-b border-zinc-700 pb-2">
                <p className="font-bold text-amber-400">
                  {evt.tipo_evento.toUpperCase()}
                </p>
                <p>{evt.descripcion}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(evt.creado_at).toLocaleString('es-AR')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}