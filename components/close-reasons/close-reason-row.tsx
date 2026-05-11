'use client';

import { GripVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CloseReasonForDialog } from './close-reason-dialog';

export interface CloseReasonListItem extends CloseReasonForDialog {
  sortOrder: number;
}

export interface CloseReasonRowProps {
  reason: CloseReasonListItem;
  dragDisabled: boolean;
  onEdit: (r: CloseReasonListItem) => void;
  onDelete: (r: CloseReasonListItem) => void;
}

function summarizeDepartments(departments: ReadonlyArray<{ id: string; name: string }>): string {
  if (departments.length === 0) return 'Todos';
  if (departments.length <= 3) return departments.map((d) => d.name).join(', ');
  const first = departments
    .slice(0, 2)
    .map((d) => d.name)
    .join(', ');
  return `${first} e mais ${departments.length - 2}`;
}

export function CloseReasonRow({ reason, dragDisabled, onEdit, onDelete }: CloseReasonRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: reason.id,
    disabled: dragDisabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} data-testid={`close-reason-row-${reason.id}`}>
      <TableCell className="w-10 align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${reason.name}`}
          disabled={dragDisabled}
          className={cn(
            'text-muted-foreground inline-flex size-8 items-center justify-center rounded-md',
            'hover:bg-muted hover:text-foreground',
            'disabled:cursor-not-allowed disabled:opacity-40',
            !dragDisabled && 'cursor-grab active:cursor-grabbing',
          )}
        >
          <GripVerticalIcon className="size-4" aria-hidden="true" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{reason.name}</TableCell>
      <TableCell className="text-muted-foreground max-w-[20rem] truncate">
        {reason.message ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {summarizeDepartments(reason.departments)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(reason)}
            aria-label={`Editar motivo ${reason.name}`}
          >
            <PencilIcon className="size-4" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(reason)}
            aria-label={`Excluir motivo ${reason.name}`}
          >
            <Trash2Icon className="size-4" />
            Excluir
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
