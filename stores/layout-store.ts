import { create } from 'zustand';

const SIDEBAR_COOKIE = 'digichat_sidebar';
const SIDEBAR_MAX_AGE_SEC = 60 * 60 * 24 * 365;

function writeSidebarCookie(collapsed: boolean) {
  if (typeof document === 'undefined') return;
  const value = collapsed ? 'collapsed' : 'expanded';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${SIDEBAR_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

interface LayoutState {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  hydrate: (sidebarCollapsed: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    writeSidebarCookie(next);
    set({ sidebarCollapsed: next });
  },
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
  hydrate: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
