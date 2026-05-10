import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/api-client';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import type { CompanySettingsResponseDto } from '@/lib/generated/types/CompanySettingsResponseDto';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CurrentUserProvider } from '@/contexts/current-user-context';
import { PreferencesForm } from './preferences-form';

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

const fakeSettings = (
  overrides: Partial<CompanySettingsResponseDto> = {},
): CompanySettingsResponseDto => ({
  id: '00000000-0000-7000-8000-000000000100',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  hideOtherUsersTickets: true,
  agentSeeOtherUsersTicketsOnSameChannel: false,
  agentSeeTicketsWithOtherDefaultAgents: true,
  hidePhoneFromAgents: false,
  ignoreGroupMessages: false,
  showAssignedGroups: false,
  forceWalletRouting: false,
  agentCanDeleteContacts: false,
  agentCanChangeDefaultAgent: false,
  agentCanEditTags: false,
  agentCanToggleSignature: false,
  hideBotTicketsFromAgents: false,
  defaultBotChatFlowId: null,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

function Wrapper({ children, user = fakeUser() }: { children: ReactNode; user?: UserResponseDto }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <CurrentUserProvider user={user}>
        <TooltipProvider>{children}</TooltipProvider>
      </CurrentUserProvider>
    </QueryClientProvider>
  );
}

const originalAdapter = apiClient.defaults.adapter;

function setAdapter(handler: (config: AxiosRequestConfig) => Promise<unknown> | unknown): void {
  // as AxiosAdapter cast justified: mocking axios internals in test
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

describe('PreferencesForm', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('mostra skeleton enquanto carrega settings', () => {
    setAdapter(() => new Promise(() => {})); // never resolves
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );
    expect(screen.getByTestId('preferences-skeleton')).toBeInTheDocument();
  });

  it('renderiza form populado com dados do GET para ADMIN (toggles editáveis)', async () => {
    setAdapter(ok(fakeSettings()));
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
      ).toBeChecked();
    });
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
  });

  it('para AGENT: toggles disabled e footer não renderiza', async () => {
    setAdapter(ok(fakeSettings()));
    render(
      <Wrapper user={fakeUser({ role: 'AGENT' })}>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
      ).toBeDisabled();
    });
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument();
  });

  it('submit envia PATCH apenas com campos dirty e mostra toast de sucesso', async () => {
    const requests: AxiosRequestConfig[] = [];
    setAdapter((config) => {
      requests.push(config);
      if (config.method === 'patch') {
        return ok(fakeSettings({ hideOtherUsersTickets: false, ignoreGroupMessages: true }))(
          config,
        );
      }
      return ok(fakeSettings())(config);
    });

    const user = userEvent.setup();
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }),
      ).toBeChecked();
    });

    await user.click(screen.getByRole('switch', { name: 'Ocultar tickets de outros atendentes' }));
    await user.click(screen.getByRole('switch', { name: 'Ignorar mensagens de grupos' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Preferências atualizadas');
    });

    const patchCall = requests.find((r) => r.method === 'patch');
    expect(patchCall).toBeDefined();
    expect(patchCall?.url).toContain('/companies/me/settings');
    const body = JSON.parse(String(patchCall?.data ?? '{}'));
    expect(body).toEqual({
      hideOtherUsersTickets: false,
      ignoreGroupMessages: true,
    });
    expect(body.defaultBotChatFlowId).toBeUndefined();
  });

  it('exibe error state quando GET falha', async () => {
    setAdapter(() => Promise.reject({ response: { status: 500, data: {} } }));
    render(
      <Wrapper>
        <PreferencesForm />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('preferences-error')).toBeInTheDocument();
    });
  });
});
