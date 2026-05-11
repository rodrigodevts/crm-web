import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const reorderMutate = vi.fn();

vi.mock('@/lib/generated/hooks/useCloseReasonsControllerList', () => ({
  useCloseReasonsControllerList: () => ({
    data: {
      items: [
        {
          id: 'r1',
          companyId: 'c1',
          name: 'Atendido',
          message: null,
          active: true,
          sortOrder: 0,
          triggersCsat: false,
          asksDealValue: false,
          funnelId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          departments: [],
        },
        {
          id: 'r2',
          companyId: 'c1',
          name: 'Sem retorno',
          message: null,
          active: true,
          sortOrder: 1,
          triggersCsat: false,
          asksDealValue: false,
          funnelId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          departments: [],
        },
        {
          id: 'r3',
          companyId: 'c1',
          name: 'Sem mensagem',
          message: null,
          active: true,
          sortOrder: 2,
          triggersCsat: false,
          asksDealValue: false,
          funnelId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          departments: [],
        },
      ],
      pagination: { hasMore: false, nextCursor: null },
    },
    isPending: false,
    isError: false,
  }),
  closeReasonsControllerListQueryKey: () => ['close-reasons', 'list'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerUpdate', () => ({
  useCloseReasonsControllerUpdate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  closeReasonsControllerUpdateMutationKey: () => ['close-reasons', 'update'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerRemove', () => ({
  useCloseReasonsControllerRemove: () => ({ mutateAsync: vi.fn(), isPending: false }),
  closeReasonsControllerRemoveMutationKey: () => ['close-reasons', 'remove'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerReorder', () => ({
  useCloseReasonsControllerReorder: () => ({ mutateAsync: reorderMutate, isPending: false }),
  closeReasonsControllerReorderMutationKey: () => ['close-reasons', 'reorder'],
}));
vi.mock('@/lib/generated/hooks/useCloseReasonsControllerCreate', () => ({
  useCloseReasonsControllerCreate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  closeReasonsControllerCreateMutationKey: () => ['close-reasons', 'create'],
}));
vi.mock('@/lib/generated/hooks/useDepartmentsControllerList', () => ({
  useDepartmentsControllerList: () => ({
    data: { items: [], pagination: { hasMore: false, nextCursor: null } },
    isLoading: false,
  }),
  departmentsControllerListQueryKey: () => ['departments', 'list'],
}));

import { CloseReasonsTable } from './close-reasons-table';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  reorderMutate.mockReset();
});

describe('CloseReasonsTable', () => {
  it('renderiza 3 rows de motivos', () => {
    renderWithProviders(<CloseReasonsTable />);
    expect(screen.getByText('Atendido')).toBeInTheDocument();
    expect(screen.getByText('Sem retorno')).toBeInTheDocument();
    expect(screen.getByText('Sem mensagem')).toBeInTheDocument();
  });

  it('hint "Limpe os filtros para reordenar" aparece quando search está preenchido', async () => {
    const userEventMod = await import('@testing-library/user-event');
    const user = userEventMod.default.setup();
    renderWithProviders(<CloseReasonsTable />);
    await user.type(screen.getByLabelText(/buscar/i), 'A');
    await waitFor(() => {
      expect(screen.getByText(/limpe os filtros para reordenar/i)).toBeInTheDocument();
    });
  });
});
