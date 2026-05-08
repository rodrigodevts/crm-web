# Restrição de navegação por role (AGENT / SUPERVISOR)

> **Repo:** `crm-web`
> **Branch:** `feat/agent-nav-restriction`
> **Base:** commit `2e9557d` (após PR #22 mergeada)

## 1. Objetivo

Restringir a navegação principal por role:

| Role          | Itens visíveis em `navMain`                             | Configurações |
| ------------- | ------------------------------------------------------- | ------------- |
| `AGENT`       | Atendimentos, Contatos, Campanhas                       | ❌            |
| `SUPERVISOR`  | Atendimentos, Contatos, Campanhas, Bot/Fluxo, Dashboard | ❌            |
| `ADMIN`       | tudo                                                    | ✅            |
| `SUPER_ADMIN` | tudo                                                    | ✅            |

Hoje qualquer role logada vê os 5 itens de `navMain` e só Configurações é gateada.

## 2. Decisões alinhadas com o humano

1. **Atendente (AGENT)** vê apenas Atendimentos / Contatos / Campanhas.
2. **SUPERVISOR** vê tudo de AGENT + Bot/Fluxo + Dashboard, mas **não entra** em Configurações. Default mais permissivo, sem mudança no backend (que hoje usa `@Roles('ADMIN')` nos controllers administrativos).
3. **ADMIN/SUPER_ADMIN** mantêm acesso a tudo, inclusive Configurações.
4. Mudança é **puro frontend**. Backend continua governando autorização real de chamadas API.
5. **Sem permissões granulares por usuário** (ex.: "este AGENT específico vê Campanhas"). Esse design (`extraPermissions: string[]` no User) fica para a sprint dedicada §4.8 "RBAC efetivo".
6. **Sem helper `<RequireRole>`** ou mapa central com permissões granulares — também §4.8.

## 3. Arquivos

### Modify

- `lib/rbac.ts` — adiciona `canAccessRoute(role, route)` baseado num mapa `ROUTE_ACCESS`. `canAccessAdminAreas` continua existindo, agora reescrito como `canAccessRoute(role, '/configuracoes')` para manter compatibilidade com call sites existentes (`components/app-sidebar.tsx` e `app/(app)/configuracoes/layout.tsx`) sem quebrá-los.
- `lib/rbac.test.ts` — adiciona testes do `canAccessRoute`.
- `components/app-sidebar.tsx` — filtra `navMain` antes de passar pra `<NavMain>`.

### Create

- `app/(app)/bot-fluxo/layout.tsx` — Server Component que faz `redirect('/atendimentos')` se `!canAccessRoute(user.role, '/bot-fluxo')`. Mesmo padrão de `app/(app)/configuracoes/layout.tsx`.
- `app/(app)/dashboard/layout.tsx` — análogo para `/dashboard`.

## 4. Lógica do `canAccessRoute`

```ts
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

export function canAccessAdminAreas(role: Role): boolean {
  return canAccessRoute(role, '/configuracoes');
}
```

A semântica de prefixo é importante: `canAccessRoute('ADMIN', '/configuracoes/usuarios')` deve retornar `true` porque `/configuracoes` está na lista.

`/ajuda` (item de `navSecondary`) e `/aceitar-convite/...` (público, fora de `(app)`) não passam por `canAccessRoute` — não estão em `navMain` nem em `(app)/<rota>/layout.tsx` que vamos mexer.

## 5. Filtro na sidebar

Em `components/app-sidebar.tsx`:

```tsx
const visibleNavMain = navMain.filter((item) => canAccessRoute(user.role, item.url));
// ...
<NavMain items={visibleNavMain} />;
```

`navSecondary` (Ajuda) continua visível pra todas as roles. `ConfiguracoesMenu` continua gateado por `canAccessAdminAreas` (que agora delega pro `canAccessRoute`).

## 6. Server-side gates (rotas dinâmicas)

Mesmo padrão de `app/(app)/configuracoes/layout.tsx`:

```tsx
// app/(app)/bot-fluxo/layout.tsx
import { redirect } from 'next/navigation';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { canAccessRoute } from '@/lib/rbac';

export default async function BotFluxoLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  if (user && !canAccessRoute(user.role, '/bot-fluxo')) {
    redirect('/atendimentos');
  }
  return <>{children}</>;
}
```

E o equivalente em `app/(app)/dashboard/layout.tsx`. Note que o redirect é para `/atendimentos`, mesmo destino do `configuracoes/layout.tsx` (consistência).

`/atendimentos`, `/contatos`, `/campanhas` **não recebem layout novo** — são acessíveis a todas as roles.

## 7. Testes

`lib/rbac.test.ts` ganha um novo `describe('canAccessRoute')`:

- Cada role × cada item de `navMain` (5 rotas × 4 roles = 20 cases) com matriz esperada.
- Prefix match: `canAccessRoute('ADMIN', '/configuracoes/usuarios')` → true.
- Rota fora do mapa: `canAccessRoute('AGENT', '/qualquer-coisa')` → false (default deny).

Smoke tests opcionais para os novos layouts (`bot-fluxo/layout.test.tsx`, `dashboard/layout.test.tsx`) ficam **fora** do escopo desta sprint — o gate de Configurações já entregue na PR #19 não tem teste tampouco; mantém consistência. Validação manual no dev server cobre o caminho.

## 8. Out of scope (explícito)

- Permissões per-user (ex.: AGENT específico ganha `/campanhas`).
- Mudanças no backend (decorators `@Roles`, novo schema, endpoint de gestão de permissões).
- Helper `<RequireRole role="...">` ou `useHasPermission` para UI condicional dentro das páginas.
- Diferenciação SUPERVISOR vs AGENT em features dentro das páginas que ambos veem (ex.: SUPERVISOR pode editar contato, AGENT não).
- UI de admin para escolher quem vê o quê — todo o gating é por role.

Tudo isso fica mapeado no ROADMAP §4.8 "RBAC efetivo — sprint dedicada".

## 9. Verificação de fechamento

1. `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test --run` verde.
2. `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff (não esperamos mexer em OpenAPI).
3. **Validação manual** com `pnpm dev`:
   - Login AGENT → sidebar mostra só Atendimentos/Contatos/Campanhas + Ajuda. Tentar `/bot-fluxo` direto → redirect pra `/atendimentos`. Tentar `/dashboard` direto → redirect pra `/atendimentos`. `/configuracoes/*` → redirect pra `/atendimentos` (já existente).
   - Login SUPERVISOR → sidebar mostra os 5 itens de `navMain` + Ajuda, sem Configurações. `/configuracoes/*` → redirect pra `/atendimentos`.
   - Login ADMIN → tudo como antes.

`pnpm build` continua falhando em `/configuracoes/canais` por bug pré-existente (commit `837762a`) — fora desta sprint.
