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
import { useCloseReasonsControllerUpdate } from '@/lib/generated/hooks/useCloseReasonsControllerUpdate';
import {
  useCloseReasonsControllerReorder,
  closeReasonsControllerReorderMutationKey,
} from '@/lib/generated/hooks/useCloseReasonsControllerReorder';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CloseReasonsTableView } from './close-reasons-table-view';
import { CloseReasonDialog } from './close-reason-dialog';
import { DeactivateCloseReasonDialog } from './deactivate-close-reason-dialog';
import type { CloseReasonListItem } from './close-reason-row';

type StatusFilter = 'active' | 'inactive';

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

export function CloseReasonsTable() {
  const filterId = useId();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StatusFilter>('active');

  const [editTarget, setEditTarget] = useState<CloseReasonListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CloseReasonListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: 100,
      sort: 'sortOrder' as const,
      active: status === 'active',
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
    }),
    [deferredSearch, status],
  );

  const query = useCloseReasonsControllerList(params, { client: { client: apiClient } });

  const update = useCloseReasonsControllerUpdate({ client: { client: apiClient } });
  // "Desativar" usa PATCH `active: false` (não softDelete) pra alinhar com o
  // pattern de Departments e manter o motivo visível no filtro "Inativos"
  // (DELETE seta `deletedAt`, e o list filtra `deletedAt: null` sempre → motivo
  // somido tanto de ativos quanto de inativos).
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

  const hasFilters = deferredSearch.trim().length > 0 || status === 'inactive';
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

  async function handleReactivate(reason: CloseReasonListItem) {
    try {
      await update.mutateAsync({ id: reason.id, data: { active: true } });
      toast.success(`Motivo "${reason.name}" reativado.`);
      invalidate();
    } catch {
      toast.error('Não foi possível reativar o motivo.');
    }
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return;
    try {
      await update.mutateAsync({ id: deactivateTarget.id, data: { active: false } });
      toast.success(`Motivo "${deactivateTarget.name}" desativado.`);
      invalidate();
      setDeactivateTarget(null);
    } catch {
      toast.error('Não foi possível desativar o motivo.');
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

        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-40" aria-label="Filtrar por status">
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

      {dragDisabled && hasFilters && (
        <p className="text-muted-foreground text-xs">Limpe os filtros para reordenar.</p>
      )}

      <CloseReasonsTableView
        state={state}
        items={localItems}
        dragDisabled={dragDisabled}
        hasFilters={hasFilters}
        onEdit={(r) => setEditTarget(r)}
        onDeactivate={(r) => setDeactivateTarget(r)}
        onReactivate={handleReactivate}
        onReorder={handleReorder}
        onClearFilters={() => {
          setSearch('');
          setStatus('active');
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

      {deactivateTarget && (
        <DeactivateCloseReasonDialog
          reason={{ id: deactivateTarget.id, name: deactivateTarget.name }}
          open
          submitting={update.isPending}
          onConfirm={handleDeactivateConfirm}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
