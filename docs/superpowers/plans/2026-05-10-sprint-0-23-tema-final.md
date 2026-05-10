# Sprint 0.23 — Tema final consolidado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar o vocabulário Tailwind shadcn baseline como único no `crm-web`, removendo os 16 usos de tokens "Dreams Chat" fantasma e alinhando docs ao estado real (Geist Sans/Mono + paleta primary `#1b84ff`).

**Architecture:** Refactor visual + atualização de documentação. Sem mudança em runtime/lógica de negócio. Substituições mecânicas em 7 arquivos de código (`text-text-primary` → `text-foreground`, `bg-bg-base` → `bg-background`, etc), reescrita parcial do `design-system.md` (versão 3, com tabela Figma↔CSS), ajustes em `app/CLAUDE.md`/`components/CLAUDE.md`/`ARCHITECTURE.md`, validação via smoke `rg` + suíte existente + auditoria visual em light/dark, remoção da memory `feedback_real_tailwind_tokens.md`.

**Tech Stack:** Next.js 16 App Router, Tailwind 4 (CSS-first via `@theme inline`), shadcn/ui (baseline new-york), Geist Sans/Mono (`geist` package), Vitest + RTL. Branch: `chore/sprint-0-23-tema-final` (já criada a partir de `origin/main`; spec já commitado em `48ce811`).

**Spec:** [docs/superpowers/specs/2026-05-10-sprint-0-23-tema-final-consolidado-design.md](../specs/2026-05-10-sprint-0-23-tema-final-consolidado-design.md)

---

## Task 1: Smoke check inicial — baseline de 16 ghost-tokens

**Files:** nenhum — só leitura.

- [ ] **Step 1: Rodar grep e capturar baseline**

Run:

```bash
rg -n 'bg-bg-base|bg-bg-subtle|bg-bg-muted|bg-bg-inverse|text-text-primary|text-text-secondary|text-text-muted|text-text-inverse|text-text-link|border-border-default|border-border-muted|border-border-strong' app/ components/
```

Expected: exatamente 16 hits distribuídos em 7 arquivos:

- `app/(app)/error.tsx` (2)
- `components/layout/placeholder-page.tsx` (2)
- `app/(app)/loading.tsx` (4)
- `app/(app)/configuracoes/tags/page.tsx` (2)
- `app/(app)/configuracoes/quick-replies/page.tsx` (2)
- `app/(app)/configuracoes/departamentos/page.tsx` (2)
- `app/(app)/configuracoes/usuarios/page.tsx` (2)

Se a contagem divergir do esperado, parar e investigar.

---

## Task 2: Substituir ghost-tokens em `app/(app)/error.tsx`

**Files:**

- Modify: `app/(app)/error.tsx:20-21`

- [ ] **Step 1: Aplicar Edit em `app/(app)/error.tsx`**

Substituir:

```tsx
        <h2 className="text-text-primary text-xl font-semibold">Algo deu errado</h2>
        <p className="text-text-secondary text-sm">
```

Por:

```tsx
        <h2 className="text-foreground text-xl font-semibold">Algo deu errado</h2>
        <p className="text-muted-foreground text-sm">
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' app/\(app\)/error.tsx`
Expected: nenhuma saída.

---

## Task 3: Substituir ghost-tokens em `components/layout/placeholder-page.tsx`

**Files:**

- Modify: `components/layout/placeholder-page.tsx:5-6`

- [ ] **Step 1: Aplicar Edit em `placeholder-page.tsx`**

Substituir:

```tsx
        <h2 className="text-text-primary mb-2 text-2xl font-semibold">{title}</h2>
        <p className="text-text-secondary text-sm">Em breve.</p>
```

Por:

```tsx
        <h2 className="text-foreground mb-2 text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">Em breve.</p>
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' components/layout/placeholder-page.tsx`
Expected: nenhuma saída.

---

## Task 4: Substituir ghost-tokens em `app/(app)/loading.tsx`

**Files:**

- Modify: `app/(app)/loading.tsx:3-7`

- [ ] **Step 1: Aplicar Edit em `loading.tsx`**

Substituir o bloco completo do componente (linhas 1-11 atuais):

```tsx
export default function AppLoading() {
  return (
    <div className="bg-bg-base flex h-screen overflow-hidden">
      <div className="bg-bg-subtle border-border-default hidden w-60 border-r md:block" />
      <div className="flex flex-1 flex-col">
        <div className="bg-bg-base border-border-default h-14 border-b" />
        <div className="bg-bg-muted/50 flex-1 animate-pulse" />
      </div>
    </div>
  );
}
```

Por:

```tsx
export default function AppLoading() {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <div className="bg-sidebar border-border hidden w-60 border-r md:block" />
      <div className="flex flex-1 flex-col">
        <div className="bg-background border-border h-14 border-b" />
        <div className="bg-muted/50 flex-1 animate-pulse" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' app/\(app\)/loading.tsx`
Expected: nenhuma saída.

---

## Task 5: Substituir ghost-tokens em `app/(app)/configuracoes/tags/page.tsx`

**Files:**

- Modify: `app/(app)/configuracoes/tags/page.tsx:12-13`

- [ ] **Step 1: Aplicar Edit**

Substituir:

