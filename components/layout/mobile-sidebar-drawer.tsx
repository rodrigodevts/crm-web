'use client';

import { useEffect } from 'react';
import { useLayoutStore } from '@/stores/layout-store';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AppSidebar } from './app-sidebar';

const MD_BREAKPOINT_PX = 768;

export function MobileSidebarDrawer() {
  const open = useLayoutStore((s) => s.mobileDrawerOpen);
  const setOpen = useLayoutStore((s) => s.setMobileDrawerOpen);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= MD_BREAKPOINT_PX && open) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, setOpen]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <AppSidebar variant="mobile" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
