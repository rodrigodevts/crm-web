# DESIGN SYSTEM — DigiChat

> Documento vivo da identidade visual do produto. Atualize quando decisões visuais mudarem.
>
> **Versão:** 1
> **Última atualização:** 27/04/2026
>
> **Nota:** "DigiChat" é nome temporário. Substituir quando decisão definitiva for tomada.

---

## Sumário

1. Princípios de design
2. Cores
3. Tipografia
4. Espaçamento e layout
5. Componentes (base shadcn/ui)
6. Iconografia
7. Estados e feedback
8. Acessibilidade
9. Aplicação prática (Tailwind + shadcn/ui)

---

## 1. Princípios de design

**Tom:** friendly/moderno. SaaS contemporâneo, leve, sem ser infantil. Confiável o suficiente para prefeitura, moderno o suficiente para parecer produto novo.

**Usuário primário:** atendente que fica 8h por dia na tela. Densidade de informação média-alta, fadiga ocular minimizada.

**Usuário secundário:** gestor/supervisor. Dashboards e relatórios precisam funcionar bem mas não dominam o design.

**Princípios:**

1. **Densidade média.** Atendente precisa ver muitos tickets, mensagens, status simultaneamente. Padding moderado, não excessivamente espaçado tipo Notion. Inspiração: Linear, Vercel.
2. **Cantos arredondados moderados.** 6-8px nos cards e botões. Nem brutalmente quadrado, nem excessivamente arredondado.
3. **Hierarquia clara.** Distinção visual forte entre primário, secundário e terciário. Atendente em estresse precisa decidir rápido.
4. **Foco no conteúdo.** Chrome (header, sidebar, painéis) discreto. O conteúdo (mensagens, ticket atual) é a estrela.
5. **Cores comunicam estado.** Status do ticket, status de mensagem, status de canal — cada um com cor consistente em todo o produto.
6. **Light + dark verdadeiros.** Não dark = "light com cores invertidas". Cada modo é desenhado consciente de fadiga ocular.

---

## 2. Cores

### 2.1 Cor primária: Sky

A cor de ações primárias, links, destaques de seleção, ícones principais.

| Token             | Light         | Dark                 |
| ----------------- | ------------- | -------------------- |
| `primary-50`      | `#F0F9FF`     | `#082F49`            |
| `primary-100`     | `#E0F2FE`     | `#0C4A6E`            |
| `primary-200`     | `#BAE6FD`     | `#075985`            |
| `primary-300`     | `#7DD3FC`     | `#0369A1`            |
| `primary-400`     | `#38BDF8`     | `#0284C7`            |
| **`primary-500`** | **`#0EA5E9`** | **`#0EA5E9`** ← base |
| `primary-600`     | `#0284C7`     | `#38BDF8`            |
| `primary-700`     | `#0369A1`     | `#7DD3FC`            |
| `primary-800`     | `#075985`     | `#BAE6FD`            |
| `primary-900`     | `#0C4A6E`     | `#E0F2FE`            |
| `primary-950`     | `#082F49`     | `#F0F9FF`            |

**Uso típico:**
- Botão primário: bg `primary-500`, hover `primary-600`, texto branco
- Link: texto `primary-600` (light) / `primary-400` (dark)
- Foco visível em inputs: ring `primary-500`
- Ícone de ação principal: `primary-500`
- Background de seleção: `primary-100` (light) / `primary-900` (dark)

### 2.2 Cores semânticas

Comunicam estado consistentemente em todo o produto.

