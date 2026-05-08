'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TagDialog } from './tag-dialog';

export function TagDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Nova tag</Button>
      <TagDialog mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
