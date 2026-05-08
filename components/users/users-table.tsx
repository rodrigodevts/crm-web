'use client';

import { useUsersControllerList } from '@/lib/generated/hooks/useUsersControllerList';
import { apiClient } from '@/lib/api-client';
import { UsersTableView, type UsersTableState } from './users-table-view';

export function UsersTable() {
  const query = useUsersControllerList(
    { active: true, limit: 50 },
    { client: { client: apiClient } },
  );

  const state: UsersTableState = query.isPending ? 'loading' : query.isError ? 'error' : 'ready';

  return <UsersTableView state={state} items={query.data?.items ?? []} />;
}
