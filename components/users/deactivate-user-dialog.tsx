'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUsersControllerDelete } from '@/lib/generated/hooks/useUsersControllerDelete';
import { usersControllerListQueryKey } from '@/lib/generated/hooks/useUsersControllerList';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
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

type UserLite = Pick<UserResponseDto, 'id' | 'name'>;

interface DeactivateUserDialogProps {
  user: UserLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AxiosLikeError = {
  response?: { status?: number; data?: { message?: string } };
};

export function DeactivateUserDialog({ user, open, onOpenChange }: DeactivateUserDialogProps) {
  const queryClient = useQueryClient();
  const del = useUsersControllerDelete({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) return;
    event.preventDefault();
    try {
      await del.mutateAsync({ id: user.id });
      toast.success(`Usuário "${user.name}" desativado.`);
      void queryClient.invalidateQueries({
        queryKey: usersControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      const status = axiosErr?.response?.status;
      const message = axiosErr?.response?.data?.message;
      if (status === 409 && message) {
        toast.error(message);
        return;
      }
      toast.error('Não foi possível desativar o usuário. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar usuário {user ? `"${user.name}"` : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ele deixa de fazer login, mas o histórico (tickets, mensagens, atribuições) é
            preservado. Você pode reativá-lo depois pelo filtro &quot;Inativos&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={del.isPending} onClick={handleConfirm}>
            {del.isPending ? 'Desativando…' : 'Desativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
