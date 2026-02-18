/**
 * Card compacto de Release no Kanban
 * Clique abre o modal de edição
 */

import React, { useState } from 'react';
import { Copy, Check, CheckCircle2, Clock, ChevronDown, ChevronUp, ExternalLink, PlusCircle } from 'lucide-react';
import type { Release, Branch, KanbanColumn } from '../types';

interface ReleaseCardProps {
  release: Release;
  branches: Branch[];
  columns: KanbanColumn[];
  onClick: () => void;
  onCreateBranch: (releaseId: string, releaseVersao: number) => void;
  updating: boolean;
}

export default function ReleaseCard({
  release,
  branches,
  columns,
  onClick,
  onCreateBranch,
  updating,
}: ReleaseCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showBranches, setShowBranches] = useState(false);

  const statusInfo = columns.find(c => c.id === release.status);
  const releaseBranches = branches.filter(b => b.releaseId === release.id);
  const branchesEntregues = releaseBranches.filter(b => b.status === 'concluida').length;
  const branchesPendentes = releaseBranches.filter(b => b.status !== 'concluida' && b.status !== 'descartada').length;

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(release.nomeCompleto);
    } catch {
      const el = document.createElement('textarea');
      el.value = release.nomeCompleto;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#2d3239',
        borderRadius: '10px',
        border: `1px solid ${statusInfo?.color || '#4b5563'}`,
        padding: '14px',
        marginBottom: '10px',
        transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        cursor: 'pointer',
      }}
      className="hover:brightness-110"
    >
      {/* Header: versão + data + status badge */}
      <div className="flex items-center gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
        <span
          style={{
            backgroundColor: statusInfo?.color || '#6b7280',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          v{release.versao}
        </span>
        <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>
          {release.dataCriacao}
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            color: statusInfo?.color || '#9ca3af',
            fontSize: '0.6rem',
            fontWeight: 600,
            backgroundColor: `${statusInfo?.color || '#6b7280'}15`,
            padding: '2px 8px',
            borderRadius: '6px',
          }}
        >
          {statusInfo?.label || release.status}
        </span>
      </div>

      {/* Nome da release + copiar */}
      <div className="flex items-center gap-1 mb-2">
        <code
          style={{
            color: '#FF6600',
            fontSize: '0.7rem',
            fontWeight: 600,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            backgroundColor: 'rgba(255,102,0,0.08)',
            padding: '3px 6px',
            borderRadius: '5px',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={release.nomeCompleto}
        >
          {release.nomeCompleto}
        </code>
        <button
          onClick={copyToClipboard}
          style={{
            backgroundColor: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,102,0,0.1)',
            border: 'none',
            borderRadius: '5px',
            padding: '4px',
            cursor: 'pointer',
            color: copied ? '#10b981' : '#FF6600',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          title="Copiar nome da release"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>

      {/* Criado por */}
      <p style={{ color: '#6c757d', fontSize: '0.7rem', marginBottom: '6px' }}>
        Por: <span style={{ color: '#ADB5BD' }}>{release.criadoPorNome}</span>
      </p>

      {/* Descrição preview (se houver) */}
      {release.descricao && (
        <p
          style={{
            color: '#ADB5BD',
            fontSize: '0.65rem',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            backgroundColor: 'rgba(255,255,255,0.03)',
            padding: '4px 7px',
            borderRadius: '5px',
            borderLeft: '2px solid #FF6600',
          }}
        >
          {release.descricao}
        </p>
      )}

      {/* Link Vercel com copiar/abrir */}
      {release.linkVercel && (
        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <label style={{ color: '#6c757d', fontSize: '0.6rem', display: 'block', marginBottom: '3px' }}>
            🔗 Link da Branch
          </label>
          <div className="flex items-center gap-1">
          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '5px',
              padding: '4px 7px',
              color: '#10b981',
              fontSize: '0.6rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {release.linkVercel}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(release.linkVercel).catch(() => {});
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            style={{
              backgroundColor: copiedLink ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.08)',
              border: 'none',
              borderRadius: '5px',
              padding: '4px',
              cursor: 'pointer',
              color: copiedLink ? '#10b981' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            title="Copiar link"
          >
            {copiedLink ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <a
            href={release.linkVercel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(16,185,129,0.08)',
              border: 'none',
              borderRadius: '5px',
              padding: '4px',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            title="Abrir link"
          >
            <ExternalLink size={12} />
          </a>
          </div>
        </div>
      )}

      {/* Botão gerar ramificação */}
      <button
        onClick={(e) => { e.stopPropagation(); onCreateBranch(release.id, release.versao); }}
        className="w-full flex items-center justify-center gap-2 rounded-lg transition-all duration-200 hover:bg-orange-500/20"
        style={{
          backgroundColor: 'rgba(255,102,0,0.08)',
          border: '1px solid rgba(255,102,0,0.3)',
          padding: '5px',
          color: '#FF6600',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '0.65rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '6px',
        }}
      >
        <PlusCircle size={13} />
        Gerar Ramificação
      </button>

      {/* Resumo de branches */}
      {releaseBranches.length > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowBranches(!showBranches); }}
          className="w-full flex items-center justify-between rounded-lg transition-all"
          style={{
            backgroundColor: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.2)',
            padding: '5px 8px',
            color: '#3b82f6',
            fontSize: '0.65rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <span className="flex items-center gap-2">
            {releaseBranches.length} ramificaç{releaseBranches.length === 1 ? 'ão' : 'ões'}
            {branchesEntregues > 0 && (
              <span className="flex items-center gap-1" style={{ color: '#10b981', fontSize: '0.6rem' }}>
                <CheckCircle2 size={10} /> {branchesEntregues}
              </span>
            )}
            {branchesPendentes > 0 && (
              <span className="flex items-center gap-1" style={{ color: '#f59e0b', fontSize: '0.6rem' }}>
                <Clock size={10} /> {branchesPendentes}
              </span>
            )}
          </span>
          {showBranches ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {showBranches && releaseBranches.length > 0 && (
        <div style={{ marginTop: '6px' }} onClick={(e) => e.stopPropagation()}>
          {releaseBranches.map(b => {
            const bStatus = columns.find(c => c.id === b.status);
            const isEntregue = b.status === 'concluida';
            const isDescartada = b.status === 'descartada';
            return (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#1a1d21',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  marginTop: '4px',
                  borderLeft: `3px solid ${bStatus?.color || '#6b7280'}`,
                  opacity: isDescartada ? 0.5 : 1,
                }}
              >
                <div className="flex items-center gap-1">
                  {isEntregue && <CheckCircle2 size={10} color="#10b981" style={{ flexShrink: 0 }} />}
                  {isDescartada && <span style={{ fontSize: '0.6rem', color: '#ef4444', flexShrink: 0 }}>✕</span>}
                  <code
                    style={{
                      color: isEntregue ? '#10b981' : '#3b82f6',
                      fontSize: '0.6rem',
                      fontFamily: "'Fira Code', monospace",
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: isDescartada ? 'line-through' : 'none',
                    }}
                    title={b.nomeCompleto}
                  >
                    {b.nomeCompleto}
                  </code>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span style={{
                    color: bStatus?.color || '#6c757d',
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    backgroundColor: `${bStatus?.color || '#6c757d'}15`,
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}>
                    {bStatus?.label || b.status}
                  </span>
                  <span style={{ color: '#4b5563', fontSize: '0.55rem' }}>•</span>
                  <span style={{ color: '#6c757d', fontSize: '0.55rem' }}>{b.modulo}</span>
                  <span style={{ color: '#4b5563', fontSize: '0.55rem' }}>•</span>
                  <span style={{ color: '#6c757d', fontSize: '0.55rem' }}>{b.criadoPorNome}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
