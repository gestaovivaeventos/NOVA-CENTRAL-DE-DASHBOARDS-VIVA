/**
 * Modal de edição de Módulo
 * Padrão do EditCardModal de Branches: overlay, dropdowns, searchable multi-select para usuários, botão salvar
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, Settings, Search, Check, Plus, ChevronDown } from 'lucide-react';
import type { ModuloConfig } from '../types';
import IconSelect from './IconSelect';

interface Usuario {
  username: string;
  name: string;
  accessLevel: number;
  setor: string;
  nmGrupo: string;
}

interface EditModuloModalProps {
  isOpen: boolean;
  onClose: () => void;
  modulo: ModuloConfig | null;
  onSave: (moduloId: string, field: string, value: string) => Promise<boolean>;
  gruposExistentes?: string[];
  subgruposExistentes?: { nome: string; grupo: string }[];
}

export default function EditModuloModal({
  isOpen,
  onClose,
  modulo,
  onSave,
  gruposExistentes = [],
  subgruposExistentes = [],
}: EditModuloModalProps) {
  // Editable fields
  const [moduloNome, setModuloNome] = useState('');
  const [nvlAcesso, setNvlAcesso] = useState('1');
  const [ativo, setAtivo] = useState('TRUE');
  const [grupo, setGrupo] = useState('');
  const [ordem, setOrdem] = useState('1');
  const [icone, setIcone] = useState('');
  const [tipo, setTipo] = useState('interno');
  const [urlExterna, setUrlExterna] = useState('');
  const [subgrupo, setSubgrupo] = useState('');
  const [beta, setBeta] = useState(false);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>([]);
  const [gruposCargos, setGruposCargos] = useState<string[]>([]);

  // Users data
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Setor multi-select
  const [setorSearch, setSetorSearch] = useState('');
  const [setorDropdownOpen, setSetorDropdownOpen] = useState(false);
  const setorDropdownRef = useRef<HTMLDivElement>(null);

  // Grupo/Cargo multi-select
  const [grupoCargoSearch, setGrupoCargoSearch] = useState('');
  const [grupoCargoDropdownOpen, setGrupoCargoDropdownOpen] = useState(false);
  const grupoCargoDropdownRef = useRef<HTMLDivElement>(null);

  // Grupo search/create
  const [grupoSearch, setGrupoSearch] = useState('');
  const [grupoDropdownOpen, setGrupoDropdownOpen] = useState(false);
  const grupoDropdownRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);

  // Sync state when modulo changes
  useEffect(() => {
    if (modulo) {
      setModuloNome(modulo.moduloNome);
      setNvlAcesso(String(modulo.nvlAcesso));
      setAtivo(modulo.ativo ? 'TRUE' : 'FALSE');
      setGrupo(modulo.grupo);
      setOrdem(String(modulo.ordem));
      setIcone(modulo.icone);
      setTipo((modulo as any).tipo || 'interno');
      setUrlExterna((modulo as any).urlExterna || '');
      setSubgrupo((modulo as any).subgrupo || '');
      setBeta((modulo as any).beta || false);
      setUsuariosSelecionados(modulo.usuariosPermitidos || []);
      setSetoresSelecionados((modulo as any).setoresPermitidos || []);
      setGruposCargos((modulo as any).gruposPermitidos || []);
      setUserSearch('');
      setUserDropdownOpen(false);
      setSetorSearch('');
      setSetorDropdownOpen(false);
      setGrupoCargoSearch('');
      setGrupoCargoDropdownOpen(false);
    }
  }, [modulo]);

  // Fetch list of users
  useEffect(() => {
    if (isOpen) {
      fetch('/api/controle-modulos/usuarios')
        .then(r => r.json())
        .then(d => setTodosUsuarios(d.usuarios || []))
        .catch(() => setTodosUsuarios([]));
    }
  }, [isOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (grupoDropdownRef.current && !grupoDropdownRef.current.contains(e.target as Node)) {
        setGrupoDropdownOpen(false);
      }
      if (setorDropdownRef.current && !setorDropdownRef.current.contains(e.target as Node)) {
        setSetorDropdownOpen(false);
      }
      if (grupoCargoDropdownRef.current && !grupoCargoDropdownRef.current.contains(e.target as Node)) {
        setGrupoCargoDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lista de grupos (todos vindos da prop gruposExistentes = módulos + planilha GRUPOS)
  const todosGrupos = useMemo(() => {
    return [...gruposExistentes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [gruposExistentes]);

  const filteredGrupos = useMemo(() => {
    if (!grupoSearch) return todosGrupos;
    const q = grupoSearch.toLowerCase();
    return todosGrupos.filter(g => g.toLowerCase().includes(q));
  }, [todosGrupos, grupoSearch]);

  const filteredUsers = useMemo(() => {
    // Filtrar por setor e grupo/cargo selecionados, depois por busca
    let base = todosUsuarios;
    if (setoresSelecionados.length > 0) {
      base = base.filter(u => setoresSelecionados.includes(u.setor));
    }
    if (gruposCargos.length > 0) {
      base = base.filter(u => gruposCargos.includes(u.nmGrupo));
    }
    if (!userSearch) return base;
    const q = userSearch.toLowerCase();
    return base.filter(
      u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [todosUsuarios, userSearch, setoresSelecionados, gruposCargos]);

  // Lista de setores únicos extraídos dos usuários
  const todosSetores = useMemo(() => {
    const set = new Set<string>();
    todosUsuarios.forEach(u => { if (u.setor) set.add(u.setor); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [todosUsuarios]);

  const filteredSetores = useMemo(() => {
    if (!setorSearch) return todosSetores;
    const q = setorSearch.toLowerCase();
    return todosSetores.filter(s => s.toLowerCase().includes(q));
  }, [todosSetores, setorSearch]);

  // Lista de grupos/cargos, filtrada pelo setor selecionado
  const todosGruposCargos = useMemo(() => {
    let base = todosUsuarios;
    if (setoresSelecionados.length > 0) {
      base = base.filter(u => setoresSelecionados.includes(u.setor));
    }
    const set = new Set<string>();
    base.forEach(u => { if (u.nmGrupo) set.add(u.nmGrupo); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [todosUsuarios, setoresSelecionados]);

  const filteredGruposCargos = useMemo(() => {
    if (!grupoCargoSearch) return todosGruposCargos;
    const q = grupoCargoSearch.toLowerCase();
    return todosGruposCargos.filter(g => g.toLowerCase().includes(q));
  }, [todosGruposCargos, grupoCargoSearch]);

  if (!isOpen || !modulo) return null;

  // Detect changes
  const hasChanges = (() => {
    if (moduloNome !== modulo.moduloNome) return true;
    if (nvlAcesso !== String(modulo.nvlAcesso)) return true;
    if (ativo !== (modulo.ativo ? 'TRUE' : 'FALSE')) return true;
    if (grupo !== modulo.grupo) return true;
    if (ordem !== String(modulo.ordem)) return true;
    if (icone !== modulo.icone) return true;
    if (tipo !== ((modulo as any).tipo || 'interno')) return true;
    if (urlExterna !== ((modulo as any).urlExterna || '')) return true;
    if (subgrupo !== ((modulo as any).subgrupo || '')) return true;
    if (beta !== ((modulo as any).beta || false)) return true;
    const originalUsers = (modulo.usuariosPermitidos || []).join(',');
    const currentUsers = usuariosSelecionados.join(',');
    if (currentUsers !== originalUsers) return true;
    const originalSetores = ((modulo as any).setoresPermitidos || []).join(',');
    const currentSetores = setoresSelecionados.join(',');
    if (currentSetores !== originalSetores) return true;
    const originalGruposCargos = ((modulo as any).gruposPermitidos || []).join(',');
    const currentGruposCargos = gruposCargos.join(',');
    if (currentGruposCargos !== originalGruposCargos) return true;
    return false;
  })();

  const toggleUser = (username: string) => {
    setUsuariosSelecionados(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const toggleSetor = (setor: string) => {
    setSetoresSelecionados(prev => {
      const next = prev.includes(setor) ? prev.filter(s => s !== setor) : [...prev, setor];
      // Limpar grupos/cargos que não pertencem mais a nenhum setor selecionado
      if (next.length > 0) {
        const gruposValidos = new Set<string>();
        todosUsuarios.filter(u => next.includes(u.setor)).forEach(u => { if (u.nmGrupo) gruposValidos.add(u.nmGrupo); });
        setGruposCargos(gc => gc.filter(g => gruposValidos.has(g)));
        // Limpar usuários que não pertencem mais aos setores selecionados
        const usersValidos = new Set<string>();
        todosUsuarios.filter(u => next.includes(u.setor)).forEach(u => usersValidos.add(u.username));
        setUsuariosSelecionados(us => us.filter(u => usersValidos.has(u)));
      }
      return next;
    });
  };

  const toggleGrupoCargo = (gc: string) => {
    setGruposCargos(prev => {
      const next = prev.includes(gc) ? prev.filter(g => g !== gc) : [...prev, gc];
      // Limpar usuários que não pertencem mais aos grupos selecionados
      if (next.length > 0) {
        const usersValidos = new Set<string>();
        let base = todosUsuarios;
        if (setoresSelecionados.length > 0) {
          base = base.filter(u => setoresSelecionados.includes(u.setor));
        }
        base.filter(u => next.includes(u.nmGrupo)).forEach(u => usersValidos.add(u.username));
        setUsuariosSelecionados(us => us.filter(u => usersValidos.has(u)));
      }
      return next;
    });
  };

  // Save all changed fields one by one
  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    let allOk = true;

    if (moduloNome !== modulo.moduloNome) {
      const ok = await onSave(modulo.moduloId, 'modulo_nome', moduloNome);
      if (!ok) allOk = false;
    }
    if (nvlAcesso !== String(modulo.nvlAcesso)) {
      const ok = await onSave(modulo.moduloId, 'nvl_acesso', nvlAcesso);
      if (!ok) allOk = false;
    }
    if (ativo !== (modulo.ativo ? 'TRUE' : 'FALSE')) {
      const ok = await onSave(modulo.moduloId, 'ativo', ativo);
      if (!ok) allOk = false;
    }
    if (grupo !== modulo.grupo) {
      const ok = await onSave(modulo.moduloId, 'grupo', grupo);
      if (!ok) allOk = false;
    }
    if (ordem !== String(modulo.ordem)) {
      const ok = await onSave(modulo.moduloId, 'ordem', ordem);
      if (!ok) allOk = false;
    }
    if (icone !== modulo.icone) {
      const ok = await onSave(modulo.moduloId, 'icone', icone);
      if (!ok) allOk = false;
    }
    if (tipo !== ((modulo as any).tipo || 'interno')) {
      const ok = await onSave(modulo.moduloId, 'tipo', tipo);
      if (!ok) allOk = false;
    }
    if (urlExterna !== ((modulo as any).urlExterna || '')) {
      const ok = await onSave(modulo.moduloId, 'url_externa', urlExterna);
      if (!ok) allOk = false;
    }
    if (subgrupo !== ((modulo as any).subgrupo || '')) {
      const ok = await onSave(modulo.moduloId, 'subgrupo', subgrupo);
      if (!ok) allOk = false;
    }

    const originalUsers = (modulo.usuariosPermitidos || []).join(',');
    const currentUsers = usuariosSelecionados.join(',');
    if (currentUsers !== originalUsers) {
      const ok = await onSave(modulo.moduloId, 'usuarios_permitidos', currentUsers);
      if (!ok) allOk = false;
    }

    const originalSetores = ((modulo as any).setoresPermitidos || []).join(',');
    const currentSetores = setoresSelecionados.join(',');
    if (currentSetores !== originalSetores) {
      const ok = await onSave(modulo.moduloId, 'setores_permitidos', currentSetores);
      if (!ok) allOk = false;
    }

    const originalGruposCargos = ((modulo as any).gruposPermitidos || []).join(',');
    const currentGruposCargos = gruposCargos.join(',');
    if (currentGruposCargos !== originalGruposCargos) {
      const ok = await onSave(modulo.moduloId, 'grupos_permitidos', currentGruposCargos);
      if (!ok) allOk = false;
    }

    if (beta !== ((modulo as any).beta || false)) {
      const ok = await onSave(modulo.moduloId, 'beta', beta ? 'TRUE' : 'FALSE');
      if (!ok) allOk = false;
    }

    setSaving(false);
    if (allOk) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: '#2d3239',
          borderRadius: '16px',
          border: '1px solid #FF6600',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '2px solid #FF6600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#2d3239',
            borderRadius: '16px 16px 0 0',
            zIndex: 1,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: 'rgba(255,102,0,0.15)',
                padding: '8px',
                borderRadius: '10px',
              }}
            >
              <Settings size={22} color="#FF6600" />
            </div>
            <div>
              <h2
                style={{
                  color: '#F8F9FA',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {modulo.moduloNome}
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                {modulo.moduloPath} &middot; ID: {modulo.moduloId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6c757d',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Nome do Módulo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Nome do Módulo</label>
            <input
              type="text"
              value={moduloNome}
              onChange={(e) => setModuloNome(e.target.value)}
              placeholder="Nome exibido na sidebar..."
              style={{
                ...inputStyle,
                borderColor: moduloNome !== modulo?.moduloNome ? '#FF6600' : '#444',
              }}
            />
          </div>

          {/* Nível de Acesso */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Nível de Acesso</label>
            <select
              value={nvlAcesso}
              onChange={(e) => setNvlAcesso(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                borderColor: nvlAcesso === '0' ? '#10b981' : nvlAcesso === '2' ? '#3b82f6' : '#f59e0b',
                color: nvlAcesso === '0' ? '#10b981' : nvlAcesso === '2' ? '#3b82f6' : '#f59e0b',
              }}
            >
              <option value="0" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                0 — Rede (todos os usuários)
              </option>
              <option value="1" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                1 — Franqueadora (apenas franqueadora)
              </option>
              <option value="2" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                2 — Franquia (apenas franquias)
              </option>
            </select>
          </div>

          {/* Ativo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Status</label>
            <select
              value={ativo}
              onChange={(e) => setAtivo(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                borderColor: ativo === 'TRUE' ? '#10b981' : '#ef4444',
                color: ativo === 'TRUE' ? '#10b981' : '#ef4444',
              }}
            >
              <option value="TRUE" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                Ativo
              </option>
              <option value="FALSE" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                Inativo
              </option>
            </select>
          </div>

          {/* Grupo — Searchable com criação */}
          <div style={{ marginBottom: '20px' }} ref={grupoDropdownRef}>
            <label style={labelStyle}>
              Grupo
              {grupoDropdownOpen && grupo && !grupoSearch && (
                <span style={{ color: '#FF6600', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
                  atual: {grupo}
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={grupoDropdownOpen ? grupoSearch : grupo}
                onChange={(e) => {
                  setGrupoSearch(e.target.value);
                }}
                onFocus={() => {
                  setGrupoDropdownOpen(true);
                  setGrupoSearch('');
                }}
                placeholder={grupoDropdownOpen ? 'Digite para filtrar ou criar...' : 'Selecione ou digite um novo grupo...'}
                style={{ ...inputStyle, paddingRight: 36 }}
              />
              <ChevronDown
                size={18}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: grupoDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
                  color: '#6c757d',
                  pointerEvents: 'none',
                  transition: 'transform 0.2s',
                }}
              />
              {grupoDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: 200,
                    overflowY: 'auto',
                    backgroundColor: '#1a1d21',
                    border: '1px solid #444',
                    borderRadius: '0 0 8px 8px',
                    zIndex: 10,
                  }}
                >
                  {filteredGrupos.map(g => (
                    <button
                      key={g}
                      onClick={() => {
                        setGrupo(g);
                        setGrupoSearch('');
                        setGrupoDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '8px 14px',
                        background: grupo === g ? 'rgba(255,102,0,0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #333',
                        color: grupo === g ? '#FF6600' : '#F8F9FA',
                        fontSize: '0.8rem',
                        fontFamily: 'Poppins, sans-serif',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = grupo === g ? 'rgba(255,102,0,0.15)' : 'rgba(255,255,255,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = grupo === g ? 'rgba(255,102,0,0.1)' : 'transparent')}
                    >
                      {grupo === g && <Check size={14} color="#FF6600" />}
                      {g}
                    </button>
                  ))}
                  {grupoSearch.trim() && !todosGrupos.some(g => g.toLowerCase() === grupoSearch.trim().toLowerCase()) && (
                    <button
                      onClick={() => {
                        setGrupo(grupoSearch.trim());
                        setGrupoSearch('');
                        setGrupoDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '8px 14px',
                        background: 'rgba(16,185,129,0.08)',
                        border: 'none',
                        borderBottom: '1px solid #333',
                        color: '#10b981',
                        fontSize: '0.8rem',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Plus size={14} />
                      Criar grupo &quot;{grupoSearch.trim()}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subgrupo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              Subgrupo
              <span style={{ color: '#6c757d', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
                (opcional)
              </span>
            </label>
            <select
              value={subgrupo}
              onChange={(e) => setSubgrupo(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              <option value="" style={{ color: '#6c757d', backgroundColor: '#1a1d21' }}>
                Sem subgrupo
              </option>
              {subgruposExistentes
                .filter(s => !grupo || s.grupo.toLowerCase() === grupo.toLowerCase())
                .map(s => (
                  <option key={`${s.grupo}-${s.nome}`} value={s.nome} style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                    {s.nome}
                  </option>
                ))}
            </select>
          </div>

          {/* Ordem */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Ordem</label>
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <option key={n} value={String(n)} style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Ícone */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Ícone</label>
            <IconSelect value={icone} onChange={setIcone} />
          </div>

          {/* Tipo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                borderColor: tipo === 'externo' ? '#8b5cf6' : '#6c757d',
                color: tipo === 'externo' ? '#8b5cf6' : '#F8F9FA',
              }}
            >
              <option value="interno" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                Interno (rota Next.js)
              </option>
              <option value="externo" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                Externo (Looker Studio, Sheets, etc.)
              </option>
            </select>
          </div>

          {/* URL Externa (só aparece se tipo = externo) */}
          {tipo === 'externo' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>URL Externa</label>
              <input
                type="url"
                value={urlExterna}
                onChange={(e) => setUrlExterna(e.target.value)}
                placeholder="https://lookerstudio.google.com/..."
                style={{
                  ...inputStyle,
                  borderColor: urlExterna ? '#8b5cf6' : '#444',
                }}
              />
            </div>
          )}

          {/* Versão Beta Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Versão Beta</label>
            <button
              type="button"
              onClick={() => setBeta(!beta)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 14px',
                backgroundColor: beta ? 'rgba(139, 92, 246, 0.08)' : '#1a1d21',
                border: beta ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid #444',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {/* Toggle pill */}
              <div style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                backgroundColor: beta ? '#8b5cf6' : '#4b5563',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: beta ? 21 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{
                  color: beta ? '#c4b5fd' : '#6c757d',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}>
                  {beta ? 'BETA ativado' : 'Desativado'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '0.7rem',
                  display: 'block',
                  marginTop: 2,
                }}>
                  Exibe badge “BETA” no menu e favoritos
                </span>
              </div>
              {beta && (
                <span style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  BETA
                </span>
              )}
            </button>
          </div>

          {/* Versão Beta Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Versão Beta</label>
            <button
              type="button"
              onClick={() => setBeta(!beta)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 14px',
                backgroundColor: beta ? 'rgba(139, 92, 246, 0.08)' : '#1a1d21',
                border: beta ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid #444',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {/* Toggle pill */}
              <div style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                backgroundColor: beta ? '#8b5cf6' : '#4b5563',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: beta ? 21 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{
                  color: beta ? '#c4b5fd' : '#6c757d',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}>
                  {beta ? 'BETA ativado' : 'Desativado'}
                </span>
                <span style={{
                  color: '#6c757d',
                  fontSize: '0.7rem',
                  display: 'block',
                  marginTop: 2,
                }}>
                  Exibe badge “BETA” no menu e favoritos
                </span>
              </div>
              {beta && (
                <span style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  BETA
                </span>
              )}
            </button>
          </div>

          {/* ===== FILTROS HIERÁRQUICOS: Setor → Grupo/Cargo → Usuário ===== */}

          {/* Setores Permitidos — Searchable multi-select */}
          <div style={{ marginBottom: '20px' }} ref={setorDropdownRef}>
            <label style={labelStyle}>
              Setores Permitidos
              <span style={{ color: '#6c757d', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
                {setoresSelecionados.length === 0
                  ? '(vazio = todos os setores)'
                  : `(${setoresSelecionados.length} selecionados)`}
              </span>
            </label>

            {/* Selected chips */}
            {setoresSelecionados.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {setoresSelecionados.map(s => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 6,
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      color: '#10b981',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    {s}
                    <button
                      onClick={() => toggleSetor(s)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 1,
                        fontSize: '1rem',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6c757d',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={setorSearch}
                  onChange={(e) => setSetorSearch(e.target.value)}
                  onFocus={() => setSetorDropdownOpen(true)}
                  placeholder="Buscar setor..."
                  style={{
                    ...inputStyle,
                    paddingLeft: 36,
                  }}
                />
              </div>

              {setorDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: 200,
                    overflowY: 'auto',
                    backgroundColor: '#1a1d21',
                    border: '1px solid #444',
                    borderRadius: '0 0 8px 8px',
                    zIndex: 10,
                  }}
                >
                  {filteredSetores.length === 0 ? (
                    <div style={{ padding: '10px 14px', color: '#6c757d', fontSize: '0.8rem' }}>
                      Nenhum setor encontrado
                    </div>
                  ) : (
                    filteredSetores.map(s => {
                      const selected = setoresSelecionados.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleSetor(s)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '8px 14px',
                            background: selected ? 'rgba(16,185,129,0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #333',
                            color: selected ? '#10b981' : '#F8F9FA',
                            fontSize: '0.8rem',
                            fontFamily: 'Poppins, sans-serif',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(16,185,129,0.1)' : 'transparent')}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: selected ? '2px solid #10b981' : '2px solid #555',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              backgroundColor: selected ? 'rgba(16,185,129,0.15)' : 'transparent',
                            }}
                          >
                            {selected && <Check size={12} color="#10b981" />}
                          </div>
                          {s}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grupos/Cargos Permitidos — Searchable multi-select (filtrado por setor) */}
          <div style={{ marginBottom: '20px' }} ref={grupoCargoDropdownRef}>
            <label style={labelStyle}>
              Grupos / Cargos Permitidos
              <span style={{ color: '#6c757d', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
                {gruposCargos.length === 0
                  ? '(vazio = todos os grupos)'
                  : `(${gruposCargos.length} selecionados)`}
              </span>
            </label>

            {/* Selected chips */}
            {gruposCargos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {gruposCargos.map(g => (
                  <span
                    key={g}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: 'rgba(59,130,246,0.12)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: 6,
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      color: '#3b82f6',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    {g}
                    <button
                      onClick={() => toggleGrupoCargo(g)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 1,
                        fontSize: '1rem',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6c757d',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={grupoCargoSearch}
                  onChange={(e) => setGrupoCargoSearch(e.target.value)}
                  onFocus={() => setGrupoCargoDropdownOpen(true)}
                  placeholder={setoresSelecionados.length > 0 ? 'Buscar grupo/cargo (filtrado por setor)...' : 'Buscar grupo/cargo...'}
                  style={{
                    ...inputStyle,
                    paddingLeft: 36,
                  }}
                />
              </div>

              {grupoCargoDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: 200,
                    overflowY: 'auto',
                    backgroundColor: '#1a1d21',
                    border: '1px solid #444',
                    borderRadius: '0 0 8px 8px',
                    zIndex: 10,
                  }}
                >
                  {filteredGruposCargos.length === 0 ? (
                    <div style={{ padding: '10px 14px', color: '#6c757d', fontSize: '0.8rem' }}>
                      {setoresSelecionados.length > 0
                        ? 'Nenhum grupo/cargo encontrado para os setores selecionados'
                        : 'Nenhum grupo/cargo encontrado'}
                    </div>
                  ) : (
                    filteredGruposCargos.map(g => {
                      const selected = gruposCargos.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() => toggleGrupoCargo(g)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '8px 14px',
                            background: selected ? 'rgba(59,130,246,0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #333',
                            color: selected ? '#3b82f6' : '#F8F9FA',
                            fontSize: '0.8rem',
                            fontFamily: 'Poppins, sans-serif',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(59,130,246,0.1)' : 'transparent')}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: selected ? '2px solid #3b82f6' : '2px solid #555',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              backgroundColor: selected ? 'rgba(59,130,246,0.15)' : 'transparent',
                            }}
                          >
                            {selected && <Check size={12} color="#3b82f6" />}
                          </div>
                          {g}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Usuários Permitidos — Searchable multi-select */}
          <div style={{ marginBottom: '20px' }} ref={userDropdownRef}>
            <label style={labelStyle}>
              Usuários Permitidos
              <span style={{ color: '#6c757d', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
                {usuariosSelecionados.length === 0
                  ? '(vazio = todos com nível adequado)'
                  : `(${usuariosSelecionados.length} selecionados)`}
              </span>
            </label>

            {/* Selected chips */}
            {usuariosSelecionados.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {usuariosSelecionados.map(u => (
                  <span
                    key={u}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: 'rgba(255,102,0,0.12)',
                      border: '1px solid rgba(255,102,0,0.3)',
                      borderRadius: 6,
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      color: '#FF6600',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    {u}
                    <button
                      onClick={() => toggleUser(u)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF6600',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 1,
                        fontSize: '1rem',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6c757d',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => setUserDropdownOpen(true)}
                  placeholder={
                    setoresSelecionados.length > 0 || gruposCargos.length > 0
                      ? 'Buscar usuário (filtrado por setor/grupo)...'
                      : 'Buscar usuário...'
                  }
                  style={{
                    ...inputStyle,
                    paddingLeft: 36,
                  }}
                />
              </div>

              {/* Dropdown list */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: 200,
                    overflowY: 'auto',
                    backgroundColor: '#1a1d21',
                    border: '1px solid #444',
                    borderRadius: '0 0 8px 8px',
                    zIndex: 10,
                  }}
                >
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: '10px 14px', color: '#6c757d', fontSize: '0.8rem' }}>
                      Nenhum usuário encontrado
                    </div>
                  ) : (
                    filteredUsers.map(u => {
                      const selected = usuariosSelecionados.includes(u.username);
                      return (
                        <button
                          key={u.username}
                          onClick={() => toggleUser(u.username)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '8px 14px',
                            background: selected ? 'rgba(255,102,0,0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #333',
                            color: selected ? '#FF6600' : '#F8F9FA',
                            fontSize: '0.8rem',
                            fontFamily: 'Poppins, sans-serif',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(255,102,0,0.15)' : 'rgba(255,255,255,0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(255,102,0,0.1)' : 'transparent')}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: selected ? '2px solid #FF6600' : '2px solid #555',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              backgroundColor: selected ? 'rgba(255,102,0,0.15)' : 'transparent',
                            }}
                          >
                            {selected && <Check size={12} color="#FF6600" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 600 }}>{u.username}</span>
                            {u.name && u.name !== u.username && (
                              <span style={{ color: '#6c757d', marginLeft: 6, fontSize: '0.7rem' }}>
                                ({u.name})
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: u.accessLevel >= 1 ? '#f59e0b' : '#6c757d',
                              flexShrink: 0,
                            }}
                          >
                            Nível {u.accessLevel}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: hasChanges ? '#FF6600' : '#4b5563',
              border: 'none',
              padding: '12px',
              color: '#fff',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: hasChanges ? '0 4px 12px rgba(255,102,0,0.3)' : 'none',
            }}
          >
            {saving ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                {hasChanges ? 'Salvar alterações' : 'Sem alterações'}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ======= Styles compartilhados (mesmo padrão do EditCardModal) =======
const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#adb5bd',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'Poppins, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  flex: 1,
  padding: '10px 14px',
  backgroundColor: '#1a1d21',
  color: '#F8F9FA',
  border: '1px solid #444',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
};
