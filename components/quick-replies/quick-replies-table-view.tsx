import { PencilIcon, TrashIcon, BuildingIcon, UserIcon, PaperclipIcon } from 'lucide-react';
import type { QuickReplyListResponseDto } from '@/lib/generated/types/QuickReplyListResponseDto';
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

export type QuickReplyListItem = QuickReplyListResponseDto['items'][number];

export type QuickRepliesTableState = 'loading' | 'error' | 'ready';

export interface QuickRepliesTableViewProps {
  state: QuickRepliesTableState;
  items: QuickReplyListItem[];
  canEditItem: (item: QuickReplyListItem) => boolean;
  onEdit: (item: QuickReplyListItem) => void;
  onDelete: (item: QuickReplyListItem) => void;
  emptyMessage?: string;
}

const COLUMN_COUNT = 6;

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

export function QuickRepliesTableView({
  state,
  items,
  canEditItem,
  onEdit,
  onDelete,
  emptyMessage = 'Nenhuma resposta rápida cadastrada.',
}: QuickRepliesTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Atalho</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Escopo</TableHead>
            <TableHead>Mídia</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state === 'loading' ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={COLUMN_COUNT}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : state === 'error' ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="text-destructive text-center">
                Erro ao carregar respostas rápidas.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="text-muted-foreground text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const editable = canEditItem(item);
              const isCompany = item.scope === 'COMPANY';
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <code className="font-mono text-sm">/{item.shortcut}</code>
                  </TableCell>
                  <TableCell
                    title={item.message}
                    className="text-muted-foreground max-w-xs truncate"
                  >
                    {item.message}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="gap-1 font-normal"
                      aria-label={isCompany ? 'Escopo global' : 'Escopo pessoal'}
                    >
                      {isCompany ? (
                        <BuildingIcon aria-hidden="true" className="size-3" />
                      ) : (
                        <UserIcon aria-hidden="true" className="size-3" />
                      )}
                      {isCompany ? 'Global' : 'Pessoal'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.mediaUrl ? (
                      <Badge variant="outline" className="gap-1 text-xs font-normal">
                        <PaperclipIcon aria-hidden="true" className="size-3" />
                        {item.mediaMimeType ?? 'mídia'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground" aria-hidden="true">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    {editable ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          aria-label={`Editar resposta rápida ${item.shortcut}`}
                        >
                          <PencilIcon className="size-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(item)}
                          aria-label={`Apagar resposta rápida ${item.shortcut}`}
                        >
                          <TrashIcon className="size-4" />
                          Apagar
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Apenas leitura</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
