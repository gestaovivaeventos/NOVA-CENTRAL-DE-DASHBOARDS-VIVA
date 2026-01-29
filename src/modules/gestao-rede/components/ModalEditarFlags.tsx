/**
 * ModalEditarFlags - Modal para editar flags de franquias
 * Permite adicionar/remover múltiplas flags
 * Flags disponíveis: GOVERNANÇA, NECESSIDADE CAPITAL DE GIRO, TIME CRÍTICO, SÓCIO OPERADOR
 */

import React, { useState, useEffect } from 'react';
import { X, Flag, Users, AlertTriangle, Shield, DollarSign, Check } from 'lucide-react';
import { Franquia, FlagsEstruturais, FlagKey } from '../types';

interface ModalEditarFlagsProps {
  franquia: Franquia;
  isOpen: boolean;
  onClose: () => void;
  onSave: (franquia: Franquia, novasFlags: FlagsEstruturais) => Promise<void>;
}

// Configuração das flags disponíveis - Paleta profissional
const FLAGS_CONFIG: {
  key: FlagKey;
  label: string;
  labelPlanilha: string;
  icon: React.ReactNode;
  cor: string;
  bg: string;
  descricao: string;
}[] = [
  {
    key: 'governanca',
    label: 'Governança',
    labelPlanilha: 'GOVERNANÇA',
    icon: <Shield size={20} />,
    cor: '#7b6b8b',
    bg: '#3d3545',
    descricao: 'Problemas de governança na franquia',
  },
  {
    key: 'necessidadeCapitalGiro',
    label: 'Necessidade Capital de Giro',
    labelPlanilha: 'NECESSIDADE CAPITAL DE GIRO',
    icon: <DollarSign size={20} />,
    cor: '#6b8fa8',
    bg: '#3d4a5a',
    descricao: 'Franquia com necessidade de capital de giro',
  },
  {
    key: 'timeCritico',
    label: 'Time Crítico',
    labelPlanilha: 'TIME CRÍTICO',
    icon: <AlertTriangle size={20} />,
    cor: '#a8956b',
    bg: '#4a4538',
    descricao: 'Time com situação crítica',
  },
  {
    key: 'socioOperador',
    label: 'Sócio Operador',
    labelPlanilha: 'SÓCIO OPERADOR',
    icon: <Users size={20} />,
    cor: '#8b6b6b',
    bg: '#4a3838',
    descricao: 'Franquia com sócio operador',
  },
];

export default function ModalEditarFlags({ franquia, isOpen, onClose, onSave }: ModalEditarFlagsProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState<FlagsEstruturais>({
    socioOperador: false,
    timeCritico: false,
    governanca: false,
    necessidadeCapitalGiro: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Sincronizar com as flags da franquia quando abrir o modal
  useEffect(() => {
    if (isOpen && franquia) {
      setSelectedFlags({ ...franquia.flags });
      setError(null);
    }
  }, [isOpen, franquia]);

  if (!isOpen) return null;

  const handleToggleFlag = (flagKey: FlagKey) => {
    setSelectedFlags(prev => ({
      ...prev,
      [flagKey]: !prev[flagKey],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await onSave(franquia, selectedFlags);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar flags');
    } finally {
      setLoading(false);
    }
  };

  const countSelectedFlags = () => {
    return Object.values(selectedFlags).filter(Boolean).length;
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
        maxWidth: '520px',
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
            <Flag size={24} color="#FF6600" />
            <h3 style={{
              color: '#F8F9FA',
              fontSize: '1.1rem',
              fontWeight: 600,
              margin: 0,
            }}>
              Editar Flags
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
          <div style={{ color: '#F8F9FA', fontSize: '1rem', fontWeight: 600 }}>
            {franquia.nome}
          </div>
        </div>

        {/* Seleção de Flags */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            color: '#adb5bd', 
            fontSize: '0.85rem', 
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Selecione as flags:</span>
            <span style={{ 
              backgroundColor: '#495057', 
              padding: '2px 8px', 
              borderRadius: '10px',
              fontSize: '0.75rem',
            }}>
              {countSelectedFlags()} selecionada(s)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FLAGS_CONFIG.map((flag) => (
              <button
                key={flag.key}
                onClick={() => handleToggleFlag(flag.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  backgroundColor: selectedFlags[flag.key] ? `${flag.cor}22` : '#212529',
                  border: selectedFlags[flag.key] ? `2px solid ${flag.cor}` : '2px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                {/* Ícone da flag */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: selectedFlags[flag.key] ? flag.cor : '#495057',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  transition: 'background-color 0.2s',
                }}>
                  {flag.icon}
                </div>

                {/* Label e descrição */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: selectedFlags[flag.key] ? '#F8F9FA' : '#adb5bd', 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    transition: 'color 0.2s',
                  }}>
                    {flag.label}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                    {flag.descricao}
                  </div>
                </div>

                {/* Checkbox visual */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: selectedFlags[flag.key] ? `2px solid ${flag.cor}` : '2px solid #6c757d',
                  backgroundColor: selectedFlags[flag.key] ? flag.cor : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {selectedFlags[flag.key] && <Check size={14} color="#fff" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(139, 107, 107, 0.2)',
            border: '1px solid #8b6b6b',
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
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button
            onClick={() => setSelectedFlags({
              socioOperador: false,
              timeCritico: false,
              governanca: false,
              necessidadeCapitalGiro: false,
            })}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #6c757d',
              borderRadius: '6px',
              color: '#adb5bd',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Limpar Todas
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
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
              disabled={loading}
              style={{
                padding: '10px 24px',
                backgroundColor: '#FF6600',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Salvando...' : 'Salvar Flags'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exportar a configuração de flags para uso em outros componentes
export { FLAGS_CONFIG };
