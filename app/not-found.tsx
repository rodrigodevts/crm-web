import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">404</h1>
      <p className="text-muted-foreground">Página não encontrada</p>
      <Button asChild variant="outline">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </main>
  );
}
