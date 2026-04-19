/**
 * Hook para verificar se o usuário atual tem acesso ao módulo Controle de Módulos
 * Busca os dados da planilha BASE MODULOS e verifica as regras de permissão
 */

import { useState, useEffect } from 'react';
import { hasModuloAccess } from '../types';

interface ModuloAccessResult {
  hasAccess: boolean;
  loading: boolean;
}

export function useControleModulosAccess(
  username?: string,
  accessLevel?: number,
  userInfo?: { setor?: string; nmGrupo?: string }
): ModuloAccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(false);
    setLoading(true);

    let cancelled = false;

    fetch('/api/controle-modulos/data?refresh=true')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const modulos = data.modulos || [];
        const cm = modulos.find(
          (m: { moduloId: string }) => m.moduloId === 'controle-modulos'
        );

        if (!cm) {
          setHasAccess(false);
          return;
        }

        const ok = hasModuloAccess(cm, {
          username,
          accessLevel: accessLevel ?? 0,
          setor: userInfo?.setor,
          nmGrupo: userInfo?.nmGrupo,
        });
        setHasAccess(ok);
      })
      .catch(() => {
        if (!cancelled) setHasAccess(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username, accessLevel, userInfo?.setor, userInfo?.nmGrupo]);

  return { hasAccess, loading };
}
