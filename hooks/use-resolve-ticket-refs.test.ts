import { describe, it, expect } from 'vitest';
import { buildLookupMap } from './use-resolve-ticket-refs';

describe('buildLookupMap', () => {
  it('cria Map de id → entidade a partir de array', () => {
    const items = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ];
    const m = buildLookupMap(items);
    expect(m.get('a')?.name).toBe('Alice');
    expect(m.get('b')?.name).toBe('Bob');
    expect(m.size).toBe(2);
  });

  it('retorna Map vazio para undefined', () => {
    expect(buildLookupMap(undefined).size).toBe(0);
  });

  it('retorna Map vazio para array vazio', () => {
    expect(buildLookupMap([]).size).toBe(0);
  });
});
