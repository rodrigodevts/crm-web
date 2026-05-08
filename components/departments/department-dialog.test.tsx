import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { DepartmentResponseDto } from '@/lib/generated/types/DepartmentResponseDto';
import { DepartmentDialogTrigger } from './department-dialog-trigger';
import { DepartmentDialog } from './department-dialog';

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

function setAdapter(handler: (config: AxiosRequestConfig) => Promise<unknown> | unknown): void {
  const adapter = vi.fn().mockImplementation((config) => Promise.resolve(handler(config)));
  apiClient.defaults.adapter = adapter as AxiosAdapter;
}

function ok(data: unknown, status = 200) {
  return (config: AxiosRequestConfig) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  });
}

function fail(status: number, data: unknown) {
  return (_config: AxiosRequestConfig) => Promise.reject({ response: { status, data } });
}

const fakeDepartment = (overrides: Partial<DepartmentResponseDto> = {}): DepartmentResponseDto => ({
  id: '00000000-0000-7000-8000-000000000010',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Suporte',
  active: true,
  distributionMode: 'MANUAL',
  greetingMessage: null,
  outOfHoursMessage: null,
  slaResponseMinutes: 30,
  slaResolutionMinutes: 240,
  workingHours: null,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

describe('DepartmentDialog', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('cria departamento com sucesso e exibe toast', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      return ok(fakeDepartment({ name: 'Vendas' }), 201)(config);
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <DepartmentDialogTrigger />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Novo departamento' }));
    await user.type(screen.getByLabelText('Nome'), 'Vendas');
    await user.click(screen.getByRole('button', { name: 'Criar departamento' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Departamento "Vendas" criado.');
    });
    expect(requests[0]?.method).toBe('post');
    expect(requests[0]?.url).toContain('/departments');
  });

  it('mostra mensagem inline distinta para 409 nome duplicado', async () => {
    setAdapter(fail(409, { message: 'Já existe um departamento com este nome' }));

    const user = userEvent.setup();
    render(
      <Wrapper>
        <DepartmentDialogTrigger />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Novo departamento' }));
    await user.type(screen.getByLabelText('Nome'), 'Suporte');
    await user.click(screen.getByRole('button', { name: 'Criar departamento' }));

    expect(await screen.findByText('Já existe um departamento com este nome')).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('valida nome obrigatório (mínimo 2 caracteres)', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <DepartmentDialogTrigger />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Novo departamento' }));
    await user.click(screen.getByRole('button', { name: 'Criar departamento' }));

    expect(
      await screen.findByText('Informe um nome com pelo menos 2 caracteres'),
    ).toBeInTheDocument();
  });

  it('em modo edit pré-preenche os campos e envia PATCH', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      return ok(fakeDepartment({ name: 'Suporte Premium' }))(config);
    });

    const department = fakeDepartment({
      name: 'Suporte',
      distributionMode: 'BALANCED',
      slaResponseMinutes: 15,
      slaResolutionMinutes: 60,
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <DepartmentDialog mode="edit" department={department} open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    const nameInput = screen.getByLabelText('Nome') as HTMLInputElement;
    expect(nameInput.value).toBe('Suporte');
    // o trigger do Select exibe o label do valor selecionado
    expect(screen.getAllByText('Balanceado').length).toBeGreaterThan(0);

    await user.clear(nameInput);
    await user.type(nameInput, 'Suporte Premium');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Departamento "Suporte Premium" atualizado.');
    });
    expect(requests[0]?.method).toBe('patch');
    expect(requests[0]?.url).toContain(`/departments/${department.id}`);
  });
});
