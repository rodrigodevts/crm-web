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
