import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  // Opcional: verificar header de seguridad para Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc('expirar_suscripciones_vencidas');
    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
