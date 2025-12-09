/**
 * Tipos e Interfaces de Permissões
 * Define os níveis de acesso e permissões do sistema
 */

export type AccessLevel = 0 | 1;

// 0 = Franqueado (acesso restrito à sua unidade)
// 1 = Franqueadora (acesso a todas as unidades)

export interface UserPermissions {
  username: string;
  firstName: string;
  accessLevel: AccessLevel;
  unitNames?: string[]; // Unidades/Franquias do usuário (preenchida quando accessLevel = 0, pode ter múltiplas)
}

export interface PermissionContext {
  user: UserPermissions;
  isFranchisee: boolean; // accessLevel === 0
  isFranchiser: boolean; // accessLevel === 1
  canViewAllUnits: boolean; // accessLevel === 1
}
