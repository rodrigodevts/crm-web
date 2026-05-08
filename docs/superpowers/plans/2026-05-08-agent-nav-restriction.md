# Restrição de navegação por role — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restringir `navMain` da sidebar e adicionar gates server-side em `/bot-fluxo` e `/dashboard` para que `AGENT` veja apenas Atendimentos/Contatos/Campanhas, `SUPERVISOR` veja tudo exceto Configurações, e `ADMIN/SUPER_ADMIN` continuem vendo tudo.

**Architecture:** Frontend-only. `lib/rbac.ts` ganha `canAccessRoute(role, route)` baseado num mapa estático `ROUTE_ACCESS` por role. `canAccessAdminAreas` vira wrapper de `canAccessRoute(role, '/configuracoes')` pra preservar call sites existentes. Sidebar filtra `navMain` por role; novos layouts em `bot-fluxo/` e `dashboard/` redirecionam quem não pode entrar — mesmo padrão do `configuracoes/layout.tsx`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript estrito, Vitest + RTL.

**Spec:** [docs/superpowers/specs/2026-05-08-agent-nav-restriction-design.md](../specs/2026-05-08-agent-nav-restriction-design.md)

---

## Premissas

- Branch: `feat/agent-nav-restriction` (já criada, spec commitado em `2f5854d`).
- Base: commit `2e9557d` (após PR #22 mergeada).
- `getCurrentUserOnServer` retorna `User | null`. `(app)/layout.tsx` já faz redirect pra `/login` quando `null`. Os layouts novos só lidam com o caso "logado mas sem permissão" — exatamente como `configuracoes/layout.tsx`.

## Files

### Modify

- `lib/rbac.ts` — adiciona `canAccessRoute` + mapa `ROUTE_ACCESS`. Reescreve `canAccessAdminAreas` como wrapper.
- `lib/rbac.test.ts` — adiciona suite `canAccessRoute`.
- `components/app-sidebar.tsx` — filtra `navMain`.

### Create

- `app/(app)/bot-fluxo/layout.tsx`
- `app/(app)/dashboard/layout.tsx`

---

## Task 1: `canAccessRoute` em `lib/rbac.ts` + testes

**Files:**

- Modify: `lib/rbac.ts`
- Modify: `lib/rbac.test.ts`

- [ ] **Step 1: Write failing tests**

Substituir `lib/rbac.test.ts` por (NÃO remover o `describe('canAccessAdminAreas')` existente — adicionar o novo describe após):

```ts
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
```

- [ ] **Step 2: Run test (expect fail)**

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
pnpm test lib/rbac --run
```

Expected: FAIL com `canAccessRoute is not a function` ou similar (não exportado ainda). Os testes do `canAccessAdminAreas` continuam passando.

- [ ] **Step 3: Implement `canAccessRoute` + reescrever `canAccessAdminAreas`**

Substituir `lib/rbac.ts` por:

```ts
import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';

export type Role = UserResponseDtoRoleEnumKey;

/**
 * Mapa estático de prefixos de rota acessíveis por role. Default deny:
 * rota fora do mapa retorna false. Match é por prefixo — `/configuracoes`
 * cobre `/configuracoes/usuarios`, etc.
 */
const ROUTE_ACCESS: Record<Role, ReadonlyArray<string>> = {
  AGENT: ['/atendimentos', '/contatos', '/campanhas'],
  SUPERVISOR: ['/atendimentos', '/contatos', '/campanhas', '/bot-fluxo', '/dashboard'],
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
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
pnpm test lib/rbac --run
```

Expected: todos os testes do `canAccessAdminAreas` (4) + `canAccessRoute` (matrix com 25 cases + 2 prefix tests = ~27) verdes.

- [ ] **Step 5: Commit**

```bash
git add lib/rbac.ts lib/rbac.test.ts
git commit -m "feat(rbac): canAccessRoute com mapa estático por role

AGENT: atendimentos/contatos/campanhas. SUPERVISOR: + bot-fluxo/dashboard.
ADMIN/SUPER_ADMIN: tudo + configuracoes. canAccessAdminAreas vira wrapper
de canAccessRoute('/configuracoes') pra preservar call sites existentes."
```

---

## Task 2: Filtro na sidebar + layouts server-side

**Files:**

- Modify: `components/app-sidebar.tsx`
- Create: `app/(app)/bot-fluxo/layout.tsx`
- Create: `app/(app)/dashboard/layout.tsx`

- [ ] **Step 1: Filtrar `navMain` no sidebar**

Em `components/app-sidebar.tsx`, dentro de `AppSidebar` (ou seja, depois de `const showAdminAreas = canAccessAdminAreas(user.role);`), adicionar:

```tsx
import { canAccessAdminAreas, canAccessRoute } from '@/lib/rbac';
// ...
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser();
  const showAdminAreas = canAccessAdminAreas(user.role);
  const visibleNavMain = navMain.filter((item) => canAccessRoute(user.role, item.url));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* ... sidebar header ... */}
      <SidebarContent>
        <NavMain items={visibleNavMain} />
        {showAdminAreas ? <ConfiguracoesMenu /> : null}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      {/* ... */}
    </Sidebar>
  );
}
```

A única mudança no JSX é trocar `items={navMain}` por `items={visibleNavMain}`. O import de `canAccessRoute` pode ser combinado com o existente de `canAccessAdminAreas`.

- [ ] **Step 2: Criar `bot-fluxo/layout.tsx`**

`app/(app)/bot-fluxo/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { canAccessRoute } from '@/lib/rbac';

