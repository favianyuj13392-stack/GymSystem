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

  // Verificar que sea el dueño del SaaS a través de los metadatos de JWT
  const jwtData = user.app_metadata as { rol?: string };
  if (jwtData?.rol !== 'system_admin') {
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