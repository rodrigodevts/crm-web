# Sprint 0.21 Fase B — `/configuracoes/usuarios` CRUD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o CRUD da tela `/configuracoes/usuarios` (editar, desativar soft, reativar, forçar logout, filtros search/role/status) e reorganizar a página em tabs `Usuários | Convites` com foco principal na tabela de usuários.

**Architecture:** Frontend-only. Split data/view replicando o pattern de Tags (PR #27). `UsersTable` (Client, fetcher) calcula gates (`me`, `lastActiveAdminId`) e passa funções `canEditItem`/`canDeactivateItem`/`canForceLogoutItem` pra `UsersTableView`. Três dialogs novos (`UserDialog` edit-only, `DeactivateUserDialog`, `ForceLogoutUserDialog`) seguem o padrão dos respectivos análogos em `components/tags/` e `components/quick-replies/`. Reativar é inline (PATCH `active: true` direto + invalidate, sem AlertDialog). Page ganha `UsersPageTabs` Client wrapper com `<Tabs>` shadcn embrulhando `<UsersTable />` e `<InvitationsTable />`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript estrito, Tailwind 4, shadcn/ui, TanStack Query 5 (hooks gerados via Kubb), React Hook Form 7 + Zod, Vitest + RTL.

**Spec:** [docs/superpowers/specs/2026-05-09-sprint-0-21-users-crud-frontend-design.md](../specs/2026-05-09-sprint-0-21-users-crud-frontend-design.md)

---

## Premissas

- Branch `feat/users-crud-screen` já criada a partir de `origin/main` atualizado, com commit `44941cb` (spec + sync de snapshot da Fase A do crm-api PR #49 + fix-up de fixtures que ganharam `active`).
- Trabalho subsequente acontece nesta mesma branch via commits incrementais.
- Verificação local: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` ao final de cada task. `pnpm build` fica fora do gate (limitação documentada em CLAUDE.md §11).
- Hooks gerados existem: `useUsersControllerList` (com params `active`, `role`, `search`, `limit`), `useUsersControllerUpdate`, `useUsersControllerDelete`, `useUsersControllerForceLogout`, `useDepartmentsControllerList`. `usersControllerListQueryKey` é exportado de `useUsersControllerList`.
- `useCurrentUser()` é hook de contexto disponível em qualquer Client Component (vem de `@/contexts/current-user-context`).
- `getInitials(name)` existe em `@/lib/initials`.
- `<Avatar>`, `<Tabs>`, `<AlertDialog>`, `<Dialog>`, `<Checkbox>`, `<Select>`, `<Switch>`, `<InputGroup>`, `<Skeleton>` já estão instalados em `components/ui/`.

## Files

### Modify

- `components/users/users-table-view.tsx` — extende para 7 colunas (avatar, badges contextuais, status, ações) e props de gates.
- `components/users/users-table-view.test.tsx` — extende cobertura.
- `components/users/users-table.tsx` — vira fetcher completo com filtros, gates, dialogs.
- `components/users/users-table.test.tsx` — extende cobertura.
- `app/(app)/configuracoes/usuarios/page.tsx` — passa a usar `UsersPageTabs`, ajusta subtítulo.
- `ROADMAP.md` — marca Sprint 0.21 como entregue na §4.8.

### Create

- `components/users/user-dialog.tsx` — modal edit-only.
- `components/users/user-dialog.test.tsx` — RTL.
- `components/users/deactivate-user-dialog.tsx` — AlertDialog + DELETE.
- `components/users/deactivate-user-dialog.test.tsx` — RTL.
- `components/users/force-logout-user-dialog.tsx` — AlertDialog + POST.
- `components/users/force-logout-user-dialog.test.tsx` — RTL.
- `app/(app)/configuracoes/usuarios/users-page-tabs.tsx` — Client wrapper das tabs.

---

## Task 1: `UsersTableView` — adicionar coluna Status, avatar e props da row API

**Files:**

- Modify: `components/users/users-table-view.tsx`
- Modify: `components/users/users-table-view.test.tsx`

Estende a view pra:

- Coluna **Status** com badge Ativo/Inativo.
- **Avatar** (`<Avatar>` shadcn + `getInitials`) na mesma célula do Nome, à esquerda.
- Novas props: `me: UserResponseDto`, `canEditItem`, `canDeactivateItem`, `canForceLogoutItem`, `onEdit`, `onDeactivate`, `onForceLogout`, `onReactivate`, `emptyMessage?`.
- Coluna **Ações** com botões condicionais por gate; Reativar quando inativo.
- Badges contextuais ("Você", "Conta da plataforma") substituem ou se sobrepõem ao "Ausente" — prioridade Você > Conta da plataforma > Ausente.

- [ ] **Step 1: Substituir `users-table-view.test.tsx` pelo novo conjunto de testes**

Conteúdo completo (sobrescreve o arquivo):

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { UsersTableView } from './users-table-view';

type Item = UserListResponseDto['items'][number];

const baseItem = (overrides: Partial<Item> = {}): Item => ({
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Maria Atendente',
  email: 'maria@example.com',
  role: 'AGENT',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T10:30:00.000Z',
  departments: [{ id: 'd1', name: 'Suporte' }],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

const baseMe: UserResponseDto = {
  id: '00000000-0000-7000-8000-0000000000ad',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Admin Logado',
  email: 'admin@example.com',
  role: 'ADMIN',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T11:00:00.000Z',
  departments: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T11:00:00.000Z',
};

const noopHandlers = {
  onEdit: vi.fn(),
  onDeactivate: vi.fn(),
  onForceLogout: vi.fn(),
  onReactivate: vi.fn(),
};

const allowAll = {
  canEditItem: () => true,
  canDeactivateItem: () => true,
  canForceLogoutItem: () => true,
};

describe('UsersTableView', () => {
  it('renderiza skeletons no estado loading', () => {
    const { container } = render(
      <UsersTableView state="loading" items={[]} me={baseMe} {...allowAll} {...noopHandlers} />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza mensagem de erro no estado error', () => {
    render(<UsersTableView state="error" items={[]} me={baseMe} {...allowAll} {...noopHandlers} />);
    expect(screen.getByText('Erro ao carregar usuários.')).toBeInTheDocument();
  });

  it('renderiza empty state default quando ready e items vazio', () => {
    render(<UsersTableView state="ready" items={[]} me={baseMe} {...allowAll} {...noopHandlers} />);
    expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument();
  });

  it('usa emptyMessage customizada quando fornecida', () => {
    render(
      <UsersTableView
        state="ready"
        items={[]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
        emptyMessage="Nenhum usuário inativo encontrado."
      />,
    );
    expect(screen.getByText('Nenhum usuário inativo encontrado.')).toBeInTheDocument();
  });

  it('renderiza linha completa: avatar com iniciais, nome, email, role traduzido, departamentos, lastSeenAt e badge Ativo', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem()]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('MA')).toBeInTheDocument(); // iniciais Maria Atendente
    expect(screen.getByText('Maria Atendente')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('exibe badge "Inativo" quando active é false', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ active: false })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('placeholder em última atividade quando lastSeenAt é null', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ lastSeenAt: null })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
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
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Suporte, Vendas')).toBeInTheDocument();
  });

  it('mostra badge "Você" quando linha é do próprio usuário (sem importar absenceActive)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ id: baseMe.id, name: 'Admin Logado', absenceActive: true })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Você')).toBeInTheDocument();
    // Prioridade: Você suprime Ausente
    expect(screen.queryByText('Ausente')).not.toBeInTheDocument();
  });

  it('mostra badge "Conta da plataforma" quando role é SUPER_ADMIN', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ role: 'SUPER_ADMIN', absenceActive: true })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Conta da plataforma')).toBeInTheDocument();
    expect(screen.queryByText('Ausente')).not.toBeInTheDocument();
  });

  it('mostra badge "Ausente" quando absenceActive=true e nenhuma prioridade maior se aplica', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ absenceActive: true })]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Ausente')).toBeInTheDocument();
  });

  it('mostra Editar, Desativar e Forçar logout em linha normal ativa, sem Reativar', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem()]}
        me={baseMe}
        {...allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('button', { name: /editar usuário/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desativar usuário/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forçar logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reativar/i })).not.toBeInTheDocument();
  });

  it('esconde Editar/Desativar/Forçar logout quando os gates retornam false (linha self ou SUPER_ADMIN)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ id: baseMe.id })]}
        me={baseMe}
        canEditItem={() => false}
        canDeactivateItem={() => false}
        canForceLogoutItem={() => false}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desativar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /forçar logout/i })).not.toBeInTheDocument();
  });

  it('esconde só Desativar quando gate de deactivate retorna false (último ADMIN ativo)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ role: 'ADMIN' })]}
        me={baseMe}
        canEditItem={() => true}
        canDeactivateItem={() => false}
        canForceLogoutItem={() => true}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('button', { name: /editar usuário/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desativar usuário/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forçar logout/i })).toBeInTheDocument();
  });

  it('linha inativa mostra Reativar e oculta Desativar/Forçar logout (gate retorna false)', () => {
    render(
      <UsersTableView
        state="ready"
        items={[baseItem({ active: false })]}
        me={baseMe}
        canEditItem={() => true}
        canDeactivateItem={() => false}
        canForceLogoutItem={() => false}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('button', { name: /reativar usuário/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desativar usuário/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /forçar logout/i })).not.toBeInTheDocument();
  });

  it('aciona onEdit/onDeactivate/onForceLogout/onReactivate ao clicar nos botões', async () => {
    const onEdit = vi.fn();
    const onDeactivate = vi.fn();
    const onForceLogout = vi.fn();
    const onReactivate = vi.fn();
    const user = userEvent.setup();

    const itemActive = baseItem();
    const itemInactive = baseItem({ id: 'i2', name: 'Inativo Foo', active: false });

    render(
      <UsersTableView
        state="ready"
        items={[itemActive, itemInactive]}
        me={baseMe}
        canEditItem={() => true}
        canDeactivateItem={(u) => u.active}
        canForceLogoutItem={(u) => u.active}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
        onForceLogout={onForceLogout}
        onReactivate={onReactivate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /editar usuário maria atendente/i }));
    await user.click(screen.getByRole('button', { name: /desativar usuário maria atendente/i }));
    await user.click(
      screen.getByRole('button', { name: /forçar logout do usuário maria atendente/i }),
    );
    await user.click(screen.getByRole('button', { name: /reativar usuário inativo foo/i }));

    expect(onEdit).toHaveBeenCalledWith(itemActive);
    expect(onDeactivate).toHaveBeenCalledWith(itemActive);
    expect(onForceLogout).toHaveBeenCalledWith(itemActive);
    expect(onReactivate).toHaveBeenCalledWith(itemInactive);
  });
});
```

- [ ] **Step 2: Rodar `pnpm test components/users/users-table-view.test.tsx` — esperar falhas**

Esperado: muitos `Element: not found` e erros de typing no `UsersTableView` (props novas ainda não aceitas).

- [ ] **Step 3: Substituir `users-table-view.tsx` pela implementação que cobre os testes**

Conteúdo completo (sobrescreve o arquivo):

```tsx
import { PencilIcon, BanIcon, RotateCcwIcon, LogOutIcon } from 'lucide-react';
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { getInitials } from '@/lib/initials';

export type UserListItem = UserListResponseDto['items'][number];

export type UsersTableState = 'loading' | 'error' | 'ready';

export interface UsersTableViewProps {
  state: UsersTableState;
  items: UserListItem[];
  me: UserResponseDto;
  canEditItem: (item: UserListItem) => boolean;
  canDeactivateItem: (item: UserListItem) => boolean;
  canForceLogoutItem: (item: UserListItem) => boolean;
  onEdit: (item: UserListItem) => void;
  onDeactivate: (item: UserListItem) => void;
  onForceLogout: (item: UserListItem) => void;
  onReactivate: (item: UserListItem) => void;
  emptyMessage?: string;
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

function nameBadgeLabel(item: UserListItem, me: UserResponseDto): string | null {
  if (item.id === me.id) return 'Você';
  if (item.role === 'SUPER_ADMIN') return 'Conta da plataforma';
  if (item.absenceActive) return 'Ausente';
  return null;
}

export function UsersTableView({
  state,
  items,
  me,
  canEditItem,
  canDeactivateItem,
  canForceLogoutItem,
  onEdit,
  onDeactivate,
  onForceLogout,
  onReactivate,
  emptyMessage = 'Nenhum usuário encontrado.',
}: UsersTableViewProps) {
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
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state === 'loading' ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : state === 'error' ? (
            <TableRow>
              <TableCell colSpan={7} className="text-destructive text-center">
                Erro ao carregar usuários.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((user) => {
              const badge = nameBadgeLabel(user, me);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {badge ? (
                          <Badge variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{ROLE_LABEL[user.role]}</TableCell>
                  <TableCell>{formatDepartments(user.departments)}</TableCell>
                  <TableCell>{formatLastSeen(user.lastSeenAt)}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'default' : 'outline'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEditItem(user) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                          aria-label={`Editar usuário ${user.name}`}
                        >
                          <PencilIcon className="size-4" />
                          Editar
                        </Button>
                      ) : null}
                      {user.active && canDeactivateItem(user) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeactivate(user)}
                          aria-label={`Desativar usuário ${user.name}`}
                        >
                          <BanIcon className="size-4" />
                          Desativar
                        </Button>
                      ) : null}
                      {user.active && canForceLogoutItem(user) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onForceLogout(user)}
                          aria-label={`Forçar logout do usuário ${user.name}`}
                          className="text-destructive"
                        >
                          <LogOutIcon className="size-4" />
                          Forçar logout
                        </Button>
                      ) : null}
                      {!user.active && user.role !== 'SUPER_ADMIN' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReactivate(user)}
                          aria-label={`Reativar usuário ${user.name}`}
                        >
                          <RotateCcwIcon className="size-4" />
                          Reativar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 4: Rodar `pnpm test components/users/users-table-view.test.tsx`**

Esperado: PASS em todos os testes.

- [ ] **Step 5: Verificação local**

Rodar: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`. Tudo verde.

> Nota: `users-table.tsx` ainda passa props antigas (`state` + `items`) e vai quebrar typecheck quando consumir o novo `UsersTableView`. Isso é endereçado na Task 2 — ainda nesta task **não** é esperado typecheck verde se o consumidor ainda existir. Caso o typecheck quebre nesta task antes da Task 2 começar, o problema está em `users-table.tsx`. **Adiar commit pra depois da Task 2.**

- [ ] **Step 6: Adiar commit pra Task 2**

Razão: o consumer (`users-table.tsx`) precisa ser atualizado pra passar as novas props. Commitar agora deixaria o repo com typecheck quebrado.

---

## Task 2: `UsersTable` (fetcher) — filtros, gates, dialogs, reativar inline

**Files:**

- Modify: `components/users/users-table.tsx`
- Modify: `components/users/users-table.test.tsx`

Toolbar acima da tabela com search debounced + Select Role + Select Status. Calcula `me` via `useCurrentUser()`, `lastActiveAdminId` via `useMemo`. Mantém estado dos targets dos 3 dialogs e handler de reativar inline. Dialogs ainda **não existem** nesta task — a UsersTable importa placeholders no-op temporários e os substitui nas tasks 3/4/5. Pra evitar muitos commits intermediários quebrados, esta task **importa antecipadamente** os 3 dialogs criados nas Tasks 3/4/5; portanto, **não compila isoladamente até as 3/4/5 prontas**. Solução: nas Tasks 3/4/5 implementar primeiro os dialogs e só ao final (Task 5) commitar o conjunto Task 1+2+3+4+5 num commit único de `feat(users): tela /configuracoes/usuarios CRUD`. Para preservar TDD, cada task abaixo exige seus testes verdes antes de avançar — só o **commit** é adiado.

- [ ] **Step 1: Substituir `users-table.test.tsx` pelo conjunto novo**

Conteúdo completo (sobrescreve o arquivo):

```tsx
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { UsersTable } from './users-table';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

const me: UserResponseDto = {
  id: '00000000-0000-7000-8000-0000000000ad',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Admin Logado',
  email: 'admin@example.com',
  role: 'ADMIN',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T11:00:00.000Z',
  departments: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T11:00:00.000Z',
};

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <CurrentUserProvider user={me}>{children}</CurrentUserProvider>
    </QueryClientProvider>
  );
}

const originalAdapter = apiClient.defaults.adapter;

interface Department {
  id: string;
  name: string;
}

const sampleUser = (overrides: Record<string, unknown> = {}) => ({
  id: '00000000-0000-7000-8000-000000000001',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Maria Atendente',
  email: 'maria@example.com',
  role: 'AGENT',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T10:30:00.000Z',
  departments: [{ id: '00000000-0000-7000-8000-0000000000bb', name: 'Suporte' }] as Department[],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

type AdapterCall = AxiosRequestConfig;

function setListAdapter(items: unknown[], hasMore = false): { calls: AdapterCall[] } {
  const calls: AdapterCall[] = [];
  const adapter = vi.fn().mockImplementation((config: AdapterCall) => {
    calls.push(config);
    return Promise.resolve({
      data: { items, pagination: { nextCursor: null, hasMore } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
  return { calls };
}

function setMixedAdapter(handlers: {
  list?: (config: AdapterCall) => Promise<unknown> | unknown;
  patch?: (config: AdapterCall) => Promise<unknown> | unknown;
  delete?: (config: AdapterCall) => Promise<unknown> | unknown;
  forceLogout?: (config: AdapterCall) => Promise<unknown> | unknown;
}): { calls: AdapterCall[] } {
  const calls: AdapterCall[] = [];
  const adapter = vi.fn().mockImplementation(async (config: AdapterCall) => {
    calls.push(config);
    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();
    if (method === 'get' && url.endsWith('/users') && handlers.list) {
      return await handlers.list(config);
    }
    if (method === 'patch' && url.includes('/users/') && handlers.patch) {
      return await handlers.patch(config);
    }
    if (method === 'delete' && url.includes('/users/') && handlers.delete) {
      return await handlers.delete(config);
    }
    if (method === 'post' && url.includes('/force-logout') && handlers.forceLogout) {
      return await handlers.forceLogout(config);
    }
    return {
      data: { items: [], pagination: { nextCursor: null, hasMore: false } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
  return { calls };
}

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe('UsersTable', () => {
  it('renderiza usuário com nome, email, perfil traduzido e departamentos', async () => {
    setListAdapter([sampleUser()]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );

    expect(await screen.findByText('Maria Atendente')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('default params usam active=true e limit=50', async () => {
    const { calls } = setListAdapter([]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    const lastList = calls.find((c) => c.url?.endsWith('/users'));
    expect(lastList?.params).toMatchObject({ active: true, limit: 50 });
    expect(lastList?.params).not.toHaveProperty('search');
    expect(lastList?.params).not.toHaveProperty('role');
  });

  it('digitar no input de busca alimenta o param search após debounce', async () => {
    const { calls } = setListAdapter([]);
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    const input = screen.getByPlaceholderText('Buscar por nome ou e-mail…');
    await user.type(input, 'Maria');

    await waitFor(() => {
      const searchCall = calls.find(
        (c) => c.url?.endsWith('/users') && c.params?.search === 'Maria',
      );
      expect(searchCall).toBeTruthy();
    });
  });

  it('selecionar role=ADMIN alimenta o param role', async () => {
    const { calls } = setListAdapter([]);
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    await user.click(screen.getByLabelText('Perfil'));
    await user.click(screen.getByRole('option', { name: 'Administrador' }));

    await waitFor(() => {
      const roleCall = calls.find((c) => c.url?.endsWith('/users') && c.params?.role === 'ADMIN');
      expect(roleCall).toBeTruthy();
    });
  });

  it('selecionar Status=Inativos alimenta active=false', async () => {
    const { calls } = setListAdapter([]);
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    await user.click(screen.getByLabelText('Status'));
    await user.click(screen.getByRole('option', { name: 'Inativos' }));

    await waitFor(() => {
      const inactiveCall = calls.find(
        (c) => c.url?.endsWith('/users') && c.params?.active === false,
      );
      expect(inactiveCall).toBeTruthy();
    });
  });

  it('reativa usuário inativo inline (PATCH active=true) e exibe toast', async () => {
    const inactive = sampleUser({ id: 'u-inactive', name: 'Inativa', active: false });
    let listed = [inactive];
    const { calls } = setMixedAdapter({
      list: (config) => ({
        data: { items: listed, pagination: { nextCursor: null, hasMore: false } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
      patch: (config) => {
        listed = listed.map((u) => (u.id === 'u-inactive' ? { ...u, active: true } : u));
        return {
          data: { ...inactive, active: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      },
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );

    // mostrar inativos
    await user.click(screen.getByLabelText('Status'));
    await user.click(screen.getByRole('option', { name: 'Inativos' }));

    const reactivateBtn = await screen.findByRole('button', { name: /reativar usuário inativa/i });
    await user.click(reactivateBtn);

    await waitFor(() => {
      const patchCall = calls.find((c) => c.method === 'patch');
      expect(patchCall).toBeTruthy();
      expect(JSON.parse(patchCall!.data as string)).toEqual({ active: true });
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it('clicar Editar abre UserDialog (título "Editar usuário")', async () => {
    setListAdapter([sampleUser({ id: 'u-edit', name: 'Edit Target' })]);
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await user.click(await screen.findByRole('button', { name: /editar usuário edit target/i }));
    expect(await screen.findByText('Editar usuário')).toBeInTheDocument();
  });

  it('clicar Desativar abre DeactivateUserDialog', async () => {
    setListAdapter([sampleUser({ id: 'u-del', name: 'Del Target' })]);
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await user.click(await screen.findByRole('button', { name: /desativar usuário del target/i }));
    expect(await screen.findByText(/desativar usuário "del target"/i)).toBeInTheDocument();
  });

  it('clicar Forçar logout abre ForceLogoutUserDialog', async () => {
    setListAdapter([sampleUser({ id: 'u-fl', name: 'FL Target' })]);
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await user.click(
      await screen.findByRole('button', { name: /forçar logout do usuário fl target/i }),
    );
    expect(await screen.findByText(/forçar logout de "fl target"/i)).toBeInTheDocument();
  });

  it('linha do próprio usuário não tem ações; mostra badge "Você"', async () => {
    setListAdapter([sampleUser({ id: me.id, name: me.name })]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await screen.findByText(me.name);
    expect(screen.queryByRole('button', { name: /editar usuário/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desativar usuário/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /forçar logout/i })).not.toBeInTheDocument();
    expect(screen.getByText('Você')).toBeInTheDocument();
  });

  it('linha SUPER_ADMIN não tem ações; mostra badge "Conta da plataforma"', async () => {
    setListAdapter([sampleUser({ id: 'u-sa', name: 'Plataforma', role: 'SUPER_ADMIN' })]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await screen.findByText('Plataforma');
    expect(
      screen.queryByRole('button', { name: /editar usuário plataforma/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Conta da plataforma')).toBeInTheDocument();
  });

  it('último ADMIN ativo: mostra Editar e Forçar logout, esconde Desativar', async () => {
    setListAdapter([
      sampleUser({ id: 'u-admin', name: 'Único Admin', role: 'ADMIN' }),
      sampleUser({ id: 'u-other', name: 'Outro Atendente', role: 'AGENT' }),
    ]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await screen.findByText('Único Admin');
    expect(screen.getByRole('button', { name: /editar usuário único admin/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /desativar usuário único admin/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /forçar logout do usuário único admin/i }),
    ).toBeInTheDocument();
  });

  it('mostra nota "Mostrando os primeiros 50…" quando hasMore', async () => {
    setListAdapter([sampleUser()], true);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    expect(await screen.findByText(/Mostrando os primeiros 50/i)).toBeInTheDocument();
  });

  it('empty state contextual quando filtro Status=Inativos e lista vazia', async () => {
    let active = true;
    const { calls } = setMixedAdapter({
      list: (config) => {
        active = (config.params as { active: boolean }).active;
        return {
          data: { items: [], pagination: { nextCursor: null, hasMore: false } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      },
    });
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));

    await user.click(screen.getByLabelText('Status'));
    await user.click(screen.getByRole('option', { name: 'Inativos' }));

    expect(await screen.findByText('Nenhum usuário inativo encontrado.')).toBeInTheDocument();
    expect(active).toBe(false);
  });
});
```

> Nota: este arquivo importa `vi.mock('sonner')` antes do componente — ordem importa pra Vitest interceptar `toast.success/error`. `beforeEach` reseta as spies.

- [ ] **Step 2: Importar `beforeEach` no topo do arquivo**

Vitest exige import explícito. No topo do arquivo `users-table.test.tsx`, ajustar o primeiro import pra:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
```

(Já está no Step 1 — verifique.)

- [ ] **Step 3: Substituir `users-table.tsx` pela implementação**

Conteúdo completo (sobrescreve o arquivo):

```tsx
'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useUsersControllerList,
  usersControllerListQueryKey,
} from '@/lib/generated/hooks/useUsersControllerList';
import { useUsersControllerUpdate } from '@/lib/generated/hooks/useUsersControllerUpdate';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsersTableView, type UserListItem, type UsersTableState } from './users-table-view';
import { UserDialog } from './user-dialog';
import { DeactivateUserDialog } from './deactivate-user-dialog';
import { ForceLogoutUserDialog } from './force-logout-user-dialog';

