import { describe, it, expect } from 'vitest';
import { formatTicketTime } from './format-ticket-time';

const NOW = new Date('2026-05-19T20:00:00Z');

describe('formatTicketTime', () => {
  it('retorna "agora" para diferença < 60s', () => {
    const d = new Date('2026-05-19T19:59:30Z');
    expect(formatTicketTime(d, NOW)).toBe('agora');
  });

  it('retorna "Nm" para diferença entre 1 e 59 minutos', () => {
    expect(formatTicketTime(new Date('2026-05-19T19:58:00Z'), NOW)).toBe('2m');
    expect(formatTicketTime(new Date('2026-05-19T19:01:00Z'), NOW)).toBe('59m');
  });

  it('retorna "Nh" para diferença entre 1 e 23 horas', () => {
    expect(formatTicketTime(new Date('2026-05-19T19:00:00Z'), NOW)).toBe('1h');
    expect(formatTicketTime(new Date('2026-05-18T21:00:00Z'), NOW)).toBe('23h');
  });

  it('retorna "ontem" para diferença entre 24 e 47 horas', () => {
    expect(formatTicketTime(new Date('2026-05-18T20:00:00Z'), NOW)).toBe('ontem');
    expect(formatTicketTime(new Date('2026-05-17T21:00:00Z'), NOW)).toBe('ontem');
  });

  it('retorna "dd/MM" para diferença entre 48h e 365 dias (mesmo ano)', () => {
    expect(formatTicketTime(new Date('2026-05-12T20:00:00Z'), NOW)).toBe('12/05');
  });

  it('retorna "dd/MM/yyyy" para diferença > 365 dias', () => {
    expect(formatTicketTime(new Date('2024-12-01T20:00:00Z'), NOW)).toBe('01/12/2024');
  });

  it('aceita string ISO', () => {
    expect(formatTicketTime('2026-05-19T19:00:00Z', NOW)).toBe('1h');
  });

  it('retorna string vazia para null', () => {
    expect(formatTicketTime(null, NOW)).toBe('');
  });

  it('retorna string vazia para string vazia (Invalid Date)', () => {
    expect(formatTicketTime('', NOW)).toBe('');
  });

  it('retorna string vazia para string ISO inválida', () => {
    expect(formatTicketTime('not-a-date', NOW)).toBe('');
  });

  it('retorna "agora" para datas no futuro (clock skew / dados ruins)', () => {
    const future = new Date('2026-05-19T20:05:00Z'); // 5min no futuro
    expect(formatTicketTime(future, NOW)).toBe('agora');
  });
});
