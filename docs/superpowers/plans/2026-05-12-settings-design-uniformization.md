# Settings Design Uniformization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uniformizar padrões visuais das sub-páginas de `/configuracoes/*`: cor destrutiva consistente, substituir `window.confirm` em Invitations por `AlertDialog`, alinhar `PlaceholderPage` ao shell padrão, e documentar tudo no `design-system.md`.

**Architecture:** Mudanças cirúrgicas em 4 frentes independentes (cor destrutiva, RevokeInvitationDialog, PlaceholderPage, docs). Cada uma é um commit lógico. Sem extração de novos componentes shell — pattern continua repetido inline em cada `page.tsx`.

**Tech Stack:** Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui (AlertDialog) + TanStack Query 5 (hooks do Kubb) + Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-12-settings-design-uniformization-design.md`

**Branch:** `chore/settings-design-uniformization` (já criada a partir de `origin/main`).

**Verificação local antes de qualquer commit:** `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`. `pnpm build` fica fora do gate local (CLAUDE.md §11).

---

## File structure

**Vai criar:**

- `components/users/revoke-invitation-dialog.tsx` — AlertDialog que confirma e executa o POST `/invitations/:id/revoke`. Responsabilidade única.
- `components/users/revoke-invitation-dialog.test.tsx` — testes do dialog (confirma, cancela, erro).

**Vai modificar:**

- `components/departments/departments-table-view.tsx` — aplicar `text-destructive` no botão Desativar.
- `components/tags/tags-table-view.tsx` — idem.
- `components/users/users-table-view.tsx` — idem nos botões Desativar e Forçar logout.
- `components/users/invitations-table-view.tsx` — idem no botão Revogar.
- `components/users/invitations-table.tsx` — remover `window.confirm`, integrar `<RevokeInvitationDialog>`, mover mutation `useInvitationsControllerRevoke` pro dialog.
- `components/users/invitations-table.test.tsx` — atualizar teste de revoke pra usar dialog flow.
- `components/layout/placeholder-page.tsx` — reescrever pro shell padrão.
- `design-system.md` — adicionar seção "Padrões de telas de configuração".

**Não vai mexer em:**

- `components/quick-replies/quick-replies-table-view.tsx` — "Apagar" já tem `text-destructive` (referência canônica).
- Páginas que consomem `PlaceholderPage` (Canais, Integrações, `/configuracoes`) — API compatível.
- Tests das table-views (departments/tags/users/invitations/quick-replies table-view tests) — não assertam className destrutiva, então adicionar `text-destructive` não quebra nada (vai ser confirmado rodando o teste após cada edição).
- `PreferenceSection` — descartado após investigação (ver spec §2.5).

---

## Task 1: Cor destrutiva em `departments-table-view.tsx`

**Files:**

- Modify: `components/departments/departments-table-view.tsx` (linhas ~123-131)
- Test: `components/departments/departments-table-view.test.tsx` (existente, só rodar)

- [ ] **Step 1: Rodar o teste existente pra confirmar baseline verde**

Run: `pnpm test components/departments/departments-table-view.test.tsx`
Expected: PASS (todos os its)

- [ ] **Step 2: Adicionar className destrutiva no botão Desativar**

Em `components/departments/departments-table-view.tsx`, localizar o `<Button>` "Desativar" (dentro do bloco `item.active ? (...) : (...)`) e adicionar `className="text-destructive hover:text-destructive"`:

```tsx
<Button
  variant="ghost"
  size="sm"
  className="text-destructive hover:text-destructive"
  onClick={() => onDeactivate(item)}
  aria-label={`Desativar departamento ${item.name}`}
>
  <BanIcon className="size-4" />
  Desativar
</Button>
```

O botão "Reativar" não recebe a className — fica neutro.

- [ ] **Step 3: Rodar teste novamente pra garantir não-regressão**

Run: `pnpm test components/departments/departments-table-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Não commitar ainda — agrupar com as outras table-views numa commit única (Task 5)**

---

