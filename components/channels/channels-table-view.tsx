'use client';

import type { ChannelResponseDto } from '@/lib/generated/types/ChannelResponseDto';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannelCard } from './channel-card';

export type ChannelsTableState = 'loading' | 'ready' | 'error';

export interface ChannelsTableViewProps {
  state: ChannelsTableState;
  items: ReadonlyArray<ChannelResponseDto>;
  departmentsById: Readonly<Record<string, string>>;
  hasFilters: boolean;
  connectedCount: number;
  totalCount: number;
  onEdit: (c: ChannelResponseDto) => void;
  onActivate: (c: ChannelResponseDto) => void;
  onDeactivate: (c: ChannelResponseDto) => void;
  onRestart: (c: ChannelResponseDto) => void;
  onDelete: (c: ChannelResponseDto) => void;
  onClearFilters: () => void;
  onCreate: () => void;
}

export function ChannelsTableView({
  state,
  items,
  departmentsById,
  hasFilters,
  onEdit,
  onActivate,
  onDeactivate,
  onRestart,
  onDelete,
  onClearFilters,
  onCreate,
}: ChannelsTableViewProps) {
  if (state === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} data-testid="channel-skeleton" className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="border-destructive/40 bg-destructive/10 rounded-md border p-6 text-center">
        <p className="text-foreground text-sm">Não foi possível carregar os canais.</p>
      </div>
    );
  }

  if (items.length === 0 && !hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">Nenhum canal cadastrado.</p>
        <p className="text-muted-foreground text-sm">
          Crie seu primeiro canal Gupshup para começar.
        </p>
        <Button onClick={onCreate} size="lg">
          Novo canal
        </Button>
      </div>
    );
  }

  if (items.length === 0 && hasFilters) {
    return (
      <div className="border-border flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <p className="text-foreground text-base font-medium">
          Nenhum canal corresponde aos filtros.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <ChannelCard
          key={c.id}
          channel={c}
          departmentName={
            c.defaultDepartmentId ? (departmentsById[c.defaultDepartmentId] ?? null) : null
          }
          onEdit={onEdit}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
          onRestart={onRestart}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
