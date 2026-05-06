---
title: Sprint 0.14 — App Shell pós-login
date: 2026-05-06
status: approved
fase: 0 (Bootstrap)
roadmap: §4.6 — Layout base Izing-like + Páginas dummy de Atendimentos
related-prs:
  - crm-api#34 (GET /me + tipagem OpenAPI)
  - crm-api#36 (cookie httpOnly canônico)
  - crm-api#37 (docs hygiene)
---

# Sprint 0.14 — App Shell pós-login

## 1. Objetivo

Entregar o layout base do produto pós-login: route group `(app)` protegido por cookie, sidebar lateral com navegação principal, header com toggle de tema e UserMenu, e páginas placeholder para as 6 áreas top-level do CRM. Inclui substituição do `login-form.tsx` placeholder pelo formulário real integrado ao backend de auth via cookie httpOnly.

Sprint do tipo "tela integrada com API, sem CRUDs". Encerra os dois primeiros bullets pendentes em ROADMAP §4.6.

## 2. Pré-requisitos satisfeitos

- `GET /api/v1/me` (retorna `UserResponseDto` completo)
- `POST /api/v1/auth/login` setando cookies `access_token` (15 min) e `refresh_token` (7 dias) httpOnly assinados
- `POST /api/v1/auth/refresh` rotacionando cookies
- `POST /api/v1/auth/logout` limpando cookies + invalidando refresh token no banco
- `securitySchemes` do OpenAPI expõe `cookie` + `bearer`
- `lib/generated` regerado contra `openapi.snapshot.json` atualizado

## 3. Princípios da sprint

1. **Server Components por padrão.** `'use client'` só onde precisa de hook React, evento DOM ou browser API.
2. **Tipos de `@/lib/generated/types`.** `UserResponseDto`, `AuthResponseDto`, `UpdateMeDto`. Sem shim local.
3. **Cookie httpOnly é canônico para auth.** Nunca persistir token em JS-readable storage.
4. **Persistência SSR-friendly de UI state via cookie não-httpOnly.** Sem localStorage/sessionStorage no MVP — first paint sem flicker é prioridade pra atendentes que ficam 8h/dia na tela.
5. **Mensagens visíveis em pt-BR.** Identificadores de código em inglês.
6. **Acessibilidade WCAG AA.** Foco visível em todos elementos interativos, `aria-current="page"` no item ativo, `aria-label` em botões só-ícone, navegação por teclado, Escape fecha overlays.
7. **Light + dark mode.** Tokens semânticos do design system v2; sem hex hardcoded.
8. **Multi-tenant transparente.** Frontend não envia `companyId` em requests — vem do JWT no cookie.

## 4. Decisões consolidadas

| Decisão                           | Escolha                                  | Razão                                                                                                              |
| --------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Middleware Next 16                | `proxy.ts`                               | Padrão canônico do Next 16 (substitui `middleware.ts`)                                                             |
| Refresh em SSR no 401             | Não tentar                               | Custo de implementação cross-runtime (Node fetch + Set-Cookie reflow) > custo de UX (piscada eventual em `/login`) |
| TTL de sessão                     | Manter padrão do backend (refresh 7d)    | Já cobre "≥ 5 dias" pedido pelo PO; menor TTL exigiria PR no `crm-api`                                             |
| Persistência de sidebar collapsed | Cookie `digichat_sidebar` (não-httpOnly) | First paint sem flicker via SSR; respeita regra "sem localStorage"                                                 |
| Departamento no header            | Não exibir                               | Entra com a tela de Atendimentos (Fase 2)                                                                          |
| RBAC por role no menu             | AGENT vê tudo                            | Gating real é Fase 4; sprint não-bloqueante                                                                        |
| Avatar                            | Iniciais derivadas de `name`             | Coluna `avatarUrl` não existe no backend; upload é Fase 4                                                          |
| Title contextual no header        | Map estático rota → título               | YAGNI; refatorar quando precisar                                                                                   |
| Showcase `/design-system`         | Out of scope                             | Anotar gap em ROADMAP §4.6 pra próxima sprint                                                                      |
| Tela de Register                  | Out of scope                             | Permanece em §4.6                                                                                                  |

## 5. Arquitetura

Três camadas:

