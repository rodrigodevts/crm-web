'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CloseReasonDialog } from './close-reason-dialog';

export function CloseReasonDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Novo motivo
      </Button>
      <CloseReasonDialog mode="create" reason={null} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
