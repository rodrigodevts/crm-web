import type { ChannelMessagesControllerListQueryResponse } from '@/lib/generated/types/ChannelMessagesControllerList';

/**
 * Item de `GET /api/v1/channels/:id/messages`. Derivado estruturalmente do
 * tipo gerado pelo Kubb (não redeclaramos a entidade — regra CLAUDE.md §3).
 */
export type ChannelMessage = ChannelMessagesControllerListQueryResponse['items'][number];

/**
 * Linha exibida na tela debug. Igual ao item do GET + `lastError`, que só
 * existe no evento `message:status` (o GET não traz esse campo).
 */
export type MessageRow = ChannelMessage & { lastError: string | null };

/**
 * Eventos Socket.IO `message:new` / `message:status`. NÃO estão no OpenAPI do
 * crm-api (os schemas Zod vivem só no gateway, sem decorator `@Api*`), então
 * o Kubb não os gera. Tipos mínimos locais espelhando
 * `crm-api/src/modules/messaging/schemas/message-new-event.schema.ts` e
 * `message-status-event.schema.ts`. Os campos enum reusam os tipos gerados.
 */
export interface MessageNewEvent {
  messageId: string;
  ticketId: string;
  contactId: string;
  channelConnectionId: string;
  direction: ChannelMessage['direction'];
  type: ChannelMessage['type'];
  content: unknown;
  createdAt: string;
  ticketStatus: string;
  ticketCreated: boolean;
  sentByUserId: string | null;
}

export interface MessageStatusEvent {
  messageId: string;
  ticketId: string;
  status: ChannelMessage['status'];
  externalId: string | null;
  lastError: string | null;
  occurredAt: string;
}
