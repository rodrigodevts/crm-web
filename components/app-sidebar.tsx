'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Bot,
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navMain: NavMainItem[] = [
  { title: 'Atendimentos', url: '/atendimentos', icon: MessageSquare },
  { title: 'Contatos', url: '/contatos', icon: Users },
  { title: 'Campanhas', url: '/campanhas', icon: Megaphone },
  { title: 'Bot/Fluxo', url: '/bot-fluxo', icon: Bot },
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
];

const navSecondary: NavSecondaryItem[] = [
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
  { title: 'Ajuda', url: '/ajuda', icon: HelpCircle },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/atendimentos">
                <MessagesSquare className="h-5 w-5" />
                <span className="text-base font-semibold">DigiChat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
