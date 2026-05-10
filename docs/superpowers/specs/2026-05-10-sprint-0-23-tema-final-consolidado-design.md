# Sprint 0.23 — Tema final consolidado

> **Repo:** `crm-web`
> **Branch sugerida:** `chore/sprint-0-23-tema-final`
> **Gap fechado:** ROADMAP §4.8 — "Sprint 0.23 — Tema final consolidado"
> **Pré-requisito:** Sprint 0.22 (Preferências) mergeada em `origin/main` — confirmado (`4996452` + `4c58379`).

## 1. Objetivo

Resolver a divergência entre o que o `design-system.md` descreve e o que o código realmente usa. Hoje o `app/globals.css` segue o baseline shadcn (zinc/neutral, oklch, fontes Geist), com três overrides Dreams Chat (`--primary`, `--ring`, `--sidebar-primary` apontando pro azul `#1b84ff`). O `design-system.md`, por outro lado, descreve um vocabulário "Dreams Chat" inteiro (`bg/base`, `text/primary`, `border/default`, fontes Archivo+Inter+JetBrains Mono) que **não existe** no código — usos reais desse vocabulário viram no-op silencioso (memory `feedback_real_tailwind_tokens.md`).

Esta sprint consolida o vocabulário **shadcn baseline** como único, ajusta a documentação pra refletir o estado real, e remove os 16 usos "fantasma" que renderizavam transparente/quebrado.

Fora de escopo (follow-ups explícitos):

- Bug em `app/layout.tsx:22` (falta de espaço antes de `'dark'` no template-literal do `<html className>`, gerando classe da fonte mono corrompida no SSR; mascarado pelo `useEffect` do `ThemeProvider`).
- `#1B84FF` hardcoded em `tag-dialog.tsx`/`tags-table-view.tsx` (cor é entidade do banco — Tag tem hex próprio do usuário; default poderia vir do token primary, mas é trabalho de domínio).
- Adoção de tokens status (success/warning/danger) além do `--destructive` do baseline — só quando aparecer uso concreto.
- Trocar Geist por Archivo+Inter+JetBrains — descartado (mantém pragmatismo da Opção C; Geist tem identidade tipográfica boa, peso de página menor).

## 2. Decisões alinhadas

