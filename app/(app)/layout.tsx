import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const sidebarCollapsedInitial = cookieStore.get('digichat_sidebar')?.value === 'collapsed';

  return (
    <AppShell user={user} sidebarCollapsedInitial={sidebarCollapsedInitial}>
      {children}
    </AppShell>
  );
}
