/**
 * ModalAlterarSaude - Modal para alterar status UTI de franquias
 * Permite mover franquias de UTI para UTI RECUPERAÇÃO ou UTI REPASSE
 */

import React, { useState } from 'react';
import { X, HeartPulse, RefreshCw, ArrowRight } from 'lucide-react';
import { Franquia, SaudeFranquia } from '../types';

interface ModalAlterarSaudeProps {
  franquia: Franquia;
  isOpen: boolean;
  onClose: () => void;
  onSave: (franquia: Franquia, novoStatus: 'UTI_RECUPERACAO' | 'UTI_REPASSE') => Promise<void>;
}

export default function ModalAlterarSaude({ franquia, isOpen, onClose, onSave }: ModalAlterarSaudeProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'UTI_RECUPERACAO' | 'UTI_REPASSE' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedStatus) return;

    setLoading(true);
    setError(null);

    try {
      await onSave(franquia, selectedStatus);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alteração');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: SaudeFranquia) => {
    switch (status) {
      case 'UTI': return 'UTI';
      case 'UTI_RECUPERACAO': return 'UTI Recuperação';
      case 'UTI_REPASSE': return 'UTI Repasse';
      default: return status;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '2px solid #FF6600',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HeartPulse size={24} color="#c0392b" />
            <h3 style={{
              color: '#F8F9FA',
              fontSize: '1.1rem',
              fontWeight: 600,
              margin: 0,
            }}>
              Alterar Status UTI
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Franquia Info */}
        <div style={{
          backgroundColor: '#212529',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ color: '#6c757d', fontSize: '0.75rem', marginBottom: '4px' }}>
            Franquia
          </div>
          <div style={{ color: '#F8F9FA', fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
            {franquia.nome}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>Status Atual: </span>
              <span style={{ color: '#c0392b', fontSize: '0.85rem', fontWeight: 500 }}>
                {getStatusLabel(franquia.saude)}
              </span>
            </div>
            <div>
              <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>Pontuação PEX: </span>
              <span style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 500 }}>
                {franquia.pontuacaoPex.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Opções */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#adb5bd', fontSize: '0.85rem', marginBottom: '12px' }}>
            Selecione o novo status:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* UTI Recuperação */}
            <button
              onClick={() => setSelectedStatus('UTI_RECUPERACAO')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: selectedStatus === 'UTI_RECUPERACAO' ? '#3d2a2a' : '#212529',
                border: selectedStatus === 'UTI_RECUPERACAO' ? '2px solid #943126' : '2px solid #3a3d41',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#943126',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RefreshCw size={20} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#F8F9FA', fontWeight: 600, fontSize: '0.9rem' }}>
                  UTI Recuperação
                </div>
                <div style={{ color: '#adb5bd', fontSize: '0.75rem' }}>
                  Franquia com plano de ação para recuperação
                </div>
              </div>
            </button>

            {/* UTI Repasse */}
            <button
              onClick={() => setSelectedStatus('UTI_REPASSE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: selectedStatus === 'UTI_REPASSE' ? '#2d1a20' : '#212529',
                border: selectedStatus === 'UTI_REPASSE' ? '2px solid #6c2134' : '2px solid #3a3d41',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#6c2134',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ArrowRight size={20} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#F8F9FA', fontWeight: 600, fontSize: '0.9rem' }}>
                  UTI Repasse
                </div>
                <div style={{ color: '#adb5bd', fontSize: '0.75rem' }}>
                  Franquia em processo de repasse para novo franqueado
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(192, 57, 43, 0.2)',
            border: '1px solid #c0392b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#adb5bd',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        {/* Ações */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #6c757d',
              borderRadius: '6px',
              color: '#adb5bd',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedStatus || loading}
            style={{
              padding: '10px 24px',
              backgroundColor: selectedStatus ? (selectedStatus === 'UTI_RECUPERACAO' ? '#943126' : '#6c2134') : '#6c757d',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: selectedStatus && !loading ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem',
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Salvando...' : 'Confirmar Alteração'}
          </button>
        </div>
      </div>
    </div>
  );
}
