import { describe, expect, it } from 'vitest';
import { decideChannelToast, mergeChannelStatus } from './channel-status';
import type { ChannelStatusEvent } from './types';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';

const ev = (
  over: Partial<ChannelStatusEvent> & {
    previousStatus: ChannelStatusEvent['previousStatus'];
    currentStatus: ChannelStatusEvent['currentStatus'];
  },
): ChannelStatusEvent => ({
  channelConnectionId: 'c1',
  provider: 'GUPSHUP',
  lastError: null,
  occurredAt: '2026-05-17T10:00:00.000Z',
  ...over,
});

function channel(over: Partial<ChannelResponseDto> & { id: string }): ChannelResponseDto {
  return {
    name: 'Canal A',
    provider: 'GUPSHUP',
    status: 'CONNECTED',
    phoneNumber: null,
    externalId: null,
    config: null,
    lastError: null,
    lastConnectedAt: null,
    defaultDepartmentId: null,
    defaultChatFlowId: null,
    inactivityTimeoutMinutes: null,
    inactivityCloseReasonId: null,
    createdAt: '2026-05-17T10:00:00.000Z',
    updatedAt: '2026-05-17T10:00:00.000Z',
    ...over,
    // cast: helper monta um ChannelResponseDto parcial p/ teste; spread +
    // Partial não inferem o tipo gerado completo
  } as ChannelResponseDto;
}

describe('decideChannelToast', () => {
  it('toasta CONNECTED → DISCONNECTED com o nome do canal', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'CONNECTED', currentStatus: 'DISCONNECTED' }),
      'Canal A',
      undefined,
    );
    expect(r.message).toBe('Canal "Canal A" desconectado.');
    expect(r.nextSeenStatus).toBe('DISCONNECTED');
  });

  it('toasta * → ERROR com lastError embutido', () => {
    const r = decideChannelToast(
      ev({
        previousStatus: 'CONNECTING',
        currentStatus: 'ERROR',
        lastError: 'credenciais inválidas',
      }),
      'Canal A',
      'CONNECTING',
    );
    expect(r.message).toBe('Canal "Canal A" entrou em erro: credenciais inválidas.');
    expect(r.nextSeenStatus).toBe('ERROR');
  });

  it('* → ERROR sem lastError usa "motivo não informado"', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'CONNECTING', currentStatus: 'ERROR', lastError: null }),
      'Canal A',
      'CONNECTING',
    );
    expect(r.message).toBe('Canal "Canal A" entrou em erro: motivo não informado.');
  });

  it('não toasta transições não-críticas', () => {
    expect(
      decideChannelToast(
        ev({ previousStatus: 'CONNECTING', currentStatus: 'CONNECTED' }),
        'Canal A',
        'CONNECTING',
      ).message,
    ).toBeNull();
    expect(
      decideChannelToast(
        ev({ previousStatus: 'INACTIVE', currentStatus: 'CONNECTING' }),
        'Canal A',
        'INACTIVE',
      ).message,
    ).toBeNull();
  });

  it('dedup: alvo crítico consecutivo idêntico não re-toasta', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'ERROR', currentStatus: 'ERROR', lastError: 'x' }),
      'Canal A',
      'ERROR',
    );
    expect(r.message).toBeNull();
    expect(r.nextSeenStatus).toBe('ERROR');
  });

  it('nova desconexão real após recuperação volta a toastar', () => {
    const r = decideChannelToast(
      ev({ previousStatus: 'CONNECTED', currentStatus: 'DISCONNECTED' }),
      'Canal A',
      'CONNECTED',
    );
    expect(r.message).toBe('Canal "Canal A" desconectado.');
  });
});

describe('mergeChannelStatus', () => {
  it('com override substitui status e lastError', () => {
    const base = channel({ id: 'c1', status: 'CONNECTED', lastError: null });
    const merged = mergeChannelStatus(base, { status: 'ERROR', lastError: 'falhou' });
    expect(merged.status).toBe('ERROR');
    expect(merged.lastError).toBe('falhou');
  });

  it('sem override retorna o canal original (identidade)', () => {
    const base = channel({ id: 'c1' });
    expect(mergeChannelStatus(base, undefined)).toBe(base);
  });
});
