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
 *   3. Se 'restrito': setores → grupos → usuários do eixo
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
  >,
  user: { username: string; accessLevel: number; setor?: string; nmGrupo?: string }
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
  // restrito:
  if (setores && setores.length > 0 && user.setor && !setores.includes(user.setor)) return false;
  if (grupos && grupos.length > 0 && user.nmGrupo && !grupos.includes(user.nmGrupo)) return false;
  if (usuarios && usuarios.length > 0 && !usuarios.includes(user.username)) return false;
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
