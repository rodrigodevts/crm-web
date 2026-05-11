# Sprint 1.4 Fase B — Tela `/configuracoes/canais` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o placeholder de `/configuracoes/canais` por uma tela funcional de CRUD de canais Gupshup, com mascaramento/revelação de credenciais ADMIN-only, ações inline (ativar/desativar/restart/excluir) e tratamento do 409 quando há tickets ativos.

**Architecture:** Página Server Component renderiza um Client Component "table" (smart container) que orquestra toolbar, filtros, lista de cards e dialogs. Forms usam React Hook Form + Zod com schema local (porque o `UpdateChannelSchema` do backend não valida o pareamento timeout/closeReason). Padrão `xxx-table.tsx` (smart) + `xxx-table-view.tsx` (presentational), espelhando o que `components/departments/` e `components/users/` fazem.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, TanStack Query 5 via hooks gerados pelo Kubb, React Hook Form + Zod, sonner, lucide-react, Vitest + RTL.

---

## Spec coberto

- [`docs/superpowers/specs/2026-05-11-sprint-1-4b-canais-frontend-design.md`](../specs/2026-05-11-sprint-1-4b-canais-frontend-design.md) — design aprovado pelo PO em 2026-05-11.

## Pré-requisitos (verificar antes de começar)

- Estar no worktree `../crm-web-sprint-1-4b/` (branch `feat/sprint-1-4b-canais-ui` a partir de `origin/main`).
- crm-api PR #56 mergeado em `main` do crm-api (já validado).
- `pnpm install` rodado no worktree (lefthook costuma faltar em worktree novo — `pnpm install` corrige).

---

## Task 0: Regenerar snapshot OpenAPI + `lib/generated`

> Sprint depende de hooks/types/schemas de channels existirem. Hoje o `openapi.snapshot.json` do crm-web não tem `/channels` (PR #56 do crm-api não regenerou snapshot).

**Files:**
- Modify: `openapi.snapshot.json` (raiz)
- Modify: `lib/generated/**` (todos os arquivos regenerados)

- [ ] **Step 1: `pnpm install` no worktree**

```bash
pnpm install
```

Expected: instala deps e configura `lefthook`. Caso `lefthook` continue ausente, rodar `pnpm exec lefthook install`.

- [ ] **Step 2: Subir crm-api local**

```bash
cd ../crm-api && pnpm start:dev
```

Em outro terminal. Aguardar log `API listening on http://localhost:3000`. Se Postgres ou Redis falharem, **PARAR** e perguntar ao PO antes de mexer em config local.

- [ ] **Step 3: Validar que `/channels` está exposto**

```bash
curl -s http://localhost:3000/api/v1/openapi.json | grep -c '"/api/v1/channels'
```

Expected: número > 0 (esperado: 9 — list, findById, create, update, delete, reveal, activate, deactivate, restart).

- [ ] **Step 4: Atualizar snapshot do crm-web**

```bash
curl -s http://localhost:3000/api/v1/openapi.json | node -e "process.stdin.pipe(require('fs').createWriteStream('openapi.snapshot.json'))"
```

Verificar:

```bash
grep -c '"/api/v1/channels' openapi.snapshot.json
```

Expected: mesmo número de antes.

- [ ] **Step 5: Regenerar `lib/generated`**

```bash
pnpm generate:api:from-snapshot
```

Verificar:

```bash
ls lib/generated/hooks/ | grep -i channel
```

Expected (9 hooks):
```
useChannelsControllerActivate.ts
useChannelsControllerCreate.ts
useChannelsControllerDeactivate.ts
useChannelsControllerFindById.ts
useChannelsControllerFindByIdSuspense.ts
useChannelsControllerList.ts
useChannelsControllerListSuspense.ts
useChannelsControllerRemove.ts
useChannelsControllerRestart.ts
useChannelsControllerReveal.ts
useChannelsControllerUpdate.ts
```

(Os `*Suspense.ts` são gerados em pares com os `List` e `FindById`.)

- [ ] **Step 6: Validar tipos**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add openapi.snapshot.json lib/generated
git commit -m "chore(sprint-1-4b): sincroniza OpenAPI snapshot com canais (PR #56 do crm-api)"
```

> Se hook gerado tiver nome diferente do esperado (ex.: backend renomeou `remove` pra `softDelete`), **ajustar os nomes em todas as tasks subsequentes deste plano** antes de prosseguir. Os nomes acima são predições baseadas no padrão `<feature>Controller<action>`.

---

## Task 1: Componente `ChannelStatusBadge`

Badge tipado por `ChannelStatus` com cores semânticas. Sem teste — pura pintura, baixo risco.

**Files:**
- Create: `components/channels/channel-status-badge.tsx`

- [ ] **Step 1: Criar componente**

```tsx
// components/channels/channel-status-badge.tsx
import type { ChannelStatusEnum } from '@/lib/generated/types/ChannelStatus';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LABELS: Record<ChannelStatusEnum, string> = {
  INACTIVE: 'Inativo',
  CONNECTING: 'Conectando',
  AWAITING_QR: 'Aguardando QR',
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Erro',
};

// Sem token shadcn dedicado para success/warning hoje (design-system.md §Mapeamento).
// Tailwind classes hardcoded apenas para os 6 estados, dentro do baseline cinza/azul/verde/âmbar/laranja/vermelho.
const TONES: Record<ChannelStatusEnum, string> = {
  INACTIVE: 'bg-muted text-muted-foreground',
  CONNECTING: 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200',
  AWAITING_QR: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
  CONNECTED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
  DISCONNECTED: 'bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100',
  ERROR: 'bg-destructive/15 text-destructive dark:bg-destructive/30',
};

export interface ChannelStatusBadgeProps {
  status: ChannelStatusEnum;
  className?: string;
}

export function ChannelStatusBadge({ status, className }: ChannelStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('border-transparent font-medium', TONES[status], className)}>
      {LABELS[status]}
    </Badge>
  );
}
```

> Confirmar nome real do enum no Kubb: pode vir como `ChannelStatusEnum`, `ChannelStatus` ou union literal. Olhar `lib/generated/types/ChannelStatus.ts` ou `lib/generated/types/ChannelResponseDto.ts` após Task 0 e ajustar o import.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/channels/channel-status-badge.tsx
git commit -m "feat(channels): adiciona ChannelStatusBadge"
```

---

## Task 2: Componente `ChannelCard` (presentational)

Card visual de um canal. Recebe dados + callbacks de ações. Sem teste (pura composição).

**Files:**
- Create: `components/channels/channel-card.tsx`

- [ ] **Step 1: Criar componente**

```tsx
// components/channels/channel-card.tsx
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChannelStatusBadge } from './channel-status-badge';
import { ChannelActionsMenu } from './channel-actions-menu';

export interface ChannelCardProps {
  channel: ChannelResponseDto;
  departmentName: string | null; // null = sem departamento padrão; o smart container resolve
  onEdit: (channel: ChannelResponseDto) => void;
  onActivate: (channel: ChannelResponseDto) => void;
  onDeactivate: (channel: ChannelResponseDto) => void;
  onRestart: (channel: ChannelResponseDto) => void;
  onDelete: (channel: ChannelResponseDto) => void;
}

function formatPhone(phoneNumber: string | null): string {
  if (!phoneNumber) return '—';
  // Apenas dígitos, ex: 5511999998888. Sem máscara forte — exibição simples.
  return `+${phoneNumber}`;
}

export function ChannelCard({
  channel,
  departmentName,
  onEdit,
  onActivate,
  onDeactivate,
  onRestart,
  onDelete,
}: ChannelCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-foreground truncate text-base font-semibold">{channel.name}</h3>
            <p className="text-muted-foreground text-sm">{formatPhone(channel.phoneNumber)}</p>
          </div>
          <ChannelActionsMenu
            channel={channel}
            onEdit={onEdit}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            onRestart={onRestart}
            onDelete={onDelete}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ChannelStatusBadge status={channel.status} />
          <Badge variant="outline">{channel.provider}</Badge>
        </div>

        <p className="text-muted-foreground text-xs">
          Departamento padrão: {departmentName ?? 'Não definido'}
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors (após Task 3 importar do mesmo arquivo — temporariamente o typecheck pode acusar `ChannelActionsMenu` ausente; isso é resolvido na Task 3).

> Não fazer commit isolado desta task — é dependente da Task 3 pra typecheck passar. Commitar junto no fim da Task 3.

---

## Task 3: Componente `ChannelActionsMenu` + teste

DropdownMenu com 5 ações. Activate/Deactivate/Restart com AlertDialog de confirmação. Edit dispara callback direto (abre dialog externo). Delete também dispara callback direto (delete tem dialog próprio na Task 4).

**Files:**
- Create: `components/channels/channel-actions-menu.tsx`
- Create: `components/channels/channel-actions-menu.test.tsx`

- [ ] **Step 1: Teste primeiro (failing)**

```tsx
// components/channels/channel-actions-menu.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { ChannelActionsMenu } from './channel-actions-menu';

