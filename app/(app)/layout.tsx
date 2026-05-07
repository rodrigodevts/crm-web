import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  if (!user) {
    redirect('/login');
  }

  // SidebarProvider lê o cookie `sidebar_state`. Default `true` se ausente.
  const cookieStore = await cookies();
  const defaultSidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <CurrentUserProvider user={user}>
      <SidebarProvider
        defaultOpen={defaultSidebarOpen}
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
