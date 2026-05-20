'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DetailPlaceholder } from './detail-placeholder';
import { QueueSidebar } from './queue-sidebar';
import { ThreadPlaceholder } from './thread-placeholder';

export function AtendimentosShell() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const hasSelection = selectedTicketId !== null;

  return (
    <div
      className={cn(
        'divide-border grid h-full divide-x',
        hasSelection
          ? 'grid-cols-1 md:grid-cols-[400px_1fr_360px]'
          : 'grid-cols-1 md:grid-cols-[400px_1fr]',
      )}
    >
      <QueueSidebar selectedTicketId={selectedTicketId} onSelectTicket={setSelectedTicketId} />
      <ThreadPlaceholder />
      {hasSelection && <DetailPlaceholder />}
    </div>
  );
}
