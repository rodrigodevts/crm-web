'use client';

import { useState } from 'react';
import { DetailPlaceholder } from './detail-placeholder';
import { QueueSidebar } from './queue-sidebar';
import { ThreadPlaceholder } from './thread-placeholder';

export function AtendimentosShell() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <>
      <QueueSidebar selectedTicketId={selectedTicketId} onSelectTicket={setSelectedTicketId} />
      <ThreadPlaceholder />
      <DetailPlaceholder />
    </>
  );
}
