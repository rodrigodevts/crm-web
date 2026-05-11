import type { Metadata } from 'next';
import { CloseReasonDialogTrigger } from '@/components/close-reasons/close-reason-dialog-trigger';
import { CloseReasonsTable } from '@/components/close-reasons/close-reasons-table';

export const metadata: Metadata = { title: 'Motivos de fechamento — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Motivos de fechamento</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre motivos para encerrar tickets. Define a mensagem automática e os departamentos
            onde cada motivo aparece.
          </p>
        </div>
        <CloseReasonDialogTrigger />
      </header>

      <CloseReasonsTable />
    </div>
  );
}
