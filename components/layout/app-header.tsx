'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLayoutStore } from '@/stores/layout-store';
import { getRouteTitle } from '@/lib/route-titles';
import { UserMenu } from './user-menu';

export function AppHeader() {
  const pathname = usePathname();
  const title = getRouteTitle(pathname);
  const setMobileDrawerOpen = useLayoutStore((s) => s.setMobileDrawerOpen);

  return (
    <header className="bg-bg-base border-border-default flex h-14 items-center gap-3 border-b px-4">
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setMobileDrawerOpen(true)}
        className="hover:bg-bg-muted focus-visible:ring-primary-500 rounded-md p-2 focus-visible:ring-2 focus-visible:outline-none md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-text-primary text-base font-semibold">{title}</h1>
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
