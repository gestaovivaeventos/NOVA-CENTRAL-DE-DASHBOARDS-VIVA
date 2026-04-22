/**
 * Modal de edição de Módulo
 * Padrão do EditCardModal de Branches: overlay, dropdowns, searchable multi-select para usuários, botão salvar
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, Settings, Search, Check, Plus, ChevronDown } from 'lucide-react';
import type { ModuloConfig, AcessoEixo } from '../types';
import IconSelect from './IconSelect';
import EixoAcessoSection, { type UsuarioEixo as Usuario } from './EixoAcessoSection';

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
  const [ativo, setAtivo] = useState('TRUE');
  const [grupo, setGrupo] = useState('');
  const [ordem, setOrdem] = useState('1');
  const [icone, setIcone] = useState('');
  const [tipo, setTipo] = useState('interno');
  const [urlExterna, setUrlExterna] = useState('');
  const [subgrupo, setSubgrupo] = useState('');
  const [beta, setBeta] = useState(false);
  const [excecaoSelecionados, setExcecaoSelecionados] = useState<string[]>([]);

  // === Novo modelo: 2 eixos ===
  const [acessoFranqueadora, setAcessoFranqueadora] = useState<AcessoEixo>('sem_acesso');
  const [fqdSetores, setFqdSetores] = useState<string[]>([]);
  const [fqdGrupos, setFqdGrupos] = useState<string[]>([]);
  const [fqdUsuarios, setFqdUsuarios] = useState<string[]>([]);

  const [acessoFranquia, setAcessoFranquia] = useState<AcessoEixo>('sem_acesso');
  const [fqaSetores, setFqaSetores] = useState<string[]>([]);
  const [fqaGrupos, setFqaGrupos] = useState<string[]>([]);
  const [fqaUsuarios, setFqaUsuarios] = useState<string[]>([]);

  // Users data
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([]);

  // Exceção multi-select
  const [excecaoSearch, setExcecaoSearch] = useState('');
  const [excecaoDropdownOpen, setExcecaoDropdownOpen] = useState(false);
  const excecaoDropdownRef = useRef<HTMLDivElement>(null);

  // Grupo search/create
  const [grupoSearch, setGrupoSearch] = useState('');
  const [grupoDropdownOpen, setGrupoDropdownOpen] = useState(false);
  const grupoDropdownRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);

  // Sync state when modulo changes
  useEffect(() => {
    if (modulo) {
      setModuloNome(modulo.moduloNome);
      setAtivo(modulo.ativo ? 'TRUE' : 'FALSE');
      setGrupo(modulo.grupo);
      setOrdem(String(modulo.ordem));
      setIcone(modulo.icone);
      setTipo((modulo as any).tipo || 'interno');
      setUrlExterna((modulo as any).urlExterna || '');
      setSubgrupo((modulo as any).subgrupo || '');
      setBeta((modulo as any).beta || false);
      setExcecaoSelecionados((modulo as any).usuariosExcecao || []);
      // Novo modelo — 2 eixos
      setAcessoFranqueadora((modulo as any).acessoFranqueadora || 'sem_acesso');
      setFqdSetores((modulo as any).franqueadoraSetores || []);
      setFqdGrupos((modulo as any).franqueadoraGrupos || []);
      setFqdUsuarios((modulo as any).franqueadoraUsuarios || []);
      setAcessoFranquia((modulo as any).acessoFranquia || 'sem_acesso');
      setFqaSetores((modulo as any).franquiaSetores || []);
      setFqaGrupos((modulo as any).franquiaGrupos || []);
      setFqaUsuarios((modulo as any).franquiaUsuarios || []);
      setExcecaoSearch('');
      setExcecaoDropdownOpen(false);
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
      if (grupoDropdownRef.current && !grupoDropdownRef.current.contains(e.target as Node)) {
        setGrupoDropdownOpen(false);
      }
      if (excecaoDropdownRef.current && !excecaoDropdownRef.current.contains(e.target as Node)) {
        setExcecaoDropdownOpen(false);
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

  // === Pools de usuários por eixo ===
  // Franqueadora = accessLevel >= 1; Franquia = accessLevel === 0
  const usuariosFranqueadora = useMemo(
    () => todosUsuarios.filter(u => (u.accessLevel ?? 0) >= 1),
    [todosUsuarios]
  );
  const usuariosFranquia = useMemo(
    () => todosUsuarios.filter(u => (u.accessLevel ?? 0) === 0),
    [todosUsuarios]
  );

  // Lista de usuários para exceções (SEM filtro de setor/grupo — mostra todos)
  const filteredExcecaoUsers = useMemo(() => {
    if (!excecaoSearch) return todosUsuarios;
    const q = excecaoSearch.toLowerCase();
    return todosUsuarios.filter(
      u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [todosUsuarios, excecaoSearch]);

  if (!isOpen || !modulo) return null;

  // Detect changes
  const hasChanges = (() => {
    if (moduloNome !== modulo.moduloNome) return true;
    if (ativo !== (modulo.ativo ? 'TRUE' : 'FALSE')) return true;
    if (grupo !== modulo.grupo) return true;
    if (ordem !== String(modulo.ordem)) return true;
    if (icone !== modulo.icone) return true;
    if (tipo !== ((modulo as any).tipo || 'interno')) return true;
    if (urlExterna !== ((modulo as any).urlExterna || '')) return true;
    if (subgrupo !== ((modulo as any).subgrupo || '')) return true;
    if (beta !== ((modulo as any).beta || false)) return true;
    const originalExcecao = ((modulo as any).usuariosExcecao || []).join(',');
    const currentExcecao = excecaoSelecionados.join(',');
    if (currentExcecao !== originalExcecao) return true;
    if (acessoFranqueadora !== ((modulo as any).acessoFranqueadora || 'sem_acesso')) return true;
    if (fqdSetores.join(',') !== ((modulo as any).franqueadoraSetores || []).join(',')) return true;
    if (fqdGrupos.join(',') !== ((modulo as any).franqueadoraGrupos || []).join(',')) return true;
    if (fqdUsuarios.join(',') !== ((modulo as any).franqueadoraUsuarios || []).join(',')) return true;
    if (acessoFranquia !== ((modulo as any).acessoFranquia || 'sem_acesso')) return true;
    if (fqaSetores.join(',') !== ((modulo as any).franquiaSetores || []).join(',')) return true;
    if (fqaGrupos.join(',') !== ((modulo as any).franquiaGrupos || []).join(',')) return true;
    if (fqaUsuarios.join(',') !== ((modulo as any).franquiaUsuarios || []).join(',')) return true;
    return false;
  })();

  const toggleExcecao = (username: string) => {
    setExcecaoSelecionados(prev =>
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  // Save all changed fields one by one
  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    let allOk = true;
    const save = async (field: string, value: string) => {
      const ok = await onSave(modulo.moduloId, field, value);
      if (!ok) allOk = false;
    };

    if (moduloNome !== modulo.moduloNome) await save('modulo_nome', moduloNome);
    if (ativo !== (modulo.ativo ? 'TRUE' : 'FALSE')) await save('ativo', ativo);
    if (grupo !== modulo.grupo) await save('grupo', grupo);
    if (ordem !== String(modulo.ordem)) await save('ordem', ordem);
    if (icone !== modulo.icone) await save('icone', icone);
    if (tipo !== ((modulo as any).tipo || 'interno')) await save('tipo', tipo);
    if (urlExterna !== ((modulo as any).urlExterna || '')) await save('url_externa', urlExterna);
    if (subgrupo !== ((modulo as any).subgrupo || '')) await save('subgrupo', subgrupo);
    if (beta !== ((modulo as any).beta || false)) await save('beta', beta ? 'TRUE' : 'FALSE');

    const origExcecao = ((modulo as any).usuariosExcecao || []).join(',');
    if (excecaoSelecionados.join(',') !== origExcecao) await save('usuarios_excecao', excecaoSelecionados.join(','));

    // Eixo Franqueadora
    if (acessoFranqueadora !== ((modulo as any).acessoFranqueadora || 'sem_acesso'))
      await save('acesso_franqueadora', acessoFranqueadora);
    if (fqdSetores.join(',') !== ((modulo as any).franqueadoraSetores || []).join(','))
      await save('franqueadora_setores', fqdSetores.join(','));
    if (fqdGrupos.join(',') !== ((modulo as any).franqueadoraGrupos || []).join(','))
      await save('franqueadora_grupos', fqdGrupos.join(','));
    if (fqdUsuarios.join(',') !== ((modulo as any).franqueadoraUsuarios || []).join(','))
      await save('franqueadora_usuarios', fqdUsuarios.join(','));

    // Eixo Franquia
    if (acessoFranquia !== ((modulo as any).acessoFranquia || 'sem_acesso'))
      await save('acesso_franquia', acessoFranquia);
    if (fqaSetores.join(',') !== ((modulo as any).franquiaSetores || []).join(','))
      await save('franquia_setores', fqaSetores.join(','));
    if (fqaGrupos.join(',') !== ((modulo as any).franquiaGrupos || []).join(','))
      await save('franquia_grupos', fqaGrupos.join(','));
    if (fqaUsuarios.join(',') !== ((modulo as any).franquiaUsuarios || []).join(','))
      await save('franquia_usuarios', fqaUsuarios.join(','));

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

          {/* ===== EXCEÇÕES: Acesso Garantido (bypass de nvlAcesso/setores/grupos) ===== */}
          <div style={{
            marginBottom: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                ...labelStyle,
                color: '#a78bfa',
                fontSize: '0.8rem',
                marginBottom: 4,
                display: 'block',
              }}>
                Exceções — Acesso Garantido
              </span>
              <span style={{
                color: '#6c757d',
                fontSize: '0.7rem',
                fontFamily: 'Poppins, sans-serif',
                lineHeight: 1.4,
                display: 'block',
              }}>
                Estes usuários <strong style={{ color: '#a78bfa' }}>sempre</strong> terão acesso, independente do nível, setor ou grupo configurado acima.
                Ideal para liberar acesso a usuários de outro nível (ex: franquias em módulo da franqueadora).
              </span>
            </div>

            <div ref={excecaoDropdownRef}>
              {/* Selected chips */}
              {excecaoSelecionados.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {excecaoSelecionados.map(u => (
                    <span
                      key={u}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(139, 92, 246, 0.12)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: 6,
                        padding: '3px 10px',
                        fontSize: '0.75rem',
                        color: '#a78bfa',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 500,
                      }}
                    >
                      {u}
                      <button
                        onClick={() => toggleExcecao(u)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#a78bfa',
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
                    value={excecaoSearch}
                    onChange={(e) => setExcecaoSearch(e.target.value)}
                    onFocus={() => setExcecaoDropdownOpen(true)}
                    placeholder="Buscar usuário para acesso garantido..."
                    style={{
                      ...inputStyle,
                      paddingLeft: 36,
                      borderColor: excecaoSelecionados.length > 0 ? 'rgba(139, 92, 246, 0.5)' : '#444',
                    }}
                  />
                </div>

                {excecaoDropdownOpen && (
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
                    {filteredExcecaoUsers.length === 0 ? (
                      <div style={{ padding: '10px 14px', color: '#6c757d', fontSize: '0.8rem' }}>
                        Nenhum usuário encontrado
                      </div>
                    ) : (
                      filteredExcecaoUsers.map(u => {
                        const selected = excecaoSelecionados.includes(u.username);
                        return (
                          <button
                            key={u.username}
                            onClick={() => toggleExcecao(u.username)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              padding: '8px 14px',
                              background: selected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                              border: 'none',
                              borderBottom: '1px solid #333',
                              color: selected ? '#a78bfa' : '#F8F9FA',
                              fontSize: '0.8rem',
                              fontFamily: 'Poppins, sans-serif',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(139, 92, 246, 0.1)' : 'transparent')}
                          >
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                border: selected ? '2px solid #a78bfa' : '2px solid #555',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                backgroundColor: selected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                              }}
                            >
                              {selected && <Check size={12} color="#a78bfa" />}
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
                              {u.accessLevel >= 1 ? 'Franqueadora' : 'Franquia'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== NÍVEIS DE ACESSO (2 EIXOS INDEPENDENTES) ===== */}
          <EixoAcessoSection
            titulo="Acesso da Franqueadora"
            descricao="Controla quais usuários da franqueadora têm acesso ao módulo."
            cor="#f59e0b"
            eixo={acessoFranqueadora}
            setEixo={setAcessoFranqueadora}
            setoresSelecionados={fqdSetores}
            setSetoresSelecionados={setFqdSetores}
            gruposSelecionados={fqdGrupos}
            setGruposSelecionados={setFqdGrupos}
            usuariosSelecionados={fqdUsuarios}
            setUsuariosSelecionados={setFqdUsuarios}
            usuariosDisponiveis={usuariosFranqueadora}
          />

          <EixoAcessoSection
            titulo="Acesso das Franquias"
            descricao="Controla quais usuários das franquias têm acesso ao módulo."
            cor="#3b82f6"
            eixo={acessoFranquia}
            setEixo={setAcessoFranquia}
            setoresSelecionados={fqaSetores}
            setSetoresSelecionados={setFqaSetores}
            gruposSelecionados={fqaGrupos}
            setGruposSelecionados={setFqaGrupos}
            usuariosSelecionados={fqaUsuarios}
            setUsuariosSelecionados={setFqaUsuarios}
            usuariosDisponiveis={usuariosFranquia}
          />

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

