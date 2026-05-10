import type { Metadata } from 'next';
import { InviteUserDialog } from '@/components/users/invite-user-dialog';
import { InvitationsTable } from '@/components/users/invitations-table';
import { UsersTable } from '@/components/users/users-table';
import { UsersPageTabs } from './users-page-tabs';

export const metadata: Metadata = { title: 'Usuários — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Usuários</h1>
          <p className="text-muted-foreground text-sm">Gerencie usuários e convites do tenant.</p>
        </div>
        <InviteUserDialog />
      </header>

      <UsersPageTabs usersSlot={<UsersTable />} invitationsSlot={<InvitationsTable />} />
    </div>
  );
}