1. **Borda** — `proxy.ts` na raiz. Lê `request.cookies.get('access_token')`. Ausente → 307 `/login`. Presente → `next()`. Não valida JWT (sem segredo no client).
2. **Server Components do `(app)` layout** — `app/(app)/layout.tsx` faz fetch server-side de `GET /api/v1/me` repassando os cookies da request via `cookies()` de `next/headers`. Cache `'no-store'` (sempre fresh). Resposta 200 → renderiza `<AppShell user={data}>{children}</AppShell>`. Resposta 401 → `redirect('/login')`. Outras → propaga pra `error.tsx`.
3. **Client Components reativos** — `AppShell`, `AppSidebar`, `AppHeader`, `UserMenu`, `MobileSidebarDrawer`. Recebem `user` por prop ou via Context. Usam `useMeControllerFindMine` quando precisam revalidar do client (ex.: após `PATCH /me` futuro). Usam `useAuthControllerLogout` na ação de sair.

## 6. Estrutura de arquivos

```
app/
├── proxy.ts                               # NOVO — guard de auth por cookie
├── page.tsx                               # ALTERAR — redirect / → /atendimentos | /login
├── (auth)/                                # já existe
│   └── login/
│       ├── login-form.tsx                 # REESCREVER — placeholder → real
│       └── login-form.test.tsx            # ATUALIZAR
└── (app)/                                 # NOVO route group protegido
    ├── layout.tsx                         # Server Component: fetch /me, monta shell
    ├── loading.tsx                        # skeleton do shell
    ├── error.tsx                          # boundary
    ├── atendimentos/page.tsx              # placeholder
    ├── contatos/page.tsx                  # placeholder
    ├── campanhas/page.tsx                 # placeholder
    ├── bot-fluxo/page.tsx                 # placeholder
    ├── dashboard/page.tsx                 # placeholder
    └── configuracoes/page.tsx             # placeholder

components/layout/
├── app-shell.tsx                          # Client wrapper (Context Provider + composição)
├── app-sidebar.tsx                        # navegação lateral fixa em ≥ md
├── app-sidebar-item.tsx                   # item individual com aria-current
├── app-sidebar-section.tsx                # item expansível (Configurações)
├── app-header.tsx                         # top bar
├── user-menu.tsx                          # dropdown com avatar de iniciais
└── mobile-sidebar-drawer.tsx              # drawer overlay < md

contexts/
└── current-user-context.tsx               # Provider + hook useCurrentUser()

stores/
└── layout-store.ts                        # Zustand: sidebarCollapsed, mobileDrawerOpen, hydrate from cookie

lib/
├── api-client.ts                          # axios com withCredentials + interceptor 401→refresh
└── auth-server.ts                         # getCurrentUserOnServer(): fetch /me com cookies
```

## 7. Fluxo de auth

### 7.1 Login

`login-form.tsx` é Client Component. Submit:

1. Valida com Zod (reusa schema gerado pelo Kubb pra `LoginDto`).
2. Chama `useAuthControllerLogin().mutateAsync({ email, password })` com `withCredentials: true`.
3. Backend devolve `Set-Cookie: access_token; refresh_token` + body `{ user }`.
4. Success → `router.push('/atendimentos')` + `queryClient.setQueryData(['me'], data.user)` pra preempt do shell.
5. Erro 401 → toast "E-mail ou senha incorretos".
6. Erro 5xx → toast "Erro no servidor. Tente novamente.".
7. Erro de rede → toast "Sem conexão com o servidor.".

### 7.2 Acesso a rota protegida

1. `proxy.ts` verifica presença do cookie `access_token`. Sem cookie → 307 `/login`.
2. `app/(app)/layout.tsx` (Server Component) chama `getCurrentUserOnServer()`. Internamente: `fetch(\`${API_URL}/me\`, { headers: { cookie: cookies().toString() }, cache: 'no-store' })`.
3. 200 → renderiza shell com `user`.
4. 401 → `redirect('/login')` (cookie inválido/expirado; user vê piscada — aceitável).
5. 5xx → propaga erro para `error.tsx`.

### 7.3 Cookie expira durante navegação client-side

1. Próxima request a endpoint protegido devolve 401.
2. Axios interceptor (em `lib/api-client.ts`) detecta 401:
   a. Tenta `POST /auth/refresh` (cookie `refresh_token` envia automático no `/auth/*`).
   b. Se 200 (refresh válido) → repete request original, agora com cookies novos.
   c. Se 401 do refresh → `queryClient.clear()` + `window.location.href = '/login'` + toast "Sessão expirada. Faça login novamente.".
