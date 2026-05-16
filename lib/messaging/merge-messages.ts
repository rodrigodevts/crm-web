import type { ChannelMessage, MessageNewEvent, MessageRow, MessageStatusEvent } from './types';

export type MergeEvent =
  | { kind: 'seed'; items: ChannelMessage[] }
  | { kind: 'new'; event: MessageNewEvent }
  | { kind: 'status'; event: MessageStatusEvent };

function rowFromChannelMessage(m: ChannelMessage, prevLastError: string | null): MessageRow {
  return { ...m, lastError: prevLastError };
}

function rowFromNewEvent(ev: MessageNewEvent): MessageRow {
  return {
    id: ev.messageId,
    ticketId: ev.ticketId,
    channelConnectionId: ev.channelConnectionId,
    externalId: null,
    direction: ev.direction,
    type: ev.type,
    // Convenção da tela debug: sem `status` no payload de `message:new`.
    // OUTBOUND nasce PENDING; INBOUND já chegou ao sistema → DELIVERED.
    // O `message:status` (OUTBOUND) e o refetch no reconnect corrigem.
    status: ev.direction === 'OUTBOUND' ? 'PENDING' : 'DELIVERED',
    content: ev.content ?? null,
    sentByUserId: ev.sentByUserId,
    sentByBot: false,
    isSystemMessage: false,
    createdAt: ev.createdAt,
    lastError: null,
  } as MessageRow; // generated→UI boundary; structurally compatible
}

function sortRows(rows: MessageRow[]): MessageRow[] {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    if (ta !== tb) return ta - tb;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function mergeMessages(current: MessageRow[], event: MergeEvent): MessageRow[] {
  const byId = new Map<string, MessageRow>(current.map((r) => [r.id, r]));

  if (event.kind === 'seed') {
    for (const item of event.items) {
      const prev = byId.get(item.id);
      byId.set(item.id, rowFromChannelMessage(item, prev?.lastError ?? null));
    }
    return sortRows([...byId.values()]);
  }

  if (event.kind === 'new') {
    if (!byId.has(event.event.messageId)) {
      byId.set(event.event.messageId, rowFromNewEvent(event.event));
    }
    return sortRows([...byId.values()]);
  }

  // kind === 'status'
  const target = byId.get(event.event.messageId);
  if (!target) return current; // status órfão: ignora (debug; sem buffer)
  byId.set(event.event.messageId, {
    ...target,
    status: event.event.status,
    externalId: event.event.externalId,
    lastError: event.event.lastError,
  });
  return sortRows([...byId.values()]);
}
