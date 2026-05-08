import { describe, expect, it } from 'vitest';
import { canAccessAdminAreas, canAccessRoute, type Role } from './rbac';

describe('canAccessAdminAreas', () => {
  it.each<[Role, boolean]>([
    ['SUPER_ADMIN', true],
    ['ADMIN', true],
    ['SUPERVISOR', false],
    ['AGENT', false],
  ])('role %s -> %s', (role, expected) => {
    expect(canAccessAdminAreas(role)).toBe(expected);
  });
});

describe('canAccessRoute', () => {
  const matrix: ReadonlyArray<{ role: Role; route: string; expected: boolean }> = [
    // AGENT: só atendimentos / contatos / campanhas
    { role: 'AGENT', route: '/atendimentos', expected: true },
    { role: 'AGENT', route: '/contatos', expected: true },
    { role: 'AGENT', route: '/campanhas', expected: true },
    { role: 'AGENT', route: '/bot-fluxo', expected: false },
    { role: 'AGENT', route: '/dashboard', expected: false },
    { role: 'AGENT', route: '/configuracoes', expected: false },
    { role: 'AGENT', route: '/configuracoes/usuarios', expected: false },

    // SUPERVISOR: tudo de AGENT + bot-fluxo + dashboard, sem configuracoes
    { role: 'SUPERVISOR', route: '/atendimentos', expected: true },
    { role: 'SUPERVISOR', route: '/contatos', expected: true },
    { role: 'SUPERVISOR', route: '/campanhas', expected: true },
    { role: 'SUPERVISOR', route: '/bot-fluxo', expected: true },
    { role: 'SUPERVISOR', route: '/dashboard', expected: true },
    { role: 'SUPERVISOR', route: '/configuracoes', expected: false },
    { role: 'SUPERVISOR', route: '/configuracoes/tags', expected: false },

    // ADMIN: tudo
    { role: 'ADMIN', route: '/atendimentos', expected: true },
    { role: 'ADMIN', route: '/bot-fluxo', expected: true },
    { role: 'ADMIN', route: '/dashboard', expected: true },
    { role: 'ADMIN', route: '/configuracoes', expected: true },
    { role: 'ADMIN', route: '/configuracoes/usuarios', expected: true },
    { role: 'ADMIN', route: '/configuracoes/design-system', expected: true },

    // SUPER_ADMIN: tudo
    { role: 'SUPER_ADMIN', route: '/atendimentos', expected: true },
    { role: 'SUPER_ADMIN', route: '/configuracoes', expected: true },
    { role: 'SUPER_ADMIN', route: '/configuracoes/usuarios', expected: true },

    // Default deny: rotas fora do mapa
    { role: 'AGENT', route: '/qualquer-coisa', expected: false },
    { role: 'ADMIN', route: '/qualquer-coisa', expected: false },
  ];

  it.each(matrix)('role $role accessing $route -> $expected', ({ role, route, expected }) => {
    expect(canAccessRoute(role, route)).toBe(expected);
  });

  it('faz prefix match seguro (não confunde /atendimentos com /atendimentosX)', () => {
    expect(canAccessRoute('AGENT', '/atendimentos-fake')).toBe(false);
    expect(canAccessRoute('AGENT', '/atendimentos/123')).toBe(true);
  });
});