| Status      | Token         | Light                   | Dark                    | Uso                                                                |
| ----------- | ------------- | ----------------------- | ----------------------- | ------------------------------------------------------------------ |
| **Sucesso** | `success`     | `#10B981` (emerald-500) | `#34D399` (emerald-400) | Conexão estabelecida, ticket resolvido, mensagem entregue          |
| **Atenção** | `warning`     | `#F59E0B` (amber-500)   | `#FBBF24` (amber-400)   | Fora da janela 24h, conexão instável, ticket prestes a inativo     |
| **Erro**    | `destructive` | `#EF4444` (red-500)     | `#F87171` (red-400)     | Conexão falhou, ticket pendente urgente, ação destrutiva (excluir) |
| **Info**    | `info`        | `#3B82F6` (blue-500)    | `#60A5FA` (blue-400)    | Notas, dicas, info secundária                                      |

**Importante:**
- **Verde NÃO é cor primária** mesmo o WhatsApp sendo verde. Sky (azul) diferencia da identidade do app cliente.
- **Vermelho destructive ≠ vermelho de status `PENDING`** do ticket. Pendente usa âmbar/amarelo (atenção, aguardando), destructive usa vermelho-intenso (perigo, exclusão).

### 2.3 Cores neutras (escala de cinza)

Base do produto. Usar Slate do Tailwind (tonalidade neutro-azulada, casa com Sky).

| Token             | Light                 | Dark                  | Uso                                  |
| ----------------- | --------------------- | --------------------- | ------------------------------------ |
| `bg` (background) | `#FFFFFF`             | `#0F172A` (slate-900) | Fundo geral da app                   |
| `bg-subtle`       | `#F8FAFC` (slate-50)  | `#1E293B` (slate-800) | Fundo de seções secundárias, sidebar |
| `bg-muted`        | `#F1F5F9` (slate-100) | `#334155` (slate-700) | Fundo de cards inativos, badges      |
| `border`          | `#E2E8F0` (slate-200) | `#334155` (slate-700) | Bordas padrão                        |
| `border-subtle`   | `#F1F5F9` (slate-100) | `#1E293B` (slate-800) | Divisores discretos                  |
| `text`            | `#0F172A` (slate-900) | `#F8FAFC` (slate-50)  | Texto principal                      |
| `text-muted`      | `#64748B` (slate-500) | `#94A3B8` (slate-400) | Texto secundário, labels             |
| `text-subtle`     | `#94A3B8` (slate-400) | `#64748B` (slate-500) | Placeholders, texto desabilitado     |

### 2.4 Cores específicas do produto

**Status do ticket** (usadas em badges e bordas laterais de cards):

| Status                              | Light                            | Dark      |
| ----------------------------------- | -------------------------------- | --------- |
| `PENDING`                           | `#F59E0B` (warning)              | `#FBBF24` |
| `OPEN` (atribuído ao usuário atual) | `#10B981` (success)              | `#34D399` |
| `OPEN` (outro atendente)            | `#94A3B8` (slate-400)            | `#64748B` |
| `CLOSED`                            | `#94A3B8` (slate-400, esmaecido) | `#475569` |
| Fora da janela 24h                  | `#EF4444` (destructive, sutil)   | `#F87171` |

**Mensagens** (bolhas):

| Tipo                     | Light                            | Dark                        |
| ------------------------ | -------------------------------- | --------------------------- |
| Bolha entrante (cliente) | `#E0F2FE` (primary-100)          | `#075985` (primary-700)     |
| Bolha saída (atendente)  | `#FFFFFF` com borda              | `#1E293B` com borda         |
| Bolha saída (bot)        | `#FFFFFF` com borda + ícone robô | `#1E293B` com borda + ícone |
| Bolha sistema            | `#F1F5F9` (bg-muted) sutil       | `#334155`                   |

**Cores de tags/etiquetas:**

Tags são definidas pelo usuário (cor hex livre). Mas o seletor de cor expõe paleta sugerida com 12 cores acessíveis em ambos os temas:

```
Sky:     #0EA5E9    Indigo:  #6366F1    Violet:  #8B5CF6
Pink:    #EC4899    Rose:    #F43F5E    Red:     #EF4444
Orange:  #F97316    Amber:   #F59E0B    Lime:    #84CC16
Emerald: #10B981    Teal:    #14B8A6    Cyan:    #06B6D4
```

