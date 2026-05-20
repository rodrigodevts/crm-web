import { describe, it, expect } from 'vitest';
import { formatBrPhone, maskBrPhone } from './format-br-phone';

describe('formatBrPhone', () => {
  it('formata celular brasileiro (13 dígitos)', () => {
    expect(formatBrPhone('5511999998888')).toBe('+55 (11) 99999-8888');
  });

  it('formata fixo brasileiro (12 dígitos)', () => {
    expect(formatBrPhone('551133334444')).toBe('+55 (11) 3333-4444');
  });

  it('limpa caracteres não-numéricos antes de formatar', () => {
    expect(formatBrPhone('+55 (11) 99999-8888')).toBe('+55 (11) 99999-8888');
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(formatBrPhone('')).toBe('');
  });

  it('retorna string vazia para entrada sem dígitos', () => {
    expect(formatBrPhone('abc')).toBe('');
  });
});

describe('maskBrPhone', () => {
  it('mascara mantendo últimos 4 dígitos', () => {
    expect(maskBrPhone('5511999998888')).toBe('••• 8888');
  });

  it('limpa caracteres não-numéricos antes de mascarar', () => {
    expect(maskBrPhone('+55 (11) 99999-8888')).toBe('••• 8888');
  });

  it('retorna ••• para entradas com < 4 dígitos', () => {
    expect(maskBrPhone('123')).toBe('•••');
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(maskBrPhone('')).toBe('');
  });

  it('retorna string vazia para entrada sem dígitos', () => {
    expect(maskBrPhone('abc')).toBe('');
  });

  it('boundary: exatos 4 dígitos → ••• 1234', () => {
    expect(maskBrPhone('1234')).toBe('••• 1234');
  });
});
