import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { QuickReplyResponseDto } from '@/lib/generated/types/QuickReplyResponseDto';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { QuickReplyDialog } from './quick-reply-dialog';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

const fakeUser = (overrides: Partial<UserResponseDto> = {}): UserResponseDto => ({
  absenceActive: false,
  absenceMessage: null,
  active: true,
  companyId: '00000000-0000-7000-8000-0000000000aa',
  createdAt: '2026-05-01T00:00:00.000Z',
  departments: [],
  email: 'admin@example.com',
  id: '00000000-0000-7000-8000-0000000000bb',
  lastSeenAt: null,
  name: 'Admin',
  role: 'ADMIN',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

function Wrapper({ children, user = fakeUser() }: { children: ReactNode; user?: UserResponseDto }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <CurrentUserProvider user={user}>{children}</CurrentUserProvider>
    </QueryClientProvider>
  );
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

const fakeQuickReply = (overrides: Partial<QuickReplyResponseDto> = {}): QuickReplyResponseDto => ({
  id: '00000000-0000-7000-8000-000000000010',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  shortcut: 'saudacao',
  message: 'Olá! Como posso ajudar?',
  mediaUrl: null,
  mediaMimeType: null,
  scope: 'COMPANY',
  ownerUserId: null,
  active: true,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

describe('QuickReplyDialog', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('cria resposta rápida com sucesso e exibe toast', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      return ok(fakeQuickReply({ shortcut: 'oi', message: 'Olá!' }), 201)(config);
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Atalho/), 'oi');
    await user.type(screen.getByLabelText(/^Mensagem/), 'Olá!');
    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Resposta rápida "/oi" criada.');
    });
    expect(requests[0]?.method).toBe('post');
    expect(requests[0]?.url).toContain('/quick-replies');
    const body = JSON.parse(String(requests[0]?.data ?? '{}'));
    expect(body.shortcut).toBe('oi');
    expect(body.message).toBe('Olá!');
    expect(body.scope).toBe('PERSONAL'); // default
  });

  it('mostra mensagem inline distinta para 409 atalho duplicado', async () => {
    setAdapter(fail(409, { message: 'Já existe uma resposta rápida com este atalho' }));

    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Atalho/), 'saudacao');
    await user.type(screen.getByLabelText(/^Mensagem/), 'oi');
    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    expect(
      await screen.findByText('Já existe uma resposta rápida com este atalho'),
    ).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('valida atalho obrigatório', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    expect(await screen.findByText('Informe um atalho')).toBeInTheDocument();
  });

  it('valida regex do atalho (rejeita espaços e barras)', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Atalho/), 'tem espaco');
    await user.type(screen.getByLabelText(/^Mensagem/), 'oi');
    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    expect(await screen.findByText(/atalho aceita apenas letras, n[úu]meros/i)).toBeInTheDocument();
  });

  it('valida mensagem obrigatória', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Atalho/), 'oi');
    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    expect(await screen.findByText('Informe a mensagem')).toBeInTheDocument();
  });

  it('exige mediaMimeType quando mediaUrl está preenchida', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Atalho/), 'oi');
    await user.type(screen.getByLabelText(/^Mensagem/), 'oi');
    await user.type(screen.getByLabelText(/URL.*m[íi]dia/i), 'https://cdn.example.com/x.jpg');
    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    expect(await screen.findByText(/informe o tipo da m[íi]dia/i)).toBeInTheDocument();
  });

  it('exige mediaUrl quando mediaMimeType está preenchido', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Atalho/), 'oi');
    await user.type(screen.getByLabelText(/^Mensagem/), 'oi');
    await user.type(screen.getByLabelText(/Tipo.*m[íi]dia/i), 'image/jpeg');
    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    expect(await screen.findByText(/informe a url da m[íi]dia/i)).toBeInTheDocument();
  });

  it('em modo edit pré-preenche os campos e envia PATCH sem scope', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      return ok(fakeQuickReply({ shortcut: 'saudacao', message: 'Bem-vindo!' }))(config);
    });

    const quickReply = fakeQuickReply({ scope: 'COMPANY' });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="edit" quickReply={quickReply} open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    const shortcutInput = screen.getByLabelText(/^Atalho/) as HTMLInputElement;
    expect(shortcutInput.value).toBe('saudacao');

    const messageInput = screen.getByLabelText(/^Mensagem/) as HTMLTextAreaElement;
    await user.clear(messageInput);
    await user.type(messageInput, 'Bem-vindo!');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Resposta rápida "/saudacao" atualizada.');
    });
    expect(requests[0]?.method).toBe('patch');
    expect(requests[0]?.url).toContain(`/quick-replies/${quickReply.id}`);
    const body = JSON.parse(String(requests[0]?.data ?? '{}'));
    expect(body.shortcut).toBe('saudacao');
    expect(body.message).toBe('Bem-vindo!');
    expect(body).not.toHaveProperty('scope'); // backend recusa scope no PATCH
  });

  it('em modo edit o select de Escopo está desabilitado e mostra helper', () => {
    render(
      <Wrapper>
        <QuickReplyDialog mode="edit" quickReply={fakeQuickReply()} open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    const scopeTrigger = screen.getByRole('combobox', { name: /escopo/i });
    expect(scopeTrigger).toBeDisabled();
    expect(screen.getByText(/para mudar o escopo, crie uma nova/i)).toBeInTheDocument();
  });

  it('quando o usuário é AGENT em modo create, o escopo é fixado em PERSONAL', async () => {
    const agent = fakeUser({ role: 'AGENT' });
    render(
      <Wrapper user={agent}>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    const scopeTrigger = screen.getByRole('combobox', { name: /escopo/i });
    expect(scopeTrigger).toBeDisabled();
    expect(scopeTrigger).toHaveTextContent(/pessoal/i);
    expect(
      screen.getByText(/apenas administradores podem criar respostas globais/i),
    ).toBeInTheDocument();
  });

  it('mostra erro de root quando backend responde 403', async () => {
    setAdapter(fail(403, { message: 'forbidden' }));

    const user = userEvent.setup();
    render(
      <Wrapper>
        <QuickReplyDialog mode="create" open onOpenChange={vi.fn()} />
      </Wrapper>,
    );

    await user.type(screen.getByLabelText(/^Atalho/), 'oi');
    await user.type(screen.getByLabelText(/^Mensagem/), 'oi');
    await user.click(screen.getByRole('button', { name: 'Criar resposta rápida' }));

    expect(
      await screen.findByText(/apenas administradores podem criar respostas globais/i),
    ).toBeInTheDocument();
  });
});