```tsx
          <h1 className="text-text-primary text-2xl font-semibold">Tags</h1>
          <p className="text-text-secondary text-sm">
```

Por:

```tsx
          <h1 className="text-foreground text-2xl font-semibold">Tags</h1>
          <p className="text-muted-foreground text-sm">
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' app/\(app\)/configuracoes/tags/page.tsx`
Expected: nenhuma saída.

---

## Task 6: Substituir ghost-tokens em `app/(app)/configuracoes/quick-replies/page.tsx`

**Files:**

- Modify: `app/(app)/configuracoes/quick-replies/page.tsx:12-13`

- [ ] **Step 1: Aplicar Edit**

Substituir:

```tsx
          <h1 className="text-text-primary text-2xl font-semibold">Quick Replies</h1>
          <p className="text-text-secondary text-sm">
```

Por:

```tsx
          <h1 className="text-foreground text-2xl font-semibold">Quick Replies</h1>
          <p className="text-muted-foreground text-sm">
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' app/\(app\)/configuracoes/quick-replies/page.tsx`
Expected: nenhuma saída.

---

## Task 7: Substituir ghost-tokens em `app/(app)/configuracoes/departamentos/page.tsx`

**Files:**

- Modify: `app/(app)/configuracoes/departamentos/page.tsx:12-13`

- [ ] **Step 1: Aplicar Edit**

Substituir:

```tsx
          <h1 className="text-text-primary text-2xl font-semibold">Departamentos</h1>
          <p className="text-text-secondary text-sm">
```

Por:

```tsx
          <h1 className="text-foreground text-2xl font-semibold">Departamentos</h1>
          <p className="text-muted-foreground text-sm">
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' app/\(app\)/configuracoes/departamentos/page.tsx`
Expected: nenhuma saída.

---

## Task 8: Substituir ghost-tokens em `app/(app)/configuracoes/usuarios/page.tsx`

**Files:**

- Modify: `app/(app)/configuracoes/usuarios/page.tsx:14-15`

- [ ] **Step 1: Aplicar Edit**

Substituir:

```tsx
          <h1 className="text-text-primary text-2xl font-semibold">Usuários</h1>
          <p className="text-text-secondary text-sm">Gerencie usuários e convites do tenant.</p>
```

Por:

```tsx
          <h1 className="text-foreground text-2xl font-semibold">Usuários</h1>
          <p className="text-muted-foreground text-sm">Gerencie usuários e convites do tenant.</p>
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' app/\(app\)/configuracoes/usuarios/page.tsx`
Expected: nenhuma saída.

---

## Task 9: Smoke check global + suíte existente

**Files:** nenhum.

- [ ] **Step 1: Smoke check global pós-substituições**

Run:

```bash
rg -n 'bg-bg-base|bg-bg-subtle|bg-bg-muted|bg-bg-inverse|text-text-primary|text-text-secondary|text-text-muted|text-text-inverse|text-text-link|border-border-default|border-border-muted|border-border-strong' app/ components/
```

Expected: zero saída (zero hits).

- [ ] **Step 2: Rodar suíte de testes**

Run: `pnpm test`
Expected: todos os testes passam (mesmo número de testes que antes da sprint; nenhum quebra por mudança de className).

Se algum teste quebrar por verificar className textual de ghost-token, ajustar o teste pra esperar o token shadcn baseline correspondente — esse é o "teste ficou desatualizado", não a regressão.

- [ ] **Step 3: Commit das substituições**

Run:

```bash
git add app/\(app\)/error.tsx components/layout/placeholder-page.tsx app/\(app\)/loading.tsx app/\(app\)/configuracoes/tags/page.tsx app/\(app\)/configuracoes/quick-replies/page.tsx app/\(app\)/configuracoes/departamentos/page.tsx app/\(app\)/configuracoes/usuarios/page.tsx
git commit -m "$(cat <<'EOF'
refactor(theme): substitui ghost-tokens por shadcn baseline em UI

7 arquivos da app (error, loading, placeholder, 4 telas de configuracoes)
trocavam classes de design-system.md (text-text-primary, bg-bg-base, etc)
que sempre foram no-op no Tailwind 4 (nao existem em @theme inline).
Vocabulario canonico = shadcn baseline (text-foreground, bg-background,
border-border, bg-sidebar, bg-muted).
EOF
)"
```

Expected: commit cria sem erro de hook (lefthook formata via prettier — esperado).

---

## Task 10: Atualizar comentário do header em `app/globals.css`

**Files:**

- Modify: `app/globals.css:7-16`

- [ ] **Step 1: Aplicar Edit no comentário do header**

Substituir:

```css
/**
 * DigiChat — globals.css
 *
 * Base: tema default do shadcn/ui (style new-york, base zinc/neutral, radius 0.625rem,
 * fontes Geist Sans/Mono). Toda a paleta semântica e os arredondamentos seguem o preset
 * canônico. Exceção DigiChat: `--primary` (e variantes sidebar/ring) usam o azul Dreams
 * Chat (#1b84ff).
 *
 * Atualizado em: 07/05/2026
 */
```

Por:

