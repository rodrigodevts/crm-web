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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CloseReasonRow, type CloseReasonListItem } from './close-reason-row';

export type CloseReasonsTableState = 'loading' | 'ready' | 'error';

export interface CloseReasonsTableViewProps {
  state: CloseReasonsTableState;
  items: ReadonlyArray<CloseReasonListItem>;
  dragDisabled: boolean;
  hasFilters: boolean;
  onEdit: (r: CloseReasonListItem) => void;
  onDelete: (r: CloseReasonListItem) => void;
  onReorder: (orderedIds: string[]) => void;
  onClearFilters: () => void;
}

const COLUMN_COUNT = 5;

export function CloseReasonsTableView({
  state,
  items,
  dragDisabled,
  hasFilters,
  onEdit,
  onDelete,
  onReorder,
  onClearFilters,
}: CloseReasonsTableViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    <div className="rounded-md border">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Nome</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead>Departamentos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={COLUMN_COUNT}>
                    <Skeleton data-testid="close-reason-skeleton" className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : state === 'error' ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="text-destructive text-center">
                  Não foi possível carregar os motivos.
                </TableCell>
              </TableRow>
            ) : items.length === 0 && !hasFilters ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="text-muted-foreground text-center">
                  Nenhum motivo de fechamento cadastrado.
                </TableCell>
              </TableRow>
            ) : items.length === 0 && hasFilters ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="text-center">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <p className="text-muted-foreground text-sm">
                      Nenhum motivo corresponde aos filtros.
                    </p>
                    <Button variant="outline" size="sm" onClick={onClearFilters}>
                      Limpar filtros
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((reason) => (
                  <CloseReasonRow
                    key={reason.id}
                    reason={reason}
                    dragDisabled={dragDisabled}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
