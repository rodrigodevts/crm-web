'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useUsersControllerList,
  usersControllerListQueryKey,
} from '@/lib/generated/hooks/useUsersControllerList';
import { useUsersControllerUpdate } from '@/lib/generated/hooks/useUsersControllerUpdate';
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
import { UsersTableView, type UserListItem, type UsersTableState } from './users-table-view';
import { UserDialog } from './user-dialog';
import { DeactivateUserDialog } from './deactivate-user-dialog';
import { ForceLogoutUserDialog } from './force-logout-user-dialog';

const PAGE_LIMIT = 50;

type StatusFilter = 'active' | 'inactive';
type RoleFilter = 'all' | 'ADMIN' | 'SUPERVISOR' | 'AGENT';

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

const ROLE_OPTIONS: ReadonlyArray<{ value: RoleFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'AGENT', label: 'Atendente' },
];

export function UsersTable() {
  const me = useCurrentUser();
  const filterId = useId();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('active');

  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserListItem | null>(null);
  const [forceLogoutTarget, setForceLogoutTarget] = useState<UserListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: PAGE_LIMIT,
      active: status === 'active',
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      ...(role !== 'all' ? { role } : {}),
    }),
    [deferredSearch, role, status],
  );

  const queryClient = useQueryClient();
  const query = useUsersControllerList(params, { client: { client: apiClient } });
  const update = useUsersControllerUpdate({ client: { client: apiClient } });

  const items: UserListItem[] = query.data?.items ?? [];
  const hasMore = query.data?.pagination.hasMore ?? false;

  const lastActiveAdminId = useMemo(() => {
    const admins = items.filter((u) => u.role === 'ADMIN' && u.active);
    return admins.length === 1 ? admins[0]!.id : null;
  }, [items]);

  const canEditItem = (u: UserListItem) => u.id !== me.id && u.role !== 'SUPER_ADMIN';
  const canDeactivateItem = (u: UserListItem) =>
    u.active &&
    u.id !== me.id &&
    u.role !== 'SUPER_ADMIN' &&
    !(u.role === 'ADMIN' && u.id === lastActiveAdminId);
  const canForceLogoutItem = (u: UserListItem) =>
    u.active && u.id !== me.id && u.role !== 'SUPER_ADMIN';

  const handleReactivate = async (item: UserListItem) => {
    try {
      await update.mutateAsync({ id: item.id, data: { active: true } });
      toast.success(`Usuário "${item.name}" reativado.`);
      void queryClient.invalidateQueries({
        queryKey: usersControllerListQueryKey(),
        exact: false,
      });
    } catch {
      toast.error('Não foi possível reativar o usuário. Tente novamente.');
    }
  };

  const tableState: UsersTableState = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={`${filterId}-search`} className="sr-only">
          Buscar por nome ou e-mail
        </Label>
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${filterId}-search`}
            type="search"
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${filterId}-role`} className="text-muted-foreground text-sm">
            Perfil
          </Label>
          <Select value={role} onValueChange={(v) => setRole(v as RoleFilter)}>
            <SelectTrigger id={`${filterId}-role`} className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      <UsersTableView
        state={tableState}
        items={items}
        me={me}
        canEditItem={canEditItem}
        canDeactivateItem={canDeactivateItem}
        canForceLogoutItem={canForceLogoutItem}
        onEdit={(item) => setEditTarget(item)}
        onDeactivate={(item) => setDeactivateTarget(item)}
        onForceLogout={(item) => setForceLogoutTarget(item)}
        onReactivate={(item) => void handleReactivate(item)}
        emptyMessage={
          status === 'active'
            ? 'Nenhum usuário ativo encontrado.'
            : 'Nenhum usuário inativo encontrado.'
        }
      />

      {hasMore ? (
        <p className="text-muted-foreground text-sm">
          Mostrando os primeiros {PAGE_LIMIT} resultados. Use a busca para refinar.
        </p>
      ) : null}

      <UserDialog
        user={editTarget ?? undefined}
        open={!!editTarget}
        onOpenChange={(next) => {
          if (!next) setEditTarget(null);
        }}
      />

      <DeactivateUserDialog
        user={deactivateTarget}
        open={!!deactivateTarget}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null);
        }}
      />

      <ForceLogoutUserDialog
        user={forceLogoutTarget}
        open={!!forceLogoutTarget}
        onOpenChange={(next) => {
          if (!next) setForceLogoutTarget(null);
        }}
      />
    </div>
  );
}
