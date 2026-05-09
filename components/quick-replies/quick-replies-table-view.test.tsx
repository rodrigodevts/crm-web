import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { QuickReplyListResponseDto } from '@/lib/generated/types/QuickReplyListResponseDto';
import { QuickRepliesTableView } from './quick-replies-table-view';

type Item = QuickReplyListResponseDto['items'][number];

const baseItem = (overrides: Partial<Item> = {}): Item => ({
  id: '00000000-0000-7000-8000-000000000010',
  companyId: '00000000-0000-7000-8000-0000000000aa',
  shortcut: 'saudacao',
  message: 'Olá! Como posso ajudar?',
  mediaUrl: null,
  mediaMimeType: null,
  scope: 'COMPANY',
  ownerUserId: null,
  active: true,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T10:30:00.000Z',
  ...overrides,
});

const noopHandlers = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

const allowAll = () => true;

describe('QuickRepliesTableView', () => {
  it('renderiza skeletons no estado loading', () => {
    const { container } = render(
      <QuickRepliesTableView state="loading" items={[]} canEditItem={allowAll} {...noopHandlers} />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza mensagem de erro no estado error', () => {
    render(
      <QuickRepliesTableView state="error" items={[]} canEditItem={allowAll} {...noopHandlers} />,
    );
    expect(screen.getByText('Erro ao carregar respostas rápidas.')).toBeInTheDocument();
  });

  it('renderiza empty state padrão quando ready e items vazio', () => {
    render(
      <QuickRepliesTableView state="ready" items={[]} canEditItem={allowAll} {...noopHandlers} />,
    );
    expect(screen.getByText('Nenhuma resposta rápida cadastrada.')).toBeInTheDocument();
  });

  it('usa emptyMessage customizada quando fornecida', () => {
    render(
      <QuickRepliesTableView
        state="ready"
        items={[]}
        emptyMessage="Nenhuma resposta rápida encontrada."
        canEditItem={allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Nenhuma resposta rápida encontrada.')).toBeInTheDocument();
  });

  it('renderiza atalho com prefixo "/" e fonte mono', () => {
    render(
      <QuickRepliesTableView
        state="ready"
        items={[baseItem()]}
        canEditItem={allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('/saudacao')).toBeInTheDocument();
  });

  it('renderiza badge "Global" para scope COMPANY', () => {
    render(
      <QuickRepliesTableView
        state="ready"
        items={[baseItem({ scope: 'COMPANY' })]}
        canEditItem={allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Global')).toBeInTheDocument();
  });

  it('renderiza badge "Pessoal" para scope PERSONAL', () => {
    render(
      <QuickRepliesTableView
        state="ready"
        items={[baseItem({ scope: 'PERSONAL', ownerUserId: 'u1' })]}
        canEditItem={allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Pessoal')).toBeInTheDocument();
  });

  it('mostra mensagem truncada com title contendo o conteúdo completo', () => {
    const longMessage = 'A'.repeat(200);
    render(
      <QuickRepliesTableView
        state="ready"
        items={[baseItem({ message: longMessage })]}
        canEditItem={allowAll}
        {...noopHandlers}
      />,
    );
    const cell = screen.getByTitle(longMessage);
    expect(cell).toBeInTheDocument();
  });

  it('renderiza badge de mídia com mimetype quando mediaUrl está preenchida', () => {
    render(
      <QuickRepliesTableView
        state="ready"
        items={[
          baseItem({
            mediaUrl: 'https://cdn.example.com/x.jpg',
            mediaMimeType: 'image/jpeg',
          }),
        ]}
        canEditItem={allowAll}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('image/jpeg')).toBeInTheDocument();
  });

  it('renderiza traço quando mediaUrl é nula', () => {
    const { container } = render(
      <QuickRepliesTableView
        state="ready"
        items={[baseItem({ mediaUrl: null, mediaMimeType: null })]}
        canEditItem={allowAll}
        {...noopHandlers}
      />,
    );
    expect(container.textContent).toContain('—');
  });

  it('aciona onEdit ao clicar em "Editar"', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const item = baseItem();
    render(
      <QuickRepliesTableView
        state="ready"
        items={[item]}
        canEditItem={allowAll}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /editar resposta r[áa]pida saudacao/i }));
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it('aciona onDelete ao clicar em "Apagar"', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    const item = baseItem();
    render(
      <QuickRepliesTableView
        state="ready"
        items={[item]}
        canEditItem={allowAll}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole('button', { name: /apagar resposta r[áa]pida saudacao/i }));
    expect(onDelete).toHaveBeenCalledWith(item);
  });

  it('oculta ações e mostra "Apenas leitura" quando canEditItem retorna false', () => {
    render(
      <QuickRepliesTableView
        state="ready"
        items={[baseItem({ shortcut: 'corp', scope: 'COMPANY' })]}
        canEditItem={() => false}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByRole('button', { name: /editar resposta r[áa]pida corp/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /apagar resposta r[áa]pida corp/i })).toBeNull();
    expect(screen.getByText(/apenas leitura/i)).toBeInTheDocument();
  });
});
