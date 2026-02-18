/**
 * Modal de edição de Card (Release ou Branch)
 * Abre ao clicar no card, permite editar todas as informações
 */

import React, { useState, useEffect } from 'react';
import { X, GitMerge, GitBranch, Copy, Check, ExternalLink, Link2, FileText, Pencil, PlusCircle } from 'lucide-react';
import type { Release, Branch, KanbanStatus, KanbanColumn } from '../types';
import { MODULOS_CENTRAL } from '../types';

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Release data (se for release)
  release?: Release | null;
  releaseBranches?: Branch[];
  releaseColumns?: KanbanColumn[];
  // Branch data (se for branch)
  branch?: Branch | null;
  branchColumns?: KanbanColumn[];
  // Handlers
  onUpdateStatus: (id: string, status: KanbanStatus) => Promise<boolean>;
  onUpdateLink: (id: string, link: string) => Promise<boolean>;
  onUpdateDescricao: (id: string, descricao: string) => Promise<boolean>;
  onUpdateModulo?: (id: string, modulo: string) => Promise<boolean>;
  onCreateBranch?: (releaseId: string, releaseVersao: number) => void;
  updating: boolean;
}

export default function EditCardModal({
  isOpen,
  onClose,
  release,
  releaseBranches = [],
  releaseColumns = [],
  branch,
  branchColumns = [],
  onUpdateStatus,
  onUpdateLink,
  onUpdateDescricao,
  onUpdateModulo,
  onCreateBranch,
  updating,
}: EditCardModalProps) {
  const isRelease = !!release;
  const item = release || branch;
  const columns = isRelease ? releaseColumns : branchColumns;

  const [status, setStatus] = useState<KanbanStatus>(item?.status || 'em-desenvolvimento');
  const [link, setLink] = useState('');
  const [descricao, setDescricao] = useState('');
  const [modulo, setModulo] = useState('');
  const [novoModulo, setNovoModulo] = useState('');
  const [isNovoModulo, setIsNovoModulo] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state when item changes
  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setDescricao(isRelease ? (release?.descricao || '') : (branch?.descricao || ''));
      setLink(isRelease ? (release?.linkVercel || '') : (branch?.linkBranch || ''));
      if (!isRelease && branch) {
        setModulo(branch.modulo);
      }
    }
  }, [item, isRelease, release, branch]);

  if (!isOpen || !item) return null;

  const statusInfo = columns.find(c => c.id === status);
  const nomeCompleto = isRelease ? release!.nomeCompleto : branch!.nomeCompleto;

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleSaveStatus = async (newStatus: KanbanStatus) => {
    setStatus(newStatus);
    setSaving(true);
    await onUpdateStatus(item.id, newStatus);
    setSaving(false);
  };

  const handleSaveLink = async () => {
    const currentLink = isRelease ? release!.linkVercel : branch!.linkBranch;
    if (link !== currentLink) {
      setSaving(true);
      await onUpdateLink(item.id, link);
      setSaving(false);
    }
  };

  const handleSaveDescricao = async () => {
    const currentDesc = isRelease ? release!.descricao : branch!.descricao;
    if (descricao !== currentDesc) {
      setSaving(true);
      await onUpdateDescricao(item.id, descricao);
      setSaving(false);
    }
  };

  const handleSaveModulo = async (valor: string) => {
    if (valor && valor !== branch?.modulo && onUpdateModulo) {
      setSaving(true);
      await onUpdateModulo(item.id, valor);
      setModulo(valor);
      setSaving(false);
    }
    setIsNovoModulo(false);
    setNovoModulo('');
  };

  const handleModuloChange = (v: string) => {
    if (v === '__novo__') {
      setIsNovoModulo(true);
    } else {
      setIsNovoModulo(false);
      setModulo(v);
      handleSaveModulo(v);
    }
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
          border: `1px solid ${isRelease ? '#FF6600' : '#3b82f6'}`,
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
            borderBottom: `2px solid ${isRelease ? '#FF6600' : '#3b82f6'}`,
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
                backgroundColor: isRelease ? 'rgba(255,102,0,0.15)' : 'rgba(59,130,246,0.15)',
                padding: '8px',
                borderRadius: '10px',
              }}
            >
              {isRelease ? <GitMerge size={22} color="#FF6600" /> : <GitBranch size={22} color="#3b82f6" />}
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
                {isRelease ? `Release v${release!.versao}` : 'Ramificação'}
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                Criado por {isRelease ? release!.criadoPorNome : branch!.criadoPorNome} em {isRelease ? release!.dataCriacao : branch!.dataCriacao}
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
          {/* Nome completo + copiar */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Nome</label>
            <div className="flex items-center gap-2">
              <code
                style={{
                  color: isRelease ? '#FF6600' : '#3b82f6',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                  backgroundColor: isRelease ? 'rgba(255,102,0,0.08)' : 'rgba(59,130,246,0.08)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  flex: 1,
                  wordBreak: 'break-all',
                  display: 'block',
                }}
              >
                {nomeCompleto}
              </code>
              <button
                onClick={() => copyToClipboard(nomeCompleto, setCopiedName)}
                style={{
                  ...btnIconStyle,
                  backgroundColor: copiedName ? 'rgba(16,185,129,0.15)' : (isRelease ? 'rgba(255,102,0,0.1)' : 'rgba(59,130,246,0.1)'),
                  color: copiedName ? '#10b981' : (isRelease ? '#FF6600' : '#3b82f6'),
                }}
                title="Copiar nome"
              >
                {copiedName ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Status</label>
            <div className="flex flex-wrap gap-2">
              {columns.map(col => (
                <button
                  key={col.id}
                  onClick={() => handleSaveStatus(col.id)}
                  disabled={updating || saving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${col.color}`,
                    backgroundColor: status === col.id ? `${col.color}25` : 'transparent',
                    color: col.color,
                    fontSize: '0.8rem',
                    fontWeight: status === col.id ? 700 : 500,
                    fontFamily: 'Poppins, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: updating || saving ? 0.6 : 1,
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Módulo (só para branch) */}
          {!isRelease && branch && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                <Pencil size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Módulo
              </label>
              {isNovoModulo ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novoModulo}
                    onChange={(e) => setNovoModulo(e.target.value)}
                    placeholder="Nome do novo módulo..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && novoModulo.trim()) handleSaveModulo(novoModulo.trim().toLowerCase().replace(/\s+/g, '-'));
                      if (e.key === 'Escape') setIsNovoModulo(false);
                    }}
                    style={inputStyle}
                  />
                  <button
                    onClick={() => novoModulo.trim() && handleSaveModulo(novoModulo.trim().toLowerCase().replace(/\s+/g, '-'))}
                    disabled={!novoModulo.trim() || saving}
                    style={{
                      ...saveBtnStyle,
                      backgroundColor: '#3b82f6',
                    }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsNovoModulo(false)}
                    style={{
                      ...saveBtnStyle,
                      backgroundColor: '#4b5563',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <select
                  value={modulo}
                  onChange={(e) => handleModuloChange(e.target.value)}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                  }}
                >
                  {MODULOS_CENTRAL.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="__novo__">+ Novo módulo...</option>
                </select>
              )}
            </div>
          )}

          {/* Release info (só para branch) */}
          {!isRelease && branch && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Release</label>
              <span
                style={{
                  color: '#FF6600',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                v{branch.releaseVersao}
              </span>
            </div>
          )}

          {/* Link */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              <Link2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {isRelease ? 'Link Vercel' : 'Link da Branch'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                onBlur={handleSaveLink}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveLink()}
                style={inputStyle}
              />
              {link && (
                <>
                  <button
                    onClick={() => copyToClipboard(link, setCopiedLink)}
                    style={{
                      ...btnIconStyle,
                      backgroundColor: copiedLink ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
                      color: copiedLink ? '#10b981' : '#6c757d',
                    }}
                    title="Copiar link"
                  >
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...btnIconStyle,
                      backgroundColor: 'rgba(16,185,129,0.08)',
                      color: '#10b981',
                      textDecoration: 'none',
                    }}
                    title="Abrir link"
                  >
                    <ExternalLink size={16} />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onBlur={handleSaveDescricao}
              placeholder={isRelease ? 'Descreva o objetivo desta release...' : 'O que foi feito nessa branch...'}
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '80px',
              }}
            />
          </div>

          {/* Branches vinculadas (só para release) */}
          {isRelease && releaseBranches.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Ramificações ({releaseBranches.length})
              </label>
              <div className="flex flex-col gap-2">
                {releaseBranches.map(b => {
                  const bStatus = branchColumns.length > 0
                    ? branchColumns.find(c => c.id === b.status)
                    : releaseColumns.find(c => c.id === b.status);
                  return (
                    <div
                      key={b.id}
                      style={{
                        backgroundColor: '#1a1d21',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        borderLeft: `3px solid ${bStatus?.color || '#6b7280'}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <code
                          style={{
                            color: '#3b82f6',
                            fontSize: '0.75rem',
                            fontFamily: "'Fira Code', monospace",
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {b.nomeCompleto}
                        </code>
                        <span
                          style={{
                            color: bStatus?.color || '#6c757d',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            backgroundColor: `${bStatus?.color || '#6c757d'}15`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            marginLeft: '8px',
                            flexShrink: 0,
                          }}
                        >
                          {bStatus?.label || b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ color: '#6c757d', fontSize: '0.65rem' }}>{b.modulo}</span>
                        <span style={{ color: '#4b5563', fontSize: '0.65rem' }}>•</span>
                        <span style={{ color: '#6c757d', fontSize: '0.65rem' }}>{b.criadoPorNome}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botão criar ramificação (só para release) */}
          {isRelease && onCreateBranch && (
            <button
              onClick={() => {
                onCreateBranch(release!.id, release!.versao);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg transition-all duration-200 hover:bg-orange-500/20"
              style={{
                backgroundColor: 'rgba(255,102,0,0.08)',
                border: '1px solid rgba(255,102,0,0.3)',
                padding: '10px',
                color: '#FF6600',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={18} />
              Gerar Ramificação
            </button>
          )}

          {/* Indicador de salvamento */}
          {saving && (
            <div className="mt-3 text-center">
              <span style={{ color: '#FF6600', fontSize: '0.75rem' }}>Salvando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ======= Styles compartilhados =======
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

const btnIconStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '8px',
  padding: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  flexShrink: 0,
};

const saveBtnStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  color: '#fff',
  fontSize: '0.8rem',
  fontWeight: 600,
  fontFamily: 'Poppins, sans-serif',
  cursor: 'pointer',
  flexShrink: 0,
};
