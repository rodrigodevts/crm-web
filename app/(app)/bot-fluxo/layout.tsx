import { redirect } from 'next/navigation';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { canAccessRoute } from '@/lib/rbac';

export default async function BotFluxoLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  // (app)/layout.tsx já redireciona pra /login quando user é null; aqui só
  // tratamos o caso autenticado-mas-sem-permissão.
  if (user && !canAccessRoute(user.role, '/bot-fluxo')) {
    redirect('/atendimentos');
  }
  return <>{children}</>;
}
