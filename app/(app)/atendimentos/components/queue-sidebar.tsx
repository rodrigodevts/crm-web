'use client';

import { useState } from 'react';
import { EllipsisVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { useCompanySettingsControllerFindMine } from '@/lib/generated/hooks';
import { useTicketsInfiniteQuery } from '@/hooks/use-tickets-infinite-query';
import { QueueList } from './queue-list';
import { QueueTabs, type QueueTabId } from './queue-tabs';

interface QueueSidebarProps {
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
}

// Kubb gera hooks sem baseURL embutido; passar { client: { client: apiClient } }
// pra usar nosso apiClient (baseURL + refresh interceptor).
const KUBB_CLIENT_OPTS = { client: { client: apiClient } } as const;

export function QueueSidebar({ selectedTicketId, onSelectTicket }: QueueSidebarProps) {
  const [activeTab, setActiveTab] = useState<QueueTabId>('open');

  const settingsQ = useCompanySettingsControllerFindMine(KUBB_CLIENT_OPTS);
  const hidePhoneFromAgents = settingsQ.data?.hidePhoneFromAgents ?? false;

  const openQ = useTicketsInfiniteQuery({ status: ['OPEN'] });
  const pendingQ = useTicketsInfiniteQuery({ status: ['PENDING'] });
  const botQ = useTicketsInfiniteQuery({ inBotFlow: true });

  const counts = {
    open: openQ.data?.pages[0]?.counts.OPEN ?? 0,
    pending: pendingQ.data?.pages[0]?.counts.PENDING ?? 0,
    bot: botQ.data?.pages[0]?.botCount ?? 0,
  };

  const tabsConfig = [
    { id: 'open' as const, query: openQ },
    { id: 'pending' as const, query: pendingQ },
    { id: 'bot' as const, query: botQ },
  ];

  return (
    <aside className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 px-6 pt-6 pb-4">
        <h1 className="text-foreground text-2xl font-semibold">Atendimento</h1>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            className="size-9 rounded-full"
            disabled
            aria-label="Novo atendimento (em breve)"
            title="Disponível em breve"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            disabled
            aria-label="Mais opções (em breve)"
            title="Disponível em breve"
          >
            <EllipsisVertical className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as QueueTabId)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-6 pb-3">
          <QueueTabs counts={counts} />
        </div>
        {tabsConfig.map(({ id, query }) => {
          const items = query.data?.pages.flatMap((p) => p.items) ?? [];
          const queryStatus = query.isPending
            ? ('pending' as const)
            : query.isError
              ? ('error' as const)
              : ('success' as const);
          return (
            <TabsContent key={id} value={id} className="flex-1 overflow-hidden">
              <QueueList
                items={items}
                status={queryStatus}
                hasNextPage={!!query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                hidePhoneFromAgents={hidePhoneFromAgents}
                selectedTicketId={selectedTicketId}
                onSelect={onSelectTicket}
                onLoadMore={() => query.fetchNextPage()}
                onRetry={() => query.refetch()}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </aside>
  );
}
