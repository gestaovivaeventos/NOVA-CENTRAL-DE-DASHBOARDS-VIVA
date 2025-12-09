import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '@/context/AuthContext';
import { SheetsDataProvider } from '@/context/SheetsDataContext';
import { ParametrosProvider } from '@/context/ParametrosContext';
import { Shell } from '@/components/layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#212529" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AuthProvider>
        <SheetsDataProvider>
          <ParametrosProvider>
            <Shell>
              <Component {...pageProps} />
            </Shell>
          </ParametrosProvider>
        </SheetsDataProvider>
      </AuthProvider>
    </>
  );
}