1. **Opção C — vocabulário único shadcn baseline.** `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `bg-muted`, `bg-popover`, `bg-sidebar`, `bg-primary`, `bg-destructive`, `bg-accent` (+ foregrounds correspondentes). Os tokens "Dreams Chat" descritos em `design-system.md` deixam de ser pretendidos no código — a doc passa a tratá-los como **nomes do Figma**, com tabela de mapeamento Figma↔CSS.
2. **Paleta primary preservada.** `--primary` (`#1b84ff`), `--ring` (`#1b84ff`), `--sidebar-primary` (`#1b84ff`) e a escala `--color-primary-50..950` continuam expostas via `@theme inline`. Uso típico: links (`text-primary`), botões primários, badges, sidebar item ativo, charts.
3. **Tipografia: Geist mantida.** `GeistSans.variable` + `GeistMono.variable` via package `geist`, expostas em `globals.css` como `--font-sans` e `--font-mono`. Sem `font-ui` separado (que exigiria classe Tailwind nova só pra Inter — e não há uso real).
4. **Auditoria visual em light + dark** das 11 telas críticas + 13 placeholders (cobertura via `placeholder-page.tsx` único). Em cada uma: legibilidade, bordas, hover/focus, foco visível em inputs/botões.
5. **Showcase `/configuracoes/design-system` é a fonte da verdade visual.** Atualizado nesta sprint pra catalogar **só** o que existe (11 tokens semantic + escala primary + Geist sans/mono).
6. **Memory `feedback_real_tailwind_tokens.md` removida.** Problema resolvido — vocabulário consolidado, ghost-tokens deletados.
7. **`pnpm build` continua fora do gate local** (CLAUDE.md §11). Verificação local: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`. CI roda build.

## 3. Tradução determinística dos 16 ghost-tokens

Mapeamento 1:1, sem ambiguidade:

| Ghost (Dreams Chat)                              | shadcn baseline         | Razão                                                                         |
| ------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------- |
| `text-text-primary`                              | `text-foreground`       | "Texto principal" — `--foreground` é o pareado canônico de `--background`.    |
| `text-text-secondary`                            | `text-muted-foreground` | "Texto secundário/preview" — `--muted-foreground` cobre o caso.               |
| `bg-bg-base`                                     | `bg-background`         | "Fundo principal" — pareado de `--foreground`.                                |
| `bg-bg-muted/50`                                 | `bg-muted/50`           | "Hover background / placeholder shimmer" — token equivalente.                 |
| `border-border-default`                          | `border-border`         | "Borda padrão" — token padrão do baseline.                                    |
| `bg-bg-subtle` (1 uso, sidebar do `loading.tsx`) | **`bg-sidebar`**        | Skeleton da sidebar — alinhar com `<AppSidebar>` real (que usa `bg-sidebar`). |

Localizações concretas (linhas atuais — podem variar após edits, mas a substituição é grep-friendly):

- [app/(app)/error.tsx:20-21](<app/(app)/error.tsx#L20-L21>) — `text-text-primary` → `text-foreground`; `text-text-secondary` → `text-muted-foreground`.
- [components/layout/placeholder-page.tsx:5-6](components/layout/placeholder-page.tsx#L5-L6) — idem (cobre as 13 placeholders pós-login).
- [app/(app)/configuracoes/tags/page.tsx:12-13](<app/(app)/configuracoes/tags/page.tsx#L12-L13>) — idem.
- [app/(app)/configuracoes/quick-replies/page.tsx:12-13](<app/(app)/configuracoes/quick-replies/page.tsx#L12-L13>) — idem.
- [app/(app)/configuracoes/departamentos/page.tsx:12-13](<app/(app)/configuracoes/departamentos/page.tsx#L12-L13>) — idem.
- [app/(app)/configuracoes/usuarios/page.tsx:14-15](<app/(app)/configuracoes/usuarios/page.tsx#L14-L15>) — idem.
- [app/(app)/loading.tsx:3-7](<app/(app)/loading.tsx#L3-L7>) — `bg-bg-base` → `bg-background`; `bg-bg-subtle` → `bg-sidebar`; `border-border-default` → `border-border`; `bg-bg-muted/50` → `bg-muted/50`.

Os outros nomes-fantasma documentados no `design-system.md` (`text-text-muted`, `text-text-inverse`, `text-text-link`, `bg-bg-inverse`, `border-border-muted`, `border-border-strong`) não têm uso atual no código — o smoke check final em §13 cobre todos defensivamente.

Smoke check pós-edit: `rg 'bg-bg-base|bg-bg-subtle|bg-bg-muted|bg-bg-inverse|text-text-primary|text-text-secondary|text-text-muted|text-text-inverse|text-text-link|border-border-default|border-border-muted|border-border-strong'` deve retornar zero hits no projeto inteiro (excluindo `docs/` e arquivos histórico de spec).

## 4. Atualizações em `app/globals.css`

Sem mudanças nos `--color-*`. Atualizar **apenas** o comentário do header (linhas 7-16) pra deixar explícito que:

- Vocabulário canônico = shadcn baseline (style new-york, base zinc/neutral, radius 0.625rem, fontes Geist Sans/Mono).
- Brand DigiChat aplicada em três pontos: `--primary`, `--ring`, `--sidebar-primary` apontando pro azul Dreams Chat (`#1b84ff`).
- Escala `--color-primary-50..950` exposta para badges, charts, accents e elementos custom da marca.
- Modo escuro: classe `.dark` (oklch invertido, mesmas variáveis brand).

## 5. `app/layout.tsx`

Sem mudanças nesta sprint (Geist mantido). Bug do espaço em branco antes de `'dark'` registrado como follow-up fora de escopo.

## 6. Atualizações em `design-system.md` (raiz)

Reescrita parcial — preservar a maior parte do conteúdo (paleta, espaçamento, radius, sizes, sombras, anatomia de componentes, estados, densidade, responsividade). Mudanças cirúrgicas:

### 6.1 Adicionar nota de mapeamento Figma↔CSS no topo da seção "Cores"

> **Nota:** Os tokens listados aqui são os **nomes do Figma** (collection `DigiChat Tokens`). No código (`app/globals.css` + Tailwind 4 `@theme inline`), o vocabulário canônico é o **shadcn baseline**. A tabela abaixo mapeia ambos.

Tabela canônica de equivalência:

