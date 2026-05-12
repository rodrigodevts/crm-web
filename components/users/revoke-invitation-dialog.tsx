'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvitationsControllerRevoke } from '@/lib/generated/hooks/useInvitationsControllerRevoke';
import { invitationsControllerListQueryKey } from '@/lib/generated/hooks/useInvitationsControllerList';
import { apiClient } from '@/lib/api-client';
import type { InvitationListResponseDto } from '@/lib/generated/types/InvitationListResponseDto';
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

type InvitationLite = Pick<InvitationListResponseDto['items'][number], 'id' | 'email'>;

interface RevokeInvitationDialogProps {
  invitation: InvitationLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RevokeInvitationDialog({
  invitation,
  open,
  onOpenChange,
}: RevokeInvitationDialogProps) {
  const queryClient = useQueryClient();
  const revoke = useInvitationsControllerRevoke({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!invitation) return;
    event.preventDefault();
    try {
      await revoke.mutateAsync({ id: invitation.id });
      toast.success(`Convite de ${invitation.email} revogado.`);
      void queryClient.invalidateQueries({
        queryKey: invitationsControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível revogar o convite. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Revogar convite {invitation ? `de ${invitation.email}` : ''}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            O link do convite deixa de funcionar imediatamente. Para reconvidar essa pessoa, será
            preciso criar um novo convite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revoke.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={revoke.isPending}
            onClick={handleConfirm}
          >
            {revoke.isPending ? 'Revogando…' : 'Revogar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
