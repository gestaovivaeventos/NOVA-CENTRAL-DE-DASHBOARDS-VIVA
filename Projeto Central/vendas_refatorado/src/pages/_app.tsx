/**
 * _app.tsx - Componente de aplicação principal
 */

import type { AppProps } from 'next/app';
import '@/styles/globals.css';

// Registrar ChartDataLabels globalmente uma única vez
import { Chart as ChartJS } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar o plugin globalmente
ChartJS.register(ChartDataLabels);

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
