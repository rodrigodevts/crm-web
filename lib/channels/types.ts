import type {
  ChannelResponseDtoProviderEnumKey,
  ChannelResponseDtoStatusEnumKey,
} from '@/lib/generated/types/ChannelResponseDto';

/**
 * Evento Socket.IO `channel:status`. NÃO está no OpenAPI do crm-api (o
 * schema Zod vive só no gateway, sem decorator `@Api*`), então o Kubb não o
 * gera. Tipo mínimo local espelhando
 * `crm-api/src/modules/channels/schemas/channel-status-event.schema.ts`.
 * Os campos enum reusam os tipos gerados (não redeclaramos a entidade) —
 * mesma justificativa de `lib/messaging/types.ts`.
 */
export interface ChannelStatusEvent {
  channelConnectionId: string;
  previousStatus: ChannelResponseDtoStatusEnumKey;
  currentStatus: ChannelResponseDtoStatusEnumKey;
  provider: ChannelResponseDtoProviderEnumKey;
  lastError: string | null;
  occurredAt: string;
}

/** Override realtime aplicado in-memory sobre o item do GET. */
export interface ChannelStatusOverride {
  status: ChannelResponseDtoStatusEnumKey;
  lastError: string | null;
}
