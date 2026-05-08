# Showcase `/configuracoes/design-system` — catálogo descritivo

> **Repo:** `crm-web`
> **Branch sugerida:** `feat/design-system-showcase`
> **Gap fechado:** ROADMAP §4.8 — "Showcase `/design-system` (catálogo de componentes shadcn aplicados ao tema DigiChat)"
> **Não fecha:** §4.8 "Tema final consolidado" (decisão entre Dreams Chat e radix-nova com azul DigiChat) — fica explicitamente fora de escopo.

## 1. Objetivo

Entregar uma página interna que cataloga **o estado atual** dos tokens visuais e
componentes do `crm-web`, servindo de referência viva pra Claude Code e pro
mantenedor consultar antes de criar UI nova.

A página é **descritiva, não normativa**: documenta o que já está em
`app/globals.css` e `components/ui/`, não decide nada sobre tema ou tokens.

## 2. Decisões alinhadas com o humano

1. **Propósito**: catálogo do que existe (não QA visual, não decisão de tema).
2. **Escopo**: tokens visuais + primitivos shadcn + compostos do projeto.
3. **Rota**: `/(app)/configuracoes/design-system`, gated por ADMIN/SUPER_ADMIN
   (herda o redirect 403 de `(app)/configuracoes/layout.tsx` instalado na PR #19).
4. **Formato**: página única com TOC sticky lateral e âncoras `<a href="#…">`.
   Sem scroll-spy.
5. **Compostos data-bound**: split View + Container apenas nos compostos que
   forem listados no showcase (atualmente `UsersTable` e `InvitationsTable`).
   `NavUser`, `LoginForm`, `AcceptInviteForm` já aceitam props ou rodam sem
   fetch — usados diretamente.
6. **Nota de drift `design-system.md` vs `globals.css`**: banner informativo
   no topo do showcase aponta para o gap aberto (§4.8 ROADMAP). Reconciliação
   do `design-system.md` é trabalho de outra sprint.
7. **Sem dark mode toggle dedicado** na página — `ThemeToggle` global do
   `SiteHeader` cobre. Verificação manual em light e dark é parte do
   checklist de fechamento.

## 3. Estrutura de arquivos

```
app/(app)/configuracoes/design-system/
  page.tsx                            # Server Component, monta TOC + sections
  _sections/
    section.tsx                       # <Section id title> — h2 + anchor + spacing padronizado
    drift-banner.tsx                  # banner de aviso sobre §4.8 ROADMAP
    tokens-colors.tsx                 # paleta primary/50..950 + tokens semânticos shadcn
    tokens-typography.tsx             # Geist Sans/Mono nas escalas tipográficas usadas
    tokens-spacing.tsx                # escala spacing/radius/shadow do Tailwind 4
    primitives-buttons.tsx            # variants do Button (default, secondary, destructive, outline, ghost, link) + sizes + states
    primitives-forms.tsx              # Input, Label, Field, Select, Checkbox, Toggle, ToggleGroup
    primitives-feedback.tsx           # Skeleton, Tooltip, Badge, Sonner trigger
    primitives-overlays.tsx           # Dialog, Drawer, Sheet, DropdownMenu, Collapsible
    primitives-data.tsx               # Table, Avatar, Separator, Tabs, Breadcrumb
    primitives-charts.tsx             # Chart (placeholder com mock data simples)
    composites.tsx                    # LoginForm, AcceptInviteForm, NavUser, UsersTableView, InvitationsTableView
  toc.tsx                             # 'use client' — sidebar sticky com lista hardcoded de âncoras
```

Tudo dentro de `_sections/` é Server Component, exceto onde há interatividade
(triggers de Dialog, Drawer, DropdownMenu, Sonner). Esses ficam isolados em
arquivos `'use client'` próprios ou são pequenas ilhas client dentro de uma
section Server.

`page.tsx` é Server Component. Importa todas as sections e compõe o layout
com `<TOC />` à esquerda e o conteúdo principal à direita.

## 4. Layout

```
┌───────────────────────────────────────────────────────────────────┐
│ <SiteHeader title="Design System">                                │  ← já existe
├──────────────┬────────────────────────────────────────────────────┤
│ TOC          │ <DriftBanner /> (caixa informativa)                │
│ sticky       │                                                    │
│ ~240px       │ <Section id="tokens"><h2>Tokens</h2></Section>     │
│ side-padding │   <TokensColors />                                 │
│              │   <TokensTypography />                              │
│ - Tokens     │   <TokensSpacing />                                 │
│   - Cores    │                                                    │
│   - Tipo     │ <Section id="primitivos"><h2>Primitivos</h2></S.>  │
│   - Spacing  │   <PrimitivesButtons />                             │
│ - Primitivos │   <PrimitivesForms />                               │
│   - Buttons  │   <PrimitivesFeedback />                            │
│   - Forms    │   <PrimitivesOverlays />                            │
│   - …        │   <PrimitivesData />                                │
│ - Compostos  │   <PrimitivesCharts />                              │
│              │                                                    │
│              │ <Section id="compostos"><h2>Compostos</h2></S.>    │
│              │   <Composites />                                    │
└──────────────┴────────────────────────────────────────────────────┘
```

- TOC: `position: sticky; top: <header-height>` no `lg:` breakpoint; em telas
  menores colapsa pra cima do conteúdo (não-MVP — mas precisa não quebrar).
- Cada `<Section>` injeta `id={id}` no heading pra ancoragem funcionar com
  links `#tokens`, `#primitivos`, etc.
- TOC tem links `<a href="#anchor">`. Sem scroll-spy ativo (over-engineering
  pra página interna).

## 5. Conteúdo por section (resumo)

### Tokens

- **Cores**: paleta `--color-primary-50` até `--color-primary-950` em
  swatches com hex visível e nome da CSS var copiável. Plus tokens
  semânticos shadcn: `--background`, `--foreground`, `--card`, `--primary`,
  `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`,
  `--input`, `--ring`, `--sidebar-*`, `--chart-1..5`. Cada swatch mostra
  light + dark side-by-side.
- **Tipografia**: Geist Sans nas escalas `text-xs` → `text-4xl` (Tailwind
  default), pesos `font-normal` → `font-bold`. Geist Mono numa linha de
  exemplo. Sem Archivo/Inter/JetBrains Mono porque não estão no projeto
  (drift documentado pelo banner).
- **Spacing / Radius / Shadow**: escala Tailwind padrão (1..24 spacings,
  `rounded-sm/md/lg/xl/full`, `shadow-sm/md/lg`). Mostra com retângulos
  visuais e o nome da classe.

### Primitivos

Cada componente shadcn instalado em `components/ui/` tem uma section própria
(ou cabe num grupo). Exemplos curtos, foco em ver as variantes:

- **Buttons**: `default | secondary | destructive | outline | ghost | link`
  × `default | sm | lg | icon` × estados `disabled` e com ícone.
- **Forms**: Input (vazio, com placeholder, com erro, disabled), Label,
  Field, Select, Checkbox, Toggle, ToggleGroup.
- **Feedback**: Skeleton, Tooltip (trigger + posições), Badge (variants),
  Sonner (botão dispara `toast.success/error/info/warning`).
- **Overlays**: Dialog, Drawer, Sheet, DropdownMenu, Collapsible — cada um
  com botão de gatilho que abre o overlay com conteúdo demonstrativo.
- **Data**: Table (header + rows fake), Avatar (com imagem, com initials,
  fallback), Separator, Tabs, Breadcrumb.
- **Charts**: o `chart.tsx` instalado é apenas o wrapper de Recharts com
  config; mostro um line chart simples com mock data.

### Compostos

Ordem: forms → identidade → tabelas.

- `LoginForm` — montado fora do contexto do AuthProvider; o submit não vai
  funcionar mas o estado visual fica vivo (esse era o uso original).
- `AcceptInviteForm` — recebe props read-only (email, role, companyName)
  com mock; submit também é decorativo.
- `NavUser` — passa user mock (nome + email).
- `UsersTableView` — array fake com 3 usuários cobrindo: AGENT/ADMIN,
  com e sem departments, com `absenceActive=true`, `lastSeenAt` recente
  vs nulo. Estados `loading` e `error` também demonstrados (3 instâncias
  do componente, uma por estado).
- `InvitationsTableView` — array fake com convites em PENDING / ACCEPTED /
  REVOKED. Mesmo padrão: 3 instâncias por estado.

## 6. Refactor mínimo: split View + Container

**Aplicar em**: `components/users/users-table.tsx` e
`components/users/invitations-table.tsx`.

**Antes (monolítico):**

```tsx
export function UsersTable() {
  const query = useUsersControllerList(...);
  // render misturado com state da query
}
```

**Depois:**

```tsx
// components/users/users-table-view.tsx (NOVO — Server-Compatible, puro)
type UsersTableState = 'loading' | 'error' | 'ready';
type Props = {
  items: UserListItem[];
  state: UsersTableState;
};
export function UsersTableView({ items, state }: Props) {
  /* só render */
}

// components/users/users-table.tsx (CONTAINER fino — 'use client')
export function UsersTable() {
  const query = useUsersControllerList(
    { active: true, limit: 50 },
    {
      client: { client: apiClient },
    },
  );
  const state: UsersTableState = query.isPending ? 'loading' : query.isError ? 'error' : 'ready';
  return <UsersTableView items={query.data?.items ?? []} state={state} />;
}
```

**Ganhos:**

- Testabilidade do view em isolamento (sem mock de adapter axios).
- Showcase consome `UsersTableView` direto com array estático.
- API pública de `UsersTable` não muda → testes existentes
  (`users-table.test.tsx`, `invitations-table.test.tsx`) continuam verdes.

**Mesmo refactor em** `InvitationsTable` → `InvitationsTableView`. Tipos
de items derivam de `lib/generated/types/InvitationListResponseDto`.

## 7. Sidebar / RBAC

- **Adicionar item** "Design System" no grupo Configurações em
  `components/app-sidebar.tsx`. Ícone: `Palette` do `lucide-react`.
- **Posição**: subitem do collapsible Configurações, ordem alfabética
  ou ao final do grupo (decidir durante implementação observando o que
  fica menos quebrado visualmente).
- **RBAC**: nenhum código novo. O layout de `(app)/configuracoes/` já
  bloqueia não-admin com redirect 403 (PR #19); herdamos automaticamente.
  Sidebar já oculta o grupo Configurações inteiro pra não-admin (PR #19),
  então o link novo herda o gate visual também.

## 8. Out of scope (explícito)

- **Não decide tema final** (gap §4.8 ROADMAP "Tema final consolidado").
- **Não atualiza** `design-system.md` nem `app/globals.css`.
- **Não adiciona** Archivo / Inter / JetBrains Mono — o projeto usa Geist
  hoje. O drift fica documentado pelo banner, não corrigido.
- **Não adiciona** rotas públicas, mockups de telas inteiras (atendimentos,
  bot/fluxo), nem screenshots de áreas não construídas.
- **Sem testes E2E**.

## 9. Testes

- `users-table-view.test.tsx` (novo) — render dos 3 estados (`loading`,
  `error`, `ready`) com array fake. Asserts no DOM resultante.
- `invitations-table-view.test.tsx` (novo) — análogo.
- `users-table.test.tsx` e `invitations-table.test.tsx` (existentes) —
  permanecem como estão; verificar que continuam passando.
- `page.test.tsx` (do showcase) — smoke test que renderiza a page sem
  crash. Não validamos visual; isso é responsabilidade da inspeção
  manual.

Bibliotecas: vitest + @testing-library/react, padrão já estabelecido.

## 10. Verificação de fechamento

Critério de "pronto":

1. `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` verde.
2. `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` sem
   diff (não esperado mexer em OpenAPI, mas confirmamos).
3. Inspeção manual em `/configuracoes/design-system` (subitem de
   Configurações na sidebar, ícone `Palette`):
   - Tema light: todas as sections renderizam, TOC funciona, overlays abrem.
   - Tema dark (toggle no header): mesma checagem.
   - Login com usuário AGENT: rota redireciona pra 403 (herdado).
4. ROADMAP §4.8 atualizado: marcar item "Showcase `/design-system`" como
   feito.

## 11. Não-objetivos arquiteturais

- Não criar abstração de "showcase framework" reutilizável. As sections
  são arquivos-irmãos com responsabilidade única e simples; copy-paste
  entre elas é aceitável quando reduz acoplamento.
- Não introduzir lib nova (de syntax highlighter, de copy-to-clipboard
  com toast, etc). Se code samples forem mostrados, usar `<pre><code>`
  e Tailwind direto.
- Não generalizar `<Section>` além do mínimo (id + title + children +
  spacing). Se virar zoológico de props depois, é sinal de retornar.
