/**
 * Página Index - Redireciona para Análises
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function CarteiraIndex() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    // Franqueados (accessLevel = 0) só podem acessar o PEX
    if (!authLoading && user && user.accessLevel === 0) {
      router.push('/pex');
      return;
    }
    // Se autenticado e autorizado, redireciona para análises
    if (!authLoading && isAuthenticated && user && user.accessLevel !== 0) {
      router.replace('/carteira/analises');
    }
  }, [router, authLoading, isAuthenticated, user]);

  return null;
}
