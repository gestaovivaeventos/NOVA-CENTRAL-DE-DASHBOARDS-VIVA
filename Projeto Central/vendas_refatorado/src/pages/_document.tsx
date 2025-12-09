/**
 * _document.tsx - Documento HTML base
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Dashboard de Vendas - VIVA Eventos Brasil" />
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Orbitron:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <body className="bg-dark-primary text-text-primary">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
