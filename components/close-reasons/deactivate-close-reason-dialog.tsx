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

export interface DeactivateCloseReasonDialogProps {
  reason: { id: string; name: string };
  open: boolean;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeactivateCloseReasonDialog({
  reason,
  open,
  submitting,
  onConfirm,
  onClose,
}: DeactivateCloseReasonDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Desativar motivo "${reason.name}"?`}</AlertDialogTitle>
          <AlertDialogDescription>
            O motivo deixa de aparecer no fechamento de tickets e no auto-fechamento de canais.
            Tickets já fechados com este motivo continuam preservados. Você pode reativá-lo a
            qualquer momento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Desativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
