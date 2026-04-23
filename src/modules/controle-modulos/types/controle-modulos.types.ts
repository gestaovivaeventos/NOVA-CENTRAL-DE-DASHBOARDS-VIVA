/**
 * Tipos do módulo Controle de Módulos
 */

// === Novo modelo de acesso (2 eixos independentes) ===
// Para cada eixo (franqueadora/franquia), o módulo pode ter:
//  - 'geral'      → todos os usuários desse eixo têm acesso
//  - 'sem_acesso' → ninguém desse eixo tem acesso
//  - 'restrito'   → apenas usuários que passam pelos filtros (setor/grupo/usuário) desse eixo
export type AcessoEixo = 'geral' | 'sem_acesso' | 'restrito';

// === Legado (mantido para compatibilidade / migração automática) ===
// Nível de acesso ao módulo
// 0 = Rede (todos com acesso >= 0, ou seja, franqueados + franqueadora)
// 1 = Franqueadora (somente franqueadora, accessLevel >= 1)
// 2 = Franquia (somente franquias, accessLevel === 0, exclui franqueadora)
export type NivelAcessoModulo = 0 | 1 | 2;

/**
 * [LEGADO] Verifica se um userLevel tem acesso a um módulo com determinado nvlAcesso.
 * Mantido para retrocompatibilidade. Use `hasModuloAccess` para a nova lógica.
 */
export function hasNivelAccess(userLevel: number, nvlAcesso: number): boolean {
  if (nvlAcesso === 0) return true;               // Rede: todos
  if (nvlAcesso === 1) return userLevel >= 1;      // Franqueadora only
  if (nvlAcesso === 2) return userLevel === 0;     // Franquia only
  return false;
}

/**
 * Nova lógica de permissão: decide acesso com base em 2 eixos independentes.
 * Ordem de checagem (para cada eixo aplicável ao usuário):
 *   1. Exceções (usuariosExcecao)   → acesso GARANTIDO (super-admin bypass)
 *   2. Eixo do usuário ('geral'/'sem_acesso'/'restrito')
 *   3. Se 'restrito': usuário precisa corresponder a pelo menos UM dos filtros
 *      preenchidos (setores OU grupos OU usuários). Se nenhum filtro estiver
 *      preenchido, o eixo 'restrito' libera acesso por padrão.
 *      Comparações são case-insensitive e ignoram espaços nas bordas.
 */
