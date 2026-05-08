'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useTagsControllerList,
  tagsControllerListQueryKey,
} from '@/lib/generated/hooks/useTagsControllerList';
import { useTagsControllerUpdate } from '@/lib/generated/hooks/useTagsControllerUpdate';
import type { TagsControllerListQueryParamsScopeEnumKey } from '@/lib/generated/types/TagsControllerList';
import { apiClient } from '@/lib/api-client';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagsTableView, type TagListItem, type TagsTableState } from './tags-table-view';
import { TagDialog } from './tag-dialog';
import { DeactivateTagDialog } from './deactivate-tag-dialog';

const PAGE_LIMIT = 50;

type StatusFilter = 'active' | 'inactive';
type ScopeFilter = 'all' | TagsControllerListQueryParamsScopeEnumKey;

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

const SCOPE_OPTIONS: ReadonlyArray<{ value: ScopeFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'CONTACT', label: 'Contato' },
  { value: 'TICKET', label: 'Ticket' },
  { value: 'BOTH', label: 'Ambos' },
];

export function TagsTable() {
  const filterId = useId();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [scope, setScope] = useState<ScopeFilter>('all');

  const [editTarget, setEditTarget] = useState<TagListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TagListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: PAGE_LIMIT,
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      ...(scope !== 'all' ? { scope } : {}),
      active: status === 'active',
    }),
    [deferredSearch, status, scope],
  );

  const queryClient = useQueryClient();
  const query = useTagsControllerList(params, { client: { client: apiClient } });
  const reactivate = useTagsControllerUpdate({ client: { client: apiClient } });

  const handleReactivate = async (item: TagListItem) => {
    try {
      await reactivate.mutateAsync({ id: item.id, data: { active: true } });
      toast.success(`Tag "${item.name}" reativada.`);
      void queryClient.invalidateQueries({
        queryKey: tagsControllerListQueryKey(),
        exact: false,
      });
    } catch {
      toast.error('Não foi possível reativar a tag. Tente novamente.');
    }
  };

  const items: TagListItem[] = query.data?.items ?? [];
  const hasMore = query.data?.pagination.hasMore ?? false;

  const tableState: TagsTableState = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

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
        <div className="flex items-center gap-2">
          <Label htmlFor={`${filterId}-status`} className="text-muted-foreground text-sm">
            Status
          </Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger id={`${filterId}-status`} className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${filterId}-scope`} className="text-muted-foreground text-sm">
            Escopo
          </Label>
          <Select value={scope} onValueChange={(v) => setScope(v as ScopeFilter)}>
            <SelectTrigger id={`${filterId}-scope`} className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TagsTableView
        state={tableState}
        items={items}
        onEdit={(item) => setEditTarget(item)}
        onDeactivate={(item) => setDeactivateTarget(item)}
        onReactivate={(item) => void handleReactivate(item)}
        emptyMessage={
          status === 'active' ? 'Nenhuma tag ativa encontrada.' : 'Nenhuma tag inativa encontrada.'
        }
      />

      {hasMore ? (
        <p className="text-muted-foreground text-sm">
          Mostrando os primeiros {PAGE_LIMIT} resultados. Use a busca para refinar.
        </p>
      ) : null}

      <TagDialog
        mode="edit"
        tag={editTarget ?? undefined}
        open={!!editTarget}
        onOpenChange={(next) => {
          if (!next) setEditTarget(null);
        }}
      />

      <DeactivateTagDialog
        tag={deactivateTarget}
        open={!!deactivateTarget}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null);
        }}
      />
    </div>
  );
}