```css
/**
 * DigiChat — globals.css
 *
 * Vocabulário canônico = shadcn baseline (style new-york, base zinc/neutral,
 * radius 0.625rem, fontes Geist Sans/Mono). Use os tokens semantic shadcn
 * direto: bg-background, text-foreground, text-muted-foreground, border-border,
 * bg-card, bg-muted, bg-popover, bg-sidebar, bg-primary, bg-destructive,
 * bg-accent (+ foregrounds correspondentes).
 *
 * Brand DigiChat aplicada em três variáveis: --primary, --ring e
 * --sidebar-primary apontam pro azul Dreams Chat (#1b84ff). A escala completa
 * --color-primary-50..950 é exposta via @theme inline para badges, charts e
 * accents da marca.
 *
 * Modo escuro: classe `.dark` (oklch invertido, mesmas variáveis brand).
 *
 * Atualizado em: 10/05/2026
 */
```

- [ ] **Step 2: Commit**

Run:

```bash
git add app/globals.css
git commit -m "$(cat <<'EOF'
chore(theme): atualiza header comment de globals.css

Documenta o vocabulario canonico (shadcn baseline) e onde a brand DigiChat
e aplicada (--primary, --ring, --sidebar-primary + escala 50..950).
EOF
)"
```

---

## Task 11: Atualizar `design-system.md` (versão 3)

**Files:**

- Modify: `design-system.md` (vários trechos)

- [ ] **Step 1: Atualizar header (versão 3)**

Substituir:

```markdown
# Design System — DigiChat

> **Versão:** 2 (tokens Dreams Chat + Variables sincronizadas com Figma)
> **Última atualização:** 06/05/2026
>
> Identidade visual e tokens da plataforma. Espelha o que está no Figma (collection `DigiChat Tokens`).
```

Por:

```markdown
# Design System — DigiChat

> **Versão:** 3 (vocabulário canônico = shadcn baseline; Figma mantém os nomes Dreams Chat com tabela de equivalência)
> **Última atualização:** 10/05/2026
>
> Identidade visual e tokens da plataforma. Os nomes documentados aqui são os do **Figma** (collection `DigiChat Tokens`); no código, o vocabulário canônico é o **shadcn baseline**. A tabela de equivalência fica em §Cores → "Mapeamento Figma ↔ código".
```

- [ ] **Step 2: Adicionar nota Figma↔CSS no topo da seção "Cores"**

Substituir:

```markdown
## Cores

### Primary (azul vibrante)
```

Por:

```markdown
## Cores

> **Nota:** os tokens listados nesta seção são **nomes do Figma** (collection `DigiChat Tokens`). No código (`app/globals.css` + Tailwind 4 `@theme inline`), o vocabulário canônico é o **shadcn baseline** (`bg-background`, `text-foreground`, `border-border`, etc.). A tabela "Mapeamento Figma ↔ código" no fim desta seção documenta a equivalência 1:1.

### Primary (azul vibrante)
```

- [ ] **Step 3: Adicionar tabela "Mapeamento Figma ↔ código" antes da seção `---` que separa Cores de Tipografia**

Substituir (a linha `---` que vem logo após a seção §Status do bloco "Info"):

```markdown
**Info:**
| Token | Hex |
|---|---|
| `color/status/info/500` | `#1b84ff` (alias do primary/500) |

---

## Tipografia
```

Por:

```markdown
**Info:**
| Token | Hex |
|---|---|
| `color/status/info/500` | `#1b84ff` (alias do primary/500) |

### Mapeamento Figma ↔ código

Tabela canônica: nome do Figma à esquerda, classe Tailwind real (shadcn baseline) à direita.

| Figma                            | Tailwind class                                                                | CSS var                   |
| -------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| `color/semantic/text-primary`    | `text-foreground`                                                             | `--foreground`            |
| `color/semantic/text-secondary`  | `text-muted-foreground`                                                       | `--muted-foreground`      |
| `color/semantic/text-muted`      | `text-muted-foreground`                                                       | `--muted-foreground`      |
| `color/semantic/text-inverse`    | `text-primary-foreground`                                                     | `--primary-foreground`    |
| `color/semantic/text-link`       | `text-primary`                                                                | `--primary`               |
| `color/semantic/bg-base`         | `bg-background`                                                               | `--background`            |
| `color/semantic/bg-subtle`       | `bg-sidebar` (sidebar) / `bg-muted` (áreas sutis)                             | `--sidebar` / `--muted`   |
| `color/semantic/bg-muted`        | `bg-muted`                                                                    | `--muted`                 |
| `color/semantic/bg-inverse`      | `bg-foreground`                                                               | `--foreground`            |
| `color/semantic/border-default`  | `border-border`                                                               | `--border`                |
| `color/semantic/border-muted`    | `border-border/50` (alpha)                                                    | `--border`                |
| `color/semantic/border-strong`   | `border-border` (sem token dedicado no baseline)                              | `--border`                |
| `color/semantic/shadow-card-key` | `shadow-sm` / `shadow` / `shadow-md` (defaults)                               | —                         |
| `color/primary/500`              | `bg-primary` / `text-primary` / `ring-primary`                                | `--primary` (`#1b84ff`)   |
| `color/primary/50..950`          | `bg-primary-50..950` (escala exposta)                                         | `--color-primary-50..950` |
| `color/status/danger/500`        | `bg-destructive` / `text-destructive`                                         | `--destructive`           |
| `color/status/success/500`       | (sem token shadcn — usar hex inline ou `bg-emerald-500` quando aparecer caso) | —                         |
| `color/status/warning/500`       | (sem token shadcn — usar hex inline ou `bg-amber-500` quando aparecer caso)   | —                         |

