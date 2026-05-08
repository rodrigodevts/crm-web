'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useQuickRepliesControllerList,
  quickRepliesControllerListQueryKey,
} from '@/lib/generated/hooks/useQuickRepliesControllerList';
import { useQuickRepliesControllerUpdate } from '@/lib/generated/hooks/useQuickRepliesControllerUpdate';
import type { QuickRepliesControllerListQueryParamsScopeEnumKey } from '@/lib/generated/types/QuickRepliesControllerList';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  QuickRepliesTableView,
  type QuickReplyListItem,
  type QuickRepliesTableState,
} from './quick-replies-table-view';
import { QuickReplyDialog } from './quick-reply-dialog';
import { DeactivateQuickReplyDialog } from './deactivate-quick-reply-dialog';

const PAGE_LIMIT = 50;

type StatusFilter = 'active' | 'inactive';
type ScopeFilter = 'all' | QuickRepliesControllerListQueryParamsScopeEnumKey;

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

const SCOPE_OPTIONS: ReadonlyArray<{ value: ScopeFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'COMPANY', label: 'Globais' },
  { value: 'PERSONAL', label: 'Pessoais' },
];

export function QuickRepliesTable() {
  const filterId = useId();
  const me = useCurrentUser();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [mineOnly, setMineOnly] = useState(false);

  const [editTarget, setEditTarget] = useState<QuickReplyListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<QuickReplyListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: PAGE_LIMIT,
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      ...(scope !== 'all' ? { scope } : {}),
      ...(mineOnly ? { mine: true } : {}),
      active: status === 'active',
    }),
    [deferredSearch, status, scope, mineOnly],
  );

  const queryClient = useQueryClient();
  const query = useQuickRepliesControllerList(params, { client: { client: apiClient } });
  const reactivate = useQuickRepliesControllerUpdate({ client: { client: apiClient } });

  const handleReactivate = async (item: QuickReplyListItem) => {
    try {
      await reactivate.mutateAsync({ id: item.id, data: { active: true } });
      toast.success(`Resposta rápida "/${item.shortcut}" reativada.`);
      void queryClient.invalidateQueries({
        queryKey: quickRepliesControllerListQueryKey(),
        exact: false,
      });
    } catch {
      toast.error('Não foi possível reativar a resposta rápida. Tente novamente.');
    }
  };

  const canEditItem = (item: QuickReplyListItem): boolean => {
    // AGENT só edita PERSONAL (que, por filtro do backend, são suas).
    // SUPERVISOR/ADMIN/SUPER_ADMIN editam tudo o que aparece na lista.
    if (me.role === 'AGENT') {
      return item.scope === 'PERSONAL';
    }
    return true;
  };

  const items: QuickReplyListItem[] = query.data?.items ?? [];
  const hasMore = query.data?.pagination.hasMore ?? false;

  const tableState: QuickRepliesTableState = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  const emptyMessage =
    status === 'active'
      ? 'Nenhuma resposta rápida ativa encontrada.'
      : 'Nenhuma resposta rápida inativa encontrada.';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={`${filterId}-search`} className="sr-only">
          Buscar por atalho ou mensagem
        </Label>
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${filterId}-search`}
            type="search"
            placeholder="Buscar por atalho ou mensagem…"
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
        <div className="flex items-center gap-2">
          <Switch
            id={`${filterId}-mine`}
            checked={mineOnly}
            onCheckedChange={setMineOnly}
            aria-label="Apenas as minhas"
          />
          <Label htmlFor={`${filterId}-mine`} className="text-muted-foreground text-sm">
            Apenas as minhas
          </Label>
        </div>
      </div>

      <QuickRepliesTableView
        state={tableState}
        items={items}
        canEditItem={canEditItem}
        onEdit={(item) => setEditTarget(item)}
        onDeactivate={(item) => setDeactivateTarget(item)}
        onReactivate={(item) => void handleReactivate(item)}
        emptyMessage={emptyMessage}
      />

      {hasMore ? (
        <p className="text-muted-foreground text-sm">
          Mostrando os primeiros {PAGE_LIMIT} resultados. Use a busca para refinar.
        </p>
      ) : null}

      <QuickReplyDialog
        mode="edit"
        quickReply={editTarget ?? undefined}
        open={!!editTarget}
        onOpenChange={(next) => {
          if (!next) setEditTarget(null);
        }}
      />

      <DeactivateQuickReplyDialog
        quickReply={deactivateTarget}
        open={!!deactivateTarget}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null);
        }}
      />
    </div>
  );
}
