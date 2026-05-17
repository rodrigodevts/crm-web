import type {
  ChannelResponseDto,
  ChannelResponseDtoStatusEnumKey,
} from '@/lib/generated/types/ChannelResponseDto';
import type { ChannelStatusEvent, ChannelStatusOverride } from './types';

export interface ChannelToastDecision {
  message: string | null;
  nextSeenStatus: ChannelResponseDtoStatusEnumKey;
}

function isCriticalTransition(
  previousStatus: ChannelResponseDtoStatusEnumKey,
  currentStatus: ChannelResponseDtoStatusEnumKey,
): boolean {
  if (currentStatus === 'ERROR') return true;
  return previousStatus === 'CONNECTED' && currentStatus === 'DISCONNECTED';
}

function buildMessage(event: ChannelStatusEvent, channelName: string): string {
  if (event.currentStatus === 'ERROR') {
    return `Canal "${channelName}" entrou em erro: ${event.lastError ?? 'motivo não informado'}.`;
  }
  return `Canal "${channelName}" desconectado.`;
}

/**
 * Decide se um `channel:status` deve gerar toast (transição crítica) e qual a
 * mensagem pt-BR. Crítico sse `CONNECTED → DISCONNECTED` ou `* → ERROR`.
 * Dedup por último estado visto, por canal: só toasta se o `currentStatus`
 * difere do `lastSeenStatus`. `nextSeenStatus` é sempre `currentStatus`
 * (rastreado em todo evento, não só nos toastados). Função pura.
 */
export function decideChannelToast(
  event: ChannelStatusEvent,
  channelName: string,
  lastSeenStatus: ChannelResponseDtoStatusEnumKey | undefined,
): ChannelToastDecision {
  const critical = isCriticalTransition(event.previousStatus, event.currentStatus);
  const isRepeat = lastSeenStatus === event.currentStatus;
  const message = critical && !isRepeat ? buildMessage(event, channelName) : null;
  return { message, nextSeenStatus: event.currentStatus };
}

/**
 * Aplica o override realtime sobre o item do GET. Sem override → identidade
 * (mesma referência). Função pura.
 */
export function mergeChannelStatus(
  channel: ChannelResponseDto,
  override: ChannelStatusOverride | undefined,
): ChannelResponseDto {
  if (!override) return channel;
  return { ...channel, status: override.status, lastError: override.lastError };
}
