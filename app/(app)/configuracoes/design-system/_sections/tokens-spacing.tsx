import { Section } from './section';

const spacings: ReadonlyArray<{ cls: string; label: string; widthClass: string }> = [
  { cls: 'p-1', label: 'p-1 (4px)', widthClass: 'w-1' },
  { cls: 'p-2', label: 'p-2 (8px)', widthClass: 'w-2' },
  { cls: 'p-3', label: 'p-3 (12px)', widthClass: 'w-3' },
  { cls: 'p-4', label: 'p-4 (16px)', widthClass: 'w-4' },
  { cls: 'p-6', label: 'p-6 (24px)', widthClass: 'w-6' },
  { cls: 'p-8', label: 'p-8 (32px)', widthClass: 'w-8' },
  { cls: 'p-12', label: 'p-12 (48px)', widthClass: 'w-12' },
  { cls: 'p-16', label: 'p-16 (64px)', widthClass: 'w-16' },
  { cls: 'p-24', label: 'p-24 (96px)', widthClass: 'w-24' },
];

const radii: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'rounded-sm', label: 'rounded-sm' },
  { cls: 'rounded-md', label: 'rounded-md' },
  { cls: 'rounded-lg', label: 'rounded-lg' },
  { cls: 'rounded-xl', label: 'rounded-xl' },
  { cls: 'rounded-full', label: 'rounded-full' },
];

const shadows: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'shadow-sm', label: 'shadow-sm' },
  { cls: 'shadow-md', label: 'shadow-md' },
  { cls: 'shadow-lg', label: 'shadow-lg' },
  { cls: 'shadow-xl', label: 'shadow-xl' },
];

export function TokensSpacing() {
  return (
    <Section id="tokens-spacing" title="Spacing / Radius / Sombras">
      <div>
        <h3 className="mb-3 text-base font-medium">Spacing</h3>
        <div className="flex flex-col gap-2">
          {spacings.map((s) => (
            <div key={s.cls} className="flex items-center gap-4">
              <code className="text-muted-foreground w-32 text-xs">{s.label}</code>
              <div className={`bg-primary h-4 ${s.widthClass}`} aria-hidden />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Radius</h3>
        <div className="flex flex-wrap gap-4">
          {radii.map((r) => (
            <div key={r.cls} className="flex flex-col items-center gap-2">
              <div className={`bg-primary h-16 w-16 ${r.cls}`} aria-hidden />
              <code className="text-xs">{r.label}</code>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sombras</h3>
        <div className="flex flex-wrap gap-4">
          {shadows.map((s) => (
            <div key={s.cls} className="flex flex-col items-center gap-2">
              <div className={`bg-card h-16 w-24 rounded-md ${s.cls}`} aria-hidden />
              <code className="text-xs">{s.label}</code>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
