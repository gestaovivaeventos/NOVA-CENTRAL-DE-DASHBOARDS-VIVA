/**
 * Modal para gerenciar subgrupos (criar, editar, remover)
 * Subgrupos ficam na aba SUBGRUPOS (subgrupo, grupo, icone, ordem, ativo)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, FolderOpen, Trash2, Loader2, AlertCircle, CheckCircle2, Pencil, Check } from 'lucide-react';
import IconSelect from './IconSelect';
import { ICONES, IconPreview } from '../config/icones';

export interface SubgrupoInfo {
  nome: string;
  grupo: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

interface GerenciarSubgruposModalProps {
  isOpen: boolean;
  onClose: () => void;
  gruposExistentes: string[];
  onSubgruposChanged: () => void;
}

export default function GerenciarSubgruposModal({
  isOpen,
  onClose,
  gruposExistentes,
  onSubgruposChanged,
}: GerenciarSubgruposModalProps) {
  const [subgrupos, setSubgrupos] = useState<SubgrupoInfo[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [novoGrupo, setNovoGrupo] = useState('');
  const [novoIcone, setNovoIcone] = useState('folder');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingSubgrupo, setDeletingSubgrupo] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchSubgrupos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/controle-modulos/subgrupos?refresh=true');
      if (res.ok) {
        const data = await res.json();
        setSubgrupos(data.subgrupos || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSubgrupos();
      setNovoNome('');
      setNovoGrupo(gruposExistentes[0] || '');
      setNovoIcone('folder');
      setFeedback(null);
    }
  }, [isOpen, fetchSubgrupos, gruposExistentes]);

  const subgrupoJaExiste = useMemo(() => {
    if (!novoNome.trim() || !novoGrupo) return false;
    return subgrupos.some(
      (s) =>
        s.nome.toLowerCase() === novoNome.trim().toLowerCase() &&
        s.grupo.toLowerCase() === novoGrupo.toLowerCase()
    );
  }, [novoNome, novoGrupo, subgrupos]);

  const handleAdd = async () => {
    if (!novoNome.trim() || !novoGrupo || subgrupoJaExiste) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/controle-modulos/subgrupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subgrupo: novoNome.trim(), grupo: novoGrupo, icone: novoIcone }),
      });

      if (res.ok) {
        setNovoNome('');
        setNovoIcone('folder');
        await fetchSubgrupos();
        onSubgruposChanged();
        setFeedback({ type: 'success', msg: `Subgrupo "${novoNome.trim()}" criado!` });
      } else {
        const data = await res.json();
        setFeedback({ type: 'error', msg: data.error || 'Erro ao criar subgrupo' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erro de conexão' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nome: string, grupo: string) => {
    setDeletingSubgrupo(nome);
    setFeedback(null);

    try {
      const res = await fetch('/api/controle-modulos/subgrupos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subgrupo: nome, grupo }),
      });

      if (res.ok) {
        await fetchSubgrupos();
        onSubgruposChanged();
        setFeedback({ type: 'success', msg: `Subgrupo "${nome}" removido` });
      } else {
        const data = await res.json();
        setFeedback({ type: 'error', msg: data.error || 'Erro ao remover' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erro de conexão' });
    } finally {
      setDeletingSubgrupo(null);
    }
  };

  // Agrupar subgrupos por grupo pai
  const subgruposPorGrupo = useMemo(() => {
    const map = new Map<string, SubgrupoInfo[]>();
    for (const s of subgrupos) {
      if (!map.has(s.grupo)) map.set(s.grupo, []);
      map.get(s.grupo)!.push(s);
    }
    // Ordenar subgrupos dentro de cada grupo
    for (const [, list] of map) {
      list.sort((a, b) => a.ordem - b.ordem);
    }
    return map;
  }, [subgrupos]);

  if (!isOpen) return null;

  const labelStyle: React.CSSProperties = {
    color: '#6c757d',
    fontSize: '0.7rem',
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#1a1d21',
    border: '1px solid #444',
    borderRadius: 8,
    color: '#F8F9FA',
    padding: '10px 14px',
    fontSize: '0.85rem',
    fontFamily: "'Poppins', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
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
          maxWidth: '650px',
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
              <FolderOpen size={22} color="#FF6600" />
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
                Gerenciar Subgrupos
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                Crie subgrupos dentro dos grupos para organizar módulos
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

        {/* Criar novo subgrupo */}
        <div style={{ padding: '20px 24px 0' }}>
          <label style={labelStyle}>Novo Subgrupo</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={novoGrupo}
              onChange={(e) => setNovoGrupo(e.target.value)}
              style={{
                ...inputStyle,
                width: 180,
                flex: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="" style={{ color: '#6c757d', backgroundColor: '#1a1d21' }}>Grupo pai...</option>
              {gruposExistentes.map(g => (
                <option key={g} value={g} style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                  {g}
                </option>
              ))}
            </select>
            <IconSelect value={novoIcone} onChange={setNovoIcone} compact style={{ flex: 'none' }} />
            <input
              type="text"
              value={novoNome}
              onChange={(e) => {
                setNovoNome(e.target.value);
                setFeedback(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="Ex: Book de Métricas e Diagnóstico"
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: 180,
                borderColor: subgrupoJaExiste ? '#ef4444' : '#444',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !novoNome.trim() || !novoGrupo || subgrupoJaExiste}
              style={{
                backgroundColor: novoNome.trim() && novoGrupo && !subgrupoJaExiste ? '#FF6600' : '#4b5563',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                color: '#fff',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: saving || !novoNome.trim() || !novoGrupo || subgrupoJaExiste ? 'not-allowed' : 'pointer',
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
          {subgrupoJaExiste && (
            <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4, fontFamily: 'Poppins, sans-serif' }}>
              Esse subgrupo já existe neste grupo
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

        {/* Lista de subgrupos */}
        <div style={{ padding: '16px 24px 24px', flex: 1, overflowY: 'auto' }}>
          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Subgrupos Disponíveis
            <span style={{ color: '#6c757d', fontWeight: 400, textTransform: 'none', marginLeft: 8 }}>
              ({subgrupos.length})
            </span>
          </label>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Loader2 size={24} color="#FF6600" className="animate-spin mx-auto" />
            </div>
          ) : subgrupos.length === 0 ? (
            <p style={{ color: '#6c757d', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
              Nenhum subgrupo criado ainda
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from(subgruposPorGrupo.entries()).map(([grupoNome, subs]) => (
                <div key={grupoNome}>
                  <div
                    style={{
                      color: '#FF6600',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontFamily: 'Poppins, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 6,
                      padding: '4px 0',
                      borderBottom: '1px solid rgba(255,102,0,0.2)',
                    }}
                  >
                    {grupoNome}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {subs.map((s) => (
                      <div
                        key={`${s.grupo}-${s.nome}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: '#1a1d21',
                          borderRadius: 8,
                          border: '1px solid #333',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              background: 'rgba(255,102,0,0.1)',
                              border: '1px solid rgba(255,102,0,0.3)',
                              borderRadius: 6,
                              padding: '4px 8px',
                              color: '#FF6600',
                              fontSize: '0.65rem',
                              fontFamily: 'Poppins, sans-serif',
                              fontWeight: 600,
                            }}
                          >
                            <IconPreview value={s.icone} size={12} color="#FF6600" />
                            {ICONES.find(i => i.value === s.icone)?.label || s.icone}
                          </span>
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
                            {s.nome}
                          </span>
                          <span
                            style={{
                              color: '#6c757d',
                              fontSize: '0.65rem',
                              fontFamily: 'Poppins, sans-serif',
                              backgroundColor: 'rgba(107,114,128,0.1)',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            Ordem #{s.ordem}
                          </span>
                          {!s.ativo && (
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
                        </div>

                        <button
                          onClick={() => handleDelete(s.nome, s.grupo)}
                          disabled={!!deletingSubgrupo}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            cursor: deletingSubgrupo ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            opacity: deletingSubgrupo === s.nome ? 0.5 : 1,
                          }}
                        >
                          {deletingSubgrupo === s.nome ? (
                            <Loader2 size={12} className="animate-spin" color="#ef4444" />
                          ) : (
                            <Trash2 size={12} color="#ef4444" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
