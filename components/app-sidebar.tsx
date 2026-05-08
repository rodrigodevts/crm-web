'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  ChevronDown,
  HelpCircle,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Settings,
  Users,
} from 'lucide-react';
import { NavMain, type NavMainItem } from '@/components/nav-main';
import { NavSecondary, type NavSecondaryItem } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { useCurrentUser } from '@/contexts/current-user-context';
import { canAccessAdminAreas } from '@/lib/rbac';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navMain: NavMainItem[] = [
  { title: 'Atendimentos', url: '/atendimentos', icon: MessageSquare },
  { title: 'Contatos', url: '/contatos', icon: Users },
  { title: 'Campanhas', url: '/campanhas', icon: Megaphone },
  { title: 'Bot/Fluxo', url: '/bot-fluxo', icon: Bot },
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
];

const settingsSubItems = [
  { href: '/configuracoes/departamentos', label: 'Departamentos' },
  { href: '/configuracoes/tags', label: 'Tags' },
  { href: '/configuracoes/usuarios', label: 'Usuários' },
  { href: '/configuracoes/quick-replies', label: 'Quick Replies' },
  { href: '/configuracoes/canais', label: 'Canais' },
  { href: '/configuracoes/integracoes', label: 'Integrações' },
  { href: '/configuracoes/preferencias', label: 'Preferências' },
] as const;

const navSecondary: NavSecondaryItem[] = [{ title: 'Ajuda', url: '/ajuda', icon: HelpCircle }];

function isRouteActive(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function ConfiguracoesMenu() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const settingsActive = isRouteActive(pathname, '/configuracoes');

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Collapsible defaultOpen={settingsActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Configurações" isActive={settingsActive}>
                  <Settings />
                  <span>Configurações</span>
                  <ChevronDown
                    aria-hidden
                    className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {settingsSubItems.map((sub) => (
                    <SidebarMenuSubItem key={sub.href}>
                      <SidebarMenuSubButton asChild isActive={isRouteActive(pathname, sub.href)}>
                        <Link href={sub.href} onClick={() => setOpenMobile(false)}>
                          {sub.label}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser();
  const showAdminAreas = canAccessAdminAreas(user.role);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/atendimentos">
                <MessagesSquare className="size-5!" />
                <span className="text-base font-semibold">DigiChat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {showAdminAreas ? <ConfiguracoesMenu /> : null}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
