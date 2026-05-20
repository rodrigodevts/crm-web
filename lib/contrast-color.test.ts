import { describe, it, expect } from 'vitest';
import { contrastTextColor } from './contrast-color';

describe('contrastTextColor', () => {
  // Casos básicos
  it('retorna white para fundos escuros', () => {
    expect(contrastTextColor('#000000')).toBe('white');
    expect(contrastTextColor('#1b84ff')).toBe('white'); // primary
  });

  it('retorna black para fundos claros', () => {
    expect(contrastTextColor('#ffffff')).toBe('black');
    expect(contrastTextColor('#fef3c7')).toBe('black'); // amber-100
  });

  // Formatos de entrada
  it('aceita hex sem #', () => {
    expect(contrastTextColor('ffffff')).toBe('black');
  });

  it('aceita hex shorthand (3 chars)', () => {
    expect(contrastTextColor('#fff')).toBe('black');
    expect(contrastTextColor('#000')).toBe('white');
    expect(contrastTextColor('fff')).toBe('black'); // sem # também
  });

  it('aceita uppercase e lowercase', () => {
    expect(contrastTextColor('#FFFFFF')).toBe('black');
    expect(contrastTextColor('#FfF')).toBe('black');
  });

  // Edge cases / inválidos
  it('retorna black como fallback para entrada inválida', () => {
    expect(contrastTextColor('not-a-color')).toBe('black');
    expect(contrastTextColor('')).toBe('black');
    expect(contrastTextColor('#')).toBe('black');
    expect(contrastTextColor('#12')).toBe('black'); // 2 chars (nem 3 nem 6)
    expect(contrastTextColor('#1234')).toBe('black'); // 4 chars
    expect(contrastTextColor('#12345')).toBe('black'); // 5 chars
    expect(contrastTextColor('#zzzzzz')).toBe('black'); // chars não-hex
    expect(contrastTextColor('#gg0000')).toBe('black'); // hex parcialmente inválido
  });

  // Boundary da luminância (0.5)
  it('escolhe black para luminância >= 0.5 (incluindo exato boundary)', () => {
    // RGB que dá luminância exata 0.5 com BT.709 (0.2126R + 0.7152G + 0.0722B) / 255 = 0.5
    // → 0.2126*R + 0.7152*G + 0.0722*B = 127.5
    // Cor #808080 (128,128,128): luminância = 128/255 ≈ 0.502
    expect(contrastTextColor('#808080')).toBe('black');
  });

  it('escolhe white para luminância < 0.5', () => {
    // #707070 (112,112,112): luminância = 112/255 ≈ 0.439
    expect(contrastTextColor('#707070')).toBe('white');
  });
});