const PAGE_LIMIT = 50;

type StatusFilter = 'active' | 'inactive';
type RoleFilter = 'all' | 'ADMIN' | 'SUPERVISOR' | 'AGENT';

const STATUS_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

const ROLE_OPTIONS: ReadonlyArray<{ value: RoleFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'AGENT', label: 'Atendente' },
];

export function UsersTable() {
  const me = useCurrentUser();
  const filterId = useId();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('active');

  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserListItem | null>(null);
  const [forceLogoutTarget, setForceLogoutTarget] = useState<UserListItem | null>(null);

  const params = useMemo(
    () => ({
      limit: PAGE_LIMIT,
      active: status === 'active',
      ...(deferredSearch.trim().length > 0 ? { search: deferredSearch.trim() } : {}),
      ...(role !== 'all' ? { role } : {}),
    }),
    [deferredSearch, role, status],
  );

  const queryClient = useQueryClient();
  const query = useUsersControllerList(params, { client: { client: apiClient } });
  const update = useUsersControllerUpdate({ client: { client: apiClient } });

  const items: UserListItem[] = query.data?.items ?? [];
  const hasMore = query.data?.pagination.hasMore ?? false;

  const lastActiveAdminId = useMemo(() => {
    const admins = items.filter((u) => u.role === 'ADMIN' && u.active);
    return admins.length === 1 ? admins[0]!.id : null;
  }, [items]);

  const canEditItem = (u: UserListItem) => u.id !== me.id && u.role !== 'SUPER_ADMIN';
  const canDeactivateItem = (u: UserListItem) =>
    u.active &&
    u.id !== me.id &&
    u.role !== 'SUPER_ADMIN' &&
    !(u.role === 'ADMIN' && u.id === lastActiveAdminId);
  const canForceLogoutItem = (u: UserListItem) =>
    u.active && u.id !== me.id && u.role !== 'SUPER_ADMIN';

  const handleReactivate = async (item: UserListItem) => {
    try {
      await update.mutateAsync({ id: item.id, data: { active: true } });
      toast.success(`Usuário "${item.name}" reativado.`);
      void queryClient.invalidateQueries({
        queryKey: usersControllerListQueryKey(),
        exact: false,
      });
    } catch {
      toast.error('Não foi possível reativar o usuário. Tente novamente.');
    }
  };

  const tableState: UsersTableState = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : 'ready';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={`${filterId}-search`} className="sr-only">
          Buscar por nome ou e-mail
        </Label>
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id={`${filterId}-search`}
            type="search"
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${filterId}-role`} className="text-muted-foreground text-sm">
            Perfil
          </Label>
          <Select value={role} onValueChange={(v) => setRole(v as RoleFilter)}>
            <SelectTrigger id={`${filterId}-role`} className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${filterId}-status`} className="text-muted-foreground text-sm">
            Status
          </Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger id={`${filterId}-status`} className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <UsersTableView
        state={tableState}
        items={items}
        me={me}
        canEditItem={canEditItem}
        canDeactivateItem={canDeactivateItem}
        canForceLogoutItem={canForceLogoutItem}
        onEdit={(item) => setEditTarget(item)}
        onDeactivate={(item) => setDeactivateTarget(item)}
        onForceLogout={(item) => setForceLogoutTarget(item)}
        onReactivate={(item) => void handleReactivate(item)}
        emptyMessage={
          status === 'active'
            ? 'Nenhum usuário ativo encontrado.'
            : 'Nenhum usuário inativo encontrado.'
        }
      />

      {hasMore ? (
        <p className="text-muted-foreground text-sm">
          Mostrando os primeiros {PAGE_LIMIT} resultados. Use a busca para refinar.
        </p>
      ) : null}

      <UserDialog
        user={editTarget ?? undefined}
        open={!!editTarget}
        onOpenChange={(next) => {
          if (!next) setEditTarget(null);
        }}
      />

      <DeactivateUserDialog
        user={deactivateTarget}
        open={!!deactivateTarget}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null);
        }}
      />

      <ForceLogoutUserDialog
        user={forceLogoutTarget}
        open={!!forceLogoutTarget}
        onOpenChange={(next) => {
          if (!next) setForceLogoutTarget(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Não rodar testes ainda — dialogs não existem**

Razão: a Task importa 3 dialogs ainda não criados. `pnpm typecheck` vai falhar até as Tasks 3/4/5 prontas. **Adiar verificação local pra Task 5 Step final.**

---

## Task 3: `UserDialog` (modo edit only)

**Files:**

- Create: `components/users/user-dialog.tsx`
- Create: `components/users/user-dialog.test.tsx`

Dialog edit-only, RHF + zodResolver, schema local em pt-BR. Campos: nome, email, role (select), departments (multi-select via checkboxes em scrollable). Tratamento de erros 409 email / 409 último admin / 403 / 400 / 5xx / network.

- [ ] **Step 1: Criar `components/users/user-dialog.test.tsx`**

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { UserDialog } from './user-dialog';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

const me: UserResponseDto = {
  id: '00000000-0000-7000-8000-0000000000ad',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Admin Logado',
  email: 'admin@example.com',
  role: 'ADMIN',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: null,
  departments: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <CurrentUserProvider user={me}>{children}</CurrentUserProvider>
    </QueryClientProvider>
  );
}

const originalAdapter = apiClient.defaults.adapter;

const targetUser: UserResponseDto = {
  id: '00000000-0000-7000-8000-0000000000bb',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Maria Atendente',
  email: 'maria@example.com',
  role: 'AGENT',
  active: true,
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: null,
  departments: [{ id: 'd1', name: 'Suporte' }],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const departmentsList = {
  items: [
    { id: 'd1', name: 'Suporte', companyId: 'c', active: true, createdAt: '', updatedAt: '' },
    { id: 'd2', name: 'Vendas', companyId: 'c', active: true, createdAt: '', updatedAt: '' },
  ],
  pagination: { nextCursor: null, hasMore: false },
};

function setAdapter(handlers: {
  patch?: (config: AxiosRequestConfig) => Promise<unknown> | unknown;
  departments?: typeof departmentsList | (() => typeof departmentsList);
}): { calls: AxiosRequestConfig[] } {
  const calls: AxiosRequestConfig[] = [];
  const adapter = vi.fn().mockImplementation(async (config: AxiosRequestConfig) => {
    calls.push(config);
    const url = config.url ?? '';
    if (url.endsWith('/departments') && (config.method ?? 'get').toLowerCase() === 'get') {
      const data =
        typeof handlers.departments === 'function'
          ? handlers.departments()
          : (handlers.departments ?? departmentsList);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (url.includes('/users/') && (config.method ?? '').toLowerCase() === 'patch') {
      if (handlers.patch) return await handlers.patch(config);
    }
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
  return { calls };
}

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe('UserDialog', () => {
  it('preenche o form com dados do user passado e renderiza departamentos', async () => {
    setAdapter({});
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );

    expect(await screen.findByLabelText(/nome/i)).toHaveValue('Maria Atendente');
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('maria@example.com');
    expect(screen.getByText('Atendente')).toBeInTheDocument();
    // Suporte aparece checked, Vendas aparece unchecked após carregar
    const suporte = await screen.findByLabelText('Suporte');
    expect(suporte).toBeChecked();
    expect(screen.getByLabelText('Vendas')).not.toBeChecked();
  });

  it('valida nome com mínimo de 2 caracteres', async () => {
    setAdapter({});
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    const nameInput = await screen.findByLabelText(/nome/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'M');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/pelo menos 2 caracteres/i)).toBeInTheDocument();
  });

  it('valida formato de e-mail', async () => {
    setAdapter({});
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    const emailInput = await screen.findByLabelText(/e-mail/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'nao-eh-email');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/em formato inválido/i)).toBeInTheDocument();
  });

  it('submete PATCH com payload correto e fecha o dialog', async () => {
    const onOpenChange = vi.fn();
    const { calls } = setAdapter({
      patch: (config) => ({
        data: { ...targetUser, name: 'Maria Atualizada' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );
    const nameInput = await screen.findByLabelText(/nome/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Maria Atualizada');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      const patch = calls.find((c) => (c.method ?? '').toLowerCase() === 'patch');
      expect(patch).toBeTruthy();
      expect(JSON.parse(patch!.data as string)).toEqual({
        name: 'Maria Atualizada',
        email: 'maria@example.com',
        role: 'AGENT',
        departmentIds: ['d1'],
      });
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('mapeia 409 com mensagem mencionando email para o campo email', async () => {
    setAdapter({
      patch: () => {
        const err = Object.assign(new Error('Conflict'), {
          response: {
            status: 409,
            data: { message: 'E-mail já está em uso' },
          },
        });
        throw err;
      },
    });
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    await screen.findByLabelText(/nome/i);
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));
    expect(await screen.findByText('E-mail já está em uso')).toBeInTheDocument();
  });

  it('mapeia 409 com mensagem de último admin para o root', async () => {
    setAdapter({
      patch: () => {
        const err = Object.assign(new Error('Conflict'), {
          response: {
            status: 409,
            data: { message: 'É necessário manter ao menos um administrador ativo.' },
          },
        });
        throw err;
      },
    });
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    await screen.findByLabelText(/nome/i);
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));
    expect(await screen.findByText(/manter ao menos um administrador ativo/i)).toBeInTheDocument();
  });

  it('mapeia 403 para mensagem genérica de permissão no root', async () => {
    setAdapter({
      patch: () => {
        const err = Object.assign(new Error('Forbidden'), {
          response: { status: 403, data: { message: 'forbidden' } },
        });
        throw err;
      },
    });
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    await screen.findByLabelText(/nome/i);
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));
    expect(
      await screen.findByText(/não tem permissão para alterar esta conta/i),
    ).toBeInTheDocument();
  });

  it('aceita check/uncheck de departamentos e envia departmentIds vazio quando todos desmarcados', async () => {
    const { calls } = setAdapter({
      patch: (config) => ({
        data: { ...targetUser, departments: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    const suporte = await screen.findByLabelText('Suporte');
    await user.click(suporte); // uncheck
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      const patch = calls.find((c) => (c.method ?? '').toLowerCase() === 'patch');
      expect(patch).toBeTruthy();
      expect(JSON.parse(patch!.data as string).departmentIds).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Criar `components/users/user-dialog.tsx`**

```tsx
'use client';

import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUsersControllerUpdate } from '@/lib/generated/hooks/useUsersControllerUpdate';
import { usersControllerListQueryKey } from '@/lib/generated/hooks/useUsersControllerList';
import { useDepartmentsControllerList } from '@/lib/generated/hooks/useDepartmentsControllerList';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import type { UpdateUserDto } from '@/lib/generated/types/UpdateUserDto';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'AGENT', label: 'Atendente' },
] as const;

type EditableRole = (typeof ROLE_OPTIONS)[number]['value'];

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome precisa ter pelo menos 2 caracteres')
    .max(100, 'Máximo de 100 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail em formato inválido'),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']),
  departmentIds: z.array(z.string().uuid()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  name: '',
  email: '',
  role: 'AGENT',
  departmentIds: [],
};

function toFormValues(user: UserResponseDto): FormValues {
  return {
    name: user.name,
    email: user.email,
    role: (user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role) as EditableRole,
    departmentIds: user.departments.map((d) => d.id),
  };
}

type BackendValidationError = {
  errors?: Array<{ field: string; message: string }>;
  message?: string;
};

type AxiosLikeError = {
  response?: { status?: number; data?: BackendValidationError };
};

function isLastAdminMessage(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('administrador') ||
    lower.includes('admin') ||
    lower.includes('último') ||
    lower.includes('last')
  );
}

function isEmailConflictMessage(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('email') ||
    lower.includes('e-mail') ||
    lower.includes('uso') ||
    lower.includes('exists')
  );
}

interface UserDialogProps {
  user?: UserResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const queryClient = useQueryClient();
  const fieldId = useId();

  const update = useUsersControllerUpdate({ client: { client: apiClient } });
  const departmentsQuery = useDepartmentsControllerList(
    { active: true, limit: 100 },
    { client: { client: apiClient } },
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(user ? toFormValues(user) : DEFAULT_VALUES);
  }, [open, user, reset]);

  const handleClose = () => onOpenChange(false);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    const payload: UpdateUserDto = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      departmentIds: values.departmentIds,
    };

    try {
      await update.mutateAsync({ id: user.id, data: payload });
      toast.success(`Usuário "${payload.name}" atualizado.`);
      void queryClient.invalidateQueries({
        queryKey: usersControllerListQueryKey(),
        exact: false,
      });
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr?.response?.status;
      const data = axiosErr?.response?.data;
      const message = data?.message;

      if (status === 409 && isEmailConflictMessage(message)) {
        setError('email', { message: message ?? 'E-mail já em uso.' });
        return;
      }
      if (status === 409 && isLastAdminMessage(message)) {
        setError('root', {
          message: message ?? 'É necessário manter ao menos um administrador ativo.',
        });
        return;
      }
      if (status === 409) {
        setError('root', { message: message ?? 'Conflito ao salvar.' });
        return;
      }
      if (status === 403) {
        setError('root', { message: 'Você não tem permissão para alterar esta conta.' });
        return;
      }
      if (status === 400 && Array.isArray(data?.errors) && data.errors.length > 0) {
        let mappedAny = false;
        for (const issue of data.errors) {
          if (issue.field === 'name' || issue.field === 'email' || issue.field === 'role') {
            setError(issue.field, { message: issue.message });
            mappedAny = true;
          }
        }
        if (!mappedAny) {
          setError('root', { message: data.message ?? 'Não foi possível validar os dados.' });
        }
        return;
      }
      if (typeof status === 'number' && status >= 500) {
        setError('root', { message: 'Erro no servidor. Tente novamente em instantes.' });
        return;
      }
      setError('root', { message: 'Sem conexão com o servidor.' });
    }
  };

  const departments = departmentsQuery.data?.items ?? [];
  const isPending = update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Atualize nome, e-mail, perfil e departamentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-name`} required>
                Nome
              </FieldLabel>
              <Input
                id={`${fieldId}-name`}
                autoComplete="off"
                placeholder="Nome do usuário"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.name.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-email`} required>
                E-mail
              </FieldLabel>
              <Input
                id={`${fieldId}-email`}
                type="email"
                autoComplete="off"
                placeholder="usuario@empresa.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email ? (
                <FieldDescription className="text-destructive" role="alert">
                  {errors.email.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldId}-role`} required>
                Perfil
              </FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as EditableRole)}
                  >
                    <SelectTrigger id={`${fieldId}-role`} aria-invalid={!!errors.role}>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Departamentos</FieldLabel>
              <Controller
                control={control}
                name="departmentIds"
                render={({ field }) => (
                  <div className="max-h-60 overflow-y-auto rounded-md border p-2">
                    {departmentsQuery.isPending ? (
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-3/4" />
                      </div>
                    ) : departments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Nenhum departamento ativo cadastrado.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {departments.map((d) => {
                          const checked = field.value.includes(d.id);
                          const id = `${fieldId}-dept-${d.id}`;
                          return (
                            <div key={d.id} className="flex items-center gap-2">
                              <Checkbox
                                id={id}
                                checked={checked}
                                onCheckedChange={(next) => {
                                  if (next) {
                                    field.onChange([...field.value, d.id]);
                                  } else {
                                    field.onChange(field.value.filter((v) => v !== d.id));
                                  }
                                }}
                              />
                              <label htmlFor={id} className="text-sm">
                                {d.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              />
            </Field>

            {errors.root ? (
              <FieldDescription className="text-destructive" role="alert">
                {errors.root.message}
              </FieldDescription>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Rodar testes do dialog: `pnpm test components/users/user-dialog.test.tsx`**

Esperado: PASS em todos os testes.

- [ ] **Step 4: Adiar commit pra Task 5 (precisa Deactivate + ForceLogout existirem)**

---

## Task 4: `DeactivateUserDialog`

**Files:**

- Create: `components/users/deactivate-user-dialog.tsx`
- Create: `components/users/deactivate-user-dialog.test.tsx`

`<AlertDialog>` destrutivo. Aciona `useUsersControllerDelete` (DELETE = soft no backend). Trata 409 último admin com toast usando a mensagem do backend.

- [ ] **Step 1: Criar `components/users/deactivate-user-dialog.test.tsx`**

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import { DeactivateUserDialog } from './deactivate-user-dialog';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const originalAdapter = apiClient.defaults.adapter;

const target = { id: 'u-1', name: 'Maria Atendente' };

function setAdapter(handler: (config: AxiosRequestConfig) => Promise<unknown> | unknown): {
  calls: AxiosRequestConfig[];
} {
  const calls: AxiosRequestConfig[] = [];
  const adapter = vi.fn().mockImplementation(async (config: AxiosRequestConfig) => {
    calls.push(config);
    return await handler(config);
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
  return { calls };
}

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe('DeactivateUserDialog', () => {
  it('renderiza o nome do usuário no título', () => {
    render(
      <Wrapper>
        <DeactivateUserDialog user={target} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    expect(screen.getByText(/desativar usuário "maria atendente"/i)).toBeInTheDocument();
  });

  it('confirma → chama DELETE, mostra toast sucesso e fecha', async () => {
    const onOpenChange = vi.fn();
    const { calls } = setAdapter((config) => ({
      data: undefined,
      status: 204,
      statusText: 'No Content',
      headers: {},
      config,
    }));
    const user = userEvent.setup();
    render(
      <Wrapper>
        <DeactivateUserDialog user={target} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: /^desativar$/i }));

    await waitFor(() => {
      const del = calls.find((c) => (c.method ?? '').toLowerCase() === 'delete');
      expect(del).toBeTruthy();
      expect(del!.url).toContain('/users/u-1');
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('cancela → não chama DELETE', async () => {
    const { calls } = setAdapter(() => ({
      data: undefined,
      status: 204,
      statusText: 'No Content',
      headers: {},
    }));
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Wrapper>
        <DeactivateUserDialog user={target} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(calls.find((c) => (c.method ?? '').toLowerCase() === 'delete')).toBeUndefined();
  });

  it('em 409 último admin, mostra toast com mensagem do backend e mantém aberto', async () => {
    setAdapter(() => {
      const err = Object.assign(new Error('Conflict'), {
        response: {
          status: 409,
          data: { message: 'É necessário manter ao menos um administrador ativo.' },
        },
      });
      throw err;
    });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Wrapper>
        <DeactivateUserDialog user={target} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: /^desativar$/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'É necessário manter ao menos um administrador ativo.',
      );
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Criar `components/users/deactivate-user-dialog.tsx`**

```tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUsersControllerDelete } from '@/lib/generated/hooks/useUsersControllerDelete';
import { usersControllerListQueryKey } from '@/lib/generated/hooks/useUsersControllerList';
import { apiClient } from '@/lib/api-client';
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

type UserLite = { id: string; name: string };

interface DeactivateUserDialogProps {
  user: UserLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AxiosLikeError = {
  response?: { status?: number; data?: { message?: string } };
};

export function DeactivateUserDialog({ user, open, onOpenChange }: DeactivateUserDialogProps) {
  const queryClient = useQueryClient();
  const del = useUsersControllerDelete({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) return;
    event.preventDefault();
    try {
      await del.mutateAsync({ id: user.id });
      toast.success(`Usuário "${user.name}" desativado.`);
      void queryClient.invalidateQueries({
        queryKey: usersControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr?.response?.status;
      const message = axiosErr?.response?.data?.message;
      if (status === 409 && message) {
        toast.error(message);
        return;
      }
      toast.error('Não foi possível desativar o usuário. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar usuário {user ? `"${user.name}"` : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ele deixa de fazer login, mas o histórico (tickets, mensagens, atribuições) é
            preservado. Você pode reativá-lo depois pelo filtro &quot;Inativos&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={del.isPending} onClick={handleConfirm}>
            {del.isPending ? 'Desativando…' : 'Desativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 3: Rodar `pnpm test components/users/deactivate-user-dialog.test.tsx`**

Esperado: PASS.

- [ ] **Step 4: Adiar commit pra Task 5**

---

## Task 5: `ForceLogoutUserDialog` + commit consolidado

**Files:**

- Create: `components/users/force-logout-user-dialog.tsx`
- Create: `components/users/force-logout-user-dialog.test.tsx`

`<AlertDialog>` destrutivo, aciona `useUsersControllerForceLogout`. Sem invalidate da list (não muda `lastSeenAt` imediatamente).

- [ ] **Step 1: Criar `components/users/force-logout-user-dialog.test.tsx`**

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import { ForceLogoutUserDialog } from './force-logout-user-dialog';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const originalAdapter = apiClient.defaults.adapter;

const target = { id: 'u-2', name: 'João Atendente' };

function setAdapter(handler: (config: AxiosRequestConfig) => Promise<unknown> | unknown): {
  calls: AxiosRequestConfig[];
} {
  const calls: AxiosRequestConfig[] = [];
  const adapter = vi.fn().mockImplementation(async (config: AxiosRequestConfig) => {
    calls.push(config);
    return await handler(config);
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
  return { calls };
}

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

describe('ForceLogoutUserDialog', () => {
  it('renderiza o nome no título', () => {
    render(
      <Wrapper>
        <ForceLogoutUserDialog user={target} open onOpenChange={() => {}} />
      </Wrapper>,
    );
    expect(screen.getByText(/forçar logout de "joão atendente"/i)).toBeInTheDocument();
  });

  it('confirma → chama POST force-logout, mostra toast sucesso e fecha', async () => {
    const { calls } = setAdapter((config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ForceLogoutUserDialog user={target} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: /^forçar logout$/i }));

    await waitFor(() => {
      const post = calls.find(
        (c) => (c.method ?? '').toLowerCase() === 'post' && c.url?.includes('/force-logout'),
      );
      expect(post).toBeTruthy();
      expect(post!.url).toContain('/users/u-2/force-logout');
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('cancela → não chama POST', async () => {
    const { calls } = setAdapter(() => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
    }));
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ForceLogoutUserDialog user={target} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(
      calls.find(
        (c) => (c.method ?? '').toLowerCase() === 'post' && c.url?.includes('/force-logout'),
      ),
    ).toBeUndefined();
  });

  it('erro → toast genérico, mantém aberto', async () => {
    setAdapter(() => {
      const err = Object.assign(new Error('Boom'), {
        response: { status: 500, data: { message: 'internal' } },
      });
      throw err;
    });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ForceLogoutUserDialog user={target} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );
    await user.click(screen.getByRole('button', { name: /^forçar logout$/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Criar `components/users/force-logout-user-dialog.tsx`**

```tsx
'use client';

import { toast } from 'sonner';
import { useUsersControllerForceLogout } from '@/lib/generated/hooks/useUsersControllerForceLogout';
import { apiClient } from '@/lib/api-client';
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

type UserLite = { id: string; name: string };

interface ForceLogoutUserDialogProps {
  user: UserLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForceLogoutUserDialog({ user, open, onOpenChange }: ForceLogoutUserDialogProps) {
  const forceLogout = useUsersControllerForceLogout({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) return;
    event.preventDefault();
    try {
      await forceLogout.mutateAsync({ id: user.id });
      toast.success(`Sessões de "${user.name}" encerradas.`);
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível encerrar as sessões. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Forçar logout de {user ? `"${user.name}"` : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            Encerra todas as sessões ativas deste usuário. Ele permanece com a conta ativa e poderá
            fazer login de novo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={forceLogout.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={forceLogout.isPending}
            onClick={handleConfirm}
          >
            {forceLogout.isPending ? 'Encerrando…' : 'Forçar logout'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 3: Rodar verificação local completa: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`**

Esperado: tudo verde — neste ponto Tasks 1+2+3+4+5 estão coerentes (UsersTable importa os 3 dialogs e UsersTableView extendido; testes de cada arquivo passam).

- [ ] **Step 4: Commit consolidado das Tasks 1-5**

```bash
git add components/users/users-table-view.tsx \
        components/users/users-table-view.test.tsx \
        components/users/users-table.tsx \
        components/users/users-table.test.tsx \
        components/users/user-dialog.tsx \
        components/users/user-dialog.test.tsx \
        components/users/deactivate-user-dialog.tsx \
        components/users/deactivate-user-dialog.test.tsx \
        components/users/force-logout-user-dialog.tsx \
        components/users/force-logout-user-dialog.test.tsx

git commit -m "$(cat <<'EOF'
feat(users): UsersTable com filtros, ações e gates de proteção

Estende UsersTableView para 7 colunas (avatar nas iniciais, badges
contextuais "Você"/"Conta da plataforma"/"Ausente", coluna Status,
ações Editar/Desativar/Forçar logout/Reativar com gates por linha) e
expande UsersTable com toolbar de filtros (search debounced, role,
status), cálculo de `me` e `lastActiveAdminId`, reativar inline
(PATCH active=true) e abertura dos novos dialogs.

Adiciona:
- UserDialog: edit-only, RHF + zodResolver, multi-select de departments
  via Checkbox, tratamento de 409 email/último admin, 403, 400, 5xx.
- DeactivateUserDialog: AlertDialog destrutivo + DELETE soft.
- ForceLogoutUserDialog: AlertDialog destrutivo + POST force-logout.

Cobertura RTL nas 5 frentes.
EOF
)"
```

---

## Task 6: Tabs `Usuários | Convites` na page

**Files:**

- Create: `app/(app)/configuracoes/usuarios/users-page-tabs.tsx`
- Modify: `app/(app)/configuracoes/usuarios/page.tsx`

Wrapper Client embrulhando `<Tabs>` shadcn com slots para `<UsersTable />` e `<InvitationsTable />`. Subtítulo do header ajustado.

- [ ] **Step 1: Criar `app/(app)/configuracoes/usuarios/users-page-tabs.tsx`**

```tsx
'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UsersPageTabsProps {
  usersSlot: ReactNode;
  invitationsSlot: ReactNode;
}

export function UsersPageTabs({ usersSlot, invitationsSlot }: UsersPageTabsProps) {
  return (
    <Tabs defaultValue="users" className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="invitations">Convites</TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="flex flex-col gap-3">
        {usersSlot}
      </TabsContent>
      <TabsContent value="invitations" className="flex flex-col gap-3">
        {invitationsSlot}
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 2: Substituir `app/(app)/configuracoes/usuarios/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { InviteUserDialog } from '@/components/users/invite-user-dialog';
import { InvitationsTable } from '@/components/users/invitations-table';
import { UsersTable } from '@/components/users/users-table';
import { UsersPageTabs } from './users-page-tabs';

export const metadata: Metadata = { title: 'Usuários — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-semibold">Usuários</h1>
          <p className="text-text-secondary text-sm">Gerencie usuários e convites do tenant.</p>
        </div>
        <InviteUserDialog />
      </header>

      <UsersPageTabs usersSlot={<UsersTable />} invitationsSlot={<InvitationsTable />} />
    </div>
  );
}
```

- [ ] **Step 3: Verificação local**

Rodar: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`. Tudo verde.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/configuracoes/usuarios/page.tsx \
        app/\(app\)/configuracoes/usuarios/users-page-tabs.tsx

git commit -m "$(cat <<'EOF'
feat(users): tabs Usuários|Convites na página /configuracoes/usuarios

Substitui o layout de duas seções verticais (Usuários ativos + Convites)
por tabs com Usuários como default. Mantém InviteUserDialog no header,
contextual a ambas as tabs, e ajusta o subtítulo para "Gerencie usuários
e convites do tenant.".

UsersPageTabs é um Client wrapper mínimo para acomodar o estado
controlado pelas Tabs shadcn, recebendo UsersTable e InvitationsTable
como slots ReactNode.
EOF
)"
```

---

## Task 7: Verificação manual end-to-end + atualizar ROADMAP

**Files:**

- Modify: `ROADMAP.md`

Validação manual contra o crm-api local + marcar a sprint como entregue.

- [ ] **Step 1: Subir crm-api local**

Em outro terminal, na raiz do `crm-api`: `pnpm dev`. Confirmar que `/api/v1/openapi` está acessível e que pelo menos 1 ADMIN, 1 SUPERVISOR e 1 AGENT existem no tenant — semear via `pnpm db:seed` se preciso.

- [ ] **Step 2: Subir crm-web local**

`pnpm dev`. Login como ADMIN e abrir `/configuracoes/usuarios`.

- [ ] **Step 3: Checklist manual**

Marcar cada item após executar:

- [ ] Header mostra "Usuários" + subtítulo + botão "Convidar usuário".
- [ ] Tabs `Usuários | Convites` — default Usuários.
- [ ] Tabela renderiza 7 colunas com avatar (iniciais) na coluna Nome.
- [ ] Linha do próprio usuário mostra "Você" e nenhuma ação.
- [ ] Linha de SUPER_ADMIN (se existir) mostra "Conta da plataforma" e nenhuma ação.
- [ ] Linha normal ativa mostra Editar + Desativar + Forçar logout.
- [ ] Filtro busca: digitar refresca a lista após pequeno delay.
- [ ] Filtro Perfil: cada opção filtra corretamente.
- [ ] Filtro Status=Inativos: lista usuários inativos; lista vazia mostra "Nenhum usuário inativo encontrado.".
- [ ] Editar: abre modal preenchido; alterar nome+role e salvar atualiza a linha + toast.
- [ ] Editar: tentar ADMIN→AGENT no único admin ativo retorna 409 inline na root do form.
- [ ] Editar: e-mail duplicado retorna 409 no field email.
- [ ] Desativar: confirmação destrutiva; desativa, lista some da aba Ativos, aparece em Inativos com botão Reativar.
- [ ] Reativar: clica → toast → user volta pra Ativos sem AlertDialog.
- [ ] Forçar logout: confirma; abrir outra aba logada com aquele user retorna 401 na próxima request.
- [ ] Tab Convites: mostra `<InvitationsTable>` com seu próprio sub-filtro PENDING/ACCEPTED/REVOKED.
- [ ] Light + dark mode visualmente OK.

- [ ] **Step 4: Atualizar ROADMAP.md §4.8 — marcar Sprint 0.21 como entregue**

Substituir a entrada `1. **Sprint 0.21 — Usuários CRUD edit/delete + role change.** ...` por:

```markdown
#### Entregue

- [x] ... (entradas existentes)
- [x] **Sprint 0.21 — Usuários CRUD edit/delete + role change** (PR #?? do crm-web pareado com PR #49 do crm-api). Tela `/configuracoes/usuarios` ganha CRUD completo: edição de nome/email/role/departments via UserDialog, desativação via DELETE soft, reativação via PATCH `active=true`, força logout via POST dedicado. Tabs `Usuários | Convites` reorganizam a página com foco nos usuários. Gates de proteção: self, SUPER_ADMIN, último ADMIN ativo. Filtros search/role/status na toolbar.
```

E remover/ajustar o item correspondente em `#### Sprints planejadas pra fechar a Fase 0`. Atualizar o item da tabela §6 `Rastreamento` (coluna Notas da Fase 0) para incluir 0.21.

- [ ] **Step 5: Verificação local**

Rodar: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`. Tudo verde.

- [ ] **Step 6: Commit ROADMAP**

```bash
git add ROADMAP.md

git commit -m "$(cat <<'EOF'
docs(roadmap): marca Sprint 0.21 (Usuários CRUD) como entregue

Move o item da seção "Sprints planejadas" para "Entregue" em §4.8 e
atualiza a coluna de notas da Fase 0 em §6 Rastreamento.
EOF
)"
```

---

## Task 8: Push da branch e abrir PR

**Files:** nenhum.

- [ ] **Step 1: Aguardar sinalização do humano**

Conforme regra do projeto (CLAUDE.md raiz §6, memória `feedback_no_push_until_validated.md`), em rodada de feedback iterativo o `git push` só acontece quando o humano sinaliza que terminou a rodada. **Não dispare push automático.**

- [ ] **Step 2: Quando autorizado, push da branch**

```bash
git push -u origin feat/users-crud-screen
```

- [ ] **Step 3: Abrir PR via gh**

```bash
gh pr create --title "feat(users): tela /configuracoes/usuarios CRUD (Sprint 0.21 Fase B)" \
  --body "$(cat <<'EOF'
## Summary

- Completa o CRUD da tela `/configuracoes/usuarios` com edição de nome/email/role/departments via `UserDialog`, desativação via DELETE soft (`DeactivateUserDialog`), reativação via PATCH `active=true` (inline) e força logout via POST dedicado (`ForceLogoutUserDialog`).
- Reorganiza a página em tabs `Usuários | Convites` (Usuários default).
- Toolbar com busca debounced, filtro Perfil e filtro Status (Ativos/Inativos).
- Gates de proteção por linha: self (badge "Você"), SUPER_ADMIN (badge "Conta da plataforma") e último ADMIN ativo (esconde apenas Desativar).
- Avatar nas iniciais na coluna Nome (sem upload — alinhado com `nav-user.tsx`).

Pareado com PR #49 do `crm-api` (`feat(users): expõe active, corrige filtro active=false e suporta reativação via PATCH`).

## Test plan

- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verdes localmente.
- [ ] `pnpm generate:api:from-snapshot && git diff --exit-code lib/generated openapi.snapshot.json` zero diff.
- [ ] Validação manual end-to-end conforme checklist do plano (`docs/superpowers/plans/2026-05-09-sprint-0-21-users-crud-frontend.md` Task 7 Step 3).
- [ ] Light + dark mode visualmente OK.
EOF
)"
```

---

## Self-Review

- **Spec coverage:** Cada item das §2 e §10 da spec aparece em alguma task.
  - §2.1 Tabs → Task 6.
  - §2.2 Avatar → Task 1.
  - §2.3 Split data/view → Tasks 1+2.
  - §2.4 7 colunas → Task 1.
  - §2.5 Filtros toolbar → Task 2.
  - §2.6 Gates → Task 2 (cálculo) + Task 1 (consumo).
  - §2.7 Prioridade dos badges → Task 1.
  - §2.8 UserDialog → Task 3.
  - §2.9 DeactivateUserDialog → Task 4.
  - §2.10 ForceLogoutUserDialog → Task 5.
  - §2.11 Reativar inline → Task 2.
  - §2.12 Schema local → Task 3.
  - §2.13 ADMIN-only herdado → não exige código (já em `(app)/configuracoes/layout.tsx`).
  - §10 Testes → distribuídos em todas as tasks.
  - §11 Critério de pronto → Task 7.
- **Placeholder scan:** Sem TBD/TODO/etc. Cada step tem código concreto ou comando concreto.
- **Type consistency:** `UsersTableViewProps`, `UserListItem`, `UsersTableState` consistentes entre Tasks 1 e 2. `UserDialogProps` (Task 3) usa `user?: UserResponseDto`. `DeactivateUserDialogProps` e `ForceLogoutUserDialogProps` usam `user: UserLite | null`. `usersControllerListQueryKey` invocado em UsersTable (Task 2), UserDialog (Task 3) e DeactivateUserDialog (Task 4); ForceLogoutUserDialog (Task 5) **não** invalida (decisão da spec). Nomes de funções (`canEditItem`/`canDeactivateItem`/`canForceLogoutItem`) idênticos em fetcher e view.
