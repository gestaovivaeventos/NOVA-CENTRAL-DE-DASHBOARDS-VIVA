/**
 * Hook para verificar se o usuário atual tem acesso ao módulo Controle de Módulos
 * Busca os dados da planilha BASE MODULOS e verifica as regras de permissão
 */

import { useState, useEffect } from 'react';

interface ModuloAccessResult {
  hasAccess: boolean;
  loading: boolean;
}

export function useControleModulosAccess(
  username?: string,
  accessLevel?: number
): ModuloAccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // IMPORTANTE: resetar loading a cada execução para evitar estado stale
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

        if (!cm || !cm.ativo) {
          setHasAccess(false);
          return;
        }

        // Verificar nível de acesso
        const userLevel = accessLevel ?? 0;
        if (userLevel < cm.nvlAcesso) {
          setHasAccess(false);
          return;
        }

        // Verificar usuários específicos (vazio = todos com nível adequado)
        if (
          cm.usuariosPermitidos &&
          cm.usuariosPermitidos.length > 0 &&
          !cm.usuariosPermitidos.includes(username)
        ) {
          setHasAccess(false);
          return;
        }

        setHasAccess(true);
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
  }, [username, accessLevel]);

  return { hasAccess, loading };
}
