/**
 * Tipos do módulo Controle de Usuários e Senhas
 */

// Registro de usuário combinado (aba principal + aba SENHAS)
export interface UsuarioRow {
  unidadePrincipal: string;
  unidade: string;
  nome: string;
  username: string;
  enabled: string;        // TRUE / FALSE
  nmGrupo: string;        // nm_grupo / cargo
  senhaHash: string;
  tokenResetAdmin: string;
  tokenPrimeiraSenha: string;
}

// Resposta da API
export interface UsuariosDataResponse {
  usuarios: UsuarioRow[];
  cached: boolean;
}

// Usuários autorizados (mesmos do branches)
export const AUTHORIZED_USERNAMES = ['cris', 'gabriel.braz', 'marcos.castro', 'theo.diniz'];
