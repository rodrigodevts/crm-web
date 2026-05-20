import { Info } from 'lucide-react';

export function DetailPlaceholder() {
  return (
    <div className="text-muted-foreground hidden h-full flex-col items-center justify-center gap-2 p-6 md:flex">
      <Info className="size-10 opacity-40" aria-hidden />
      <p className="text-sm">Detalhes do atendimento aparecerão aqui</p>
    </div>
  );
}
