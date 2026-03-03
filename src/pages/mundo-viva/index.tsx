// ============================================
// Página Mundo Viva (TEMPORÁRIO)
// Rota: /mundo-viva
// Este módulo é TEMPORÁRIO e não interfere no resto da Central.
// ============================================

import Head from 'next/head';
import { MundoVivaMenu } from '@/modules/mundo-viva';

export default function MundoVivaPage() {
  return (
    <>
      <Head>
        <title>Mundo Viva Extranet - Protótipo de Menu</title>
        <meta name="description" content="Protótipo do novo menu do Mundo Viva Extranet" />
      </Head>
      <MundoVivaMenu />
    </>
  );
}
