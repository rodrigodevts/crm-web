'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import {
  useChannelsControllerList,
  channelsControllerListQueryKey,
} from '@/lib/generated/hooks/useChannelsControllerList';
import { useChannelsControllerActivate } from '@/lib/generated/hooks/useChannelsControllerActivate';
import { useChannelsControllerDeactivate } from '@/lib/generated/hooks/useChannelsControllerDeactivate';
import { useChannelsControllerRestart } from '@/lib/generated/hooks/useChannelsControllerRestart';
import { useChannelsControllerRemove } from '@/lib/generated/hooks/useChannelsControllerRemove';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import type {
  ChannelResponseDto,
  ChannelResponseDtoStatusEnumKey,
} from '@/lib/generated/types/ChannelResponseDto';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChannelsTableView } from './channels-table-view';
import { ChannelDialog } from './channel-dialog';
import { DeleteChannelDialog, type DeleteBlockedCounts } from './delete-channel-dialog';

type StatusFilter = 'all' | ChannelResponseDtoStatusEnumKey;

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'CONNECTING', label: 'Conectando' },
  { value: 'AWAITING_QR', label: 'Aguardando QR' },
  { value: 'CONNECTED', label: 'Conectado' },
  { value: 'DISCONNECTED', label: 'Desconectado' },
  { value: 'ERROR', label: 'Erro' },
];

type AxiosErrorShape = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      details?: { openTicketsCount?: number; pendingTicketsCount?: number };
    };
  };
};

export function ChannelsTable() {
  const filterId = useId();
  const me = useCurrentUser();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ChannelResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelResponseDto | null>(null);
  const [deleteBlockedCounts, setDeleteBlockedCounts] = useState<DeleteBlockedCounts | null>(null);

  const listParams = useMemo(
    () => ({
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
    [deferredSearch, statusFilter],
  );

  const channelsQuery = useChannelsControllerList(listParams, { client: { client: apiClient } });
  const departmentsQuery = useDepartmentsControllerList(
    { limit: 100, active: true },
    { client: { client: apiClient } },
  );

  const activate = useChannelsControllerActivate({ client: { client: apiClient } });
  const deactivate = useChannelsControllerDeactivate({ client: { client: apiClient } });
  const restart = useChannelsControllerRestart({ client: { client: apiClient } });
  const remove = useChannelsControllerRemove({ client: { client: apiClient } });

  const items = channelsQuery.data?.items ?? [];
  const connectedCount = channelsQuery.data?.connectedCount ?? 0;
  const totalCount = channelsQuery.data?.totalCount ?? 0;
  const hasFilters = deferredSearch.trim().length > 0 || statusFilter !== 'all';
  const state = channelsQuery.isPending ? 'loading' : channelsQuery.isError ? 'error' : 'ready';

  const departmentsById = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of departmentsQuery.data?.items ?? []) out[d.id] = d.name;
    return out;
  }, [departmentsQuery.data]);

  function invalidate(): void {
    void queryClient.invalidateQueries({
      queryKey: channelsControllerListQueryKey(),
      exact: false,
    });
  }

  function handleAction(
    pastParticiple: string,
    infinitive: string,
    p: Promise<unknown>,
  ): Promise<void> {
    return p
      .then(() => {
        toast.success(`Canal ${pastParticiple}.`);
        invalidate();
      })
      .catch(() => {
        toast.error(`Não foi possível ${infinitive} o canal.`);
      });
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync({ id: deleteTarget.id });
      toast.success('Canal excluído.');
      invalidate();
      setDeleteTarget(null);
    } catch (err) {
      const e = err as AxiosErrorShape;
      if (e?.response?.status === 409 && e?.response?.data?.details) {
        setDeleteBlockedCounts({
          openTicketsCount: e.response.data.details.openTicketsCount ?? 0,
          pendingTicketsCount: e.response.data.details.pendingTicketsCount ?? 0,
        });
      } else {
        toast.error('Não foi possível excluir o canal.');
        setDeleteTarget(null);
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Canais</h1>
          <p className="text-muted-foreground text-sm">
            {connectedCount} de {totalCount} canais conectados.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            setEditTarget(null);
            setDialogOpen(true);
          }}
        >
          Novo canal
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={`${filterId}-search`} className="sr-only">
          Buscar por nome
        </Label>
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${filterId}-search`}
            type="search"
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChannelsTableView
        state={state}
        items={items}
        departmentsById={departmentsById}
        hasFilters={hasFilters}
        connectedCount={connectedCount}
        totalCount={totalCount}
        onEdit={(c) => {
          setEditTarget(c);
          setDialogOpen(true);
        }}
        onActivate={(c) => handleAction('ativado', 'ativar', activate.mutateAsync({ id: c.id }))}
        onDeactivate={(c) =>
          handleAction('desativado', 'desativar', deactivate.mutateAsync({ id: c.id }))
        }
        onRestart={(c) =>
          handleAction('reiniciado', 'reiniciar', restart.mutateAsync({ id: c.id }))
        }
        onDelete={(c) => {
          setDeleteTarget(c);
          setDeleteBlockedCounts(null);
        }}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('all');
        }}
        onCreate={() => {
          setEditTarget(null);
          setDialogOpen(true);
        }}
      />

      {dialogOpen && (
        <ChannelDialog
          mode={editTarget ? 'edit' : 'create'}
          channel={editTarget}
          open={dialogOpen}
          role={me.role}
          onClose={() => {
            setDialogOpen(false);
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteChannelDialog
          channel={{ id: deleteTarget.id, name: deleteTarget.name }}
          open
          blockedCounts={deleteBlockedCounts}
          onConfirm={handleDeleteConfirm}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteBlockedCounts(null);
          }}
        />
      )}
    </div>
  );
}
