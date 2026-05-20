'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AtendimentosErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AtendimentosError({ reset }: AtendimentosErrorProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertTriangle className="text-destructive size-10" aria-hidden />
      <h1 className="text-foreground text-lg font-semibold">Algo deu errado</h1>
      <p className="text-muted-foreground text-sm">
        Não foi possível carregar a tela de Atendimentos.
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
