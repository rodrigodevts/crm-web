import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hooks mockados antes da importação do dialog
const createMutate = vi.fn();
const updateMutate = vi.fn();
const revealMutate = vi.fn();

vi.mock('@/lib/generated/hooks/useChannelsControllerCreate', () => ({
  useChannelsControllerCreate: () => ({ mutateAsync: createMutate, isPending: false }),
  channelsControllerCreateMutationKey: () => ['channels', 'create'],
}));
vi.mock('@/lib/generated/hooks/useChannelsControllerUpdate', () => ({
  useChannelsControllerUpdate: () => ({ mutateAsync: updateMutate, isPending: false }),
  channelsControllerUpdateMutationKey: () => ['channels', 'update'],
}));
vi.mock('@/lib/generated/hooks/useChannelsControllerReveal', () => ({
  useChannelsControllerReveal: () => ({ mutateAsync: revealMutate, isPending: false }),
  channelsControllerRevealMutationKey: () => ['channels', 'reveal'],
}));
vi.mock('@/lib/generated/hooks/useChannelsControllerList', () => ({
  channelsControllerListQueryKey: () => ['channels', 'list'],
}));
vi.mock('@/lib/generated/hooks/useDepartmentsControllerList', () => ({
  useDepartmentsControllerList: () => ({
    data: {
      items: [{ id: '00000000-0000-4000-8000-000000000001', name: 'Suporte', active: true }],
      pagination: { hasMore: false, nextCursor: null },
    },
    isLoading: false,
  }),
  departmentsControllerListQueryKey: () => ['departments', 'list'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerList', () => ({
  useCloseReasonsControllerList: () => ({
    data: { items: [{ id: '00000000-0000-4000-8000-000000000003', name: 'Atendido' }] },
    isLoading: false,
  }),
  closeReasonsControllerListQueryKey: () => ['close-reasons', 'list'],
}));

import { ChannelDialog } from './channel-dialog';
import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';

const channel: ChannelResponseDto = {
  id: 'c1',
  name: 'Canal A',
  provider: 'GUPSHUP',
  status: 'CONNECTED',
  phoneNumber: '5511999998888',
  externalId: null,
  config: { apiKey: '****9999', appId: '****8888', appName: 'app-a', sourcePhone: '5511999998888' },
  lastError: null,
  lastConnectedAt: null,
  defaultDepartmentId: '00000000-0000-4000-8000-000000000001',
  defaultChatFlowId: null,
  inactivityTimeoutMinutes: null,
  inactivityCloseReasonId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  createMutate.mockReset();
  updateMutate.mockReset();
  revealMutate.mockReset();
});

describe('ChannelDialog', () => {
  it('create: submit envia config aninhado com sourcePhone = phoneNumber', async () => {
    const user = userEvent.setup();
    createMutate.mockResolvedValue({ id: 'new' });
    renderWithProviders(
      <ChannelDialog mode="create" channel={null} open onClose={vi.fn()} role="ADMIN" />,
    );
    await user.type(screen.getByLabelText(/nome/i), 'Novo Canal');
    await user.type(screen.getByLabelText(/telefone do canal/i), '5511999998888');
    await user.type(screen.getByLabelText(/api key/i), 'KEY');
    await user.type(screen.getByLabelText(/app id/i), 'APP');
    await user.type(screen.getByLabelText(/app name/i), 'name');
    await user.click(screen.getByRole('button', { name: /criar canal/i }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const arg = createMutate.mock.calls[0]?.[0];
    expect(arg.data).toMatchObject({
      name: 'Novo Canal',
      provider: 'GUPSHUP',
      phoneNumber: '5511999998888',
      config: { apiKey: 'KEY', appId: 'APP', appName: 'name', sourcePhone: '5511999998888' },
    });
    expect(arg.data.defaultChatFlowId).toBeUndefined();
  });

  it('edit: revelar credenciais chama mutation e popula apiKey + appId reais', async () => {
    const user = userEvent.setup();
    revealMutate.mockResolvedValue({
      apiKey: 'REAL_KEY',
      appId: 'REAL_APP',
      appName: 'app-a',
      sourcePhone: '5511999998888',
    });
    renderWithProviders(
      <ChannelDialog mode="edit" channel={channel} open onClose={vi.fn()} role="ADMIN" />,
    );
    await user.click(screen.getByRole('button', { name: /revelar credenciais/i }));
    await waitFor(() => expect(revealMutate).toHaveBeenCalledWith({ id: 'c1' }));
    await waitFor(() => expect(screen.getByLabelText(/api key/i)).toHaveValue('REAL_KEY'));
    expect(screen.getByLabelText(/app id/i)).toHaveValue('REAL_APP');
  });

  it('edit: submit envia apenas dirty fields', async () => {
    const user = userEvent.setup();
    updateMutate.mockResolvedValue({});
    renderWithProviders(
      <ChannelDialog mode="edit" channel={channel} open onClose={vi.fn()} role="ADMIN" />,
    );
    const name = screen.getByLabelText(/nome/i);
    await user.clear(name);
    await user.type(name, 'Canal Renomeado');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const arg = updateMutate.mock.calls[0]?.[0];
    expect(arg.id).toBe('c1');
    expect(arg.data).toEqual({ name: 'Canal Renomeado' });
  });

  it('edit: phoneNumber dirty inclui config.sourcePhone no PATCH (após reveal)', async () => {
    const user = userEvent.setup();
    revealMutate.mockResolvedValue({
      apiKey: 'REAL_KEY',
      appId: 'REAL_APP',
      appName: 'app-a',
      sourcePhone: '5511999998888',
    });
    updateMutate.mockResolvedValue({});
    renderWithProviders(
      <ChannelDialog mode="edit" channel={channel} open onClose={vi.fn()} role="ADMIN" />,
    );
    await user.click(screen.getByRole('button', { name: /revelar credenciais/i }));
    await waitFor(() => expect(screen.getByLabelText(/api key/i)).toHaveValue('REAL_KEY'));
    const phone = screen.getByLabelText(/telefone do canal/i);
    await user.clear(phone);
    await user.type(phone, '5511777776666');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const arg = updateMutate.mock.calls[0]?.[0];
    expect(arg.data.phoneNumber).toBe('5511777776666');
    expect(arg.data.config).toEqual({
      apiKey: 'REAL_KEY',
      appId: 'REAL_APP',
      appName: 'app-a',
      sourcePhone: '5511777776666',
    });
  });
});
