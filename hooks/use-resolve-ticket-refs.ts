'use client';

import { useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useDepartmentsControllerList, useUsersControllerList } from '@/lib/generated/hooks';

export function buildLookupMap<T extends { id: string }>(items: T[] | undefined): Map<string, T> {
  return new Map((items ?? []).map((it) => [it.id, it]));
}

// Kubb gera hooks sem baseURL embutido; precisamos passar { client: { client: apiClient } }
// pra que as chamadas usem nosso apiClient (baseURL + refresh interceptor).
const KUBB_CLIENT_OPTS = { client: { client: apiClient } } as const;

export function useResolveTicketRefs() {
  const usersQ = useUsersControllerList(undefined, KUBB_CLIENT_OPTS);
  const departmentsQ = useDepartmentsControllerList(undefined, KUBB_CLIENT_OPTS);

  // Note: ambos retornam { items, pagination }, não o array direto
  const userById = useMemo(() => buildLookupMap(usersQ.data?.items), [usersQ.data]);
  const departmentById = useMemo(
    () => buildLookupMap(departmentsQ.data?.items),
    [departmentsQ.data],
  );

  return {
    userById,
    departmentById,
    isResolved: !!usersQ.data && !!departmentsQ.data,
  };
}
