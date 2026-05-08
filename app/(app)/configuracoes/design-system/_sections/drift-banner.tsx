import { AlertTriangleIcon } from 'lucide-react';

export function DriftBanner() {
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-md border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30"
    >
      <AlertTriangleIcon
        className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <div className="text-sm">
        <p className="text-foreground font-medium">
          Drift conhecido com <code>design-system.md</code>
        </p>
        <p className="text-muted-foreground mt-1">
          O documento <code>design-system.md</code> descreve fontes (Archivo / Inter / JetBrains
          Mono) e tokens nomeados (<code>color/primary/500</code>, <code>radius/pill</code>) que não
          correspondem ao que está em <code>app/globals.css</code> hoje. A reconciliação é o gap
          §4.8 do <code>ROADMAP.md</code> (&ldquo;Tema final consolidado&rdquo;) — fora de escopo
          desta página.
        </p>
      </div>
    </aside>
  );
}
