'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuickReplyDialog } from './quick-reply-dialog';

export function QuickReplyDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Nova resposta rápida
      </Button>
      <QuickReplyDialog mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
