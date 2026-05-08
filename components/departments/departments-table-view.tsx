import { PencilIcon, BanIcon, RotateCcwIcon } from 'lucide-react';
import type { DepartmentListResponseDto } from '@/lib/generated/types/DepartmentListResponseDto';
import type { ItemsDistributionModeEnumKey } from '@/lib/generated/types/DepartmentListResponseDto';
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

export type DepartmentListItem = DepartmentListResponseDto['items'][number];

export type DepartmentsTableState = 'loading' | 'error' | 'ready';

export interface DepartmentsTableViewProps {
  state: DepartmentsTableState;
  items: DepartmentListItem[];
  onEdit: (item: DepartmentListItem) => void;
  onDeactivate: (item: DepartmentListItem) => void;
  onReactivate: (item: DepartmentListItem) => void;
  emptyMessage?: string;
}

const DISTRIBUTION_LABEL: Record<ItemsDistributionModeEnumKey, string> = {
  MANUAL: 'Manual',
  RANDOM: 'Aleatório',
  BALANCED: 'Balanceado',
  SEQUENTIAL: 'Sequencial',
};

function formatSla(response: number | null, resolution: number | null): string {
  if (response === null && resolution === null) return '—';
  const parts: string[] = [];
  if (response !== null) parts.push(`Resposta: ${response}min`);
  if (resolution !== null) parts.push(`Resolução: ${resolution}min`);
  return parts.join(' · ');
}

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

export function DepartmentsTableView({
  state,
  items,
  onEdit,
  onDeactivate,
  onReactivate,
  emptyMessage = 'Nenhum departamento cadastrado.',
}: DepartmentsTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Distribuição</TableHead>
            <TableHead>SLA</TableHead>
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
                Erro ao carregar departamentos.
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
                <TableCell>{DISTRIBUTION_LABEL[item.distributionMode]}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatSla(item.slaResponseMinutes, item.slaResolutionMinutes)}
                </TableCell>
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
                      aria-label={`Editar departamento ${item.name}`}
                    >
                      <PencilIcon className="size-4" />
                      Editar
                    </Button>
                    {item.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeactivate(item)}
                        aria-label={`Desativar departamento ${item.name}`}
                      >
                        <BanIcon className="size-4" />
                        Desativar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReactivate(item)}
                        aria-label={`Reativar departamento ${item.name}`}
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
