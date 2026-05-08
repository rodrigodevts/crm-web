import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';

export type Role = UserResponseDtoRoleEnumKey;

/**
 * Áreas administrativas (Configurações, gestão de usuários, etc.) ficam restritas
 * a ADMIN e SUPER_ADMIN. Espelha as restrições `@Roles('ADMIN')` no backend
 * (ex.: crm-api/src/modules/invitations/controllers/invitations.controller.ts).
 *
 * RBAC efetivo (gate por rota servidor + helpers granulares + sidebar dinâmica
 * de configurações) está mapeado no ROADMAP §4.8 como sprint dedicada — este
 * helper é a base mínima pra esconder o que o backend nega.
 */
export function canAccessAdminAreas(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
