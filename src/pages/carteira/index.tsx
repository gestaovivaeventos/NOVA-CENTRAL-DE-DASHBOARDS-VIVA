/**
 * Página Index - Redireciona para Análises
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CarteiraIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/carteira/analises');
  }, [router]);

  return null;
}
