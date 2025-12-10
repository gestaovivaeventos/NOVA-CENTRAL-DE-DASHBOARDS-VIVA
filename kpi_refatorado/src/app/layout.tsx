import './globals.css';
import type { Metadata } from 'next';
import RootLayoutClient from './LayoutClient';

export const metadata: Metadata = {
  title: 'Gestão de KPIs - Indicadores de Performance',
  description: 'Painel de gestão de KPIs com acompanhamento de indicadores de performance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
