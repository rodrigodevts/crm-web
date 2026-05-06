import { describe, expect, expectTypeOf, it } from 'vitest';
// Direct subpath imports avoid pulling in hooks→client chain that has .ts-extension
// imports not yet supported without allowImportingTsExtensions in tsconfig.
import { healthResponseDtoSchema } from '@/lib/generated/schemas/healthResponseDtoSchema';
import type { HealthResponseDto } from '@/lib/generated/types/HealthResponseDto';

describe('lib/generated — smoke test', () => {
  it('expõe o tipo HealthResponseDto com a shape esperada', () => {
    expectTypeOf<HealthResponseDto>().toHaveProperty('status');
    expectTypeOf<HealthResponseDto>().toHaveProperty('uptime');
    expectTypeOf<HealthResponseDto>().toHaveProperty('timestamp');
  });

  it('valida payload válido do health endpoint', () => {
    const result = healthResponseDtoSchema.safeParse({
      status: 'ok',
      uptime: 123,
      timestamp: '2026-05-06T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita payload com status inválido', () => {
    const result = healthResponseDtoSchema.safeParse({
      status: 'broken',
      uptime: 0,
      timestamp: '2026-05-06T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});
