import type { Metadata } from 'next';
import { QuickReplyDialogTrigger } from '@/components/quick-replies/quick-reply-dialog-trigger';
import { QuickRepliesTable } from '@/components/quick-replies/quick-replies-table';

export const metadata: Metadata = { title: 'Quick Replies — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Quick Replies</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre atalhos do composer para enviar mensagens recorrentes mais rápido. Pessoais
            ficam visíveis só pra você; globais valem para o tenant inteiro.
          </p>
        </div>
        <QuickReplyDialogTrigger />
      </header>

      <QuickRepliesTable />
    </div>
  );
}
