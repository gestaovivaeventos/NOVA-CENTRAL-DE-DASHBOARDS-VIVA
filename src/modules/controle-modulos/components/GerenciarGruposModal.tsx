/**
 * Modal para gerenciar grupos (criar novos, editar ícone, remover)
 * Grupos vêm 100% da planilha GRUPOS + grupos em uso nos módulos
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, FolderPlus, Trash2, Loader2, AlertCircle, CheckCircle2, Pencil, Check } from 'lucide-react';
import IconSelect from './IconSelect';
import { ICONES, IconPreview } from '../config/icones';

export interface GrupoInfo {
  nome: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

interface GerenciarGruposModalProps {
  isOpen: boolean;
  onClose: () => void;
  gruposEmUso: string[];
  onGruposChanged: () => void;
}

export default function GerenciarGruposModal({
  isOpen,
  onClose,
  gruposEmUso,
  onGruposChanged,
}: GerenciarGruposModalProps) {
  const [gruposDaPlanilha, setGruposDaPlanilha] = useState<GrupoInfo[]>([]);
  const [novoGrupo, setNovoGrupo] = useState('');
  const [novoIcone, setNovoIcone] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingGrupo, setDeletingGrupo] = useState<string | null>(null);
  const [editingIcone, setEditingIcone] = useState<string | null>(null);
  const [editingIconeValue, setEditingIconeValue] = useState('');
  const [savingIcone, setSavingIcone] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/controle-modulos/grupos');
      if (res.ok) {
        const data = await res.json();
        setGruposDaPlanilha(data.grupos || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchGrupos();
      setNovoGrupo('');
      setNovoIcone('settings');
      setFeedback(null);
      setEditingIcone(null);
    }
  }, [isOpen, fetchGrupos]);

  // Merge: grupos da planilha + grupos em uso (que podem não estar na planilha)
  const todosGrupos = useMemo(() => {
    const map = new Map<string, GrupoInfo>();
    for (const g of gruposDaPlanilha) {
      map.set(g.nome.toLowerCase(), g);
    }
    for (const nome of gruposEmUso) {
      if (!map.has(nome.toLowerCase())) {
        map.set(nome.toLowerCase(), { nome, icone: 'settings', ordem: 99, ativo: true });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [gruposDaPlanilha, gruposEmUso]);

  const grupoJaExiste = useMemo(() => {
    if (!novoGrupo.trim()) return false;
    return todosGrupos.some(
      (g) => g.nome.toLowerCase() === novoGrupo.trim().toLowerCase()
    );
  }, [novoGrupo, todosGrupos]);

  const handleAddGrupo = async () => {
    if (!novoGrupo.trim() || grupoJaExiste) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/controle-modulos/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupo: novoGrupo.trim(), icone: novoIcone }),
      });

      if (res.ok) {
        setNovoGrupo('');
        setNovoIcone('settings');
        await fetchGrupos();
        onGruposChanged();
        setFeedback({ type: 'success', msg: `Grupo "${novoGrupo.trim()}" criado!` });
      } else {
        const data = await res.json();
        setFeedback({ type: 'error', msg: data.error || 'Erro ao criar grupo' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erro de conexão' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateIcone = async (grupoNome: string, icone: string) => {
    setSavingIcone(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/controle-modulos/grupos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupo: grupoNome, icone }),
      });

      if (res.ok) {
        setEditingIcone(null);
        await fetchGrupos();
        onGruposChanged();
        setFeedback({ type: 'success', msg: `Ícone do grupo "${grupoNome}" atualizado!` });
      } else {
        const data = await res.json();
        setFeedback({ type: 'error', msg: data.error || 'Erro ao atualizar ícone' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erro de conexão' });
    } finally {
      setSavingIcone(false);
    }
  };

  const handleDeleteGrupo = async (grupo: string) => {
    setDeletingGrupo(grupo);
    setFeedback(null);

    try {
      const res = await fetch('/api/controle-modulos/grupos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupo }),
      });

      if (res.ok) {
        await fetchGrupos();
        onGruposChanged();
        setFeedback({ type: 'success', msg: `Grupo "${grupo}" removido` });
      } else {
        const data = await res.json();
        setFeedback({ type: 'error', msg: data.error || 'Erro ao remover' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erro de conexão' });
    } finally {
      setDeletingGrupo(null);
    }
  };

  if (!isOpen) return null;

  const isNaPlanilha = (nome: string) => gruposDaPlanilha.some(g => g.nome.toLowerCase() === nome.toLowerCase());
  const isEmUso = (nome: string) => gruposEmUso.includes(nome);

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
          display: 'flex',
          flexDirection: 'column',
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
              <FolderPlus size={22} color="#FF6600" />
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
                Gerenciar Grupos
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                Crie, edite ícones e organize agrupamentos
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

        {/* Criar novo grupo */}
        <div style={{ padding: '20px 24px 0' }}>
          <label style={labelStyle}>Novo Grupo</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <IconSelect value={novoIcone} onChange={setNovoIcone} compact style={{ flex: 'none' }} />
            <input
              type="text"
              value={novoGrupo}
              onChange={(e) => {
                setNovoGrupo(e.target.value);
                setFeedback(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGrupo();
              }}
              placeholder="Ex: Inteligência de Dados"
              style={{
                ...inputStyle,
                flex: 1,
                borderColor: grupoJaExiste ? '#ef4444' : '#444',
              }}
            />
            <button
              onClick={handleAddGrupo}
              disabled={saving || !novoGrupo.trim() || grupoJaExiste}
              style={{
                backgroundColor: novoGrupo.trim() && !grupoJaExiste ? '#FF6600' : '#4b5563',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                color: '#fff',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: saving || !novoGrupo.trim() || grupoJaExiste ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Criar
            </button>
          </div>
          {grupoJaExiste && (
            <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4, fontFamily: 'Poppins, sans-serif' }}>
              Esse grupo já existe
            </p>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            style={{
              margin: '12px 24px 0',
              padding: '8px 14px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              backgroundColor: feedback.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}30`,
              color: feedback.type === 'success' ? '#10b981' : '#ef4444',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedback.msg}
          </div>
        )}

        {/* Lista de grupos */}
        <div style={{ padding: '16px 24px 24px', flex: 1, overflowY: 'auto' }}>
          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Grupos Disponíveis
            <span style={{ color: '#6c757d', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
              ({todosGrupos.length})
            </span>
          </label>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Loader2 size={24} color="#FF6600" className="animate-spin mx-auto" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {todosGrupos.map((g) => {
                const naPlanilha = isNaPlanilha(g.nome);
                const emUso = isEmUso(g.nome);
                const canDelete = naPlanilha && !emUso;
                const isEditingThisIcone = editingIcone === g.nome;

                return (
                  <div
                    key={g.nome}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#1a1d21',
                      borderRadius: 8,
                      border: `1px solid #333`,
                      gap: 8,
                    }}
                  >
                    {/* Ícone editável */}
                    <div style={{ flexShrink: 0 }}>
                      {isEditingThisIcone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconSelect value={editingIconeValue} onChange={setEditingIconeValue} compact />
                          <button
                            onClick={() => handleUpdateIcone(g.nome, editingIconeValue)}
                            disabled={savingIcone}
                            style={{
                              background: 'rgba(16,185,129,0.15)',
                              border: '1px solid #10b981',
                              borderRadius: 4,
                              padding: '3px 5px',
                              cursor: savingIcone ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {savingIcone ? (
                              <Loader2 size={12} className="animate-spin" color="#10b981" />
                            ) : (
                              <Check size={12} color="#10b981" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingIcone(null)}
                            style={{
                              background: 'rgba(239,68,68,0.15)',
                              border: '1px solid #ef4444',
                              borderRadius: 4,
                              padding: '3px 5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <X size={12} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (naPlanilha) {
                              setEditingIcone(g.nome);
                              setEditingIconeValue(g.icone);
                            }
                          }}
                          style={{
                            background: 'rgba(255,102,0,0.1)',
                            border: '1px solid rgba(255,102,0,0.3)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            cursor: naPlanilha ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#FF6600',
                            fontSize: '0.65rem',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            opacity: naPlanilha ? 1 : 0.5,
                          }}
                          title={naPlanilha ? 'Editar ícone' : 'Grupo só em uso (não registrado)'}
                        >
                          <IconPreview value={g.icone} size={12} color="#FF6600" />
                          {ICONES.find(i => i.value === g.icone)?.label || g.icone}
                          {naPlanilha && <Pencil size={10} />}
                        </button>
                      )}
                    </div>

                    {/* Nome + tags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          color: '#F8F9FA',
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {g.nome}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {emUso && (
                          <span style={tagStyle('#10b981')}>em uso</span>
                        )}
                        {naPlanilha && (
                          <span style={tagStyle('#6c757d')}>registrado</span>
                        )}
                        {!naPlanilha && emUso && (
                          <span style={tagStyle('#f59e0b')}>só em módulos</span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteGrupo(g.nome)}
                        disabled={!!deletingGrupo}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          cursor: deletingGrupo ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#ef4444',
                          fontSize: '0.7rem',
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                        title="Remover grupo"
                      >
                        {deletingGrupo === g.nome ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Remover
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function tagStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    fontSize: '0.6rem',
    fontWeight: 600,
    fontFamily: 'Poppins, sans-serif',
    color: color,
    backgroundColor: `${color}15`,
    border: `1px solid ${color}30`,
    padding: '1px 6px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  };
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
  padding: '10px 14px',
  backgroundColor: '#1a1d21',
  color: '#F8F9FA',
  border: '1px solid #444',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
};
