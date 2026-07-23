import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar que sea superadmin global (rol especial en auth.users o en app_metadata)
  // En nuestra base, el superadmin global podría tener un gimnasio_id = null o
  // estar manejado con un rol específico. Vamos a buscarlo en la tabla empleados.
  const { data: adminData } = await supabase
    .from('empleados')
    .select('rol')
    .eq('id', user.id)
    .single();

  // Para el backoffice global necesitamos asegurarnos de que el usuario es el dueño del SaaS
  // Podemos asumirlo si su rol es superadmin y quizás un flag adicional o chequeo de ID.
  // Por ahora lo simplificamos a superadmin.
  if (adminData?.rol !== 'superadmin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <nav className="bg-black border-b border-zinc-800 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-white font-bold">GymControl Admin</h1>
          <div className="text-zinc-400 text-sm">
            {user.email}
          </div>
        </div>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}