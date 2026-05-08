# Showcase `/configuracoes/design-system` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a página `/configuracoes/design-system` (catálogo descritivo de tokens visuais + primitivos shadcn + compostos do projeto), gated por ADMIN/SUPER_ADMIN, com link na sidebar de Configurações.

**Architecture:** Página Server Component única em `app/(app)/configuracoes/design-system/`, com TOC sticky lateral e sections isoladas em `_sections/` (Server por padrão; ilhas client só onde precisa de interatividade — overlays, sonner). Compostos data-bound (`UsersTable`, `InvitationsTable`) são refatorados em split View + Container para que o showcase consuma a View pura com mock data estática.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui (24 componentes já instalados), TanStack Query 5, Vitest + @testing-library/react. Sem dependências novas.

**Spec base:** [docs/superpowers/specs/2026-05-08-design-system-showcase-design.md](../specs/2026-05-08-design-system-showcase-design.md)

---

## Premissas e contexto

- Branch: `feat/design-system-showcase` (já criada, com o spec commitado em `9ad44e9`).
- RBAC herdado: o layout `app/(app)/configuracoes/layout.tsx` já redireciona não-admin pra `/atendimentos`. Nada novo de gate.
- `NavUser` lê `useCurrentUser()` do `CurrentUserProvider` que já é injetado em `(app)/layout.tsx` — o showcase não precisa wrapar provider, pega o usuário real.
- `LoginForm` usa `useAuthControllerLogin` mas não tem provider exclusivo. Vai renderizar fine; clicar em submit dispara request real (decorativo no showcase, sem ação).
- `AcceptInviteForm` aceita props (`token`, `email`, `role`, `companyName`) — passamos mock direto.
- shadcn instalados (não vamos adicionar nenhum): `avatar`, `badge`, `breadcrumb`, `button`, `card`, `chart`, `checkbox`, `collapsible`, `dialog`, `drawer`, `dropdown-menu`, `field`, `input`, `label`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `table`, `tabs`, `toggle-group`, `toggle`, `tooltip`.

---

## Files

### Modify

- `components/users/users-table.tsx` — vira container fino (~10 linhas) que usa `UsersTableView`.
- `components/users/invitations-table.tsx` — vira container fino sobre `InvitationsTableView` (mantém `useState` do filtro de status, mas delega o render).
- `components/app-sidebar.tsx` — adiciona `{ href: '/configuracoes/design-system', label: 'Design System' }` ao `settingsSubItems`.
- `ROADMAP.md` — marca §4.8 "Showcase `/design-system`" como `[x]`.

### Create

```
components/users/
  users-table-view.tsx
  users-table-view.test.tsx
  invitations-table-view.tsx
  invitations-table-view.test.tsx

app/(app)/configuracoes/design-system/
  page.tsx
  page.test.tsx
  toc.tsx
  _sections/
    section.tsx
    drift-banner.tsx
    tokens-colors.tsx
    tokens-typography.tsx
    tokens-spacing.tsx
    primitives-buttons.tsx
    primitives-forms.tsx
    primitives-feedback.tsx
    primitives-overlays.tsx
    primitives-data.tsx
    primitives-charts.tsx
    composites.tsx
```

---

## Task 1: Extract `UsersTableView` (split View + Container)

**Files:**

- Create: `components/users/users-table-view.tsx`
- Create: `components/users/users-table-view.test.tsx`
- Modify: `components/users/users-table.tsx`

- [ ] **Step 1: Write failing test**

`components/users/users-table-view.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import { UsersTableView } from './users-table-view';

type Item = UserListResponseDto['items'][number];

const baseItem = (overrides: Partial<Item> = {}): Item => ({
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Maria Atendente',
  email: 'maria@example.com',
  role: 'AGENT',
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T10:30:00.000Z',
  departments: [{ id: 'd1', name: 'Suporte' }],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

describe('UsersTableView', () => {
  it('renderiza lista no estado ready', () => {
    render(<UsersTableView state="ready" items={[baseItem()]} />);
    expect(screen.getByText('Maria Atendente')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();
  });

  it('renderiza skeletons no estado loading', () => {
    const { container } = render(<UsersTableView state="loading" items={[]} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza mensagem de erro no estado error', () => {
    render(<UsersTableView state="error" items={[]} />);
    expect(screen.getByText('Erro ao carregar usuários.')).toBeInTheDocument();
  });

  it('renderiza empty state quando ready e items vazio', () => {
    render(<UsersTableView state="ready" items={[]} />);
    expect(screen.getByText('Nenhum usuário ativo.')).toBeInTheDocument();
  });

  it('mostra badge "Ausente" quando absenceActive é true', () => {
    render(<UsersTableView state="ready" items={[baseItem({ absenceActive: true })]} />);
    expect(screen.getByText('Ausente')).toBeInTheDocument();
  });

  it('placeholder em última atividade quando lastSeenAt é null', () => {
    render(<UsersTableView state="ready" items={[baseItem({ lastSeenAt: null })]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('combina múltiplos departamentos com vírgula', () => {
    render(
      <UsersTableView
        state="ready"
        items={[
          baseItem({
            departments: [
              { id: 'd1', name: 'Suporte' },
              { id: 'd2', name: 'Vendas' },
            ],
          }),
        ]}
      />,
    );
    expect(screen.getByText('Suporte, Vendas')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test (expect fail — module not found)**

```bash
pnpm test components/users/users-table-view.test.tsx
```

Expected: FAIL com erro "Cannot find module './users-table-view'".

- [ ] **Step 3: Implement `UsersTableView`**

`components/users/users-table-view.tsx`:

```tsx
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UserListItem = UserListResponseDto['items'][number];

export type UsersTableState = 'loading' | 'error' | 'ready';

interface Props {
  state: UsersTableState;
  items: UserListItem[];
}

const ROLE_LABEL: Record<UserListItem['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Atendente',
};

function formatLastSeen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatDepartments(departments: UserListItem['departments']): string {
  if (departments.length === 0) return '—';
  return departments.map((d) => d.name).join(', ');
}

