/**
 * Tipos do módulo Controle de Módulos
 */

// Nível de acesso ao módulo
// 0 = Rede (todos com acesso >= 0, ou seja, franqueados + franqueadora)
// 1 = Franqueadora (somente franqueadora, accessLevel >= 1)
// 2 = Franquia (somente franquias, accessLevel === 0, exclui franqueadora)
export type NivelAcessoModulo = 0 | 1 | 2;

/**
 * Verifica se um userLevel tem acesso a um módulo com determinado nvlAcesso.
 * 0 (Rede): todos
 * 1 (Franqueadora): apenas accessLevel >= 1
 * 2 (Franquia): apenas accessLevel === 0
 */
export function hasNivelAccess(userLevel: number, nvlAcesso: number): boolean {
  if (nvlAcesso === 0) return true;               // Rede: todos
  if (nvlAcesso === 1) return userLevel >= 1;      // Franqueadora only
  if (nvlAcesso === 2) return userLevel === 0;     // Franquia only
  return false;
}

// Tipo do módulo
export type TipoModulo = 'interno' | 'externo';

// Registro de módulo na planilha
export interface ModuloConfig {
  moduloId: string;
  moduloNome: string;
  moduloPath: string;
  nvlAcesso: NivelAcessoModulo;
  usuariosPermitidos: string[]; // usernames; vazio = todos com o nível adequado
  ativo: boolean;
  grupo: string;
  ordem: number;
  icone: string;
  tipo: TipoModulo; // 'interno' = rota Next.js, 'externo' = link externo (Looker, Sheets, etc)
  urlExterna: string; // URL completa quando tipo = 'externo'
  subgrupo: string; // Nome do subgrupo dentro do grupo (vazio = sem subgrupo)
  setoresPermitidos: string[]; // setores; vazio = todos
  gruposPermitidos: string[]; // nm_grupo/cargo; vazio = todos (do setor selecionado)
  beta: boolean; // módulo em fase beta (exibe badge visual na sidebar/favoritos)
}

// Dados brutos da planilha (linha como array)
export type ModuloRow = string[];

// Payload para criar/atualizar um módulo
export interface ModuloPayload {
  moduloId: string;
  moduloNome: string;
  moduloPath: string;
  nvlAcesso: NivelAcessoModulo;
  usuariosPermitidos: string[];
  ativo: boolean;
  grupo: string;
  ordem: number;
  icone: string;
  tipo: TipoModulo;
  urlExterna: string;
  subgrupo: string;
  setoresPermitidos: string[];
  gruposPermitidos: string[];
  beta: boolean;
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
