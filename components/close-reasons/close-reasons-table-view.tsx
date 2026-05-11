'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CloseReasonRow, type CloseReasonListItem } from './close-reason-row';

export type CloseReasonsTableState = 'loading' | 'ready' | 'error';

export interface CloseReasonsTableViewProps {
  state: CloseReasonsTableState;
  items: ReadonlyArray<CloseReasonListItem>;
  dragDisabled: boolean;
  hasFilters: boolean;
  onEdit: (r: CloseReasonListItem) => void;
  onDeactivate: (r: CloseReasonListItem) => void;
  onReactivate: (r: CloseReasonListItem) => void;
  onReorder: (orderedIds: string[]) => void;
  onClearFilters: () => void;
}

export function CloseReasonsTableView({
  state,
  items,
  dragDisabled,
  hasFilters,
  onEdit,
  onDeactivate,
  onReactivate,
  onReorder,
  onClearFilters,
}: CloseReasonsTableViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (state === 'loading') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} data-testid="close-reason-skeleton" className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="border-destructive/40 bg-destructive/10 rounded-md border p-6 text-center">
        <p className="text-foreground text-sm">Não foi possível carregar os motivos.</p>
      </div>
    );
  }

  if (items.length === 0 && !hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">
          Nenhum motivo de fechamento cadastrado.
        </p>
        <p className="text-muted-foreground text-sm">
          Crie motivos para usar no auto-fechamento de canais e no encerramento manual de tickets.
        </p>
      </div>
    );
  }

  if (items.length === 0 && hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">
          Nenhum motivo corresponde aos filtros.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...items];
    const [moved] = next.splice(oldIndex, 1);
    if (!moved) return;
    next.splice(newIndex, 0, moved);
    onReorder(next.map((r) => r.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Nome</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Departamentos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((reason) => (
              <CloseReasonRow
                key={reason.id}
                reason={reason}
                dragDisabled={dragDisabled}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
              />
            ))}
          </SortableContext>
        </TableBody>
      </Table>
    </DndContext>
  );
}
