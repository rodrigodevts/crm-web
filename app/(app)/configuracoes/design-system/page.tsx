import type { Metadata } from 'next';
import { Toc } from './toc';
import { Section } from './_sections/section';
import { DriftBanner } from './_sections/drift-banner';
import { TokensColors } from './_sections/tokens-colors';
import { TokensTypography } from './_sections/tokens-typography';
import { TokensSpacing } from './_sections/tokens-spacing';
import { PrimitivesButtons } from './_sections/primitives-buttons';
import { PrimitivesForms } from './_sections/primitives-forms';
import { PrimitivesFeedback } from './_sections/primitives-feedback';
import { PrimitivesOverlays } from './_sections/primitives-overlays';
import { PrimitivesData } from './_sections/primitives-data';
import { PrimitivesCharts } from './_sections/primitives-charts';

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

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Toc />
        </aside>

        <main className="flex flex-col gap-12">
          <DriftBanner />
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
        </main>
      </div>
    </div>
  );
}
