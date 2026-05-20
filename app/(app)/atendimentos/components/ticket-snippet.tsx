import type { TicketsListResponseDto, LastMessageTypeEnumKey } from '@/lib/generated/types';

type LastMessage = TicketsListResponseDto['items'][number]['lastMessage'];

// Tabela de labels por type — satisfies força exaustividade em tempo de compilação.
const LABEL_BY_TYPE = {
  TEXT: null, // TEXT usa content; ver lógica abaixo
  IMAGE: '📷 Imagem',
  VIDEO: '🎥 Vídeo',
  AUDIO: '🎤 Áudio',
  FILE: '📎 Arquivo',
  STICKER: '😀 Figurinha',
  CONTACT: '👤 Contato',
  LOCATION: '📍 Localização',
  BUTTON_REPLY: '▶ Resposta de botão',
  LIST_REPLY: '▶ Resposta de lista',
  TEMPLATE: '📋 Modelo',
  SYSTEM: '⚙ Mensagem do sistema',
} as const satisfies Record<LastMessageTypeEnumKey, string | null>;

interface TicketSnippetProps {
  lastMessage: LastMessage;
}

export function TicketSnippet({ lastMessage }: TicketSnippetProps) {
  if (lastMessage === null) return null;

  if (lastMessage.type === 'TEXT') {
    if (!lastMessage.content) return null;
    return (
      <span className="text-muted-foreground line-clamp-1 text-sm">{lastMessage.content}</span>
    );
  }

  return (
    <span className="text-muted-foreground line-clamp-1 text-sm">
      {LABEL_BY_TYPE[lastMessage.type]}
    </span>
  );
}
