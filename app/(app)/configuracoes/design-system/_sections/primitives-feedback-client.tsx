'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SonnerTriggers() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast.success('Operação concluída')}>
        success
      </Button>
      <Button variant="outline" onClick={() => toast.error('Algo deu errado')}>
        error
      </Button>
      <Button variant="outline" onClick={() => toast.info('Informação')}>
        info
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Atenção')}>
        warning
      </Button>
    </div>
  );
}
