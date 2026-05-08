import { Section } from './section';

const sizes: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'text-xs', label: 'text-xs (12px)' },
  { cls: 'text-sm', label: 'text-sm (14px)' },
  { cls: 'text-base', label: 'text-base (16px)' },
  { cls: 'text-lg', label: 'text-lg (18px)' },
  { cls: 'text-xl', label: 'text-xl (20px)' },
  { cls: 'text-2xl', label: 'text-2xl (24px)' },
  { cls: 'text-3xl', label: 'text-3xl (30px)' },
  { cls: 'text-4xl', label: 'text-4xl (36px)' },
];

const weights: ReadonlyArray<{ cls: string; label: string }> = [
  { cls: 'font-normal', label: 'font-normal (400)' },
  { cls: 'font-medium', label: 'font-medium (500)' },
  { cls: 'font-semibold', label: 'font-semibold (600)' },
  { cls: 'font-bold', label: 'font-bold (700)' },
];

export function TokensTypography() {
  return (
    <Section id="tokens-tipografia" title="Tipografia">
      <div>
        <h3 className="mb-3 text-base font-medium">Família</h3>
        <div className="flex flex-col gap-2">
          <p className="font-sans">
            Geist Sans (font-sans) — 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFG…
          </p>
          <p className="font-mono">
            Geist Mono (font-mono) — 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFG…
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tamanhos</h3>
        <div className="flex flex-col gap-2">
          {sizes.map((s) => (
            <div key={s.cls} className="flex items-baseline gap-4">
              <code className="text-muted-foreground w-40 text-xs">{s.label}</code>
              <span className={s.cls}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Pesos</h3>
        <div className="flex flex-col gap-2">
          {weights.map((w) => (
            <div key={w.cls} className="flex items-baseline gap-4">
              <code className="text-muted-foreground w-40 text-xs">{w.label}</code>
              <span className={`text-base ${w.cls}`}>The quick brown fox</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
