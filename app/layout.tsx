import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/components/providers';
import { getThemeFromCookies } from '@/lib/theme-server';
import './globals.css';

export const metadata: Metadata = {
  title: 'DigiChat',
  description: 'CRM omnichannel WhatsApp multi-tenant',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = await getThemeFromCookies();

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}${
        resolvedTheme === 'dark' ? 'dark' : ''
      }`}
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers initialTheme={theme}>{children}</Providers>
      </body>
    </html>
  );
}
