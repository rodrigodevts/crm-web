import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import { DeactivateDepartmentDialog } from './deactivate-department-dialog';

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

const dept = { id: '00000000-0000-7000-8000-000000000010', name: 'Suporte' };

describe('DeactivateDepartmentDialog', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('confirma desativação via PATCH active=false e exibe toast', async () => {
    const requests: AxiosRequestConfig[] = [];
    apiClient.defaults.adapter = vi.fn().mockImplementation((config) => {
      requests.push(config);
      return Promise.resolve({
        data: { ...dept, active: false },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }) as AxiosAdapter;

    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Wrapper>
        <DeactivateDepartmentDialog department={dept} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Desativar' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Departamento "Suporte" desativado.');
    });
    expect(requests[0]?.method).toBe('patch');
    expect(requests[0]?.url).toContain(`/departments/${dept.id}`);
    expect(requests[0]?.data).toEqual(JSON.stringify({ active: false }));
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
        <DeactivateDepartmentDialog department={dept} open onOpenChange={onOpenChange} />
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
        <DeactivateDepartmentDialog department={dept} open onOpenChange={onOpenChange} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Desativar' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'Não foi possível desativar o departamento. Tente novamente.',
      );
    });
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
