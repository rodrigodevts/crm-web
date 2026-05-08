import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { TagResponseDto } from '@/lib/generated/types/TagResponseDto';
import { TagDialogTrigger } from './tag-dialog-trigger';
import { TagDialog } from './tag-dialog';

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

const fakeTag = (overrides: Partial<TagResponseDto> = {}): TagResponseDto => ({
  id: '00000000-0000-7000-8000-000000000010',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  name: 'Lead',
  color: '#1B84FF',
  scope: 'BOTH',
  active: true,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

describe('TagDialog', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('cria tag com sucesso e exibe toast', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      return ok(fakeTag({ name: 'VIP' }), 201)(config);
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <TagDialogTrigger />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Nova tag' }));
    await user.type(screen.getByLabelText(/^Nome/), 'VIP');
    await user.click(screen.getByRole('button', { name: 'Criar tag' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Tag "VIP" criada.');
    });
    expect(requests[0]?.method).toBe('post');
    expect(requests[0]?.url).toContain('/tags');
    const body = JSON.parse(String(requests[0]?.data ?? '{}'));
    expect(body.name).toBe('VIP');
    expect(body.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(body.scope).toBe('BOTH');
    expect(body.active).toBe(true);
  });

  it('mostra mensagem inline distinta para 409 nome duplicado', async () => {
    setAdapter(fail(409, { message: 'Já existe uma tag com este nome' }));

    const user = userEvent.setup();
    render(
      <Wrapper>
        <TagDialogTrigger />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Nova tag' }));
    await user.type(screen.getByLabelText(/^Nome/), 'Lead');
    await user.click(screen.getByRole('button', { name: 'Criar tag' }));

    expect(await screen.findByText('Já existe uma tag com este nome')).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('valida nome obrigatório', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <TagDialogTrigger />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Nova tag' }));
    await user.click(screen.getByRole('button', { name: 'Criar tag' }));

    expect(await screen.findByText('Informe um nome')).toBeInTheDocument();
  });

  it('valida formato hex da cor (rejeita 3-char e sem #)', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <TagDialogTrigger />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Nova tag' }));
    await user.type(screen.getByLabelText(/^Nome/), 'Lead');
    const colorText = screen.getByLabelText(/Cor.*hex/i);
    await user.clear(colorText);
    await user.type(colorText, 'banana');
    await user.click(screen.getByRole('button', { name: 'Criar tag' }));

    expect(await screen.findByText(/cor deve estar no formato/i)).toBeInTheDocument();
  });

  it('em modo edit pré-preenche os campos e envia PATCH', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      return ok(fakeTag({ name: 'Lead Premium' }))(config);
    });

    const tag = fakeTag({ name: 'Lead', scope: 'CONTACT', color: '#FF0000' });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <TagDialog mode="edit" tag={tag} open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    const nameInput = screen.getByLabelText(/^Nome/) as HTMLInputElement;
    expect(nameInput.value).toBe('Lead');

    await user.clear(nameInput);
    await user.type(nameInput, 'Lead Premium');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Tag "Lead Premium" atualizada.');
    });
    expect(requests[0]?.method).toBe('patch');
    expect(requests[0]?.url).toContain(`/tags/${tag.id}`);
  });
});