## Task 2: Cor destrutiva em `tags-table-view.tsx`

**Files:**

- Modify: `components/tags/tags-table-view.tsx` (linhas ~123-131)
- Test: `components/tags/tags-table-view.test.tsx` (existente, só rodar)

- [ ] **Step 1: Rodar o teste existente pra confirmar baseline**

Run: `pnpm test components/tags/tags-table-view.test.tsx`
Expected: PASS

- [ ] **Step 2: Adicionar className destrutiva no botão Desativar**

Em `components/tags/tags-table-view.tsx`:

```tsx
<Button
  variant="ghost"
  size="sm"
  className="text-destructive hover:text-destructive"
  onClick={() => onDeactivate(item)}
  aria-label={`Desativar tag ${item.name}`}
>
  <BanIcon className="size-4" />
  Desativar
</Button>
```

- [ ] **Step 3: Rodar teste pra garantir não-regressão**

Run: `pnpm test components/tags/tags-table-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Não commitar ainda — agrupado em Task 5**

---

## Task 3: Cor destrutiva em `users-table-view.tsx`

**Files:**

- Modify: `components/users/users-table-view.tsx` (linhas ~157-178)
- Test: `components/users/users-table-view.test.tsx` (existente, só rodar)

- [ ] **Step 1: Rodar o teste existente pra baseline**

Run: `pnpm test components/users/users-table-view.test.tsx`
Expected: PASS

- [ ] **Step 2: Adicionar className destrutiva nos dois botões (Desativar e Forçar logout)**

Em `components/users/users-table-view.tsx`, dois botões recebem a className:

```tsx
{
  user.active && canDeactivateItem(user) ? (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={() => onDeactivate(user)}
      aria-label={`Desativar usuário ${user.name}`}
    >
      <BanIcon className="size-4" />
      Desativar
    </Button>
  ) : null;
}
{
  user.active && canForceLogoutItem(user) ? (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={() => onForceLogout(user)}
      aria-label={`Forçar logout do usuário ${user.name}`}
    >
      <LogOutIcon className="size-4" />
      Forçar logout
    </Button>
  ) : null;
}
```

Os botões "Editar" e "Reativar" continuam sem a className.

- [ ] **Step 3: Rodar teste**

Run: `pnpm test components/users/users-table-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Não commitar ainda — agrupado em Task 5**

---

## Task 4: Cor destrutiva em `invitations-table-view.tsx`

**Files:**

- Modify: `components/users/invitations-table-view.tsx` (linhas ~128-138)
- Test: `components/users/invitations-table-view.test.tsx` (existente, só rodar)

- [ ] **Step 1: Rodar o teste existente pra baseline**

Run: `pnpm test components/users/invitations-table-view.test.tsx`
Expected: PASS

- [ ] **Step 2: Adicionar className destrutiva no botão Revogar**

Em `components/users/invitations-table-view.tsx`:

```tsx
<Button
  variant="ghost"
  size="sm"
  className="text-destructive hover:text-destructive"
  onClick={() => onAction('revoke', item)}
  aria-label={`Revogar convite de ${item.email}`}
>
  <BanIcon className="size-4" />
  Revogar
</Button>
```

Os botões "Copiar link" e "Reenviar" continuam sem a className.

- [ ] **Step 3: Rodar teste**

Run: `pnpm test components/users/invitations-table-view.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit do conjunto cor destrutiva (Tasks 1-4)**

```bash
git add components/departments/departments-table-view.tsx \
        components/tags/tags-table-view.tsx \
        components/users/users-table-view.tsx \
        components/users/invitations-table-view.tsx
git commit -m "refactor(settings): aplica cor destrutiva em todas as ações destrutivas das listas

Padroniza Desativar/Forçar logout/Revogar com text-destructive +
hover:text-destructive, espelhando o padrão já consolidado em
Quick Replies (Apagar). Reativar fica neutro.

