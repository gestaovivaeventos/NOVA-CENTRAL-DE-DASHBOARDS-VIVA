/**
 * CardRisco - Card para exibição de riscos regulatórios
 */

import React, { useState } from 'react';
import { AlertTriangle, Shield, ChevronDown, ChevronUp, Calendar, Building } from 'lucide-react';
import type { RiscoRegulatorio } from '../types';

interface CardRiscoProps {
  risco: RiscoRegulatorio;
}

export default function CardRisco({ risco }: CardRiscoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeveridadeConfig = () => {
    switch (risco.severidade) {
      case 'alta':
        return { color: '#EF4444', label: 'Alta Severidade', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'media':
        return { color: '#F59E0B', label: 'Média Severidade', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'baixa':
        return { color: '#10B981', label: 'Baixa Severidade', bg: 'rgba(16, 185, 129, 0.1)' };
      default:
        return { color: '#6B7280', label: 'Severidade Indefinida', bg: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  const getStatusConfig = () => {
    switch (risco.status) {
      case 'monitorando':
        return { color: '#3B82F6', label: 'Monitorando' };
      case 'em_andamento':
        return { color: '#F59E0B', label: 'Em Andamento' };
      case 'aprovado':
        return { color: '#EF4444', label: 'Aprovado' };
      case 'arquivado':
        return { color: '#6B7280', label: 'Arquivado' };
      default:
        return { color: '#6B7280', label: 'Indefinido' };
    }
  };

  const getProbabilidadeColor = () => {
    switch (risco.probabilidade) {
      case 'alta': return '#EF4444';
      case 'media': return '#F59E0B';
      case 'baixa': return '#10B981';
      default: return '#6B7280';
    }
  };

  const severidade = getSeveridadeConfig();
  const status = getStatusConfig();

  return (
    <div
      style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        border: '1px solid #495057',
        borderLeft: `4px solid ${severidade.color}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color={severidade.color} />
            <h4 style={{ color: '#F8F9FA', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              {risco.titulo}
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: severidade.bg,
                color: severidade.color,
                fontWeight: 500,
              }}
            >
              {severidade.label}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: `${status.color}20`,
                color: status.color,
                fontWeight: 500,
              }}
            >
              {status.label}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: `${getProbabilidadeColor()}20`,
                color: getProbabilidadeColor(),
                fontWeight: 500,
              }}
            >
              Prob. {risco.probabilidade}
            </span>
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronUp size={20} color="#6C757D" />
        ) : (
          <ChevronDown size={20} color="#6C757D" />
        )}
      </div>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #495057' }}>
          {/* Descrição */}
          <p style={{ color: '#ADB5BD', fontSize: '0.875rem', lineHeight: 1.6, margin: '16px 0' }}>
            {risco.descricao}
          </p>

          {/* Metadados */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={14} color="#6C757D" />
              <span style={{ color: '#6C757D', fontSize: '0.75rem' }}>Órgão:</span>
              <span style={{ color: '#ADB5BD', fontSize: '0.75rem', fontWeight: 500 }}>{risco.orgao_regulador}</span>
            </div>
            {risco.data_limite && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="#6C757D" />
                <span style={{ color: '#6C757D', fontSize: '0.75rem' }}>Prazo:</span>
                <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 500 }}>
                  {new Date(risco.data_limite).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {/* Ações de mitigação */}
          {risco.acoes_mitigacao && risco.acoes_mitigacao.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Shield size={14} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600 }}>Ações de Mitigação</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {risco.acoes_mitigacao.map((acao, idx) => (
                  <li key={idx} style={{ color: '#ADB5BD', fontSize: '0.8rem', marginBottom: '4px' }}>
                    {acao}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
