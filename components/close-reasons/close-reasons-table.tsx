'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import {
  useCloseReasonsControllerList,
  closeReasonsControllerListQueryKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerList';
import { useCloseReasonsControllerRemove } from '@/lib/generated/hooks/useCloseReasonsControllerRemove';
import {
  useCloseReasonsControllerReorder,
  closeReasonsControllerReorderMutationKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerReorder';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { CloseReasonsTableView } from './close-reasons-table-view';
import { CloseReasonDialog } from './close-reason-dialog';
import { DeleteCloseReasonDialog } from './delete-close-reason-dialog';
import type { CloseReasonListItem } from './close-reason-row';

type DeleteBlockedCounts = { channelsUsingCount: number };

type AxiosErrorShape = {
  response?: {
    status?: number;
    data?: { message?: string; details?: { channelsUsingCount?: number } };
  };
};

export function CloseReasonsTable() {
  const filterId = useId();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const [editTarget, setEditTarget] = useState<CloseReasonListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CloseReasonListItem | null>(null);
  const [deleteBlockedCounts, setDeleteBlockedCounts] = useState<DeleteBlockedCounts | null>(null);

  const params = useMemo(
    () => ({
      limit: 100,
      sort: 'sortOrder' as const,
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
    }),
    [deferredSearch],
  );

  const query = useCloseReasonsControllerList(params, { client: { client: apiClient } });

  const remove = useCloseReasonsControllerRemove({ client: { client: apiClient } });
  const reorder = useCloseReasonsControllerReorder({
    client: { client: apiClient },
    mutation: { mutationKey: closeReasonsControllerReorderMutationKey() },
  });

  const serverItems = useMemo<CloseReasonListItem[]>(
    () => (query.data?.items ?? []) as CloseReasonListItem[],
    [query.data?.items],
  );

  // Optimistic order pra reorder. Quando setado, dita a ordem visual até o
  // server confirmar e retornar com a nova ordem persistida — então limpamos.
  // Padrão "ajustando state durante render" (React docs) evita useEffect+setState
  // e o lint rule `react-hooks/set-state-in-effect`.
  const [optimisticOrder, setOptimisticOrder] = useState<readonly string[] | null>(null);

  const localItems = useMemo<CloseReasonListItem[]>(() => {
    if (!optimisticOrder) return serverItems;
    const byId = new Map(serverItems.map((r) => [r.id, r]));
    const ordered = optimisticOrder
      .map((id) => byId.get(id))
      .filter((r): r is CloseReasonListItem => r !== undefined);
    // Inclui itens novos que apareceram no server mas não estão no override.
    const overrideSet = new Set(optimisticOrder);
    const extras = serverItems.filter((r) => !overrideSet.has(r.id));
    return [...ordered, ...extras];
  }, [serverItems, optimisticOrder]);

  // Limpa o override quando o server já reflete a ordem otimista.
  if (optimisticOrder) {
    const serverOrderMatchesOptimistic =
      serverItems.length === optimisticOrder.length &&
      serverItems.every((r, i) => r.id === optimisticOrder[i]);
    if (serverOrderMatchesOptimistic) {
      setOptimisticOrder(null);
    }
  }

  const hasFilters = deferredSearch.trim().length > 0;
  const dragDisabled = hasFilters || reorder.isPending;
  const state = query.isPending ? 'loading' : query.isError ? 'error' : 'ready';

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: closeReasonsControllerListQueryKey(),
      exact: false,
    });
  }

  async function handleReorder(orderedIds: string[]) {
    setOptimisticOrder(orderedIds);
    try {
      await reorder.mutateAsync({ data: { orderedIds } });
      invalidate();
    } catch {
      setOptimisticOrder(null);
      toast.error('Não foi possível reordenar.');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync({ id: deleteTarget.id });
      toast.success('Motivo excluído.');
      invalidate();
      setDeleteTarget(null);
      setDeleteBlockedCounts(null);
    } catch (err) {
      const e = err as AxiosErrorShape;
      const status = e?.response?.status;
      const count = e?.response?.data?.details?.channelsUsingCount;
      if (status === 409 && typeof count === 'number') {
        setDeleteBlockedCounts({ channelsUsingCount: count });
        return;
      }
      toast.error('Não foi possível excluir o motivo.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
      </div>

      {dragDisabled && hasFilters && (
        <p className="text-muted-foreground text-xs">Limpe os filtros para reordenar.</p>
      )}

      <CloseReasonsTableView
        state={state}
        items={localItems}
        dragDisabled={dragDisabled}
        hasFilters={hasFilters}
        onEdit={(r) => setEditTarget(r)}
        onDelete={(r) => {
          setDeleteTarget(r);
          setDeleteBlockedCounts(null);
        }}
        onReorder={handleReorder}
        onClearFilters={() => {
          setSearch('');
        }}
      />

      {editTarget && (
        <CloseReasonDialog
          mode="edit"
          reason={editTarget}
          open
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteCloseReasonDialog
          reason={{ id: deleteTarget.id, name: deleteTarget.name }}
          open
          blockedCounts={deleteBlockedCounts}
          submitting={remove.isPending}
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
