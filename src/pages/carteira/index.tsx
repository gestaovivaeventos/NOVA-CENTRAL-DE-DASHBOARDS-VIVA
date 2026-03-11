/**
 * Página Index - Redireciona para Análises
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useModuloPermissions } from '@/modules/controle-modulos/hooks';

export default function CarteiraIndex() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { allowedIds, loading: permissionsLoading } = useModuloPermissions(user?.username, user?.accessLevel);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !permissionsLoading && !allowedIds.has('carteira')) {
      router.push('/');
      return;
    }
    // Se autenticado e autorizado pela planilha, redireciona para análises
    if (!authLoading && isAuthenticated && user && !permissionsLoading && allowedIds.has('carteira')) {
      router.replace('/carteira/analises');
    }
  }, [router, authLoading, isAuthenticated, user, permissionsLoading, allowedIds]);

  return null;
}
