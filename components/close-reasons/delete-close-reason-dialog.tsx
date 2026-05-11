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

export interface DeleteCloseReasonBlockedCounts {
  channelsUsingCount: number;
}

export interface DeleteCloseReasonDialogProps {
  reason: { id: string; name: string };
  open: boolean;
  blockedCounts: DeleteCloseReasonBlockedCounts | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`;
}

export function DeleteCloseReasonDialog({
  reason,
  open,
  blockedCounts,
  submitting,
  onConfirm,
  onClose,
}: DeleteCloseReasonDialogProps) {
  const blocked = blockedCounts !== null;
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        {!blocked ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{`Excluir motivo "${reason.name}"?`}</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Se algum canal usa o motivo no auto-fechamento por
                inatividade, a exclusão será bloqueada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={submitting}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Não é possível excluir</AlertDialogTitle>
              <AlertDialogDescription>
                {`Motivo está em uso por ${pluralize(
                  blockedCounts.channelsUsingCount,
                  'canal',
                  'canais',
                )} como motivo de auto-fechamento. Remova essa configuração nos canais antes de excluir.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>Entendi</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
