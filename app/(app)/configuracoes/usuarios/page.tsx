import type { Metadata } from 'next';
import { InviteUserDialog } from '@/components/users/invite-user-dialog';
import { InvitationsTable } from '@/components/users/invitations-table';

export const metadata: Metadata = { title: 'Usuários — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-semibold">Usuários</h1>
          <p className="text-text-secondary text-sm">
            Convide novos usuários e acompanhe os convites pendentes.
          </p>
        </div>
        <InviteUserDialog />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-text-primary text-lg font-medium">Convites</h2>
        <InvitationsTable />
      </section>

      {/*
        TODO (gap §4.8): listagem de usuários ativos (UsersTable) ainda não implementada
        nesta sprint. O hook gerado já existe em lib/generated/hooks/useUsersControllerList.ts;
        sprint dedicada cobre essa parte separadamente.
      */}
    </div>
  );
}
