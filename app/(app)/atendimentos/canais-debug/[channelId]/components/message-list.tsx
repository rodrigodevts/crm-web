'use client';

import type { MessageRow } from '@/lib/messaging/types';

function renderContent(content: unknown): string {
  if (content == null) return '—';
  if (
    typeof content === 'object' &&
    content !== null &&
    'text' in content &&
    // content é `unknown` (JSON do backend); narrowing manual + cast comentado
    typeof (content as { text: unknown }).text === 'string'
  ) {
    return (content as { text: string }).text;
  }
  return JSON.stringify(content);
}

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function DirectionBadge({ direction }: { direction: MessageRow['direction'] }) {
  const isIn = direction === 'INBOUND';
  return (
    <span
      className={
        isIn
          ? 'bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-medium'
          : 'bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium'
      }
    >
      {isIn ? 'IN' : 'OUT'}
    </span>
  );
}

function StatusBadge({ status }: { status: MessageRow['status'] }) {
  const failed = status === 'FAILED';
  return (
    <span
      className={failed ? 'text-destructive text-xs font-medium' : 'text-muted-foreground text-xs'}
    >
      {status}
    </span>
  );
}

export function MessageList({ rows }: { rows: MessageRow[] }) {
  return (
    <ul className="border-border divide-border divide-y rounded-md border">
      {rows.map((m) => (
        <li key={m.id} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <DirectionBadge direction={m.direction} />
            <span className="text-muted-foreground text-xs">
              {DATE_FMT.format(new Date(m.createdAt))}
            </span>
            <span className="text-muted-foreground text-xs">
              ticket <span className="font-mono">{m.ticketId.slice(0, 8)}</span>
            </span>
            <span className="ml-auto">
              <StatusBadge status={m.status} />
            </span>
          </div>
          <p className="text-foreground text-sm break-words whitespace-pre-wrap">
            {renderContent(m.content)}
          </p>
          {m.status === 'FAILED' && m.lastError && (
            <p className="text-destructive text-xs">{m.lastError}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
