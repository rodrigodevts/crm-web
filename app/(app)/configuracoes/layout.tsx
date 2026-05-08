import { redirect } from 'next/navigation';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { canAccessAdminAreas } from '@/lib/rbac';

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  // (app)/layout.tsx já redireciona pra /login quando user é null; aqui só
  // tratamos o caso autenticado-mas-sem-permissão.
  if (user && !canAccessAdminAreas(user.role)) {
    redirect('/atendimentos');
  }
  return <>{children}</>;
}
