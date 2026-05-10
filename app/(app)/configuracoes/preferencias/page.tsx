import type { Metadata } from 'next';
import { PreferencesForm } from '@/components/preferences/preferences-form';

export const metadata: Metadata = { title: 'Preferências — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold">Preferências</h1>
        <p className="text-muted-foreground text-sm">
          Configurações que afetam toda a empresa. Apenas administradores podem alterar.
        </p>
      </header>

      <PreferencesForm />
    </div>
  );
}
