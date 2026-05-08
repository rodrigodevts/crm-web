import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter } from 'axios';
import { apiClient } from '@/lib/api-client';
import { UsersTable } from './users-table';

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
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
  absenceMessage: null,
  absenceActive: false,
  lastSeenAt: '2026-05-08T10:30:00.000Z',
  departments: [{ id: '00000000-0000-7000-8000-0000000000bb', name: 'Suporte' }] as Department[],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

function setListAdapter(items: unknown[]): void {
  const adapter = vi.fn().mockImplementation((config) => {
    return Promise.resolve({
      data: { items, pagination: { nextCursor: null, hasMore: false } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });
  apiClient.defaults.adapter = adapter as AxiosAdapter;
}

describe('UsersTable', () => {
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

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
  });

  it('mostra badge "Ausente" quando absenceActive é true', async () => {
    setListAdapter([sampleUser({ absenceActive: true, name: 'Carlos' })]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );

    await screen.findByText('Carlos');
    expect(screen.getByText('Ausente')).toBeInTheDocument();
  });

  it('mostra placeholder em última atividade quando lastSeenAt é null', async () => {
    setListAdapter([sampleUser({ lastSeenAt: null, name: 'Joana' })]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );

    await screen.findByText('Joana');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('mostra empty state quando não há usuários', async () => {
    setListAdapter([]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );

    expect(await screen.findByText('Nenhum usuário ativo.')).toBeInTheDocument();
  });

  it('combina múltiplos departamentos com vírgula', async () => {
    setListAdapter([
      sampleUser({
        name: 'Pedro',
        departments: [
          { id: 'd1', name: 'Suporte' },
          { id: 'd2', name: 'Vendas' },
        ],
      }),
    ]);
    render(
      <Wrapper>
        <UsersTable />
      </Wrapper>,
    );

    await screen.findByText('Pedro');
    expect(screen.getByText('Suporte, Vendas')).toBeInTheDocument();
  });
});
