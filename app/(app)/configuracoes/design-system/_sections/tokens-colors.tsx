import { Section } from './section';

const primaryScale: ReadonlyArray<{ token: string; hex: string }> = [
  { token: '--color-primary-50', hex: '#eff6ff' },
  { token: '--color-primary-100', hex: '#dbeafe' },
  { token: '--color-primary-200', hex: '#bfdbfe' },
  { token: '--color-primary-300', hex: '#93c5fd' },
  { token: '--color-primary-400', hex: '#60a5fa' },
  { token: '--color-primary-500', hex: '#1b84ff' },
  { token: '--color-primary-600', hex: '#1565db' },
  { token: '--color-primary-700', hex: '#1949b6' },
  { token: '--color-primary-800', hex: '#1e3a8a' },
  { token: '--color-primary-900', hex: '#1e3175' },
  { token: '--color-primary-950', hex: '#172554' },
];

const semanticTokens: ReadonlyArray<{ token: string; cls: string; description: string }> = [
  { token: '--background', cls: 'bg-background border', description: 'Fundo padrão da página' },
  { token: '--foreground', cls: 'bg-foreground', description: 'Texto principal' },
  { token: '--card', cls: 'bg-card border', description: 'Fundo de cards' },
  { token: '--card-foreground', cls: 'bg-card-foreground', description: 'Texto sobre card' },
  { token: '--primary', cls: 'bg-primary', description: 'Ações primárias (azul DigiChat)' },
  {
    token: '--primary-foreground',
    cls: 'bg-primary-foreground border',
    description: 'Texto sobre primary',
  },
  { token: '--secondary', cls: 'bg-secondary', description: 'Fundo secundário' },
  { token: '--muted', cls: 'bg-muted', description: 'Fundo desativado' },
  { token: '--muted-foreground', cls: 'bg-muted-foreground', description: 'Texto secundário' },
  { token: '--accent', cls: 'bg-accent', description: 'Hover sutil' },
  { token: '--destructive', cls: 'bg-destructive', description: 'Ações destrutivas / erros' },
  { token: '--border', cls: 'bg-border', description: 'Bordas e divisores' },
  { token: '--input', cls: 'bg-input', description: 'Bordas de input' },
  { token: '--ring', cls: 'bg-ring', description: 'Ring de focus' },
];

const sidebarTokens: ReadonlyArray<{ token: string; cls: string }> = [
  { token: '--sidebar', cls: 'bg-sidebar border' },
  { token: '--sidebar-foreground', cls: 'bg-sidebar-foreground' },
  { token: '--sidebar-primary', cls: 'bg-sidebar-primary' },
  { token: '--sidebar-accent', cls: 'bg-sidebar-accent' },
  { token: '--sidebar-border', cls: 'bg-sidebar-border' },
];

const chartTokens = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const;

interface SwatchProps {
  label: string;
  sublabel?: string;
  cls?: string;
  style?: React.CSSProperties;
}

function Swatch({ cls, style, label, sublabel }: SwatchProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`h-12 w-full rounded-md ${cls ?? ''}`} style={style} aria-hidden />
      <code className="text-xs">{label}</code>
      {sublabel ? <span className="text-muted-foreground text-xs">{sublabel}</span> : null}
    </div>
  );
}

export function TokensColors() {
  return (
    <Section id="tokens-cores" title="Cores">
      <div>
        <h3 className="mb-3 text-base font-medium">Primary scale (DigiChat blue)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {primaryScale.map((s) => (
            <Swatch
              key={s.token}
              style={{ backgroundColor: s.hex }}
              label={s.token}
              sublabel={s.hex}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Tokens semânticos shadcn</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {semanticTokens.map((s) => (
            <Swatch key={s.token} cls={s.cls} label={s.token} sublabel={s.description} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Sidebar</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {sidebarTokens.map((s) => (
            <Swatch key={s.token} cls={s.cls} label={s.token} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium">Chart accents</h3>
        <div className="grid grid-cols-5 gap-3">
          {chartTokens.map((token, i) => (
            <Swatch
              key={token}
              style={{ backgroundColor: `var(--chart-${i + 1})` }}
              label={token}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
