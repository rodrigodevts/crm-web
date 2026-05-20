import type { Metadata } from 'next';
import { AtendimentosShell } from './components/atendimentos-shell';

export const metadata: Metadata = { title: 'Atendimentos — DigiChat' };

export default function Page() {
  return (
    <div className="divide-border grid h-full grid-cols-1 divide-x md:grid-cols-[400px_1fr_360px]">
      <AtendimentosShell />
    </div>
  );
}
