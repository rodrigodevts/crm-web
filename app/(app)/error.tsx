'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-text-primary text-xl font-semibold">Algo deu errado</h2>
        <p className="text-text-secondary text-sm">
          Não conseguimos carregar essa parte. Tente recarregar.
        </p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
