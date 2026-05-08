import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TagListResponseDto } from '@/lib/generated/types/TagListResponseDto';
import { TagsTableView } from './tags-table-view';

type Item = TagListResponseDto['items'][number];

const baseItem = (overrides: Partial<Item> = {}): Item => ({
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

const noopHandlers = {
  onEdit: vi.fn(),
  onDeactivate: vi.fn(),
  onReactivate: vi.fn(),
};

describe('TagsTableView', () => {
  it('renderiza skeletons no estado loading', () => {
    const { container } = render(<TagsTableView state="loading" items={[]} {...noopHandlers} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza mensagem de erro no estado error', () => {
    render(<TagsTableView state="error" items={[]} {...noopHandlers} />);
    expect(screen.getByText('Erro ao carregar tags.')).toBeInTheDocument();
  });

  it('renderiza empty state quando ready e items vazio', () => {
    render(<TagsTableView state="ready" items={[]} {...noopHandlers} />);
    expect(screen.getByText('Nenhuma tag cadastrada.')).toBeInTheDocument();
  });

  it('usa emptyMessage customizada quando fornecida', () => {
    render(
      <TagsTableView
        state="ready"
        items={[]}
        emptyMessage="Nenhuma tag ativa encontrada."
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Nenhuma tag ativa encontrada.')).toBeInTheDocument();
  });

  it('renderiza linha completa com nome, swatch da cor, hex, escopo, status e atualizado', () => {
    render(<TagsTableView state="ready" items={[baseItem()]} {...noopHandlers} />);
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('#1B84FF')).toBeInTheDocument();
    expect(screen.getByText('Ambos')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    const swatch = screen.getByLabelText('Cor #1B84FF');
    expect(swatch).toBeInTheDocument();
    expect(swatch).toHaveStyle({ backgroundColor: '#1B84FF' });
  });

  it('renderiza label pt-BR para cada scope', () => {
    render(
      <TagsTableView
        state="ready"
        items={[
          baseItem({ id: '1', name: 'A', scope: 'CONTACT' }),
          baseItem({ id: '2', name: 'B', scope: 'TICKET' }),
          baseItem({ id: '3', name: 'C', scope: 'BOTH' }),
        ]}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('Ticket')).toBeInTheDocument();
    expect(screen.getByText('Ambos')).toBeInTheDocument();
  });

  it('exibe badge "Inativo" quando active é false', () => {
    render(<TagsTableView state="ready" items={[baseItem({ active: false })]} {...noopHandlers} />);
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('aciona onEdit ao clicar em "Editar"', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const item = baseItem();
    render(
      <TagsTableView
        state="ready"
        items={[item]}
        onEdit={onEdit}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /editar tag lead/i }));
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it('aciona onDeactivate ao clicar em "Desativar" em item ativo', async () => {
    const onDeactivate = vi.fn();
    const user = userEvent.setup();
    const item = baseItem();
    render(
      <TagsTableView
        state="ready"
        items={[item]}
        onEdit={vi.fn()}
        onDeactivate={onDeactivate}
        onReactivate={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /desativar tag lead/i }));
    expect(onDeactivate).toHaveBeenCalledWith(item);
  });

  it('aciona onReactivate ao clicar em "Reativar" em item inativo', async () => {
    const onReactivate = vi.fn();
    const user = userEvent.setup();
    const item = baseItem({ active: false, name: 'VIP' });
    render(
      <TagsTableView
        state="ready"
        items={[item]}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        onReactivate={onReactivate}
      />,
    );
    await user.click(screen.getByRole('button', { name: /reativar tag vip/i }));
    expect(onReactivate).toHaveBeenCalledWith(item);
  });

  it('item inativo não mostra "Desativar" e mostra "Reativar"', () => {
    render(
      <TagsTableView
        state="ready"
        items={[baseItem({ active: false, name: 'VIP' })]}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByRole('button', { name: /desativar tag vip/i })).toBeNull();
    expect(screen.getByRole('button', { name: /reativar tag vip/i })).toBeInTheDocument();
  });
});
