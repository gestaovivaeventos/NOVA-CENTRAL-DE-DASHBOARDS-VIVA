/**
 * Hook centralizado de permissões de módulos
 * Busca os dados da planilha BASE MODULOS e retorna a lista de IDs de módulos
 * que o usuário corrente pode acessar.
 *
 * Usado pela Sidebar central, Home page, e qualquer lugar que precise filtrar módulos.
 */

import { useState, useEffect, useCallback } from 'react';

interface ModuloPermission {
  moduloId: string;
  moduloNome: string;
  moduloPath: string;
  nvlAcesso: number;
  usuariosPermitidos: string[];
  ativo: boolean;
  grupo: string;
  ordem: number;
  icone: string;
  tipo: string;
  urlExterna: string;
}

interface UseModuloPermissionsResult {
  /** IDs dos módulos que o usuário pode acessar */
  allowedIds: Set<string>;
  /** Todos os módulos da planilha (para quem precisar dos detalhes) */
  modulos: ModuloPermission[];
  /** Ainda carregando dados */
  loading: boolean;
}

export function useModuloPermissions(
  username?: string,
  accessLevel?: number
): UseModuloPermissionsResult {
  const [modulos, setModulos] = useState<ModuloPermission[]>([]);
  const [allowedIds, setAllowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const compute = useCallback(
    (mods: ModuloPermission[]) => {
      if (!username) {
        setAllowedIds(new Set());
        return;
      }
      const userLevel = accessLevel ?? 0;
      const ids = new Set<string>();
      for (const m of mods) {
        if (!m.ativo) continue;
        if (userLevel < m.nvlAcesso) continue;
        if (
          m.usuariosPermitidos.length > 0 &&
          !m.usuariosPermitidos.includes(username)
        )
          continue;
        ids.add(m.moduloId);
      }
      setAllowedIds(ids);
    },
    [username, accessLevel]
  );

  useEffect(() => {
    if (!username) {
      setAllowedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    fetch('/api/controle-modulos/data?refresh=true')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const mods: ModuloPermission[] = (data.modulos || []).map(
          (m: any) => ({
            moduloId: m.moduloId,
            moduloNome: m.moduloNome,
            moduloPath: m.moduloPath,
            nvlAcesso: m.nvlAcesso,
            usuariosPermitidos: m.usuariosPermitidos || [],
            ativo: m.ativo,
            grupo: m.grupo,
            ordem: m.ordem,
            icone: m.icone || 'dashboard',
            tipo: m.tipo || 'interno',
            urlExterna: m.urlExterna || '',
          })
        );
        setModulos(mods);
        compute(mods);
      })
      .catch(() => {
        // Em caso de erro, não bloqueia: permite tudo (fallback seguro pode ser alterado)
        if (!cancelled) setAllowedIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username, accessLevel, compute]);

  return { allowedIds, modulos, loading };
}
