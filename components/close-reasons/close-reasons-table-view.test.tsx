import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CloseReasonsTableView } from './close-reasons-table-view';

const noop = vi.fn();

describe('CloseReasonsTableView', () => {
  it('estado loading mostra skeletons', () => {
    render(
      <CloseReasonsTableView
        state="loading"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters={false}
      />,
    );
    expect(screen.getAllByTestId('close-reason-skeleton').length).toBeGreaterThanOrEqual(3);
  });

  it('empty global mostra mensagem e CTA', () => {
    render(
      <CloseReasonsTableView
        state="ready"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters={false}
      />,
    );
    expect(screen.getByText(/nenhum motivo de fechamento cadastrado/i)).toBeInTheDocument();
  });

  it('empty filtrado mostra mensagem diferente e botão Limpar filtros', () => {
    render(
      <CloseReasonsTableView
        state="ready"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters
      />,
    );
    expect(screen.getByText(/nenhum motivo corresponde aos filtros/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });

  it('estado error mostra alerta', () => {
    render(
      <CloseReasonsTableView
        state="error"
        items={[]}
        dragDisabled
        onEdit={noop}
        onDeactivate={noop}
        onReactivate={noop}
        onReorder={noop}
        onClearFilters={noop}
        hasFilters={false}
      />,
    );
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
  });
});
