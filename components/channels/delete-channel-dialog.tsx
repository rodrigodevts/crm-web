'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface DeleteBlockedCounts {
  openTicketsCount: number;
  pendingTicketsCount: number;
}

export interface DeleteChannelDialogProps {
  channel: { id: string; name: string };
  open: boolean;
  blockedCounts: DeleteBlockedCounts | null;
  onConfirm: () => void;
  onClose: () => void;
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`;
}

export function DeleteChannelDialog({
  channel,
  open,
  blockedCounts,
  onConfirm,
  onClose,
}: DeleteChannelDialogProps) {
  const blocked = blockedCounts !== null;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        {!blocked ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{`Excluir canal "${channel.name}"?`}</AlertDialogTitle>
              <AlertDialogDescription>
                Tickets já fechados são preservados. Esta ação é reversível pelo admin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onConfirm}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Não é possível excluir</AlertDialogTitle>
              <AlertDialogDescription>
                {`Canal possui ${blockedCounts.openTicketsCount + blockedCounts.pendingTicketsCount} atendimento(s) ativo(s). Conclua-os antes de excluir.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="text-muted-foreground list-disc pl-5 text-sm">
              {blockedCounts.openTicketsCount > 0 && (
                <li>
                  {pluralize(
                    blockedCounts.openTicketsCount,
                    'atendimento aberto',
                    'atendimentos abertos',
                  )}
                </li>
              )}
              {blockedCounts.pendingTicketsCount > 0 && (
                <li>
                  {pluralize(
                    blockedCounts.pendingTicketsCount,
                    'atendimento pendente',
                    'atendimentos pendentes',
                  )}
                </li>
              )}
            </ul>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>Entendi</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
