'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDepartmentsControllerSoftDelete } from '@/lib/generated/hooks/useDepartmentsControllerSoftDelete';
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

interface DeleteDepartmentDialogProps {
  department: DepartmentLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDepartmentDialog({
  department,
  open,
  onOpenChange,
}: DeleteDepartmentDialogProps) {
  const queryClient = useQueryClient();
  const softDelete = useDepartmentsControllerSoftDelete({ client: { client: apiClient } });

  const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!department) return;
    event.preventDefault();
    try {
      await softDelete.mutateAsync({ id: department.id });
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
            Ele deixa de aparecer nas listas de ativos. A ação pode ser desfeita reativando o
            departamento depois.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={softDelete.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={softDelete.isPending}
            onClick={handleConfirm}
          >
            {softDelete.isPending ? 'Desativando…' : 'Desativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