const baseChannel: ChannelResponseDto = {
  id: 'c1',
  name: 'Canal Atendimento',
  provider: 'GUPSHUP',
  status: 'CONNECTED',
  phoneNumber: '5511999998888',
  externalId: null,
  config: { apiKey: '****1234', appId: '****5678', appName: 'app', sourcePhone: '5511999998888' },
  lastError: null,
  lastConnectedAt: null,
  defaultDepartmentId: null,
  defaultChatFlowId: null,
  inactivityTimeoutMinutes: null,
  inactivityCloseReasonId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function setup(overrides: Partial<ChannelResponseDto> = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onActivate: vi.fn(),
    onDeactivate: vi.fn(),
    onRestart: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<ChannelActionsMenu channel={{ ...baseChannel, ...overrides }} {...handlers} />);
  return handlers;
}

describe('ChannelActionsMenu', () => {
  it('Editar dispara onEdit imediatamente', async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    await user.click(screen.getByRole('menuitem', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('Desativar abre AlertDialog e só confirma após clicar em Desativar', async () => {
    const user = userEvent.setup();
    const { onDeactivate } = setup({ status: 'CONNECTED' });
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    await user.click(screen.getByRole('menuitem', { name: /desativar/i }));
    expect(onDeactivate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /^desativar$/i }));
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  it('Ativar fica disabled quando status já é CONNECTED', async () => {
    const user = userEvent.setup();
    setup({ status: 'CONNECTED' });
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    expect(screen.getByRole('menuitem', { name: /^ativar$/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('Desativar fica disabled quando status já é INACTIVE', async () => {
    const user = userEvent.setup();
    setup({ status: 'INACTIVE' });
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    expect(screen.getByRole('menuitem', { name: /^desativar$/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('Excluir dispara onDelete imediatamente (dialog próprio)', async () => {
    const user = userEvent.setup();
    const { onDelete } = setup();
    await user.click(screen.getByRole('button', { name: /ações do canal/i }));
    await user.click(screen.getByRole('menuitem', { name: /excluir/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar teste — DEVE FALHAR**

```bash
pnpm test components/channels/channel-actions-menu.test.tsx
```

Expected: FAIL — `Cannot find module './channel-actions-menu'`.

- [ ] **Step 3: Implementar `ChannelActionsMenu`**

```tsx
// components/channels/channel-actions-menu.tsx
'use client';

import { useState } from 'react';
import { MoreVerticalIcon } from 'lucide-react';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ChannelActionsMenuProps {
  channel: ChannelResponseDto;
  onEdit: (channel: ChannelResponseDto) => void;
  onActivate: (channel: ChannelResponseDto) => void;
  onDeactivate: (channel: ChannelResponseDto) => void;
  onRestart: (channel: ChannelResponseDto) => void;
  onDelete: (channel: ChannelResponseDto) => void;
}

type Pending = 'activate' | 'deactivate' | 'restart' | null;

const CONFIRMATIONS: Record<Exclude<Pending, null>, { title: string; description: string; cta: string }> = {
  activate: {
    title: 'Ativar canal?',
    description: 'A conexão com o provedor será inicializada.',
    cta: 'Ativar',
  },
  deactivate: {
    title: 'Desativar canal?',
    description:
      'Tickets em andamento não serão fechados, mas novas mensagens deixarão de ser recebidas.',
    cta: 'Desativar',
  },
  restart: {
    title: 'Forçar restart do canal?',
    description: 'Limpa o cache do adapter e reinicializa a conexão.',
    cta: 'Reiniciar',
  },
};

export function ChannelActionsMenu({
  channel,
  onEdit,
  onActivate,
  onDeactivate,
  onRestart,
  onDelete,
}: ChannelActionsMenuProps) {
  const [pending, setPending] = useState<Pending>(null);

  const canActivate = channel.status === 'INACTIVE' || channel.status === 'DISCONNECTED' || channel.status === 'ERROR';
  const canDeactivate = channel.status !== 'INACTIVE';

  function confirm() {
    if (pending === 'activate') onActivate(channel);
    if (pending === 'deactivate') onDeactivate(channel);
    if (pending === 'restart') onRestart(channel);
    setPending(null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Ações do canal ${channel.name}`}>
            <MoreVerticalIcon className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(channel)}>Editar</DropdownMenuItem>
          <DropdownMenuItem disabled={!canActivate} onSelect={() => setPending('activate')}>
            Ativar
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canDeactivate} onSelect={() => setPending('deactivate')}>
            Desativar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPending('restart')}>Forçar restart</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(channel)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          {pending && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{CONFIRMATIONS[pending].title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {CONFIRMATIONS[pending].description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirm}>{CONFIRMATIONS[pending].cta}</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 4: Rodar teste — DEVE PASSAR**

```bash
pnpm test components/channels/channel-actions-menu.test.tsx
```

Expected: PASS (5 testes).

> Se algum item do menu falhar em `aria-disabled='true'`, é porque o shadcn `DropdownMenuItem` não propaga `aria-disabled` na variante atual — investigar antes de adaptar o teste. Não relaxar o teste sem entender o motivo.

- [ ] **Step 5: Commit (junta Task 2 + Task 3)**

```bash
git add components/channels/channel-card.tsx components/channels/channel-actions-menu.tsx components/channels/channel-actions-menu.test.tsx
git commit -m "feat(channels): adiciona ChannelCard + ChannelActionsMenu"
```

---

## Task 4: `DeleteChannelDialog` + teste

AlertDialog único com dois estados — confirmação (default) e bloqueado por tickets ativos (após 409). Pluralização correta.

**Files:**
- Create: `components/channels/delete-channel-dialog.tsx`
- Create: `components/channels/delete-channel-dialog.test.tsx`

- [ ] **Step 1: Teste primeiro**

```tsx
// components/channels/delete-channel-dialog.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DeleteChannelDialog } from './delete-channel-dialog';

const channel = { id: 'c1', name: 'Suporte BR' } as const;

describe('DeleteChannelDialog', () => {
  it('estado padrão mostra título de confirmação e dispara onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /excluir canal "suporte br"/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^excluir$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('estado bloqueado mostra counts pluralizados e botão "Entendi"', () => {
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={{ openTicketsCount: 3, pendingTicketsCount: 1 }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /não é possível excluir/i })).toBeInTheDocument();
    expect(screen.getByText(/3 atendimentos abertos/i)).toBeInTheDocument();
    expect(screen.getByText(/1 atendimento pendente/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entendi/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^excluir$/i })).not.toBeInTheDocument();
  });

  it('estado bloqueado oculta linha quando count = 0', () => {
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={{ openTicketsCount: 5, pendingTicketsCount: 0 }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/5 atendimentos abertos/i)).toBeInTheDocument();
    expect(screen.queryByText(/pendentes?/i)).not.toBeInTheDocument();
  });

  it('singular: "1 atendimento aberto" (sem "s")', () => {
    render(
      <DeleteChannelDialog
        channel={channel}
        open
        blockedCounts={{ openTicketsCount: 1, pendingTicketsCount: 0 }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/^1 atendimento aberto$/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar — DEVE FALHAR**

```bash
pnpm test components/channels/delete-channel-dialog.test.tsx
```

Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `DeleteChannelDialog`**

```tsx
// components/channels/delete-channel-dialog.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DeleteBlockedCounts {
  openTicketsCount: number;
  pendingTicketsCount: number;
}

export interface DeleteChannelDialogProps {
  channel: { id: string; name: string };
  open: boolean;
  blockedCounts: DeleteBlockedCounts | null;
  onConfirm: () => void;
  onClose: () => void;
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`;
}

export function DeleteChannelDialog({
  channel,
  open,
  blockedCounts,
  onConfirm,
  onClose,
}: DeleteChannelDialogProps) {
  const blocked = blockedCounts !== null;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        {!blocked ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{`Excluir canal "${channel.name}"?`}</AlertDialogTitle>
              <AlertDialogDescription>
                Tickets já fechados são preservados. Esta ação é reversível pelo admin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Não é possível excluir</AlertDialogTitle>
              <AlertDialogDescription>
                {`Canal possui ${blockedCounts.openTicketsCount + blockedCounts.pendingTicketsCount} atendimento(s) ativo(s). Conclua-os antes de excluir.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="text-muted-foreground list-disc pl-5 text-sm">
              {blockedCounts.openTicketsCount > 0 && (
                <li>{pluralize(blockedCounts.openTicketsCount, 'atendimento aberto', 'atendimentos abertos')}</li>
              )}
              {blockedCounts.pendingTicketsCount > 0 && (
                <li>{pluralize(blockedCounts.pendingTicketsCount, 'atendimento pendente', 'atendimentos pendentes')}</li>
              )}
            </ul>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>Entendi</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 4: Rodar — DEVE PASSAR**

```bash
pnpm test components/channels/delete-channel-dialog.test.tsx
```

Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add components/channels/delete-channel-dialog.tsx components/channels/delete-channel-dialog.test.tsx
git commit -m "feat(channels): adiciona DeleteChannelDialog com estado de 409"
```

---

## Task 5: `ChannelDialogView` (presentational) + teste

Form puro, sem mutations nem queries. Recebe values, callbacks, options (departments, closeReasons), role, e estado de reveal. Smart container vem na Task 6.

**Files:**
- Create: `components/channels/channel-dialog-view.tsx`
- Create: `components/channels/channel-dialog-view.test.tsx`

> Decisão de split: separar **view** (form puro) de **smart** (data + mutations + reveal) facilita testar validação e gating sem mockar hooks Kubb. Espelha `preferences-form-view.tsx` vs `preferences-form.tsx`.

- [ ] **Step 1: Schema Zod local + tipo do form**

Criar primeiro o schema em arquivo separado pra reusar entre view e smart:

```tsx
// components/channels/channel-form-schema.ts
import { z } from 'zod';

export const channelFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    provider: z.literal('GUPSHUP'),
    phoneNumber: z
      .string()
      .trim()
      .min(1, 'Telefone é obrigatório')
      .regex(/^\d+$/, 'Apenas dígitos, sem "+" nem espaços. Ex.: 5511999998888'),
    apiKey: z.string().min(1, 'apiKey é obrigatório'),
    appId: z.string().min(1, 'appId é obrigatório'),
    appName: z.string().min(1, 'appName é obrigatório'),
    defaultDepartmentId: z.string().uuid().nullable(),
    inactivityTimeoutMinutes: z
      .number({ invalid_type_error: 'Informe um número inteiro' })
      .int()
      .positive('Deve ser maior que zero')
      .max(43200)
      .nullable(),
    inactivityCloseReasonId: z.string().uuid().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.inactivityTimeoutMinutes && !data.inactivityCloseReasonId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inactivityCloseReasonId'],
        message: 'Selecione um motivo de fechamento.',
      });
    }
  });

export type ChannelFormValues = z.infer<typeof channelFormSchema>;
```

- [ ] **Step 2: Teste do view**

```tsx
// components/channels/channel-dialog-view.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChannelDialogView } from './channel-dialog-view';

const departments = [
  { id: 'd1', name: 'Suporte' },
  { id: 'd2', name: 'Vendas' },
];
const closeReasons = [
  { id: 'r1', name: 'Atendido' },
  { id: 'r2', name: 'Sem retorno' },
];

function setup(props: Partial<React.ComponentProps<typeof ChannelDialogView>> = {}) {
  const onSubmit = vi.fn();
  const onReveal = vi.fn();
  render(
    <ChannelDialogView
      mode="create"
      open
      role="ADMIN"
      departments={departments}
      closeReasons={closeReasons}
      defaultValues={null}
      submitting={false}
      revealState="masked"
      onSubmit={onSubmit}
      onReveal={onReveal}
      onClose={vi.fn()}
      {...props}
    />,
  );
  return { onSubmit, onReveal };
}

describe('ChannelDialogView', () => {
  it('em modo create não mostra botão "Revelar credenciais"', () => {
    setup();
    expect(screen.queryByRole('button', { name: /revelar credenciais/i })).not.toBeInTheDocument();
  });

  it('em modo edit + role=ADMIN + revealState=masked mostra botão "Revelar"', () => {
    setup({
      mode: 'edit',
      defaultValues: {
        name: 'X',
        provider: 'GUPSHUP',
        phoneNumber: '5511999998888',
        apiKey: '****9999',
        appId: '****8888',
        appName: 'app',
        defaultDepartmentId: null,
        inactivityTimeoutMinutes: null,
        inactivityCloseReasonId: null,
      },
    });
    expect(screen.getByRole('button', { name: /revelar credenciais/i })).toBeInTheDocument();
  });

  it('em modo edit + role=SUPERVISOR não mostra botão "Revelar"', () => {
    setup({
      mode: 'edit',
      role: 'SUPERVISOR',
      defaultValues: {
        name: 'X',
        provider: 'GUPSHUP',
        phoneNumber: '5511999998888',
        apiKey: '****9999',
        appId: '****8888',
        appName: 'app',
        defaultDepartmentId: null,
        inactivityTimeoutMinutes: null,
        inactivityCloseReasonId: null,
      },
    });
    expect(screen.queryByRole('button', { name: /revelar credenciais/i })).not.toBeInTheDocument();
  });

  it('phoneNumber inválido (contém "+") exibe erro inline e não chama onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByLabelText(/nome/i), 'Canal X');
    await user.type(screen.getByLabelText(/telefone do canal/i), '+5511999998888');
    await user.type(screen.getByLabelText(/api key/i), 'k');
    await user.type(screen.getByLabelText(/app id/i), 'a');
    await user.type(screen.getByLabelText(/app name/i), 'n');
    await user.click(screen.getByRole('button', { name: /salvar|criar/i }));
    expect(await screen.findByText(/apenas dígitos/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('timeout > 0 sem closeReason exibe erro inline', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    await user.type(screen.getByLabelText(/nome/i), 'Canal X');
    await user.type(screen.getByLabelText(/telefone do canal/i), '5511999998888');
    await user.type(screen.getByLabelText(/api key/i), 'k');
    await user.type(screen.getByLabelText(/app id/i), 'a');
    await user.type(screen.getByLabelText(/app name/i), 'n');
    await user.type(screen.getByLabelText(/timeout/i), '30');
    await user.click(screen.getByRole('button', { name: /salvar|criar/i }));
    expect(await screen.findByText(/selecione um motivo de fechamento/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Rodar — DEVE FALHAR**

```bash
pnpm test components/channels/channel-dialog-view.test.tsx
```

Expected: FAIL — módulos não existem.

- [ ] **Step 4: Implementar `ChannelDialogView`**

```tsx
// components/channels/channel-dialog-view.tsx
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, LoaderIcon } from 'lucide-react';
import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { channelFormSchema, type ChannelFormValues } from './channel-form-schema';

export type RevealState = 'masked' | 'revealing' | 'revealed';
export type DialogMode = 'create' | 'edit';

interface NamedItem {
  id: string;
  name: string;
}

export interface ChannelDialogViewProps {
  mode: DialogMode;
  open: boolean;
  role: UserResponseDtoRoleEnumKey;
  departments: ReadonlyArray<NamedItem>;
  closeReasons: ReadonlyArray<NamedItem>;
  defaultValues: ChannelFormValues | null;
  submitting: boolean;
  revealState: RevealState;
  onSubmit: (values: ChannelFormValues, dirtyFields: Partial<Record<keyof ChannelFormValues, true>>) => void;
  onReveal: () => void;
  onClose: () => void;
}

const EMPTY_VALUES: ChannelFormValues = {
  name: '',
  provider: 'GUPSHUP',
  phoneNumber: '',
  apiKey: '',
  appId: '',
  appName: '',
  defaultDepartmentId: null,
  inactivityTimeoutMinutes: null,
  inactivityCloseReasonId: null,
};

export function ChannelDialogView({
  mode,
  open,
  role,
  departments,
  closeReasons,
  defaultValues,
  submitting,
  revealState,
  onSubmit,
  onReveal,
  onClose,
}: ChannelDialogViewProps) {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const showReveal = mode === 'edit' && isAdmin && revealState !== 'revealed';
  const credentialsLocked = mode === 'edit' && revealState !== 'revealed';

  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    form.reset(defaultValues ?? EMPTY_VALUES);
  }, [defaultValues, form]);

  const timeoutValue = form.watch('inactivityTimeoutMinutes');

  function submit(values: ChannelFormValues) {
    const dirtyFields = form.formState.dirtyFields as Partial<Record<keyof ChannelFormValues, true>>;
    onSubmit(values, dirtyFields);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Novo canal' : 'Editar canal'}</DialogTitle>
          <DialogDescription>
            Configurações do canal de WhatsApp via Gupshup.
          </DialogDescription>
        </DialogHeader>

        <form id="channel-form" onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="ch-name" required>Nome</FieldLabel>
            <Input id="ch-name" {...form.register('name')} aria-invalid={!!form.formState.errors.name} />
            {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-provider" required>Tipo</FieldLabel>
            <Select disabled value="GUPSHUP">
              <SelectTrigger id="ch-provider"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GUPSHUP">Gupshup</SelectItem>
                <SelectItem value="BAILEYS" disabled>Baileys (disponível na Fase 7)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-phone" required>Telefone do canal</FieldLabel>
            <Input id="ch-phone" {...form.register('phoneNumber')} aria-invalid={!!form.formState.errors.phoneNumber} />
            <p className="text-muted-foreground text-xs">Apenas dígitos. Ex.: 5511999998888</p>
            {form.formState.errors.phoneNumber && <FieldError>{form.formState.errors.phoneNumber.message}</FieldError>}
          </Field>

          {showReveal && (
            <div className="border-border bg-muted/30 flex items-center justify-between gap-3 rounded-md border p-3">
              <p className="text-muted-foreground text-sm">Credenciais ocultas. Revele para editar.</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={revealState === 'revealing'}
                onClick={onReveal}
              >
                {revealState === 'revealing' ? (
                  <>
                    <LoaderIcon className="size-4 animate-spin" aria-hidden="true" /> Revelando…
                  </>
                ) : (
                  <>
                    <EyeIcon className="size-4" aria-hidden="true" /> Revelar credenciais
                  </>
                )}
              </Button>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="ch-apikey" required>API Key</FieldLabel>
            <Input id="ch-apikey" readOnly={credentialsLocked} {...form.register('apiKey')} aria-invalid={!!form.formState.errors.apiKey} />
            {form.formState.errors.apiKey && <FieldError>{form.formState.errors.apiKey.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-appid" required>App ID</FieldLabel>
            <Input id="ch-appid" readOnly={credentialsLocked} {...form.register('appId')} aria-invalid={!!form.formState.errors.appId} />
            {form.formState.errors.appId && <FieldError>{form.formState.errors.appId.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-appname" required>App Name</FieldLabel>
            <Input id="ch-appname" {...form.register('appName')} aria-invalid={!!form.formState.errors.appName} />
            {form.formState.errors.appName && <FieldError>{form.formState.errors.appName.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="ch-dept">Departamento padrão</FieldLabel>
            <Controller
              control={form.control}
              name="defaultDepartmentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? '__none__'}
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                >
                  <SelectTrigger id="ch-dept"><SelectValue placeholder="Selecione um departamento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem departamento padrão</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <fieldset className="border-border flex flex-col gap-3 rounded-md border p-4">
            <legend className="text-foreground px-1 text-sm font-medium">Auto-fechamento por inatividade</legend>
            <Field>
              <FieldLabel htmlFor="ch-timeout">Timeout (minutos)</FieldLabel>
              <Controller
                control={form.control}
                name="inactivityTimeoutMinutes"
                render={({ field }) => (
                  <Input
                    id="ch-timeout"
                    type="number"
                    min={1}
                    max={43200}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? null : Number(v));
                    }}
                    aria-invalid={!!form.formState.errors.inactivityTimeoutMinutes}
                  />
                )}
              />
              <p className="text-muted-foreground text-xs">
                Em branco = desabilitado. Tickets em modo bot não são fechados por este timeout.
              </p>
              {form.formState.errors.inactivityTimeoutMinutes && (
                <FieldError>{form.formState.errors.inactivityTimeoutMinutes.message}</FieldError>
              )}
            </Field>

            {timeoutValue !== null && timeoutValue > 0 && (
              <Field>
                <FieldLabel htmlFor="ch-reason" required>Motivo de fechamento</FieldLabel>
                <Controller
                  control={form.control}
                  name="inactivityCloseReasonId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v === '' ? null : v)}
                    >
                      <SelectTrigger id="ch-reason"><SelectValue placeholder="Selecione um motivo" /></SelectTrigger>
                      <SelectContent>
                        {closeReasons.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.inactivityCloseReasonId && (
                  <FieldError>{form.formState.errors.inactivityCloseReasonId.message}</FieldError>
                )}
              </Field>
            )}
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="channel-form" disabled={submitting}>
            {submitting ? 'Salvando…' : mode === 'create' ? 'Criar canal' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Rodar — DEVE PASSAR**

```bash
pnpm test components/channels/channel-dialog-view.test.tsx
```

Expected: PASS (5 testes).

- [ ] **Step 6: Commit**

```bash
git add components/channels/channel-form-schema.ts components/channels/channel-dialog-view.tsx components/channels/channel-dialog-view.test.tsx
git commit -m "feat(channels): adiciona ChannelDialogView + schema Zod local"
```

---

## Task 6: `ChannelDialog` (smart) + teste do reveal

Wrapper que carrega departments/closeReasons via hooks Kubb, gerencia mutations de create/update, e orquestra o fluxo de reveal. Test foca em: submit envia só dirty fields em edit; reveal popula apiKey+appId.

**Files:**
- Create: `components/channels/channel-dialog.tsx`
- Create: `components/channels/channel-dialog.test.tsx`

- [ ] **Step 1: Teste primeiro**

```tsx
// components/channels/channel-dialog.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hooks mockados antes da importação do dialog
const createMutate = vi.fn();
const updateMutate = vi.fn();
const revealMutate = vi.fn();

vi.mock('@/lib/generated/hooks/useChannelsControllerCreate', () => ({
  useChannelsControllerCreate: () => ({ mutateAsync: createMutate, isPending: false }),
  channelsControllerCreateMutationKey: () => ['channels', 'create'],
}));
vi.mock('@/lib/generated/hooks/useChannelsControllerUpdate', () => ({
  useChannelsControllerUpdate: () => ({ mutateAsync: updateMutate, isPending: false }),
  channelsControllerUpdateMutationKey: () => ['channels', 'update'],
}));
vi.mock('@/lib/generated/hooks/useChannelsControllerReveal', () => ({
  useChannelsControllerReveal: () => ({ mutateAsync: revealMutate, isPending: false }),
  channelsControllerRevealMutationKey: () => ['channels', 'reveal'],
}));
vi.mock('@/lib/generated/hooks/useDepartmentsControllerList', () => ({
  useDepartmentsControllerList: () => ({ data: { items: [{ id: 'd1', name: 'Suporte', active: true }], pagination: { hasMore: false, nextCursor: null } }, isLoading: false }),
  departmentsControllerListQueryKey: () => ['departments', 'list'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerList', () => ({
  useCloseReasonsControllerList: () => ({ data: { items: [{ id: 'r1', name: 'Atendido' }] }, isLoading: false }),
  closeReasonsControllerListQueryKey: () => ['close-reasons', 'list'],
}));

import { ChannelDialog } from './channel-dialog';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';

const channel: ChannelResponseDto = {
  id: 'c1',
  name: 'Canal A',
  provider: 'GUPSHUP',
  status: 'CONNECTED',
  phoneNumber: '5511999998888',
  externalId: null,
  config: { apiKey: '****9999', appId: '****8888', appName: 'app-a', sourcePhone: '5511999998888' },
  lastError: null,
  lastConnectedAt: null,
  defaultDepartmentId: 'd1',
  defaultChatFlowId: null,
  inactivityTimeoutMinutes: null,
  inactivityCloseReasonId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  createMutate.mockReset();
  updateMutate.mockReset();
  revealMutate.mockReset();
});

describe('ChannelDialog', () => {
  it('create: submit envia config aninhado com sourcePhone = phoneNumber', async () => {
    const user = userEvent.setup();
    createMutate.mockResolvedValue({ id: 'new' });
    renderWithProviders(
      <ChannelDialog mode="create" channel={null} open onClose={vi.fn()} role="ADMIN" />,
    );
    await user.type(screen.getByLabelText(/nome/i), 'Novo Canal');
    await user.type(screen.getByLabelText(/telefone do canal/i), '5511999998888');
    await user.type(screen.getByLabelText(/api key/i), 'KEY');
    await user.type(screen.getByLabelText(/app id/i), 'APP');
    await user.type(screen.getByLabelText(/app name/i), 'name');
    await user.click(screen.getByRole('button', { name: /criar canal/i }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const arg = createMutate.mock.calls[0][0];
    expect(arg.data).toMatchObject({
      name: 'Novo Canal',
      provider: 'GUPSHUP',
      phoneNumber: '5511999998888',
      config: { apiKey: 'KEY', appId: 'APP', appName: 'name', sourcePhone: '5511999998888' },
    });
    expect(arg.data.defaultChatFlowId).toBeUndefined();
  });

  it('edit: revelar credenciais chama mutation e popula apiKey + appId reais', async () => {
    const user = userEvent.setup();
    revealMutate.mockResolvedValue({ apiKey: 'REAL_KEY', appId: 'REAL_APP', appName: 'app-a', sourcePhone: '5511999998888' });
    renderWithProviders(
      <ChannelDialog mode="edit" channel={channel} open onClose={vi.fn()} role="ADMIN" />,
    );
    await user.click(screen.getByRole('button', { name: /revelar credenciais/i }));
    await waitFor(() => expect(revealMutate).toHaveBeenCalledWith({ id: 'c1' }));
    await waitFor(() => expect(screen.getByLabelText(/api key/i)).toHaveValue('REAL_KEY'));
    expect(screen.getByLabelText(/app id/i)).toHaveValue('REAL_APP');
  });

  it('edit: submit envia apenas dirty fields', async () => {
    const user = userEvent.setup();
    updateMutate.mockResolvedValue({});
    renderWithProviders(
      <ChannelDialog mode="edit" channel={channel} open onClose={vi.fn()} role="ADMIN" />,
    );
    const name = screen.getByLabelText(/nome/i);
    await user.clear(name);
    await user.type(name, 'Canal Renomeado');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const arg = updateMutate.mock.calls[0][0];
    expect(arg.id).toBe('c1');
    expect(arg.data).toEqual({ name: 'Canal Renomeado' });
  });

  it('edit: phoneNumber dirty inclui config.sourcePhone no PATCH (após reveal)', async () => {
    const user = userEvent.setup();
    revealMutate.mockResolvedValue({ apiKey: 'REAL_KEY', appId: 'REAL_APP', appName: 'app-a', sourcePhone: '5511999998888' });
    updateMutate.mockResolvedValue({});
    renderWithProviders(
      <ChannelDialog mode="edit" channel={channel} open onClose={vi.fn()} role="ADMIN" />,
    );
    await user.click(screen.getByRole('button', { name: /revelar credenciais/i }));
    await waitFor(() => expect(screen.getByLabelText(/api key/i)).toHaveValue('REAL_KEY'));
    const phone = screen.getByLabelText(/telefone do canal/i);
    await user.clear(phone);
    await user.type(phone, '5511777776666');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const arg = updateMutate.mock.calls[0][0];
    expect(arg.data.phoneNumber).toBe('5511777776666');
    expect(arg.data.config).toEqual({ apiKey: 'REAL_KEY', appId: 'REAL_APP', appName: 'app-a', sourcePhone: '5511777776666' });
  });
});
```

- [ ] **Step 2: Rodar — DEVE FALHAR**

```bash
pnpm test components/channels/channel-dialog.test.tsx
```

Expected: FAIL — `Cannot find module './channel-dialog'`.

- [ ] **Step 3: Implementar `ChannelDialog`**

```tsx
// components/channels/channel-dialog.tsx
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { UserResponseDtoRoleEnumKey } from '@/lib/generated/types/UserResponseDto';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import {
  useChannelsControllerCreate,
  channelsControllerCreateMutationKey,
} from '@/lib/generated/hooks/useChannelsControllerCreate';
import {
  useChannelsControllerUpdate,
  channelsControllerUpdateMutationKey,
} from '@/lib/generated/hooks/useChannelsControllerUpdate';
import {
  useChannelsControllerReveal,
  channelsControllerRevealMutationKey,
} from '@/lib/generated/hooks/useChannelsControllerReveal';
import { channelsControllerListQueryKey } from '@/lib/generated/hooks/useChannelsControllerList';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import { useCloseReasonsControllerList } from '@/lib/generated/hooks/useCloseReasonsControllerList';
import { ChannelDialogView, type RevealState } from './channel-dialog-view';
import type { ChannelFormValues } from './channel-form-schema';

export interface ChannelDialogProps {
  mode: 'create' | 'edit';
  channel: ChannelResponseDto | null;
  open: boolean;
  role: UserResponseDtoRoleEnumKey;
  onClose: () => void;
}

function toFormValues(channel: ChannelResponseDto | null): ChannelFormValues | null {
  if (!channel) return null;
  return {
    name: channel.name,
    provider: 'GUPSHUP',
    phoneNumber: channel.phoneNumber ?? '',
    apiKey: channel.config?.apiKey ?? '',
    appId: channel.config?.appId ?? '',
    appName: channel.config?.appName ?? '',
    defaultDepartmentId: channel.defaultDepartmentId,
    inactivityTimeoutMinutes: channel.inactivityTimeoutMinutes,
    inactivityCloseReasonId: channel.inactivityCloseReasonId,
  };
}

type AxiosErrorShape = {
  response?: { status?: number; data?: { message?: string; details?: unknown } };
};

function mapServerError(err: unknown, setFieldError: (field: keyof ChannelFormValues, message: string) => void): void {
  const e = err as AxiosErrorShape;
  const status = e?.response?.status;
  const data = e?.response?.data;
  if (status === 409 && typeof data?.message === 'string') {
    const msg = data.message;
    if (msg.includes('número')) setFieldError('phoneNumber', msg);
    else if (msg.includes('nome')) setFieldError('name', msg);
    else toast.error(msg);
    return;
  }
  if (status === 400 && typeof data?.message === 'string') {
    toast.error(data.message);
    return;
  }
  toast.error('Não foi possível salvar o canal. Tente novamente.');
}

export function ChannelDialog({ mode, channel, open, role, onClose }: ChannelDialogProps) {
  const queryClient = useQueryClient();
  const [revealState, setRevealState] = useState<RevealState>('masked');
  // Após reveal, guardamos as credenciais reais para reusar no submit quando o
  // usuário muda apenas phoneNumber (precisamos enviar config.sourcePhone junto).
  const [revealedConfig, setRevealedConfig] = useState<{ apiKey: string; appId: string; appName: string } | null>(null);

  const departments = useDepartmentsControllerList(
    { limit: 100, active: true },
    { client: { client: apiClient } },
  );
  const closeReasons = useCloseReasonsControllerList(undefined, { client: { client: apiClient } });

  const createMutation = useChannelsControllerCreate({
    client: { client: apiClient },
    mutation: { mutationKey: channelsControllerCreateMutationKey() },
  });
  const updateMutation = useChannelsControllerUpdate({
    client: { client: apiClient },
    mutation: { mutationKey: channelsControllerUpdateMutationKey() },
  });
  const revealMutation = useChannelsControllerReveal({
    client: { client: apiClient },
    mutation: { mutationKey: channelsControllerRevealMutationKey() },
  });

  // Reset reveal quando o dialog reabre ou troca de canal.
  function handleClose() {
    setRevealState('masked');
    setRevealedConfig(null);
    onClose();
  }

  async function handleReveal() {
    if (!channel) return;
    setRevealState('revealing');
    try {
      const data = await revealMutation.mutateAsync({ id: channel.id });
      setRevealedConfig({ apiKey: data.apiKey, appId: data.appId, appName: data.appName });
      setRevealState('revealed');
      toast.success('Credenciais reveladas — esta ação foi registrada em auditoria.');
    } catch {
      setRevealState('masked');
      toast.error('Não foi possível revelar as credenciais.');
    }
  }

  async function handleSubmit(
    values: ChannelFormValues,
    dirtyFields: Partial<Record<keyof ChannelFormValues, true>>,
  ) {
    if (mode === 'create') {
      const payload = {
        name: values.name,
        provider: 'GUPSHUP' as const,
        phoneNumber: values.phoneNumber,
        config: {
          apiKey: values.apiKey,
          appId: values.appId,
          appName: values.appName,
          sourcePhone: values.phoneNumber,
        },
        defaultDepartmentId: values.defaultDepartmentId,
        inactivityTimeoutMinutes: values.inactivityTimeoutMinutes,
        inactivityCloseReasonId: values.inactivityCloseReasonId,
      };
      try {
        await createMutation.mutateAsync({ data: payload });
        toast.success('Canal criado.');
        void queryClient.invalidateQueries({ queryKey: channelsControllerListQueryKey(), exact: false });
        handleClose();
      } catch (err) {
        mapServerError(err, (field, message) => {
          // setError do form não é exposto aqui; deixamos como toast.
          toast.error(message);
        });
      }
      return;
    }

    // edit
    if (!channel) return;
    const data: Record<string, unknown> = {};
    if (dirtyFields.name) data.name = values.name;
    if (dirtyFields.defaultDepartmentId) data.defaultDepartmentId = values.defaultDepartmentId;
    if (dirtyFields.inactivityTimeoutMinutes) data.inactivityTimeoutMinutes = values.inactivityTimeoutMinutes;
    if (dirtyFields.inactivityCloseReasonId) data.inactivityCloseReasonId = values.inactivityCloseReasonId;

    const phoneDirty = dirtyFields.phoneNumber === true;
    const credsDirty = dirtyFields.apiKey === true || dirtyFields.appId === true || dirtyFields.appName === true;

    if (phoneDirty) data.phoneNumber = values.phoneNumber;

    if (phoneDirty || credsDirty) {
      const baseConfig = revealedConfig ?? { apiKey: values.apiKey, appId: values.appId, appName: values.appName };
      data.config = {
        apiKey: credsDirty ? values.apiKey : baseConfig.apiKey,
        appId: credsDirty ? values.appId : baseConfig.appId,
        appName: credsDirty ? values.appName : baseConfig.appName,
        sourcePhone: values.phoneNumber,
      };
    }

    if (Object.keys(data).length === 0) {
      handleClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: channel.id, data });
      toast.success('Canal atualizado.');
      void queryClient.invalidateQueries({ queryKey: channelsControllerListQueryKey(), exact: false });
      handleClose();
    } catch (err) {
      mapServerError(err, () => {});
    }
  }

  const defaultValues = toFormValues(channel);
  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <ChannelDialogView
      mode={mode}
      open={open}
      role={role}
      departments={departments.data?.items ?? []}
      closeReasons={closeReasons.data?.items ?? []}
      defaultValues={defaultValues}
      submitting={submitting}
      revealState={revealState}
      onSubmit={handleSubmit}
      onReveal={handleReveal}
      onClose={handleClose}
    />
  );
}
```

- [ ] **Step 4: Rodar — DEVE PASSAR**

```bash
pnpm test components/channels/channel-dialog.test.tsx
```

Expected: PASS (4 testes).

> Se um teste falhar porque o hook gerado pelo Kubb tem assinatura diferente (ex.: `mutateAsync(id, data)` vs `mutateAsync({ id, data })`), inspecionar `lib/generated/hooks/useChannelsControllerUpdate.ts` e adaptar o smart container. **Não relaxar o teste sem entender.**

- [ ] **Step 5: Commit**

```bash
git add components/channels/channel-dialog.tsx components/channels/channel-dialog.test.tsx
git commit -m "feat(channels): adiciona ChannelDialog (smart container) com reveal"
```

---

## Task 7: `ChannelsTableView` (presentational) + teste

Recebe items, estado de loading, filtros aplicados, callbacks. Mostra grid de cards, empty global vs filtered, error.

**Files:**
- Create: `components/channels/channels-table-view.tsx`
- Create: `components/channels/channels-table-view.test.tsx`

- [ ] **Step 1: Teste primeiro**

```tsx
// components/channels/channels-table-view.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChannelsTableView } from './channels-table-view';

const noop = vi.fn();

describe('ChannelsTableView', () => {
  it('estado loading mostra 3 skeletons', () => {
    render(
      <ChannelsTableView
        state="loading"
        items={[]}
        departmentsById={{}}
        hasFilters={false}
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getAllByTestId('channel-skeleton')).toHaveLength(3);
  });

  it('empty global mostra mensagem "Nenhum canal cadastrado." e botão Novo canal', () => {
    render(
      <ChannelsTableView
        state="ready"
        items={[]}
        departmentsById={{}}
        hasFilters={false}
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getByText(/nenhum canal cadastrado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /novo canal/i })).toBeInTheDocument();
  });

  it('empty filtrado mostra mensagem diferente e botão Limpar filtros', () => {
    render(
      <ChannelsTableView
        state="ready"
        items={[]}
        departmentsById={{}}
        hasFilters
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getByText(/nenhum canal corresponde aos filtros/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });

  it('estado error mostra alerta', () => {
    render(
      <ChannelsTableView
        state="error"
        items={[]}
        departmentsById={{}}
        hasFilters={false}
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar — DEVE FALHAR**

```bash
pnpm test components/channels/channels-table-view.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar `ChannelsTableView`**

```tsx
// components/channels/channels-table-view.tsx
'use client';

import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannelCard } from './channel-card';

export type ChannelsTableState = 'loading' | 'ready' | 'error';

export interface ChannelsTableViewProps {
  state: ChannelsTableState;
  items: ReadonlyArray<ChannelResponseDto>;
  departmentsById: Readonly<Record<string, string>>;
  hasFilters: boolean;
  connectedCount: number;
  totalCount: number;
  onEdit: (c: ChannelResponseDto) => void;
  onActivate: (c: ChannelResponseDto) => void;
  onDeactivate: (c: ChannelResponseDto) => void;
  onRestart: (c: ChannelResponseDto) => void;
  onDelete: (c: ChannelResponseDto) => void;
  onClearFilters: () => void;
  onCreate: () => void;
}

export function ChannelsTableView({
  state,
  items,
  departmentsById,
  hasFilters,
  onEdit,
  onActivate,
  onDeactivate,
  onRestart,
  onDelete,
  onClearFilters,
  onCreate,
}: ChannelsTableViewProps) {
  if (state === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} data-testid="channel-skeleton" className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="border-destructive/40 bg-destructive/10 rounded-md border p-6 text-center">
        <p className="text-foreground text-sm">Não foi possível carregar os canais.</p>
      </div>
    );
  }

  if (items.length === 0 && !hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">Nenhum canal cadastrado.</p>
        <p className="text-muted-foreground text-sm">Crie seu primeiro canal Gupshup para começar.</p>
        <Button onClick={onCreate} size="lg">Novo canal</Button>
      </div>
    );
  }

  if (items.length === 0 && hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">Nenhum canal corresponde aos filtros.</p>
        <Button variant="outline" onClick={onClearFilters}>Limpar filtros</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <ChannelCard
          key={c.id}
          channel={c}
          departmentName={c.defaultDepartmentId ? departmentsById[c.defaultDepartmentId] ?? null : null}
          onEdit={onEdit}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
          onRestart={onRestart}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Rodar — DEVE PASSAR**

```bash
pnpm test components/channels/channels-table-view.test.tsx
```

Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add components/channels/channels-table-view.tsx components/channels/channels-table-view.test.tsx
git commit -m "feat(channels): adiciona ChannelsTableView com estados loading/empty/error"
```

---

## Task 8: `ChannelsTable` (smart container)

Orquestra toolbar (search debounced + filtro status), useChannelsControllerList, mutations de activate/deactivate/restart/delete, e abertura dos dialogs. Sem teste isolado — comportamento da toolbar coberto pelo view test; mutations coberto via smoke manual.

**Files:**
- Create: `components/channels/channels-table.tsx`

- [ ] **Step 1: Implementar `ChannelsTable`**

```tsx
// components/channels/channels-table.tsx
'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import {
  useChannelsControllerList,
  channelsControllerListQueryKey,
} from '@/lib/generated/hooks/useChannelsControllerList';
import { useChannelsControllerActivate } from '@/lib/generated/hooks/useChannelsControllerActivate';
import { useChannelsControllerDeactivate } from '@/lib/generated/hooks/useChannelsControllerDeactivate';
import { useChannelsControllerRestart } from '@/lib/generated/hooks/useChannelsControllerRestart';
import { useChannelsControllerRemove } from '@/lib/generated/hooks/useChannelsControllerRemove';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import type { ChannelStatusEnum } from '@/lib/generated/types/ChannelStatus';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChannelsTableView } from './channels-table-view';
import { ChannelDialog } from './channel-dialog';
import { DeleteChannelDialog, type DeleteBlockedCounts } from './delete-channel-dialog';

type StatusFilter = 'all' | ChannelStatusEnum;

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'CONNECTING', label: 'Conectando' },
  { value: 'AWAITING_QR', label: 'Aguardando QR' },
  { value: 'CONNECTED', label: 'Conectado' },
  { value: 'DISCONNECTED', label: 'Desconectado' },
  { value: 'ERROR', label: 'Erro' },
];

type AxiosErrorShape = {
  response?: { status?: number; data?: { message?: string; details?: { openTicketsCount?: number; pendingTicketsCount?: number } } };
};

export function ChannelsTable() {
  const filterId = useId();
  const me = useCurrentUser();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ChannelResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelResponseDto | null>(null);
  const [deleteBlockedCounts, setDeleteBlockedCounts] = useState<DeleteBlockedCounts | null>(null);

  const listParams = useMemo(
    () => ({
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    }),
    [deferredSearch, statusFilter],
  );

  const channelsQuery = useChannelsControllerList(listParams, { client: { client: apiClient } });
  const departmentsQuery = useDepartmentsControllerList(
    { limit: 100, active: true },
    { client: { client: apiClient } },
  );

  const activate = useChannelsControllerActivate({ client: { client: apiClient } });
  const deactivate = useChannelsControllerDeactivate({ client: { client: apiClient } });
  const restart = useChannelsControllerRestart({ client: { client: apiClient } });
  const remove = useChannelsControllerRemove({ client: { client: apiClient } });

  const items = channelsQuery.data?.items ?? [];
  const connectedCount = channelsQuery.data?.connectedCount ?? 0;
  const totalCount = channelsQuery.data?.totalCount ?? 0;
  const hasFilters = deferredSearch.trim().length > 0 || statusFilter !== 'all';
  const state = channelsQuery.isPending ? 'loading' : channelsQuery.isError ? 'error' : 'ready';

  const departmentsById = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of departmentsQuery.data?.items ?? []) out[d.id] = d.name;
    return out;
  }, [departmentsQuery.data]);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: channelsControllerListQueryKey(), exact: false });
  }

  function handleAction(label: string, p: Promise<unknown>): Promise<void> {
    return p
      .then(() => {
        toast.success(`${label} aplicado.`);
        invalidate();
      })
      .catch(() => {
        toast.error(`Não foi possível ${label.toLowerCase()} o canal.`);
      });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync({ id: deleteTarget.id });
      toast.success('Canal excluído.');
      invalidate();
      setDeleteTarget(null);
    } catch (err) {
      const e = err as AxiosErrorShape;
      if (e?.response?.status === 409 && e?.response?.data?.details) {
        setDeleteBlockedCounts({
          openTicketsCount: e.response.data.details.openTicketsCount ?? 0,
          pendingTicketsCount: e.response.data.details.pendingTicketsCount ?? 0,
        });
      } else {
        toast.error('Não foi possível excluir o canal.');
        setDeleteTarget(null);
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Canais</h1>
          <p className="text-muted-foreground text-sm">
            Conexões WhatsApp via Gupshup. {connectedCount} de {totalCount} canais conectados.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            setEditTarget(null);
            setDialogOpen(true);
          }}
        >
          Novo canal
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={`${filterId}-search`} className="sr-only">Buscar por nome</Label>
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${filterId}-search`}
            type="search"
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChannelsTableView
        state={state}
        items={items}
        departmentsById={departmentsById}
        hasFilters={hasFilters}
        connectedCount={connectedCount}
        totalCount={totalCount}
        onEdit={(c) => {
          setEditTarget(c);
          setDialogOpen(true);
        }}
        onActivate={(c) => handleAction('Ativação', activate.mutateAsync({ id: c.id }))}
        onDeactivate={(c) => handleAction('Desativação', deactivate.mutateAsync({ id: c.id }))}
        onRestart={(c) => handleAction('Restart', restart.mutateAsync({ id: c.id }))}
        onDelete={(c) => {
          setDeleteTarget(c);
          setDeleteBlockedCounts(null);
        }}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('all');
        }}
        onCreate={() => {
          setEditTarget(null);
          setDialogOpen(true);
        }}
      />

      {dialogOpen && (
        <ChannelDialog
          mode={editTarget ? 'edit' : 'create'}
          channel={editTarget}
          open={dialogOpen}
          role={me.role}
          onClose={() => {
            setDialogOpen(false);
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteChannelDialog
          channel={{ id: deleteTarget.id, name: deleteTarget.name }}
          open
          blockedCounts={deleteBlockedCounts}
          onConfirm={handleDeleteConfirm}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteBlockedCounts(null);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors. Se o tipo gerado de `ChannelStatusEnum` tiver outro nome (ver Task 1 step 1), ajustar import.

- [ ] **Step 3: Rodar todos os testes (regressão)**

```bash
pnpm test
```

Expected: todos passam, incluindo os novos.

- [ ] **Step 4: Commit**

```bash
git add components/channels/channels-table.tsx
git commit -m "feat(channels): adiciona ChannelsTable (smart container) com toolbar e ações"
```

---

## Task 9: Substituir placeholder + adicionar loading/error

**Files:**
- Modify: `app/(app)/configuracoes/canais/page.tsx`
- Create: `app/(app)/configuracoes/canais/loading.tsx`
- Create: `app/(app)/configuracoes/canais/error.tsx`

- [ ] **Step 1: Reescrever `page.tsx`**

```tsx
// app/(app)/configuracoes/canais/page.tsx
import type { Metadata } from 'next';
import { ChannelsTable } from '@/components/channels/channels-table';

export const metadata: Metadata = { title: 'Canais — DigiChat' };

export default function Page() {
  return <ChannelsTable />;
}
```

- [ ] **Step 2: Criar `loading.tsx`**

```tsx
// app/(app)/configuracoes/canais/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar `error.tsx`**

```tsx
// app/(app)/configuracoes/canais/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ChannelsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-foreground text-xl font-semibold">Não foi possível carregar os canais</h2>
        <p className="text-muted-foreground text-sm">Tente novamente em instantes.</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar gate de rota**

```bash
grep -n "/configuracoes/canais" lib/rbac.ts
```

Expected: nenhum match. `/configuracoes/canais` cai no prefix `/configuracoes` que é ADMIN/SUPER_ADMIN only. AGENT/SUPERVISOR já bloqueados via `app/(app)/configuracoes/layout.tsx`.

```bash
grep -n "Canais" components/app-sidebar.tsx
```

Expected: 1 match — item já cadastrado em `settingsSubItems`. `getVisibleSettingsSubItems(role)` já filtra por `canAccessRoute`.

> Se uma dessas verificações falhar, **NÃO** ajustar agressivamente — investigar e perguntar antes.

- [ ] **Step 5: Typecheck + lint + format + test**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/configuracoes/canais/page.tsx app/\(app\)/configuracoes/canais/loading.tsx app/\(app\)/configuracoes/canais/error.tsx
git commit -m "feat(channels): substitui placeholder por tela real (Sprint 1.4 Fase B)"
```

---

## Task 10: Smoke manual + verificação final

> Não declarar pronto sem rodar o checklist manual contra o crm-api real.

**Files:** nenhum (validação).

- [ ] **Step 1: Subir stack local**

```bash
# Terminal 1
cd ../crm-api && pnpm start:dev

# Terminal 2 (do worktree)
pnpm dev
```

Aguardar logs `Ready on http://localhost:3001` (ou porta usada no projeto).

- [ ] **Step 2: Cenários (login ADMIN)**

Marcar cada um conforme valida:

- [ ] Login como ADMIN → sidebar mostra "Canais" no submenu Configurações.
- [ ] Acessa `/configuracoes/canais` → tela renderiza com "Nenhum canal cadastrado." se for primeiro acesso.
- [ ] Clica "Novo canal" → dialog abre. Provider mostra Gupshup ativo + Baileys disabled com tooltip.
- [ ] Cria canal com timeout = 30 sem closeReason → form bloqueia com "Selecione um motivo de fechamento."
- [ ] Cria canal Gupshup completo (com closeReason válido) → toast "Canal criado." e card aparece na lista.
- [ ] Cria segundo canal com mesmo `phoneNumber` → toast com mensagem pt-BR do backend.
- [ ] Abre edição do canal → `apiKey` e `appId` mostram valor mascarado `****<last4>`, readOnly.
- [ ] Clica "Revelar credenciais" → spinner → toast "Credenciais reveladas — esta ação foi registrada em auditoria." Inputs ficam editáveis com valores reais. Botão some.
- [ ] Edita só o nome → submit envia `{ name }` no PATCH (validar via DevTools Network).
- [ ] Tenta editar `provider` no payload (impossível pela UI já que é disabled) — confirmar via teste backend já existente.
- [ ] Aciona menu "Desativar" → AlertDialog confirmação → confirma → toast "Desativação aplicado." Card atualiza status para INACTIVE.
- [ ] Aciona "Ativar" → toast e status muda. Item "Ativar" fica disabled enquanto status é CONNECTED.
- [ ] Aciona "Forçar restart" → AlertDialog "Limpa o cache do adapter…" → confirma → toast.
- [ ] Cria um ticket OPEN para esse canal via API direta (curl ou Scalar `/api/v1/docs`).
- [ ] Aciona "Excluir" → confirma → dialog troca conteúdo: "Não é possível excluir" + "1 atendimento aberto" + botão "Entendi".
- [ ] Resolve o ticket via API → tenta excluir de novo → confirma → canal some da lista.

- [ ] **Step 3: Cenários (login AGENT)**

- [ ] Logout, login como AGENT (criar via convite se necessário) → sidebar **não** mostra "Canais".
- [ ] Tenta navegar direto pra `/configuracoes/canais` → redirect pra `/atendimentos` (layout RBAC).

- [ ] **Step 4: Verificação de drift de geração**

```bash
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
```

Expected: zero diff (snapshot foi commitada na Task 0).

- [ ] **Step 5: Verificação final automatizada**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Expected: tudo verde.

- [ ] **Step 6: Resumir pendências e reportar ao PO**

Status report curto:
- Implementado: Tasks 1–9.
- Testes adicionados: 5 arquivos (`channel-actions-menu`, `delete-channel-dialog`, `channel-dialog-view`, `channel-dialog`, `channels-table-view`).
- Sem mudanças em `lib/rbac.ts` (gating já cobre por prefix).
- Sem mudanças em `components/app-sidebar.tsx` (item já presente).
- Sem seção nova no `/configuracoes/design-system` (nada novo é primitivo).
- `pnpm build` fica pro CI (limitação §11 do CLAUDE.md).

**Não fazer `git push` sem o PO confirmar.** Quando autorizado:

```bash
git push -u origin feat/sprint-1-4b-canais-ui
gh pr create --title "feat(channels): tela /configuracoes/canais (Sprint 1.4 Fase B)" --body "$(cat <<'EOF'
## Summary
- Substitui placeholder de `/configuracoes/canais` por tela real com CRUD de canais Gupshup.
- ChannelDialog (create/edit unificado) com reveal ADMIN-only e validação Zod local (timeout/closeReason).
- DeleteChannelDialog com estado de bloqueio quando 409 vem com counts de tickets ativos.
- Ações inline: activate / deactivate / restart, com confirmação.

## Test plan
- [x] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes localmente.
- [x] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` → zero diff.
- [x] Smoke manual contra crm-api local (ADMIN cria/edita/revela/exclui; AGENT sem acesso).
EOF
)"
```

Após merge, **PR docs separado** em `docs/update-roadmap-1-4b` marcando os 8 checkboxes da §5.1 do `ROADMAP.md`.

---

## Self-review (writing-plans skill)

**Spec coverage:**
- Lista de canais em cards → Tasks 2, 7, 8 ✓
- Toolbar busca + filtro status → Task 8 ✓
- Contador conectados → Task 8 (header) ✓
- Estados loading/empty/filtered-empty/error → Tasks 7, 9 ✓
- ChannelDialog create/edit → Tasks 5, 6 ✓
- Reveal ADMIN-only → Tasks 5, 6 ✓
- Ações inline com confirmação → Task 3 ✓
- Delete com 409 → Tasks 4, 8 ✓
- RBAC sidebar + rota → Task 9 step 4 (validação) ✓
- Snapshot OpenAPI → Task 0 ✓

**Placeholder scan:** Sem TBD/TODO. Cada step tem código completo, comandos exatos e expected output.

**Type consistency:** `ChannelFormValues` (Task 5) usado consistentemente em Task 6. `RevealState` (Task 5) exportado e usado em Task 6. Hook names seguem padrão `useChannelsController<Action>` previsto na Task 0 step 5; Tasks subsequentes consomem os mesmos nomes. Caso o Kubb gere nomes diferentes, Task 0 step 5 alerta pra ajustar tudo antes de prosseguir.

**Ambiguity check:** `mapServerError` (Task 6) deixa `setFieldError` como callback inutilizado em alguns casos — está marcado como toast fallback. `revealedConfig` (Task 6) está descrito no comentário do código.

**Scope check:** plano único, ~10 tasks, todas relativas à mesma feature. Não precisa decomposição.
