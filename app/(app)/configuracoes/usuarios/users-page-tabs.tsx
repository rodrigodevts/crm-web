'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UsersPageTabsProps {
  usersSlot: ReactNode;
  invitationsSlot: ReactNode;
}

export function UsersPageTabs({ usersSlot, invitationsSlot }: UsersPageTabsProps) {
  return (
    <Tabs defaultValue="users" className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="invitations">Convites</TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="flex flex-col gap-3">
        {usersSlot}
      </TabsContent>
      <TabsContent value="invitations" className="flex flex-col gap-3">
        {invitationsSlot}
      </TabsContent>
    </Tabs>
  );
}
