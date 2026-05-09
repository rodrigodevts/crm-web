'use client';

import { toast } from 'sonner';
import { useUsersControllerForceLogout } from '@/lib/generated/hooks/useUsersControllerForceLogout';
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

interface ForceLogoutUserDialogProps {
  user: UserLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForceLogoutUserDialog({ user, open, onOpenChange }: ForceLogoutUserDialogProps) {
  const forceLogout = useUsersControllerForceLogout({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) return;
    event.preventDefault();
    try {
      await forceLogout.mutateAsync({ id: user.id });
      toast.success(`Sessões de "${user.name}" encerradas.`);
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível encerrar as sessões. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Forçar logout de {user ? `"${user.name}"` : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            Encerra todas as sessões ativas deste usuário. Ele permanece com a conta ativa e poderá
            fazer login de novo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={forceLogout.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={forceLogout.isPending}
            onClick={handleConfirm}
          >
            {forceLogout.isPending ? 'Encerrando…' : 'Forçar logout'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
