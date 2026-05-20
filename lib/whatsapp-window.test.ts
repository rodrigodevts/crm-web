import { describe, it, expect } from 'vitest';
import { whatsappWindowState } from './whatsapp-window';

const NOW = new Date('2026-05-19T20:00:00Z');

describe('whatsappWindowState', () => {
  it('retorna hidden quando inWhatsappWindow=false', () => {
    expect(whatsappWindowState('2026-05-19T19:00:00Z', false, NOW)).toBe('hidden');
  });

  it('retorna hidden quando lastInboundAt=null', () => {
    expect(whatsappWindowState(null, true, NOW)).toBe('hidden');
  });

  it('retorna hidden quando janela expirada (>=24h passadas)', () => {
    expect(whatsappWindowState('2026-05-18T19:00:00Z', true, NOW)).toBe('hidden'); // 25h atrás
  });

  it('retorna safe quando restam > 6h', () => {
    // 7 horas atrás → 17h restantes
    expect(whatsappWindowState('2026-05-19T13:00:00Z', true, NOW)).toBe('safe');
  });

  it('retorna warning quando restam entre 1h e 6h', () => {
    // 22 horas atrás → 2h restantes
    expect(whatsappWindowState('2026-05-18T22:00:00Z', true, NOW)).toBe('warning');
  });

  it('retorna warning no limite superior (6h exatas)', () => {
    // 18 horas atrás → 6h restantes
    expect(whatsappWindowState('2026-05-19T02:00:00Z', true, NOW)).toBe('warning');
  });

  it('retorna urgent quando restam < 1h', () => {
    // 23h30m atrás → 30min restantes
    expect(whatsappWindowState('2026-05-18T20:30:00Z', true, NOW)).toBe('urgent');
  });

  it('aceita data no futuro (clock skew) como safe (~24h restantes)', () => {
    expect(whatsappWindowState('2026-05-19T21:00:00Z', true, NOW)).toBe('safe');
  });

  it('retorna hidden para string vazia ou inválida (defensivo)', () => {
    expect(whatsappWindowState('', true, NOW)).toBe('hidden');
    expect(whatsappWindowState('not-a-date', true, NOW)).toBe('hidden');
  });
});
