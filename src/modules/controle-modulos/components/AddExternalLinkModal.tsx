/**
 * Modal para criar novo link externo (Looker Studio, Planilhas, etc.)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, ExternalLink, Search, Check, ChevronDown } from 'lucide-react';

interface Usuario {
  username: string;
  name: string;
  accessLevel: number;
}

interface AddExternalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExternalLinkData) => Promise<boolean>;
  gruposExistentes: string[];
  subgruposExistentes?: { nome: string; grupo: string }[];
}

export interface ExternalLinkData {
  moduloId: string;
  moduloNome: string;
  moduloPath: string;
  nvlAcesso: number;
  usuariosPermitidos: string;
  ativo: string;
  grupo: string;
  ordem: number;
  icone: string;
  tipo: string;
  urlExterna: string;
  subgrupo: string;
}

const ICONES_SUGERIDOS = [
  { value: 'link', label: 'Link' },
  { value: 'bar-chart', label: 'Gráfico' },
  { value: 'file-spreadsheet', label: 'Planilha' },
  { value: 'pie-chart', label: 'Pizza' },
  { value: 'trending-up', label: 'Tendência' },
  { value: 'database', label: 'Dados' },
  { value: 'layout-dashboard', label: 'Dashboard' },
  { value: 'external-link', label: 'Externo' },
];

export default function AddExternalLinkModal({
  isOpen,
  onClose,
  onSave,
  gruposExistentes,
  subgruposExistentes = [],
}: AddExternalLinkModalProps) {
  const [nome, setNome] = useState('');
  const [url, setUrl] = useState('');
  const [grupo, setGrupo] = useState('');
  const [grupoSearch, setGrupoSearch] = useState('');
  const [grupoDropdownOpen, setGrupoDropdownOpen] = useState(false);
  const [nvlAcesso, setNvlAcesso] = useState('0');
  const [ordem, setOrdem] = useState('1');
  const [icone, setIcone] = useState('link');
  const [subgrupo, setSubgrupo] = useState('');
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const grupoDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setNome('');
      setUrl('');
      setGrupo('');
      setGrupoSearch('');
      setNvlAcesso('0');
      setOrdem('1');
      setIcone('link');
      setSubgrupo('');
      setUsuariosSelecionados([]);
      setUserSearch('');
      setError('');

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
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const todosGrupos = useMemo(() => {
    return [...gruposExistentes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [gruposExistentes]);

  const filteredGrupos = useMemo(() => {
    if (!grupoSearch) return todosGrupos;
    const q = grupoSearch.toLowerCase();
    return todosGrupos.filter(g => g.toLowerCase().includes(q));
  }, [todosGrupos, grupoSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return todosUsuarios;
    const q = userSearch.toLowerCase();
    return todosUsuarios.filter(
      u => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [todosUsuarios, userSearch]);

  if (!isOpen) return null;

  // Gerar ID automaticamente a partir do nome
  const generateId = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const toggleUser = (username: string) => {
    setUsuariosSelecionados(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  const isValid = nome.trim() && url.trim() && grupo.trim();

  const handleSave = async () => {
    if (!isValid) {
      setError('Preencha nome, URL e grupo.');
      return;
    }

    setSaving(true);
    setError('');

    const data: ExternalLinkData = {
      moduloId: generateId(nome),
      moduloNome: nome.trim(),
      moduloPath: '',
      nvlAcesso: parseInt(nvlAcesso),
      usuariosPermitidos: usuariosSelecionados.join(','),
      ativo: 'TRUE',
      grupo: grupo.trim(),
      ordem: parseInt(ordem),
      icone: icone,
      tipo: 'externo',
      urlExterna: url.trim(),
      subgrupo: subgrupo,
    };

    const ok = await onSave(data);
    setSaving(false);
    if (ok) onClose();
    else setError('Erro ao salvar. Verifique se o ID já existe.');
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
          border: '1px solid #8b5cf6',
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
            borderBottom: '2px solid #8b5cf6',
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
                backgroundColor: 'rgba(139,92,246,0.15)',
                padding: '8px',
                borderRadius: '10px',
              }}
            >
              <ExternalLink size={22} color="#8b5cf6" />
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
                Adicionar Link Externo
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                Looker Studio, Planilhas, Relatórios, etc.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Nome */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Nome do Dashboard / Relatório *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Relatório Financeiro Mensal"
              style={inputStyle}
            />
            {nome && (
              <p style={{ color: '#6c757d', fontSize: '0.7rem', marginTop: 4 }}>
                ID gerado: <code style={{ color: '#8b5cf6' }}>{generateId(nome)}</code>
              </p>
            )}
          </div>

          {/* URL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>URL Externa *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://lookerstudio.google.com/reporting/..."
              style={{
                ...inputStyle,
                borderColor: url ? '#8b5cf6' : '#444',
              }}
            />
          </div>

          {/* Grupo — Searchable com criação */}
          <div style={{ marginBottom: '20px' }} ref={grupoDropdownRef}>
            <label style={labelStyle}>Grupo *</label>
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
                placeholder={grupoDropdownOpen ? 'Digite para filtrar ou criar...' : 'Selecione ou crie um grupo...'}
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
                        background: grupo === g ? 'rgba(139,92,246,0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #333',
                        color: grupo === g ? '#8b5cf6' : '#F8F9FA',
                        fontSize: '0.8rem',
                        fontFamily: 'Poppins, sans-serif',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = grupo === g ? 'rgba(139,92,246,0.1)' : 'transparent')}
                    >
                      {grupo === g && <Check size={14} color="#8b5cf6" />}
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

          {/* Row: Icone + Ordem */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Ícone</label>
              <select
                value={icone}
                onChange={(e) => setIcone(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {ICONES_SUGERIDOS.map(i => (
                  <option key={i.value} value={i.value} style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ordem</label>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={String(n)} style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
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
                borderColor: nvlAcesso === '0' ? '#10b981' : '#f59e0b',
                color: nvlAcesso === '0' ? '#10b981' : '#f59e0b',
              }}
            >
              <option value="0" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                0 — Rede (todos os usuários)
              </option>
              <option value="1" style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                1 — Franqueadora (apenas franqueadora)
              </option>
            </select>
          </div>

          {/* Usuários Permitidos */}
          <div style={{ marginBottom: '20px' }} ref={userDropdownRef}>
            <label style={labelStyle}>
              Usuários Permitidos
              <span style={{ color: '#6c757d', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
                {usuariosSelecionados.length === 0
                  ? '(vazio = todos com nível adequado)'
                  : `(${usuariosSelecionados.length} selecionados)`}
              </span>
            </label>

            {usuariosSelecionados.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {usuariosSelecionados.map(u => (
                  <span
                    key={u}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: 'rgba(139,92,246,0.12)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: 6,
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      color: '#8b5cf6',
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
                        color: '#8b5cf6',
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
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => setUserDropdownOpen(true)}
                  placeholder="Buscar usuário..."
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
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
                            background: selected ? 'rgba(139,92,246,0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #333',
                            color: selected ? '#8b5cf6' : '#F8F9FA',
                            fontSize: '0.8rem',
                            fontFamily: 'Poppins, sans-serif',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selected ? 'rgba(139,92,246,0.1)' : 'transparent')}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: selected ? '2px solid #8b5cf6' : '2px solid #555',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              backgroundColor: selected ? 'rgba(139,92,246,0.15)' : 'transparent',
                            }}
                          >
                            {selected && <Check size={12} color="#8b5cf6" />}
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

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 12, fontFamily: 'Poppins, sans-serif' }}>
              {error}
            </p>
          )}

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="w-full flex items-center justify-center gap-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: isValid ? '#8b5cf6' : '#4b5563',
              border: 'none',
              padding: '12px',
              color: '#fff',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: saving || !isValid ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: isValid ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
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
                Criando...
              </>
            ) : (
              <>
                <Plus size={18} />
                Adicionar Link Externo
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
