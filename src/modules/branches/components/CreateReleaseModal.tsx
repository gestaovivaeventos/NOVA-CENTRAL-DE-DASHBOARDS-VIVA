/**
 * Modal para criar nova Release
 */

import React from 'react';
import { X, GitMerge } from 'lucide-react';

interface CreateReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => Promise<void>;
  creating: boolean;
  nextVersion: number;
  userName: string;
  previewName: string;
}

export default function CreateReleaseModal({
  isOpen,
  onClose,
  onCreate,
  creating,
  nextVersion,
  userName,
  previewName,
}: CreateReleaseModalProps) {
  if (!isOpen) return null;

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#2d3239',
          borderRadius: '16px',
          border: '1px solid #FF6600',
          padding: '28px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: 'rgba(255,102,0,0.15)',
                padding: '8px',
                borderRadius: '10px',
              }}
            >
              <GitMerge size={22} color="#FF6600" />
            </div>
            <h2
              style={{
                color: '#F8F9FA',
                fontSize: '1.2rem',
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Nova Release
            </h2>
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
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div
          style={{
            backgroundColor: '#1a1d21',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: '#6c757d', fontSize: '0.75rem', marginBottom: '8px' }}>
            Nome gerado automaticamente:
          </p>
          <code
            style={{
              color: '#FF6600',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              display: 'block',
              wordBreak: 'break-all',
            }}
          >
            {previewName}
          </code>
        </div>

        {/* Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1d21',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <p style={{ color: '#6c757d', fontSize: '0.7rem' }}>Versão</p>
            <p style={{ color: '#F8F9FA', fontSize: '1.1rem', fontWeight: 700 }}>v{nextVersion}</p>
          </div>
          <div
            style={{
              backgroundColor: '#1a1d21',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <p style={{ color: '#6c757d', fontSize: '0.7rem' }}>Criado por</p>
            <p style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600 }}>{userName}</p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              backgroundColor: 'transparent',
              color: '#ADB5BD',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onCreate}
            disabled={creating}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: creating ? '#6c757d' : '#FF6600',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: creating ? 'not-allowed' : 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {creating ? 'Criando...' : 'Criar Release'}
          </button>
        </div>
      </div>
    </div>
  );
}