3. Concorrência: múltiplos 401 simultâneos compartilham uma única promise de refresh em vôo (singleton pattern no interceptor).

### 7.4 Logout

1. `UserMenu` → "Sair" → `useAuthControllerLogout().mutate({})`.
2. Backend limpa cookies via `Set-Cookie` expirados + revoga refresh token no banco.
3. Success → `queryClient.clear()` + `router.replace('/login')`.
4. Erro de rede → mantém na tela atual + toast "Não foi possível sair. Tente novamente.". (Cookie httpOnly não pode ser limpo do client; usuário precisa retentar.)

## 8. Componentes

### 8.1 `AppShell`

Client Component. Recebe `user: UserResponseDto` e `sidebarCollapsedInitial: boolean` (lido do cookie no Server). Provê `CurrentUserContext` e hidrata `layoutStore` com o estado inicial. Compõe `AppSidebar`, `AppHeader`, `<main>{children}</main>`, `MobileSidebarDrawer`.

Layout CSS:

- `≥ md`: `grid-template-columns: auto 1fr` com sidebar fixa (240px expandida, 64px colapsada).
- `< md`: sidebar fora do fluxo; main ocupa 100%; drawer overlay quando aberto.

### 8.2 `AppSidebar`

Server Component (renderiza markup estático com Client child para o item ativo). Itens da nav top-level:

| Rota             | Ícone (lucide-react) | Label                      |
| ---------------- | -------------------- | -------------------------- |
| `/atendimentos`  | `MessageSquare`      | Atendimentos               |
| `/contatos`      | `Users`              | Contatos                   |
| `/campanhas`     | `Megaphone`          | Campanhas                  |
| `/bot-fluxo`     | `Bot`                | Bot/Fluxo                  |
| `/dashboard`     | `BarChart3`          | Dashboard                  |
| `/configuracoes` | `Settings`           | Configurações (expansível) |

Sub-itens de Configurações (todos placeholder por ora — `/configuracoes/<slug>`):
Departamentos, Tags, Usuários, Quick Replies, Canais, Integrações, Preferências.

Estados visuais:

- **Ativo**: `bg-primary-50 dark:bg-primary-900/20`, `text-primary-600 dark:text-primary-400`, barra lateral 2px `bg-primary-500`. `aria-current="page"`.
- **Hover**: `bg-bg-muted`.
- **Focus**: outline 2px `ring-primary-500` com offset 2px (já default do Tailwind 4).
- **Colapsada**: só ícones (24px), label via atributo `title` no `<a>` (tooltip nativo do navegador). Tooltip Radix fica fora dessa sprint pra não exigir aprovação de nova dep.

Toggle de collapse: botão no rodapé com `ChevronsLeft`/`ChevronsRight`. Atualiza `layoutStore.sidebarCollapsed` E reescreve cookie `digichat_sidebar`.

### 8.3 `AppSidebarItem`

Client Component (precisa de `usePathname`). Props: `href`, `icon`, `label`, `collapsed`. Marca ativo quando `pathname === href || pathname.startsWith(href + '/')` (para rotas com sub-paths futuras). Renderiza com `aria-current="page"` quando ativo.

### 8.4 `AppSidebarSection`

Client Component. Wrapper expansível para "Configurações". Click no header navega para `/configuracoes` (índice) **e** alterna expansão dos sub-itens (controlled state local). Estado expandido persiste em memória (`useState`) — não em cookie (escopo: sessão, não atendente).

### 8.5 `AppHeader`

Client Component. Layout esquerda → direita:

1. Hamburger (`Menu` icon, só visível < md, `aria-label="Abrir menu"`).
2. Slot de título contextual (lookup em `lib/route-titles.ts` por `usePathname`).
3. Spacer (`flex-1`).
4. `<ThemeToggle />` (já existe em `components/theme-toggle.tsx`).
5. `<UserMenu />`.

### 8.6 `UserMenu`

Client Component. Recebe `user` do `useCurrentUser()`.

Trigger: button com avatar 32px + (≥ md) nome do user. Avatar = iniciais derivadas:

