/**
 * Hook centralizado de permissões de módulos
 * Busca os dados da planilha BASE MODULOS e retorna a lista de IDs de módulos
 * que o usuário corrente pode acessar.
 *
 * Usado pela Sidebar central, Home page, e qualquer lugar que precise filtrar módulos.
 */

import { useState, useEffect, useCallback } from 'react';
import { hasModuloAccess, type AcessoEixo } from '../types';

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
  subgrupo: string;
  setoresPermitidos: string[];
  gruposPermitidos: string[];
  usuariosExcecao: string[];
  beta: boolean;
  acessoFranqueadora: AcessoEixo;
  franqueadoraSetores: string[];
  franqueadoraGrupos: string[];
  franqueadoraUsuarios: string[];
  acessoFranquia: AcessoEixo;
  franquiaSetores: string[];
  franquiaGrupos: string[];
  franquiaUsuarios: string[];
  franquiaUnidades: string[];
}

interface UseModuloPermissionsResult {
  /** IDs dos módulos que o usuário pode acessar */
  allowedIds: Set<string>;
  /** Todos os módulos da planilha (para quem precisar dos detalhes) */
  modulos: ModuloPermission[];
  /** Ainda carregando dados */
  loading: boolean;
}

// Info do usuário logado para checar setor/grupo/unidades
interface UserInfo {
  setor?: string;
  nmGrupo?: string;
  unitNames?: string[];
}

export function useModuloPermissions(
  username?: string,
  accessLevel?: number,
  userInfo?: UserInfo
): UseModuloPermissionsResult {
  const [modulos, setModulos] = useState<ModuloPermission[]>([]);
  const [allowedIds, setAllowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const unitNamesKey = (userInfo?.unitNames || []).join('|');

  const compute = useCallback(
    (mods: ModuloPermission[]) => {
      if (!username) {
        setAllowedIds(new Set());
        return;
      }
      const userLevel = accessLevel ?? 0;
      const ids = new Set<string>();
      for (const m of mods) {
        const ok = hasModuloAccess(m, {
          username,
          accessLevel: userLevel,
          setor: userInfo?.setor,
          nmGrupo: userInfo?.nmGrupo,
          unitNames: userInfo?.unitNames,
        });
        if (ok) ids.add(m.moduloId);
      }
      setAllowedIds(ids);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, accessLevel, userInfo?.setor, userInfo?.nmGrupo, unitNamesKey]
  );

  useEffect(() => {
    if (!username) {
      setAllowedIds(new Set());
      // Manter loading=true enquanto username é undefined (auth ainda carregando).
      // O Shell.tsx trata não-autenticados antes de checar permissões,
      // então isso não causa spinner infinito na tela de login.
      setLoading(true);
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
            subgrupo: m.subgrupo || '',
            setoresPermitidos: m.setoresPermitidos || [],
            gruposPermitidos: m.gruposPermitidos || [],
            usuariosExcecao: m.usuariosExcecao || [],
            beta: m.beta || false,
            acessoFranqueadora: m.acessoFranqueadora || 'sem_acesso',
            franqueadoraSetores: m.franqueadoraSetores || [],
            franqueadoraGrupos: m.franqueadoraGrupos || [],
            franqueadoraUsuarios: m.franqueadoraUsuarios || [],
            acessoFranquia: m.acessoFranquia || 'sem_acesso',
            franquiaSetores: m.franquiaSetores || [],
            franquiaGrupos: m.franquiaGrupos || [],
            franquiaUsuarios: m.franquiaUsuarios || [],
            franquiaUnidades: m.franquiaUnidades || [],
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