export function hasModuloAccess(
  modulo: Pick<
    ModuloConfig,
    | 'ativo'
    | 'usuariosExcecao'
    | 'acessoFranqueadora'
    | 'franqueadoraSetores'
    | 'franqueadoraGrupos'
    | 'franqueadoraUsuarios'
    | 'acessoFranquia'
    | 'franquiaSetores'
    | 'franquiaGrupos'
    | 'franquiaUsuarios'
    | 'franquiaUnidades'
  >,
  user: {
    username: string;
    accessLevel: number;
    setor?: string;
    nmGrupo?: string;
    unitNames?: string[];
  }
): boolean {
  if (!modulo.ativo) return false;

  // 1. Super-admin bypass
  if (modulo.usuariosExcecao && modulo.usuariosExcecao.includes(user.username)) return true;

  // 2. Determinar eixo do usuário
  const isFranqueadora = (user.accessLevel ?? 0) >= 1;
  const eixo = isFranqueadora ? modulo.acessoFranqueadora : modulo.acessoFranquia;
  const setores = isFranqueadora ? modulo.franqueadoraSetores : modulo.franquiaSetores;
  const grupos = isFranqueadora ? modulo.franqueadoraGrupos : modulo.franquiaGrupos;
  const usuarios = isFranqueadora ? modulo.franqueadoraUsuarios : modulo.franquiaUsuarios;

  if (eixo === 'sem_acesso') return false;
  if (eixo === 'geral') return true;

  // restrito: os três filtros (setores, grupos, usuários) são combinados em OR.
  // Se QUALQUER um dos filtros estiver preenchido, o usuário precisa corresponder
  // a pelo menos um deles. Caso contrário (todos vazios), libera pelo eixo 'restrito'.
  const norm = (v?: string) => (v || '').trim().toLowerCase();
  const hasSetorFilter = !!(setores && setores.length > 0);
  const hasGrupoFilter = !!(grupos && grupos.length > 0);
  const hasUsuarioFilter = !!(usuarios && usuarios.length > 0);

  if (hasSetorFilter || hasGrupoFilter || hasUsuarioFilter) {
    const setoresNorm = new Set((setores || []).map(norm).filter(Boolean));
    const gruposNorm = new Set((grupos || []).map(norm).filter(Boolean));
    const usuariosNorm = new Set((usuarios || []).map(norm).filter(Boolean));

    const matchSetor = hasSetorFilter && !!user.setor && setoresNorm.has(norm(user.setor));
    const matchGrupo = hasGrupoFilter && !!user.nmGrupo && gruposNorm.has(norm(user.nmGrupo));
    const matchUsuario = hasUsuarioFilter && usuariosNorm.has(norm(user.username));

    if (!matchSetor && !matchGrupo && !matchUsuario) return false;
  }

  // Restrição por unidade (só se aplica ao eixo Franquia)
  if (!isFranqueadora) {
    const unidades = modulo.franquiaUnidades || [];
    if (unidades.length > 0) {
      const userUnits = (user.unitNames || []).map(u => u.trim()).filter(Boolean);
      if (userUnits.length === 0) return false;
      const unidadesSet = new Set(unidades.map(u => u.toLowerCase().trim()));
      const matched = userUnits.some(u => unidadesSet.has(u.toLowerCase()));
      if (!matched) return false;
    }
  }
  return true;
}

// Tipo do módulo
export type TipoModulo = 'interno' | 'externo';

// Registro de módulo na planilha
export interface ModuloConfig {
  moduloId: string;
  moduloNome: string;
  moduloPath: string;
  // === Legado (mantido para não quebrar dados existentes) ===
  nvlAcesso: NivelAcessoModulo;
  usuariosPermitidos: string[];
  setoresPermitidos: string[];
  gruposPermitidos: string[];
  // === Novo modelo (2 eixos) ===
  acessoFranqueadora: AcessoEixo;
  franqueadoraSetores: string[];
  franqueadoraGrupos: string[];
  franqueadoraUsuarios: string[];
  acessoFranquia: AcessoEixo;
  franquiaSetores: string[];
  franquiaGrupos: string[];
  franquiaUsuarios: string[];
  /** Restrição de acesso por unidade/franquia (apenas eixo Franquia). Vazio = todas as unidades do eixo. */
  franquiaUnidades: string[];
  // === Comum ===
  usuariosExcecao: string[];
  ativo: boolean;
  grupo: string;
  ordem: number;
  icone: string;
  tipo: TipoModulo;
  urlExterna: string;
  subgrupo: string;
  beta: boolean;
}

// Dados brutos da planilha (linha como array)
export type ModuloRow = string[];

// Payload para criar/atualizar um módulo
export interface ModuloPayload extends Omit<ModuloConfig, 'nvlAcesso' | 'usuariosPermitidos' | 'setoresPermitidos' | 'gruposPermitidos'> {
  // payload usa o novo modelo; campos legados são opcionais
  nvlAcesso?: NivelAcessoModulo;
  usuariosPermitidos?: string[];
  setoresPermitidos?: string[];
  gruposPermitidos?: string[];
}

// Grupos de módulos para exibição
export interface GrupoModulo {
  id: string;
  name: string;
  modulos: ModuloConfig[];
}

// Resposta da API de dados
export interface ModulosDataResponse {
  modulos: ModuloConfig[];
  cached: boolean;
}

// Resposta da API de update
export interface ModuloUpdateResponse {
  success: boolean;
  message: string;
}
