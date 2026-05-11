'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ChannelsError({
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
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-foreground text-xl font-semibold">
          Não foi possível carregar os canais
        </h2>
        <p className="text-muted-foreground text-sm">Tente novamente em instantes.</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
