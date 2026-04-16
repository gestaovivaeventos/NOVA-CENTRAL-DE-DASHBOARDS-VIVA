/**
 * Modal para editar um subgrupo (nome, grupo pai, ícone, ordem, ativo)
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import IconSelect from './IconSelect';

export interface SubgrupoInfo {
  nome: string;
  grupo: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

interface EditSubgrupoModalProps {
  isOpen: boolean;
  onClose: () => void;
  subgrupoNome: string | null;
  subgrupoGrupo: string | null;
  subgruposDaPlanilha: SubgrupoInfo[];
  gruposExistentes: string[];
  onSave: (subgrupoOriginal: string, grupoPaiOriginal: string, updates: { nome?: string; novoGrupo?: string; icone?: string; ordem?: number; ativo?: boolean }) => Promise<boolean>;
}

export default function EditSubgrupoModal({
  isOpen,
  onClose,
  subgrupoNome,
  subgrupoGrupo,
  subgruposDaPlanilha,
  gruposExistentes,
  onSave,
}: EditSubgrupoModalProps) {
  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState('');
  const [icone, setIcone] = useState('folder');
  const [ordem, setOrdem] = useState(1);
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen && subgrupoNome && subgrupoGrupo) {
      const info = subgruposDaPlanilha.find(
        (s) =>
          s.nome.toLowerCase() === subgrupoNome.toLowerCase() &&
          s.grupo.toLowerCase() === subgrupoGrupo.toLowerCase()
      );
      if (info) {
        setNome(info.nome);
        setGrupo(info.grupo);
        setIcone(info.icone);
        setOrdem(info.ordem);
        setAtivo(info.ativo);
      } else {
        setNome(subgrupoNome);
        setGrupo(subgrupoGrupo);
        setIcone('folder');
        setOrdem(99);
        setAtivo(true);
      }
      setFeedback(null);
      setSaving(false);
    }
  }, [isOpen, subgrupoNome, subgrupoGrupo, subgruposDaPlanilha]);

  const handleSave = async () => {
    if (!subgrupoNome || !subgrupoGrupo || !nome.trim()) return;

    setSaving(true);
    setFeedback(null);

    const ok = await onSave(subgrupoNome, subgrupoGrupo, {
      nome: nome.trim(),
      novoGrupo: grupo,
      icone,
      ordem,
      ativo,
    });

    setSaving(false);

    if (ok) {
      setFeedback({ type: 'success', msg: 'Subgrupo atualizado!' });
      setTimeout(() => onClose(), 600);
    } else {
      setFeedback({ type: 'error', msg: 'Erro ao salvar' });
    }
  };

  if (!isOpen || !subgrupoNome) return null;

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
    width: '100%',
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
          maxWidth: '500px',
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
          <div>
            <h2
              style={{
                color: '#F8F9FA',
                fontSize: '1.1rem',
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Editar Subgrupo
            </h2>
            <p style={{ color: '#6c757d', fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif' }}>
              {subgrupoNome} — {subgrupoGrupo}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome do Subgrupo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#FF6600'; }}
              onBlur={(e) => { e.target.style.borderColor = '#444'; }}
            />
          </div>

          {/* Grupo pai */}
          <div>
            <label style={labelStyle}>Grupo Pai</label>
            <div style={{ position: 'relative' }}>
              <select
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  cursor: 'pointer',
                  paddingRight: 36,
                }}
              >
                {gruposExistentes.map((g) => (
                  <option key={g} value={g} style={{ color: '#F8F9FA', backgroundColor: '#1a1d21' }}>
                    {g}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                color="#6c757d"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Ícone */}
          <div>
            <label style={labelStyle}>Ícone</label>
            <IconSelect value={icone} onChange={setIcone} />
          </div>

          {/* Ordem + Ativo */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Ordem no Grupo</label>
              <input
                type="number"
                min={1}
                max={99}
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value, 10) || 1)}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#FF6600'; }}
                onBlur={(e) => { e.target.style.borderColor = '#444'; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <button
                type="button"
                onClick={() => setAtivo(!ativo)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${ativo ? '#10b981' : '#ef4444'}`,
                  backgroundColor: ativo ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: ativo ? '#10b981' : '#ef4444',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: ativo ? '#10b981' : '#ef4444',
                  }}
                />
                {ativo ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            style={{
              margin: '0 24px 16px',
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

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #333',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #444',
              backgroundColor: 'transparent',
              color: '#6c757d',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !nome.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: saving ? '#4b5563' : '#FF6600',
              color: '#fff',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
