import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/components/providers';
import { themeInitScript } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'DigiChat',
  description: 'CRM omnichannel WhatsApp multi-tenant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        {/* Seta a classe `dark` no <html> ANTES do React hidratar pra evitar
            flash de tema. Renderizado fora do React tree. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