- Splita `name` por whitespace.
- Pega primeiras letras das **2 primeiras palavras**, uppercase.
- Fallback `"?"` se `name` for vazio/null.
- Background do avatar: hash determinístico de `user.id` mapeando para paleta de 6 cores neutras (consistência cross-sessão, sem flicker).

Dropdown (`@radix-ui/react-dropdown-menu`):

1. Header: nome (text-sm font-medium) + email (text-xs text-text-secondary).
2. Separator.
3. "Meu perfil" — link para `/configuracoes/preferencias` (placeholder).
4. "Sair" — chama mutation de logout; mostra spinner inline enquanto pendente; trigger desabilitado durante a request.

Acessibilidade: trigger com `aria-label="Menu do usuário"`, navegação por teclado via Radix, Escape fecha.

### 8.7 `MobileSidebarDrawer`

Client Component. `@radix-ui/react-dialog` em modo overlay full-height esquerda. Aberto pelo hamburger do header (controlled via `layoutStore.mobileDrawerOpen`). Conteúdo: clone semântico de `AppSidebar` (nav full-width). Fecha em Esc, click no backdrop, ou click em link (auto-close ao navegar via `usePathname` listener). No `≥ md` breakpoint, drawer auto-fecha se ainda aberto.

## 9. Estado

### 9.1 TanStack Query (server state)

- Hook gerado pelo Kubb: `useMeControllerFindMine` com `queryKey: ['me']`.
- `staleTime: 5 * 60 * 1000` (5 min — user data muda raramente).
- `refetchOnWindowFocus: true` (pega absenceActive/lastSeenAt atualizado quando user volta).
- Invalidação manual em logout (`queryClient.clear()`).

### 9.2 Zustand (UI volátil)

`stores/layout-store.ts`:

```ts
interface LayoutStore {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleSidebar: () => void; // alterna E reescreve cookie
  setMobileDrawerOpen: (open: boolean) => void;
  hydrate: (sidebarCollapsed: boolean) => void; // chamado pelo AppShell no mount
}
```

Não persiste sozinho em storage; cookie é fonte da verdade pra `sidebarCollapsed`.

### 9.3 Cookie (SSR-friendly UI state)

| Cookie             | Path | Max-Age  | httpOnly | Secure (prod) | SameSite | Conteúdo                  |
| ------------------ | ---- | -------- | -------- | ------------- | -------- | ------------------------- |
| `digichat_sidebar` | `/`  | 365 dias | não      | sim           | lax      | `expanded` ou `collapsed` |

Set pelo client via `document.cookie = ...` quando user clica no toggle. Lido server-side em `app/(app)/layout.tsx` via `cookies().get('digichat_sidebar')` e passado pro `AppShell` como `sidebarCollapsedInitial`.

## 10. Edge cases

| Caso                                                 | Comportamento                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Cookie `access_token` ausente                        | `proxy.ts` redireciona `/login` antes do React montar                              |
| Cookie presente mas inválido/expirado em SSR         | `getCurrentUserOnServer` recebe 401 → `redirect('/login')`                         |
| Cookie expira durante navegação client-side          | Axios interceptor → refresh → repete; se refresh falha, redirect com toast         |
| Multiple 401 simultâneos                             | Singleton de promise de refresh; nenhuma race                                      |
| User com `name` vazio/null                           | Iniciais = `"?"`, label do header = `"Usuário"`                                    |
| User com `departments: []`                           | Header não mostra depto (já fora de escopo dessa sprint)                           |
| Mobile drawer aberto + resize pra desktop            | `useEffect` em breakpoint listener → fecha drawer                                  |
| Dark mode em hover/focus                             | Tokens `bg-bg-muted` e `ring-primary-500` já têm variantes dark via `:root.dark`   |
| Logout com falha de rede                             | Toast "Não foi possível sair"; user permanece logado client-side; precisa retentar |
| Cookie de sidebar com valor inválido                 | Default `expanded`; ignora valor desconhecido                                      |
| Hard reload em rota profunda (`/configuracoes/tags`) | proxy → /me OK → shell renderiza com sub-item correto ativo                        |

## 11. Out of scope (anotar como gap em ROADMAP)