| Figma (`color/semantic/*`) | Tailwind class (shadcn baseline)                         | CSS var                 |
| -------------------------- | -------------------------------------------------------- | ----------------------- |
| `text-primary`             | `text-foreground`                                        | `--foreground`          |
| `text-secondary`           | `text-muted-foreground`                                  | `--muted-foreground`    |
| `text-muted`               | `text-muted-foreground`                                  | `--muted-foreground`    |
| `text-inverse`             | `text-primary-foreground`                                | `--primary-foreground`  |
| `text-link`                | `text-primary`                                           | `--primary`             |
| `bg-base`                  | `bg-background`                                          | `--background`          |
| `bg-subtle`                | `bg-sidebar` (sidebar) / `bg-muted` (áreas sutis)        | `--sidebar` / `--muted` |
| `bg-muted`                 | `bg-muted`                                               | `--muted`               |
| `bg-inverse`               | `bg-foreground`                                          | `--foreground`          |
| `border-default`           | `border-border`                                          | `--border`              |
| `border-muted`             | `border-border/50` (alpha 50%)                           | `--border`              |
| `border-strong`            | `border-border` (sem token dedicado no baseline)         | `--border`              |
| `shadow-card-key`          | `shadow-sm` / `shadow` / `shadow-md` (Tailwind defaults) | —                       |

A escala `color/primary/50..950` é exposta no código como `--color-primary-50..950` e usável via `bg-primary-500`, `text-primary-600`, etc. Os nomes de status (success/warning/danger) só ganham token Tailwind quando aparecer uso real — hoje só `--destructive` está consolidado.

### 6.2 Reescrever §Tipografia

Substituir Archivo/Inter/JetBrains Mono por:

| Token       | Família        | Pacote            | Variável CSS                          |
| ----------- | -------------- | ----------------- | ------------------------------------- |
| `font-sans` | **Geist Sans** | `geist/font/sans` | `--font-sans` (= `--font-geist-sans`) |
| `font-mono` | **Geist Mono** | `geist/font/mono` | `--font-mono` (= `--font-geist-mono`) |

Manter as tabelas de tamanhos, pesos e line-heights — são genéricas, não dependem da família. Remover qualquer menção a uma terceira família "ui" (Inter): tabs e botões usam `font-sans` (Geist) por consistência. Remover "Razão da distinção sans vs ui" — não se aplica.

