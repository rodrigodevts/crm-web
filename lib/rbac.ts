import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';

export type Role = UserResponseDtoRoleEnumKey;

/**
 * Mapa estático de prefixos de rota acessíveis por role. Default deny:
 * rota fora do mapa retorna false. Match é por prefixo — `/configuracoes`
 * cobre `/configuracoes/usuarios`, etc.
 *
 * AGENT e SUPERVISOR têm acesso explícito a `/configuracoes/quick-replies`
 * (única tela admin onde precisam entrar pra criar/editar suas PERSONAL).
 * O restante de `/configuracoes/*` segue restrito a ADMIN e SUPER_ADMIN.
 */
const ROUTE_ACCESS: Record<Role, ReadonlyArray<string>> = {
  AGENT: ['/atendimentos', '/contatos', '/campanhas', '/configuracoes/quick-replies'],
  SUPERVISOR: [
    '/atendimentos',
    '/contatos',
    '/campanhas',
    '/bot-fluxo',
    '/dashboard',
    '/configuracoes/quick-replies',
  ],
  ADMIN: ['/atendimentos', '/contatos', '/campanhas', '/bot-fluxo', '/dashboard', '/configuracoes'],
  SUPER_ADMIN: [
    '/atendimentos',
    '/contatos',
    '/campanhas',
    '/bot-fluxo',
    '/dashboard',
    '/configuracoes',
  ],
};

export function canAccessRoute(role: Role, route: string): boolean {
  const allowed = ROUTE_ACCESS[role];
  return allowed.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

/**
 * Áreas administrativas (Configurações, gestão de usuários, etc.) ficam
 * restritas a ADMIN e SUPER_ADMIN. Espelha as restrições `@Roles('ADMIN')`
 * no backend (ex.: crm-api/src/modules/invitations/controllers/invitations.controller.ts).
 *
 * RBAC efetivo (helpers granulares + diferenciação SUPERVISOR vs ADMIN nas
 * features) está mapeado no ROADMAP §4.8 como sprint dedicada.
 */
export function canAccessAdminAreas(role: Role): boolean {
  return canAccessRoute(role, '/configuracoes');
}
