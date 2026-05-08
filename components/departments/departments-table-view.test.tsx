import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DepartmentListResponseDto } from '@/lib/generated/types/DepartmentListResponseDto';
import { DepartmentsTableView } from './departments-table-view';

type Item = DepartmentListResponseDto['items'][number];

const baseItem = (overrides: Partial<Item> = {}): Item => ({
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

const noopHandlers = {
  onEdit: vi.fn(),
  onDeactivate: vi.fn(),
  onReactivate: vi.fn(),
};

describe('DepartmentsTableView', () => {
  it('renderiza skeletons no estado loading', () => {
    const { container } = render(
      <DepartmentsTableView state="loading" items={[]} {...noopHandlers} />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza mensagem de erro no estado error', () => {
    render(<DepartmentsTableView state="error" items={[]} {...noopHandlers} />);
    expect(screen.getByText('Erro ao carregar departamentos.')).toBeInTheDocument();
  });

  it('renderiza empty state quando ready e items vazio', () => {
    render(<DepartmentsTableView state="ready" items={[]} {...noopHandlers} />);
    expect(screen.getByText('Nenhum departamento cadastrado.')).toBeInTheDocument();
  });

  it('renderiza linha completa com nome, distribuição, SLA, ativo e atualizado', () => {
    render(<DepartmentsTableView state="ready" items={[baseItem()]} {...noopHandlers} />);
    expect(screen.getByText('Suporte')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText(/Resposta: 30min/)).toBeInTheDocument();
    expect(screen.getByText(/Resolução: 240min/)).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('exibe travessão quando SLA é nulo', () => {
    render(
      <DepartmentsTableView
        state="ready"
        items={[baseItem({ slaResponseMinutes: null, slaResolutionMinutes: null })]}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('exibe badge "Inativo" quando active é false', () => {
    render(
      <DepartmentsTableView
        state="ready"
        items={[baseItem({ active: false })]}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('aciona onEdit ao clicar em "Editar"', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const item = baseItem();
    render(
      <DepartmentsTableView
        state="ready"
        items={[item]}
        onEdit={onEdit}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /editar departamento suporte/i }));
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it('aciona onDeactivate ao clicar em "Desativar" em item ativo', async () => {
    const onDeactivate = vi.fn();
    const user = userEvent.setup();
    const item = baseItem();
    render(
      <DepartmentsTableView
        state="ready"
        items={[item]}
        onEdit={vi.fn()}
        onDeactivate={onDeactivate}
        onReactivate={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /desativar departamento suporte/i }));
    expect(onDeactivate).toHaveBeenCalledWith(item);
  });

  it('aciona onReactivate ao clicar em "Reativar" em item inativo', async () => {
    const onReactivate = vi.fn();
    const user = userEvent.setup();
    const item = baseItem({ active: false, name: 'Vendas' });
    render(
      <DepartmentsTableView
        state="ready"
        items={[item]}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={onReactivate}
      />,
    );
    await user.click(screen.getByRole('button', { name: /reativar departamento vendas/i }));
    expect(onReactivate).toHaveBeenCalledWith(item);
  });

  it('item inativo não mostra "Desativar" e mostra "Reativar"', () => {
    render(
      <DepartmentsTableView
        state="ready"
        items={[baseItem({ active: false, name: 'Vendas' })]}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByRole('button', { name: /desativar departamento vendas/i })).toBeNull();
    expect(
      screen.getByRole('button', { name: /reativar departamento vendas/i }),
    ).toBeInTheDocument();
  });

  it('renderiza label pt-BR para cada distributionMode', () => {
    render(
      <DepartmentsTableView
        state="ready"
        items={[
          baseItem({ id: '1', name: 'A', distributionMode: 'MANUAL' }),
          baseItem({ id: '2', name: 'B', distributionMode: 'RANDOM' }),
          baseItem({ id: '3', name: 'C', distributionMode: 'BALANCED' }),
          baseItem({ id: '4', name: 'D', distributionMode: 'SEQUENTIAL' }),
        ]}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Aleatório')).toBeInTheDocument();
    expect(screen.getByText('Balanceado')).toBeInTheDocument();
    expect(screen.getByText('Sequencial')).toBeInTheDocument();
  });
});
