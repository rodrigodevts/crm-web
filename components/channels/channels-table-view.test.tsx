import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChannelsTableView } from './channels-table-view';

const noop = vi.fn();

describe('ChannelsTableView', () => {
  it('estado loading mostra 3 skeletons', () => {
    render(
      <ChannelsTableView
        state="loading"
        items={[]}
        departmentsById={{}}
        hasFilters={false}
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getAllByTestId('channel-skeleton')).toHaveLength(3);
  });

  it('empty global mostra mensagem "Nenhum canal cadastrado." e botão Novo canal', () => {
    render(
      <ChannelsTableView
        state="ready"
        items={[]}
        departmentsById={{}}
        hasFilters={false}
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getByText(/nenhum canal cadastrado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /novo canal/i })).toBeInTheDocument();
  });

  it('empty filtrado mostra mensagem diferente e botão Limpar filtros', () => {
    render(
      <ChannelsTableView
        state="ready"
        items={[]}
        departmentsById={{}}
        hasFilters
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getByText(/nenhum canal corresponde aos filtros/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });

  it('estado error mostra alerta', () => {
    render(
      <ChannelsTableView
        state="error"
        items={[]}
        departmentsById={{}}
        hasFilters={false}
        connectedCount={0}
        totalCount={0}
        onEdit={noop}
        onActivate={noop}
        onDeactivate={noop}
        onRestart={noop}
        onDelete={noop}
        onClearFilters={noop}
        onCreate={noop}
      />,
    );
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
  });
});