---

## 3. Tipografia

### 3.1 Família

**Geist Sans** para texto. **Geist Mono** para código (logs, IDs técnicos como protocolo `#NNNNN`).

Carregar via `next/font/google` ou pacote oficial. Auto-hospedagem, sem layout shift.

```typescript
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

<html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
```

### 3.2 Escala de tamanhos

| Token       | Tamanho | Line-height | Uso                              |
| ----------- | ------- | ----------- | -------------------------------- |
| `text-xs`   | 12px    | 16px        | Legendas, badges, timestamps     |
| `text-sm`   | 14px    | 20px        | Texto secundário, labels, botões |
| `text-base` | 16px    | 24px        | Texto primário (default)         |
| `text-lg`   | 18px    | 28px        | Texto destacado                  |
| `text-xl`   | 20px    | 28px        | Subtítulos                       |
| `text-2xl`  | 24px    | 32px        | Títulos de seção                 |
| `text-3xl`  | 30px    | 36px        | Títulos de página                |

### 3.3 Pesos

| Peso | Token Tailwind  | Uso                                 |
| ---- | --------------- | ----------------------------------- |
| 400  | `font-normal`   | Corpo padrão                        |
| 500  | `font-medium`   | Texto destacado, labels importantes |
| 600  | `font-semibold` | Títulos, botões primários           |
| 700  | `font-bold`     | Reservado, raro (pra ênfase forte)  |

### 3.4 Espaçamento de letras (letter-spacing)

- Default: normal (0)
- Títulos `text-2xl` e `text-3xl`: `tracking-tight` (-0.025em)
- Texto técnico/mono: normal

### 3.5 Sem fonte de título separada

Decisão consciente: uma família de fonte para tudo. Hierarquia via tamanho, peso e espaçamento. Reduz complexidade.

---

## 4. Espaçamento e layout

### 4.1 Escala de espaçamento (Tailwind padrão)

```
0.5 → 2px    1 → 4px      2 → 8px       3 → 12px
4 → 16px     5 → 20px     6 → 24px      8 → 32px
10 → 40px    12 → 48px    16 → 64px     20 → 80px
```

### 4.2 Padding padrão por contexto

| Contexto                         | Padding                                |
| -------------------------------- | -------------------------------------- |
| Card padrão                      | `p-4` (16px)                           |
| Card compacto (lista de tickets) | `p-3` (12px)                           |
| Painel lateral                   | `p-4`                                  |
| Modal                            | `p-6` (24px)                           |
| Página principal                 | `p-6`                                  |
| Botão                            | `px-4 py-2` (md) ou `px-3 py-1.5` (sm) |
| Input                            | `px-3 py-2`                            |

### 4.3 Border radius

| Elemento           | Token          | Valor |
| ------------------ | -------------- | ----- |
| Botão, input, card | `rounded-lg`   | 8px   |
| Badge, chip        | `rounded-md`   | 6px   |
| Avatar             | `rounded-full` | 50%   |
| Modal              | `rounded-xl`   | 12px  |
| Bolha de mensagem  | `rounded-2xl`  | 16px  |

### 4.4 Layout principal

**Atendimentos (tela mais usada):**
```
┌─────────────────────────────────────────────────────┐
│ Header global (h-14)                                │
├──────────┬─────────────────────────┬────────────────┤
│ Sidebar  │ Lista de tickets        │ Chat          │
│ ícones   │ (~315px)                │ + Painel info │
│ (~64px)  │                         │ (~380px)      │
│          │                         │               │
└──────────┴─────────────────────────┴────────────────┘
```

**Outras telas:** sidebar de ícones + área de conteúdo única.

### 4.5 Breakpoints

| Token | Largura | Uso                                  |
| ----- | ------- | ------------------------------------ |
| `sm`  | 640px   | Mobile horizontal                    |
| `md`  | 768px   | Tablet                               |
| `lg`  | 1024px  | Desktop pequeno (mínimo confortável) |
| `xl`  | 1280px  | Desktop padrão (target principal)    |
| `2xl` | 1536px  | Desktop grande                       |

