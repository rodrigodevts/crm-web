import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  if (!user) {
    redirect('/login');
  }

  // shadcn `SidebarProvider` lê o cookie `sidebar_state` (default `true` se ausente).
  // Mantemos o mesmo comportamento server-side pra evitar flash no first paint.
  const cookieStore = await cookies();
  const defaultSidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <AppShell user={user} defaultSidebarOpen={defaultSidebarOpen}>
      {children}
    </AppShell>
  );
}
