import { PencilIcon, BanIcon, RotateCcwIcon } from 'lucide-react';
import type { TagListResponseDto } from '@/lib/generated/types/TagListResponseDto';
import { Badge } from '@/components/ui/badge';
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

export type TagListItem = TagListResponseDto['items'][number];

export type TagsTableState = 'loading' | 'error' | 'ready';

export interface TagsTableViewProps {
  state: TagsTableState;
  items: TagListItem[];
  onEdit: (item: TagListItem) => void;
  onDeactivate: (item: TagListItem) => void;
  onReactivate: (item: TagListItem) => void;
  emptyMessage?: string;
}

type TagScope = TagListItem['scope'];

const SCOPE_LABEL: Record<TagScope, string> = {
  CONTACT: 'Contato',
  TICKET: 'Ticket',
  BOTH: 'Ambos',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function TagsTableView({
  state,
  items,
  onEdit,
  onDeactivate,
  onReactivate,
  emptyMessage = 'Nenhuma tag cadastrada.',
}: TagsTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead>Escopo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state === 'loading' ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : state === 'error' ? (
            <TableRow>
              <TableCell colSpan={6} className="text-destructive text-center">
                Erro ao carregar tags.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      aria-label={`Cor ${item.color}`}
                      role="img"
                      className="size-4 rounded-sm border"
                      style={{ backgroundColor: item.color }}
                    />
                    <code className="font-mono text-xs">{item.color}</code>
                  </div>
                </TableCell>
                <TableCell>{SCOPE_LABEL[item.scope]}</TableCell>
                <TableCell>
                  <Badge variant={item.active ? 'default' : 'outline'}>
                    {item.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(item.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      aria-label={`Editar tag ${item.name}`}
                    >
                      <PencilIcon className="size-4" />
                      Editar
                    </Button>
                    {item.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeactivate(item)}
                        aria-label={`Desativar tag ${item.name}`}
                      >
                        <BanIcon className="size-4" />
                        Desativar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReactivate(item)}
                        aria-label={`Reativar tag ${item.name}`}
                      >
                        <RotateCcwIcon className="size-4" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
