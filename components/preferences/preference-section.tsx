import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

export type PreferenceSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PreferenceSection({ title, description, children }: PreferenceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-text-primary text-lg font-semibold">{title}</h2>
        <CardDescription className="text-text-secondary text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="divide-border-default divide-y">{children}</CardContent>
    </Card>
  );
}
