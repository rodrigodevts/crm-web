import {
  Contact as ContactIcon,
  Image as ImageIcon,
  LayoutTemplate,
  List,
  MapPin,
  Mic,
  MousePointerClick,
  Paperclip,
  Settings,
  Sticker,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { LastMessageTypeEnumKey, TicketsListResponseDto } from '@/lib/generated/types';

type LastMessage = TicketsListResponseDto['items'][number]['lastMessage'];

interface MediaDescriptor {
  Icon: LucideIcon;
  label: string;
}

// Ícone (lucide-react, padrão do projeto) + label por type, exceto TEXT.
// satisfies força exaustividade em tempo de compilação se o enum mudar.
const MEDIA_BY_TYPE = {
  IMAGE: { Icon: ImageIcon, label: 'Imagem' },
  VIDEO: { Icon: Video, label: 'Vídeo' },
  AUDIO: { Icon: Mic, label: 'Áudio' },
  FILE: { Icon: Paperclip, label: 'Arquivo' },
  STICKER: { Icon: Sticker, label: 'Figurinha' },
  CONTACT: { Icon: ContactIcon, label: 'Contato' },
  LOCATION: { Icon: MapPin, label: 'Localização' },
  BUTTON_REPLY: { Icon: MousePointerClick, label: 'Resposta de botão' },
  LIST_REPLY: { Icon: List, label: 'Resposta de lista' },
  TEMPLATE: { Icon: LayoutTemplate, label: 'Modelo' },
  SYSTEM: { Icon: Settings, label: 'Mensagem do sistema' },
} as const satisfies Record<Exclude<LastMessageTypeEnumKey, 'TEXT'>, MediaDescriptor>;

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

  const { Icon, label } = MEDIA_BY_TYPE[lastMessage.type];
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="line-clamp-1">{label}</span>
    </span>
  );
}
