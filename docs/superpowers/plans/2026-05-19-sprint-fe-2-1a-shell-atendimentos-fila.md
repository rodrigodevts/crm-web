# Sprint FE-2.1a — Shell de Atendimentos + fila + card + paginação — Plano de Execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a rota `/atendimentos` com shell de 3 colunas e a sidebar de fila funcional (3 abas, infinite scroll virtualizado, card rico com snippet/protocolo/chips/borda lateral/barra 24h), consumindo `GET /tickets` via wrapper `useInfiniteQuery` em cima do client Kubb regenerado contra o snapshot Fase 2 do crm-api.

**Architecture:** Server Component em `page.tsx` define o grid CSS de 3 colunas; um único Client orchestrator (`AtendimentosShell`) gerencia aba ativa + ticket selecionado e monta `QueueSidebar` (1ª coluna, real) + placeholders (2ª e 3ª, FE-2.2). 3 invocações independentes de um wrapper `useInfiniteQuery` (uma por aba) alimentam badges e listas; virtualização via `@tanstack/react-virtual`. Nomes de atendente/depto vêm de listas pré-existentes (cache TanStack Query). Sem realtime, sem ações de estado (FE-2.5/FE-2.4).

**Tech Stack:** Next.js 16 App Router (Server + Client Components), React 19, TanStack Query 5 (`useInfiniteQuery`), `@tanstack/react-virtual` (nova dep), Tailwind 4 + shadcn/ui baseline, Kubb-generated client/types (`@/lib/generated`), Vitest 4 + jsdom + `@testing-library/react` 16, lucide-react.

**Branch:** `feat/sprint-fe-2-1a-shell-atendimentos-fila` (já criada, com spec commitado). Spec canônico: [docs/superpowers/specs/2026-05-19-sprint-fe-2-1a-shell-atendimentos-fila-design.md](docs/superpowers/specs/2026-05-19-sprint-fe-2-1a-shell-atendimentos-fila-design.md).

---

## File Structure

```
crm-web/
├── openapi.snapshot.json                                      MODIFY (Task 0)
├── lib/generated/                                             REGEN (Task 0)
├── package.json                                               MODIFY (Task 1)
├── lib/
│   ├── format-ticket-time.ts                                  CREATE (Task 2)
│   ├── format-ticket-time.test.ts                             CREATE (Task 2)
│   ├── format-br-phone.ts                                     CREATE (Task 3)
│   ├── format-br-phone.test.ts                                CREATE (Task 3)
│   ├── contrast-color.ts                                      CREATE (Task 4)
│   ├── contrast-color.test.ts                                 CREATE (Task 4)
│   └── tickets-list-helpers.ts                                CREATE (Task 5/6)
├── hooks/
│   ├── use-tickets-infinite-query.ts                          CREATE (Task 5)
│   ├── use-tickets-infinite-query.test.ts                     CREATE (Task 5)
│   ├── use-resolve-ticket-refs.ts                             CREATE (Task 6)
│   └── use-resolve-ticket-refs.test.ts                        CREATE (Task 6)
├── components/ui/                                             (reuso de existentes)
└── app/(app)/atendimentos/
    ├── page.tsx                                               MODIFY (Task 16)
    ├── error.tsx                                              CREATE (Task 16)
    └── components/
        ├── atendimentos-shell.tsx                             CREATE (Task 15)
        ├── queue-sidebar.tsx                                  CREATE (Task 14)
        ├── queue-tabs.tsx                                     CREATE (Task 12)
        ├── queue-list.tsx                                     CREATE (Task 13)
        ├── ticket-card.tsx                                    CREATE (Task 10)
        ├── ticket-card-skeleton.tsx                           CREATE (Task 9)
        ├── ticket-snippet.tsx                                 CREATE (Task 7)
        ├── ticket-snippet.test.tsx                            CREATE (Task 7)
        ├── whatsapp-window-bar.tsx                            CREATE (Task 8)
        ├── thread-placeholder.tsx                             CREATE (Task 11)
        └── detail-placeholder.tsx                             CREATE (Task 11)
```

Por responsabilidade: utils puros em `lib/` (testáveis sem React); hooks em `hooks/`; UI específica de Atendimentos em `app/(app)/atendimentos/components/` (não promove pra `components/` global — decisão do brainstorm).

---

## Task 0: Snapshot do crm-api + regeneração Kubb

**Files:**

- Modify: `openapi.snapshot.json`
- Regenerate: `lib/generated/**` (gerado, não editar à mão)

- [ ] **Step 1: Copiar o snapshot do crm-api**

```bash
cp ../crm-api/openapi.snapshot.json ./openapi.snapshot.json
```

