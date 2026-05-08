import { redirect } from 'next/navigation';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { canAccessRoute } from '@/lib/rbac';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  // (app)/layout.tsx já redireciona pra /login quando user é null; aqui só
  // tratamos o caso autenticado-mas-sem-permissão.
  if (user && !canAccessRoute(user.role, '/dashboard')) {
    redirect('/atendimentos');
  }
  return <>{children}</>;
}
