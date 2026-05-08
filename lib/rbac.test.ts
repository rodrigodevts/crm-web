import { describe, expect, it } from 'vitest';
import { canAccessAdminAreas, type Role } from './rbac';

describe('canAccessAdminAreas', () => {
  it.each<[Role, boolean]>([
    ['SUPER_ADMIN', true],
    ['ADMIN', true],
    ['SUPERVISOR', false],
    ['AGENT', false],
  ])('role %s → %s', (role, expected) => {
    expect(canAccessAdminAreas(role)).toBe(expected);
  });
});
