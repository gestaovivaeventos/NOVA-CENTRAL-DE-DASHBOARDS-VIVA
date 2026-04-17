/**
 * Página - Controle de Módulos
 * Layout sidebar + header (padrão Branches)
 * Click no card abre modal de edição com dropdowns
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { RefreshCw, AlertTriangle, ChevronDown, ChevronRight, Edit2, Plus, Pencil, Settings, BarChart, PieChart, TrendingUp, Database, Folder, Link, ExternalLink, Target, DollarSign, Clipboard, GitBranch, CheckCircle, Users, LayoutDashboard, FileSpreadsheet, Code2, FolderOpen, GripVertical, Search, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import { Header, Sidebar, EditModuloModal, AddExternalLinkModal, GerenciarGruposModal, EditGrupoModal, GerenciarSubgruposModal, EditSubgrupoModal } from '@/modules/controle-modulos/components';
import { useControleModulos } from '@/modules/controle-modulos/hooks';
import type { ModuloConfig } from '@/modules/controle-modulos/types';
import { hasNivelAccess } from '@/modules/controle-modulos/types';
import type { ExternalLinkData } from '@/modules/controle-modulos/components/AddExternalLinkModal';
import type { GrupoInfo } from '@/modules/controle-modulos/components/GerenciarGruposModal';
import type { SubgrupoInfo } from '@/modules/controle-modulos/components/GerenciarSubgruposModal';

// Mapeamento de nomes de ícone para componentes Lucide
const ICON_MAP: Record<string, React.ElementType> = {
  settings: Settings,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  database: Database,
  folder: Folder,
  link: Link,
  'external-link': ExternalLink,
  target: Target,
  'dollar-sign': DollarSign,
  money: DollarSign,
  clipboard: Clipboard,
  'git-branch': GitBranch,
  'code': Code2,
  'check-circle': CheckCircle,
  users: Users,
  'layout-dashboard': LayoutDashboard,
  dashboard: LayoutDashboard,
  'file-spreadsheet': FileSpreadsheet,
  chart: BarChart,
  trophy: Target,
  wallet: DollarSign,
  funnel: TrendingUp,
};

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function ControleModulosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { modulos: modulosFromHook, loading, error, refetch, updateModulo, createModulo } = useControleModulos();
  const [localModulos, setLocalModulos] = useState<ModuloConfig[]>([]);
  // Sync local state with hook data (only when not in the middle of a drag)
  const isDraggingRef = useRef(false);
  useEffect(() => {
    if (!isDraggingRef.current) setLocalModulos(modulosFromHook);
  }, [modulosFromHook]);
  // Use localModulos everywhere so optimistic updates work instantly
  const modulos = localModulos;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloConfig | null>(null);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [gruposModalOpen, setGruposModalOpen] = useState(false);
  const [editGrupoNome, setEditGrupoNome] = useState<string | null>(null);
  const [gruposDaPlanilha, setGruposDaPlanilha] = useState<GrupoInfo[]>([]);
  const [subgruposDaPlanilha, setSubgruposDaPlanilha] = useState<SubgrupoInfo[]>([]);
  const [subgruposModalOpen, setSubgruposModalOpen] = useState(false);
  const [editSubgrupoNome, setEditSubgrupoNome] = useState<string | null>(null);
  const [editSubgrupoGrupo, setEditSubgrupoGrupo] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubgrupos, setExpandedSubgrupos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Drag-and-drop state
  // 'grupo' = group-level drag, 'item' = module or subgroup within a group
  const dragRef = useRef<{
    type: 'grupo' | 'item';
    id: string;            // for grupo: grupo name; for item: "mod::moduloId" or "sg::sgName"
    parentGrupo?: string;  // only for item
  } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below'>('below');
  const [isDragging, setIsDragging] = useState(false);
  // Throttle ref: prevent redundant re-renders when hovering same target
  const lastDragOverKey = useRef<string>('');

  // Buscar grupos da planilha (com ícone)
  const fetchGruposCustomizados = useCallback(async () => {
    try {
      const res = await fetch('/api/controle-modulos/grupos?refresh=true');
      if (res.ok) {
        const data = await res.json();
        setGruposDaPlanilha(data.grupos || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchGruposCustomizados();
  }, [fetchGruposCustomizados]);

  // Buscar subgrupos da planilha
  const fetchSubgrupos = useCallback(async () => {
    try {
      const res = await fetch('/api/controle-modulos/subgrupos?refresh=true');
      if (res.ok) {
        const data = await res.json();
        setSubgruposDaPlanilha(data.subgrupos || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchSubgrupos();
  }, [fetchSubgrupos]);

  // Derivar autorização diretamente dos dados já carregados (single source of truth)
  const isAuthorized = useMemo(() => {
    if (!user || modulos.length === 0) return null; // ainda carregando
    const cm = modulos.find(m => m.moduloId === 'controle-modulos');
    if (!cm || !cm.ativo) return false;
    if (!hasNivelAccess(user.accessLevel ?? 0, cm.nvlAcesso)) return false;
    if (cm.usuariosPermitidos.length > 0 && !cm.usuariosPermitidos.includes(user.username)) return false;
    return true;
  }, [user, modulos]);

  // Redirecionar se não autenticado ou sem permissão
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && !loading && isAuthenticated && isAuthorized === false) {
      router.push('/');
    }
  }, [authLoading, loading, isAuthenticated, isAuthorized, router]);

  // Agrupar módulos por grupo
  const gruposMap = useMemo(() => {
    const map = new Map<string, ModuloConfig[]>();
    const sorted = [...modulos].sort((a, b) => a.ordem - b.ordem);
    sorted.forEach(m => {
      const g = m.grupo || 'Outros';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    });
    return map;
  }, [modulos]);

  // Filtered map based on search query
  const filteredGruposMap = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return gruposMap;

    const filtered = new Map<string, ModuloConfig[]>();
    for (const [grupo, mods] of gruposMap.entries()) {
      // Check if group name matches
      const grupoMatches = grupo.toLowerCase().includes(q);
      if (grupoMatches) {
        // Show entire group
        filtered.set(grupo, mods);
        continue;
      }
      // Filter modules: match by name, path, subgrupo
      const matchedMods = mods.filter(m => {
        const sub = (m.subgrupo || '').toLowerCase();
        return m.moduloNome.toLowerCase().includes(q)
          || m.moduloPath.toLowerCase().includes(q)
          || m.moduloId.toLowerCase().includes(q)
          || sub.includes(q);
      });
      if (matchedMods.length > 0) {
        filtered.set(grupo, matchedMods);
      }
    }
    return filtered;
  }, [gruposMap, searchQuery]);

  // Expandir todos os grupos quando carregar pela primeira vez
  useEffect(() => {
    if (gruposMap.size > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(gruposMap.keys()));
    }
  }, [gruposMap]);

  // Expandir todos os subgrupos quando carregar pela primeira vez
  useEffect(() => {
    if (subgruposDaPlanilha.length > 0 && expandedSubgrupos.size === 0) {
      const keys = subgruposDaPlanilha.map(sg => `${sg.grupo}::${sg.nome}`);
      // incluir subgrupos órfãos (módulos com subgrupo não registrado)
      modulos.forEach(m => {
        if (m.subgrupo) {
          const k = `${m.grupo || 'Outros'}::${m.subgrupo}`;
          if (!keys.includes(k)) keys.push(k);
        }
      });
      setExpandedSubgrupos(new Set(keys));
    }
  }, [subgruposDaPlanilha, modulos]);

  const toggleGroup = useCallback((grupo: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(grupo)) next.delete(grupo);
      else next.add(grupo);
      return next;
    });
  }, []);

  const handleSaveField = useCallback(async (moduloId: string, field: string, value: string) => {
    const ok = await updateModulo(moduloId, field, value);
    return ok;
  }, [updateModulo]);

  // Salvar grupo via EditGrupoModal (PUT na API + renomear módulos se necessário)
  const handleSaveGrupo = useCallback(async (
    grupoOriginal: string,
    updates: { nome?: string; icone?: string; ordem?: number; ativo?: boolean }
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/controle-modulos/grupos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupo: grupoOriginal, ...updates }),
      });
      if (!res.ok) return false;

      // Se renomeou, atualizar grupo expandido
      if (updates.nome && updates.nome !== grupoOriginal) {
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          next.delete(grupoOriginal);
          next.add(updates.nome!);
          return next;
        });
      }

      // Atualizar dados locais (o cascade no servidor já atualizou BASE MODULOS e SUBGRUPOS)
      await fetchGruposCustomizados();
      await fetchSubgrupos();
      await refetch();
      return true;
    } catch {
      return false;
    }
  }, [fetchGruposCustomizados, fetchSubgrupos, refetch]);

  const handleCreateExternalLink = useCallback(async (data: ExternalLinkData) => {
    const ok = await createModulo(data);
    return ok;
  }, [createModulo]);

  // Lista de nomes de grupos existentes (módulos + planilha GRUPOS)
  const gruposExistentes = useMemo(() => {
    const nomesDaPlanilha = gruposDaPlanilha.map(g => g.nome);
    return Array.from(new Set([...modulos.map(m => m.grupo).filter(Boolean), ...nomesDaPlanilha]));
  }, [modulos, gruposDaPlanilha]);

  // Mapa de ícone por grupo (planilha é a fonte)
  const grupoIconeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of gruposDaPlanilha) {
      map.set(g.nome, g.icone);
    }
    return map;
  }, [gruposDaPlanilha]);

  // Subgrupos formatados para os dropdowns de módulos
  const subgruposExistentes = useMemo(() => {
    return subgruposDaPlanilha.filter(s => s.ativo).map(s => ({ nome: s.nome, grupo: s.grupo }));
  }, [subgruposDaPlanilha]);

  // Salvar subgrupo via EditSubgrupoModal
  const handleSaveSubgrupo = useCallback(async (
    subgrupoOriginal: string,
    grupoPaiOriginal: string,
    updates: { nome?: string; novoGrupo?: string; icone?: string; ordem?: number; ativo?: boolean }
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/controle-modulos/subgrupos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subgrupo: subgrupoOriginal, grupo: grupoPaiOriginal, ...updates }),
      });
      if (!res.ok) return false;

      // Se renomeou, atualizar subgrupo em todos os módulos que o usam
      if (updates.nome && updates.nome !== subgrupoOriginal) {
        const modsInSubgrupo = modulos.filter(m => (m as any).subgrupo === subgrupoOriginal && m.grupo.toLowerCase() === grupoPaiOriginal.toLowerCase());
        for (const mod of modsInSubgrupo) {
          await updateModulo(mod.moduloId, 'subgrupo', updates.nome);
        }
      }

      await fetchSubgrupos();
      await refetch();
      return true;
    } catch {
      return false;
    }
  }, [modulos, updateModulo, fetchSubgrupos, refetch]);

  // ====== Drag and drop handlers ======
  const handleDragStart = useCallback((
    e: React.DragEvent,
    type: 'grupo' | 'item',
    id: string,
    parentGrupo?: string,
  ) => {
    dragRef.current = { type, id, parentGrupo };
    isDraggingRef.current = true;
    setIsDragging(true);
    lastDragOverKey.current = '';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${type}::${id}`);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    dragRef.current = null;
    isDraggingRef.current = false;
    setDragOverId(null);
    setIsDragging(false);
    lastDragOverKey.current = '';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOverGrupo = useCallback((e: React.DragEvent, targetGrupo: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || dragRef.current.type !== 'grupo') return;
    if (dragRef.current.id === targetGrupo) { setDragOverId(null); return; }
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';
    // Throttle: skip if same target+position
    const key = `grupo::${targetGrupo}::${pos}`;
    if (lastDragOverKey.current === key) return;
    lastDragOverKey.current = key;
    setDragOverPosition(pos);
    setDragOverId(`grupo::${targetGrupo}`);
  }, []);

  const handleDragOverItem = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || dragRef.current.type !== 'item') return;
    if (dragRef.current.id === itemId) { setDragOverId(null); return; }
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';
    // Throttle: skip if same target+position
    const key = `item::${itemId}::${pos}`;
    if (lastDragOverKey.current === key) return;
    lastDragOverKey.current = key;
    setDragOverPosition(pos);
    setDragOverId(`item::${itemId}`);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    setDragOverId(null);
    lastDragOverKey.current = '';
  }, []);

  const handleDropGrupo = useCallback(async (
    e: React.DragEvent,
    targetGrupo: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || dragRef.current.type !== 'grupo') return;
    const sourceGrupo = dragRef.current.id;
    if (sourceGrupo === targetGrupo) return;

    const orderedGrupos = Array.from(gruposMap.keys()).sort((a, b) => {
      const ordemA = gruposDaPlanilha.find(g => g.nome === a)?.ordem ?? 99;
      const ordemB = gruposDaPlanilha.find(g => g.nome === b)?.ordem ?? 99;
      return ordemA - ordemB;
    });

    const fromIdx = orderedGrupos.indexOf(sourceGrupo);
    if (fromIdx === -1 || !orderedGrupos.includes(targetGrupo)) return;

    const reordered = [...orderedGrupos];
    reordered.splice(fromIdx, 1);
    const insertAt = dragOverPosition === 'above'
      ? reordered.indexOf(targetGrupo)
      : reordered.indexOf(targetGrupo) + 1;
    reordered.splice(insertAt, 0, sourceGrupo);

    const items = reordered.map((nome, idx) => ({ id: nome, ordem: idx + 1 }));

    setGruposDaPlanilha(prev => prev.map(g => {
      const newItem = items.find(i => i.id.toLowerCase() === g.nome.toLowerCase());
      return newItem ? { ...g, ordem: newItem.ordem } : g;
    }));

    setDragOverId(null);
    dragRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    lastDragOverKey.current = '';

    try {
      await fetch('/api/controle-modulos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'grupo', items }),
      });
      await fetchGruposCustomizados();
    } catch { /* silently fail */ }
  }, [gruposMap, gruposDaPlanilha, dragOverPosition, fetchGruposCustomizados]);

  // Unified drop handler for modules & subgroups within a group
  const handleDropItem = useCallback(async (
    e: React.DragEvent,
    targetItemId: string, // "mod::xxx" or "sg::xxx"
    parentGrupo: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || dragRef.current.type !== 'item') return;
    const sourceItemId = dragRef.current.id;
    if (sourceItemId === targetItemId) return;
    if (dragRef.current.parentGrupo !== parentGrupo) return;

    // Build unified ordered list of items in this group
    const groupMods = modulos.filter(m => (m.grupo || 'Outros') === parentGrupo);
    const modsSemSubgrupo = groupMods.filter(m => !(m as any).subgrupo);
    const modsComSubgrupo = new Map<string, ModuloConfig[]>();
    for (const m of groupMods) {
      const sub = (m as any).subgrupo || '';
      if (sub) {
        if (!modsComSubgrupo.has(sub)) modsComSubgrupo.set(sub, []);
        modsComSubgrupo.get(sub)!.push(m);
      }
    }

    const subgruposDoGrupo = subgruposDaPlanilha
      .filter(s => s.grupo.toLowerCase() === parentGrupo.toLowerCase())
      .sort((a, b) => a.ordem - b.ordem);

    type UnifiedItem = { itemId: string; ordem: number };
    const unifiedItems: UnifiedItem[] = [];

    for (const mod of modsSemSubgrupo) {
      unifiedItems.push({ itemId: `mod::${mod.moduloId}`, ordem: mod.ordem });
    }
    for (const sg of subgruposDoGrupo) {
      if (modsComSubgrupo.has(sg.nome)) {
        unifiedItems.push({ itemId: `sg::${sg.nome}`, ordem: sg.ordem });
      }
    }
    // Orphan subgroups
    for (const [sgName] of modsComSubgrupo.entries()) {
      if (!subgruposDoGrupo.some(s => s.nome === sgName)) {
        unifiedItems.push({ itemId: `sg::${sgName}`, ordem: 99 });
      }
    }

    unifiedItems.sort((a, b) => a.ordem - b.ordem);

    const fromIdx = unifiedItems.findIndex(i => i.itemId === sourceItemId);
    const toIdx = unifiedItems.findIndex(i => i.itemId === targetItemId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...unifiedItems];
    const [removed] = reordered.splice(fromIdx, 1);
    const insertAt = dragOverPosition === 'above'
      ? reordered.findIndex(i => i.itemId === targetItemId)
      : reordered.findIndex(i => i.itemId === targetItemId) + 1;
    reordered.splice(insertAt, 0, removed);

    // Assign new ordem
    const newOrders = reordered.map((item, idx) => ({ ...item, ordem: idx + 1 }));

    // Split into module and subgrupo updates
    const moduloUpdates: { id: string; ordem: number }[] = [];
    const subgrupoUpdates: { id: string; grupo: string; ordem: number }[] = [];

    for (const item of newOrders) {
      if (item.itemId.startsWith('mod::')) {
        moduloUpdates.push({ id: item.itemId.slice(5), ordem: item.ordem });
      } else if (item.itemId.startsWith('sg::')) {
        subgrupoUpdates.push({ id: item.itemId.slice(4), grupo: parentGrupo, ordem: item.ordem });
      }
    }

    // Optimistic update for subgroups
    if (subgrupoUpdates.length > 0) {
      setSubgruposDaPlanilha(prev => prev.map(sg => {
        const upd = subgrupoUpdates.find(u => u.id.toLowerCase() === sg.nome.toLowerCase() && u.grupo.toLowerCase() === sg.grupo.toLowerCase());
        return upd ? { ...sg, ordem: upd.ordem } : sg;
      }));
    }
    // Optimistic update for modules
    if (moduloUpdates.length > 0) {
      setLocalModulos(prev => prev.map(m => {
        const upd = moduloUpdates.find(u => u.id === m.moduloId);
        return upd ? { ...m, ordem: upd.ordem } : m;
      }));
    }

    setDragOverId(null);
    dragRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    lastDragOverKey.current = '';

    try {
      const promises: Promise<any>[] = [];
      if (moduloUpdates.length > 0) {
        promises.push(fetch('/api/controle-modulos/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'modulo', items: moduloUpdates }),
        }));
      }
      if (subgrupoUpdates.length > 0) {
        promises.push(fetch('/api/controle-modulos/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'subgrupo', items: subgrupoUpdates }),
        }));
      }
      await Promise.all(promises);
      await Promise.all([refetch(), fetchSubgrupos()]);
    } catch { /* silently fail */ }
  }, [modulos, subgruposDaPlanilha, dragOverPosition, refetch, fetchSubgrupos]);

  // Drop handler for modules INSIDE a subgroup (reorder among siblings)
  const handleDropModuloInsideSg = useCallback(async (
    e: React.DragEvent,
    targetModuloId: string,
    parentGrupo: string,
    parentSubgrupo: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRef.current || dragRef.current.type !== 'item') return;
    const sourceId = dragRef.current.id;
    if (!sourceId.startsWith('mod::')) return;
    const sourceModuloId = sourceId.slice(5);
    if (sourceModuloId === targetModuloId) return;

    const scopeMods = modulos
      .filter(m => {
        const mGrupo = m.grupo || 'Outros';
        const mSub = (m as any).subgrupo || '';
        return mGrupo === parentGrupo && mSub === parentSubgrupo;
      })
      .sort((a, b) => a.ordem - b.ordem);

    const fromIdx = scopeMods.findIndex(m => m.moduloId === sourceModuloId);
    const toIdx = scopeMods.findIndex(m => m.moduloId === targetModuloId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...scopeMods];
    const [removed] = reordered.splice(fromIdx, 1);
    const insertAt = dragOverPosition === 'above'
      ? reordered.findIndex(m => m.moduloId === targetModuloId)
      : reordered.findIndex(m => m.moduloId === targetModuloId) + 1;
    reordered.splice(insertAt, 0, removed);

    const items = reordered.map((m, idx) => ({ id: m.moduloId, ordem: idx + 1 }));

    // Optimistic update for modules
    setLocalModulos(prev => prev.map(m => {
      const upd = items.find(i => i.id === m.moduloId);
      return upd ? { ...m, ordem: upd.ordem } : m;
    }));

    setDragOverId(null);
    dragRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    lastDragOverKey.current = '';

    try {
      await fetch('/api/controle-modulos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'modulo', items }),
      });
      await refetch();
    } catch { /* silently fail */ }
  }, [modulos, dragOverPosition, refetch]);

  // ====== Exportar para Excel ======
  const handleExportExcel = useCallback(() => {
    // Ordenar módulos por grupo > subgrupo > ordem
    const sorted = [...modulos].sort((a, b) => {
      const gA = (a.grupo || 'Outros').toLowerCase();
      const gB = (b.grupo || 'Outros').toLowerCase();
      if (gA !== gB) return gA.localeCompare(gB);
      const sA = (a.subgrupo || '').toLowerCase();
      const sB = (b.subgrupo || '').toLowerCase();
      if (sA !== sB) return sA.localeCompare(sB);
      return a.ordem - b.ordem;
    });

    const rows = sorted.map(m => ({
      'Grupo': m.grupo || 'Outros',
      'Subgrupo': m.subgrupo || '',
      'Módulo': m.moduloNome,
      'Tipo': m.tipo === 'externo' ? 'Externo' : 'Interno',
      'Link / Caminho': m.tipo === 'externo' ? m.urlExterna : m.moduloPath,
      'Ativo': m.ativo ? 'Sim' : 'Não',
      'Nível de Acesso': m.nvlAcesso === 0 ? 'Rede (todos)' : m.nvlAcesso === 2 ? 'Franquia' : 'Franqueadora',
      'Usuários com Acesso': m.usuariosPermitidos.length > 0 ? m.usuariosPermitidos.join(', ') : 'Todos (pelo nível)',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 20 }, // Grupo
      { wch: 18 }, // Subgrupo
      { wch: 30 }, // Módulo
      { wch: 10 }, // Tipo
      { wch: 50 }, // Link / Caminho
      { wch: 8 },  // Ativo
      { wch: 18 }, // Nível de Acesso
      { wch: 40 }, // Usuários com Acesso
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Módulos');
    XLSX.writeFile(wb, `Controle_Modulos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [modulos]);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  // Loading (auth OU dados dos módulos OU autorização ainda não determinada)
  if (authLoading || loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4" style={{ color: '#6c757d' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <div className="text-center">
          <AlertTriangle size={48} color="#f59e0b" className="mx-auto mb-4" />
          <h2 style={{ color: '#F8F9FA', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            Acesso Restrito
          </h2>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Você não tem permissão para acessar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Controle de Módulos - Central Viva</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />

      <div
        className="min-h-screen transition-all duration-300"
        style={{
          backgroundColor: '#212529',
          marginLeft: `${sidebarWidth}px`,
        }}
      >
        {/* Header */}
        <Header />

        {/* Barra de ações */}
        <div
          className="px-4 mb-4 flex items-center justify-between"
          style={{ marginTop: '-8px' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ color: '#9ca3af', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem' }}>
              {modulos.length} módulos configurados
            </span>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
              style={{ fontFamily: 'Poppins, sans-serif' }}
              title="Exportar módulos para Excel"
            >
              <Download size={16} />
              Exportar
            </button>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span style={{ color: '#dc3545', fontSize: '0.75rem', maxWidth: '300px', textAlign: 'right' }}>
                {error}
              </span>
            )}
            <button
              onClick={() => setGruposModalOpen(true)}
              style={{
                backgroundColor: 'rgba(255,102,0,0.10)',
                border: '1px solid #FF6600',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#FF6600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
              title="Gerenciar grupos"
            >
              <Plus size={16} />
              Grupos
            </button>
            <button
              onClick={() => setSubgruposModalOpen(true)}
              style={{
                backgroundColor: 'rgba(16,185,129,0.10)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
              title="Gerenciar subgrupos"
            >
              <FolderOpen size={16} />
              Subgrupos
            </button>
            <button
              onClick={() => setAddLinkOpen(true)}
              style={{
                backgroundColor: 'rgba(139,92,246,0.15)',
                border: '1px solid #8b5cf6',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#8b5cf6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
              title="Adicionar link externo"
            >
              <Plus size={16} />
              Link Externo
            </button>
            <button
              onClick={() => refetch(true)}
              disabled={loading}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#ADB5BD',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
              }}
              title="Atualizar dados"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 pb-8">
          {loading && modulos.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4" style={{ color: '#6c757d', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem' }}>
                  Carregando módulos...
                </p>
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #333' }}>
              {/* Search bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                backgroundColor: '#1a1d21',
                borderBottom: '1px solid #333',
              }}>
                <Search size={16} color="#6c757d" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar módulos, grupos ou subgrupos..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#F8F9FA',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.82rem',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6c757d',
                    }}
                    title="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 2fr 2fr 80px 120px 90px 140px 70px 50px',
                  gap: 0,
                  backgroundColor: '#1a1d21',
                  padding: '10px 16px',
                  borderBottom: '1px solid #333',
                }}
              >
                {['', 'Módulo', 'Path', 'Tipo', 'Nível', 'Status', 'Usuários', 'Ordem', ''].map((col, i) => (
                  <span
                    key={`${col}-${i}`}
                    style={{
                      color: '#6c757d',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {col}
                  </span>
                ))}
              </div>

              {/* Groups */}
              {Array.from(filteredGruposMap.entries())
                .sort(([a], [b]) => {
                  const ordemA = gruposDaPlanilha.find(g => g.nome === a)?.ordem ?? 99;
                  const ordemB = gruposDaPlanilha.find(g => g.nome === b)?.ordem ?? 99;
                  return ordemA - ordemB;
                })
                .map(([grupo, mods]) => {
                const isExpanded = expandedGroups.has(grupo);
                const grupoInfo = gruposDaPlanilha.find(g => g.nome === grupo);
                const isInativo = grupoInfo && !grupoInfo.ativo;
                return (
                  <div key={grupo}>
                    {/* Group header row */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'grupo', grupo)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOverGrupo(e, grupo)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDropGrupo(e, grupo)}
                      onClick={() => toggleGroup(grupo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        backgroundColor: dragOverId === `grupo::${grupo}` ? 'rgba(255,102,0,0.06)' : '#262a30',
                        borderBottom: '1px solid #333',
                        boxShadow: dragOverId === `grupo::${grupo}` && dragOverPosition === 'above'
                          ? 'inset 0 3px 0 0 #FF6600'
                          : dragOverId === `grupo::${grupo}` && dragOverPosition === 'below'
                            ? 'inset 0 -3px 0 0 #FF6600'
                            : 'none',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.15s',
                        opacity: isInativo ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2d3239'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#262a30'; }}
                    >
                      <span
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#4b5563', flexShrink: 0 }}
                        title="Arrastar para reordenar"
                      >
                        <GripVertical size={16} />
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={16} color="#FF6600" />
                      ) : (
                        <ChevronRight size={16} color="#FF6600" />
                      )}
                      {(() => {
                        const IconComp = ICON_MAP[grupoIconeMap.get(grupo) || 'settings'] || Settings;
                        return <IconComp size={14} color="#FF6600" />;
                      })()}

                      <span
                        style={{
                          color: '#F8F9FA',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {grupo}
                      </span>
                      <span
                        style={{
                          color: '#6c757d',
                          fontSize: '0.72rem',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        ({mods.length})
                      </span>

                      {grupoInfo && (
                        <span
                          style={{
                            color: '#FF6600',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            backgroundColor: 'rgba(255,102,0,0.1)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid rgba(255,102,0,0.2)',
                          }}
                          title="Posição na sidebar"
                        >
                          Sidebar #{grupoInfo.ordem}
                        </span>
                      )}

                      {isInativo && (
                        <span
                          style={{
                            color: '#ef4444',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid rgba(239,68,68,0.3)',
                          }}
                        >
                          INATIVO
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditGrupoNome(grupo);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0.5,
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                        title="Editar grupo"
                      >
                        <Pencil size={13} color="#FF6600" />
                      </button>
                    </div>

                    {/* Module rows (organized by subgroups, interleaved by ordem) */}
                    {isExpanded && (() => {
                      // Separar módulos por subgrupo
                      const modsComSubgrupo = new Map<string, ModuloConfig[]>();
                      const modsSemSubgrupo: ModuloConfig[] = [];
                      
                      for (const mod of mods) {
                        const sub = (mod as any).subgrupo || '';
                        if (sub) {
                          if (!modsComSubgrupo.has(sub)) modsComSubgrupo.set(sub, []);
                          modsComSubgrupo.get(sub)!.push(mod);
                        } else {
                          modsSemSubgrupo.push(mod);
                        }
                      }

                      // Subgrupos cadastrados para este grupo
                      const subgruposDoGrupo = subgruposDaPlanilha
                        .filter(s => s.grupo.toLowerCase() === grupo.toLowerCase())
                        .sort((a, b) => a.ordem - b.ordem);

                      // Construir lista intercalada: items = módulos avulsos + subgrupos, ordenados por ordem
                      type RenderItem =
                        | { type: 'mod'; mod: ModuloConfig; ordem: number }
                        | { type: 'subgrupo'; sg: SubgrupoInfo; mods: ModuloConfig[]; ordem: number }
                        | { type: 'orphan-sg'; nome: string; mods: ModuloConfig[]; ordem: number };

                      const renderItems: RenderItem[] = [];

                      // Módulos sem subgrupo: cada um é um item com sua própria ordem
                      for (const mod of modsSemSubgrupo) {
                        renderItems.push({ type: 'mod', mod, ordem: mod.ordem });
                      }

                      // Subgrupos cadastrados que têm módulos
                      for (const sg of subgruposDoGrupo) {
                        const sgMods = modsComSubgrupo.get(sg.nome);
                        if (sgMods && sgMods.length > 0) {
                          renderItems.push({ type: 'subgrupo', sg, mods: sgMods, ordem: sg.ordem });
                        }
                      }

                      // Subgrupos órfãos (referenciados por módulos mas não cadastrados)
                      for (const [sgName, sgMods] of modsComSubgrupo.entries()) {
                        if (!subgruposDoGrupo.some(sg => sg.nome === sgName)) {
                          renderItems.push({ type: 'orphan-sg', nome: sgName, mods: sgMods, ordem: 99 });
                        }
                      }

                      // Ordenar tudo por ordem
                      renderItems.sort((a, b) => a.ordem - b.ordem);

                      const renderModRow = (mod: ModuloConfig, insideSubgrupo = false, parentSubgrupoName = '') => {
                        const nivelColor = mod.nvlAcesso === 0 ? '#10b981' : mod.nvlAcesso === 2 ? '#3b82f6' : '#f59e0b';
                        const nivelLabel = mod.nvlAcesso === 0 ? 'Rede' : mod.nvlAcesso === 2 ? 'Franquia' : 'Franqueadora';
                        const hasUsers = mod.usuariosPermitidos.length > 0;
                        const bgColor = insideSubgrupo ? '#1b2228' : '#212529';
                        const bgHover = insideSubgrupo ? '#232d34' : '#2d3239';
                        const itemDragId = `mod::${mod.moduloId}`;
                        const isDropTarget = dragOverId === `item::${itemDragId}`;

                      return (
                        <div
                          key={mod.moduloId}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, 'item', itemDragId, grupo);
                          }}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => {
                            e.stopPropagation();
                            // When dragging a subgroup over modules inside another subgroup,
                            // delegate the indicator to the parent subgroup header
                            if (insideSubgrupo && dragRef.current?.id?.startsWith('sg::')) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const midY = rect.top + rect.height / 2;
                              setDragOverPosition(e.clientY < midY ? 'above' : 'below');
                              setDragOverId(`item::sg::${parentSubgrupoName}`);
                              return;
                            }
                            handleDragOverItem(e, itemDragId);
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => {
                            // When dragging a subgroup onto modules inside another subgroup,
                            // delegate the drop to the parent subgroup
                            if (insideSubgrupo && dragRef.current?.id?.startsWith('sg::')) {
                              handleDropItem(e, `sg::${parentSubgrupoName}`, grupo);
                              return;
                            }
                            if (insideSubgrupo) {
                              handleDropModuloInsideSg(e, mod.moduloId, grupo, parentSubgrupoName);
                            } else {
                              handleDropItem(e, itemDragId, grupo);
                            }
                          }}
                          onClick={() => setEditingModulo(mod)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '30px 2fr 2fr 80px 120px 90px 140px 70px 50px',
                            gap: 0,
                            padding: insideSubgrupo ? '10px 16px 10px 40px' : '10px 16px',
                            backgroundColor: isDropTarget ? 'rgba(255,102,0,0.06)' : bgColor,
                            borderBottom: '1px solid #2a2e33',
                            boxShadow: isDropTarget && dragOverPosition === 'above'
                              ? 'inset 0 3px 0 0 #FF6600'
                              : isDropTarget && dragOverPosition === 'below'
                                ? 'inset 0 -3px 0 0 #FF6600'
                                : 'none',
                            borderLeft: insideSubgrupo ? '3px solid rgba(16,185,129,0.25)' : 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                            opacity: mod.ativo ? 1 : 0.5,
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgHover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bgColor; }}
                        >
                          {/* Drag handle */}
                          <span
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#4b5563' }}
                            title="Arrastar para reordenar"
                          >
                            <GripVertical size={14} />
                          </span>
                          {/* Nome */}
                          <span
                            style={{
                              color: '#F8F9FA',
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {mod.moduloNome}
                            {(mod as any).beta && (
                              <span title="Versão beta em validação interna" style={{
                                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                color: '#fff',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: '0.5rem',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                lineHeight: 1.4,
                                flexShrink: 0,
                                cursor: 'default',
                              }}>BETA</span>
                            )}
                          </span>

                          {/* Path */}
                          <span
                            style={{
                              color: '#6c757d',
                              fontSize: '0.75rem',
                              fontFamily: "'Fira Code', monospace",
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {mod.moduloPath}
                          </span>

                          {/* Tipo */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              fontFamily: 'Poppins, sans-serif',
                              color: (mod as any).tipo === 'externo' ? '#8b5cf6' : '#6c757d',
                              backgroundColor: (mod as any).tipo === 'externo' ? 'rgba(139,92,246,0.1)' : 'rgba(107,114,128,0.1)',
                              padding: '2px 6px',
                              borderRadius: 6,
                              width: 'fit-content',
                            }}
                          >
                            {(mod as any).tipo === 'externo' ? '↗ Externo' : 'Interno'}
                          </span>

                          {/* Nível */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              fontFamily: 'Poppins, sans-serif',
                              color: nivelColor,
                              backgroundColor: `${nivelColor}15`,
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: `1px solid ${nivelColor}30`,
                              width: 'fit-content',
                            }}
                          >
                            {mod.nvlAcesso} — {nivelLabel}
                          </span>

                          {/* Status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: mod.ativo ? '#10b981' : '#ef4444',
                              }}
                            />
                            <span
                              style={{
                                color: mod.ativo ? '#10b981' : '#ef4444',
                                fontSize: '0.72rem',
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 500,
                              }}
                            >
                              {mod.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          {/* Usuários */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              fontFamily: 'Poppins, sans-serif',
                              color: hasUsers ? '#3b82f6' : '#6c757d',
                              backgroundColor: hasUsers ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)',
                              padding: '2px 8px',
                              borderRadius: 6,
                              width: 'fit-content',
                            }}
                          >
                            {hasUsers ? `${mod.usuariosPermitidos.length} usuários` : 'Todos'}
                          </span>

                          {/* Ordem */}
                          <span
                            style={{
                              color: '#6c757d',
                              fontSize: '0.72rem',
                              fontFamily: 'Poppins, sans-serif',
                            }}
                          >
                            #{mod.ordem}
                          </span>

                          {/* Edit icon */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Edit2 size={14} color="#6c757d" />
                          </div>
                        </div>
                      );
                      };

                      const toggleSubgrupo = (grupoName: string, sgNome: string) => {
                        const key = `${grupoName}::${sgNome}`;
                        setExpandedSubgrupos(prev => {
                          const next = new Set(prev);
                          if (next.has(key)) next.delete(key); else next.add(key);
                          return next;
                        });
                      };

                      const renderSubgrupoHeader = (nome: string, count: number, ordem: number, registered: boolean, grupoName: string) => {
                        const sgKey = `${grupoName}::${nome}`;
                        const isSgExpanded = expandedSubgrupos.has(sgKey);
                        const accentColor = registered ? '#10b981' : '#6c757d';
                        const itemDragId = `sg::${nome}`;
                        const isDropTarget = dragOverId === `item::${itemDragId}`;

                        return (
                        <div
                          key={`sg-header-${grupoName}-${nome}`}
                          draggable={registered}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, 'item', itemDragId, grupoName);
                          }}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => {
                            e.stopPropagation();
                            handleDragOverItem(e, itemDragId);
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDropItem(e, itemDragId, grupoName)}
                          onClick={() => toggleSubgrupo(grupoName, nome)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 16px 7px 24px',
                            backgroundColor: isDropTarget ? 'rgba(16,185,129,0.06)' : (isSgExpanded ? '#1a1e23' : '#1e2227'),
                            borderBottom: '1px solid #2a2e33',
                            boxShadow: isDropTarget && dragOverPosition === 'above'
                              ? 'inset 0 3px 0 0 #10b981'
                              : isDropTarget && dragOverPosition === 'below'
                                ? 'inset 0 -3px 0 0 #10b981'
                                : 'none',
                            borderLeft: `3px solid ${accentColor}`,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#252a30'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSgExpanded ? '#1a1e23' : '#1e2227'; }}
                        >
                          {registered && (
                            <span
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#4b5563', flexShrink: 0 }}
                              title="Arrastar para reordenar"
                            >
                              <GripVertical size={13} />
                            </span>
                          )}
                          {isSgExpanded
                            ? <ChevronDown size={13} color={accentColor} />
                            : <ChevronRight size={13} color={accentColor} />
                          }
                          <FolderOpen size={12} color={accentColor} />
                          <span
                            style={{
                              color: accentColor,
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 600,
                              fontSize: '0.72rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {nome}
                          </span>
                          <span style={{ color: '#6c757d', fontSize: '0.65rem', fontFamily: 'Poppins, sans-serif' }}>
                            ({count})
                          </span>
                          <span
                            style={{
                              color: '#6c757d',
                              fontSize: '0.55rem',
                              fontFamily: 'Poppins, sans-serif',
                              backgroundColor: 'rgba(107,114,128,0.1)',
                              padding: '1px 4px',
                              borderRadius: 3,
                            }}
                          >
                            #{ordem}
                          </span>
                          {!registered && (
                            <span style={{ color: '#555', fontSize: '0.55rem' }}>(não registrado)</span>
                          )}
                          {registered && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditSubgrupoNome(nome);
                                setEditSubgrupoGrupo(grupoName);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.5,
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                              title="Editar subgrupo"
                            >
                              <Pencil size={11} color="#10b981" />
                            </button>
                          )}
                        </div>
                        );
                      };

                      return (
                        <>
                          {renderItems.map((item) => {
                            if (item.type === 'mod') {
                              return renderModRow(item.mod, false, '');
                            }
                            if (item.type === 'subgrupo') {
                              const sgKey = `${grupo}::${item.sg.nome}`;
                              return (
                                <React.Fragment key={`sg-${grupo}-${item.sg.nome}`}>
                                  {renderSubgrupoHeader(item.sg.nome, item.mods.length, item.sg.ordem, true, grupo)}
                                  {expandedSubgrupos.has(sgKey) && item.mods.map(m => renderModRow(m, true, item.sg.nome))}
                                </React.Fragment>
                              );
                            }
                            // orphan-sg
                            const orphanKey = `${grupo}::${item.nome}`;
                            return (
                              <React.Fragment key={`sg-orphan-${grupo}-${item.nome}`}>
                                {renderSubgrupoHeader(item.nome, item.mods.length, 99, false, grupo)}
                                {expandedSubgrupos.has(orphanKey) && item.mods.map(m => renderModRow(m, true, item.nome))}
                              </React.Fragment>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal de edição */}
      <EditModuloModal
        isOpen={!!editingModulo}
        onClose={() => setEditingModulo(null)}
        modulo={editingModulo}
        onSave={handleSaveField}
        gruposExistentes={gruposExistentes}
        subgruposExistentes={subgruposExistentes}
      />

      {/* Modal de novo link externo */}
      <AddExternalLinkModal
        isOpen={addLinkOpen}
        onClose={() => setAddLinkOpen(false)}
        onSave={handleCreateExternalLink}
        gruposExistentes={gruposExistentes}
        subgruposExistentes={subgruposExistentes}
      />

      {/* Modal de gerenciar grupos */}
      <GerenciarGruposModal
        isOpen={gruposModalOpen}
        onClose={() => setGruposModalOpen(false)}
        gruposEmUso={Array.from(new Set(modulos.map(m => m.grupo).filter(Boolean)))}
        onGruposChanged={fetchGruposCustomizados}
      />

      {/* Modal de editar grupo */}
      <EditGrupoModal
        isOpen={!!editGrupoNome}
        onClose={() => setEditGrupoNome(null)}
        grupoNome={editGrupoNome}
        gruposDaPlanilha={gruposDaPlanilha}
        onSave={handleSaveGrupo}
      />

      {/* Modal de gerenciar subgrupos */}
      <GerenciarSubgruposModal
        isOpen={subgruposModalOpen}
        onClose={() => setSubgruposModalOpen(false)}
        gruposExistentes={gruposExistentes}
        onSubgruposChanged={fetchSubgrupos}
      />

      {/* Modal de editar subgrupo */}
      <EditSubgrupoModal
        isOpen={!!editSubgrupoNome}
        onClose={() => { setEditSubgrupoNome(null); setEditSubgrupoGrupo(null); }}
        subgrupoNome={editSubgrupoNome}
        subgrupoGrupo={editSubgrupoGrupo}
        subgruposDaPlanilha={subgruposDaPlanilha}
        gruposExistentes={gruposExistentes}
        onSave={handleSaveSubgrupo}
      />
    </>
  );
}
