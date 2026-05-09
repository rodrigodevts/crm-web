import { PencilIcon, BanIcon, RotateCcwIcon, LogOutIcon } from 'lucide-react';
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import type { UserResponseDto } from '@/lib/generated/types/UserResponseDto';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { getInitials } from '@/lib/initials';

export type UserListItem = UserListResponseDto['items'][number];

export type UsersTableState = 'loading' | 'error' | 'ready';

export interface UsersTableViewProps {
  state: UsersTableState;
  items: UserListItem[];
  me: UserResponseDto;
  canEditItem: (item: UserListItem) => boolean;
  canDeactivateItem: (item: UserListItem) => boolean;
  canForceLogoutItem: (item: UserListItem) => boolean;
  onEdit: (item: UserListItem) => void;
  onDeactivate: (item: UserListItem) => void;
  onForceLogout: (item: UserListItem) => void;
  onReactivate: (item: UserListItem) => void;
  emptyMessage?: string;
}

const ROLE_LABEL: Record<UserListItem['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Atendente',
};

function formatLastSeen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function formatDepartments(departments: UserListItem['departments']): string {
  if (departments.length === 0) return '—';
  return departments.map((d) => d.name).join(', ');
}

function nameBadgeLabel(item: UserListItem, me: UserResponseDto): string | null {
  if (item.id === me.id) return 'Você';
  if (item.role === 'SUPER_ADMIN') return 'Conta da plataforma';
  if (item.absenceActive) return 'Ausente';
  return null;
}

export function UsersTableView({
  state,
  items,
  me,
  canEditItem,
  canDeactivateItem,
  canForceLogoutItem,
  onEdit,
  onDeactivate,
  onForceLogout,
  onReactivate,
  emptyMessage = 'Nenhum usuário encontrado.',
}: UsersTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Departamentos</TableHead>
            <TableHead>Última atividade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state === 'loading' ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : state === 'error' ? (
            <TableRow>
              <TableCell colSpan={7} className="text-destructive text-center">
                Erro ao carregar usuários.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((user) => {
              const badge = nameBadgeLabel(user, me);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {badge ? (
                          <Badge variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{ROLE_LABEL[user.role]}</TableCell>
                  <TableCell>{formatDepartments(user.departments)}</TableCell>
                  <TableCell>{formatLastSeen(user.lastSeenAt)}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'default' : 'outline'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEditItem(user) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                          aria-label={`Editar usuário ${user.name}`}
                        >
                          <PencilIcon className="size-4" />
                          Editar
                        </Button>
                      ) : null}
                      {user.active && canDeactivateItem(user) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeactivate(user)}
                          aria-label={`Desativar usuário ${user.name}`}
                        >
                          <BanIcon className="size-4" />
                          Desativar
                        </Button>
                      ) : null}
                      {user.active && canForceLogoutItem(user) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onForceLogout(user)}
                          aria-label={`Forçar logout do usuário ${user.name}`}
                        >
                          <LogOutIcon className="size-4" />
                          Forçar logout
                        </Button>
                      ) : null}
                      {!user.active && user.role !== 'SUPER_ADMIN' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReactivate(user)}
                          aria-label={`Reativar usuário ${user.name}`}
                        >
                          <RotateCcwIcon className="size-4" />
                          Reativar
                        </Button>
                      ) : null}
                    </div>
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
