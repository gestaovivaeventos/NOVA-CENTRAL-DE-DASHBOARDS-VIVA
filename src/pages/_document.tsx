import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
        {/* Favicon */}
        <link rel="icon" href="/images/LOGO-VIVA-para-ico.ico" />
        <link rel="shortcut icon" href="/images/LOGO-VIVA-para-ico.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-dark-bg">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
