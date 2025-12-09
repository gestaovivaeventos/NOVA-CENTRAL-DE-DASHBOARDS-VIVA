/**
 * Utilitários para filtrar dados baseado em permissões
 * Franqueados (0) veem apenas dados da sua unidade
 * Franqueadoras (1) veem dados de todas as unidades
 */

import type { UserPermissions } from '@/types/permissions.types';

// Tipo simplificado para permitir uso com dados parciais
type PermissionFilter = Pick<UserPermissions, 'accessLevel' | 'unitNames'>;

/**
 * Filtra dados baseado na unidade do usuário
 * Se franqueadora (1), retorna todos os dados
 * Se franqueado (0), retorna apenas dados das suas unidades
 */
export function filterDataByPermission<T extends { nm_unidade?: string; unidade?: string }>(
  data: T[],
  permissions: PermissionFilter
): T[] {
  // Franqueadora pode ver tudo
  if (permissions.accessLevel === 1) {
    return data;
  }

  // Franqueado vê apenas das suas unidades
  if (permissions.accessLevel === 0 && permissions.unitNames && permissions.unitNames.length > 0) {
    return data.filter(
      item => permissions.unitNames!.includes(item.nm_unidade || '') || 
               permissions.unitNames!.includes(item.unidade || '')
    );
  }

  return [];
}

/**
 * Filtra unidades disponíveis baseado na permissão
 * Se franqueadora (1), retorna todas as unidades
 * Se franqueado (0), retorna apenas as suas unidades
 */
export function getAvailableUnits(
  allUnits: string[],
  permissions: UserPermissions
): string[] {
  // Franqueadora pode ver todas as unidades
  if (permissions.accessLevel === 1) {
    return allUnits;
  }

  // Franqueado vê apenas as suas unidades
  if (permissions.accessLevel === 0 && permissions.unitNames && permissions.unitNames.length > 0) {
    return permissions.unitNames;
  }

  return [];
}

/**
 * Verifica se um usuário tem permissão para acessar um recurso específico
 */
export function hasAccessToUnit(
  unitName: string,
  permissions: UserPermissions
): boolean {
  // Franqueadora tem acesso a tudo
  if (permissions.accessLevel === 1) {
    return true;
  }

  // Franqueado tem acesso apenas às suas unidades
  if (permissions.accessLevel === 0 && permissions.unitNames && permissions.unitNames.length > 0) {
    return permissions.unitNames.includes(unitName);
  }

  return false;
}

/**
 * Retorna label de permissão para exibição
 */
export function getPermissionLabel(accessLevel: 0 | 1): string {
  return accessLevel === 1 ? 'Franqueadora' : 'Franqueado';
}
