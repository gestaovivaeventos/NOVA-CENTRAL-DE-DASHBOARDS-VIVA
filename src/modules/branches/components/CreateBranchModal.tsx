/**
 * Modal para criar nova Ramificação (Branch)
 * Suporta seleção de módulo existente ou criação de novo módulo
 */

import React, { useState } from 'react';
import { X, GitBranch, PlusCircle } from 'lucide-react';
import { MODULOS_CENTRAL } from '../types';
import { gerarNomeBranch, getDataAtual } from '../utils';

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (modulo: string, descricao: string) => Promise<void>;
  creating: boolean;
  releaseVersao: number;
  userLogin: string;
  userName: string;
}

export default function CreateBranchModal({
  isOpen,
  onClose,
  onCreate,
  creating,
  releaseVersao,
  userLogin,
  userName,
}: CreateBranchModalProps) {
  const [modulo, setModulo] = useState('');
  const [novoModulo, setNovoModulo] = useState('');
  const [isNovoModulo, setIsNovoModulo] = useState(false);
  const [descricao, setDescricao] = useState('');

  if (!isOpen) return null;

  const data = getDataAtual();
  const moduloFinal = isNovoModulo ? novoModulo.trim().toLowerCase().replace(/\s+/g, '-') : modulo;
  const previewName = moduloFinal
    ? gerarNomeBranch(userLogin, releaseVersao, moduloFinal, data)
    : `${userLogin}_r_v${releaseVersao}/[selecione_modulo]/${data}`;

  const handleCreate = async () => {
    if (!moduloFinal) return;
    await onCreate(moduloFinal, descricao);
    setModulo('');
    setNovoModulo('');
    setIsNovoModulo(false);
    setDescricao('');
  };

  const handleModuloChange = (value: string) => {
    if (value === '__novo__') {
      setIsNovoModulo(true);
      setModulo('');
    } else {
      setIsNovoModulo(false);
      setModulo(value);
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#2d3239',
          borderRadius: '16px',
          border: '1px solid #3b82f6',
          padding: '28px',
          width: '90%',
          maxWidth: '550px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              style={{
                backgroundColor: 'rgba(59,130,246,0.15)',
                padding: '8px',
                borderRadius: '10px',
              }}
            >
              <GitBranch size={22} color="#3b82f6" />
            </div>
            <div>
              <h2
                style={{
                  color: '#F8F9FA',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Nova Ramificação
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                Release v{releaseVersao}
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
            <X size={20} />
          </button>
        </div>

        {/* Preview do nome */}
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
              color: '#3b82f6',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              display: 'block',
              wordBreak: 'break-all',
            }}
          >
            {previewName}
          </code>
        </div>

        {/* Seletor de módulo */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              color: '#ADB5BD',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'block',
              marginBottom: '6px',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Módulo *
          </label>
          <select
            value={isNovoModulo ? '__novo__' : modulo}
            onChange={(e) => handleModuloChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1a1d21',
              border: (modulo || isNovoModulo) ? '1px solid #3b82f6' : '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#F8F9FA',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <option value="">Selecione o módulo...</option>
            {MODULOS_CENTRAL.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
            <option value="__novo__">+ Novo módulo...</option>
          </select>

          {/* Campo para novo módulo */}
          {isNovoModulo && (
            <div style={{ marginTop: '10px' }}>
              <div className="flex items-center gap-2 mb-2">
                <PlusCircle size={14} color="#3b82f6" />
                <span style={{ color: '#ADB5BD', fontSize: '0.75rem', fontWeight: 600 }}>
                  Nome do novo módulo
                </span>
              </div>
              <input
                type="text"
                value={novoModulo}
                onChange={(e) => setNovoModulo(e.target.value)}
                placeholder="Ex: meu-novo-modulo"
                style={{
                  width: '100%',
                  backgroundColor: '#1a1d21',
                  border: novoModulo.trim() ? '1px solid #3b82f6' : '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#F8F9FA',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'Poppins, sans-serif',
                }}
                autoFocus
              />
              {novoModulo.trim() && (
                <p style={{ color: '#6c757d', fontSize: '0.7rem', marginTop: '4px' }}>
                  Será registrado como: <code style={{ color: '#3b82f6' }}>{novoModulo.trim().toLowerCase().replace(/\s+/g, '-')}</code>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Descrição */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              color: '#ADB5BD',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'block',
              marginBottom: '6px',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que será feito nessa branch..."
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#1a1d21',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#F8F9FA',
              fontSize: '0.85rem',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'Poppins, sans-serif',
            }}
          />
        </div>

        {/* Info do criador */}
        <div
          style={{
            backgroundColor: '#1a1d21',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '20px',
            display: 'flex',
            gap: '16px',
          }}
        >
          <div>
            <p style={{ color: '#6c757d', fontSize: '0.65rem' }}>Criado por</p>
            <p style={{ color: '#F8F9FA', fontSize: '0.8rem', fontWeight: 600 }}>{userName}</p>
          </div>
          <div>
            <p style={{ color: '#6c757d', fontSize: '0.65rem' }}>Data</p>
            <p style={{ color: '#F8F9FA', fontSize: '0.8rem', fontWeight: 600 }}>{data}</p>
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
            onClick={handleCreate}
            disabled={creating || !moduloFinal}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: creating || !moduloFinal ? '#6c757d' : '#3b82f6',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: creating || !moduloFinal ? 'not-allowed' : 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {creating ? 'Criando...' : 'Criar Ramificação'}
          </button>
        </div>
      </div>
    </div>
  );
}
