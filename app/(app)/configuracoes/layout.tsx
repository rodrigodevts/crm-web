import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUserOnServer } from '@/lib/auth-server';
import { canAccessRoute } from '@/lib/rbac';

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserOnServer();
  // (app)/layout.tsx já redireciona pra /login quando user é null; aqui só
  // tratamos o caso autenticado-mas-sem-permissão por rota — gate é
  // por pathname (não global por área) pra liberar /configuracoes/quick-replies
  // a AGENT/SUPERVISOR sem abrir o resto de /configuracoes/*. O pathname é
  // forwardado pelo proxy.ts no header `x-pathname`.
  if (user) {
    const pathname = (await headers()).get('x-pathname') ?? '/configuracoes';
    if (!canAccessRoute(user.role, pathname)) {
      redirect('/atendimentos');
    }
  }
  return <>{children}</>;
}
