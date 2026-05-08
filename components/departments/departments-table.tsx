'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import { useDepartmentsControllerFindById } from '@/lib/generated/hooks/useDepartmentsControllerFindById';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DepartmentsTableView,
  type DepartmentListItem,
  type DepartmentsTableState,
} from './departments-table-view';
import { DepartmentDialog } from './department-dialog';
import { DeleteDepartmentDialog } from './delete-department-dialog';

const PAGE_LIMIT = 50;

export function DepartmentsTable() {
  const filterId = useId();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showInactive, setShowInactive] = useState(false);

  const [editTarget, setEditTarget] = useState<DepartmentListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: PAGE_LIMIT,
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      active: !showInactive,
    }),
    [deferredSearch, showInactive],
  );

  const query = useDepartmentsControllerList(params, { client: { client: apiClient } });

  // Hook gerado já controla enabled com base no id; passamos undefined quando não há alvo.
  const detailQuery = useDepartmentsControllerFindById(editTarget?.id, {
    client: { client: apiClient },
  });

  const items: DepartmentListItem[] = query.data?.items ?? [];
  const hasMore = query.data?.pagination.hasMore ?? false;

  const tableState: DepartmentsTableState = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <SearchIcon
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <Label htmlFor={`${filterId}-search`} className="sr-only">
            Buscar por nome
          </Label>
          <Input
            id={`${filterId}-search`}
            type="search"
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Label
          htmlFor={`${filterId}-inactive`}
          className="hover:bg-accent inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
        >
          <Switch
            id={`${filterId}-inactive`}
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <span>Mostrar inativos</span>
        </Label>
      </div>

      <DepartmentsTableView
        state={tableState}
        items={items}
        onEdit={(item) => setEditTarget(item)}
        onDelete={(item) => setDeleteTarget(item)}
      />

      {hasMore ? (
        <p className="text-muted-foreground text-sm">
          Mostrando os primeiros {PAGE_LIMIT} resultados. Use a busca para refinar.
        </p>
      ) : null}

      <DepartmentDialog
        mode="edit"
        department={detailQuery.data ?? undefined}
        open={!!editTarget}
        onOpenChange={(next) => {
          if (!next) setEditTarget(null);
        }}
      />

      <DeleteDepartmentDialog
        department={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