export default async function BotFluxoLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  // (app)/layout.tsx já redireciona pra /login quando user é null; aqui só
  // tratamos o caso autenticado-mas-sem-permissão.
  if (user && !canAccessRoute(user.role, '/bot-fluxo')) {
    redirect('/atendimentos');
  }
  return <>{children}</>;
}
```

- [ ] **Step 3: Criar `dashboard/layout.tsx`**

`app/(app)/dashboard/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { canAccessRoute } from '@/lib/rbac';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  if (user && !canAccessRoute(user.role, '/dashboard')) {
    redirect('/atendimentos');
  }
  return <>{children}</>;
}
```

- [ ] **Step 4: Verify**

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
pnpm test --run && pnpm typecheck
```

Expected: TODOS os testes existentes verdes (não esperamos regressão; a sidebar tem teste? Verificar com `find components -name "app-sidebar*test*"` antes — se sim, rodar mentalmente a matriz de roles pra confirmar que o teste cobre o novo comportamento ou continua passando porque o teste mockou um ADMIN).

- [ ] **Step 5: Commit**

```bash
git add components/app-sidebar.tsx 'app/(app)/bot-fluxo/layout.tsx' 'app/(app)/dashboard/layout.tsx'
git commit -m "feat(rbac): filtra navMain por role + gates server-side em bot-fluxo e dashboard

AGENT vê apenas Atendimentos/Contatos/Campanhas; SUPERVISOR vê tudo exceto
Configurações. Layouts novos seguem o mesmo padrão de configuracoes/layout.tsx."
```

---

## Task 3: Verificação final + push + PR

**Files:** nenhum (apenas comandos)

- [ ] **Step 1: Verificação completa**

```bash
cd /home/rodrigo-digigov/dev-space/digigov/digichat/crm-web
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test --run
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
```

Expected: tudo verde, zero diff em `lib/generated`. Pular `pnpm build` (canais quebrado pré-existente).

- [ ] **Step 2: Manual smoke (best-effort, opcional)**

```bash
pnpm dev
```

Em `http://localhost:3001`:

- Login como AGENT (precisa criar via convite, ou usar conta existente) → sidebar mostra só Atendimentos/Contatos/Campanhas + Ajuda. Acessar `/bot-fluxo` direto → redirect pra `/atendimentos`. Idem `/dashboard`.
- Login como ADMIN → todos os 5 itens + Configurações.

Se não der pra testar manualmente, documentar no PR como TODO pra revisão pré-merge.

- [ ] **Step 3: Push + abrir PR**

```bash
git push -u origin feat/agent-nav-restriction
gh pr create --title "feat(rbac): restringe navMain por role (AGENT/SUPERVISOR)" --body "$(cat <<'EOF'
## Summary
- AGENT vê apenas Atendimentos / Contatos / Campanhas na sidebar
- SUPERVISOR vê tudo de AGENT + Bot/Fluxo + Dashboard, mas não entra em Configurações
- ADMIN / SUPER_ADMIN inalterados (todos os itens + Configurações)
- `lib/rbac.ts` ganha `canAccessRoute(role, route)` com mapa estático ROUTE_ACCESS; `canAccessAdminAreas` vira wrapper.
- Novos layouts server-side em \`app/(app)/bot-fluxo/\` e \`app/(app)/dashboard/\` seguem o padrão de \`configuracoes/layout.tsx\` para gate por URL direto.

## Out of scope
- Permissões granulares per-user (ROADMAP §4.8 "RBAC efetivo").
- Mudanças no backend (decorators \`@Roles\` continuam exigindo ADMIN onde já exigiam).
- Helper \`<RequireRole>\` pra UI condicional dentro das páginas.

## Test plan
- [x] \`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test --run\` verde
- [x] \`pnpm generate:api:from-snapshot && git diff --exit-code lib/generated\` zero diff
- [ ] Login como AGENT: sidebar com 3 itens; \`/bot-fluxo\` e \`/dashboard\` direto redirecionam pra \`/atendimentos\` (manual)
- [ ] Login como SUPERVISOR: sidebar com 5 itens, sem Configurações; \`/configuracoes/*\` redireciona (manual)
- [ ] Login como ADMIN: tudo como antes (manual)
- [ ] (Pré-existente) \`pnpm build\` quebra em \`/configuracoes/canais\` — não é regressão deste PR
EOF
)"
```

Reportar URL do PR.

---

## Self-review do plano (após implementar)

- [ ] `canAccessRoute` testado com matriz exaustiva por role × rota?
- [ ] `canAccessAdminAreas` ainda funciona (call sites em sidebar e configuracoes/layout)?
- [ ] Os 2 layouts novos seguem o mesmo padrão de `configuracoes/layout.tsx` (mesmo handling de `user === null`)?
- [ ] Sidebar filtra com `canAccessRoute` (não duplica regra)?
- [ ] PR description documenta out-of-scope corretamente?
