'use client';

import { useEffect, type ReactNode } from 'react';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { useLayoutStore } from '@/stores/layout-store';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { MobileSidebarDrawer } from './mobile-sidebar-drawer';

interface AppShellProps {
  user: UserResponseDto;
  sidebarCollapsedInitial: boolean;
  children: ReactNode;
}

export function AppShell({ user, sidebarCollapsedInitial, children }: AppShellProps) {
  const hydrate = useLayoutStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(sidebarCollapsedInitial);
  }, [hydrate, sidebarCollapsedInitial]);

  return (
    <CurrentUserProvider user={user}>
      <div className="bg-bg-base text-text-primary flex h-screen overflow-hidden">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <MobileSidebarDrawer />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}
