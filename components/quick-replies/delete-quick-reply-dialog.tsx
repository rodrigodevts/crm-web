'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useQuickRepliesControllerDelete } from '@/lib/generated/hooks/useQuickRepliesControllerDelete';
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

interface DeleteQuickReplyDialogProps {
  quickReply: QuickReplyLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteQuickReplyDialog({
  quickReply,
  open,
  onOpenChange,
}: DeleteQuickReplyDialogProps) {
  const queryClient = useQueryClient();
  const del = useQuickRepliesControllerDelete({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!quickReply) return;
    event.preventDefault();
    try {
      await del.mutateAsync({ id: quickReply.id });
      toast.success(`Resposta rápida "/${quickReply.shortcut}" apagada.`);
      void queryClient.invalidateQueries({
        queryKey: quickRepliesControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível apagar a resposta rápida. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Apagar resposta rápida {quickReply ? `"/${quickReply.shortcut}"` : ''}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é permanente. A resposta rápida será removida e não poderá ser recuperada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={del.isPending} onClick={handleConfirm}>
            {del.isPending ? 'Apagando…' : 'Apagar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