A escala `color/primary/50..950` é exposta no Tailwind via `@theme inline { --color-primary-50..950 }` em `app/globals.css`. Status (success/warning) só ganham token Tailwind dedicado quando aparecer uso concreto — hoje só `--destructive` está consolidado.

---

## Tipografia
```

- [ ] **Step 4: Reescrever §Tipografia "Famílias"**

Substituir:

```markdown
### Famílias

Duas fontes diferentes para criar contraste visual entre conteúdo e ações:

| Token                    | Família            | Uso                                                   |
| ------------------------ | ------------------ | ----------------------------------------------------- |
| `typography/family/sans` | **Archivo**        | Texto comum (nomes, mensagens, headings)              |
| `typography/family/ui`   | **Inter**          | Tabs, botões de ação primária (contraste com Archivo) |
| `typography/family/mono` | **JetBrains Mono** | Código, IDs, valores técnicos                         |

**Razão da distinção sans vs ui:** Archivo é amigável e densa, ideal pra conteúdo conversacional. Inter é mais "executiva" e reforça hierarquia em elementos de ação. Padrão importado do Dreams Chat.
```

Por:

```markdown
### Famílias

Estado atual: **Geist** (Vercel Sans + Vercel Mono). Uma família unificada cobre conteúdo e ações — sem distinção `sans` vs `ui`.

| Token                    | Família        | Pacote            | CSS var                               |
| ------------------------ | -------------- | ----------------- | ------------------------------------- |
| `typography/family/sans` | **Geist Sans** | `geist/font/sans` | `--font-sans` (= `--font-geist-sans`) |
| `typography/family/mono` | **Geist Mono** | `geist/font/mono` | `--font-mono` (= `--font-geist-mono`) |

Aplicado em `app/layout.tsx` via `next/font` (sem CDN). Tabs, botões e demais elementos de UI usam `font-sans` por consistência. Geist tem identidade tipográfica boa, peso de página menor (já vem otimizado), e simplifica o stack vs três famílias separadas.
```

- [ ] **Step 5: Atualizar §Tabs e §Botões para usar `font-sans`**

Substituir:

```markdown
### Tabs (header da lista)

- Família: `typography/family/ui` (Inter)
```

Por:

```markdown
### Tabs (header da lista)

- Família: `typography/family/sans` (Geist Sans)
```

E substituir:

```markdown
### Botões de ação primária

- Família: `typography/family/ui` (Inter)
```

Por:

```markdown
### Botões de ação primária

- Família: `typography/family/sans` (Geist Sans)
```

- [ ] **Step 6: Reescrever §"Como exportar tokens pra código"**

Substituir:

```markdown
## Como exportar tokens pra código

Variables do Figma → CSS Variables → Tailwind config → Código.

Veja `app/globals.css` no `crm-web/` pra implementação concreta — Tailwind 4 não usa mais `tailwind.config.*`; toda configuração vai no bloco `@theme` do CSS.

Quando atualizar tokens no Figma:

1. Atualizar Variables no Figma
2. Atualizar `app/globals.css` (bloco `@theme`) correspondente
3. Atualizar este documento (`design-system.md`)

Manter os 3 sincronizados é responsabilidade do mantenedor (você). Não tem automação no MVP.
```

Por:

```markdown
## Como exportar tokens pra código

Fluxo real: tokens semantic do Figma → variáveis CSS shadcn em `:root`/`.dark` → classes Tailwind via `@theme inline`.

1. **Tokens semantic** (Figma `color/semantic/*`) viram `--background`, `--foreground`, `--card`, `--border`, etc. em `:root` (light) e `.dark` (dark) dentro de `app/globals.css`.
2. **`@theme inline {}`** mapeia essas vars pra classes Tailwind: `--color-background: var(--background)` → `bg-background`, `text-background` ficam disponíveis.
3. **Brand-specific** (escala primary 50..950) entra direto no `@theme inline` como `--color-primary-50..950`, expondo classes `bg-primary-500`, `text-primary-700`, etc. — usadas em badges, charts, accents da marca.
4. **Tailwind 4 é CSS-first**: não usa mais `tailwind.config.ts`. Toda configuração vive no bloco `@theme` do CSS.

Quando os tokens mudam no Figma:

1. Atualizar Variables no Figma.
2. Atualizar `app/globals.css` (bloco `@theme inline` e/ou `:root`/`.dark`).
3. Atualizar este documento (`design-system.md`) — em particular a tabela §Cores → "Mapeamento Figma ↔ código".

