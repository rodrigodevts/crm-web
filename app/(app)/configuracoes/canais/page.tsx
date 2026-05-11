import type { Metadata } from 'next';
import { ChannelsTable } from '@/components/channels/channels-table';

export const metadata: Metadata = { title: 'Canais — DigiChat' };

export default function Page() {
  return <ChannelsTable />;
}
