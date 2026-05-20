import type { TicketsListResponseDto } from '@/lib/generated/types';

export function getNextCursorFromPage(page: TicketsListResponseDto): string | undefined {
  if (!page.pagination.hasMore) return undefined;
  return page.pagination.nextCursor ?? undefined;
}