Manter os 3 sincronizados é responsabilidade do mantenedor. Não há automação no MVP.
```

- [ ] **Step 7: Atualizar §"Referências externas"**

Substituir:

```markdown
- **Fontes:** Archivo (Google Fonts), Inter (Google Fonts), JetBrains Mono (Google Fonts)
```

Por:

```markdown
- **Fontes:** Geist Sans + Geist Mono (https://vercel.com/font), via package `geist`
```

- [ ] **Step 8: Verificar que ghost-tokens não sobraram no design-system.md (exceto na tabela Figma)**

Run: `rg -n 'text-text-primary|text-text-secondary|bg-bg-base|bg-bg-subtle|border-border-default' design-system.md`
Expected: nenhuma saída (apenas nomes Figma `text-primary`, `bg-base`, `border-default` permanecem na tabela — sem o prefixo `text-text-`/`bg-bg-`/`border-border-`).

- [ ] **Step 9: Commit**

Run:

```bash
git add design-system.md
git commit -m "$(cat <<'EOF'
docs(design-system): v3 com mapeamento Figma↔CSS e tipografia Geist

- Header indica vocabulario canonico = shadcn baseline; Figma mantem
  os nomes Dreams Chat com tabela de equivalencia.
- Nova subsecao "Mapeamento Figma ↔ codigo" lista 18 tokens com a
  classe Tailwind real e a CSS var correspondente.
- §Tipografia reescrita pra Geist Sans + Geist Mono (sem font-ui Inter).
- §Tabs e §Botoes apontam pra typography/family/sans.
- §"Como exportar tokens" descreve o fluxo real (Tailwind 4 @theme inline).
- §Referencias externas aponta pra Geist em vez de Archivo/Inter/JetBrains.
EOF
)"
```

---

## Task 12: Atualizar `components/CLAUDE.md`

**Files:**

- Modify: `components/CLAUDE.md` (exemplo TicketCard + §Tema light/dark)

- [ ] **Step 1: Atualizar exemplo do TicketCard**

Substituir:

```tsx
      className={cn(
        'bg-bg-base shadow-card cursor-pointer rounded-md p-5 transition-shadow',
        'hover:shadow-md',
        isSelected && 'bg-primary-50 dark:bg-primary-900/30',
        isPinned && 'border-primary-500 border-l-2',
      )}
```

Por:

```tsx
      className={cn(
        'bg-card shadow-sm cursor-pointer rounded-md p-5 transition-shadow',
        'hover:shadow-md',
        isSelected && 'bg-primary/10',
        isPinned && 'border-primary-500 border-l-2',
      )}
```

- [ ] **Step 2: Atualizar §"Tema light/dark"**

Substituir:

````markdown
- Nunca cor hardcoded (`bg-blue-500` direto)
- Sempre via tokens (`bg-primary`, `text-text`, `border-border`)

```tsx
// ❌ ERRADO — cores hardcoded
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">

// ✅ CORRETO — tokens semânticos via Tailwind 4
<div className="bg-bg-base text-text-primary">
```
````

````

Por:
```markdown
- Nunca cor hardcoded (`bg-blue-500` direto)
- Sempre via tokens shadcn baseline: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `bg-muted`, `bg-popover`, `bg-sidebar`, `bg-primary`, `bg-destructive`, `bg-accent` (+ foregrounds correspondentes)

```tsx
// ❌ ERRADO — cores hardcoded
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">

// ✅ CORRETO — tokens semânticos via Tailwind 4 (shadcn baseline)
<div className="bg-background text-foreground">
````

````

- [ ] **Step 3: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' components/CLAUDE.md`
Expected: nenhuma saída.

---

## Task 13: Atualizar `app/CLAUDE.md`

**Files:**
- Modify: `app/CLAUDE.md` (§Layouts aninhados — exemplo de DashboardLayout)

- [ ] **Step 1: Aplicar Edit**

Substituir:
```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg-subtle flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="bg-bg-base flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
````

Por:

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sidebar flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="bg-background flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar zero ghost-tokens no arquivo**

Run: `rg 'text-text-|bg-bg-|border-border-default' app/CLAUDE.md`
Expected: nenhuma saída.

- [ ] **Step 3: Commit (CLAUDE.md de app/ + components/)**

Run:

```bash
git add app/CLAUDE.md components/CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): alinha CLAUDE.md de app/ e components/ com shadcn baseline

Atualiza exemplos (TicketCard, DashboardLayout) e a §Tema light/dark
para usar bg-background, text-foreground, bg-card, bg-sidebar, etc —
em vez dos ghost-tokens bg-bg-base / text-text-primary que viravam
no-op em Tailwind 4.
EOF
)"
```

---

## Task 14: Atualizar `ARCHITECTURE.md` (versão 8)

**Files:**

- Modify: `ARCHITECTURE.md:5-6` (header) + `ARCHITECTURE.md:388` (tabela frontend tipografia)

- [ ] **Step 1: Atualizar header**

Substituir:

```markdown
> **Versão:** 7 (tipografia ajustada: Archivo + Inter, paleta Dreams Chat aplicada)
> **Última atualização:** 27/04/2026
```

Por:

```markdown
> **Versão:** 8 (tipografia consolidada em Geist; vocabulário Tailwind = shadcn baseline)
> **Última atualização:** 10/05/2026
```

- [ ] **Step 2: Atualizar linha de Tipografia na tabela §Frontend**

Substituir:

```markdown
| Tipografia | Archivo (sans/conteúdo) + Inter (UI/ações) + JetBrains Mono — via `next/font/google` |
```

Por:

```markdown
| Tipografia | Geist Sans + Geist Mono — via package `geist` (`next/font` interno) |
```

- [ ] **Step 3: Verificar zero referências stale**

Run: `rg -n 'Archivo|Inter \(|JetBrains' ARCHITECTURE.md`
Expected: nenhuma saída.

- [ ] **Step 4: Commit**

Run:

```bash
git add ARCHITECTURE.md
git commit -m "$(cat <<'EOF'
docs(architecture): v8 — tipografia Geist + vocabulario shadcn baseline

