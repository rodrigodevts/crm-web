# Design System — DigiChat

> **Versão:** 3 (vocabulário canônico = shadcn baseline; Figma mantém os nomes Dreams Chat com tabela de equivalência)
> **Última atualização:** 10/05/2026
>
> Identidade visual e tokens da plataforma. Os nomes documentados aqui são os do **Figma** (collection `DigiChat Tokens`); no código, o vocabulário canônico é o **shadcn baseline**. A tabela de equivalência fica em §Cores → "Mapeamento Figma ↔ código".

---

## Identidade

**Tom:** friendly, moderno, denso (alta densidade de informação).
**Plataforma alvo primária:** desktop (1440-1920px).
**Dark mode:** suportado, definido pós-MVP.
**Inspiração visual:** template Dreams Chat (https://dreamschat.dreamstechnologies.com).
**Inspiração estrutural:** Izing/Chatwoot.
**Acessibilidade:** WCAG AA mínimo.

---

## Cores

> **Nota:** os tokens listados nesta seção são **nomes do Figma** (collection `DigiChat Tokens`). No código (`app/globals.css` + Tailwind 4 `@theme inline`), o vocabulário canônico é o **shadcn baseline** (`bg-background`, `text-foreground`, `border-border`, etc.). A tabela "Mapeamento Figma ↔ código" no fim desta seção documenta a equivalência 1:1.

### Primary (azul vibrante)

Cor base do produto, usada em ações primárias, links, badges informativos e elementos selecionáveis.

| Token               | Hex       | Uso típico                                |
| ------------------- | --------- | ----------------------------------------- |
| `color/primary/50`  | `#eff6ff` | Backgrounds sutis (hover de itens)        |
| `color/primary/100` | `#dbeafe` | Estados leves                             |
| `color/primary/200` | `#bfdbfe` |                                           |
| `color/primary/300` | `#93c5fd` |                                           |
| `color/primary/400` | `#60a5fa` |                                           |
| `color/primary/500` | `#1b84ff` | **Cor principal** — botões, badges, links |
| `color/primary/600` | `#1565db` | Hover/pressed                             |
| `color/primary/700` | `#1949b6` |                                           |
| `color/primary/800` | `#1e3a8a` |                                           |
| `color/primary/900` | `#1e3175` |                                           |
| `color/primary/950` | `#172554` |                                           |

### Neutral (cinzas — Slate Tailwind)

Para fundos, bordas, divisores, textos secundários.

| Token               | Hex       |
| ------------------- | --------- |
| `color/neutral/50`  | `#f8fafc` |
| `color/neutral/100` | `#f1f5f9` |
| `color/neutral/200` | `#e2e8f0` |
| `color/neutral/300` | `#cbd5e1` |
| `color/neutral/400` | `#94a3b8` |
| `color/neutral/500` | `#64748b` |
| `color/neutral/600` | `#475569` |
| `color/neutral/700` | `#334155` |
| `color/neutral/800` | `#1e293b` |
| `color/neutral/900` | `#0f172a` |
| `color/neutral/950` | `#020617` |

### Semantic (uso direto sem pensar em escala)

| Token                            | Hex       | Uso                               |
| -------------------------------- | --------- | --------------------------------- |
| `color/semantic/text-primary`    | `#141b27` | Texto principal (nome, headings)  |
| `color/semantic/text-secondary`  | `#72767d` | Texto secundário (preview, hora)  |
| `color/semantic/text-muted`      | `#9aa0a6` | Texto desativado, hints           |
| `color/semantic/text-inverse`    | `#ffffff` | Texto sobre fundo escuro          |
| `color/semantic/text-link`       | `#1b84ff` | Links inline                      |
| `color/semantic/bg-base`         | `#ffffff` | Fundo principal                   |
| `color/semantic/bg-subtle`       | `#f8f9fa` | Fundo de áreas sutis (sidebar)    |
| `color/semantic/bg-muted`        | `#f1f3f5` | Hover background                  |
| `color/semantic/bg-inverse`      | `#141b27` | Áreas com fundo escuro (tooltips) |
| `color/semantic/border-default`  | `#e5e7eb` | Bordas e divisores padrão         |
| `color/semantic/border-muted`    | `#f3f4f6` | Bordas muito sutis                |
| `color/semantic/border-strong`   | `#d1d5db` | Bordas com mais destaque          |
| `color/semantic/shadow-card-key` | `#f3f3f3` | Cor da sombra de cards            |

### Status

Cores semânticas para estados (sucesso, alerta, erro, info).

**Success (verde):**
| Token | Hex | Uso |
|---|---|---|
| `color/status/success/50` | `#ecfdf5` | Background de notificação |
| `color/status/success/100` | `#d1fae5` | |
| `color/status/success/500` | `#0cc68c` | **Status online, progresso, ok** |
| `color/status/success/600` | `#059669` | Hover |
| `color/status/success/700` | `#047857` | |

**Warning (amarelo/âmbar):**
| Token | Hex |
|---|---|
| `color/status/warning/50` | `#fffbeb` |
| `color/status/warning/100` | `#fef3c7` |
| `color/status/warning/500` | `#ffc107` |
| `color/status/warning/600` | `#d97706` |
| `color/status/warning/700` | `#b45309` |

**Danger (vermelho):**
| Token | Hex | Uso |
|---|---|---|
| `color/status/danger/50` | `#fef2f2` | Background de erro |
| `color/status/danger/100` | `#fee2e2` | |
| `color/status/danger/500` | `#fd3a55` | **Badge não-lidos, erros, ações destrutivas** |
| `color/status/danger/600` | `#dc2626` | Hover |
| `color/status/danger/700` | `#b91c1c` | |

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

### Famílias

Estado atual: **Geist** (Vercel Sans + Vercel Mono). Uma família unificada cobre conteúdo e ações — sem distinção `sans` vs `ui`.

| Token                    | Família        | Pacote            | CSS var                               |
| ------------------------ | -------------- | ----------------- | ------------------------------------- |
| `typography/family/sans` | **Geist Sans** | `geist/font/sans` | `--font-sans` (= `--font-geist-sans`) |
| `typography/family/mono` | **Geist Mono** | `geist/font/mono` | `--font-mono` (= `--font-geist-mono`) |

Aplicado em `app/layout.tsx` via `next/font` (sem CDN). Tabs, botões e demais elementos de UI usam `font-sans` por consistência. Geist tem identidade tipográfica boa, peso de página menor (já vem otimizado), e simplifica o stack vs três famílias separadas.

### Tamanhos

| Token                  | Pixels | Uso típico                        |
| ---------------------- | ------ | --------------------------------- |
| `typography/size/xs`   | 10px   | Badges contadores, labels mínimos |
| `typography/size/sm`   | 12px   | Tags, captions, hora              |
| `typography/size/base` | 14px   | **Texto padrão** (preview, body)  |
| `typography/size/md`   | 16px   | Headings menores, nome de contato |
| `typography/size/lg`   | 18px   | Subseções                         |
| `typography/size/xl`   | 20px   | Headings de seção                 |
| `typography/size/2xl`  | 24px   | Headings importantes              |
| `typography/size/3xl`  | 30px   | Page titles                       |
| `typography/size/4xl`  | 36px   | Display                           |

### Pesos

| Token                        | Valor |
| ---------------------------- | ----- |
| `typography/weight/regular`  | 400   |
| `typography/weight/medium`   | 500   |
| `typography/weight/semibold` | 600   |
| `typography/weight/bold`     | 700   |

### Line-height

| Token                            | Valor (multiplicador) | Uso                  |
| -------------------------------- | --------------------- | -------------------- |
| `typography/line-height/tight`   | 1.2                   | Headings             |
| `typography/line-height/snug`    | 1.35                  | Subheadings          |
| `typography/line-height/normal`  | 1.5                   | **Body padrão**      |
| `typography/line-height/relaxed` | 1.7                   | Texto longo, leitura |

---

## Espaçamento

Escala alinhada com Tailwind (múltiplos de 4 com fracionários permitidos).

| Token         | Pixels |
| ------------- | ------ |
| `spacing/0`   | 0      |
| `spacing/0_5` | 2      |
| `spacing/1`   | 4      |
| `spacing/1_5` | 6      |
| `spacing/2`   | 8      |
| `spacing/2_5` | 10     |
| `spacing/3`   | 12     |
| `spacing/3_5` | 14     |
| `spacing/4`   | 16     |
| `spacing/5`   | 20     |
| `spacing/6`   | 24     |
| `spacing/7`   | 28     |
| `spacing/8`   | 32     |
| `spacing/10`  | 40     |
| `spacing/12`  | 48     |
| `spacing/14`  | 56     |
| `spacing/16`  | 64     |
| `spacing/20`  | 80     |
| `spacing/24`  | 96     |
| `spacing/32`  | 128    |

**Nota sobre nomes com underscore:** Figma não permite ponto em nomes de Variables. Tokens fracionários (`0_5`, `1_5`, `2_5`, `3_5`) são exportados pra Tailwind/CSS como `0.5`, `1.5`, etc.

---

## Border radius

| Token         | Pixels | Uso                                            |
| ------------- | ------ | ---------------------------------------------- |
| `radius/none` | 0      |                                                |
| `radius/sm`   | 4      | Status indicators, badges pequenos             |
| `radius/md`   | 8      | **Cards padrão**, botões                       |
| `radius/lg`   | 12     | Modais, painéis maiores                        |
| `radius/xl`   | 16     | Containers grandes                             |
| `radius/pill` | 15     | Tags/badges em formato pill (Dreams Chat)      |
| `radius/full` | 9999   | Avatares, badges circulares, pílulas perfeitas |

---

## Sizes específicos

Tamanhos padronizados de elementos recorrentes.

| Token             | Pixels | Uso                                        |
| ----------------- | ------ | ------------------------------------------ |
| `size/avatar/sm`  | 32     | Avatar pequeno (lista compacta)            |
| `size/avatar/md`  | 48     | **Avatar padrão (card de ticket)**         |
| `size/avatar/lg`  | 64     | Avatar grande (perfil)                     |
| `size/icon/sm`    | 16     | Ícone pequeno                              |
| `size/icon/md`    | 20     | Ícone padrão                               |
| `size/icon/lg`    | 24     | Ícone grande                               |
| `size/status-dot` | 14     | Bolinha de status online (canto do avatar) |

---

## Sombras

| Token (Effect Style no Figma) | Valor                         | Uso                                      |
| ----------------------------- | ----------------------------- | ---------------------------------------- |
| `shadow/sm`                   | `0 1px 2px rgba(0,0,0,0.05)`  | Sombra muito sutil                       |
| `shadow/card`                 | `0 1px 5px 1px #f3f3f3`       | **Sombra padrão de cards** (Dreams Chat) |
| `shadow/md`                   | `0 4px 6px rgba(0,0,0,0.07)`  | Hover de cards, dropdowns                |
| `shadow/lg`                   | `0 10px 15px rgba(0,0,0,0.1)` | Modais, popovers                         |

**Nota:** Figma Variables não suportam shadow nativamente. Sombras ficam como Effect Styles no Figma. A Variable `color/semantic/shadow-card-key` (`#f3f3f3`) representa a cor da sombra principal.

---

## Componentes

### Card de ticket (anatomia)

Componente mais visível do produto. Especificação detalhada em `crm-specs/audits/audit-06-atendimentos.md`.

**Card "rico" (com tags + barra 24h):**

- Altura: ~123px
- Padding: `spacing/5` (20px)
- Border radius: `radius/md` (8px)
- Background: `color/semantic/bg-base`
- Shadow: `shadow/card`
- Avatar: `size/avatar/md` (48px) com `radius/full`
- Status indicator: `size/status-dot` (14px) com cor por estado:
  - Online: `color/status/success/500`
  - Ausente/idle: `color/status/warning/500`
  - Offline: `color/neutral/400`
- Nome: `typography/family/sans`, `typography/size/md` (16px), `typography/weight/semibold`, cor `color/semantic/text-primary`
- Preview: `typography/family/sans`, `typography/size/base` (14px), `typography/weight/regular`, cor `color/semantic/text-secondary`
- Hora: `typography/family/sans`, `typography/size/base`, cor `color/semantic/text-secondary`
- Badge não-lidos: pill com background `color/status/danger/500`, texto `color/semantic/text-inverse`, `typography/size/sm`
- Tags: pill com background `color/primary/500`, texto inverso, `radius/pill` (15px), `typography/size/sm`, máximo 3 visíveis + indicador "+N"
- Barra 24h (WhatsApp window): ver seção própria abaixo

**Card "simples" (sem tags, sem barra):**

- Altura: ~88px
- Mesmas regras acima sem a área de tags e barra

### Barra 24h (WhatsApp window indicator)

Indicador visual do tempo restante da janela de 24h da Meta.

| Tempo restante | Cor da barra                                          | Cor de fundo                   |
| -------------- | ----------------------------------------------------- | ------------------------------ |
| > 12h          | `color/status/success/500`                            | `color/semantic/border-strong` |
| 6-12h          | `color/status/success/500` (60% width)                | `color/semantic/border-strong` |
| 1-6h           | `color/status/warning/500`                            | `color/semantic/border-strong` |
| < 1h           | `color/status/danger/500` (com pulse animation)       | `color/semantic/border-strong` |
| Fora da janela | (sem barra, indicador "Janela expirada — enviar HSM") | —                              |

A barra **não é exibida** quando:

- Ticket está em modo bot ativo (`isBot=true` E `flowExecution.status=RUNNING`)
- Canal não tem janela 24h (Baileys, futuro)
- `lastInboundAt` é nulo (nunca houve mensagem inbound)

Implementação detalhada virá na Sprint que implementa o card de ticket.

### Tabs (header da lista)

- Família: `typography/family/sans` (Geist Sans)
- Peso: `typography/weight/medium`
- Tamanho: `typography/size/base`
- Cor texto ativo: `color/semantic/text-primary`
- Cor texto inativo: `color/semantic/text-secondary`
- Underline ativo: `color/primary/500`
- Badge contador: pill pequeno, background `color/primary/500`, `typography/size/xs` (10px)

### Botões de ação primária

- Família: `typography/family/sans` (Geist Sans)
- Peso: `typography/weight/medium`
- Tamanho: `typography/size/base`
- Background: `color/primary/500`
- Hover: `color/primary/600`
- Active: `color/primary/700`
- Texto: `color/semantic/text-inverse`
- Padding: `spacing/3` vertical, `spacing/4` horizontal
- Radius: `radius/md`

### Botões secundários

- Background: `color/semantic/bg-base`
- Borda: `color/semantic/border-default`
- Texto: `color/semantic/text-primary`
- Hover background: `color/semantic/bg-muted`

### Inputs

- Background: `color/semantic/bg-base`
- Borda: `color/semantic/border-default`
- Borda focus: `color/primary/500`
- Texto: `color/semantic/text-primary`
- Placeholder: `color/semantic/text-muted`
- Padding: `spacing/3` vertical, `spacing/4` horizontal
- Radius: `radius/md`

#### Inputs com ícone, prefixo ou ação inline

Sempre via `<InputGroup>` de `components/ui/input-group.tsx` (shadcn). Combina ícone (`<InputGroupAddon>`) ou texto fixo (`<InputGroupText>`) com `<InputGroupInput>` ou `<InputGroupTextarea>` num único container com bordas e foco coordenados. Não compor manualmente com `relative + absolute` — fica frágil e divergente entre telas.

```tsx
<InputGroup>
  <InputGroupAddon>
    <SearchIcon className="size-4" />
  </InputGroupAddon>
  <InputGroupInput placeholder="Buscar…" />
</InputGroup>
```

#### Campos obrigatórios vs opcionais

**Padrão do projeto:** marcar a **minoria**. Nos forms do app a maioria dos campos é opcional (defaults razoáveis no backend), então marcamos os obrigatórios com asterisco vermelho via `<FieldLabel required>`. Se algum form futuro tiver maioria de campos obrigatórios, inverter localmente para marcar os opcionais com tag `(opcional)`.

```tsx
<FieldLabel htmlFor="name" required>
  Nome
</FieldLabel>
```

O `required` no `FieldLabel` (`components/ui/field.tsx`) renderiza um asterisco em `text-destructive` com `aria-hidden`, sem poluir o accessible-name lido por screen readers. O `<input>` em si declara obrigatoriedade via `aria-invalid`/`required` derivados do schema Zod do form.

---

## Iconografia

**Biblioteca:** lucide-react (https://lucide.dev)
**Tamanhos padrão:** `size/icon/sm` (16), `size/icon/md` (20), `size/icon/lg` (24)
**Cor padrão:** `color/semantic/text-secondary` (cinza médio)
**Cor ativa/hover:** `color/semantic/text-primary`
**Cor primária:** `color/primary/500` (botões e ações)

Ícones específicos da sidebar de Atendimentos seguem padrão Tabler Icons (mantém compatibilidade com referências do Dreams Chat).

---

## Estados e feedback

### Loading

- Skeletons com `color/semantic/bg-muted` em formato dos elementos que vão aparecer
- Spinner: rotação 360° infinita, cor `color/primary/500`
- Estado loading não deixa tela branca — sempre skeleton ou spinner visível

### Empty state

- Ilustração ou ícone grande (`size/icon/lg` ou maior) em `color/neutral/300`
- Título em `typography/size/md`, `text-primary`
- Subtítulo em `typography/size/base`, `text-secondary`
- CTA opcional como botão primário

### Error

- Background sutil em `color/status/danger/50`
- Borda em `color/status/danger/500` (1px)
- Ícone alerta em `color/status/danger/500`
- Texto em `color/semantic/text-primary`
- Botão de retry secundário

### Hover

- Itens de lista: background muda pra `color/semantic/bg-muted`
- Cards: shadow muda de `shadow/card` pra `shadow/md`
- Botões primários: background muda pra `color/primary/600`
- Texto interativo: cor muda pra `color/primary/500` se não era

### Focus (acessibilidade)

- Outline `2px solid color/primary/500` com offset 2px em qualquer elemento focável via teclado
- Nunca remover outline sem substituir por outro indicador visual

---

## Densidade de informação

DigiChat é produto pra atendentes que passam 8h/dia na tela. Densidade alta é prioridade sobre "respiro".

**Princípios:**

- Padding de cards moderado (não usar `spacing/8` quando `spacing/5` resolve)
- Listas com `spacing/3` entre itens, não `spacing/6`
- Headings sem grandes margens superiores
- Sidebar fina (72px de largura, 96px só se precisar de labels)

**Mas:** legibilidade prevalece. Texto sempre `typography/size/base` mínimo (14px), nunca abaixo. Exceções: badges contadores (xs/10px) e captions (sm/12px).

---

## Responsividade

**Decisão MVP:** desktop-first.

Breakpoints (Tailwind padrão):

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Comportamento esperado:**

- < 768px: layout mobile colapsa (sidebar overlay, lista fullscreen, conversa em outra rota)
- 768-1024: layout tablet (sidebar fixa, lista 320px, conversa restante)
- > 1024px: layout desktop completo (sidebar 72px, lista 400px, conversa restante)

Mobile não é prioridade no MVP mas componentes não devem quebrar.

---

## Dark mode

**Status:** definido pós-MVP.

A collection `DigiChat Tokens` no Figma tem apenas modo `Light` no momento. Quando implementar dark, criar segundo modo na mesma collection com:

- Variables `color/semantic/*` → invertidas (text claro, bg escuro, etc)
- Variables `color/primary/*` → mantidas iguais (paleta funciona em dark)
- Variables `color/neutral/*` → mantidas iguais
- Variables `color/status/*` → ajustadas se contraste ruim

Implementação técnica via `next-themes` (já instalado no `crm-web`).

---

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

---

## Referências externas

- **Inspiração visual:** Dreams Chat (https://dreamschat.dreamstechnologies.com/react/chat)
- **Inspiração estrutural:** Chatwoot (em `~/referencias/chatwoot/`), Izing/Whaticket
- **Componentes base:** shadcn/ui (https://ui.shadcn.com)
- **Ícones:** lucide-react, Tabler Icons (referência)
- **Fontes:** Geist Sans + Geist Mono (https://vercel.com/font), via package `geist`
