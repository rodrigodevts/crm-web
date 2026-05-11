import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('@/lib/generated/hooks/useCloseReasonsControllerCreate', () => ({
  useCloseReasonsControllerCreate: () => ({ mutateAsync: createMutate, isPending: false }),
  closeReasonsControllerCreateMutationKey: () => ['close-reasons', 'create'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerUpdate', () => ({
  useCloseReasonsControllerUpdate: () => ({ mutateAsync: updateMutate, isPending: false }),
  closeReasonsControllerUpdateMutationKey: () => ['close-reasons', 'update'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerList', () => ({
  closeReasonsControllerListQueryKey: () => ['close-reasons', 'list'],
}));
vi.mock('@/lib/generated/hooks/useDepartmentsControllerList', () => ({
  useDepartmentsControllerList: () => ({
    data: {
      items: [
        { id: '00000000-0000-4000-8000-000000000001', name: 'Suporte', active: true },
        { id: '00000000-0000-4000-8000-000000000002', name: 'Vendas', active: true },
      ],
      pagination: { hasMore: false, nextCursor: null },
    },
    isLoading: false,
  }),
  departmentsControllerListQueryKey: () => ['departments', 'list'],
}));

import { CloseReasonDialog } from './close-reason-dialog';

const existing = {
  id: 'r1',
  companyId: 'c1',
  name: 'Atendido',
  message: 'Obrigado pelo contato!',
  active: true,
  sortOrder: 0,
  triggersCsat: false,
  asksDealValue: false,
  funnelId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  departments: [{ id: '00000000-0000-4000-8000-000000000001', name: 'Suporte' }],
};

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  createMutate.mockReset();
  updateMutate.mockReset();
});

describe('CloseReasonDialog', () => {
  it('create: submit envia { name, message, departmentIds }', async () => {
    const user = userEvent.setup();
    createMutate.mockResolvedValue({ id: 'new' });
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/nome/i), 'Sem retorno');
    await user.type(screen.getByLabelText(/mensagem/i), 'Caso resolvido por inatividade.');
    await user.click(screen.getByRole('checkbox', { name: /suporte/i }));
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const arg = createMutate.mock.calls[0]?.[0];
    expect(arg.data).toMatchObject({
      name: 'Sem retorno',
      message: 'Caso resolvido por inatividade.',
      departmentIds: ['00000000-0000-4000-8000-000000000001'],
    });
  });

  it('edit: submit envia apenas dirty fields', async () => {
    const user = userEvent.setup();
    updateMutate.mockResolvedValue({});
    renderWithProviders(<CloseReasonDialog mode="edit" reason={existing} open onClose={vi.fn()} />);
    const name = screen.getByLabelText(/nome/i);
    await user.clear(name);
    await user.type(name, 'Atendimento concluído');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const arg = updateMutate.mock.calls[0]?.[0];
    expect(arg.id).toBe('r1');
    expect(arg.data).toEqual({ name: 'Atendimento concluído' });
  });

  it('Zod: name vazio bloqueia submit e exibe erro', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('409 (nome duplicado) mapeia pra erro inline no campo name', async () => {
    const user = userEvent.setup();
    createMutate.mockRejectedValue({
      response: { status: 409, data: { message: 'Já existe motivo com este nome.' } },
    });
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/nome/i), 'Atendido');
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    expect(await screen.findByText(/já existe motivo com este nome/i)).toBeInTheDocument();
  });

  it('multi-select de departamentos: toggle adiciona e remove do array submetido', async () => {
    const user = userEvent.setup();
    createMutate.mockResolvedValue({ id: 'new' });
    renderWithProviders(<CloseReasonDialog mode="create" reason={null} open onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/nome/i), 'Test');
    const suporte = screen.getByRole('checkbox', { name: /suporte/i });
    const vendas = screen.getByRole('checkbox', { name: /vendas/i });
    await user.click(suporte);
    await user.click(vendas);
    await user.click(suporte); // toggle off
    await user.click(screen.getByRole('button', { name: /criar motivo/i }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    const arg = createMutate.mock.calls[0]?.[0];
    expect(arg.data.departmentIds).toEqual(['00000000-0000-4000-8000-000000000002']);
  });
});
