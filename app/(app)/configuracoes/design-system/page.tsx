import type { Metadata } from 'next';
import { Toc } from './toc';
import { Section } from './_sections/section';

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
          <Section id="tokens" title="Tokens">
            <p className="text-muted-foreground">Em construção.</p>
          </Section>
        </main>
      </div>
    </div>
  );
}