Header e tabela §Frontend deixam explicito que a tipografia consolidada
e Geist Sans + Geist Mono (via package `geist`) e que o vocabulario
canonico Tailwind do crm-web e o shadcn baseline.
EOF
)"
```

---

## Task 15: Verificar showcase `/configuracoes/design-system` (sem mudanças esperadas)

**Files:**

- Verify: `app/(app)/configuracoes/design-system/_sections/tokens-colors.tsx`
- Verify: `app/(app)/configuracoes/design-system/_sections/tokens-typography.tsx`

- [ ] **Step 1: Confirmar que `tokens-colors.tsx` já usa o vocabulário shadcn**

Run: `rg 'bg-bg-|text-text-|border-border-default' app/\(app\)/configuracoes/design-system/_sections/tokens-colors.tsx`
Expected: nenhuma saída (arquivo já está correto — confirma o levantamento prévio).

Verificação adicional: o arquivo já cataloga "Tokens semânticos shadcn", "Sidebar", "Primary scale", "Chart accents". Se faltar alguma seção (improvável), adicionar.

- [ ] **Step 2: Confirmar que `tokens-typography.tsx` já usa Geist**

Run: `rg 'Archivo|Inter \(|JetBrains' app/\(app\)/configuracoes/design-system/_sections/tokens-typography.tsx`
Expected: nenhuma saída.

E confirma manualmente que renderiza "Geist Sans (font-sans)" e "Geist Mono (font-mono)".

- [ ] **Step 3: Sem commit nesta task** (showcase já alinhado).

---

## Task 16: Verificação local (gate antes da auditoria)

**Files:** nenhum.

- [ ] **Step 1: format**

Run: `pnpm format:check`
Expected: "All matched files use Prettier code style!" (ou equivalente — exit 0).

- [ ] **Step 2: lint**

Run: `pnpm lint`
Expected: zero errors / zero warnings (ou apenas warnings pré-existentes não relacionados).

- [ ] **Step 3: typecheck**

Run: `pnpm typecheck`
Expected: zero erros TS.

- [ ] **Step 4: testes**

Run: `pnpm test`
Expected: todos os testes passam.

Se qualquer um falhar: parar, investigar, corrigir, voltar pro Step 1. Não avançar pra auditoria visual com gates vermelhos.

---

## Task 17: Auditoria visual em light + dark

**Files:** nenhum (validação manual em browser).

- [ ] **Step 1: Subir o dev server**

Run em terminal separado: `pnpm dev`
Expected: Next.js inicia em `http://localhost:3000` sem erros.

- [ ] **Step 2: Login**

Abrir `http://localhost:3000/login`. Validar em light e dark (alternar via theme-toggle quando logado): texto legível, foco visível, erro de credencial OK.

- [ ] **Step 3: Aceitar convite**

Validar `/aceitar-convite/[token]` (com token válido + token inválido). Form, mensagens de erro, botões.

- [ ] **Step 4: App shell**

Logar e validar em qualquer rota: sidebar (active, hover, drawer mobile via Cmd/Ctrl+B), header, NavUser, theme-toggle alternando light↔dark sem flash.

- [ ] **Step 5: `/configuracoes/design-system`**

Showcase 100% renderizando — todos swatches, escala primary, chart accents, sidebar, tipografia (Geist sans + mono), pesos, tamanhos. Em light e dark.

- [ ] **Step 6: `/configuracoes/departamentos`**

Lista, dialog create/edit, alert delete. Light + dark.

- [ ] **Step 7: `/configuracoes/tags`**

Lista, dialog (com color-picker), alert delete. Light + dark.

- [ ] **Step 8: `/configuracoes/respostas-rapidas`**

Lista, dialog, alert delete. Light + dark.

- [ ] **Step 9: `/configuracoes/usuarios`**

Tabs Usuários/Convites, UserDialog edit, deactivate dialog, force-logout dialog, badges (Você, Conta da plataforma, Ausente). Light + dark.

- [ ] **Step 10: `/configuracoes/preferencias`**

Verificar que o footer sticky tem fundo opaco (não-transparente) — bug 0.22 resolvido implicitamente. Light + dark.

- [ ] **Step 11: Placeholders restantes**

Passada visual rápida em ao menos 3 placeholders (`/configuracoes/canais`, `/configuracoes/integracoes`, e uma rota fora de configuracoes). Verificar que título e "Em breve." aparecem com texto legível em light e dark — confirma o fix do `placeholder-page.tsx`.

- [ ] **Step 12: Loading state e error boundary**

Forçar um loading visível (refresh em rota com fetch) — esqueleto da sidebar deve renderizar com `bg-sidebar`. Disparar erro temporário (e.g. mexer numa rota client) — `error.tsx` deve renderizar título e descrição com texto legível.

