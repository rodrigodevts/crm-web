'use client';

import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TicketsListResponseDto } from '@/lib/generated/types';
import { TicketCard } from './ticket-card';
import { TicketCardSkeleton } from './ticket-card-skeleton';
import { useResolveTicketRefs } from '@/hooks/use-resolve-ticket-refs';

type Item = TicketsListResponseDto['items'][number];

interface QueueListProps {
  items: Item[];
  status: 'pending' | 'error' | 'success';
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  hidePhoneFromAgents: boolean;
  selectedTicketId: string | null;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

const ROW_HEIGHT = 123;
const OVERSCAN = 3;

export function QueueList({
  items,
  status,
  hasNextPage,
  isFetchingNextPage,
  hidePhoneFromAgents,
  selectedTicketId,
  onSelect,
  onLoadMore,
  onRetry,
}: QueueListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { userById, departmentById } = useResolveTicketRefs();

  const rowCount = items.length + (hasNextPage ? 1 : 0); // sentinel quando há mais
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Dispara onLoadMore quando o último item virtualizado é o sentinel.
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const virtualItems = virtualizer.getVirtualItems();
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= items.length) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, items.length, onLoadMore, virtualizer]);

  if (status === 'pending') {
    return (
      <div role="list" aria-busy aria-label="Fila de atendimentos">
        {Array.from({ length: 6 }).map((_, i) => (
          <TicketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        role="alert"
      >
        <AlertCircle className="text-destructive size-8" aria-hidden />
        <p className="text-foreground text-sm">Erro ao carregar atendimentos.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Inbox className="size-8 opacity-40" aria-hidden />
        <p className="text-sm">Nenhum atendimento aqui.</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      role="list"
      aria-label="Fila de atendimentos"
      className="flex-1 overflow-auto"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const isSentinel = vi.index >= items.length;
          const ticket = items[vi.index];
          return (
            <div
              key={vi.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${vi.start}px)`,
                height: vi.size,
              }}
            >
              {isSentinel ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 p-4 text-xs">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Carregando mais…
                </div>
              ) : (
                ticket && (
                  <TicketCard
                    ticket={ticket}
                    hidePhoneFromAgents={hidePhoneFromAgents}
                    assignedUserName={
                      ticket.assignedUserId ? userById.get(ticket.assignedUserId)?.name : undefined
                    }
                    departmentName={
                      ticket.departmentId
                        ? departmentById.get(ticket.departmentId)?.name
                        : undefined
                    }
                    isSelected={selectedTicketId === ticket.id}
                    onSelect={onSelect}
                  />
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
