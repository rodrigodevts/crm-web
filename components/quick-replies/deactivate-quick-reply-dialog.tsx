'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useQuickRepliesControllerUpdate } from '@/lib/generated/hooks/useQuickRepliesControllerUpdate';
import { quickRepliesControllerListQueryKey } from '@/lib/generated/hooks/useQuickRepliesControllerList';
import type { QuickReplyListResponseDto } from '@/lib/generated/types/QuickReplyListResponseDto';
import { apiClient } from '@/lib/api-client';
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

type QuickReplyLite = Pick<QuickReplyListResponseDto['items'][number], 'id' | 'shortcut'>;

interface DeactivateQuickReplyDialogProps {
  quickReply: QuickReplyLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateQuickReplyDialog({
  quickReply,
  open,
  onOpenChange,
}: DeactivateQuickReplyDialogProps) {
  const queryClient = useQueryClient();
  const update = useQuickRepliesControllerUpdate({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!quickReply) return;
    event.preventDefault();
    try {
      await update.mutateAsync({ id: quickReply.id, data: { active: false } });
      toast.success(`Resposta rápida "/${quickReply.shortcut}" desativada.`);
      void queryClient.invalidateQueries({
        queryKey: quickRepliesControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível desativar a resposta rápida. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Desativar resposta rápida {quickReply ? `"/${quickReply.shortcut}"` : ''}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ela deixa de aparecer no filtro &quot;Ativas&quot; e não pode ser sugerida no composer.
            Você pode reativá-la depois pelo filtro &quot;Inativas&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={update.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={update.isPending}
            onClick={handleConfirm}
          >
            {update.isPending ? 'Desativando…' : 'Desativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