**Decisão de produto:** o produto é **desktop-first**. Mobile responsivo limitado a leitura/aprovação básica. Atendimento full em desktop.

---

## 5. Componentes (base shadcn/ui)

Usaremos shadcn/ui como biblioteca base. Componentes copy-paste, customizáveis. Não é dependência npm — é código no nosso repo.

### 5.1 Componentes shadcn/ui que vamos usar

**Inputs e formulários:**
- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Slider`
- `Form` (com React Hook Form + Zod)
- `DatePicker`, `Combobox`

**Layout:**
- `Card`, `Sheet` (drawer lateral), `Dialog` (modal), `Drawer` (mobile)
- `Tabs`, `Accordion`, `Collapsible`
- `Separator`, `ScrollArea`

**Feedback:**
- `Toast` (notificações), `Alert`, `Badge`, `Progress`, `Skeleton`

**Navegação:**
- `Breadcrumb`, `Pagination`, `Command` (palette de comandos)
- `DropdownMenu`, `ContextMenu`, `Popover`, `HoverCard`, `Tooltip`

**Dados:**
- `Table`, `Avatar`

**Específicos a configurar:**
- `Toggle` (light/dark theme switcher)
- `Resizable` (panels redimensionáveis no atendimento)

### 5.2 Componentes customizados próprios (não vêm do shadcn)

- `TicketCard` (card na sidebar de tickets)
- `MessageBubble` (3 variantes: bot, atendente, sistema)
- `ChannelStatusCard` (card de canal com status)
- `WorkingHoursEditor` (editor visual de horário por dia)
- `ChatComposer` (composer livre + HSM)
- `ContactInfoPanel` (5 abas do painel lateral)

### 5.3 Padrão de variantes

Cada componente tem variantes consistentes. Exemplo do Button:

```typescript
variants: {
  variant: {
    primary: 'bg-primary text-white hover:bg-primary-600',
    secondary: 'bg-bg-muted text-text hover:bg-bg-muted/80',
    outline: 'border border-border bg-transparent hover:bg-bg-muted',
    ghost: 'bg-transparent hover:bg-bg-muted',
    destructive: 'bg-destructive text-white hover:bg-destructive/90',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  size: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4 text-sm',  // default
    lg: 'h-10 px-6 text-base',
    icon: 'h-9 w-9',
  },
}
```

---

## 6. Iconografia

### 6.1 Biblioteca

**lucide-react** (lib oficial usada pelo shadcn/ui). 1500+ ícones, consistentes, tree-shakable.

### 6.2 Tamanhos padrão

| Contexto        | Tamanho |
| --------------- | ------- |
| Inline em texto | 16px    |
| Botão padrão    | 16px    |
| Botão pequeno   | 14px    |
| Ícone de seção  | 20px    |
| Avatar fallback | 24px    |
| Empty state     | 48px    |

### 6.3 Stroke width

Default Lucide: 2. Mantemos.

### 6.4 Cores de ícones

Por padrão herdam cor do texto (`currentColor`). Quando precisa destaque, aplica cor primária ou semântica.

---

## 7. Estados e feedback

### 7.1 Estados de hover

- Botão primário: escurece 5-10% (de `primary-500` para `primary-600`)
- Card clicável: levanta levemente (sombra mais forte) ou bg muted
- Item de lista: bg `primary-50` (light) / `primary-900/30` (dark)

### 7.2 Estados de focus

Sempre visível. Outline azul `primary-500` com `ring-2 ring-offset-2`. Não use `outline: none` sem fallback.

### 7.3 Estados de loading

- **Skeleton:** `animate-pulse bg-bg-muted` para placeholders enquanto carrega
- **Spinner:** indicador circular pequeno em botões durante submit
- **Progress bar:** para uploads de mídia, sincronização de templates

### 7.4 Estados vazios

Importante. Vários lugares no produto começam vazios (sem departamentos, sem fluxos, sem mensagens). Sempre dar:

- Ícone (lucide-react, 48px)
- Título curto ("Nenhum ticket pendente")
- Descrição (1-2 linhas explicando)
- Ação principal quando fizer sentido ("Iniciar atendimento")

### 7.5 Toasts

- Sucesso: `success` color, ícone check, auto-dismiss 4s
- Erro: `destructive`, ícone X, fica até clicar
- Info: `info`, ícone i, auto-dismiss 4s
- Warning: `warning`, ícone alerta, auto-dismiss 6s

Posição: canto superior direito.

---

## 8. Acessibilidade

**Target: WCAG 2.1 AA.** Não AAA (rigoroso demais pro nosso uso), mas AA é não-negociável.

### 8.1 Contraste

- Texto normal: ratio mínimo 4.5:1 contra background
- Texto grande (18px+): ratio mínimo 3:1
- Componentes UI (bordas, ícones): ratio mínimo 3:1

Verificar com lighthouse/axe automaticamente em CI.

### 8.2 Foco

Todo elemento interativo tem foco visível (ring azul). Skip links no header pra navegação por teclado.

### 8.3 Labels e ARIA

- Todo input tem `<label>` associado
- Ícones-só-de-botão têm `aria-label`
- Modais têm `aria-labelledby` e `aria-describedby`
- Live regions para toasts e atualizações de status

### 8.4 Navegação por teclado

- Tab navega em ordem lógica
- Enter/Space ativa botões
- Esc fecha modais e popovers
- Arrow keys navegam em listas, menus, abas
- Cmd/Ctrl+K abre command palette (futuro)

---

## 9. Aplicação prática

### 9.1 Setup inicial do projeto

**Instalar shadcn/ui:**
```bash
pnpm dlx shadcn@latest init
```

Configuração sugerida:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Customizar tema em `app/globals.css`:**

Substituir variáveis padrão pelas cores do nosso design system. Sky como primary, Slate como neutral.

### 9.2 Como começar a montar o tema

Recomendo usar **Tweakcn** (https://tweakcn.com) para gerar tema visualmente:

1. Acesse Tweakcn
2. Configure cor primária Sky (`#0EA5E9`)
3. Configure base color Slate
4. Ajuste radius para 0.5rem (8px)
5. Configure fonte Geist
6. Exporte CSS variables
7. Cole em `globals.css`

