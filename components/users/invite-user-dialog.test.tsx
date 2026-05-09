import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter } from 'axios';
import { apiClient } from '@/lib/api-client';
import { InviteUserDialog } from './invite-user-dialog';

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: (...args: unknown[]) => toastInfo(...args),
  },
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const originalAdapter = apiClient.defaults.adapter;

function setCreateAdapter(status: number, data: unknown): void {
  const adapter = vi.fn().mockImplementation((config) => {
    if (status >= 200 && status < 300) {
      return Promise.resolve({ data, status, statusText: 'OK', headers: {}, config });
    }
    return Promise.reject({ response: { status, data }, config });
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
}

const fakeCreated = {
  id: '00000000-0000-7000-8000-000000000010',
  email: 'novo@example.com',
  role: 'AGENT' as const,
  status: 'PENDING' as const,
  invitedById: '00000000-0000-7000-8000-000000000001',
  invitedByName: 'Maria',
  acceptedById: null,
  acceptedAt: null,
  revokedAt: null,
  createdAt: '2026-05-07T10:00:00.000Z',
  inviteUrl: 'https://app.example.com/aceitar-convite/tok-xyz',
};

describe('InviteUserDialog', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
    toastInfo.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('cria convite com sucesso e exibe toast com ação Copiar link', async () => {
    setCreateAdapter(201, fakeCreated);

    const user = userEvent.setup();
    render(
      <Wrapper>
        <InviteUserDialog />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Convidar usuário' }));
    await user.type(screen.getByLabelText(/^E-mail/), 'novo@example.com');
    await user.click(screen.getByRole('button', { name: /criar convite/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        'Convite criado para novo@example.com',
        expect.objectContaining({ description: expect.anything() }),
      );
    });

    // Renderiza a description (JSX) pra confirmar que o botão "Copiar link"
    // existe nela e está acessível pelo nome.
    const [, options] = toastSuccess.mock.calls[0] as [string, { description: ReactNode }];
    const { getByRole } = render(<>{options.description}</>);
    expect(getByRole('button', { name: /copiar link/i })).toBeInTheDocument();
  });

  it('mostra mensagem inline distinta para 409 EMAIL_TAKEN', async () => {
    setCreateAdapter(409, { message: 'Email já cadastrado' });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <InviteUserDialog />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Convidar usuário' }));
    await user.type(screen.getByLabelText(/^E-mail/), 'taken@example.com');
    await user.click(screen.getByRole('button', { name: /criar convite/i }));

    expect(await screen.findByText('Email já cadastrado')).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('mostra mensagem inline distinta para 409 INVITE_PENDING', async () => {
    setCreateAdapter(409, { message: 'Já existe um convite pendente para este email' });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <InviteUserDialog />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: 'Convidar usuário' }));
    await user.type(screen.getByLabelText(/^E-mail/), 'dup@example.com');
    await user.click(screen.getByRole('button', { name: /criar convite/i }));

    expect(
      await screen.findByText('Já existe um convite pendente para este email'),
    ).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
