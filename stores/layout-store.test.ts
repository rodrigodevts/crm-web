import { describe, expect, it, beforeEach } from 'vitest';
import { useLayoutStore } from './layout-store';

describe('layoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({ sidebarCollapsed: false, mobileDrawerOpen: false });
    document.cookie = 'digichat_sidebar=; path=/; max-age=0';
  });

  it('default state: sidebar expanded, drawer closed', () => {
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
    expect(useLayoutStore.getState().mobileDrawerOpen).toBe(false);
  });

  it('toggleSidebar alterna estado e escreve cookie', () => {
    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);
    expect(document.cookie).toContain('digichat_sidebar=collapsed');

    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
    expect(document.cookie).toContain('digichat_sidebar=expanded');
  });

  it('hydrate aplica valor inicial vindo do cookie', () => {
    useLayoutStore.getState().hydrate(true);
    expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);
  });

  it('setMobileDrawerOpen controla o drawer mobile sem afetar cookie', () => {
    useLayoutStore.getState().setMobileDrawerOpen(true);
    expect(useLayoutStore.getState().mobileDrawerOpen).toBe(true);
    expect(document.cookie).not.toContain('digichat_sidebar');
  });
});
