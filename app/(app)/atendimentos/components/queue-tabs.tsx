'use client';

import { Bot, Clock, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export type QueueTabId = 'open' | 'pending' | 'bot';

interface QueueTabsProps {
  counts: { open: number; pending: number; bot: number };
}

const TABS: Array<{
  id: QueueTabId;
  label: string;
  Icon: typeof MessageCircle;
  countKey: 'open' | 'pending' | 'bot';
}> = [
  { id: 'open', label: 'Em atendimento', Icon: MessageCircle, countKey: 'open' },
  { id: 'pending', label: 'Na fila', Icon: Clock, countKey: 'pending' },
  { id: 'bot', label: 'Agente', Icon: Bot, countKey: 'bot' },
];

export function QueueTabs({ counts }: QueueTabsProps) {
  return (
    <TabsList className="h-auto w-full justify-start gap-2 border-b bg-transparent p-0">
      {TABS.map(({ id, label, Icon, countKey }) => (
        <TabsTrigger
          key={id}
          value={id}
          className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium"
        >
          <Icon className="size-4" aria-hidden />
          <span>{label}</span>
          <Badge className="bg-primary text-primary-foreground ml-1 h-5 min-w-5 justify-center rounded-full px-1.5 text-xs">
            {counts[countKey]}
          </Badge>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