Atualizar §Referências externas pra remover Archivo/Inter/JetBrains do bullet "Fontes" e listar Geist (https://vercel.com/font).

### 6.3 §"Como exportar tokens pra código"

Reescrever pra refletir o fluxo real:

1. Tokens semantic do Figma → mapeados pra variáveis CSS shadcn em `:root`/`.dark` (`--background`, `--foreground`, `--border`, etc).
2. `@theme inline {}` expõe essas vars como classes Tailwind (`bg-background`, `text-foreground`, etc).
3. Brand-specific (escala primary 50..950) entra direto no `@theme inline` como `--color-primary-*`.
4. Sincronização Figma↔código fica responsabilidade do mantenedor; sem automação no MVP.

### 6.4 Componentes (§"Card de ticket", §"Tabs", §"Botões", §"Inputs")

Manter os specs visuais (alturas, paddings, sizes), mas atualizar referências de token pra usar a coluna "Tailwind class" da tabela em §6.1 (ex.: "Background: `color/semantic/bg-base`" → "Background: `bg-background` (Figma `color/semantic/bg-base`)").

### 6.5 Nota no topo do arquivo

Atualizar o cabeçalho:

> **Versão:** 3 (vocabulário canônico = shadcn baseline; Figma mantém os nomes Dreams Chat com tabela de equivalência)
> **Última atualização:** 10/05/2026

## 7. Atualizações em `components/CLAUDE.md`

Dois pontos:

### 7.1 Exemplo do `TicketCard` (linhas ~30-55 do arquivo)

```diff
-        'bg-bg-base shadow-card cursor-pointer rounded-md p-5 transition-shadow',
+        'bg-card shadow-sm cursor-pointer rounded-md p-5 transition-shadow',
         'hover:shadow-md',
-        isSelected && 'bg-primary-50 dark:bg-primary-900/30',
+        isSelected && 'bg-primary/10',
         isPinned && 'border-primary-500 border-l-2',
```

(`bg-card` é o token canônico para superfícies de card; `bg-primary/10` é o equivalente de "tinta primary leve" sem precisar de escala explícita.)

### 7.2 §Tema light/dark

```diff
-// ❌ ERRADO — cores hardcoded
-<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
+// ❌ ERRADO — cores hardcoded
+<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">

-// ✅ CORRETO — tokens semânticos via Tailwind 4
-<div className="bg-bg-base text-text-primary">
+// ✅ CORRETO — tokens semânticos via Tailwind 4 (shadcn baseline)
+<div className="bg-background text-foreground">
```

Atualizar lista de tokens canônicos: "`bg-background`, `bg-card`, `bg-muted`, `bg-popover`, `bg-sidebar`, `bg-primary`, `bg-destructive`, `bg-accent` + foregrounds correspondentes; bordas via `border-border`."

## 8. Atualizações em `app/CLAUDE.md`

§"Layouts aninhados" usa `bg-bg-subtle` e `bg-bg-base` no exemplo. Atualizar:

```diff
-    <div className="bg-bg-subtle flex h-screen">
+    <div className="bg-sidebar flex h-screen">
       <Sidebar />
       <div className="flex flex-1 flex-col">
         <Header />
-        <main className="bg-bg-base flex-1 overflow-auto">{children}</main>
+        <main className="bg-background flex-1 overflow-auto">{children}</main>
       </div>
     </div>
```

Manter o resto inalterado.

## 9. Atualizações no showcase `/configuracoes/design-system`

### 9.1 `_sections/tokens-colors.tsx`

Catalogar **só** os tokens que existem no código. Estrutura sugerida:

- **Semantic (par bg/foreground):** `background`/`foreground`, `card`/`card-foreground`, `popover`/`popover-foreground`, `sidebar`/`sidebar-foreground`, `primary`/`primary-foreground`, `secondary`/`secondary-foreground`, `muted`/`muted-foreground`, `accent`/`accent-foreground`, `destructive`/`destructive-foreground`.
- **Bordas/inputs:** `border`, `input`, `ring`.
- **Brand primary scale:** swatches de `primary-50` a `primary-950`.
- **Charts:** `chart-1..5`.

Cada swatch mostra: nome da classe Tailwind, nome da CSS var, hex/oklch resolvido.

Remover qualquer descrição de tokens "Dreams Chat" (`bg-bg-base`, etc.) que ainda esteja documentada como token vivo do código — ou mover pra uma seção "Mapeamento Figma → código" que use a tabela de §6.1.

### 9.2 `_sections/tokens-typography.tsx`

Refletir Geist Sans / Geist Mono. Mostrar:

- Família `font-sans` (Geist Sans) com pangrama em pesos 400/500/600/700.
- Família `font-mono` (Geist Mono) com pangrama em peso 400.
- Escala de tamanhos (xs..4xl) e line-heights (tight/snug/normal/relaxed).

Remover qualquer menção a Archivo/Inter/JetBrains se houver.

### 9.3 `page.tsx`

Sem mudanças estruturais. Atualizar apenas o subtítulo se mencionar "tokens Dreams Chat" — hoje diz "Catálogo descritivo dos tokens, primitivos shadcn e compostos do projeto" (já neutro).

## 10. `ARCHITECTURE.md`

Verificar (e ajustar se houver) menções a fontes Archivo/Inter ou tokens "Dreams Chat" como se fossem o estado vigente. Se houver, alinhar com a Opção C + Geist desta sprint.

## 11. Memory `feedback_real_tailwind_tokens.md`

Remover:

1. Excluir o arquivo `~/.claude/projects/-home-rodrigo-digigov-dev-space-digigov-digichat-crm-web/memory/feedback_real_tailwind_tokens.md`.
2. Remover a entrada correspondente no `MEMORY.md` (linha que aponta pro arquivo).

Razão: ghost-tokens deletados em código + design-system.md atualizado deixam o problema sem como ressurgir. Manter a memory vira ruído.

## 12. Auditoria visual

Após as edições, com `pnpm dev` rodando, percorrer **manualmente** em light + dark (alternar via `theme-toggle`):

| #   | Rota                                                            | O que validar                                                     |
| --- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `/login`                                                        | Form, erro de credencial                                          |
| 2   | `/aceitar-convite/[token]`                                      | Form do convite (estado válido + estado inválido)                 |
| 3   | App shell (qualquer rota pós-login)                             | Sidebar, header, drawer mobile (Cmd/Ctrl+B), toggle de tema       |
| 4   | `/configuracoes/design-system`                                  | Showcase 100% funcional, swatches batendo com globals.css         |
| 5   | `/configuracoes/departamentos`                                  | Lista, dialog create/edit, alert delete                           |
| 6   | `/configuracoes/tags`                                           | Lista, dialog create/edit, picker de cor, alert delete            |
| 7   | `/configuracoes/respostas-rapidas`                              | Lista, dialog create/edit, alert delete                           |
| 8   | `/configuracoes/usuarios`                                       | Tabs Usuários/Convites, UserDialog, modais Desativar/Force-logout |
| 9   | `/configuracoes/preferencias`                                   | Footer sticky (bug 0.22 deve estar corrigido após esta sprint)    |
| 10  | `/configuracoes/canais`                                         | Placeholder (após fix do `placeholder-page.tsx`)                  |
| 11  | `/configuracoes/integracoes`                                    | Idem                                                              |
| 12  | 11 placeholders restantes (atendimentos, contatos, fluxos, etc) | Idem (cobertura via `placeholder-page.tsx`)                       |

Critérios por tela:

- Texto legível em ambos os modos (sem `text-text-primary` no-op).
- Bordas/divisores visíveis.
- Hover/focus mantidos (cards, botões, links).
- Foco visível em inputs e botões via teclado (ring azul DigiChat).
- Botões primários/secundários/destrutivos com contraste suficiente (WCAG AA).
- Loading state da app (`/configuracoes/*` → trigger via `pnpm dev` durante navegação) renderizando esqueleto correto.
- Error boundary (`/(app)/error.tsx` — disparar via erro temporário) renderizando texto legível.

## 13. Verificação local

```
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

`pnpm build` na CI (CLAUDE.md §11).

Smoke extra: `rg 'bg-bg-base|bg-bg-subtle|bg-bg-muted|text-text-primary|text-text-secondary|text-text-muted|border-border-default|border-border-muted|border-border-strong'` retorna **zero hits** em todo o projeto (excluindo `docs/` se ainda houver alguma referência histórica de spec).

## 14. Branch + PR

1. Atualizar `main` local (`git fetch origin && git checkout main && git pull --ff-only`).
2. Criar branch `chore/sprint-0-23-tema-final` (worktree isolado via `superpowers:using-git-worktrees`).
3. Implementar via `superpowers:executing-plans` com checkpoints de code review.
4. Verificação final via `superpowers:verification-before-completion`.
5. Push + PR via `gh CLI` quando o usuário confirmar — não fazer push prematuro (memory `feedback_no_push_until_validated.md`).
6. PR title: `chore(theme): consolida vocabulário shadcn baseline (Sprint 0.23)`.
7. Após merge: ROADMAP.md update em PR docs separado (`docs/update-roadmap-0-23`) marcando §4.8 Sprint 0.23 como entregue, e remoção da memory.

## 15. Riscos e mitigação

| Risco                                                                                 | Mitigação                                                                                                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Regressão visual em telas que dependiam do "no-op" silencioso pra cair em fallback ok | Auditoria visual em todas as 24 telas (11 críticas + 13 placeholders). Se algo ficar feio, ajustar token antes de PR. |
| Showcase `/configuracoes/design-system` ficar inconsistente com globals.css           | Showcase é a "fonte da verdade visual" — atualização explicitamente listada em §9.                                    |
| Memory removida sem o problema estar realmente resolvido                              | Smoke `rg` (§13) garante zero ghost-tokens. Memory só é removida após verificação.                                    |
| Foot-gun em sprints futuras (alguém escrevendo `bg-bg-base`)                          | `components/CLAUDE.md` + `app/CLAUDE.md` atualizados; design-system.md tem tabela explícita Figma↔CSS.                |

## 16. Checklist de entrega

- [ ] 16 ghost-tokens substituídos em 7 arquivos
- [ ] Smoke `rg` retorna zero hits
- [ ] `app/globals.css` header atualizado
- [ ] `design-system.md` v3 publicada (tabela Figma↔CSS, Tipografia Geist, mapeamento revisado)
- [ ] `components/CLAUDE.md` atualizado (TicketCard exemplo + §Tema light/dark)
- [ ] `app/CLAUDE.md` atualizado (§Layouts aninhados)
- [ ] `ARCHITECTURE.md` revisado (ajustar se mencionar Archivo/Inter)
- [ ] Showcase `tokens-colors.tsx` + `tokens-typography.tsx` atualizados
- [ ] Auditoria visual em light + dark concluída em todas as 24 telas
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verde
- [ ] Memory `feedback_real_tailwind_tokens.md` removida (arquivo + entrada no `MEMORY.md`)
- [ ] PR aberto e CI verde (build na CI)
- [ ] ROADMAP.md §4.8 Sprint 0.23 marcada como entregue (PR docs separado pós-merge)
