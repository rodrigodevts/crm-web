import type { Metadata } from 'next';
import { AtendimentosShell } from './components/atendimentos-shell';

export const metadata: Metadata = { title: 'Atendimentos — DigiChat' };

export default function Page() {
  return <AtendimentosShell />;
}
