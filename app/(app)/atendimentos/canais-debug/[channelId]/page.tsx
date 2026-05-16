import type { Metadata } from 'next';
import { ChannelDebugView } from './components/channel-debug-view';

export const metadata: Metadata = { title: 'Debug de mensagens — DigiChat' };

export default async function Page({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold">Debug de mensagens</h1>
        <p className="text-muted-foreground text-sm">
          Validação ponta-a-ponta da Fase 1. Tela descartável (substituída na Fase 2).
        </p>
      </header>
      <ChannelDebugView channelId={channelId} />
    </div>
  );
}