- [ ] **Step 13: Critérios de aceitação**

Em todas as telas auditadas:

- Texto legível em ambos os modos (sem `color: transparent` ou similar).
- Bordas/divisores visíveis.
- Hover/focus mantidos (cards, botões, links).
- Foco visível em inputs e botões via teclado (ring azul DigiChat).
- Botões primários/secundários/destrutivos com contraste suficiente (WCAG AA — verificar à vista).

Se qualquer regressão visual: anotar tela + descrição, corrigir, repetir auditoria. Não avançar pro PR com regressão visual.

---

## Task 18: Remover memory `feedback_real_tailwind_tokens.md`

**Files:**

- Delete: `~/.claude/projects/-home-rodrigo-digigov-dev-space-digigov-digichat-crm-web/memory/feedback_real_tailwind_tokens.md`
- Modify: `~/.claude/projects/-home-rodrigo-digigov-dev-space-digigov-digichat-crm-web/memory/MEMORY.md` (remove uma linha)

- [ ] **Step 1: Apagar o arquivo da memory**

Run:

```bash
rm /home/rodrigo-digigov/.claude/projects/-home-rodrigo-digigov-dev-space-digigov-digichat-crm-web/memory/feedback_real_tailwind_tokens.md
```

- [ ] **Step 2: Remover a entrada de MEMORY.md**

Aplicar Edit em `/home/rodrigo-digigov/.claude/projects/-home-rodrigo-digigov-dev-space-digigov-digichat-crm-web/memory/MEMORY.md`.

Substituir a linha:

```markdown
- [Tokens Tailwind reais ≠ tokens do design-system.md](feedback_real_tailwind_tokens.md) — globals.css usa shadcn baseline (bg-background, text-foreground, text-muted-foreground, border-border); os nomes do design-system.md (text-text-primary, bg-bg-base, etc) só entram na Sprint 0.23 e viram no-op silencioso hoje
```

Por: (linha removida — substituir pela próxima linha existente, ou simplesmente deletar a linha mantendo as outras três).

Estado esperado de `MEMORY.md` após o edit:

```markdown
- [Server Components renderizando interatividade no Next.js 16 + RSC](feedback_use_client_view_components.md) — função em event handler (mesmo em `<button>` nativo) não serializa; subir a fronteira `'use client'` até o ponto onde a função é definida
- [Não fazer push antes de validação manual completa](feedback_no_push_until_validated.md) — em rodada de feedback iterativo, commitar local é OK mas só `git push` quando o usuário sinalizar que terminou
- [Backend DigiChat usa soft-delete por default em DELETE /:id](project_backend_soft_delete_default.md) — DELETE marca active=false e retorna 204; pra UX de hard delete, frontend filtra active=true na lista
```

- [ ] **Step 3: Sem commit** (memory é fora do repo `crm-web`).

---

## Task 19: Smoke check final + abertura do PR

**Files:** nenhum (gate + PR).

- [ ] **Step 1: Smoke check definitivo**

Run:

```bash
rg -n 'bg-bg-base|bg-bg-subtle|bg-bg-muted|bg-bg-inverse|text-text-primary|text-text-secondary|text-text-muted|text-text-inverse|text-text-link|border-border-default|border-border-muted|border-border-strong' app/ components/ lib/
```

Expected: zero hits.

Bonus check (raiz, excluindo `docs/superpowers/specs/` que mantém o spec histórico):

```bash
rg -n 'bg-bg-base|bg-bg-subtle|bg-bg-muted|text-text-primary|text-text-secondary|border-border-default' --glob '!docs/superpowers/specs/**' --glob '!docs/superpowers/plans/**' .
```

Expected: zero hits.

- [ ] **Step 2: Verificação local final**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: tudo verde.

- [ ] **Step 3: Confirmar com o usuário antes de push**

Memory `feedback_no_push_until_validated.md` aplicável: parar e perguntar ao usuário se aprova `git push` + abertura de PR. Não pushar sem confirmação.

- [ ] **Step 4: Push da branch**

Run (após confirmação): `git push -u origin chore/sprint-0-23-tema-final`
Expected: push aceito; CI dispara.

- [ ] **Step 5: Abrir PR via gh CLI**

Run:

```bash
gh pr create --title "chore(theme): consolida vocabulário shadcn baseline (Sprint 0.23)" --body "$(cat <<'EOF'
## Summary

Sprint 0.23 — Tema final consolidado. Resolve a divergência entre `design-system.md` e o estado real do código consolidando o **shadcn baseline** como vocabulário Tailwind único do `crm-web`.

- Substitui 16 ghost-tokens (`text-text-primary`, `bg-bg-base`, `border-border-default`, etc) por suas equivalências shadcn (`text-foreground`, `bg-background`, `border-border`, `bg-sidebar`, `bg-muted`) em 7 arquivos da app — todos eles renderizavam transparente/quebrado em Tailwind 4 por nunca terem entrado em `@theme inline`.
- Atualiza `globals.css` (header comment), `design-system.md` v3 (com tabela Figma↔CSS e tipografia Geist), `app/CLAUDE.md`, `components/CLAUDE.md`, `ARCHITECTURE.md` v8.
- Mantém Geist Sans + Geist Mono (via package `geist`); descarta Archivo+Inter+JetBrains da visão antiga.
- Paleta primary `#1b84ff` continua aplicada em `--primary`/`--ring`/`--sidebar-primary` + escala `--color-primary-50..950` exposta.

