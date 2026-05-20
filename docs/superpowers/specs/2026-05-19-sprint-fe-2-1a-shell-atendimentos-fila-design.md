# Sprint FE-2.1a — Shell de Atendimentos + fila + card + paginação

> Design doc. Frontend (`crm-web`). Raiz da fatia frontend Fase 2 (FE-2.1a→FE-2.6).
> Pareada com backend Fase 2 do `crm-api` (Sprints 2.1–2.5, PRs #85–#91, #92 snapshot, **#94 extensão do DTO de listagem**).
> Referência de planejamento canônica: `../crm-specs/ROADMAP.md` §"Fatia Frontend (`crm-web`)" → "### Fase 2 — sprints frontend" → "Sprint FE-2.1a".
> Cobertura visual: `crm-specs/audits/audit-06-atendimentos.md` §7.1, §7.3, D-ATEND-8, D-ATEND-11; Figma file `YM3nksRPHOPBNRnCFM4tpm` frame `24:2155` (referência incompleta — onde falta, audit-06 + `design-system.md` vencem).

## Objetivo

Tornar `/atendimentos` uma tela funcional: shell de 3 colunas + sidebar de fila populada por `GET /tickets` com cursor + virtualização. A coluna 1 (fila) é a entrega real; colunas 2 (thread) e 3 (detalhe) ficam como placeholders pra FE-2.2. Sem realtime, sem ações de estado, sem pin, sem ordenação configurável, sem filtro avançado — tudo isso vem em sub-sprints subsequentes.

## Restrições não-negociáveis (de CLAUDE.md + prompt da sprint)

- Server Components por padrão; `'use client'` só onde precisa interatividade.
- Tipos do Kubb (`@/lib/generated`); zero redeclaração de entidades de ticket localmente; sem `any`/`as Type` sem comentário.
- `lib/generated/` não editável; regerar via `pnpm generate:api:from-snapshot` e comitar snapshot + `lib/generated` juntos no PR (CLAUDE.md §15).
- Multi-tenant transparente: `companyId` nunca vai em request; vem do JWT.
- Cores semânticas + tokens shadcn baseline; reuso de componentes shadcn já presentes (Tabs, Badge, Avatar, Skeleton, Button).
- `font-sans = Geist Sans`, sem hardcode de cor.
- Sem `localStorage`/`sessionStorage`.
- Mensagens visíveis em pt-BR; identificadores em inglês.
- A11y WCAG AA: foco visível, tabs navegáveis por teclado, lista por ↑↓, `aria-busy` nos estados.
- Light + dark mode funcionando.
- Branch `feat/sprint-fe-2-1a-shell-atendimentos-fila` a partir de `origin/main`; sem push direto na main; PR via `gh`.
- Não fazer `git push` antes da validação manual completa (memória `feedback_no_push_until_validated`).

## Pré-requisitos validados (cross-repo)

- `crm-api` PR #94 mergeado → `crm-api/openapi.snapshot.json` (~19/05/2026 20:10) contém:
  - `TicketsListResponseDto.botCount: number` (top-level, required) — contagem agregada de tickets em fluxo de bot no escopo de visibilidade.
  - `TicketsListResponseDto.items[i].lastMessage: { content: string|null, type: MessageType } | null` — `content` pré-truncado em ~40 chars, `null` quando `type ≠ TEXT`.
  - `MessageType` enum: `TEXT, IMAGE, FILE, AUDIO, VIDEO, CONTACT, LOCATION, BUTTON_REPLY, LIST_REPLY, STICKER, TEMPLATE, SYSTEM`.
- `crm-api` PR #92 já havia destravado o snapshot (Fase 2 endpoints).
- `CompanySettingsResponseDto.hidePhoneFromAgents: boolean` presente no snapshot — sem gap pra mascaramento de telefone.
- Histórico do bloqueio em memória: `project_fase2_openapi_snapshot_blocker.md` (resolvido) e `project_fase2_tickets_list_dto_gap.md` (resolvido com a entrega desta sprint).

## Decisões do brainstorm

1. **Wrapper `useInfiniteQuery`**: Kubb não tem `infinite` configurado no `pluginReactQuery` (gera só `useQuery`/`useMutation`). Solução: hook em [hooks/use-tickets-infinite-query.ts](hooks/use-tickets-infinite-query.ts) que chama a função-cliente tipada gerada em `lib/generated/client` dentro de `useInfiniteQuery`. Não mexe na codegen; tipos continuam vindo do gerado.
2. **3 abas da fila (Figma 24:2155, audit-06 §7.1)**:
   - **Em atendimento** — ícone `MessageCircle` (Tabler `message-circle-user` → lucide `MessageCircle`); filtro `status=OPEN`; badge = `counts.OPEN`.
   - **Na fila** — ícone `Clock`; filtro `status=PENDING`; badge = `counts.PENDING`.
   - **Agente** — ícone `Bot` (Tabler `brand-github-copilot` → lucide `Bot`, melhor aproximação); filtro `inBotFlow=true`; badge = `botCount`.
   - Sem aba "Resolvidos" nesta sub-sprint (consistente com Figma).
3. **Aba default**: `Em atendimento` (atendente entra direto no que está atribuído a ele; backend já aplica visibilidade por role).
4. **`TicketCard` local em `app/(app)/atendimentos/components/`**: sem entrada no showcase `/configuracoes/design-system`. Justificativa: uso em 1 lugar, refactor de design futuro (decisão do humano). Promove pra `components/tickets/` se virar reusável (provavelmente FE-2.2 "Histórico" do painel lateral).
5. **Cores da borda lateral 3px** (audit-06 §D-ATEND-8 menciona mas não dá cor):
   - `PENDING` → `bg-amber-500` (design-system §Cores autoriza hex/`bg-amber-500` quando ausente do shadcn baseline).
   - `OPEN` → `bg-primary` (`#1b84ff`).
   - `CLOSED` → `bg-muted-foreground/40` (não aparece nesta sub-sprint, mas a regra fica documentada).
   - Tickets em modo bot (aba Agente) mantêm a borda do `status` do ticket — a aba já contextualiza bot.
6. **Labels do snippet por `MessageType`** (quando `content=null`):

   | type           | snippet               |
   | -------------- | --------------------- |
   | `TEXT`         | usa `content` literal |
   | `IMAGE`        | 📷 Imagem             |
   | `VIDEO`        | 🎥 Vídeo              |
   | `AUDIO`        | 🎤 Áudio              |
   | `FILE`         | 📎 Arquivo            |
   | `STICKER`      | 😀 Figurinha          |
   | `CONTACT`      | 👤 Contato            |
   | `LOCATION`     | 📍 Localização        |
   | `BUTTON_REPLY` | ▶ Resposta de botão   |
   | `LIST_REPLY`   | ▶ Resposta de lista   |
   | `TEMPLATE`     | 📋 Modelo             |
   | `SYSTEM`       | ⚙ Mensagem do sistema |

   Quando `lastMessage === null` (ticket sem mensagens), snippet vazio sem placeholder.

7. **Mascaramento de telefone**: respeita `CompanySettings.hidePhoneFromAgents`. Quando `true` e `contact.name` é `null`, mostra `••• ${last4}` (consistente com mascaramento de canais Sprint 1.4 Fase B). Quando `false`, mostra `formatBrPhone(phoneNumber)`. Quando `contact.name` existe, sempre mostra o nome (mascaramento só afeta o fallback).
8. **Avatar fallback**: iniciais do `contact.name` (até 2 letras); se `name=null`, ícone `<User />` lucide em `text-muted-foreground`. Sem foto (Contact não tem `avatarUrl` no MVP).
9. **Hora**: formato relativo curto (`agora`, `2m`, `1h`, `ontem`, `12/05`, `12/05/2025`); util puro em `lib/format-ticket-time.ts`, testável.
10. **Defaults menores**: `limit=50` por página; sem `sortBy` na FE-2.1a (usa default backend `LAST_MESSAGE_DESC`); `pinnedTickets` da response **ignorado** nesta sub-sprint (UI de pin é FE-2.1b); 3 queries TanStack independentes (uma por aba), todas `enabled=true` no mount pra alimentar badges + cache.

## Arquitetura

### Layout em arquivos

```
app/(app)/atendimentos/
├── page.tsx                          ← Server Component; shell de 3 colunas via CSS grid
├── error.tsx                         ← error boundary de rota
└── components/
    ├── atendimentos-shell.tsx        ← 'use client' — orquestrador (aba ativa, ticket selecionado)
    ├── queue-sidebar.tsx             ← 'use client' — coluna 1; header + tabs + lista virtualizada
    ├── queue-tabs.tsx                ← 'use client' — 3 abas (Radix Tabs) + badges de contagem
    ├── queue-list.tsx                ← 'use client' — virtualização + 4 estados
    ├── ticket-card.tsx               ← 'use client' — card por item
    ├── ticket-card-skeleton.tsx      ← skeleton 1:1 com a anatomia do card
    ├── ticket-snippet.tsx            ← decide entre content (TEXT) e ícone+label (mídia)
    ├── whatsapp-window-bar.tsx       ← barra 24h estática (cor pelo lastInboundAt no momento do render)
    ├── thread-placeholder.tsx        ← coluna 2; "Selecione um atendimento"
    └── detail-placeholder.tsx        ← coluna 3; placeholder análogo

hooks/
├── use-tickets-infinite-query.ts     ← wrapper genérico
└── use-resolve-ticket-refs.ts        ← lookup de nomes via cache (users/departments)

lib/
├── format-ticket-time.ts             ← util puro (testável)
└── format-br-phone.ts                ← reusar se já existir (Sprint 1.4 introduziu MaskedPhoneInput; verificar helper)
```

### Layout em CSS

`page.tsx` (Server):

```tsx
<div className="divide-border grid h-full grid-cols-1 divide-x md:grid-cols-[400px_1fr_360px]">
  <AtendimentosShell />
</div>
```

- Coluna 1 (fila) = 400px fixo (Figma frame 24:2159 ≈ 400px).
- Coluna 2 (thread) = `1fr`.
- Coluna 3 (detalhe) = 360px fixo.
- Em `< md` (≤768px): só coluna 1, demais escondidas (`hidden md:block`). MVP desktop-first.

### Estado e orquestração

`AtendimentosShell` (Client) mantém:

- `activeTab: 'open' | 'pending' | 'bot'` (default `'open'`).
- `selectedTicketId: string | null` (clique em card armazena; coluna 2 placeholder ignora por enquanto).

Sem realtime; sem Zustand pra estado tão local; `useState` chega.

## Fluxo de dados

### Wrapper `useTicketsInfiniteQuery`

```ts
// Esboço — código final pode variar nos nomes exatos do client gerado
import { useInfiniteQuery } from '@tanstack/react-query';
import { ticketsControllerList } from '@/lib/generated/client';

type ClientParams = Parameters<typeof ticketsControllerList>[0];
export type TicketsListFilters = Omit<ClientParams, 'cursor' | 'limit'>;

export function useTicketsInfiniteQuery(filters: TicketsListFilters) {
  return useInfiniteQuery({
    queryKey: ['tickets', 'list', filters],
    queryFn: ({ pageParam }) => ticketsControllerList({ ...filters, cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.nextCursor : undefined),
    staleTime: 30_000,
  });
}
```

- Função-cliente real (`ticketsControllerList` ou nome equivalente gerado pelo Kubb) será confirmada após `pnpm generate:api:from-snapshot`; o spec não trava no nome.
- 3 invocações no `QueueSidebar`, uma por aba. Filtros: `{ status: ['OPEN'] }`, `{ status: ['PENDING'] }`, `{ inBotFlow: true }`.
- Todas `enabled: true` desde o mount: alimenta badges das 3 abas imediatamente e torna troca de aba instantânea.
- Custo: 3 requests pequenos no primeiro carregamento; aceitável.

### Badges das 3 abas

Lidos da response da própria query (não cruzam):

- Em atendimento → `data.pages[0].counts.OPEN`
- Na fila → `data.pages[0].counts.PENDING`
- Agente → `data.pages[0].botCount`

Sem recontar no client. Cada query agrega no seu próprio escopo de visibilidade (já filtrado por role + multi-tenant pelo backend, audit-06 §5.1).

### Resolução de nomes pros chips

```ts
// hooks/use-resolve-ticket-refs.ts (esboço)
import { useUsersControllerList } from '@/lib/generated/hooks';
import { useDepartmentsControllerList } from '@/lib/generated/hooks';
import { useMemo } from 'react';

export function useResolveTicketRefs() {
  const usersQ = useUsersControllerList();
  const departmentsQ = useDepartmentsControllerList();
  const userById = useMemo(() => new Map((usersQ.data ?? []).map((u) => [u.id, u])), [usersQ.data]);
  const departmentById = useMemo(
    () => new Map((departmentsQ.data ?? []).map((d) => [d.id, d])),
    [departmentsQ.data],
  );
  return {
    userById,
    departmentById,
    isResolved: !!usersQ.data && !!departmentsQ.data,
  };
}
```

- Hooks Kubb já gerados (existem nas listas atuais).
- Quando `isResolved=false`, chips do card mostram traço `—` em `text-muted-foreground`. Sem hydration boundary do server pra evitar complexidade extra no MVP.
- Multi-tenant transparente (backend filtra pelo JWT).

### `CompanySettings`

Hook `useCompanySettings()` (wrapper sobre o hook gerado correspondente a `GET /companies/me/settings`) lido pelo `TicketCard` pra decidir o caminho de mascaramento. Confirmar nome exato após regeneração.

## UI e composição visual

### QueueSidebar

```
┌─ Header (p-6 design-system) ─────────────────┐
│ Atendimentos          [⚙ filtros — disabled] │
├─ Tabs (Radix shadcn) ────────────────────────┤
│ [💬 Em atendimento 12] [⏱ Na fila 5] [🤖 Agente 0] │
├─ Lista virtualizada (aba ativa) ─────────────┤
│ ┌─ Ticket card (~123px) ──┐                  │
│ │ ...                     │                  │
│ └─────────────────────────┘                  │
│ ... scroll infinito (sentinel no bottom) ... │
└──────────────────────────────────────────────┘
```

- Header segue o pattern de telas de Configurações do design-system (wrapper `p-6`, `<h1>` `text-2xl font-semibold`).
- Botão de filtro avançado fica **disabled** com tooltip "Disponível em breve" (slot reservado pra FE-2.1b).

### QueueTabs

- `<Tabs>` shadcn (Radix). Cada `<TabsTrigger>` = `ícone + label + <Badge>contagem</Badge>`.
- Estado ativo: underline em `border-primary` (design-system §Tabs).
- Badge: pill `bg-primary text-primary-foreground text-xs`.

### QueueList — estados

| Estado                    | Render                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isPending`               | 6× `<TicketCardSkeleton />`                                                                                                                                            |
| `isError`                 | Centralizado: ícone `AlertCircle`, "Erro ao carregar atendimentos.", `<Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>`         |
| `data.items.length === 0` | Centralizado: ícone `Inbox`, "Nenhum atendimento aqui." (sem CTA)                                                                                                      |
| `data.items.length > 0`   | `useVirtualizer<HTMLDivElement>({ count, estimateSize: () => 123, overscan: 3 })`. Sentinel no final dispara `fetchNextPage()` se `hasNextPage && !isFetchingNextPage` |
| `isFetchingNextPage`      | Spinner pequeno em item virtualizado adicional ao final                                                                                                                |

A11y:

- `<Tabs>` Radix → ARIA correto.
- Container da lista: `role="list"`, `aria-busy={isPending}`, `aria-label="Fila de atendimentos"`.
- Cards: `role="listitem"`, `tabIndex=0`, foco visível default Tailwind; Enter/Space dispara seleção; ↑/↓ entre cards via handler manual no container (sem dependência de `roving-tabindex`).

### TicketCard — anatomia final (~123px)

```
┌─[3px borda lateral por status]─────────────────────────────┐
│  ┌──┐  Nome do contato (ou número mascarado)   18:32       │
│  │A │  #00342                            [unread 3]         │
│  └──┘                                                       │
│       Conteúdo do snippet truncado pelo bac…               │
│       [chip depto] [chip atendente] +N tags                │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░░  ← barra 24h (verde/amber/red)    │
│                                                       [⋮]   │  ← slot do menu vazio FE-2.1a
└────────────────────────────────────────────────────────────┘
```

Detalhes:

- **Avatar** 48px, `radius/full`. Fallback: iniciais do `contact.name` (até 2 letras); se `name=null`, ícone `<User />` lucide em `text-muted-foreground`.
- **Nome / número mascarado** (`font-semibold text-sm text-foreground`):
  - `contact.name` existe → nome.
  - Sem nome E `hidePhoneFromAgents=false` → `formatBrPhone(phoneNumber)`.
  - Sem nome E `hidePhoneFromAgents=true` → `••• ${last4(phoneNumber)}`.
- **Hora** (`lastMessageAt`): `formatTicketTime(date)` (util puro). Fallback `null` → não renderiza hora.
- **Protocolo `#NNNNN`**: `text-xs font-mono text-muted-foreground` abaixo do nome (audit-06 D-ATEND-11).
- **Snippet** via `<TicketSnippet lastMessage={...}>`: `type=TEXT` → `content`; senão, ícone + label da tabela acima. `text-sm text-muted-foreground line-clamp-1`.
- **Chips depto/atendente**: `<Badge variant="secondary">`. Esconde quando id é `null` (não mostra "Sem atendente"). Enquanto `useResolveTicketRefs().isResolved === false`, renderiza traço `—`.
- **Tags**: pill com `style={{ backgroundColor: tag.color, color: contrastColor(tag.color) }}`; max 3 visíveis + `+N`. `contrastColor` é util pequeno (relativa luminância → branco/preto).
- **Badge unread**: pill `bg-destructive text-destructive-foreground text-xs` no canto superior direito quando `unreadCount > 0`.
- **Borda lateral 3px à esquerda** (mapa de cores na decisão 5).
- **Barra 24h** (componente `<WhatsappWindowBar lastInboundAt inWhatsappWindow />`):
  - Horas restantes = `24 - hoursElapsed(now, lastInboundAt)`.
  - `>12h` verde; `6–12h` verde 60% width; `1–6h` amber; `<1h` red + animação pulse.
  - `inWhatsappWindow=false` ou `lastInboundAt=null` → não renderiza barra (sem texto "expirada" nesta sub-sprint; isso vem com composer FE-2.3).
  - **Estática** no momento do render (sem timer/setInterval na FE-2.1a). Atualização real-time fica pra FE-2.5.
- **Slot `⋮`** (`<Button variant="ghost" size="sm">` desabilitado): reserva visual, sem menu nesta sub-sprint.
- **Hover**: `hover:bg-muted/50 cursor-pointer`. Sem mudança de sombra (a borda lateral já segmenta o card).

### Server vs Client (resumo)

- `page.tsx` (Server) — renderiza grid + `<AtendimentosShell />`.
- `error.tsx` (Client por convenção do App Router) — fallback de erro de rota.
- `AtendimentosShell`, `QueueSidebar`, `QueueTabs`, `QueueList`, `TicketCard`, `TicketCardSkeleton`, `TicketSnippet`, `WhatsappWindowBar` — todos Client (`'use client'`), pois consumem TanStack Query, eventos, ou ambos.
- `ThreadPlaceholder` e `DetailPlaceholder` — Server (estáticos).

## Estratégia de tipos

- Origem única: `lib/generated/types/`.
- Aliases locais permitidos (zero duplicação):

```ts
type ClientParams = Parameters<typeof ticketsControllerList>[0];
export type TicketsListFilters = Omit<ClientParams, 'cursor' | 'limit'>;

import type { TicketsListResponseDto } from '@/lib/generated/types';
type TicketListItem = TicketsListResponseDto['items'][number];
```

- Props do `TicketCard`: `ticket: TicketListItem` + `assignedUserName?: string` + `departmentName?: string` + `isSelected: boolean` + `onSelect: (id: string) => void`.
- `TicketSnippet` faz `switch (lastMessage.type)` exaustivo com `satisfies Record<MessageType, ReactNode>` pra forçar TS a quebrar se backend adicionar valor no enum.
- Sem `any`/`as Type`.

## Testes (Vitest)

| Alvo                                  | Casos mínimos                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `lib/format-ticket-time.ts`           | `agora` / `2m` / `59m` / `1h` / `23h` / `ontem` / `12/05` / `12/05/2025` (>365 dias)                                |
| `lib/format-br-phone.ts` (ou reuso)   | formato completo `+55 (11) 9XXXX-XXXX`; máscara `••• 1234`; entrada inválida → fallback                             |
| `lib/contrast-color.ts`               | tag preta → texto branco; tag clara → texto preto; cor inválida → fallback `text-foreground`                        |
| `hooks/use-tickets-infinite-query.ts` | `getNextPageParam` retorna `nextCursor` quando `hasMore=true`; retorna `undefined` quando `hasMore=false`           |
| `hooks/use-resolve-ticket-refs.ts`    | builds maps id→entity; `isResolved=false` enquanto qualquer lista pendente; `true` quando ambas resolveram          |
| `components/.../ticket-snippet.tsx`   | renderiza `content` quando `type=TEXT`; renderiza label correto pra cada um dos outros 11 enum values (data-driven) |
| `components/.../ticket-card.tsx`      | sem teste unitário (visual puro; validação manual + futuro showcase)                                                |
| `components/.../queue-tabs.tsx`       | sem teste (Radix + props simples)                                                                                   |
| `components/.../queue-list.tsx`       | sem teste unitário (lógica vem da lib de virtualização; estados são compositivos)                                   |

Antes de criar `format-br-phone`, verificar reuso a partir do `MaskedPhoneInput` shared (Sprint 1.4 Fase B).

## Escopo — o que NÃO entra

- Coluna 2 (thread) e coluna 3 (detalhe + painel lateral) → **FE-2.2**
- Pin/desfixar + seção "Fixados" + menu `⋮` funcional → **FE-2.1b**
- Dropdown "Ordenar por" + filtro avançado funcional → **FE-2.1b**
- Composer, mutations de aceitar/transferir/fechar → **FE-2.3 / FE-2.4**
- Realtime Socket.IO → **FE-2.5**
- Validação manual e2e 16 cenários → **FE-2.6**
- Atualização em tempo real da barra 24h → **FE-2.5** (estática nesta sub-sprint)

## Verificação local (gate, não promessas)

1. Copiar snapshot: `cp ../crm-api/openapi.snapshot.json ./openapi.snapshot.json`.
2. `pnpm generate:api:from-snapshot` → `git diff --exit-code lib/generated` zero (após comitar o gerado).
3. Comitar `openapi.snapshot.json` + `lib/generated/` juntos no PR (CLAUDE.md §15).
4. `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` — tudo verde.
5. `pnpm dev` sobe; em `/atendimentos`:
   - shell de 3 colunas visível (≥ md)
   - 3 abas com badges; troca instantânea após primeira carga
   - card com nome/protocolo/snippet/chips/borda lateral/barra 24h coerentes
   - scroll infinito carrega `limit=50` por chunk, virtualização suave
   - empty/error/loading reproduzíveis (conta limpa → empty; matar crm-api → error)
   - light/dark mode OK
6. `pnpm build` **fora** do gate local (CLAUDE.md §11). CI roda no PR.
7. `git push` **só após** validação manual completa contigo (memória `feedback_no_push_until_validated`).

## Pós-merge — atualizações canônicas (mesma sessão)

- `../crm-specs/ROADMAP.md`:
  - Marcar checkboxes da Sprint FE-2.1a (linhas 1041–1046 da versão atual) com `[x] (PR #NN, 2026-05-19)`.
  - Atualizar tabela de rastreamento (linha Fase 2 → próxima sub-sprint `FE-2.1b`).
  - Bumpar versão/data do cabeçalho.
- `../crm-specs/ARCHITECTURE.md` §4 Stack `crm-web`: adicionar linha `@tanstack/react-virtual | latest | Virtualização da fila de tickets (Sprint FE-2.1a)`.
- Commit + `git push` direto na `main` do `crm-specs` (sem CI/branch-protection — memória `feedback_bundle_roadmap_sync_pr`).
- Citar SHA do commit do `crm-specs` na descrição do PR de código.
- **Não** abrir PR de "atualização de doc" separado depois.

## Riscos e mitigações

| Risco                                                                                   | Mitigação                                                                                                                    |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Nome real da função-cliente gerada pelo Kubb difere do esboço (`ticketsControllerList`) | Após `pnpm generate:api:from-snapshot`, ajustar import; spec não trava no nome                                               |
| Virtualizer + carga assíncrona causa "jump" ao crescer a lista                          | `estimateSize` calibrado em 123px (rich card); overscan 3 atenua; teste manual com 200+ items                                |
| Lista grande renderiza lento na primeira pintura                                        | 6 skeletons no estado pending evita branco; primeiro chunk de 50 cabe na viewport sem virtualização precisar trabalhar muito |
| Cache do TanStack pra users/departments fica stale                                      | Backend dessas listas é pequeno e raramente muda; `staleTime` default; aceitar                                               |
| Backend retorna campo enum novo no `MessageType` que `TicketSnippet` não trata          | `satisfies Record<MessageType, ReactNode>` quebra o TS no build; CI pega antes de mergear                                    |
| Mobile (≤ md) com só coluna 1 — usuário não chega na thread                             | FE-2.2 implementa navegação mobile (rota por ticket); por ora, MVP desktop-first é o documentado                             |
