'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ticketsControllerList } from '@/lib/generated/client';
import type { TicketsControllerListQueryParams } from '@/lib/generated/types';
import { getNextCursorFromPage } from '@/lib/tickets-list-helpers';

// Filtros válidos sem cursor/limit — esses são controlados internamente pelo hook.
export type TicketsListFilters = Omit<TicketsControllerListQueryParams, 'cursor' | 'limit'>;

const PAGE_SIZE = 50;

export function useTicketsInfiniteQuery(filters: TicketsListFilters) {
  return useInfiniteQuery({
    queryKey: ['tickets', 'list', filters],
    queryFn: ({ pageParam }) =>
      ticketsControllerList({ ...filters, cursor: pageParam, limit: PAGE_SIZE }),
    // string | undefined: cursor é opcional na 1ª página; TanStack Query v5 exige initialPageParam explícito
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextCursorFromPage,
    staleTime: 30_000,
  });
}