export function UsersTableView({ state, items }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Departamentos</TableHead>
            <TableHead>Última atividade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state === 'loading' ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : state === 'error' ? (
            <TableRow>
              <TableCell colSpan={5} className="text-destructive text-center">
                Erro ao carregar usuários.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                Nenhum usuário ativo.
              </TableCell>
            </TableRow>
          ) : (
            items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.absenceActive ? (
                      <Badge variant="secondary" aria-label="Usuário em modo ausente">
                        Ausente
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{ROLE_LABEL[user.role]}</TableCell>
                <TableCell>{formatDepartments(user.departments)}</TableCell>
                <TableCell>{formatLastSeen(user.lastSeenAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

> **Nota:** o `data-slot="skeleton"` é injetado automaticamente pelo `<Skeleton />` do shadcn. Se o seletor falhar, ajustar o teste para `screen.getAllByRole('row')` (4 rows: header + 3 skeleton rows).

- [ ] **Step 4: Run test (expect pass)**

```bash
pnpm test components/users/users-table-view.test.tsx
```

Expected: 7 tests pass.

- [ ] **Step 5: Refactor `UsersTable` para usar `UsersTableView`**

`components/users/users-table.tsx` (substituir conteúdo inteiro):

```tsx
'use client';

import { useUsersControllerList } from '@/lib/generated/hooks/useUsersControllerList';
import { apiClient } from '@/lib/api-client';
import { UsersTableView, type UsersTableState } from './users-table-view';

export function UsersTable() {
  const query = useUsersControllerList(
    { active: true, limit: 50 },
    { client: { client: apiClient } },
  );

  const state: UsersTableState = query.isPending ? 'loading' : query.isError ? 'error' : 'ready';

  return <UsersTableView state={state} items={query.data?.items ?? []} />;
}
```

- [ ] **Step 6: Rodar a suite inteira de users-table**

```bash
pnpm test components/users/users-table
```

Expected: ambos `users-table.test.tsx` (5 testes) e `users-table-view.test.tsx` (7 testes) verdes.

- [ ] **Step 7: Commit**

```bash
git add components/users/users-table-view.tsx components/users/users-table-view.test.tsx components/users/users-table.tsx
git commit -m "$(cat <<'EOF'
refactor(users): split UsersTable em View + Container

Extrai UsersTableView (puro, recebe items + state) e mantém UsersTable como
container fino que consome o hook Kubb. API pública inalterada — testes
existentes continuam verdes. Habilita reuso no showcase /configuracoes/design-system.
EOF
)"
```

---

## Task 2: Extract `InvitationsTableView` (split View + Container)

**Files:**

- Create: `components/users/invitations-table-view.tsx`
- Create: `components/users/invitations-table-view.test.tsx`
- Modify: `components/users/invitations-table.tsx`

A View aqui é mais sutil: a `InvitationsTable` tem ações (Copiar/Reenviar/Revogar) que dependem das mutations. O caminho mais limpo: a View recebe `items`, `state`, e um `onAction(action, item)` callback. As ações são strings: `'copy' | 'resend' | 'revoke'`. O container conecta cada ação ao handler correspondente. Tabs (filtro de status) ficam **no container**, não na View — a View só recebe o que renderizar.

- [ ] **Step 1: Write failing test**

`components/users/invitations-table-view.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import { InvitationsTableView } from './invitations-table-view';

type Item = InvitationListResponseDto['items'][number];

const item = (overrides: Partial<Item> = {}): Item => ({
  id: '00000000-0000-7000-8000-000000000001',
  email: 'novo@example.com',
  role: 'AGENT',
  status: 'PENDING',
  invitedByName: 'Admin',
  createdAt: '2026-05-08T10:00:00.000Z',
  expiresAt: null,
  acceptedAt: null,
  revokedAt: null,
  ...overrides,
});

describe('InvitationsTableView', () => {
  it('renderiza lista no estado ready com PENDING e ações visíveis', () => {
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="pendente"
        items={[item()]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('novo@example.com')).toBeInTheDocument();
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar link/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reenviar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revogar/ })).toBeInTheDocument();
  });

  it('chama onAction com action e item ao clicar nas ações de PENDING', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    const it1 = item();
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="pendente"
        items={[it1]}
        onAction={onAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Copiar link/ }));
    expect(onAction).toHaveBeenLastCalledWith('copy', it1);

    await user.click(screen.getByRole('button', { name: /Reenviar/ }));
    expect(onAction).toHaveBeenLastCalledWith('resend', it1);

    await user.click(screen.getByRole('button', { name: /Revogar/ }));
    expect(onAction).toHaveBeenLastCalledWith('revoke', it1);
  });

  it('não exibe botões de ação para ACCEPTED e REVOKED', () => {
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="aceito"
        items={[item({ status: 'ACCEPTED', acceptedAt: '2026-05-08T11:00:00.000Z' })]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Copiar link/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reenviar/ })).not.toBeInTheDocument();
  });

  it('renderiza skeletons no loading', () => {
    const { container } = render(
      <InvitationsTableView
        state="loading"
        emptyStatusLabel="pendente"
        items={[]}
        onAction={vi.fn()}
      />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza erro no error state', () => {
    render(
      <InvitationsTableView
        state="error"
        emptyStatusLabel="pendente"
        items={[]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('Erro ao carregar convites.')).toBeInTheDocument();
  });

  it('renderiza empty com label customizada', () => {
    render(
      <InvitationsTableView
        state="ready"
        emptyStatusLabel="aceito"
        items={[]}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('Nenhum convite aceito.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test (expect fail)**

```bash
pnpm test components/users/invitations-table-view.test.tsx
```

Expected: FAIL com "Cannot find module './invitations-table-view'".

- [ ] **Step 3: Implement `InvitationsTableView`**

`components/users/invitations-table-view.tsx`:

```tsx
import { CopyIcon, RefreshCwIcon, BanIcon } from 'lucide-react';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import type { InvitationsControllerListQueryParamsStatusEnumKey } from '@/lib/generated/types/InvitationsControllerList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type InvitationStatus = InvitationsControllerListQueryParamsStatusEnumKey;
type InvitationListItem = InvitationListResponseDto['items'][number];

export type InvitationsTableState = 'loading' | 'error' | 'ready';
export type InvitationAction = 'copy' | 'resend' | 'revoke';

interface Props {
  state: InvitationsTableState;
  items: InvitationListItem[];
  emptyStatusLabel: string;
  onAction: (action: InvitationAction, item: InvitationListItem) => void;
}

const STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  REVOKED: 'Revogado',
};

const STATUS_VARIANT: Record<InvitationStatus, 'default' | 'secondary' | 'outline'> = {
  PENDING: 'default',
  ACCEPTED: 'secondary',
  REVOKED: 'outline',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Atendente',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function InvitationsTableView({ state, items, emptyStatusLabel, onAction }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Convidado por</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state === 'loading' ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : state === 'error' ? (
            <TableRow>
              <TableCell colSpan={6} className="text-destructive text-center">
                Erro ao carregar convites.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                Nenhum convite {emptyStatusLabel}.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.email}</TableCell>
                <TableCell>{ROLE_LABEL[item.role] ?? item.role}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </TableCell>
                <TableCell>{item.invitedByName}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {item.status === 'PENDING' ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('copy', item)}
                        aria-label={`Copiar link do convite de ${item.email}`}
                      >
                        <CopyIcon className="size-4" />
                        Copiar link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('resend', item)}
                        aria-label={`Reenviar convite de ${item.email}`}
                      >
                        <RefreshCwIcon className="size-4" />
                        Reenviar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction('revoke', item)}
                        aria-label={`Revogar convite de ${item.email}`}
                      >
                        <BanIcon className="size-4" />
                        Revogar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 4: Run test (expect pass)**

```bash
pnpm test components/users/invitations-table-view.test.tsx
```

Expected: 6 tests pass.

- [ ] **Step 5: Refactor `InvitationsTable` para usar `InvitationsTableView`**

`components/users/invitations-table.tsx` (substituir conteúdo inteiro):

```tsx
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useInvitationsControllerList,
  invitationsControllerListQueryKey,
} from '@/lib/generated/hooks/useInvitationsControllerList';
import { useInvitationsControllerRevoke } from '@/lib/generated/hooks/useInvitationsControllerRevoke';
import { useInvitationsControllerResend } from '@/lib/generated/hooks/useInvitationsControllerResend';
import { apiClient } from '@/lib/api-client';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import type { InvitationsControllerListQueryParamsStatusEnumKey } from '@/lib/generated/types/InvitationsControllerList';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InvitationsTableView,
  type InvitationsTableState,
  type InvitationAction,
} from './invitations-table-view';

type InvitationStatus = InvitationsControllerListQueryParamsStatusEnumKey;
type InvitationListItem = InvitationListResponseDto['items'][number];

const STATUS_EMPTY_LABEL: Record<InvitationStatus, string> = {
  PENDING: 'pendente',
  ACCEPTED: 'aceito',
  REVOKED: 'revogado',
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  return false;
}

export function InvitationsTable() {
  const [status, setStatus] = useState<InvitationStatus>('PENDING');
  const queryClient = useQueryClient();

  const query = useInvitationsControllerList(
    { status, limit: 50 },
    { client: { client: apiClient } },
  );
  const revoke = useInvitationsControllerRevoke({ client: { client: apiClient } });
  const resend = useInvitationsControllerResend({ client: { client: apiClient } });

  const items: InvitationListItem[] = query.data?.items ?? [];

  const tableState: InvitationsTableState = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  const invalidateAll = () =>
    queryClient.invalidateQueries({
      queryKey: invitationsControllerListQueryKey(),
      exact: false,
    });

  const handleAction = async (action: InvitationAction, item: InvitationListItem) => {
    if (action === 'copy') {
      try {
        const refreshed = await resend.mutateAsync({ id: item.id });
        const ok = await copyToClipboard(refreshed.inviteUrl);
        if (ok) toast.info('Link copiado para a área de transferência');
        else toast.error('Não foi possível copiar o link');
        void invalidateAll();
      } catch {
        toast.error('Não foi possível obter o link do convite');
      }
      return;
    }
    if (action === 'resend') {
      try {
        const refreshed = await resend.mutateAsync({ id: item.id });
        toast.success(`Novo link gerado para ${refreshed.email}`, {
          action: {
            label: 'Copiar link',
            onClick: () => {
              void copyToClipboard(refreshed.inviteUrl).then((ok) => {
                if (ok) toast.info('Link copiado');
                else toast.error('Não foi possível copiar');
              });
            },
          },
        });
        void invalidateAll();
      } catch {
        toast.error('Não foi possível reenviar o convite');
      }
      return;
    }
    if (action === 'revoke') {
      if (!window.confirm(`Revogar o convite de ${item.email}?`)) return;
      try {
        await revoke.mutateAsync({ id: item.id });
        toast.success(`Convite de ${item.email} revogado`);
        void invalidateAll();
      } catch {
        toast.error('Não foi possível revogar o convite');
      }
      return;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as InvitationStatus)}>
        <TabsList>
          <TabsTrigger value="PENDING">Pendentes</TabsTrigger>
          <TabsTrigger value="ACCEPTED">Aceitos</TabsTrigger>
          <TabsTrigger value="REVOKED">Revogados</TabsTrigger>
        </TabsList>
      </Tabs>

      <InvitationsTableView
        state={tableState}
        items={items}
        emptyStatusLabel={STATUS_EMPTY_LABEL[status]}
        onAction={(action, item) => void handleAction(action, item)}
      />
    </div>
  );
}
```

- [ ] **Step 6: Rodar a suite inteira de invitations-table**

```bash
pnpm test components/users/invitations-table
```

Expected: `invitations-table.test.tsx` (existente) e `invitations-table-view.test.tsx` (novo) ambos verdes. Se algum teste existente quebrar por causa da reordenação ou de seletor mais específico, ajustar **o teste**, não o comportamento (ex: `screen.getByText` de uma mensagem de empty pode mudar formato — antes "Nenhum convite pendente." continua sendo o output).

- [ ] **Step 7: Commit**

```bash
git add components/users/invitations-table-view.tsx components/users/invitations-table-view.test.tsx components/users/invitations-table.tsx
git commit -m "$(cat <<'EOF'
refactor(users): split InvitationsTable em View + Container

Extrai InvitationsTableView (puro, recebe items + state + onAction callback) e
mantém InvitationsTable como container fino que conecta hooks Kubb +
mutations + tabs de filtro. Habilita reuso no showcase /configuracoes/design-system.
EOF
)"
```

---

## Task 3: Showcase scaffolding (page + Section + TOC + smoke test)

**Files:**

- Create: `app/(app)/configuracoes/design-system/page.tsx`
- Create: `app/(app)/configuracoes/design-system/page.test.tsx`
- Create: `app/(app)/configuracoes/design-system/toc.tsx`
- Create: `app/(app)/configuracoes/design-system/_sections/section.tsx`

Esta task é o esqueleto: page mínima que renderiza um `Section` placeholder, `Toc` com 1 link, smoke test passa. Depois as próximas tasks vão preenchendo conteúdo.

- [ ] **Step 1: Implement `Section`**

`app/(app)/configuracoes/design-system/_sections/section.tsx`:

```tsx
import type { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  children: ReactNode;
}

export function Section({ id, title, children }: Props) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}
```

> `scroll-mt-20` cria um deslocamento ao seguir links de âncora pra que o título não fique colado ao header sticky.

- [ ] **Step 2: Implement `Toc`**

`app/(app)/configuracoes/design-system/toc.tsx`:

```tsx
const tocItems: ReadonlyArray<{
  id: string;
  label: string;
  children?: ReadonlyArray<{ id: string; label: string }>;
}> = [
  {
    id: 'tokens',
    label: 'Tokens',
    children: [
      { id: 'tokens-cores', label: 'Cores' },
      { id: 'tokens-tipografia', label: 'Tipografia' },
      { id: 'tokens-spacing', label: 'Spacing / Radius / Sombras' },
    ],
  },
  {
    id: 'primitivos',
    label: 'Primitivos',
    children: [
      { id: 'primitivos-buttons', label: 'Buttons' },
      { id: 'primitivos-forms', label: 'Forms' },
      { id: 'primitivos-feedback', label: 'Feedback' },
      { id: 'primitivos-overlays', label: 'Overlays' },
      { id: 'primitivos-data', label: 'Data display' },
      { id: 'primitivos-charts', label: 'Charts' },
    ],
  },
  {
    id: 'compostos',
    label: 'Compostos',
  },
];

export function Toc() {
  return (
    <nav aria-label="Sumário do design system" className="text-sm">
      <ul className="flex flex-col gap-1">
        {tocItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-foreground hover:text-primary block font-medium"
            >
              {item.label}
            </a>
            {item.children ? (
              <ul className="mt-1 ml-3 flex flex-col gap-1 border-l pl-3">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.id}`}
                      className="text-muted-foreground hover:text-primary block"
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

> Server Component. Sem `'use client'`. `<a href>` faz scroll nativo do browser.

- [ ] **Step 3: Implement `page.tsx` (esqueleto mínimo com 1 section placeholder)**

`app/(app)/configuracoes/design-system/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Toc } from './toc';
import { Section } from './_sections/section';

export const metadata: Metadata = { title: 'Design System — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Design System</h1>
        <p className="text-muted-foreground text-sm">
          Catálogo descritivo dos tokens, primitivos shadcn e compostos do projeto.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Toc />
        </aside>

        <main className="flex flex-col gap-12">
          <Section id="tokens" title="Tokens">
            <p className="text-muted-foreground">Em construção.</p>
          </Section>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Smoke test**

`app/(app)/configuracoes/design-system/page.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('design-system page', () => {
  it('renderiza o título e o TOC', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Design System' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Sumário/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Tokens' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests + typecheck + build**

```bash
pnpm test app/\(app\)/configuracoes/design-system && pnpm typecheck && pnpm build
```

Expected: smoke test pass; typecheck zero erros; build zero erros.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/configuracoes/design-system/
git commit -m "feat(design-system): scaffolding da página /configuracoes/design-system com Section + TOC"
```

---

## Task 4: Drift banner + Tokens sections

**Files (todas Create):**

- `app/(app)/configuracoes/design-system/_sections/drift-banner.tsx`
- `app/(app)/configuracoes/design-system/_sections/tokens-colors.tsx`
- `app/(app)/configuracoes/design-system/_sections/tokens-typography.tsx`
- `app/(app)/configuracoes/design-system/_sections/tokens-spacing.tsx`

Modify: `app/(app)/configuracoes/design-system/page.tsx` para importar todas as 3 e o banner.

Sem testes — são componentes estáticos sem lógica condicional. O smoke test do `page.tsx` já cobre que importar não quebra.

- [ ] **Step 1: `DriftBanner`**

`app/(app)/configuracoes/design-system/_sections/drift-banner.tsx`:

```tsx
import { AlertTriangleIcon } from 'lucide-react';

export function DriftBanner() {
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-md border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30"
    >
      <AlertTriangleIcon
        className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <div className="text-sm">
        <p className="text-foreground font-medium">
          Drift conhecido com <code>design-system.md</code>
        </p>
        <p className="text-muted-foreground mt-1">
          O documento <code>design-system.md</code> descreve fontes (Archivo / Inter / JetBrains
          Mono) e tokens nomeados (<code>color/primary/500</code>, <code>radius/pill</code>) que não
          correspondem ao que está em <code>app/globals.css</code> hoje. A reconciliação é o gap
          §4.8 do <code>ROADMAP.md</code> (&ldquo;Tema final consolidado&rdquo;) — fora de escopo
          desta página.
        </p>
      </div>
    </aside>
  );
}
```

> Cores `amber` direto (sem token semântico) porque `globals.css` não define `--warning`. É a única exceção à regra "sem cor hardcoded" do `components/CLAUDE.md`, justificada pelo contexto de banner meta-informativo deste catálogo.

- [ ] **Step 2: `TokensColors`**

`app/(app)/configuracoes/design-system/_sections/tokens-colors.tsx`:

```tsx
import { Section } from './section';

const primaryScale: ReadonlyArray<{ token: string; hex: string }> = [
  { token: '--color-primary-50', hex: '#eff6ff' },
  { token: '--color-primary-100', hex: '#dbeafe' },
  { token: '--color-primary-200', hex: '#bfdbfe' },
  { token: '--color-primary-300', hex: '#93c5fd' },
  { token: '--color-primary-400', hex: '#60a5fa' },
  { token: '--color-primary-500', hex: '#1b84ff' },
  { token: '--color-primary-600', hex: '#1565db' },
  { token: '--color-primary-700', hex: '#1949b6' },
  { token: '--color-primary-800', hex: '#1e3a8a' },
  { token: '--color-primary-900', hex: '#1e3175' },
  { token: '--color-primary-950', hex: '#172554' },
];

const semanticTokens: ReadonlyArray<{ token: string; cls: string; description: string }> = [
  { token: '--background', cls: 'bg-background border', description: 'Fundo padrão da página' },
  { token: '--foreground', cls: 'bg-foreground', description: 'Texto principal' },
  { token: '--card', cls: 'bg-card border', description: 'Fundo de cards' },
  { token: '--card-foreground', cls: 'bg-card-foreground', description: 'Texto sobre card' },
  { token: '--primary', cls: 'bg-primary', description: 'Ações primárias (azul DigiChat)' },
  {
    token: '--primary-foreground',
    cls: 'bg-primary-foreground border',
    description: 'Texto sobre primary',
  },
  { token: '--secondary', cls: 'bg-secondary', description: 'Fundo secundário' },
  { token: '--muted', cls: 'bg-muted', description: 'Fundo desativado' },
  { token: '--muted-foreground', cls: 'bg-muted-foreground', description: 'Texto secundário' },
  { token: '--accent', cls: 'bg-accent', description: 'Hover sutil' },
  { token: '--destructive', cls: 'bg-destructive', description: 'Ações destrutivas / erros' },
  { token: '--border', cls: 'bg-border', description: 'Bordas e divisores' },
  { token: '--input', cls: 'bg-input', description: 'Bordas de input' },
  { token: '--ring', cls: 'bg-ring', description: 'Ring de focus' },
];

const sidebarTokens: ReadonlyArray<{ token: string; cls: string }> = [
  { token: '--sidebar', cls: 'bg-sidebar border' },
  { token: '--sidebar-foreground', cls: 'bg-sidebar-foreground' },
  { token: '--sidebar-primary', cls: 'bg-sidebar-primary' },
  { token: '--sidebar-accent', cls: 'bg-sidebar-accent' },
  { token: '--sidebar-border', cls: 'bg-sidebar-border' },
];

const chartTokens = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const;

interface SwatchProps {
  label: string;
  sublabel?: string;
  cls?: string;
  style?: React.CSSProperties;
}

function Swatch({ cls, style, label, sublabel }: SwatchProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`h-12 w-full rounded-md ${cls ?? ''}`} style={style} aria-hidden />
      <code className="text-xs">{label}</code>
      {sublabel ? <span className="text-muted-foreground text-xs">{sublabel}</span> : null}
    </div>
  );
}

export function TokensColors() {
  return (
    <Section id="tokens-cores" title="Cores">
      <div>
        <h3 className="mb-3 text-base font-medium">Primary scale (DigiChat blue)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {primaryScale.map((s) => (
            <Swatch
              key={s.token}
              style={{ backgroundColor: s.hex }}
              label={s.token}
              sublabel={s.hex}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tokens semânticos shadcn</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {semanticTokens.map((s) => (
            <Swatch key={s.token} cls={s.cls} label={s.token} sublabel={s.description} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sidebar</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {sidebarTokens.map((s) => (
            <Swatch key={s.token} cls={s.cls} label={s.token} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Chart accents</h3>
        <div className="grid grid-cols-5 gap-3">
          {chartTokens.map((token, i) => (
            <Swatch
              key={token}
              style={{ backgroundColor: `var(--chart-${i + 1})` }}
              label={token}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
```

> **Por que `style` em vez de classe arbitrária:** `bg-[${hex}]` e `bg-chart-N` interpolados em runtime são purgados pelo Tailwind 4 JIT em build (o scanner é estático). `style={{ backgroundColor: ... }}` é runtime-puro e sempre funciona.

- [ ] **Step 3: `TokensTypography`**

`app/(app)/configuracoes/design-system/_sections/tokens-typography.tsx`:

```tsx
import { Section } from './section';

const sizes: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'text-xs', label: 'text-xs (12px)' },
  { cls: 'text-sm', label: 'text-sm (14px)' },
  { cls: 'text-base', label: 'text-base (16px)' },
  { cls: 'text-lg', label: 'text-lg (18px)' },
  { cls: 'text-xl', label: 'text-xl (20px)' },
  { cls: 'text-2xl', label: 'text-2xl (24px)' },
  { cls: 'text-3xl', label: 'text-3xl (30px)' },
  { cls: 'text-4xl', label: 'text-4xl (36px)' },
];

const weights: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'font-normal', label: 'font-normal (400)' },
  { cls: 'font-medium', label: 'font-medium (500)' },
  { cls: 'font-semibold', label: 'font-semibold (600)' },
  { cls: 'font-bold', label: 'font-bold (700)' },
];

export function TokensTypography() {
  return (
    <Section id="tokens-tipografia" title="Tipografia">
      <div>
        <h3 className="mb-3 text-base font-medium">Família</h3>
        <div className="flex flex-col gap-2">
          <p className="font-sans">
            Geist Sans (font-sans) — 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFG…
          </p>
          <p className="font-mono">
            Geist Mono (font-mono) — 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFG…
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tamanhos</h3>
        <div className="flex flex-col gap-2">
          {sizes.map((s) => (
            <div key={s.cls} className="flex items-baseline gap-4">
              <code className="text-muted-foreground w-40 text-xs">{s.label}</code>
              <span className={s.cls}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Pesos</h3>
        <div className="flex flex-col gap-2">
          {weights.map((w) => (
            <div key={w.cls} className="flex items-baseline gap-4">
              <code className="text-muted-foreground w-40 text-xs">{w.label}</code>
              <span className={`text-base ${w.cls}`}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 4: `TokensSpacing`**

`app/(app)/configuracoes/design-system/_sections/tokens-spacing.tsx`:

```tsx
import { Section } from './section';

const spacings: ReadonlyArray<{ cls: string; label: string; widthClass: string }> = [
  { cls: 'p-1', label: 'p-1 (4px)', widthClass: 'w-1' },
  { cls: 'p-2', label: 'p-2 (8px)', widthClass: 'w-2' },
  { cls: 'p-3', label: 'p-3 (12px)', widthClass: 'w-3' },
  { cls: 'p-4', label: 'p-4 (16px)', widthClass: 'w-4' },
  { cls: 'p-6', label: 'p-6 (24px)', widthClass: 'w-6' },
  { cls: 'p-8', label: 'p-8 (32px)', widthClass: 'w-8' },
  { cls: 'p-12', label: 'p-12 (48px)', widthClass: 'w-12' },
  { cls: 'p-16', label: 'p-16 (64px)', widthClass: 'w-16' },
  { cls: 'p-24', label: 'p-24 (96px)', widthClass: 'w-24' },
];

const radii: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'rounded-sm', label: 'rounded-sm' },
  { cls: 'rounded-md', label: 'rounded-md' },
  { cls: 'rounded-lg', label: 'rounded-lg' },
  { cls: 'rounded-xl', label: 'rounded-xl' },
  { cls: 'rounded-full', label: 'rounded-full' },
];

const shadows: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'shadow-sm', label: 'shadow-sm' },
  { cls: 'shadow-md', label: 'shadow-md' },
  { cls: 'shadow-lg', label: 'shadow-lg' },
  { cls: 'shadow-xl', label: 'shadow-xl' },
];

export function TokensSpacing() {
  return (
    <Section id="tokens-spacing" title="Spacing / Radius / Sombras">
      <div>
        <h3 className="mb-3 text-base font-medium">Spacing</h3>
        <div className="flex flex-col gap-2">
          {spacings.map((s) => (
            <div key={s.cls} className="flex items-center gap-4">
              <code className="text-muted-foreground w-32 text-xs">{s.label}</code>
              <div className={`bg-primary h-4 ${s.widthClass}`} aria-hidden />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Radius</h3>
        <div className="flex flex-wrap gap-4">
          {radii.map((r) => (
            <div key={r.cls} className="flex flex-col items-center gap-2">
              <div className={`bg-primary h-16 w-16 ${r.cls}`} aria-hidden />
              <code className="text-xs">{r.label}</code>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sombras</h3>
        <div className="flex flex-wrap gap-4">
          {shadows.map((s) => (
            <div key={s.cls} className="flex flex-col items-center gap-2">
              <div className={`bg-card h-16 w-24 rounded-md ${s.cls}`} aria-hidden />
              <code className="text-xs">{s.label}</code>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 5: Atualizar `page.tsx` para incluir banner + tokens**

Substituir o conteúdo do `<main>` em `page.tsx`:

```tsx
<main className="flex flex-col gap-12">
  <DriftBanner />
  <Section id="tokens" title="Tokens">
    <TokensColors />
    <TokensTypography />
    <TokensSpacing />
  </Section>
</main>
```

E adicionar imports:

```tsx
import { DriftBanner } from './_sections/drift-banner';
import { TokensColors } from './_sections/tokens-colors';
import { TokensTypography } from './_sections/tokens-typography';
import { TokensSpacing } from './_sections/tokens-spacing';
```

- [ ] **Step 6: Run tests + typecheck + build**

```bash
pnpm test app/\(app\)/configuracoes/design-system && pnpm typecheck && pnpm build
```

Expected: smoke test pass (após adição das sections, ele deve continuar passando — pode adicionar uma asserção a mais que o `tokens-cores` heading existe se quiser, mas não obrigatório).

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/configuracoes/design-system/
git commit -m "feat(design-system): banner de drift + sections de tokens (cores, tipografia, spacing)"
```

---

## Task 5: Primitives sections (6 sections)

**Files (todas Create):**

- `app/(app)/configuracoes/design-system/_sections/primitives-buttons.tsx`
- `app/(app)/configuracoes/design-system/_sections/primitives-forms.tsx`
- `app/(app)/configuracoes/design-system/_sections/primitives-feedback.tsx`
- `app/(app)/configuracoes/design-system/_sections/primitives-overlays.tsx`
- `app/(app)/configuracoes/design-system/_sections/primitives-data.tsx`
- `app/(app)/configuracoes/design-system/_sections/primitives-charts.tsx`

Modify: `page.tsx` para importar todas e adicionar Section "Primitivos" agrupando-as.

Sem testes unitários — render estático. Smoke test cobre que importações não quebram.

> **Para todas as sections de primitivos:** copiar imports do shadcn de `components/ui/`. Ver os componentes em `components/ui/{button,input,label,field,select,checkbox,toggle,toggle-group,skeleton,tooltip,badge,sonner,dialog,drawer,sheet,dropdown-menu,collapsible,table,avatar,separator,tabs,breadcrumb,chart}.tsx` para entender API exata antes de instanciar.

- [ ] **Step 1: `PrimitivesButtons` (Server Component)**

`app/(app)/configuracoes/design-system/_sections/primitives-buttons.tsx`:

```tsx
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from './section';

const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const sizes = ['default', 'sm', 'lg', 'icon'] as const;

export function PrimitivesButtons() {
  return (
    <Section id="primitivos-buttons" title="Buttons">
      <div>
        <h3 className="mb-3 text-base font-medium">Variants</h3>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          {sizes.map((s) =>
            s === 'icon' ? (
              <Button key={s} size={s} aria-label="ícone">
                <CheckIcon />
              </Button>
            ) : (
              <Button key={s} size={s}>
                {s}
              </Button>
            ),
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">States</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button>
            <CheckIcon />
            Com ícone
          </Button>
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: `PrimitivesForms`**

`app/(app)/configuracoes/design-system/_sections/primitives-forms.tsx`:

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field, FieldLabel, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Section } from './section';

export function PrimitivesForms() {
  return (
    <Section id="primitivos-forms" title="Forms">
      <div className="grid gap-6 md:grid-cols-2">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ds-input-empty">Input vazio</FieldLabel>
            <Input id="ds-input-empty" placeholder="Digite algo" />
            <FieldDescription>Estado padrão.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-input-disabled">Disabled</FieldLabel>
            <Input id="ds-input-disabled" placeholder="Indisponível" disabled />
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-input-error">Com erro</FieldLabel>
            <Input id="ds-input-error" defaultValue="email-invalido" aria-invalid />
            <FieldDescription className="text-destructive">E-mail inválido.</FieldDescription>
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-select">Select</Label>
            <Select>
              <SelectTrigger id="ds-select" className="w-60">
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opt-1">Opção 1</SelectItem>
                <SelectItem value="opt-2">Opção 2</SelectItem>
                <SelectItem value="opt-3">Opção 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="ds-cb" />
            <Label htmlFor="ds-cb">Checkbox</Label>
          </div>

          <div className="flex items-center gap-2">
            <Toggle aria-label="toggle simples">Toggle</Toggle>
          </div>

          <div>
            <Label className="mb-2 block">ToggleGroup (single)</Label>
            <ToggleGroup type="single" defaultValue="b">
              <ToggleGroupItem value="a">A</ToggleGroupItem>
              <ToggleGroupItem value="b">B</ToggleGroupItem>
              <ToggleGroupItem value="c">C</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
    </Section>
  );
}
```

> **Atenção:** o `Field` do shadcn pode ter API diferente do que assumo aqui. Antes de implementar, abrir `components/ui/field.tsx` e ajustar imports/uso para os exports reais.

- [ ] **Step 3: `PrimitivesFeedback`** (com client island pra Sonner)

`app/(app)/configuracoes/design-system/_sections/primitives-feedback.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Section } from './section';
import { SonnerTriggers } from './primitives-feedback-client';

export function PrimitivesFeedback() {
  return (
    <Section id="primitivos-feedback" title="Feedback">
      <div>
        <h3 className="mb-3 text-base font-medium">Skeleton</h3>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Badge</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>default</Badge>
          <Badge variant="secondary">secondary</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="destructive">destructive</Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tooltip</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover ou foco aqui</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip de exemplo</TooltipContent>
        </Tooltip>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sonner toasts</h3>
        <SonnerTriggers />
      </div>
    </Section>
  );
}
```

E o cliente que dispara toasts (`primitives-feedback-client.tsx` no mesmo dir):

```tsx
'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SonnerTriggers() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast.success('Operação concluída')}>
        success
      </Button>
      <Button variant="outline" onClick={() => toast.error('Algo deu errado')}>
        error
      </Button>
      <Button variant="outline" onClick={() => toast.info('Informação')}>
        info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Atenção')}>
        warning
      </Button>
    </div>
  );
}
```

> **Verificar antes**: o `<Toaster />` (de `components/ui/sonner`) precisa estar montado em algum layout. Provavelmente já está em `(app)/layout.tsx` ou `providers.tsx` (da Sprint 0.16). Confirmar com `grep -r "Toaster" app/ components/`. Se não estiver, NÃO incluir aqui — abrir issue separada.

- [ ] **Step 4: `PrimitivesOverlays`**

`app/(app)/configuracoes/design-system/_sections/primitives-overlays.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Section } from './section';

export function PrimitivesOverlays() {
  return (
    <Section id="primitivos-overlays" title="Overlays">
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog de exemplo</DialogTitle>
              <DialogDescription>Conteúdo demonstrativo.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Abrir Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer de exemplo</DrawerTitle>
              <DrawerDescription>Conteúdo demonstrativo.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Abrir Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet de exemplo</SheetTitle>
              <SheetDescription>Conteúdo demonstrativo.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Abrir Dropdown</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Opção 1</DropdownMenuItem>
            <DropdownMenuItem>Opção 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Collapsible</h3>
        <Collapsible className="rounded-md border p-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost">Toggle conteúdo</Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <p className="text-sm">Conteúdo expansível.</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Section>
  );
}
```

> Marcado `'use client'` no topo porque os triggers são interativos.

- [ ] **Step 5: `PrimitivesData`**

`app/(app)/configuracoes/design-system/_sections/primitives-data.tsx`:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Section } from './section';

export function PrimitivesData() {
  return (
    <Section id="primitivos-data" title="Data display">
      <div>
        <h3 className="mb-3 text-base font-medium">Avatar</h3>
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src="/nonexistent.png" alt="Maria Atendente" />
            <AvatarFallback>MA</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>RA</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Separator</h3>
        <div className="flex flex-col gap-2">
          <span>Acima</span>
          <Separator />
          <span>Abaixo</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tabs</h3>
        <Tabs defaultValue="one" className="w-full">
          <TabsList>
            <TabsTrigger value="one">Tab 1</TabsTrigger>
            <TabsTrigger value="two">Tab 2</TabsTrigger>
            <TabsTrigger value="three">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Conteúdo da tab 1</TabsContent>
          <TabsContent value="two">Conteúdo da tab 2</TabsContent>
          <TabsContent value="three">Conteúdo da tab 3</TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Breadcrumb</h3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Configurações</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Design System</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Table</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Maria</TableCell>
                <TableCell>maria@example.com</TableCell>
                <TableCell>Ativo</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>João</TableCell>
                <TableCell>joao@example.com</TableCell>
                <TableCell>Ausente</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 6: `PrimitivesCharts`** — exemplo simples com mock data

`app/(app)/configuracoes/design-system/_sections/primitives-charts.tsx`:

```tsx
'use client';

import { Line, LineChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Section } from './section';

const data = [
  { day: 'Seg', tickets: 12 },
  { day: 'Ter', tickets: 19 },
  { day: 'Qua', tickets: 14 },
  { day: 'Qui', tickets: 22 },
  { day: 'Sex', tickets: 30 },
  { day: 'Sáb', tickets: 8 },
  { day: 'Dom', tickets: 4 },
];

const chartConfig: ChartConfig = {
  tickets: { label: 'Tickets', color: 'var(--chart-1)' },
};

export function PrimitivesCharts() {
  return (
    <Section id="primitivos-charts" title="Charts">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <LineChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="tickets"
            type="monotone"
            stroke="var(--color-tickets)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Section>
  );
}
```

> **Verificar antes:** `recharts` está instalado (vem como peer do chart shadcn). Se não estiver — `pnpm add recharts`. Confirme com `pnpm list recharts` antes de seguir; se faltar, **pare e pergunte** (CLAUDE.md §6 — adicionar dep nova exige aprovação).

- [ ] **Step 7: Atualizar `page.tsx` para incluir Section "Primitivos"**

Adicionar imports + nova `<Section id="primitivos" title="Primitivos">` no `<main>`:

```tsx
import { PrimitivesButtons } from './_sections/primitives-buttons';
import { PrimitivesForms } from './_sections/primitives-forms';
import { PrimitivesFeedback } from './_sections/primitives-feedback';
import { PrimitivesOverlays } from './_sections/primitives-overlays';
import { PrimitivesData } from './_sections/primitives-data';
import { PrimitivesCharts } from './_sections/primitives-charts';
```

E dentro do main, depois da Section "Tokens":

```tsx
<Section id="primitivos" title="Primitivos">
  <PrimitivesButtons />
  <PrimitivesForms />
  <PrimitivesFeedback />
  <PrimitivesOverlays />
  <PrimitivesData />
  <PrimitivesCharts />
</Section>
```

- [ ] **Step 8: Run tests + typecheck + build**

```bash
pnpm test app/\(app\)/configuracoes/design-system && pnpm typecheck && pnpm build
```

Expected: smoke test passa; tipos OK; build OK.

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/configuracoes/design-system/
git commit -m "feat(design-system): sections de primitivos shadcn (buttons, forms, feedback, overlays, data, charts)"
```

---

## Task 6: Composites section

**Files (Create):**

- `app/(app)/configuracoes/design-system/_sections/composites.tsx`

Modify: `page.tsx` para incluir.

A `Composites` mostra 5 compostos:

1. `LoginForm` — montado livremente; submit dispara request real (decorativo).
2. `AcceptInviteForm` — passamos props mock.
3. `NavUser` — usa `useCurrentUser()` do contexto que já é provido pela `(app)/layout.tsx`. Renderiza com o usuário real logado (mostra a "cara" real do componente). **Nota:** `NavUser` é desenhado pra viver dentro de um `<Sidebar>`. Se renderizar fora, pode quebrar (depende de `useSidebar`). Verificar antes.
4. `UsersTableView` — array fake com 3 usuários, 3 instâncias (loading, error, ready).
5. `InvitationsTableView` — array fake, 3 instâncias.

> **Verificar antes (NavUser):** abrir `components/nav-user.tsx` e checar se importa `useSidebar()` — se sim, renderizar fora de `<Sidebar>` quebra. Se for o caso: omitir NavUser do showcase, ou wrapar em um `<Sidebar>` minimal. Decisão simples: **omitir NavUser** se quebrar, anotar no spec/banner.

- [ ] **Step 1: Implement `Composites`**

`app/(app)/configuracoes/design-system/_sections/composites.tsx`:

```tsx
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
import { LoginForm } from '@/components/login-form';
import { AcceptInviteForm } from '@/components/accept-invite-form';
import { UsersTableView } from '@/components/users/users-table-view';
import { InvitationsTableView } from '@/components/users/invitations-table-view';
import { Section } from './section';

type UserItem = UserListResponseDto['items'][number];
type InvItem = InvitationListResponseDto['items'][number];

const mockUsers: UserItem[] = [
  {
    id: '00000000-0000-7000-8000-000000000001',
    companyId: '00000000-0000-7000-8000-0000000000aa',
    name: 'Maria Atendente',
    email: 'maria@example.com',
    role: 'AGENT',
    absenceMessage: null,
    absenceActive: false,
    lastSeenAt: '2026-05-08T10:30:00.000Z',
    departments: [{ id: 'd1', name: 'Suporte' }],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-08T10:30:00.000Z',
  },
  {
    id: '00000000-0000-7000-8000-000000000002',
    companyId: '00000000-0000-7000-8000-0000000000aa',
    name: 'João Admin',
    email: 'joao@example.com',
    role: 'ADMIN',
    absenceMessage: 'De férias',
    absenceActive: true,
    lastSeenAt: '2026-05-07T09:15:00.000Z',
    departments: [
      { id: 'd1', name: 'Suporte' },
      { id: 'd2', name: 'Vendas' },
    ],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-07T09:15:00.000Z',
  },
  {
    id: '00000000-0000-7000-8000-000000000003',
    companyId: '00000000-0000-7000-8000-0000000000aa',
    name: 'Ana Atendente',
    email: 'ana@example.com',
    role: 'AGENT',
    absenceMessage: null,
    absenceActive: false,
    lastSeenAt: null,
    departments: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
];

const mockInvitations: InvItem[] = [
  {
    id: '00000000-0000-7000-8000-000000000010',
    email: 'pendente@example.com',
    role: 'AGENT',
    status: 'PENDING',
    invitedByName: 'Maria Atendente',
    createdAt: '2026-05-08T08:00:00.000Z',
    expiresAt: null,
    acceptedAt: null,
    revokedAt: null,
  },
  {
    id: '00000000-0000-7000-8000-000000000011',
    email: 'aceito@example.com',
    role: 'ADMIN',
    status: 'ACCEPTED',
    invitedByName: 'João Admin',
    createdAt: '2026-05-05T08:00:00.000Z',
    expiresAt: null,
    acceptedAt: '2026-05-06T10:00:00.000Z',
    revokedAt: null,
  },
  {
    id: '00000000-0000-7000-8000-000000000012',
    email: 'revogado@example.com',
    role: 'AGENT',
    status: 'REVOKED',
    invitedByName: 'João Admin',
    createdAt: '2026-05-01T08:00:00.000Z',
    expiresAt: null,
    acceptedAt: null,
    revokedAt: '2026-05-03T11:00:00.000Z',
  },
];

export function Composites() {
  return (
    <Section id="compostos" title="Compostos">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-medium">LoginForm</h3>
          <p className="text-muted-foreground text-xs">
            Submit dispara request real — visualização apenas.
          </p>
          <LoginForm />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-base font-medium">AcceptInviteForm</h3>
          <p className="text-muted-foreground text-xs">Mock data — submit decorativo.</p>
          <AcceptInviteForm
            token="mock-token"
            email="convidado@example.com"
            role="AGENT"
            companyName="Empresa Demo"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">UsersTableView — estado ready</h3>
        <UsersTableView state="ready" items={mockUsers} />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">UsersTableView — estado loading</h3>
        <UsersTableView state="loading" items={[]} />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">UsersTableView — estado error</h3>
        <UsersTableView state="error" items={[]} />
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">InvitationsTableView — estado ready</h3>
        <InvitationsTableView
          state="ready"
          items={mockInvitations}
          emptyStatusLabel="pendente"
          onAction={() => {
            /* decorativo */
          }}
        />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">InvitationsTableView — estado loading</h3>
        <InvitationsTableView
          state="loading"
          items={[]}
          emptyStatusLabel="pendente"
          onAction={() => {}}
        />
      </div>
      <div>
        <h3 className="mb-3 text-base font-medium">InvitationsTableView — estado error</h3>
        <InvitationsTableView
          state="error"
          items={[]}
          emptyStatusLabel="pendente"
          onAction={() => {}}
        />
      </div>
    </Section>
  );
}
```

> **NavUser intencionalmente omitido:** se `NavUser` depender de `useSidebar()` (a implementação atual usa), renderizar fora de `<Sidebar>` quebra. Pra manter a página simples, omitimos NavUser do showcase. Na nota inicial da Section pode-se mencionar: "NavUser visível na sidebar do app — não renderizado aqui pra evitar dupla instância".

- [ ] **Step 2: Atualizar `page.tsx`**

```tsx
import { Composites } from './_sections/composites';
```

E adicionar ao `<main>` após Section "Primitivos":

```tsx
<Composites />
```

> Note que `Composites` já contém o seu próprio `<Section id="compostos">`. Não wrappar de novo.

- [ ] **Step 3: Run tests + typecheck + build**

```bash
pnpm test app/\(app\)/configuracoes/design-system && pnpm typecheck && pnpm build
```

Expected: tudo verde.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/configuracoes/design-system/
git commit -m "feat(design-system): section de compostos (LoginForm, AcceptInviteForm, UsersTableView, InvitationsTableView)"
```

---

## Task 7: Sidebar link + verificação final + ROADMAP

**Files:**

- Modify: `components/app-sidebar.tsx`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Adicionar link na sidebar**

Em `components/app-sidebar.tsx`, no array `settingsSubItems`:

```tsx
const settingsSubItems = [
  { href: '/configuracoes/departamentos', label: 'Departamentos' },
  { href: '/configuracoes/tags', label: 'Tags' },
  { href: '/configuracoes/usuarios', label: 'Usuários' },
  { href: '/configuracoes/quick-replies', label: 'Quick Replies' },
  { href: '/configuracoes/canais', label: 'Canais' },
  { href: '/configuracoes/integracoes', label: 'Integrações' },
  { href: '/configuracoes/preferencias', label: 'Preferências' },
  { href: '/configuracoes/design-system', label: 'Design System' },
] as const;
```

> **Decisão de posição**: ao final, depois de "Preferências". É a ordem mais natural — link de "ferramenta interna" não compete com itens de configuração funcional.

- [ ] **Step 2: Atualizar ROADMAP**

Em `ROADMAP.md`, na seção §4.8, mudar:

```md
- [ ] Showcase `/design-system` (catálogo de componentes shadcn aplicados ao tema DigiChat)
```

para:

```md
- [x] Showcase `/configuracoes/design-system` (catálogo descritivo de tokens + primitivos shadcn + compostos do projeto, Sprint 0.17)
```

- [ ] **Step 3: Verificação completa**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: tudo verde.

```bash
pnpm generate:api:from-snapshot && git diff --exit-code lib/generated
```

Expected: zero diff (não esperamos mudanças em OpenAPI).

- [ ] **Step 4: Verificação manual**

```bash
pnpm dev
```

Em `http://localhost:3001/configuracoes/design-system`:

1. Logado como ADMIN/SUPER_ADMIN — página deve carregar; TOC funciona; clicar em links de âncora rola até as seções; overlays abrem; toasts aparecem.
2. Trocar tema (toggle no header) — dark mode renderiza sem regressões.
3. Logout, login como AGENT — acessar `/configuracoes/design-system` deve redirecionar pra `/atendimentos` (gate herdado).

- [ ] **Step 5: Commit**

```bash
git add components/app-sidebar.tsx ROADMAP.md
git commit -m "$(cat <<'EOF'
feat(design-system): adiciona link na sidebar + fecha gap §4.8 do ROADMAP

Sub-item "Design System" no grupo Configurações (gated pra ADMIN/SUPER_ADMIN
via layout existente). Atualiza ROADMAP marcando o gap como entregue.
EOF
)"
```

- [ ] **Step 6: Push e abrir PR**

```bash
git push -u origin feat/design-system-showcase
gh pr create --title "feat(design-system): showcase /configuracoes/design-system (Sprint 0.17)" --body "$(cat <<'EOF'
## Summary
- Página `/configuracoes/design-system` com TOC sticky lateral catalogando tokens visuais (cores, tipografia, spacing/radius/sombras), primitivos shadcn (24 componentes) e compostos do projeto (LoginForm, AcceptInviteForm, UsersTableView, InvitationsTableView com mock data nos 3 estados).
- Refactor pequeno em `UsersTable`/`InvitationsTable` — split em View + Container. API pública preservada, testes existentes verdes, View testada em isolamento.
- Banner de drift documenta divergência conhecida entre `design-system.md` e `globals.css` (gap §4.8 ROADMAP "Tema final consolidado", fora deste escopo).

Fecha gap §4.8 "Showcase /design-system".

## Test plan
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` verde
- [ ] Login como ADMIN: `/configuracoes/design-system` carrega; TOC funciona; overlays abrem; toasts aparecem; light/dark sem regressão
- [ ] Login como AGENT: rota redireciona pra `/atendimentos` (gate herdado)
- [ ] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated` zero diff
EOF
)"
```

---

## Self-review checklist (do plano)

Após implementar, verificar:

- [ ] Todas as sections do spec (§3 estrutura de arquivos) foram criadas?
- [ ] Drift banner aparece no topo?
- [ ] TOC contém os anchors corretos para todas as sections?
- [ ] Compostos data-bound têm split View + Container, e os tests originais ainda passam?
- [ ] Sidebar tem o link, ROADMAP foi atualizado?
- [ ] Verificação manual em light + dark + RBAC OK?

Se qualquer item falhar, fix-up commit antes de mergear.
