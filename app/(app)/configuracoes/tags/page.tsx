import type { Metadata } from 'next';
import { TagDialogTrigger } from '@/components/tags/tag-dialog-trigger';
import { TagsTable } from '@/components/tags/tags-table';

export const metadata: Metadata = { title: 'Tags — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Tags</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre tags para classificar contatos e tickets. Defina cor, escopo e mantenha-as
            ativas conforme o uso.
          </p>
        </div>
        <TagDialogTrigger />
      </header>

      <TagsTable />
    </div>
  );
}
