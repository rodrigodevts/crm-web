'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  ChevronDown,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const TOP_LEVEL = [
  { href: '/atendimentos', icon: MessageSquare, label: 'Atendimentos' },
  { href: '/contatos', icon: Users, label: 'Contatos' },
  { href: '/campanhas', icon: Megaphone, label: 'Campanhas' },
  { href: '/bot-fluxo', icon: Bot, label: 'Bot/Fluxo' },
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
] as const;

const SETTINGS_SUB_ITEMS = [
  { href: '/configuracoes/departamentos', label: 'Departamentos' },
  { href: '/configuracoes/tags', label: 'Tags' },
  { href: '/configuracoes/usuarios', label: 'Usuários' },
  { href: '/configuracoes/quick-replies', label: 'Quick Replies' },
  { href: '/configuracoes/canais', label: 'Canais' },
  { href: '/configuracoes/integracoes', label: 'Integrações' },
  { href: '/configuracoes/preferencias', label: 'Preferências' },
] as const;

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const settingsActive = isRouteActive(pathname, '/configuracoes');

  const handleNavigate = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-4">
        <span className="text-text-primary text-lg font-semibold group-data-[collapsible=icon]:hidden">
          DigiChat
        </span>
        <span className="text-text-primary hidden text-center text-lg font-semibold group-data-[collapsible=icon]:block">
          D
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {TOP_LEVEL.map((item) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href} onClick={handleNavigate}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <Collapsible defaultOpen={settingsActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={settingsActive} tooltip="Configurações">
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
                      {SETTINGS_SUB_ITEMS.map((sub) => (
                        <SidebarMenuSubItem key={sub.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isRouteActive(pathname, sub.href)}
                          >
                            <Link href={sub.href} onClick={handleNavigate}>
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
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
