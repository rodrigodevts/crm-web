'use client';

import { type ReactNode } from 'react';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

interface AppShellProps {
  user: UserResponseDto;
  defaultSidebarOpen: boolean;
  children: ReactNode;
}

export function AppShell({ user, defaultSidebarOpen, children }: AppShellProps) {
  return (
    <CurrentUserProvider user={user}>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
