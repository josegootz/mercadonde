import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MercaDónde · Seguimiento Centralizado de Envíos de Mercado Libre',
  description:
    'Plataforma reactiva y minimalista para centralizar, geolocalizar en tiempo real y recibir alertas sonoras y push de tus envíos de Mercado Libre.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFE600' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
