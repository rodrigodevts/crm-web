'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthControllerLogout } from '@/lib/generated/hooks/useAuthControllerLogout';
import { apiClient } from '@/lib/api-client';
import { useCurrentUser } from '@/contexts/current-user-context';
import { getInitials } from '@/lib/initials';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const user = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthControllerLogout({ client: { client: apiClient } });

  const initials = getInitials(user.name);

  async function handleLogout() {
    try {
      await logout.mutateAsync({ data: {} });
      queryClient.clear();
      router.replace('/login');
    } catch {
      toast.error('Não foi possível sair. Tente novamente.');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu do usuário"
          className={cn(
            'hover:bg-bg-muted focus-visible:ring-primary-500 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none',
          )}
        >
          <span
            aria-hidden
            className="bg-primary-500 text-text-inverse flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
          >
            {initials}
          </span>
          <span className="text-text-primary hidden text-sm font-medium md:inline">
            {user.name || 'Usuário'}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-text-primary text-sm font-medium">{user.name || 'Usuário'}</div>
          <div className="text-text-secondary text-xs">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/configuracoes/preferencias')}>
          <User className="mr-2 h-4 w-4" />
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleLogout} disabled={logout.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          {logout.isPending ? 'Saindo…' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