Showcase `/configuracoes/design-system` já estava alinhado com baseline shadcn — sem mudanças.

## Test plan

- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` — verde local
- [ ] CI verde (build + drift detection em `lib/generated/`)
- [ ] Smoke `rg 'text-text-|bg-bg-|border-border-default' app/ components/` retorna zero hits
- [ ] Auditoria visual manual em light + dark concluída (login, app shell, design-system showcase, departamentos, tags, quick-replies, usuários, preferências, placeholders)
- [ ] Foco visível em inputs/botões mantido (ring azul DigiChat)
- [ ] Loading state da app shell (`/configuracoes/*` ao navegar) renderiza esqueleto com `bg-sidebar`
- [ ] Error boundary (`/(app)/error.tsx`) renderiza texto legível

## Follow-ups (fora desta sprint)

- Bug em `app/layout.tsx:22` (falta de espaço antes de `'dark'` no template-literal SSR; mascarado pelo `useEffect` do `ThemeProvider`).
- Hex `#1B84FF` hardcoded em `tag-dialog.tsx` como default de cor de Tag (entidade do banco — sprint de domínio).
- Adoção de tokens status (success/warning) só quando aparecer uso concreto.

Spec: `docs/superpowers/specs/2026-05-10-sprint-0-23-tema-final-consolidado-design.md`
Plan: `docs/superpowers/plans/2026-05-10-sprint-0-23-tema-final.md`
EOF
)"
```

Expected: PR criado; URL retornada.

- [ ] **Step 6: Commit do plan + spec na branch (caso CI exija ou pra histórico)**

O spec já está em `48ce811`. O plan é `docs/superpowers/plans/2026-05-10-sprint-0-23-tema-final.md` e foi criado durante o processo — adicionar à branch:

Run:

```bash
git add docs/superpowers/plans/2026-05-10-sprint-0-23-tema-final.md
git commit -m "$(cat <<'EOF'
docs(sprint-0-23): plano de implementacao do tema final
EOF
)"
git push
```

Expected: commit incluído no PR.

- [ ] **Step 7: Aguardar CI**

Conferir que CI roda lint/format/typecheck/test/build/drift detection — todos verdes. Se algo falhar: investigar logs, corrigir, push novo commit.

---

## Task 20: Pós-merge — atualizar `ROADMAP.md`

**Files:**

- Modify: `ROADMAP.md` (§4.8 — Sprint 0.23)

> Esta task é executada **após** o merge do PR principal, em uma **branch separada** `docs/update-roadmap-0-23`.

- [ ] **Step 1: Voltar pra `main` atualizada**

Run:

```bash
git checkout main && git pull --ff-only
```

- [ ] **Step 2: Criar branch nova**

Run: `git checkout -b docs/update-roadmap-0-23`

- [ ] **Step 3: Editar `ROADMAP.md`**

No §4.8 "Plano de fechamento da Fase 0", mover Sprint 0.23 da seção "Sprints planejadas" pra "Entregue" com bullet equivalente. Substituir:

```markdown
2. **Sprint 0.23 — Tema final consolidado.** Decidir entre paleta Dreams Chat (PR #12) e base radix-nova + azul DigiChat (Sprint 0.14). Ajustar `app/globals.css` e revisar componentes base em modo claro e escuro.
```

Por (mover pra "Entregue"):

```markdown
- [x] **Sprint 0.23 — Tema final consolidado** (PR #<numero>). Vocabulário Tailwind canônico do `crm-web` consolidado em **shadcn baseline**: 16 ghost-tokens (`text-text-primary`, `bg-bg-base`, `border-border-default`, etc) substituídos por seus equivalentes shadcn (`text-foreground`, `bg-background`, `border-border`, `bg-sidebar`, `bg-muted`) em 7 arquivos. `design-system.md` v3 com tabela Figma↔CSS e tipografia consolidada em Geist Sans + Geist Mono. `ARCHITECTURE.md` v8. Paleta primary `#1b84ff` mantida em `--primary`/`--ring`/`--sidebar-primary` + escala `--color-primary-50..950` exposta.
```

E na seção "Sprints planejadas pra fechar a Fase 0", remover o item 2 (Sprint 0.23). Renumerar se houver outros itens.

Atualizar também o §6 "Rastreamento" — Fase 0 — Notas: adicionar "0.23 Tema final" à lista de sprints entregues.

- [ ] **Step 4: Commit + push + PR**

Run:

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): marca Sprint 0.23 (Tema final) como entregue"
git push -u origin docs/update-roadmap-0-23
gh pr create --title "docs(roadmap): marca Sprint 0.23 como entregue" --body "Atualiza §4.8 movendo Sprint 0.23 (Tema final consolidado) pra entregue, com sumário do que foi consolidado (vocabulario shadcn baseline, design-system.md v3, ARCHITECTURE.md v8). Linka ao PR principal da sprint."
```

Expected: PR docs criado.
