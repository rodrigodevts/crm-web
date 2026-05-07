'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { getRouteTitle } from '@/lib/route-titles';
import { UserMenu } from './user-menu';

export function AppHeader() {
  const pathname = usePathname();
  const title = getRouteTitle(pathname);

  return (
    <header className="bg-bg-base border-border-default flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-text-primary text-base font-semibold">{title}</h1>
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
