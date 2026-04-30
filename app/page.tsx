import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">DigiChat</CardTitle>
          <CardDescription>CRM omnichannel WhatsApp multi-tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Esqueleto técnico — Fase 0. Use o canto superior direito para alternar tema.
          </p>
          <Button asChild className="mt-2 w-full">
            <Link href="/login">Entrar</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
