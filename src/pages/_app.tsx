import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '@/context/AuthContext';
import { SheetsDataProvider, ParametrosProvider } from '@/modules/pex';
import { Shell } from '@/modules/central';
import { FiltrosCarteiraProvider } from '@/modules/carteira/context/FiltrosCarteiraContext';

// Chart.js com plugin de data labels
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes do Chart.js globalmente
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

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
            <FiltrosCarteiraProvider>
              <Shell>
                <Component {...pageProps} />
              </Shell>
            </FiltrosCarteiraProvider>
          </ParametrosProvider>
        </SheetsDataProvider>
      </AuthProvider>
    </>
  );
}
