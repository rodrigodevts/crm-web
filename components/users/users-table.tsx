'use client';

import { useUsersControllerList } from '@/lib/generated/hooks/useUsersControllerList';
import { apiClient } from '@/lib/api-client';
import type { UserListResponseDto } from '@/lib/generated/types/UserListResponseDto';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UserListItem = UserListResponseDto['items'][number];

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

export function UsersTable() {
  const query = useUsersControllerList(
    { active: true, limit: 50 },
    { client: { client: apiClient } },
  );

  const items: UserListItem[] = query.data?.items ?? [];

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : query.isError ? (
            <TableRow>
              <TableCell colSpan={5} className="text-destructive text-center">
                Erro ao carregar usuários.
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                Nenhum usuário ativo.
              </TableCell>
            </TableRow>
          ) : (
            items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.absenceActive ? (
                      <Badge variant="secondary" aria-label="Usuário em modo ausente">
                        Ausente
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{ROLE_LABEL[user.role]}</TableCell>
                <TableCell>{formatDepartments(user.departments)}</TableCell>
                <TableCell>{formatLastSeen(user.lastSeenAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
