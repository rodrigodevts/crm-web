'use client';

import { useEffect } from 'react';
import { useLayoutStore } from '@/stores/layout-store';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="fixed inset-y-0 left-0 h-full w-72 max-w-full translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:rounded-none">
        <DialogTitle className="sr-only">Menu de navegação</DialogTitle>
        <AppSidebar variant="mobile" onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
