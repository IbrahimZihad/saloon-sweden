import type { Metadata, Viewport } from 'next';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { CookieConsent } from '@/components/layout/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Salong Sweden — Frisör & onlinebokning',
    template: '%s — Salong Sweden',
  },
  description:
    'Premium frisörsalong med skandinavisk precision. Boka klippning, färgning och styling online — enkelt och smidigt.',
  keywords: ['frisör', 'salong', 'klippning', 'färgning', 'onlinebokning', 'Sweden'],
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    siteName: 'Salong Sweden',
    title: 'Salong Sweden — Frisör & onlinebokning',
    description: 'Premium frisörsalong med skandinavisk precision. Boka din tid online.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#faf8f4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          {children}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}