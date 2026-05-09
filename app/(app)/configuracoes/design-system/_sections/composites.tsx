'use client';

import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import { LoginForm } from '@/components/login-form';
import { AcceptInviteForm } from '@/components/accept-invite-form';
import { UsersTableView } from '@/components/users/users-table-view';
import { InvitationsTableView } from '@/components/users/invitations-table-view';
import { Section } from './section';

type UserItem = UserListResponseDto['items'][number];
type InvItem = InvitationListResponseDto['items'][number];

const mockUsers: UserItem[] = [
  {
    id: '00000000-0000-7000-8000-000000000001',
    companyId: '00000000-0000-7000-8000-0000000000aa',
    name: 'Maria Atendente',
    email: 'maria@example.com',
    role: 'AGENT',
    active: true,
    absenceMessage: null,
    absenceActive: false,
    lastSeenAt: '2026-05-08T10:30:00.000Z',
    departments: [{ id: 'd1', name: 'Suporte' }],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-08T10:30:00.000Z',
  },
  {
    id: '00000000-0000-7000-8000-000000000002',
    companyId: '00000000-0000-7000-8000-0000000000aa',
    name: 'João Admin',
    email: 'joao@example.com',
    role: 'ADMIN',
    active: true,
    absenceMessage: 'De férias',
    absenceActive: true,
    lastSeenAt: '2026-05-07T09:15:00.000Z',
    departments: [
      { id: 'd1', name: 'Suporte' },
      { id: 'd2', name: 'Vendas' },
    ],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-07T09:15:00.000Z',
  },
  {
    id: '00000000-0000-7000-8000-000000000003',
    companyId: '00000000-0000-7000-8000-0000000000aa',
    name: 'Ana Atendente',
    email: 'ana@example.com',
    role: 'AGENT',
    active: true,
    absenceMessage: null,
    absenceActive: false,
    lastSeenAt: null,
    departments: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
];

const mockMe: UserResponseDto = {
  id: '00000000-0000-7000-8000-0000000000ad',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Admin Demo',
  email: 'admin@example.com',
  role: 'ADMIN',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: null,
  departments: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const noopUserAction = () => {
  /* decorativo */
};

const mockInvitations: InvItem[] = [
  {
    id: '00000000-0000-7000-8000-000000000010',
    email: 'pendente@example.com',
    role: 'AGENT',
    status: 'PENDING',
    invitedById: '00000000-0000-7000-8000-000000000002',
    invitedByName: 'João Admin',
    acceptedById: null,
    acceptedAt: null,
    revokedAt: null,
    createdAt: '2026-05-08T08:00:00.000Z',
  },
  {
    id: '00000000-0000-7000-8000-000000000011',
    email: 'aceito@example.com',
    role: 'ADMIN',
    status: 'ACCEPTED',
    invitedById: '00000000-0000-7000-8000-000000000002',
    invitedByName: 'João Admin',
    acceptedById: '00000000-0000-7000-8000-000000000004',
    acceptedAt: '2026-05-06T10:00:00.000Z',
    revokedAt: null,
    createdAt: '2026-05-05T08:00:00.000Z',
  },
  {
    id: '00000000-0000-7000-8000-000000000012',
    email: 'revogado@example.com',
    role: 'AGENT',
    status: 'REVOKED',
    invitedById: '00000000-0000-7000-8000-000000000002',
    invitedByName: 'João Admin',
    acceptedById: null,
    acceptedAt: null,
    revokedAt: '2026-05-03T11:00:00.000Z',
    createdAt: '2026-05-01T08:00:00.000Z',
  },
];

export function Composites() {
  return (
    <Section id="compostos" title="Compostos">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-medium">LoginForm</h3>
          <p className="text-muted-foreground text-xs">
            Submit dispara request real — visualização apenas.
          </p>
          <LoginForm />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-base font-medium">AcceptInviteForm</h3>
          <p className="text-muted-foreground text-xs">Mock data — submit decorativo.</p>
          <AcceptInviteForm
            token="mock-token"
            email="convidado@example.com"
            role="AGENT"
            companyName="Empresa Demo"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">UsersTableView — estado ready</h3>
        <UsersTableView
          state="ready"
          items={mockUsers}
          me={mockMe}
          canEditItem={() => true}
          canDeactivateItem={() => true}
          canForceLogoutItem={() => true}
          onEdit={noopUserAction}
          onDeactivate={noopUserAction}
          onForceLogout={noopUserAction}
          onReactivate={noopUserAction}
        />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">UsersTableView — estado loading</h3>
        <UsersTableView
          state="loading"
          items={[]}
          me={mockMe}
          canEditItem={() => true}
          canDeactivateItem={() => true}
          canForceLogoutItem={() => true}
          onEdit={noopUserAction}
          onDeactivate={noopUserAction}
          onForceLogout={noopUserAction}
          onReactivate={noopUserAction}
        />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">UsersTableView — estado error</h3>
        <UsersTableView
          state="error"
          items={[]}
          me={mockMe}
          canEditItem={() => true}
          canDeactivateItem={() => true}
          canForceLogoutItem={() => true}
          onEdit={noopUserAction}
          onDeactivate={noopUserAction}
          onForceLogout={noopUserAction}
          onReactivate={noopUserAction}
        />
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">InvitationsTableView — estado ready</h3>
        <InvitationsTableView
          state="ready"
          items={mockInvitations}
          emptyStatusLabel="pendente"
          onAction={() => {
            /* decorativo */
          }}
        />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">InvitationsTableView — estado loading</h3>
        <InvitationsTableView
          state="loading"
          items={[]}
          emptyStatusLabel="pendente"
          onAction={() => {}}
        />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">InvitationsTableView — estado error</h3>
        <InvitationsTableView
          state="error"
          items={[]}
          emptyStatusLabel="pendente"
          onAction={() => {}}
        />
      </div>
    </Section>
  );
}
