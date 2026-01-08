/**
 * HierarquiaTree - Visualização em árvore hierárquica
 * Mostra a estrutura das franquias de forma visual
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { TreeNode, Franquia } from '../types';

interface HierarquiaTreeProps {
  data: TreeNode;
  onNodeClick?: (node: TreeNode) => void;
  expandido?: boolean;
  expandirApenasAtivas?: boolean;
}

const getIconeNode = (id: string) => {
  switch (id) {
    case 'root':
      return <Building2 size={20} />;
    case 'ativas':
      return <CheckCircle size={18} />;
    case 'inativas':
      return <AlertCircle size={18} />;
    case 'implantacao':
      return <Clock size={16} />;
    case 'operacao':
      return <Zap size={16} />;
    default:
      return null;
  }
};

function TreeNodeComponent({ 
  node, 
  level = 0, 
  onNodeClick,
  defaultExpanded = false,
  expandirApenasAtivas = false
}: { 
  node: TreeNode; 
  level?: number; 
  onNodeClick?: (node: TreeNode) => void;
  defaultExpanded?: boolean;
  expandirApenasAtivas?: boolean;
}) {
  // Determinar estado inicial de expansão
  const getEstadoInicial = () => {
    if (defaultExpanded) return true;
    if (expandirApenasAtivas) {
      // Root sempre expandido
      if (level === 0) return true;
      // "Ativas" expandido no primeiro nível
      if (level === 1 && node.id === 'ativas') return true;
      // Resto fechado
      return false;
    }
    return level < 2;
  };
  
  const [isExpanded, setIsExpanded] = useState(getEstadoInicial());
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = level * 24;

  return (
    <div style={{ marginBottom: level === 0 ? '8px' : '4px' }}>
      <div 
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onNodeClick?.(node);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          paddingLeft: `${paddingLeft + 16}px`,
          backgroundColor: level === 0 ? '#2d3238' : 'transparent',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderLeft: level > 0 ? `3px solid ${node.cor}` : 'none',
          marginLeft: level > 0 ? '8px' : '0',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#3d4248';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = level === 0 ? '#2d3238' : 'transparent';
        }}
      >
        {/* Ícone de expansão */}
        {hasChildren ? (
          <span style={{ marginRight: '8px', color: '#adb5bd' }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        ) : (
          <span style={{ marginRight: '8px', width: '18px' }} />
        )}

        {/* Ícone do nó */}
        <span style={{ marginRight: '10px', color: node.cor }}>
          {getIconeNode(node.id)}
        </span>

        {/* Nome e valor */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            color: '#F8F9FA',
            fontSize: level === 0 ? '1.1rem' : '0.95rem',
            fontWeight: level === 0 ? 600 : 500,
            fontFamily: 'Poppins, sans-serif',
          }}>
            {node.nome}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Badge com valor */}
            <span style={{
              backgroundColor: node.cor,
              color: '#000',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: "'Orbitron', 'Poppins', sans-serif",
              minWidth: '40px',
              textAlign: 'center',
            }}>
              {node.valor}
            </span>

            {/* Porcentagem */}
            {level > 0 && (
              <span style={{
                color: '#6c757d',
                fontSize: '0.8rem',
                minWidth: '50px',
                textAlign: 'right',
              }}>
                ({node.porcentagem.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filhos */}
      {hasChildren && isExpanded && (
        <div style={{ marginTop: '4px' }}>
          {node.children!.map((child) => (
            <TreeNodeComponent 
              key={child.id} 
              node={child} 
              level={level + 1}
              onNodeClick={onNodeClick}
              defaultExpanded={defaultExpanded}
              expandirApenasAtivas={expandirApenasAtivas}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarquiaTree({ data, onNodeClick, expandido = false, expandirApenasAtivas = false }: HierarquiaTreeProps) {
  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      <h3 style={{
        color: '#adb5bd',
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #555',
        fontFamily: 'Poppins, sans-serif',
      }}>
        Hierarquia da Rede
      </h3>
      
      <TreeNodeComponent 
        node={data} 
        onNodeClick={onNodeClick}
        defaultExpanded={expandido}
        expandirApenasAtivas={expandirApenasAtivas}
      />
    </div>
  );
}
