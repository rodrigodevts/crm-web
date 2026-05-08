'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useDepartmentsControllerList,
  departmentsControllerListQueryKey,
} from '@/lib/generated/hooks/useDepartmentsControllerList';
import { useDepartmentsControllerUpdate } from '@/lib/generated/hooks/useDepartmentsControllerUpdate';
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
import {
  DepartmentsTableView,
  type DepartmentListItem,
  type DepartmentsTableState,
} from './departments-table-view';
import { DepartmentDialog } from './department-dialog';
import { DeactivateDepartmentDialog } from './deactivate-department-dialog';

const PAGE_LIMIT = 50;

type StatusFilter = 'active' | 'inactive';

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

export function DepartmentsTable() {
  const filterId = useId();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StatusFilter>('active');

  const [editTarget, setEditTarget] = useState<DepartmentListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<DepartmentListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: PAGE_LIMIT,
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      active: status === 'active',
    }),
    [deferredSearch, status],
  );

  const queryClient = useQueryClient();
  const query = useDepartmentsControllerList(params, { client: { client: apiClient } });
  const reactivate = useDepartmentsControllerUpdate({ client: { client: apiClient } });

  const handleReactivate = async (item: DepartmentListItem) => {
    try {
      await reactivate.mutateAsync({ id: item.id, data: { active: true } });
      toast.success(`Departamento "${item.name}" reativado.`);
      void queryClient.invalidateQueries({
        queryKey: departmentsControllerListQueryKey(),
        exact: false,
      });
    } catch {
      toast.error('Não foi possível reativar o departamento. Tente novamente.');
    }
  };

  const items: DepartmentListItem[] = query.data?.items ?? [];
  const hasMore = query.data?.pagination.hasMore ?? false;

  const tableState: DepartmentsTableState = query.isPending
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
      </div>

      <DepartmentsTableView
        state={tableState}
        items={items}
        onEdit={(item) => setEditTarget(item)}
        onDeactivate={(item) => setDeactivateTarget(item)}
        onReactivate={(item) => void handleReactivate(item)}
        emptyMessage={
          status === 'active'
            ? 'Nenhum departamento ativo encontrado.'
            : 'Nenhum departamento inativo encontrado.'
        }
      />

      {hasMore ? (
        <p className="text-muted-foreground text-sm">
          Mostrando os primeiros {PAGE_LIMIT} resultados. Use a busca para refinar.
        </p>
      ) : null}

      <DepartmentDialog
        mode="edit"
        department={editTarget ?? undefined}
        open={!!editTarget}
        onOpenChange={(next) => {
          if (!next) setEditTarget(null);
        }}
      />

      <DeactivateDepartmentDialog
        department={deactivateTarget}
        open={!!deactivateTarget}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null);
        }}
      />
    </div>
  );
}
