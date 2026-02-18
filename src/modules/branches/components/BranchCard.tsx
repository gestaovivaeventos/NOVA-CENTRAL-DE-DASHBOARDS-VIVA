/**
 * Card compacto de Branch (Ramificação) no Kanban
 * Clique abre o modal de edição
 */

import React, { useState } from 'react';
import { Copy, Check, GitBranch, ExternalLink, ShieldCheck, Truck, Pencil } from 'lucide-react';
import type { Branch, KanbanColumn } from '../types';

interface BranchCardProps {
  branch: Branch;
  columns: KanbanColumn[];
  onClick: () => void;
  updating: boolean;
}

export default function BranchCard({
  branch,
  columns,
  onClick,
  updating,
}: BranchCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const statusInfo = columns.find(c => c.id === branch.status);

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(branch.nomeCompleto);
    } catch {
      const el = document.createElement('textarea');
      el.value = branch.nomeCompleto;
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
      {/* Botão editar */}
      <div className="flex justify-end mb-1">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{
            backgroundColor: 'rgba(59,130,246,0.08)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px',
            cursor: 'pointer',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
          }}
          title="Editar ramificação"
        >
          <Pencil size={13} />
        </button>
      </div>

      {/* Header: módulo badge + data + status badge */}
      <div className="flex items-center gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
        <GitBranch size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
        <span
          style={{
            backgroundColor: 'rgba(59,130,246,0.15)',
            color: '#3b82f6',
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '10px',
            textTransform: 'uppercase',
          }}
        >
          {branch.modulo}
        </span>
        <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>
          {branch.dataCriacao}
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
          {statusInfo?.label || branch.status}
        </span>
      </div>

      {/* Nome da branch + copiar */}
      <div className="flex items-center gap-1 mb-2">
        <code
          style={{
            color: '#3b82f6',
            fontSize: '0.65rem',
            fontWeight: 600,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            backgroundColor: 'rgba(59,130,246,0.08)',
            padding: '3px 6px',
            borderRadius: '5px',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={branch.nomeCompleto}
        >
          {branch.nomeCompleto}
        </code>
        <button
          onClick={copyToClipboard}
          style={{
            backgroundColor: copied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.1)',
            border: 'none',
            borderRadius: '5px',
            padding: '4px',
            cursor: 'pointer',
            color: copied ? '#10b981' : '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          title="Copiar nome da branch"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>

      {/* Criado por + release */}
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: '#6c757d', fontSize: '0.65rem' }}>
          Por: <span style={{ color: '#ADB5BD' }}>{branch.criadoPorNome}</span>
        </span>
        <span style={{ color: '#4b5563', fontSize: '0.65rem' }}>|</span>
        <span style={{ color: '#6c757d', fontSize: '0.65rem' }}>
          Release: <span style={{ color: '#FF6600' }}>v{branch.releaseVersao}</span>
        </span>
      </div>

      {/* Descrição preview (se houver) */}
      {branch.descricao && (
        <p
          style={{
            color: '#ADB5BD',
            fontSize: '0.65rem',
            marginTop: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            backgroundColor: 'rgba(255,255,255,0.03)',
            padding: '4px 7px',
            borderRadius: '5px',
            borderLeft: '2px solid #3b82f6',
          }}
        >
          {branch.descricao}
        </p>
      )}

      {/* Informações de aprovação */}
      {branch.aprovadoPorNome && (
        <div
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '6px',
            padding: '5px 8px',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.6rem',
          }}
        >
          <ShieldCheck size={11} style={{ color: '#8b5cf6', flexShrink: 0 }} />
          <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{branch.aprovadoPorNome}</span>
          {branch.dataAprovacao && (
            <>
              <span style={{ color: '#4b5563' }}>•</span>
              <span style={{ color: '#6c757d' }}>{branch.dataAprovacao}</span>
            </>
          )}
        </div>
      )}

      {/* Informações de entrega */}
      {branch.entreguePorNome && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '6px',
            padding: '5px 8px',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.6rem',
          }}
        >
          <Truck size={11} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ color: '#10b981', fontWeight: 600 }}>{branch.entreguePorNome}</span>
          {branch.dataEntrega && (
            <>
              <span style={{ color: '#4b5563' }}>•</span>
              <span style={{ color: '#6c757d' }}>{branch.dataEntrega}</span>
            </>
          )}
        </div>
      )}

      {/* Link com copiar/abrir */}
      {branch.linkBranch && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
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
            {branch.linkBranch}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(branch.linkBranch).catch(() => {});
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
            href={branch.linkBranch}
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
    </div>
  );
}
