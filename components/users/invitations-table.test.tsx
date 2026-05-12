import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import { InvitationsTable } from './invitations-table';

const toastSuccess = vi.fn();
const toastInfo = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    info: (...args: unknown[]) => toastInfo(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const originalAdapter = apiClient.defaults.adapter;

interface ListResponse {
  items: Array<Record<string, unknown>>;
  pagination: { nextCursor: string | null; hasMore: boolean };
}

const sampleInvitation = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: '00000000-0000-7000-8000-00000000000a',
  email: 'pendente@example.com',
  role: 'AGENT',
  status: 'PENDING',
  invitedById: '00000000-0000-7000-8000-000000000001',
  invitedByName: 'Maria Admin',
  acceptedById: null,
  acceptedAt: null,
  revokedAt: null,
  createdAt: '2026-05-07T10:00:00.000Z',
  ...overrides,
});

function setListAdapter(byStatus: Record<string, ListResponse>): void {
  const adapter = vi.fn().mockImplementation((config: AxiosRequestConfig) => {
    const status = String(config.params?.status ?? 'PENDING');
    const payload = byStatus[status] ?? {
      items: [],
      pagination: { nextCursor: null, hasMore: false },
    };
    return Promise.resolve({ data: payload, status: 200, statusText: 'OK', headers: {}, config });
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
}

describe('InvitationsTable', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastInfo.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('renderiza convites pendentes com ações copiar/reenviar/revogar', async () => {
    setListAdapter({
      PENDING: {
        items: [sampleInvitation({ email: 'pendente@example.com' })],
        pagination: { nextCursor: null, hasMore: false },
      },
    });

    render(
      <Wrapper>
        <InvitationsTable />
      </Wrapper>,
    );

    expect(await screen.findByText('pendente@example.com')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByText('Maria Admin')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copiar link do convite de pendente@example.com/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reenviar convite de pendente@example.com/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /revogar convite de pendente@example.com/i }),
    ).toBeInTheDocument();
  });

  it('renderiza convites aceitos sem ações ao trocar a aba', async () => {
    setListAdapter({
      PENDING: { items: [], pagination: { nextCursor: null, hasMore: false } },
      ACCEPTED: {
        items: [
          sampleInvitation({
            email: 'aceito@example.com',
            status: 'ACCEPTED',
            acceptedAt: '2026-05-07T11:00:00.000Z',
          }),
        ],
        pagination: { nextCursor: null, hasMore: false },
      },
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <InvitationsTable />
      </Wrapper>,
    );

    await user.click(screen.getByRole('tab', { name: 'Aceitos' }));

    expect(await screen.findByText('aceito@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copiar link/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reenviar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /revogar/i })).not.toBeInTheDocument();
  });

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
});
