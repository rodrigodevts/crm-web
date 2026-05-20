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
    <TabsList className="flex h-auto w-full items-center justify-start gap-2 bg-transparent p-0">
      {TABS.map(({ id, label, Icon, countKey }) => (
        <TabsTrigger
          key={id}
          value={id}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted text-muted-foreground data-[state=inactive]:hover:text-foreground relative gap-1.5 rounded-full bg-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors data-[state=active]:shadow-sm"
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span>{label}</span>
          {counts[countKey] > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {counts[countKey]}
            </Badge>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
