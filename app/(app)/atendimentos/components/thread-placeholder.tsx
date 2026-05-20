import { MessageSquare } from 'lucide-react';

export function ThreadPlaceholder() {
  return (
    <div className="text-muted-foreground hidden h-full flex-col items-center justify-center gap-2 p-6 md:flex">
      <MessageSquare className="size-12 opacity-40" aria-hidden />
      <p className="text-sm">Selecione um atendimento</p>
    </div>
  );
}
