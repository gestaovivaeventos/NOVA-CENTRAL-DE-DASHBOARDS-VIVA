/**
 * Tipos do módulo Controle de Módulos
 */

// Nível de acesso ao módulo
// 0 = Rede (todos com acesso >= 0, ou seja, franqueados + franqueadora)
// 1 = Franqueadora (somente franqueadora, accessLevel >= 1)
export type NivelAcessoModulo = 0 | 1;

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
