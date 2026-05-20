'use client';

import { useMemo } from 'react';
import { useDepartmentsControllerList, useUsersControllerList } from '@/lib/generated/hooks';

export function buildLookupMap<T extends { id: string }>(items: T[] | undefined): Map<string, T> {
  return new Map((items ?? []).map((it) => [it.id, it]));
}

export function useResolveTicketRefs() {
  const usersQ = useUsersControllerList();
  const departmentsQ = useDepartmentsControllerList();

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
