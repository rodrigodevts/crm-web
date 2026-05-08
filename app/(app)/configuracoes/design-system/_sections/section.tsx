import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}