- RBAC efetivo por role (AGENT vê tudo nessa sprint).
- Tela de register (`/register`).
- Showcase `/design-system` com componentes do shell.
- Avatar com upload (Fase 4).
- Tela "Meu perfil" com `PATCH /me`.
- i18n.
- Loading states granulares (cada page tem seu próprio skeleton).
- Notificações no header (badge de tickets pendentes — Fase 2).
- Search global no header.
- Atalhos de teclado globais (Cmd+K).

## 12. Estratégia de testes

Pirâmide enxuta — testes onde a lógica é não trivial.

| Arquivo                                            | Teste                                                                                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api-client.test.ts`                           | interceptor 401: sucesso de refresh repete original; falha de refresh dispara redirect; promise singleton durante chamadas concorrentes |
| `lib/auth-server.test.ts`                          | `getCurrentUserOnServer` retorna user em 200; throws em 5xx; null em 401                                                                |
| `stores/layout-store.test.ts`                      | toggle alterna estado, escreve cookie; hydrate aplica valor inicial                                                                     |
| `components/layout/app-sidebar-item.test.tsx`      | aria-current quando rota ativa exata; quando rota é prefixo; sem aria-current quando rota outra                                         |
| `components/layout/user-menu.test.tsx`             | iniciais para nomes 1/2/3+ palavras; fallback `"?"`; click em "Sair" chama mutation; trigger desabilita durante mutation                |
| `app/(auth)/login/login-form.test.tsx` (atualizar) | submit chama mutation com body validado; success redireciona; erro 401 mostra toast específico; loading desabilita botão                |

Não cobertos por unit (delegar para validação manual): `app/(app)/layout.tsx` (Server Component com `redirect`), `proxy.ts` (testar Edge runtime no Vitest é mais ruído que valor).

## 13. Validação manual (evidence-based)

Antes de declarar pronto, executar e marcar:

- [ ] `pnpm dev` sobe sem erros e sem warnings novos
- [ ] Acessar `/` sem login → 307 `/login`
- [ ] Login com credenciais válidas → cookies httpOnly visíveis em DevTools → 307 `/atendimentos`
- [ ] Sidebar destaca rota ativa em todas as 6 rotas top-level
- [ ] "Configurações" expande, sub-itens navegam, todos abrem placeholder
- [ ] Toggle dark/light afeta sidebar, header, dropdown, drawer mobile, login form
- [ ] Resize pra `< md` → sidebar oculta, hamburger aparece, drawer abre por hamburger e fecha por Esc/backdrop/click em link
- [ ] Toggle de collapse persiste após reload (cookie funcionando)
- [ ] Logout limpa cookies (DevTools confirma `Set-Cookie` com expires no passado) → `/login`
- [ ] Acessar `/atendimentos` direto após logout → `/login`
- [ ] Editar valor de `access_token` no DevTools (forçar inválido) → próxima nav protegida → 401 → refresh → se refresh válido segue, se não `/login`
- [ ] Stub backend retornando 5xx no `/me` → `error.tsx` aparece com botão de retry
- [ ] Acessibilidade: navegar inteiro shell por Tab, Enter ativa, Esc fecha drawer/dropdown
- [ ] `pnpm format:check` verde
- [ ] `pnpm lint` verde
- [ ] `pnpm typecheck` verde
- [ ] `pnpm test` verde
- [ ] `pnpm build` verde
- [ ] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff

## 14. Estimativa

~2-3 dias de trabalho efetivo. Distribuição esperada:

- Dia 1: snapshot sync (já feito), `proxy.ts`, `lib/api-client.ts`, `lib/auth-server.ts`, login real, layout-store, testes dos lib/store.
- Dia 2: `app/(app)/layout.tsx`, AppShell, AppSidebar, AppHeader, UserMenu, páginas placeholder, testes de componentes.
- Dia 3: MobileSidebarDrawer, edge cases de 401/refresh, dark mode polish, validação manual, atualizações de docs.

## 15. Pós-sprint (PR de docs)

Após merge da sprint, abrir PR `docs/update-roadmap-0-13-0-14`:

- Marcar 7 checkboxes em ROADMAP §4.3 (Sprint 0.13 — feita em PR #11).
- Marcar 2 checkboxes em ROADMAP §4.6 ("Layout base Izing-like (sidebar + header + área principal)" e "Páginas dummy de Atendimentos").
- Atualizar §4.6 listando os gaps remanescentes (showcase, register, RBAC, etc.) com nota de qual sprint os captura.
