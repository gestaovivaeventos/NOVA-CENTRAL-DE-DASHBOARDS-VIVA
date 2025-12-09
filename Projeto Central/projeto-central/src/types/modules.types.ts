// ============================================
// Tipos de Módulos - Projeto Central
// ============================================

import { AccessLevel } from './auth.types';
import { ComponentType } from 'react';

/**
 * Configuração de um módulo
 */
export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  component: ComponentType;
  requiredAccessLevel: AccessLevel;
  requiredModules?: string[];
  isEnabled: boolean;
  order: number;
}

/**
 * Registro de módulos disponíveis
 */
export interface ModuleRegistry {
  [key: string]: ModuleConfig;
}

/**
 * Item de navegação no sidebar
 */
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: NavItem[];
  badge?: string | number;
  isActive?: boolean;
}
