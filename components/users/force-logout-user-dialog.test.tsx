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
