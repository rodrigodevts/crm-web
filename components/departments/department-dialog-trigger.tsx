'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DepartmentDialog } from './department-dialog';

export function DepartmentDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        Novo departamento
      </Button>
      <DepartmentDialog mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
