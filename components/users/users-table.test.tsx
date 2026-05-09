import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
