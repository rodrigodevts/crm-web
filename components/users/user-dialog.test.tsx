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
  departments: [{ id: '00000000-0000-7000-8000-0000000000d1', name: 'Suporte' }],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const departmentsList = {
  items: [
    {
      id: '00000000-0000-7000-8000-0000000000d1',
      name: 'Suporte',
      companyId: 'c',
      active: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '00000000-0000-7000-8000-0000000000d2',
      name: 'Vendas',
      companyId: 'c',
      active: true,
      createdAt: '',
      updatedAt: '',
    },
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
    const user = userEvent.setup();
    render(
      <Wrapper>
        <UserDialog user={targetUser} open onOpenChange={() => {}} />
      </Wrapper>,
    );

    expect(await screen.findByLabelText(/nome/i)).toHaveValue('Maria Atendente');
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue('maria@example.com');
    // Radix Select renderiza um <select> nativo escondido + um span com o
    // valor — o getAllByText cobre os dois sem ambiguidade.
    expect(screen.getAllByText('Atendente').length).toBeGreaterThan(0);

    // Aguarda departments terminarem de carregar (skeleton → combobox)
    const trigger = await screen.findByRole('combobox', { name: /departamentos/i });
    // Suporte está selecionado: aparece como badge dentro do trigger
    expect(trigger).toHaveTextContent('Suporte');
    expect(trigger).not.toHaveTextContent('Vendas');

    // Abrindo o popover, ambas as opções devem existir, com aria-selected
    // refletindo o estado atual.
    await user.click(trigger);
    const suporteOption = await screen.findByRole('option', { name: /suporte/i });
    const vendasOption = await screen.findByRole('option', { name: /vendas/i });
    expect(suporteOption).toHaveAttribute('aria-selected', 'true');
    expect(vendasOption).toHaveAttribute('aria-selected', 'false');
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
        departmentIds: ['00000000-0000-7000-8000-0000000000d1'],
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
    const trigger = await screen.findByRole('combobox', { name: /departamentos/i });
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: /suporte/i })); // uncheck
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      const patch = calls.find((c) => (c.method ?? '').toLowerCase() === 'patch');
      expect(patch).toBeTruthy();
      expect(JSON.parse(patch!.data as string).departmentIds).toEqual([]);
    });
  });
});
