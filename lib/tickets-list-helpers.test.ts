import { describe, it, expect } from 'vitest';
import { getNextCursorFromPage } from './tickets-list-helpers';

describe('getNextCursorFromPage', () => {
  it('retorna nextCursor quando hasMore=true', () => {
    const page = { pagination: { hasMore: true, nextCursor: 'abc' } } as never;
    expect(getNextCursorFromPage(page)).toBe('abc');
  });

  it('retorna undefined quando hasMore=false', () => {
    const page = { pagination: { hasMore: false, nextCursor: null } } as never;
    expect(getNextCursorFromPage(page)).toBeUndefined();
  });

  it('retorna undefined quando hasMore=true mas nextCursor é null (defensivo)', () => {
    const page = { pagination: { hasMore: true, nextCursor: null } } as never;
    expect(getNextCursorFromPage(page)).toBeUndefined();
  });
});
