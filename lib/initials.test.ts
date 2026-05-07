import { describe, expect, it } from 'vitest';
import { getInitials } from './initials';

describe('getInitials', () => {
  it('1 palavra → 1 letra', () => {
    expect(getInitials('Maria')).toBe('M');
  });

  it('2 palavras → 2 letras', () => {
    expect(getInitials('Maria Silva')).toBe('MS');
  });

  it('3+ palavras → primeiras 2', () => {
    expect(getInitials('Maria das Dores Silva')).toBe('MD');
  });

  it('vazio → "?"', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('letras minúsculas viram maiúsculas', () => {
    expect(getInitials('joão paulo')).toBe('JP');
  });
});
