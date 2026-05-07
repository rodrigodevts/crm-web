'use client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/components/query-provider';
import { ThemeProvider, type Theme } from '@/components/theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export function Providers({ children, initialTheme }: ProvidersProps) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <QueryProvider>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
