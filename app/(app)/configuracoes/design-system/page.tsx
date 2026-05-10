import type { Metadata } from 'next';
import { Section } from './_sections/section';
import { TokensColors } from './_sections/tokens-colors';
import { TokensTypography } from './_sections/tokens-typography';
import { TokensSpacing } from './_sections/tokens-spacing';
import { PrimitivesButtons } from './_sections/primitives-buttons';
import { PrimitivesForms } from './_sections/primitives-forms';
import { PrimitivesFeedback } from './_sections/primitives-feedback';
import { PrimitivesOverlays } from './_sections/primitives-overlays';
import { PrimitivesData } from './_sections/primitives-data';
import { PrimitivesCharts } from './_sections/primitives-charts';
import { Composites } from './_sections/composites';

export const metadata: Metadata = { title: 'Design System — DigiChat' };

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Design System</h1>
        <p className="text-muted-foreground text-sm">
          Catálogo descritivo dos tokens, primitivos shadcn e compostos do projeto.
        </p>
      </header>

      <main className="flex flex-col gap-12">
        <Section id="tokens" title="Tokens">
          <TokensColors />
          <TokensTypography />
          <TokensSpacing />
        </Section>

        <Section id="primitivos" title="Primitivos">
          <PrimitivesButtons />
          <PrimitivesForms />
          <PrimitivesFeedback />
          <PrimitivesOverlays />
          <PrimitivesData />
          <PrimitivesCharts />
        </Section>

        <Composites />
      </main>
    </div>
  );
}