- [ ] **Step 2: Verificar que o snapshot copiado contém os campos da Fase 2 + extensões (#94)**

```bash
python3 -c "
import json
d=json.load(open('openapi.snapshot.json'))
ps=set(d['paths'])
req=['/api/v1/tickets','/api/v1/me/ticket-preferences','/api/v1/tickets/{id}/accept','/api/v1/tickets/{id}/pin']
miss=[r for r in req if r not in ps]
assert not miss, 'Paths faltando: '+str(miss)
s=d['components']['schemas']['TicketsListResponseDto']
assert 'botCount' in s['properties'], 'botCount ausente'
item=s['properties']['items']['items']['properties']
assert 'lastMessage' in item, 'lastMessage ausente em items[i]'
print('OK — snapshot tem 56+ paths, botCount e items[i].lastMessage presentes')
"
```

Expected: `OK — snapshot tem 56+ paths, botCount e items[i].lastMessage presentes`. Se quebrar, abortar e reportar gap (não shimar).

- [ ] **Step 3: Regenerar lib/generated**

```bash
pnpm generate:api:from-snapshot
```

Expected: kubb conclui sem erro; lista de arquivos gerados inclui `useTicketsControllerList`, `useUserTicketPreferencesController*`, `ticketsControllerList` (client function), etc.

- [ ] **Step 4: Confirmar os nomes reais exportados**

```bash
ls lib/generated/client/ | grep -E "tickets|userTicketPreferences" | head
ls lib/generated/hooks/  | grep -E "Tickets|UserTicketPreferences" | head
grep -E "^export" lib/generated/index.ts | grep -i "ticket" | head -20
```

Expected: existe `lib/generated/client/ticketsControllerList.ts` exportando `ticketsControllerList`; existe `lib/generated/hooks/useTicketsControllerList.ts` exportando hook homônimo. Anotar quaisquer diferenças de nome — se o Kubb gerou nome diferente (improvável dado o padrão do repo), atualizar nos imports das Tasks 5, 6, 7, 10. **Se diferente, atualizar antes de commitar e seguir; o resto do plano usa `ticketsControllerList` e `useUsersControllerList`/`useDepartmentsControllerList`/`useCompaniesControllerGetMeSettings` (já existentes pré-Fase-2).**

- [ ] **Step 5: Confirmar zero diff "drift" — `lib/generated` é exatamente o que sai do snapshot**

```bash
git add openapi.snapshot.json lib/generated
git status --short
```

Expected: muitos arquivos novos/modificados em `lib/generated/` + `openapi.snapshot.json` modificado. Isso é o snapshot + código gerado coerentes (mesma origem). Após o commit, qualquer mudança futura em `lib/generated` sem mudança em `openapi.snapshot.json` deve quebrar o CI (regra de drift).

- [ ] **Step 6: Commit do snapshot + lib/generated juntos (CLAUDE.md §15)**

```bash
git commit -m "chore(generated): regenera lib/generated contra snapshot Fase 2 do crm-api

Snapshot copiado de crm-api (PR #94: TicketsListResponseDto.botCount +
items[i].lastMessage). Habilita Sprint FE-2.1a (shell de Atendimentos)."
```

Expected: commit gera + lefthook format passa.

---

## Task 1: Adicionar dependência `@tanstack/react-virtual`

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Adicionar a dep aprovada**

```bash
pnpm add @tanstack/react-virtual@latest
```

Expected: instala a lib (versão atual ~3.x); lockfile atualiza.

- [ ] **Step 2: Verificar versão exata + alinhamento com `@tanstack/react-query` (mesmo ecossistema)**

```bash
node -e "const p=require('./package.json'); console.log('react-virtual:', p.dependencies['@tanstack/react-virtual']); console.log('react-query:', p.dependencies['@tanstack/react-query']);"
```

Expected: ambas listadas; versões podem divergir (são libs independentes do guarda-chuva TanStack).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat(deps): adiciona @tanstack/react-virtual para a fila de Atendimentos

Aprovada no ROADMAP §1032 (decisão 19/05/2026, fechada via CLAUDE.md §6).
Registro canônico em ../crm-specs/ARCHITECTURE.md §4 é atualizado no pós-merge
desta sprint (Task 19)."
```

Expected: 2 arquivos modificados, lefthook format passa.

---

## Task 2: `lib/format-ticket-time.ts` (TDD)

**Files:**

- Create: `lib/format-ticket-time.ts`
- Test: `lib/format-ticket-time.test.ts`

**Contrato:**

- Input: `Date | string | null` (string ISO vinda da API; `null` retorna `''`).
- Output: `'agora'` (<60s), `'Nm'` (1–59min), `'Nh'` (1–23h), `'ontem'` (24–47h), `'dd/MM'` (48h–365d), `'dd/MM/yyyy'` (>365d).
- Sem libs externas (`Intl.DateTimeFormat` chega); locale `pt-BR`.
- Aceita parâmetro opcional `now?: Date` pra testabilidade (default `new Date()`).

- [ ] **Step 1: Escrever o teste falhando**

```ts
// lib/format-ticket-time.test.ts
import { describe, it, expect } from 'vitest';
import { formatTicketTime } from './format-ticket-time';

const NOW = new Date('2026-05-19T20:00:00Z');

describe('formatTicketTime', () => {
  it('retorna "agora" para diferença < 60s', () => {
    const d = new Date('2026-05-19T19:59:30Z');
    expect(formatTicketTime(d, NOW)).toBe('agora');
  });

  it('retorna "Nm" para diferença entre 1 e 59 minutos', () => {
    expect(formatTicketTime(new Date('2026-05-19T19:58:00Z'), NOW)).toBe('2m');
    expect(formatTicketTime(new Date('2026-05-19T19:01:00Z'), NOW)).toBe('59m');
  });

  it('retorna "Nh" para diferença entre 1 e 23 horas', () => {
    expect(formatTicketTime(new Date('2026-05-19T19:00:00Z'), NOW)).toBe('1h');
    expect(formatTicketTime(new Date('2026-05-18T21:00:00Z'), NOW)).toBe('23h');
  });

  it('retorna "ontem" para diferença entre 24 e 47 horas', () => {
    expect(formatTicketTime(new Date('2026-05-18T20:00:00Z'), NOW)).toBe('ontem');
    expect(formatTicketTime(new Date('2026-05-17T21:00:00Z'), NOW)).toBe('ontem');
  });

  it('retorna "dd/MM" para diferença entre 48h e 365 dias (mesmo ano)', () => {
    expect(formatTicketTime(new Date('2026-05-12T20:00:00Z'), NOW)).toBe('12/05');
  });

  it('retorna "dd/MM/yyyy" para diferença > 365 dias', () => {
    expect(formatTicketTime(new Date('2024-12-01T20:00:00Z'), NOW)).toBe('01/12/2024');
  });

  it('aceita string ISO', () => {
    expect(formatTicketTime('2026-05-19T19:00:00Z', NOW)).toBe('1h');
  });

  it('retorna string vazia para null', () => {
    expect(formatTicketTime(null, NOW)).toBe('');
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
pnpm test lib/format-ticket-time.test.ts
```

Expected: erro `Cannot find module './format-ticket-time'` (o arquivo ainda não existe).

- [ ] **Step 3: Implementação mínima que faz os testes passarem**

```ts
// lib/format-ticket-time.ts
const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatTicketTime(value: Date | string | null, now: Date = new Date()): string {
  if (value === null) return '';
  const d = value instanceof Date ? value : new Date(value);
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'agora';
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h`;
  if (diff < 2 * DAY_MS) return 'ontem';
  if (diff <= YEAR_MS) return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
```

- [ ] **Step 4: Rodar e confirmar passa**

```bash
pnpm test lib/format-ticket-time.test.ts
```

Expected: 8 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add lib/format-ticket-time.ts lib/format-ticket-time.test.ts
git commit -m "feat(lib): formatTicketTime — agora/Nm/Nh/ontem/dd-MM"
```

---

## Task 3: `lib/format-br-phone.ts` (TDD — reuso + mascaramento)

**Files:**

- Create: `lib/format-br-phone.ts` (combina `formatPhoneDigits` existente em `components/ui/masked-phone-input.tsx` + nova `maskBrPhone`)
- Test: `lib/format-br-phone.test.ts`

**Contrato:**

- `formatBrPhone(input: string): string` — wrapper sobre `formatPhoneDigits` existente; remove caracteres não-numéricos da entrada antes de chamar; retorna `''` para entrada vazia/inválida.
- `maskBrPhone(input: string): string` — retorna `••• 1234` (3 bolinhas + espaço + últimos 4 dígitos). Para entradas com menos de 4 dígitos, retorna `'•••'`. Vazia → `''`.

- [ ] **Step 1: Escrever o teste falhando**

```ts
// lib/format-br-phone.test.ts
import { describe, it, expect } from 'vitest';
import { formatBrPhone, maskBrPhone } from './format-br-phone';

describe('formatBrPhone', () => {
  it('formata celular brasileiro (13 dígitos)', () => {
    expect(formatBrPhone('5511999998888')).toBe('+55 (11) 99999-8888');
  });

  it('formata fixo brasileiro (12 dígitos)', () => {
    expect(formatBrPhone('551133334444')).toBe('+55 (11) 3333-4444');
  });

  it('limpa caracteres não-numéricos antes de formatar', () => {
    expect(formatBrPhone('+55 (11) 99999-8888')).toBe('+55 (11) 99999-8888');
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(formatBrPhone('')).toBe('');
  });
});

describe('maskBrPhone', () => {
  it('mascara mantendo últimos 4 dígitos', () => {
    expect(maskBrPhone('5511999998888')).toBe('••• 8888');
  });

  it('limpa caracteres não-numéricos antes de mascarar', () => {
    expect(maskBrPhone('+55 (11) 99999-8888')).toBe('••• 8888');
  });

  it('retorna •••  para entradas com < 4 dígitos', () => {
    expect(maskBrPhone('123')).toBe('•••');
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(maskBrPhone('')).toBe('');
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
pnpm test lib/format-br-phone.test.ts
```

Expected: `Cannot find module './format-br-phone'`.

- [ ] **Step 3: Implementação**

```ts
// lib/format-br-phone.ts
import { formatPhoneDigits } from '@/components/ui/masked-phone-input';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatBrPhone(input: string): string {
  const d = digitsOnly(input);
  if (!d) return '';
  return formatPhoneDigits(d);
}

export function maskBrPhone(input: string): string {
  const d = digitsOnly(input);
  if (!d) return '';
  if (d.length < 4) return '•••';
  return `••• ${d.slice(-4)}`;
}
```

- [ ] **Step 4: Rodar e confirmar passa**

```bash
pnpm test lib/format-br-phone.test.ts
```

Expected: 8 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add lib/format-br-phone.ts lib/format-br-phone.test.ts
git commit -m "feat(lib): formatBrPhone + maskBrPhone (reusa formatPhoneDigits da Sprint 1.4)"
```

---

## Task 4: `lib/contrast-color.ts` (TDD)

**Files:**

- Create: `lib/contrast-color.ts`
- Test: `lib/contrast-color.test.ts`

**Contrato:**

- `contrastTextColor(hex: string): 'white' | 'black'` — relativa luminância (fórmula sRGB simplificada). `'white'` para fundos escuros (luminância <0.5), `'black'` pra claros. Entrada inválida → `'black'` (fallback seguro).

- [ ] **Step 1: Escrever o teste falhando**

```ts
// lib/contrast-color.test.ts
import { describe, it, expect } from 'vitest';
import { contrastTextColor } from './contrast-color';

describe('contrastTextColor', () => {
  it('retorna white para fundos escuros', () => {
    expect(contrastTextColor('#000000')).toBe('white');
    expect(contrastTextColor('#1b84ff')).toBe('white'); // primary
  });

  it('retorna black para fundos claros', () => {
    expect(contrastTextColor('#ffffff')).toBe('black');
    expect(contrastTextColor('#fef3c7')).toBe('black'); // amber-100
  });

  it('aceita hex sem #', () => {
    expect(contrastTextColor('ffffff')).toBe('black');
  });

  it('aceita hex de 3 chars (shorthand)', () => {
    expect(contrastTextColor('#fff')).toBe('black');
    expect(contrastTextColor('#000')).toBe('white');
  });

  it('retorna black como fallback para entrada inválida', () => {
    expect(contrastTextColor('not-a-color')).toBe('black');
    expect(contrastTextColor('')).toBe('black');
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
pnpm test lib/contrast-color.test.ts
```

Expected: `Cannot find module './contrast-color'`.

- [ ] **Step 3: Implementação**

```ts
// lib/contrast-color.ts
// Calcula relativa luminância simplificada (sRGB linear → coeficientes BT.709).
// Não é WCAG-completo (sem gamma correction), mas suficiente pra escolher texto
// branco vs preto em cima de cores arbitrárias de tag.
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3 && /^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0]! + clean[0]!, 16);
    const g = parseInt(clean[1]! + clean[1]!, 16);
    const b = parseInt(clean[2]! + clean[2]!, 16);
    return { r, g, b };
  }
  if (clean.length === 6 && /^[0-9a-fA-F]{6}$/.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

export function contrastTextColor(hex: string): 'white' | 'black' {
  const rgb = parseHex(hex);
  if (!rgb) return 'black';
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return lum < 0.5 ? 'white' : 'black';
}
```

- [ ] **Step 4: Rodar e confirmar passa**

```bash
pnpm test lib/contrast-color.test.ts
```

Expected: 5 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add lib/contrast-color.ts lib/contrast-color.test.ts
git commit -m "feat(lib): contrastTextColor (white/black em cima de cores arbitrárias)"
```

---

## Task 5: `hooks/use-tickets-infinite-query.ts` (TDD no helper puro)

**Files:**

- Create: `lib/tickets-list-helpers.ts` (helper puro testável)
- Test: `lib/tickets-list-helpers.test.ts`
- Create: `hooks/use-tickets-infinite-query.ts` (wrapper que usa o helper)

**Contrato:**

- `getNextCursorFromPage(page)` retorna `nextCursor` quando `pagination.hasMore=true`, senão `undefined`.
- `useTicketsInfiniteQuery(filters)` retorna o resultado do `useInfiniteQuery` configurado com `ticketsControllerList`.

- [ ] **Step 1: Escrever o teste do helper**

```ts
// lib/tickets-list-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { getNextCursorFromPage } from './tickets-list-helpers';

describe('getNextCursorFromPage', () => {
  it('retorna nextCursor quando hasMore=true', () => {
    const page = { pagination: { hasMore: true, nextCursor: 'abc' } } as never;
    expect(getNextCursorFromPage(page)).toBe('abc');
  });

  it('retorna undefined quando hasMore=false', () => {
    const page = { pagination: { hasMore: false, nextCursor: null } } as never;
    expect(getNextCursorFromPage(page)).toBeUndefined();
  });

  it('retorna undefined quando hasMore=true mas nextCursor é null (defensivo)', () => {
    const page = { pagination: { hasMore: true, nextCursor: null } } as never;
    expect(getNextCursorFromPage(page)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
pnpm test lib/tickets-list-helpers.test.ts
```

Expected: `Cannot find module './tickets-list-helpers'`.

- [ ] **Step 3: Implementar o helper**

```ts
// lib/tickets-list-helpers.ts
import type { TicketsListResponseDto } from '@/lib/generated/types';

export function getNextCursorFromPage(page: TicketsListResponseDto): string | undefined {
  if (!page.pagination.hasMore) return undefined;
  return page.pagination.nextCursor ?? undefined;
}
```

- [ ] **Step 4: Rodar e confirmar passa**

```bash
pnpm test lib/tickets-list-helpers.test.ts
```

Expected: 3 testes verdes.

- [ ] **Step 5: Implementar o wrapper hook**

```ts
// hooks/use-tickets-infinite-query.ts
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ticketsControllerList } from '@/lib/generated/client';
import { getNextCursorFromPage } from '@/lib/tickets-list-helpers';

// Tipos derivados do client gerado, sem redeclarar a entidade.
type ClientParams = Parameters<typeof ticketsControllerList>[0];
export type TicketsListFilters = Omit<ClientParams, 'cursor' | 'limit'>;

const PAGE_SIZE = 50;

export function useTicketsInfiniteQuery(filters: TicketsListFilters) {
  return useInfiniteQuery({
    queryKey: ['tickets', 'list', filters],
    queryFn: ({ pageParam }) =>
      ticketsControllerList({ ...filters, cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextCursorFromPage,
    staleTime: 30_000,
  });
}
```

Nota: se o Kubb gerou a função com assinatura diferente (ex.: separa query params em segundo argumento `ticketsControllerList(params, config?)`), ajuste a chamada conforme — `Parameters<typeof ticketsControllerList>` continua dando o tipo certo.

- [ ] **Step 6: Verificar typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 7: Commit**

```bash
git add lib/tickets-list-helpers.ts lib/tickets-list-helpers.test.ts hooks/use-tickets-infinite-query.ts
git commit -m "feat(hooks): useTicketsInfiniteQuery — wrapper TanStack em cima do client Kubb

Kubb não tem opção infinite configurada no pluginReactQuery; o wrapper
chama a função-cliente tipada gerada (ticketsControllerList) dentro de
useInfiniteQuery. Helper getNextCursorFromPage testado isoladamente."
```

---

## Task 6: `hooks/use-resolve-ticket-refs.ts` (TDD no helper puro)

**Files:**

- Create: `hooks/use-resolve-ticket-refs.ts`
- Test: `hooks/use-resolve-ticket-refs.test.ts` (testa só o helper puro `buildLookupMap`; o hook fica como wrapper trivial)

- [ ] **Step 1: Escrever o teste do helper**

```ts
// hooks/use-resolve-ticket-refs.test.ts
import { describe, it, expect } from 'vitest';
import { buildLookupMap } from './use-resolve-ticket-refs';

describe('buildLookupMap', () => {
  it('cria Map de id → entidade a partir de array', () => {
    const items = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ];
    const m = buildLookupMap(items);
    expect(m.get('a')?.name).toBe('Alice');
    expect(m.get('b')?.name).toBe('Bob');
    expect(m.size).toBe(2);
  });

  it('retorna Map vazio para undefined', () => {
    expect(buildLookupMap(undefined).size).toBe(0);
  });

  it('retorna Map vazio para array vazio', () => {
    expect(buildLookupMap([]).size).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
pnpm test hooks/use-resolve-ticket-refs.test.ts
```

Expected: `Cannot find module './use-resolve-ticket-refs'`.

- [ ] **Step 3: Implementar helper + hook**

```ts
// hooks/use-resolve-ticket-refs.ts
'use client';

import { useMemo } from 'react';
import { useUsersControllerList } from '@/lib/generated/hooks';
import { useDepartmentsControllerList } from '@/lib/generated/hooks';

export function buildLookupMap<T extends { id: string }>(items: T[] | undefined): Map<string, T> {
  return new Map((items ?? []).map((it) => [it.id, it]));
}

export function useResolveTicketRefs() {
  const usersQ = useUsersControllerList();
  const departmentsQ = useDepartmentsControllerList();
  const userById = useMemo(() => buildLookupMap(usersQ.data), [usersQ.data]);
  const departmentById = useMemo(() => buildLookupMap(departmentsQ.data), [departmentsQ.data]);
  return {
    userById,
    departmentById,
    isResolved: !!usersQ.data && !!departmentsQ.data,
  };
}
```

Nota: se `useUsersControllerList()` ou `useDepartmentsControllerList()` retorna `data` envelopado (ex.: `{ data: User[] }` vs `User[]`), ajustar onde busca o array — confirmar abrindo o arquivo gerado correspondente.

- [ ] **Step 4: Rodar e confirmar testes do helper passam**

```bash
pnpm test hooks/use-resolve-ticket-refs.test.ts
```

Expected: 3 testes verdes.

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 6: Commit**

```bash
git add hooks/use-resolve-ticket-refs.ts hooks/use-resolve-ticket-refs.test.ts
git commit -m "feat(hooks): useResolveTicketRefs — lookup local id→nome via TanStack cache"
```

---

## Task 7: `components/.../ticket-snippet.tsx` (TDD)

**Files:**

- Create: `app/(app)/atendimentos/components/ticket-snippet.tsx`
- Test: `app/(app)/atendimentos/components/ticket-snippet.test.tsx`

**Contrato:**

- Prop: `lastMessage: TicketsListResponseDto['items'][number]['lastMessage']` (já é `{ content, type } | null`).
- `null` → renderiza nada (componente retorna `null`).
- `type='TEXT'` → renderiza `content` (ou nada se `content=null` defensivo).
- Outros types → renderiza ícone-emoji + label conforme a tabela do spec (Decisão 6).

- [ ] **Step 1: Escrever o teste falhando**

```tsx
// app/(app)/atendimentos/components/ticket-snippet.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TicketSnippet } from './ticket-snippet';

describe('TicketSnippet', () => {
  it('não renderiza nada quando lastMessage é null', () => {
    const { container } = render(<TicketSnippet lastMessage={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza content literal quando type=TEXT', () => {
    const { getByText } = render(
      <TicketSnippet lastMessage={{ type: 'TEXT', content: 'Olá tudo bem' }} />,
    );
    expect(getByText('Olá tudo bem')).toBeTruthy();
  });

  it.each([
    ['IMAGE', '📷 Imagem'],
    ['VIDEO', '🎥 Vídeo'],
    ['AUDIO', '🎤 Áudio'],
    ['FILE', '📎 Arquivo'],
    ['STICKER', '😀 Figurinha'],
    ['CONTACT', '👤 Contato'],
    ['LOCATION', '📍 Localização'],
    ['BUTTON_REPLY', '▶ Resposta de botão'],
    ['LIST_REPLY', '▶ Resposta de lista'],
    ['TEMPLATE', '📋 Modelo'],
    ['SYSTEM', '⚙ Mensagem do sistema'],
  ] as const)('renderiza label correto para type=%s', (type, expected) => {
    const { getByText } = render(<TicketSnippet lastMessage={{ type, content: null }} />);
    expect(getByText(expected)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
pnpm test app/\(app\)/atendimentos/components/ticket-snippet.test.tsx
```

Expected: `Cannot find module './ticket-snippet'`.

- [ ] **Step 3: Implementar**

```tsx
// app/(app)/atendimentos/components/ticket-snippet.tsx
import type { TicketsListResponseDto } from '@/lib/generated/types';

type LastMessage = TicketsListResponseDto['items'][number]['lastMessage'];
type MessageType = NonNullable<LastMessage>['type'];

// Tabela de labels por type — força exaustividade via satisfies.
const LABEL_BY_TYPE = {
  TEXT: null, // TEXT usa content; ver lógica abaixo
  IMAGE: '📷 Imagem',
  VIDEO: '🎥 Vídeo',
  AUDIO: '🎤 Áudio',
  FILE: '📎 Arquivo',
  STICKER: '😀 Figurinha',
  CONTACT: '👤 Contato',
  LOCATION: '📍 Localização',
  BUTTON_REPLY: '▶ Resposta de botão',
  LIST_REPLY: '▶ Resposta de lista',
  TEMPLATE: '📋 Modelo',
  SYSTEM: '⚙ Mensagem do sistema',
} as const satisfies Record<MessageType, string | null>;

interface TicketSnippetProps {
  lastMessage: LastMessage;
}

export function TicketSnippet({ lastMessage }: TicketSnippetProps) {
  if (lastMessage === null) return null;
  if (lastMessage.type === 'TEXT') {
    if (!lastMessage.content) return null;
    return (
      <span className="text-muted-foreground line-clamp-1 text-sm">{lastMessage.content}</span>
    );
  }
  return (
    <span className="text-muted-foreground line-clamp-1 text-sm">
      {LABEL_BY_TYPE[lastMessage.type]}
    </span>
  );
}
```

- [ ] **Step 4: Rodar e confirmar passa**

```bash
pnpm test app/\(app\)/atendimentos/components/ticket-snippet.test.tsx
```

Expected: 13 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/atendimentos/components/ticket-snippet.tsx app/\(app\)/atendimentos/components/ticket-snippet.test.tsx
git commit -m "feat(atendimentos): TicketSnippet — TEXT content ou label de mídia por MessageType"
```

---

## Task 8: `components/.../whatsapp-window-bar.tsx`

**Files:**

- Create: `app/(app)/atendimentos/components/whatsapp-window-bar.tsx`
- Create: `lib/whatsapp-window.ts` (helper puro de cor por horas restantes)
- Test: `lib/whatsapp-window.test.ts`

**Contrato:**

- Helper: `whatsappWindowState(lastInboundAt, inWhatsappWindow, now?)` → `'hidden' | 'safe' | 'warning' | 'urgent'`. `hidden` quando `inWhatsappWindow=false` OR `lastInboundAt=null`. `safe` >6h. `warning` 1–6h. `urgent` <1h.
- Componente: render barra com `bg-emerald-500` / `bg-amber-500` / `bg-rose-500` conforme. `hidden` → `null`. Estática (sem timer; calcula no render).

- [ ] **Step 1: Teste do helper**

```ts
// lib/whatsapp-window.test.ts
import { describe, it, expect } from 'vitest';
import { whatsappWindowState } from './whatsapp-window';

const NOW = new Date('2026-05-19T20:00:00Z');

describe('whatsappWindowState', () => {
  it('retorna hidden quando inWhatsappWindow=false', () => {
    expect(whatsappWindowState('2026-05-19T19:00:00Z', false, NOW)).toBe('hidden');
  });

  it('retorna hidden quando lastInboundAt=null', () => {
    expect(whatsappWindowState(null, true, NOW)).toBe('hidden');
  });

  it('retorna safe quando restam > 6h', () => {
    // 7 horas atrás → 17h restantes
    expect(whatsappWindowState('2026-05-19T13:00:00Z', true, NOW)).toBe('safe');
  });

  it('retorna warning quando restam entre 1h e 6h', () => {
    // 22 horas atrás → 2h restantes
    expect(whatsappWindowState('2026-05-18T22:00:00Z', true, NOW)).toBe('warning');
  });

  it('retorna urgent quando restam < 1h', () => {
    // 23h30m atrás → 30min restantes
    expect(whatsappWindowState('2026-05-18T20:30:00Z', true, NOW)).toBe('urgent');
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
pnpm test lib/whatsapp-window.test.ts
```

Expected: módulo não encontrado.

- [ ] **Step 3: Implementar helper**

```ts
// lib/whatsapp-window.ts
const HOUR_MS = 60 * 60 * 1000;
const WINDOW_HOURS = 24;

export type WhatsappWindowState = 'hidden' | 'safe' | 'warning' | 'urgent';

export function whatsappWindowState(
  lastInboundAt: string | null,
  inWhatsappWindow: boolean,
  now: Date = new Date(),
): WhatsappWindowState {
  if (!inWhatsappWindow || lastInboundAt === null) return 'hidden';
  const elapsedHours = (now.getTime() - new Date(lastInboundAt).getTime()) / HOUR_MS;
  const remainingHours = WINDOW_HOURS - elapsedHours;
  if (remainingHours <= 0) return 'hidden';
  if (remainingHours < 1) return 'urgent';
  if (remainingHours <= 6) return 'warning';
  return 'safe';
}
```

- [ ] **Step 4: Rodar e confirmar passa**

```bash
pnpm test lib/whatsapp-window.test.ts
```

Expected: 5 testes verdes.

- [ ] **Step 5: Implementar componente**

```tsx
// app/(app)/atendimentos/components/whatsapp-window-bar.tsx
'use client';

import { whatsappWindowState } from '@/lib/whatsapp-window';

interface WhatsappWindowBarProps {
  lastInboundAt: string | null;
  inWhatsappWindow: boolean;
}

const COLOR_BY_STATE = {
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500',
  urgent: 'bg-rose-500 motion-safe:animate-pulse',
} as const;

export function WhatsappWindowBar({ lastInboundAt, inWhatsappWindow }: WhatsappWindowBarProps) {
  const state = whatsappWindowState(lastInboundAt, inWhatsappWindow);
  if (state === 'hidden') return null;
  return (
    <div
      role="presentation"
      aria-label={`Janela do WhatsApp: ${state === 'safe' ? 'tempo confortável' : state === 'warning' ? 'menos de 6 horas' : 'menos de 1 hora'}`}
      className="bg-border h-1 w-full overflow-hidden rounded-full"
    >
      <div
        className={`h-full ${COLOR_BY_STATE[state]}`}
        style={{ width: state === 'warning' ? '40%' : state === 'urgent' ? '15%' : '100%' }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 7: Commit**

```bash
git add lib/whatsapp-window.ts lib/whatsapp-window.test.ts app/\(app\)/atendimentos/components/whatsapp-window-bar.tsx
git commit -m "feat(atendimentos): WhatsappWindowBar + helper whatsappWindowState

Barra estática (sem timer nesta sub-sprint). Cor por horas restantes:
safe (>6h) → emerald, warning (1–6h) → amber, urgent (<1h) → rose com pulse."
```

---

## Task 9: `components/.../ticket-card-skeleton.tsx`

**Files:**

- Create: `app/(app)/atendimentos/components/ticket-card-skeleton.tsx`

Sem TDD (skeleton visual puro). Replica anatomia do card real.

- [ ] **Step 1: Implementar**

```tsx
// app/(app)/atendimentos/components/ticket-card-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function TicketCardSkeleton() {
  return (
    <div className="border-border bg-card flex items-start gap-3 border-b p-4">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/atendimentos/components/ticket-card-skeleton.tsx
git commit -m "feat(atendimentos): TicketCardSkeleton (anatomia espelhada do TicketCard)"
```

---

## Task 10: `components/.../ticket-card.tsx`

**Files:**

- Create: `app/(app)/atendimentos/components/ticket-card.tsx`

Sem teste unitário (visual; spec). Confiar no typecheck + validação manual.

- [ ] **Step 1: Implementar**

```tsx
// app/(app)/atendimentos/components/ticket-card.tsx
'use client';

import { User } from 'lucide-react';
import type { TicketsListResponseDto } from '@/lib/generated/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/initials';
import { formatBrPhone, maskBrPhone } from '@/lib/format-br-phone';
import { formatTicketTime } from '@/lib/format-ticket-time';
import { contrastTextColor } from '@/lib/contrast-color';
import { TicketSnippet } from './ticket-snippet';
import { WhatsappWindowBar } from './whatsapp-window-bar';
import { EllipsisVertical } from 'lucide-react';

type TicketListItem = TicketsListResponseDto['items'][number];

const BORDER_BY_STATUS = {
  PENDING: 'bg-amber-500',
  OPEN: 'bg-primary',
  CLOSED: 'bg-muted-foreground/40',
} as const satisfies Record<TicketListItem['status'], string>;

interface TicketCardProps {
  ticket: TicketListItem;
  hidePhoneFromAgents: boolean;
  assignedUserName?: string;
  departmentName?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function getDisplayName(contact: TicketListItem['contact'], hidePhoneFromAgents: boolean): string {
  if (contact.name) return contact.name;
  return hidePhoneFromAgents
    ? maskBrPhone(contact.phoneNumber)
    : formatBrPhone(contact.phoneNumber);
}

export function TicketCard({
  ticket,
  hidePhoneFromAgents,
  assignedUserName,
  departmentName,
  isSelected,
  onSelect,
}: TicketCardProps) {
  const displayName = getDisplayName(ticket.contact, hidePhoneFromAgents);
  const initials = ticket.contact.name ? getInitials(ticket.contact.name) : null;
  const visibleTags = ticket.tags.slice(0, 3);
  const remainingTags = ticket.tags.length - visibleTags.length;

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={() => onSelect(ticket.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(ticket.id);
        }
      }}
      className={cn(
        'border-border hover:bg-muted/50 focus-visible:ring-ring relative flex cursor-pointer items-start gap-3 border-b p-4 transition-colors focus:outline-none focus-visible:ring-2',
        isSelected && 'bg-muted',
      )}
      aria-label={`Atendimento ${ticket.protocol} de ${displayName}`}
    >
      <div
        className={cn('absolute top-0 bottom-0 left-0 w-[3px]', BORDER_BY_STATUS[ticket.status])}
        aria-hidden
      />

      <Avatar className="size-12 shrink-0">
        <AvatarFallback>
          {initials ?? <User className="text-muted-foreground size-5" aria-hidden />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="text-foreground truncate text-sm font-semibold">{displayName}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatTicketTime(ticket.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-mono text-xs">#{ticket.protocol}</span>
          {ticket.unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground h-5 px-1.5 text-xs">
              {ticket.unreadCount}
            </Badge>
          )}
        </div>

        <TicketSnippet lastMessage={ticket.lastMessage} />

        {(departmentName || assignedUserName || visibleTags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {departmentName && (
              <Badge variant="secondary" className="text-xs">
                {departmentName}
              </Badge>
            )}
            {assignedUserName && (
              <Badge variant="secondary" className="text-xs">
                {assignedUserName}
              </Badge>
            )}
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: tag.color,
                  color: contrastTextColor(tag.color) === 'white' ? '#fff' : '#000',
                }}
              >
                {tag.name}
              </span>
            ))}
            {remainingTags > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingTags}
              </Badge>
            )}
          </div>
        )}

        <WhatsappWindowBar
          lastInboundAt={ticket.lastInboundAt}
          inWhatsappWindow={ticket.inWhatsappWindow}
        />
      </div>

      {/* Slot do menu ⋮ — FE-2.1a só reserva o espaço */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        disabled
        aria-label="Ações do atendimento (em breve)"
        onClick={(e) => e.stopPropagation()}
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Confirmar que `Avatar`/`AvatarFallback`/`Badge`/`Button`/`Skeleton` existem como esperado**

```bash
ls components/ui/avatar.tsx components/ui/badge.tsx components/ui/button.tsx components/ui/skeleton.tsx
```

Expected: 4 arquivos listados. Se algum não existir, instalar via `pnpm dlx shadcn@latest add <component>` antes de prosseguir.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros. Se houver, conferir: assinatura real do `useUsersControllerList` (data ali pode ser envelopada — Task 6 lidou disso; este componente não consome direto).

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/atendimentos/components/ticket-card.tsx
git commit -m "feat(atendimentos): TicketCard com anatomia rica (avatar, protocolo, snippet, chips, borda lateral por status, barra 24h)"
```

---

## Task 11: Placeholders das colunas 2 e 3

**Files:**

- Create: `app/(app)/atendimentos/components/thread-placeholder.tsx`
- Create: `app/(app)/atendimentos/components/detail-placeholder.tsx`

- [ ] **Step 1: Implementar `thread-placeholder.tsx`**

```tsx
// app/(app)/atendimentos/components/thread-placeholder.tsx
import { MessageSquare } from 'lucide-react';

export function ThreadPlaceholder() {
  return (
    <div className="text-muted-foreground hidden h-full flex-col items-center justify-center gap-2 p-6 md:flex">
      <MessageSquare className="size-12 opacity-40" aria-hidden />
      <p className="text-sm">Selecione um atendimento</p>
    </div>
  );
}
```

- [ ] **Step 2: Implementar `detail-placeholder.tsx`**

```tsx
// app/(app)/atendimentos/components/detail-placeholder.tsx
import { Info } from 'lucide-react';

export function DetailPlaceholder() {
  return (
    <div className="text-muted-foreground hidden h-full flex-col items-center justify-center gap-2 p-6 md:flex">
      <Info className="size-10 opacity-40" aria-hidden />
      <p className="text-sm">Detalhes do atendimento aparecerão aqui</p>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/atendimentos/components/thread-placeholder.tsx app/\(app\)/atendimentos/components/detail-placeholder.tsx
git commit -m "feat(atendimentos): placeholders das colunas 2 (thread) e 3 (detalhe)"
```

---

## Task 12: `components/.../queue-tabs.tsx`

**Files:**

- Create: `app/(app)/atendimentos/components/queue-tabs.tsx`

- [ ] **Step 1: Confirmar shadcn Tabs presente**

```bash
ls components/ui/tabs.tsx
```

Expected: arquivo existe (Radix Tabs wrappers). Se não, `pnpm dlx shadcn@latest add tabs`.

- [ ] **Step 2: Implementar**

```tsx
// app/(app)/atendimentos/components/queue-tabs.tsx
'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bot, Clock, MessageCircle } from 'lucide-react';

export type QueueTabId = 'open' | 'pending' | 'bot';

interface QueueTabsProps {
  counts: { open: number; pending: number; bot: number };
}

const TABS: Array<{
  id: QueueTabId;
  label: string;
  Icon: typeof MessageCircle;
  countKey: 'open' | 'pending' | 'bot';
}> = [
  { id: 'open', label: 'Em atendimento', Icon: MessageCircle, countKey: 'open' },
  { id: 'pending', label: 'Na fila', Icon: Clock, countKey: 'pending' },
  { id: 'bot', label: 'Agente', Icon: Bot, countKey: 'bot' },
];

export function QueueTabs({ counts }: QueueTabsProps) {
  return (
    <TabsList className="w-full justify-start gap-1 border-b bg-transparent p-0">
      {TABS.map(({ id, label, Icon, countKey }) => (
        <TabsTrigger
          key={id}
          value={id}
          className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-medium"
        >
          <Icon className="size-4" aria-hidden />
          <span>{label}</span>
          <Badge className="bg-primary text-primary-foreground ml-1 h-5 px-1.5 text-xs">
            {counts[countKey]}
          </Badge>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/atendimentos/components/queue-tabs.tsx
git commit -m "feat(atendimentos): QueueTabs (3 abas com badges; ícones lucide aproximam Tabler do Figma)"
```

---

## Task 13: `components/.../queue-list.tsx` (virtualização + estados)

**Files:**

- Create: `app/(app)/atendimentos/components/queue-list.tsx`

- [ ] **Step 1: Implementar**

```tsx
// app/(app)/atendimentos/components/queue-list.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TicketsListResponseDto } from '@/lib/generated/types';
import { TicketCard } from './ticket-card';
import { TicketCardSkeleton } from './ticket-card-skeleton';
import { useResolveTicketRefs } from '@/hooks/use-resolve-ticket-refs';

type Item = TicketsListResponseDto['items'][number];

interface QueueListProps {
  items: Item[];
  status: 'pending' | 'error' | 'success';
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  hidePhoneFromAgents: boolean;
  selectedTicketId: string | null;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

const ROW_HEIGHT = 123;
const OVERSCAN = 3;

export function QueueList({
  items,
  status,
  hasNextPage,
  isFetchingNextPage,
  hidePhoneFromAgents,
  selectedTicketId,
  onSelect,
  onLoadMore,
  onRetry,
}: QueueListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { userById, departmentById } = useResolveTicketRefs();

  const rowCount = items.length + (hasNextPage ? 1 : 0); // sentinel quando há mais
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Dispara onLoadMore quando o último item virtualizado é o sentinel.
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const virtualItems = virtualizer.getVirtualItems();
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= items.length) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, items.length, onLoadMore, virtualizer]);

  if (status === 'pending') {
    return (
      <div role="list" aria-busy aria-label="Fila de atendimentos">
        {Array.from({ length: 6 }).map((_, i) => (
          <TicketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        role="alert"
      >
        <AlertCircle className="text-destructive size-8" aria-hidden />
        <p className="text-foreground text-sm">Erro ao carregar atendimentos.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Inbox className="size-8 opacity-40" aria-hidden />
        <p className="text-sm">Nenhum atendimento aqui.</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      role="list"
      aria-label="Fila de atendimentos"
      className="flex-1 overflow-auto"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const isSentinel = vi.index >= items.length;
          const ticket = items[vi.index];
          return (
            <div
              key={vi.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${vi.start}px)`,
                height: vi.size,
              }}
            >
              {isSentinel ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 p-4 text-xs">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Carregando mais…
                </div>
              ) : (
                ticket && (
                  <TicketCard
                    ticket={ticket}
                    hidePhoneFromAgents={hidePhoneFromAgents}
                    assignedUserName={
                      ticket.assignedUserId ? userById.get(ticket.assignedUserId)?.name : undefined
                    }
                    departmentName={
                      ticket.departmentId
                        ? departmentById.get(ticket.departmentId)?.name
                        : undefined
                    }
                    isSelected={selectedTicketId === ticket.id}
                    onSelect={onSelect}
                  />
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros. Se `userById.get(...)?.name` não tipar, conferir o type real do user no `lib/generated/types` (pode ser `User` com campo `name: string | null`). Ajustar acesso (`?.name ?? undefined`) sem mudar o contrato.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/atendimentos/components/queue-list.tsx
git commit -m "feat(atendimentos): QueueList — virtualização + 4 estados + sentinel infinite scroll"
```

---

## Task 14: `components/.../queue-sidebar.tsx`

**Files:**

- Create: `app/(app)/atendimentos/components/queue-sidebar.tsx`

- [ ] **Step 1: Implementar**

```tsx
// app/(app)/atendimentos/components/queue-sidebar.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { useTicketsInfiniteQuery } from '@/hooks/use-tickets-infinite-query';
import { useCompaniesControllerGetMeSettings } from '@/lib/generated/hooks';
import { QueueTabs, type QueueTabId } from './queue-tabs';
import { QueueList } from './queue-list';

interface QueueSidebarProps {
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
}

export function QueueSidebar({ selectedTicketId, onSelectTicket }: QueueSidebarProps) {
  const [activeTab, setActiveTab] = useState<QueueTabId>('open');

  const settingsQ = useCompaniesControllerGetMeSettings();
  const hidePhoneFromAgents = settingsQ.data?.hidePhoneFromAgents ?? false;

  const openQ = useTicketsInfiniteQuery({ status: ['OPEN'] });
  const pendingQ = useTicketsInfiniteQuery({ status: ['PENDING'] });
  const botQ = useTicketsInfiniteQuery({ inBotFlow: true });

  const queries = { open: openQ, pending: pendingQ, bot: botQ } as const;

  const counts = {
    open: openQ.data?.pages[0]?.counts.OPEN ?? 0,
    pending: pendingQ.data?.pages[0]?.counts.PENDING ?? 0,
    bot: botQ.data?.pages[0]?.botCount ?? 0,
  };

  const tabsConfig = [
    { id: 'open' as const, statuses: openQ },
    { id: 'pending' as const, statuses: pendingQ },
    { id: 'bot' as const, statuses: botQ },
  ];

  return (
    <aside className="flex h-full flex-col border-r">
      <header className="flex items-center justify-between gap-2 p-6">
        <h1 className="text-foreground text-2xl font-semibold">Atendimentos</h1>
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="Filtros avançados (em breve)"
          title="Disponível em breve"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
        </Button>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as QueueTabId)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <QueueTabs counts={counts} />
        {tabsConfig.map(({ id }) => {
          const q = queries[id];
          const items = q.data?.pages.flatMap((p) => p.items) ?? [];
          const queryStatus = q.isPending ? 'pending' : q.isError ? 'error' : 'success';
          return (
            <TabsContent key={id} value={id} className="flex-1 overflow-hidden">
              <QueueList
                items={items}
                status={queryStatus}
                hasNextPage={!!q.hasNextPage}
                isFetchingNextPage={q.isFetchingNextPage}
                hidePhoneFromAgents={hidePhoneFromAgents}
                selectedTicketId={selectedTicketId}
                onSelect={onSelectTicket}
                onLoadMore={() => q.fetchNextPage()}
                onRetry={() => q.refetch()}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </aside>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros. Se algum nome de hook gerado divergir (ex.: `useCompaniesControllerGetMeSettings` vs `useCompaniesControllerFindMeSettings`), ajustar o import — abrir `lib/generated/hooks/index.ts` e procurar pelo path correspondente.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/atendimentos/components/queue-sidebar.tsx
git commit -m "feat(atendimentos): QueueSidebar — 3 queries paralelas + TabsContent por aba + slot de filtros disabled"
```

---

## Task 15: `components/.../atendimentos-shell.tsx`

**Files:**

- Create: `app/(app)/atendimentos/components/atendimentos-shell.tsx`

- [ ] **Step 1: Implementar**

```tsx
// app/(app)/atendimentos/components/atendimentos-shell.tsx
'use client';

import { useState } from 'react';
import { QueueSidebar } from './queue-sidebar';
import { ThreadPlaceholder } from './thread-placeholder';
import { DetailPlaceholder } from './detail-placeholder';

export function AtendimentosShell() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <>
      <QueueSidebar selectedTicketId={selectedTicketId} onSelectTicket={setSelectedTicketId} />
      <ThreadPlaceholder />
      <DetailPlaceholder />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/atendimentos/components/atendimentos-shell.tsx
git commit -m "feat(atendimentos): AtendimentosShell — orquestrador client (aba ativa + ticket selecionado)"
```

---

## Task 16: `app/(app)/atendimentos/page.tsx` + `error.tsx`

**Files:**

- Modify: `app/(app)/atendimentos/page.tsx`
- Create: `app/(app)/atendimentos/error.tsx`

- [ ] **Step 1: Substituir `page.tsx`**

```tsx
// app/(app)/atendimentos/page.tsx
import type { Metadata } from 'next';
import { AtendimentosShell } from './components/atendimentos-shell';

export const metadata: Metadata = { title: 'Atendimentos — DigiChat' };

export default function Page() {
  return (
    <div className="divide-border grid h-full grid-cols-1 divide-x md:grid-cols-[400px_1fr_360px]">
      <AtendimentosShell />
    </div>
  );
}
```

- [ ] **Step 2: Criar `error.tsx`**

```tsx
// app/(app)/atendimentos/error.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AtendimentosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertTriangle className="text-destructive size-10" aria-hidden />
      <h1 className="text-foreground text-lg font-semibold">Algo deu errado</h1>
      <p className="text-muted-foreground text-sm">
        Não foi possível carregar a tela de Atendimentos.
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/atendimentos/page.tsx app/\(app\)/atendimentos/error.tsx
git commit -m "feat(atendimentos): page.tsx server com grid 3 colunas + error boundary de rota"
```

---

## Task 17: Verificação local completa (gate)

**Files:** nenhum (só comandos).

- [ ] **Step 1: Format check**

```bash
pnpm format:check
```

Expected: `All matched files use Prettier code style!` (ou similar).

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

Expected: zero erros, zero warnings (warnings novos devem ser corrigidos).

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: `tsc --noEmit` retorna 0 sem output.

- [ ] **Step 4: Suite de testes**

```bash
pnpm test
```

Expected: todos os testes passam, incluindo os novos (`format-ticket-time`, `format-br-phone`, `contrast-color`, `tickets-list-helpers`, `use-resolve-ticket-refs`, `ticket-snippet`, `whatsapp-window`).

- [ ] **Step 5: Se algo falhou, corrigir antes de seguir**

Não passe pra validação manual com gate vermelho. Se um teste passou no commit da task mas falha agora, é regressão por mudança posterior — investigar.

---

## Task 18: Validação manual (`pnpm dev` + olho)

**Files:** nenhum.

- [ ] **Step 1: Subir o crm-api local**

Garantir que o crm-api está rodando em `http://localhost:3000` com banco seedado. (Procedimento próprio do crm-api; sair daqui se não estiver disponível.)

- [ ] **Step 2: Subir o crm-web**

```bash
pnpm dev
```

Expected: Next inicia em `http://localhost:3001`.

- [ ] **Step 3: Navegar para `/atendimentos`** e validar visualmente:

- [ ] Shell de 3 colunas renderiza em viewport ≥ md (1024px+).
- [ ] Header "Atendimentos" + botão de filtros disabled visíveis.
- [ ] 3 abas com ícones (`MessageCircle`/`Clock`/`Bot`) + badges de contagem.
- [ ] Aba "Em atendimento" ativa por default.
- [ ] Lista popula com cards rich (avatar, nome ou telefone formatado/mascarado conforme `hidePhoneFromAgents`, protocolo `#NNNNN`, snippet TEXT ou ícone+label de mídia, chips de depto/atendente, tags coloridas, badge unread quando > 0, borda lateral azul/âmbar conforme status, barra 24h verde/âmbar/rose quando aplicável).
- [ ] Scroll dentro da lista é virtualizado (testar com conta que tenha > 50 tickets).
- [ ] Ao chegar perto do fim, dispara `fetchNextPage()` e adiciona próximo chunk com loader.
- [ ] Trocar de aba é instantâneo após primeira carga (cache hit).
- [ ] Clicar num card destaca-o (`isSelected` → `bg-muted`), mas colunas 2/3 continuam com placeholders.
- [ ] Empty state: conta sem tickets na aba "Agente" mostra "Nenhum atendimento aqui." com ícone Inbox.
- [ ] Error state: parar o crm-api → recarregar /atendimentos → ver mensagem de erro com botão "Tentar novamente". Religar crm-api + clicar no botão → recarrega.
- [ ] Loading state: garganta de rede (DevTools → Network → Slow 3G) → 6 skeletons visíveis enquanto a primeira página chega.
- [ ] Light + dark mode (toggle via `/configuracoes/preferencias` se existir, senão pelo `next-themes` no header global) — sem cor hardcoded vazando.
- [ ] Acessibilidade: Tab navega entre abas; Enter/Space ativa; foco visível em tudo; ↑/↓ nos cards (manual implementation no parent — se não funcionar, registrar como follow-up, não bloquear).
- [ ] Mobile (viewport < md, ex.: 375px): só a coluna 1 (fila) ocupa 100%; colunas 2/3 escondidas; rolagem funciona.

- [ ] **Step 4: Cenários extra a registrar (não bloqueiam)**

- Card com 4+ tags → mostra 3 + `+N`.
- Card com `lastMessage.type=AUDIO` → `🎤 Áudio`.
- Card com `unreadCount=0` → sem pill destructive.
- Card sem `contact.name` E `hidePhoneFromAgents=true` → `••• 1234` (último 4 dígitos).

- [ ] **Step 5: Se algo divergir do esperado, abrir bug fix antes do PR**

Trabalho na branch atual (`feat/sprint-fe-2-1a-shell-atendimentos-fila`), commits pontuais, repetir Task 17.

---

## Task 19: Atualizar ROADMAP e ARCHITECTURE em `crm-specs` (pós-validação)

**Files:**

- Modify: `../crm-specs/ROADMAP.md`
- Modify: `../crm-specs/ARCHITECTURE.md`

Faz **na mesma sessão** após Task 18 OK e antes do PR ser aberto (CLAUDE.md §16 e §17). Sem CI/branch-protection no crm-specs → push direto na main (memória `feedback_bundle_roadmap_sync_pr`).

- [ ] **Step 1: Marcar checkboxes da FE-2.1a no ROADMAP**

Abrir `../crm-specs/ROADMAP.md`, localizar a seção `#### Sprint FE-2.1a — Shell de Atendimentos + fila + card + paginação` (linhas ~1036–1047 na versão atual). Mudar cada `- [ ]` pra `- [x]` e anexar `(PR #NN, 2026-05-19)` ao final de cada item entregue. Substituir `NN` pelo número real do PR após Task 20.

- [ ] **Step 2: Atualizar a tabela de rastreamento da Fase 2 no ROADMAP**

Localizar a linha `| Fase 2  | —          | —          | fatiada      |` e atualizar a coluna de status pra refletir "FE-2.1a entregue (PR crm-web #NN, 2026-05-19); próxima sub-sprint: FE-2.1b" (manter o resto do texto).

- [ ] **Step 3: Bumpar versão e data no cabeçalho do ROADMAP**

Trocar a linha `> **Versão:** 34 ...` pra `> **Versão:** 35 (FE-2.1a entregue: shell de Atendimentos + fila + card + paginação)`. Atualizar data se houver campo de data.

- [ ] **Step 4: Adicionar `@tanstack/react-virtual` em `ARCHITECTURE.md` §4**

Localizar a tabela `### Frontend (`crm-web`)` (linha ~382). Adicionar antes da linha `@kubb/cli`:

```md
| @tanstack/react-virtual | latest | Virtualização da fila de tickets (Sprint FE-2.1a) |
```

- [ ] **Step 5: Commitar + push direto na main do crm-specs**

```bash
cd ../crm-specs
git checkout main
git pull --ff-only origin main
git add ROADMAP.md ARCHITECTURE.md
git commit -m "docs(roadmap+architecture): FE-2.1a entregue; registra @tanstack/react-virtual

- ROADMAP §FE-2.1a: checkboxes marcados (PR crm-web #NN, 2026-05-19)
- ROADMAP tabela de rastreamento: próxima sub-sprint FE-2.1b
- ARCHITECTURE §4 Stack crm-web: adiciona @tanstack/react-virtual"
git push origin main
git rev-parse HEAD   # captura o SHA pra citar no PR
cd -
```

Expected: push direto sucede (sem CI/branch-protection nesse repo); SHA capturado pra próximo step.

---

## Task 20: Abrir o PR (após validação manual aprovada por humano)

**Files:** nenhum. Aguarda **confirmação explícita** do usuário antes do `git push` da branch de código (memória `feedback_no_push_until_validated`).

- [ ] **Step 1: Pedir validação manual ao usuário**

Comunicar: "Sprint FE-2.1a localmente verde (lint/typecheck/test/format) + validação manual (Task 18) concluída. Posso fazer push e abrir o PR?"

Aguardar resposta. **Não fazer `git push` sem essa confirmação.**

- [ ] **Step 2: Após "ok", push e PR**

```bash
git push -u origin feat/sprint-fe-2-1a-shell-atendimentos-fila
gh pr create \
  --base main \
  --title "feat(sprint-fe-2-1a): shell de Atendimentos + fila + card + paginação" \
  --body "$(cat <<'EOF'
## Sprint FE-2.1a — Shell de Atendimentos + fila + card + paginação

Raiz da fatia frontend Fase 2 (FE-2.1a→FE-2.6). Detalhes:
- Spec: `docs/superpowers/specs/2026-05-19-sprint-fe-2-1a-shell-atendimentos-fila-design.md`
- Plano: `docs/superpowers/plans/2026-05-19-sprint-fe-2-1a-shell-atendimentos-fila.md`

### Entregas

- Rota `/atendimentos` com shell de 3 colunas (Server) + orquestrador Client.
- Sidebar de fila funcional: 3 abas (Em atendimento / Na fila / Agente) + badges + lista virtualizada (@tanstack/react-virtual) + cursor infinite scroll.
- TicketCard com anatomia rica (avatar + nome/telefone mascarado + protocolo + snippet por MessageType + chips depto/atendente + tags coloridas + borda lateral por status + barra 24h estática).
- 4 estados: loading / empty / error / success.
- Wrapper `useTicketsInfiniteQuery` em cima do client Kubb (sem `infinite` na codegen).
- Pré-req Kubb: snapshot Fase 2 + extensão #94 (botCount + items[i].lastMessage) regenerado.

### Cross-repo

- Backend: depende de crm-api #92 (snapshot) + #94 (DTO extensão).
- crm-specs atualizado: ROADMAP §FE-2.1a marcado; ARCHITECTURE §4 registra @tanstack/react-virtual. Commit SHA: `<SHA-do-Task-19>`.

### Out of scope (sub-sprints subsequentes)

- Pin/desfixar + seção "Fixados" + menu ⋮ funcional → FE-2.1b
- Dropdown "Ordenar por" + filtro avançado → FE-2.1b
- Detalhe + thread + painel lateral → FE-2.2
- Composer livre/HSM → FE-2.3
- Modais de ações de estado → FE-2.4
- Realtime Socket.IO → FE-2.5
- Validação e2e 16 cenários → FE-2.6

### Verificação local

- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` → tudo verde
- `pnpm dev` → /atendimentos OK em light e dark
- `pnpm build` fora do gate local (CLAUDE.md §11; CI roda no PR)
EOF
)"
```

Expected: PR aberto com link impresso no terminal. Substituir `<SHA-do-Task-19>` no body antes ou logo após a criação (`gh pr edit --body-file ...`).

- [ ] **Step 3: Atualizar o número do PR nos commits/docs**

Substituir `#NN` no ROADMAP (Task 19) pelo número real do PR. Mais um commit em `crm-specs/main`:

```bash
cd ../crm-specs
# editar ROADMAP.md, trocar #NN pelo número real
git add ROADMAP.md
git commit -m "docs(roadmap): substitui #NN pelo número real do PR crm-web da FE-2.1a"
git push origin main
cd -
```

- [ ] **Step 4: Marcar todos os itens da task list desta sprint como concluídos**

---

## Self-Review

**Spec coverage:** mapeei cada seção do spec contra task(s):

- Pré-req Kubb (snapshot+regen+zero-diff) → Task 0.
- Dep `@tanstack/react-virtual` → Task 1; registro em ARCHITECTURE §4 → Task 19.
- Rota `/atendimentos` shell 3 colunas → Task 16; orquestrador → Task 15.
- Sidebar fila (3 abas + badges) → Tasks 12 (tabs) + 14 (sidebar).
- Card rico (anatomia completa) → Task 10; partes: snippet Task 7; barra 24h Task 8; skeleton Task 9.
- Cursor keyset + virtualização → Task 5 (wrapper) + Task 13 (lista virtualizada).
- Estados loading/empty/error/success → Task 13.
- Tipos do Kubb, sem any/as Type → Tasks 0 (regen) + 5/6/7/10.
- Multi-tenant transparente → backend; client nunca envia companyId (sem código que faça isso).
- pt-BR visível, inglês no código → presente nos componentes e copy.
- Light+dark via tokens shadcn → presente; sem hardcoded color (cores de tag são dados do backend, não hardcode).
- A11y WCAG AA → focus visible, aria-busy, aria-label, role list/listitem, keyboard activation (Enter/Space).
- Testes unit pra utils/hooks/snippet → Tasks 2/3/4/5/6/7/8.
- Verificação local (format/lint/typecheck/test) → Task 17.
- Validação manual end-to-end → Task 18.
- ROADMAP+ARCHITECTURE pós-merge → Task 19.
- PR via gh após validação manual → Task 20.

**Placeholder scan:** sem `TBD`/`TODO`/`fill in details`. Cada passo de código tem código real. Comandos têm output esperado.

**Type consistency:**

- `QueueTabId = 'open' | 'pending' | 'bot'` consistente em queue-tabs e queue-sidebar.
- `TicketListItem = TicketsListResponseDto['items'][number]` consistente em queue-list, ticket-card, ticket-snippet.
- `MessageType = NonNullable<LastMessage>['type']` derivado, satisfies em ticket-snippet força exaustividade.
- `WhatsappWindowState` consistente entre helper e componente.

**Riscos pré-conhecidos com mitigação no plano:**

- Nome real do client gerado (`ticketsControllerList`) — Task 0 Step 4 verifica e o plano ajusta se diferir.
- Hooks de listas (users, departments, company-settings) — Task 14 Step 2 instrui a confirmar nomes reais via index.

Plano completo, sem placeholders, com tasks bite-sized.
