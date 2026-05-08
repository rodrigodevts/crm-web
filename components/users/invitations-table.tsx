'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useInvitationsControllerList,
  invitationsControllerListQueryKey,
} from '@/lib/generated/hooks/useInvitationsControllerList';
import { useInvitationsControllerRevoke } from '@/lib/generated/hooks/useInvitationsControllerRevoke';
import { useInvitationsControllerResend } from '@/lib/generated/hooks/useInvitationsControllerResend';
import { apiClient } from '@/lib/api-client';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import type { InvitationsControllerListQueryParamsStatusEnumKey } from '@/lib/generated/types/InvitationsControllerList';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InvitationsTableView,
  type InvitationsTableState,
  type InvitationAction,
} from './invitations-table-view';

type InvitationStatus = InvitationsControllerListQueryParamsStatusEnumKey;
type InvitationListItem = InvitationListResponseDto['items'][number];

const STATUS_EMPTY_LABEL: Record<InvitationStatus, string> = {
  PENDING: 'pendente',
  ACCEPTED: 'aceito',
  REVOKED: 'revogado',
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  return false;
}

export function InvitationsTable() {
  const [status, setStatus] = useState<InvitationStatus>('PENDING');
  const queryClient = useQueryClient();

  const query = useInvitationsControllerList(
    { status, limit: 50 },
    { client: { client: apiClient } },
  );
  const revoke = useInvitationsControllerRevoke({ client: { client: apiClient } });
  const resend = useInvitationsControllerResend({ client: { client: apiClient } });

  const items: InvitationListItem[] = query.data?.items ?? [];

  const tableState: InvitationsTableState = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  const invalidateAll = () =>
    queryClient.invalidateQueries({
      queryKey: invitationsControllerListQueryKey(),
      exact: false,
    });

  const handleAction = async (action: InvitationAction, item: InvitationListItem) => {
    if (action === 'copy') {
      try {
        const refreshed = await resend.mutateAsync({ id: item.id });
        const ok = await copyToClipboard(refreshed.inviteUrl);
        if (ok) toast.info('Link copiado para a área de transferência');
        else toast.error('Não foi possível copiar o link');
        void invalidateAll();
      } catch {
        toast.error('Não foi possível obter o link do convite');
      }
      return;
    }
    if (action === 'resend') {
      try {
        const refreshed = await resend.mutateAsync({ id: item.id });
        toast.success(`Novo link gerado para ${refreshed.email}`, {
          action: {
            label: 'Copiar link',
            onClick: () => {
              void copyToClipboard(refreshed.inviteUrl).then((ok) => {
                if (ok) toast.info('Link copiado');
                else toast.error('Não foi possível copiar');
              });
            },
          },
        });
        void invalidateAll();
      } catch {
        toast.error('Não foi possível reenviar o convite');
      }
      return;
    }
    if (action === 'revoke') {
      if (!window.confirm(`Revogar o convite de ${item.email}?`)) return;
      try {
        await revoke.mutateAsync({ id: item.id });
        toast.success(`Convite de ${item.email} revogado`);
        void invalidateAll();
      } catch {
        toast.error('Não foi possível revogar o convite');
      }
      return;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as InvitationStatus)}>
        <TabsList>
          <TabsTrigger value="PENDING">Pendentes</TabsTrigger>
          <TabsTrigger value="ACCEPTED">Aceitos</TabsTrigger>
          <TabsTrigger value="REVOKED">Revogados</TabsTrigger>
        </TabsList>
      </Tabs>

      <InvitationsTableView
        state={tableState}
        items={items}
        emptyStatusLabel={STATUS_EMPTY_LABEL[status]}
        onAction={(action, item) => void handleAction(action, item)}
      />
    </div>
  );
}
