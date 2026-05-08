'use client';

import { CopyIcon, RefreshCwIcon, BanIcon } from 'lucide-react';
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

type InvitationStatus = InvitationsControllerListQueryParamsStatusEnumKey;
export type InvitationListItem = InvitationListResponseDto['items'][number];

export type InvitationsTableState = 'loading' | 'error' | 'ready';
export type InvitationAction = 'copy' | 'resend' | 'revoke';

export interface InvitationsTableViewProps {
  state: InvitationsTableState;
  items: InvitationListItem[];
  emptyStatusLabel: string;
  onAction: (action: InvitationAction, item: InvitationListItem) => void;
}

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

const ROLE_LABEL: Record<InvitationListItem['role'], string> = {
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

export function InvitationsTableView({
  state,
  items,
  emptyStatusLabel,
  onAction,
}: InvitationsTableViewProps) {
  return (
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
          {state === 'loading' ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : state === 'error' ? (
            <TableRow>
              <TableCell colSpan={6} className="text-destructive text-center">
                Erro ao carregar convites.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                Nenhum convite {emptyStatusLabel}.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.email}</TableCell>
                <TableCell>{ROLE_LABEL[item.role]}</TableCell>
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
                        onClick={() => onAction('copy', item)}
                        aria-label={`Copiar link do convite de ${item.email}`}
                      >
                        <CopyIcon className="size-4" />
                        Copiar link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('resend', item)}
                        aria-label={`Reenviar convite de ${item.email}`}
                      >
                        <RefreshCwIcon className="size-4" />
                        Reenviar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('revoke', item)}
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
  );
}