Alternativa: copiar do shadcn theme generator (https://ui.shadcn.com/themes) e ajustar.

### 9.3 Themes prontos pra começar

Bons pontos de partida (todos shadcn/ui based):

- **Linear-like:** dense, dark-first, functional
- **Cal.com:** friendly, light-default, agendamento
- **Vercel Dashboard:** moderno, clean

Se quiser começar rápido, copiar tema do Cal.com bate bem com nossa identidade.

### 9.4 Toggle de tema

Implementar com `next-themes`:

```bash
pnpm add next-themes
```

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Toggle no header: ícone Sol/Lua, alterna entre `light`, `dark`, `system`.

### 9.5 Fontes Geist

```bash
pnpm add geist
```

```tsx
// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

Em `tailwind.config.ts`:
```typescript
fontFamily: {
  sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
}
```

---

## Anexo: Checklist de revisão visual

Antes de mergear PR com mudança visual, verificar:

- [ ] Funciona em light e dark
- [ ] Foco visível em todos os elementos interativos
- [ ] Contraste WCAG AA
- [ ] Espaçamento consistente com tokens (não pixels mágicos)
- [ ] Estados vazios tratados
- [ ] Estados de loading tratados
- [ ] Estados de erro tratados
- [ ] Responsividade até `sm` (mobile pode quebrar mas não pode ser inacessível)
- [ ] Ícones com `aria-label` quando necessário