'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CopyIcon, RefreshCwIcon, BanIcon } from 'lucide-react';
import {
  useInvitationsControllerList,
  invitationsControllerListQueryKey,
} from '@/lib/generated/hooks/useInvitationsControllerList';
import { useInvitationsControllerRevoke } from '@/lib/generated/hooks/useInvitationsControllerRevoke';
import { useInvitationsControllerResend } from '@/lib/generated/hooks/useInvitationsControllerResend';
import { apiClient } from '@/lib/api-client';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import type { InvitationsControllerListQueryParamsStatusEnumKey } from '@/lib/generated/types/InvitationsControllerList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type InvitationStatus = InvitationsControllerListQueryParamsStatusEnumKey;
type InvitationListItem = InvitationListResponseDto['items'][number];

const STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  REVOKED: 'Revogado',
};

const STATUS_VARIANT: Record<InvitationStatus, 'default' | 'secondary' | 'outline'> = {
  PENDING: 'default',
  ACCEPTED: 'secondary',
  REVOKED: 'outline',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Atendente',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

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

  const invalidateAll = () =>
    queryClient.invalidateQueries({
      queryKey: invitationsControllerListQueryKey(),
      exact: false,
    });

  const onCopyById = async (item: InvitationListItem) => {
    // Não temos inviteUrl no GET (apenas no Create/Resend response). Resolução simples:
    // chama resend, copia a URL retornada, atualiza a lista.
    try {
      const refreshed = await resend.mutateAsync({ id: item.id });
      const ok = await copyToClipboard(refreshed.inviteUrl);
      if (ok) toast.info('Link copiado para a área de transferência');
      else toast.error('Não foi possível copiar o link');
      void invalidateAll();
    } catch {
      toast.error('Não foi possível obter o link do convite');
    }
  };

  const onResend = async (item: InvitationListItem) => {
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
  };

  const onRevoke = async (item: InvitationListItem) => {
    if (!window.confirm(`Revogar o convite de ${item.email}?`)) return;
    try {
      await revoke.mutateAsync({ id: item.id });
      toast.success(`Convite de ${item.email} revogado`);
      void invalidateAll();
    } catch {
      toast.error('Não foi possível revogar o convite');
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Convidado por</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive text-center">
                  Erro ao carregar convites.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Nenhum convite {STATUS_LABEL[status].toLowerCase()}.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>{ROLE_LABEL[item.role] ?? item.role}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                  </TableCell>
                  <TableCell>{item.invitedByName}</TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {item.status === 'PENDING' ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void onCopyById(item)}
                          aria-label={`Copiar link do convite de ${item.email}`}
                        >
                          <CopyIcon className="size-4" />
                          Copiar link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void onResend(item)}
                          aria-label={`Reenviar convite de ${item.email}`}
                        >
                          <RefreshCwIcon className="size-4" />
                          Reenviar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void onRevoke(item)}
                          aria-label={`Revogar convite de ${item.email}`}
                        >
                          <BanIcon className="size-4" />
                          Revogar
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