Spec: docs/superpowers/specs/2026-05-12-settings-design-uniformization-design.md §3.1"
```

---

## Task 5: Criar `RevokeInvitationDialog`

**Files:**

- Create: `components/users/revoke-invitation-dialog.tsx`
- Create: `components/users/revoke-invitation-dialog.test.tsx`

Espelha estrutura do `DeactivateDepartmentDialog` ([components/departments/deactivate-department-dialog.tsx](components/departments/deactivate-department-dialog.tsx)).

- [ ] **Step 1: Escrever o teste do dialog (failing)**

Criar `components/users/revoke-invitation-dialog.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import { RevokeInvitationDialog } from './revoke-invitation-dialog';

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

const invitation = {
  id: '00000000-0000-7000-8000-00000000000a',
  email: 'alvo@example.com',
};

describe('RevokeInvitationDialog', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('confirma revogação via POST /revoke e exibe toast', async () => {
    const requests: AxiosRequestConfig[] = [];
    apiClient.defaults.adapter = vi.fn().mockImplementation((config) => {
      requests.push(config);
      return Promise.resolve({
        data: '',
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
      });
    }) as AxiosAdapter;

    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Wrapper>
        <RevokeInvitationDialog invitation={invitation} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Revogar' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Convite de alvo@example.com revogado.');
    });
    expect(requests[0]?.method).toBe('post');
    expect(requests[0]?.url).toContain(`/invitations/${invitation.id}/revoke`);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('cancelar não chama o backend', async () => {
    const adapter = vi
      .fn()
      .mockImplementation((config) =>
        Promise.resolve({ data: '', status: 204, statusText: '', headers: {}, config }),
      );
    apiClient.defaults.adapter = adapter as AxiosAdapter;

    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Wrapper>
        <RevokeInvitationDialog invitation={invitation} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(adapter).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('mostra toast de erro quando falha', async () => {
    apiClient.defaults.adapter = vi
      .fn()
      .mockImplementation(() =>
        Promise.reject({ response: { status: 500, data: { message: 'boom' } } }),
      ) as AxiosAdapter;

    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Wrapper>
        <RevokeInvitationDialog invitation={invitation} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Revogar' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'Não foi possível revogar o convite. Tente novamente.',
      );
    });
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha (componente não existe)**

Run: `pnpm test components/users/revoke-invitation-dialog.test.tsx`
Expected: FAIL — `Cannot find module './revoke-invitation-dialog'`

- [ ] **Step 3: Criar o componente**

Criar `components/users/revoke-invitation-dialog.tsx`:

```tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvitationsControllerRevoke } from '@/lib/generated/hooks/useInvitationsControllerRevoke';
import { invitationsControllerListQueryKey } from '@/lib/generated/hooks/useInvitationsControllerList';
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

interface InvitationLite {
  id: string;
  email: string;
}

interface RevokeInvitationDialogProps {
  invitation: InvitationLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RevokeInvitationDialog({
  invitation,
  open,
  onOpenChange,
}: RevokeInvitationDialogProps) {
  const queryClient = useQueryClient();
  const revoke = useInvitationsControllerRevoke({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!invitation) return;
    event.preventDefault();
    try {
      await revoke.mutateAsync({ id: invitation.id });
      toast.success(`Convite de ${invitation.email} revogado.`);
      void queryClient.invalidateQueries({
        queryKey: invitationsControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível revogar o convite. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Revogar convite {invitation ? `de ${invitation.email}` : ''}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            O link do convite deixa de funcionar imediatamente. Para reconvidar essa pessoa, será
            preciso criar um novo convite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revoke.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={revoke.isPending}
            onClick={handleConfirm}
          >
            {revoke.isPending ? 'Revogando…' : 'Revogar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 4: Rodar teste pra verificar todos os 3 casos passam**

Run: `pnpm test components/users/revoke-invitation-dialog.test.tsx`
Expected: PASS (3 its)

- [ ] **Step 5: Não commitar ainda — agrupar com a integração em Task 6**

---

## Task 6: Integrar `RevokeInvitationDialog` em `invitations-table.tsx`

**Files:**

- Modify: `components/users/invitations-table.tsx` (linhas 1-131 — refactor estrutural)
- Modify: `components/users/invitations-table.test.tsx` (linhas 128-178 — atualizar teste do revoke)

- [ ] **Step 1: Atualizar o teste de `InvitationsTable` para usar dialog flow**

Editar `components/users/invitations-table.test.tsx`, substituir o `it('revoga convite com confirmação positiva', ...)` (linhas 128-178) por:

```tsx
it('revoga convite via dialog de confirmação', async () => {
  setListAdapter({
    PENDING: {
      items: [sampleInvitation({ email: 'alvo@example.com' })],
      pagination: { nextCursor: null, hasMore: false },
    },
  });

  // adapter customizado: GET retorna a lista, POST revoke retorna 204
  const adapter = vi.fn().mockImplementation((config: AxiosRequestConfig) => {
    if (config.method === 'post' && config.url?.includes('/revoke')) {
      return Promise.resolve({
        data: '',
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
      });
    }
    return Promise.resolve({
      data: {
        items: [sampleInvitation({ email: 'alvo@example.com' })],
        pagination: { nextCursor: null, hasMore: false },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;

  const user = userEvent.setup();

  render(
    <Wrapper>
      <InvitationsTable />
    </Wrapper>,
  );

  // abre o dialog clicando na ação Revogar da linha
  await user.click(
    await screen.findByRole('button', { name: /revogar convite de alvo@example.com/i }),
  );

  // confirma no dialog
  await user.click(await screen.findByRole('button', { name: 'Revogar' }));

  await waitFor(() => {
    expect(toastSuccess).toHaveBeenCalledWith('Convite de alvo@example.com revogado.');
  });
});
```

Notar a mudança no texto do toast (`revogado.` com ponto final) — espelha o pattern dos outros dialogs (DeactivateDepartmentDialog usa `desativado.`).

- [ ] **Step 2: Rodar teste pra confirmar que falha (ainda usa window.confirm)**

Run: `pnpm test components/users/invitations-table.test.tsx`
Expected: FAIL no it `revoga convite via dialog de confirmação` — o teste agora espera o flow do dialog mas o código ainda usa `window.confirm`.

- [ ] **Step 3: Refatorar `invitations-table.tsx` pra usar o dialog**

Reescrever `components/users/invitations-table.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useInvitationsControllerList,
  invitationsControllerListQueryKey,
} from '@/lib/generated/hooks/useInvitationsControllerList';
import { useInvitationsControllerResend } from '@/lib/generated/hooks/useInvitationsControllerResend';
import { apiClient } from '@/lib/api-client';
import type { InvitationsControllerListQueryParamsStatusEnumKey } from '@/lib/generated/types/InvitationsControllerList';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InvitationsTableView,
  type InvitationsTableState,
  type InvitationAction,
  type InvitationListItem,
} from './invitations-table-view';
import { RevokeInvitationDialog } from './revoke-invitation-dialog';

type InvitationStatus = InvitationsControllerListQueryParamsStatusEnumKey;

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
  const [revokeTarget, setRevokeTarget] = useState<InvitationListItem | null>(null);
  const queryClient = useQueryClient();

  const query = useInvitationsControllerList(
    { status, limit: 50 },
    { client: { client: apiClient } },
  );
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
      setRevokeTarget(item);
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

      <RevokeInvitationDialog
        invitation={revokeTarget}
        open={!!revokeTarget}
        onOpenChange={(next) => {
          if (!next) setRevokeTarget(null);
        }}
      />
    </div>
  );
}
```

Mudanças-chave:

- Remoção do import `useInvitationsControllerRevoke` (migrou pro dialog)
- Adição do state `revokeTarget`
- Adição do import + render do `<RevokeInvitationDialog>`
- `handleAction('revoke', ...)` só seta o target — sem `window.confirm`, sem mutate direto

- [ ] **Step 4: Rodar teste pra confirmar que passa**

Run: `pnpm test components/users/invitations-table.test.tsx`
Expected: PASS (incluindo o it atualizado `revoga convite via dialog de confirmação`)

- [ ] **Step 5: Rodar typecheck + lint**

Run: `pnpm typecheck && pnpm lint components/users/invitations-table.tsx components/users/revoke-invitation-dialog.tsx components/users/revoke-invitation-dialog.test.tsx components/users/invitations-table.test.tsx`
Expected: zero erros

- [ ] **Step 6: Commit**

```bash
git add components/users/revoke-invitation-dialog.tsx \
        components/users/revoke-invitation-dialog.test.tsx \
        components/users/invitations-table.tsx \
        components/users/invitations-table.test.tsx
git commit -m "refactor(invitations): substitui window.confirm por RevokeInvitationDialog

Convite revogado agora abre um AlertDialog com botão destrutivo
explícito, espelhando o pattern dos outros módulos (DeactivateX).
Mutation useInvitationsControllerRevoke migrou de invitations-table
pro dialog.

Spec: docs/superpowers/specs/2026-05-12-settings-design-uniformization-design.md §3.2"
```

---

## Task 7: Reescrever `PlaceholderPage` no shell padrão

**Files:**

- Modify: `components/layout/placeholder-page.tsx`

- [ ] **Step 1: Reescrever o componente**

Substituir `components/layout/placeholder-page.tsx` pelo conteúdo:

```tsx
export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </header>
      <div className="text-muted-foreground text-sm">Em breve.</div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que callers existentes continuam compilando**

Run: `pnpm typecheck`
Expected: zero erros (os 3 callers — Canais, Integrações, raiz `/configuracoes` — passam apenas `title`, prop `description` é opcional)

- [ ] **Step 3: Verificar visualmente**

Abrir `pnpm dev` (ou usar dev server já rodando) e navegar para:

- `http://localhost:3000/configuracoes` — placeholder "Configurações" alinhado ao topo, sem centralização vertical
- `http://localhost:3000/configuracoes/canais` — idem "Canais"
- `http://localhost:3000/configuracoes/integracoes` — idem "Integrações"

Esperado: header igual ao de Departamentos/Tags/Usuários, corpo simples "Em breve" abaixo.

- [ ] **Step 4: Commit**

```bash
git add components/layout/placeholder-page.tsx
git commit -m "refactor(placeholder-page): adota shell padrão de configurações

PlaceholderPage agora usa o mesmo wrapper (flex flex-col gap-6 p-6)
e header (h1 text-2xl font-semibold + descrição opcional) das listas
de configurações. Permite que Canais/Integrações sejam preenchidas
no futuro sem reescrever a moldura.

Aceita prop description opcional. Callers existentes (Canais,
Integrações, raiz /configuracoes) seguem compatíveis.

Spec: docs/superpowers/specs/2026-05-12-settings-design-uniformization-design.md §3.3"
```

---

## Task 8: Documentar padrões no `design-system.md`

**Files:**

- Modify: `design-system.md` (adicionar nova seção antes de "Iconografia")

- [ ] **Step 1: Localizar o ponto de inserção**

Em `design-system.md`, a seção "Iconografia" começa por volta da linha 381 (cabeçalho `## Iconografia`). A nova seção entra imediatamente antes dela.

- [ ] **Step 2: Inserir a nova seção**

Antes do bloco `## Iconografia`, inserir:

````markdown
## Padrões de telas de configuração

Convenções consolidadas das sub-páginas em `app/(app)/configuracoes/*`. Sempre que criar uma tela nova ali, siga estes padrões — eles já existem replicados em Departamentos, Tags, Usuários, Quick Replies e Preferências.

### Shell de página

Estrutura padrão (não componente — pattern repetido em cada `page.tsx`):

```tsx
<div className="flex flex-col gap-6 p-6">
  <header className="flex items-center justify-between">
    <div>
      <h1 className="text-foreground text-2xl font-semibold">Título</h1>
      <p className="text-muted-foreground text-sm">Descrição curta da seção.</p>
    </div>
    <CTA />
  </header>
  {/* corpo */}
</div>
```

- Wrapper: `flex flex-col gap-6 p-6`
- Título: `<h1>` com `text-2xl font-semibold text-foreground`
- Descrição: `<p>` com `text-sm text-muted-foreground`
- CTA opcional (botão "Novo", "Convidar", etc) à direita via `justify-between`
- Sem CTA? Remover `justify-between` e o `<div>` wrapper interno do header
- Páginas só de conteúdo (sem ação primária) seguem o mesmo wrapper; o corpo entra abaixo do `<header>`

Por que não extrair um `<SettingsPageShell>`: as ~10 linhas acima são estáveis e auto-documentadas no nível da page; abstrair adiciona ruído sem ganho real (decidido em Sprint Maio 2026).

### Toolbar de listas

Acima da tabela. Ordem fixa: busca → selects → switches.

```tsx
<div className="flex flex-wrap items-center gap-3">
  <InputGroup className="w-full max-w-sm">
    <InputGroupAddon>
      <SearchIcon className="size-4" />
    </InputGroupAddon>
    <InputGroupInput type="search" placeholder="Buscar…" />
  </InputGroup>
  {/* selects de filtro com Label visível à esquerda */}
  {/* switch(es) de filtro com Label à direita */}
</div>
```

- Busca: sempre `<InputGroup>` + `SearchIcon` `size-4` + `max-w-sm` + `useDeferredValue`
- Selects de filtro: largura `w-36` por padrão; aumentar caso a caso (`w-44`) quando o rótulo mais longo não couber
- Label `sr-only` para a busca; visível (`text-muted-foreground text-sm`) para Selects e Switches
- Filtros binários: **Select** quando é dimensão de filtragem com semântica simétrica (`Ativos`/`Inativos`, `Contato`/`Ticket`/`Ambos`); **Switch** quando é toggle pessoal de fluxo com estado padrão neutro (ex.: `Apenas as minhas`)

### Tabela: wrapper e estados

```tsx
<div className="rounded-md border">
  <Table>{/* ... */}</Table>
</div>
```

Estados obrigatórios no `<TableBody>`:

- **Loading:** `Array.from({length: 3})` linhas com `<TableCell colSpan={N}><Skeleton className="h-6 w-full" /></TableCell>`
- **Error:** uma linha com `<TableCell colSpan={N} className="text-destructive text-center">Erro ao carregar X.</TableCell>`
- **Empty:** uma linha com `<TableCell colSpan={N} className="text-muted-foreground text-center">{emptyMessage}</TableCell>`

Rodapé "mais resultados" (quando `hasMore`): `<p className="text-muted-foreground text-sm">Mostrando os primeiros {LIMIT} resultados. Use a busca para refinar.</p>`

### Ações de linha

- `<Button variant="ghost" size="sm">` com `<Icon className="size-4" /> Texto`
- Container: `<div className="flex justify-end gap-1">`
- Até 4 ações inline é aceitável quando todas são frequentes (ex.: Users com Editar/Desativar/Forçar logout/Reativar)
- `aria-label` sempre com a entidade alvo: `aria-label={\`Editar X ${item.name}\`}`

### Cor de botão destrutivo

**Regra:** toda ação destrutiva (que afeta negativamente o recurso, mesmo que reversível) usa `text-destructive hover:text-destructive`:

```tsx
<Button
  variant="ghost"
  size="sm"
  className="text-destructive hover:text-destructive"
  onClick={() => onDeactivate(item)}
  aria-label={`Desativar X ${item.name}`}
>
  <BanIcon className="size-4" />
  Desativar
</Button>
```

Aplica a: **Desativar**, **Apagar**, **Revogar**, **Forçar logout**.
Não aplica a: Editar, Reativar, Copiar link, Reenviar.

Em dialogs de confirmação destrutiva o botão de confirmação usa `<AlertDialogAction variant="destructive">` — é a ação primária do dialog, não um ghost com tinta.

### Form longo com sticky bar

Padrão observado em Preferências:

```tsx
<form>
  {sections.map(...)} {/* cada section é um <Card> com h2 text-lg font-semibold + CardDescription + linhas */}
  <div className="bg-background border-border sticky bottom-0 -mx-6 flex justify-end gap-2 border-t px-6 py-4">
    <Button type="button" variant="outline">Descartar alterações</Button>
    <Button type="submit">Salvar alterações</Button>
  </div>
</form>
```

- Usar quando o form é longo (mais que uma altura de viewport)
- Cada seção em `<Card>` separado. Título da seção em `<h2 className="text-foreground text-lg font-semibold">` (não usar `<CardTitle>` — ele é `<div>` no shadcn baseline e perde semântica de heading) + `<CardDescription>` para o subtítulo
- Botões Descartar e Salvar desabilitados quando `!isDirty || isSubmitting`
- Sticky bar mantém `-mx-6 px-6` para alinhar com o padding `p-6` do shell

### Loading e error

- **Página com tabela** (listas): trata internamente via `state='loading' | 'error' | 'ready'` no `<TableView>`. **Não** criar `loading.tsx` nem `error.tsx` de rota.
- **Página só de form/conteúdo** (Preferências e similares): trata em nível de rota via `app/.../loading.tsx` (skeleton da página inteira) e `app/.../error.tsx` (mensagem amigável + `<Button onClick={reset}>` para retry).

### Exceção documentada — Quick Replies sem filtro Status

A tabela de Quick Replies não expõe filtro `Ativos`/`Inativos`. Motivo: o backend faz soft-delete (marca `active=false`), mas a UI modela DELETE como hard delete — o item somente desaparece. O hook lista usa `active: true` fixo. Decisão consciente; ver `components/quick-replies/quick-replies-table.tsx` comentário sobre `active: true`.
````

(Atenção ao detalhe: a seção termina com ``````e a próxima`## Iconografia` vem logo abaixo, sem linha em branco extra.)

- [ ] **Step 3: Verificar que o `design-system.md` renderiza sem erros de Markdown**

Run: `pnpm format:check design-system.md`
Expected: PASS sem warnings

Caso `prettier` queira reformatar:
Run: `pnpm format design-system.md`

- [ ] **Step 4: Commit**

```bash
git add design-system.md
git commit -m "docs(design-system): padrões de telas de configuração

Nova seção consolidando convenções já replicadas em /configuracoes/*:
shell de página, toolbar de listas, wrapper e estados de tabela,
ações de linha, regra de cor destrutiva, form longo com sticky bar,
loading/error (interno na tabela vs route-level), e exceção
documentada do filtro Status em Quick Replies.

Spec: docs/superpowers/specs/2026-05-12-settings-design-uniformization-design.md §4"
```

---

## Task 9: Verificação final + abrir PR

- [ ] **Step 1: Verificação local completa**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: tudo verde, zero erros, zero warnings.

- [ ] **Step 2: Conferência visual manual no dev server**

Subir `pnpm dev` (se ainda não estiver up) e percorrer:

- `/configuracoes/departamentos` — botão "Desativar" da linha em vermelho; "Reativar" neutro; demais (Editar) neutro
- `/configuracoes/tags` — idem
- `/configuracoes/usuarios` — "Desativar" e "Forçar logout" em vermelho na linha; "Editar" e "Reativar" neutros
- `/configuracoes/usuarios` aba **Convites** — botão "Revogar" em vermelho na linha; clicar abre `<AlertDialog>` com título "Revogar convite de X?", botão "Cancelar" + "Revogar" (vermelho); confirmar revoga e atualiza a lista (sem mais `window.confirm` do browser)
- `/configuracoes/quick-replies` — "Apagar" continua em vermelho (sem regressão)
- `/configuracoes`, `/configuracoes/canais`, `/configuracoes/integracoes` — header alinhado ao topo com h1 + "Em breve" abaixo (sem centralização vertical)
- `/configuracoes/preferencias` — sem regressão visual

- [ ] **Step 3: Verificar histórico da branch antes de subir**

Run: `git log --oneline origin/main..HEAD`
Expected: 4 commits exatamente, na ordem:

```
<hash> docs(design-system): padrões de telas de configuração
<hash> refactor(placeholder-page): adota shell padrão de configurações
<hash> refactor(invitations): substitui window.confirm por RevokeInvitationDialog
<hash> refactor(settings): aplica cor destrutiva em todas as ações destrutivas das listas
```

- [ ] **Step 4: Push + abrir PR**

```bash
git push -u origin chore/settings-design-uniformization
```

Em seguida:

```bash
gh pr create --title "chore(settings): uniformização de design das telas de configurações" --body "$(cat <<'EOF'
## Summary

- Padroniza cor de botão destrutivo (Desativar/Apagar/Revogar/Forçar logout) com `text-destructive hover:text-destructive` em todas as table-views
- Substitui `window.confirm` por `RevokeInvitationDialog` na revogação de convites, espelhando o pattern dos outros `DeactivateXDialog`
- Reescreve `PlaceholderPage` para usar o mesmo shell das listas (Canais/Integrações deixam de ficar centralizados)
- Adiciona seção "Padrões de telas de configuração" no `design-system.md` consolidando 7 padrões observados + 1 exceção documentada

Spec: [docs/superpowers/specs/2026-05-12-settings-design-uniformization-design.md](docs/superpowers/specs/2026-05-12-settings-design-uniformization-design.md)
Plan: [docs/superpowers/plans/2026-05-12-settings-design-uniformization.md](docs/superpowers/plans/2026-05-12-settings-design-uniformization.md)

## Test plan

- [ ] `/configuracoes/departamentos` — Desativar em vermelho; Reativar neutro
- [ ] `/configuracoes/tags` — idem
- [ ] `/configuracoes/usuarios` — Desativar + Forçar logout em vermelho; Editar + Reativar neutros
- [ ] `/configuracoes/usuarios` aba Convites — Revogar abre AlertDialog (não window.confirm); confirma revoga e atualiza lista
- [ ] `/configuracoes/quick-replies` — Apagar continua em vermelho
- [ ] `/configuracoes`, `/configuracoes/canais`, `/configuracoes/integracoes` — placeholder usa shell padrão (header no topo, "Em breve" abaixo, sem centralização vertical)
- [ ] `/configuracoes/preferencias` — sem regressão visual
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` verde
EOF
)"
```

---

## Self-review notes

**Spec coverage:** Tasks cobrem spec §3.1 (Task 1-4), §3.2 (Task 5-6), §3.3 (Task 7), §4 (Task 8), §7 verification (Task 9). Spec §2.5 (descartar PreferenceSection) explicitamente NÃO tem task — está apenas documentada na seção §4.6 do design-system pela Task 8. Spec §5 (testes existentes a checar) é coberta inline em cada task (Step 1 sempre roda o teste vigente antes de mudar).

**Type/method consistency:** `InvitationLite` em `revoke-invitation-dialog.tsx` define `{ id: string; email: string }`. `InvitationListItem` (já existente em invitations-table-view.tsx) é o tipo `UserListResponseDto['items'][number]` que tem `id` e `email` como string — estruturalmente compatível, TypeScript aceita passar `InvitationListItem` onde `InvitationLite` é esperado. Mesmo padrão usado por `DeactivateDepartmentDialog` com `DepartmentLite`.

**Mensagem de toast consistente:** novos toasts seguem padrão das outras dialogs:

- Sucesso: `Convite de {email} revogado.` (com ponto)
- Erro: `Não foi possível revogar o convite. Tente novamente.`

**Hooks gerados usados:**

- `useInvitationsControllerRevoke` (mutation) — migra de `invitations-table.tsx` pro novo dialog
- `invitationsControllerListQueryKey` — usado pra invalidar a query da lista

**Sem testes de visualização do design-system.md** — markdown não tem teste; verificação é manual + `pnpm format:check`.
