import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.has('access_token');
  redirect(hasAccess ? '/atendimentos' : '/login');
}
