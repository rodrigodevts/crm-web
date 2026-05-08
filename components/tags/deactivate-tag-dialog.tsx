'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTagsControllerUpdate } from '@/lib/generated/hooks/useTagsControllerUpdate';
import { tagsControllerListQueryKey } from '@/lib/generated/hooks/useTagsControllerList';
import type { TagListResponseDto } from '@/lib/generated/types/TagListResponseDto';
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

type TagLite = Pick<TagListResponseDto['items'][number], 'id' | 'name'>;

interface DeactivateTagDialogProps {
  tag: TagLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateTagDialog({ tag, open, onOpenChange }: DeactivateTagDialogProps) {
  const queryClient = useQueryClient();
  const update = useTagsControllerUpdate({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!tag) return;
    event.preventDefault();
    try {
      await update.mutateAsync({ id: tag.id, data: { active: false } });
      toast.success(`Tag "${tag.name}" desativada.`);
      void queryClient.invalidateQueries({
        queryKey: tagsControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível desativar a tag. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar tag {tag ? `"${tag.name}"` : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ela deixa de aparecer no filtro &quot;Ativas&quot; e não pode ser atribuída a novos
            contatos ou tickets. As atribuições existentes são preservadas. Você pode reativá-la
            depois pelo filtro &quot;Inativas&quot;.
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
