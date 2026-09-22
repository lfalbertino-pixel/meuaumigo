import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Meu AUmigo — apadrinhe histórias reais',
    template: '%s · Meu AUmigo',
  },
  description:
    'Você apadrinha. A gente cuida. E um AUmigo ganha uma nova chance. Conheça os animais resgatados, acompanhe a recuperação e veja para onde vai cada real.',
  icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
  appleWebApp: { capable: true, title: 'Meu AUmigo', statusBarStyle: 'default' },
  openGraph: {
    type: 'website',
    siteName: 'Meu AUmigo',
    locale: 'pt_BR',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a292b',
  width: 'device-width',
  initialScale: 1,
  // Sem maximumScale: quem quiser ampliar a foto do animal precisa poder.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
