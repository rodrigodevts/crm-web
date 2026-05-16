import { describe, expect, it } from 'vitest';
import { mergeMessages } from './merge-messages';
import type { ChannelMessage, MessageNewEvent, MessageStatusEvent } from './types';

function msg(over: Partial<ChannelMessage> & { id: string; createdAt: string }): ChannelMessage {
  return {
    ticketId: 't1',
    channelConnectionId: 'c1',
    externalId: null,
    direction: 'INBOUND',
    type: 'TEXT',
    status: 'DELIVERED',
    content: { text: 'oi' },
    sentByUserId: null,
    sentByBot: false,
    isSystemMessage: false,
    ...over,
  } as ChannelMessage;
}

const newEv = (
  over: Partial<MessageNewEvent> & { messageId: string; createdAt: string },
): MessageNewEvent => ({
  ticketId: 't1',
  contactId: 'k1',
  channelConnectionId: 'c1',
  direction: 'OUTBOUND',
  type: 'TEXT',
  content: { text: 'enviada' },
  ticketStatus: 'OPEN',
  ticketCreated: false,
  sentByUserId: 'u1',
  ...over,
});

const statusEv = (
  over: Partial<MessageStatusEvent> & { messageId: string },
): MessageStatusEvent => ({
  ticketId: 't1',
  status: 'SENT',
  externalId: 'gs-1',
  lastError: null,
  occurredAt: '2026-05-16T10:00:05.000Z',
  ...over,
});

describe('mergeMessages', () => {
  it('seed: ordena cronológico ascendente, desempate por id', () => {
    const out = mergeMessages([], {
      kind: 'seed',
      items: [
        msg({ id: 'b', createdAt: '2026-05-16T10:00:00.000Z' }),
        msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' }),
        msg({ id: 'c', createdAt: '2026-05-16T09:00:00.000Z' }),
      ],
    });
    expect(out.map((r) => r.id)).toEqual(['c', 'a', 'b']);
    expect(out[0]?.lastError).toBe(null);
  });

  it('new: anexa mensagem nova ausente da lista', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, {
      kind: 'new',
      event: newEv({ messageId: 'x', createdAt: '2026-05-16T10:01:00.000Z' }),
    });
    expect(out.map((r) => r.id)).toEqual(['a', 'x']);
    expect(out[1]?.direction).toBe('OUTBOUND');
    expect(out[1]?.status).toBe('PENDING');
  });

  it('new + seed: de-dup por id (cenário 11 — álbum/reconnect não duplica)', () => {
    let s = mergeMessages([], {
      kind: 'new',
      event: newEv({
        messageId: 'p1',
        direction: 'INBOUND',
        createdAt: '2026-05-16T10:00:01.000Z',
      }),
    });
    s = mergeMessages(s, {
      kind: 'new',
      event: newEv({
        messageId: 'p2',
        direction: 'INBOUND',
        createdAt: '2026-05-16T10:00:02.000Z',
      }),
    });
    s = mergeMessages(s, {
      kind: 'seed',
      items: [
        msg({ id: 'p1', direction: 'INBOUND', createdAt: '2026-05-16T10:00:01.000Z' }),
        msg({ id: 'p2', direction: 'INBOUND', createdAt: '2026-05-16T10:00:02.000Z' }),
      ],
    });
    expect(s.map((r) => r.id)).toEqual(['p1', 'p2']);
  });

  it('status: patcha status/externalId/lastError da mensagem existente', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', status: 'PENDING', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, {
      kind: 'status',
      event: statusEv({ messageId: 'a', status: 'SENT', externalId: 'gs-9' }),
    });
    expect(out[0]?.status).toBe('SENT');
    expect(out[0]?.externalId).toBe('gs-9');
  });

  it('status FAILED: guarda lastError', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, {
      kind: 'status',
      event: statusEv({
        messageId: 'a',
        status: 'FAILED',
        externalId: null,
        lastError: 'Número inválido',
      }),
    });
    expect(out[0]?.status).toBe('FAILED');
    expect(out[0]?.lastError).toBe('Número inválido');
  });

  it('status órfão (messageId fora da lista): ignora, lista inalterada', () => {
    const seed = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    const out = mergeMessages(seed, { kind: 'status', event: statusEv({ messageId: 'zzz' }) });
    expect(out).toEqual(seed);
  });

  it('re-seed preserva lastError já recebido por status anterior', () => {
    let s = mergeMessages([], {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    s = mergeMessages(s, {
      kind: 'status',
      event: statusEv({ messageId: 'a', status: 'FAILED', externalId: null, lastError: 'erro X' }),
    });
    s = mergeMessages(s, {
      kind: 'seed',
      items: [msg({ id: 'a', createdAt: '2026-05-16T10:00:00.000Z' })],
    });
    expect(s[0]?.lastError).toBe('erro X');
  });
});
