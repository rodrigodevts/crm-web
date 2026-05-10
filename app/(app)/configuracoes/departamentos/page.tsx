import type { Metadata } from 'next';
import { DepartmentDialogTrigger } from '@/components/departments/department-dialog-trigger';
import { DepartmentsTable } from '@/components/departments/departments-table';

export const metadata: Metadata = { title: 'Departamentos — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Departamentos</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre departamentos e defina como os atendimentos serão distribuídos entre os
            atendentes.
          </p>
        </div>
        <DepartmentDialogTrigger />
      </header>

      <DepartmentsTable />
    </div>
  );
}
