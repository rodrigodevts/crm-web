'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDepartmentsControllerUpdate } from '@/lib/generated/hooks/useDepartmentsControllerUpdate';
import { departmentsControllerListQueryKey } from '@/lib/generated/hooks/useDepartmentsControllerList';
import type { DepartmentListResponseDto } from '@/lib/generated/types/DepartmentListResponseDto';
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

type DepartmentLite = Pick<DepartmentListResponseDto['items'][number], 'id' | 'name'>;

interface DeactivateDepartmentDialogProps {
  department: DepartmentLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateDepartmentDialog({
  department,
  open,
  onOpenChange,
}: DeactivateDepartmentDialogProps) {
  const queryClient = useQueryClient();
  const update = useDepartmentsControllerUpdate({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!department) return;
    event.preventDefault();
    try {
      await update.mutateAsync({ id: department.id, data: { active: false } });
      toast.success(`Departamento "${department.name}" desativado.`);
      void queryClient.invalidateQueries({
        queryKey: departmentsControllerListQueryKey(),
        exact: false,
      });
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível desativar o departamento. Tente novamente.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Desativar departamento {department ? `"${department.name}"` : ''}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ele deixa de aparecer no filtro &quot;Ativos&quot; e não recebe novos atendimentos. Você
            pode reativá-lo depois pelo filtro &quot;Inativos&quot; e marcando &quot;Ativo&quot; na
            edição.
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
