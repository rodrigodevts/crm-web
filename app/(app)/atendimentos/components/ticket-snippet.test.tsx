import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TicketSnippet } from './ticket-snippet';

describe('TicketSnippet', () => {
  it('não renderiza nada quando lastMessage é null', () => {
    const { container } = render(<TicketSnippet lastMessage={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza content literal quando type=TEXT', () => {
    const { getByText } = render(
      <TicketSnippet lastMessage={{ type: 'TEXT', content: 'Olá tudo bem' }} />,
    );
    expect(getByText('Olá tudo bem')).toBeTruthy();
  });

  it('não renderiza nada quando type=TEXT mas content é null', () => {
    const { container } = render(<TicketSnippet lastMessage={{ type: 'TEXT', content: null }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando type=TEXT mas content é string vazia', () => {
    const { container } = render(<TicketSnippet lastMessage={{ type: 'TEXT', content: '' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['IMAGE', '📷 Imagem'],
    ['VIDEO', '🎥 Vídeo'],
    ['AUDIO', '🎤 Áudio'],
    ['FILE', '📎 Arquivo'],
    ['STICKER', '😀 Figurinha'],
    ['CONTACT', '👤 Contato'],
    ['LOCATION', '📍 Localização'],
    ['BUTTON_REPLY', '▶ Resposta de botão'],
    ['LIST_REPLY', '▶ Resposta de lista'],
    ['TEMPLATE', '📋 Modelo'],
    ['SYSTEM', '⚙ Mensagem do sistema'],
  ] as const)('renderiza label correto para type=%s', (type, expected) => {
    const { getByText } = render(<TicketSnippet lastMessage={{ type, content: null }} />);
    expect(getByText(expected)).toBeTruthy();
  });
});
