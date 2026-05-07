'use client';

import {
  BarChart3,
  Bot,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import { useLayoutStore } from '@/stores/layout-store';
import { AppSidebarItem } from './app-sidebar-item';
import { AppSidebarSection, type SidebarSubItem } from './app-sidebar-section';
import { cn } from '@/lib/utils';

const TOP_LEVEL = [
  { href: '/atendimentos', icon: MessageSquare, label: 'Atendimentos' },
  { href: '/contatos', icon: Users, label: 'Contatos' },
  { href: '/campanhas', icon: Megaphone, label: 'Campanhas' },
  { href: '/bot-fluxo', icon: Bot, label: 'Bot/Fluxo' },
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
] as const;

const SETTINGS_SUB_ITEMS: SidebarSubItem[] = [
  { href: '/configuracoes/departamentos', label: 'Departamentos' },
  { href: '/configuracoes/tags', label: 'Tags' },
  { href: '/configuracoes/usuarios', label: 'Usuários' },
  { href: '/configuracoes/quick-replies', label: 'Quick Replies' },
  { href: '/configuracoes/canais', label: 'Canais' },
  { href: '/configuracoes/integracoes', label: 'Integrações' },
  { href: '/configuracoes/preferencias', label: 'Preferências' },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  variant?: 'desktop' | 'mobile';
}

export function AppSidebar({ onNavigate, variant = 'desktop' }: AppSidebarProps) {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed) && variant === 'desktop';
  const toggle = useLayoutStore((s) => s.toggleSidebar);

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        'bg-bg-subtle border-border-default flex h-full flex-col border-r transition-[width]',
        variant === 'desktop' && (collapsed ? 'w-16' : 'w-60'),
        variant === 'mobile' && 'w-72',
      )}
    >
      <div className="border-border-default border-b px-4 py-4">
        <span
          className={cn(
            'text-text-primary text-lg font-semibold',
            collapsed && variant === 'desktop' && 'text-center',
          )}
        >
          {collapsed && variant === 'desktop' ? 'D' : 'DigiChat'}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {TOP_LEVEL.map((item) => (
          <AppSidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
        <AppSidebarSection
          href="/configuracoes"
          icon={Settings}
          label="Configurações"
          collapsed={collapsed}
          items={SETTINGS_SUB_ITEMS}
          onNavigate={onNavigate}
        />
      </nav>

      {variant === 'desktop' ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={cn(
            'border-border-default text-text-secondary hover:bg-bg-muted flex items-center gap-2 border-t px-4 py-3 text-sm',
            'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {collapsed ? null : <span>Recolher</span>}
        </button>
      ) : null}
    </aside>
  );
}
