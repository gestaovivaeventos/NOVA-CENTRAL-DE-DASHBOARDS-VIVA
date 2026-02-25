/**
 * Kanban Board - Visualização de colunas por status
 * Coluna "Descartada" inicia minimizada e pode ser expandida
 */

import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { KanbanStatus, KanbanColumn } from '../types';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  children: (status: KanbanStatus) => React.ReactNode;
  counts: Record<KanbanStatus, number>;
  onDrop?: (itemId: string, newStatus: KanbanStatus) => void;
}

export default function KanbanBoard({ columns, children, counts, onDrop }: KanbanBoardProps) {
  const [descartadaExpanded, setDescartadaExpanded] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: KanbanStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Só limpa se saiu da coluna de verdade (não para filhos)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, columnId: KanbanStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && onDrop) {
      onDrop(itemId, columnId);
    }
  }, [onDrop]);

  const mainColumns = columns.filter(c => c.id !== 'descartada');
  const descartadaColumn = columns.find(c => c.id === 'descartada');
  const descartadaCount = descartadaColumn ? (counts[descartadaColumn.id] || 0) : 0;

  return (
    <div style={{ display: 'flex', gap: '12px', minHeight: '300px' }}>
      {/* Colunas principais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${mainColumns.length}, 1fr)`,
          gap: '12px',
          flex: 1,
          minWidth: 0,
        }}
      >
        {mainColumns.map((column) => (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            style={{
              backgroundColor: '#1a1d21',
              borderRadius: '12px',
              border: dragOverColumn === column.id
                ? `2px dashed ${column.color}`
                : `1px solid ${column.color}30`,
              overflow: 'hidden',
              minWidth: 0,
              transition: 'border 0.2s, background-color 0.2s',
              ...(dragOverColumn === column.id ? { backgroundColor: `${column.color}08` } : {}),
            }}
          >
            {/* Header da coluna */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: `2px solid ${column.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: `${column.color}10`,
              }}
            >
              <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: column.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: column.color,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {column.label}
                </span>
              </div>
              <span
                style={{
                  backgroundColor: `${column.color}20`,
                  color: column.color,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '20px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {counts[column.id] || 0}
              </span>
            </div>

            {/* Cards */}
            <div
              style={{
                padding: '10px',
                minHeight: '200px',
                maxHeight: '600px',
                overflowY: 'auto',
              }}
            >
              {children(column.id)}
              {(counts[column.id] || 0) === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 8px',
                    color: '#4b5563',
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                  }}
                >
                  Nenhum item
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Coluna Descartada - minimizável */}
      {descartadaColumn && (
        <div
          style={{
            backgroundColor: '#1a1d21',
            borderRadius: '12px',
            border: dragOverColumn === 'descartada'
              ? `2px dashed ${descartadaColumn.color}`
              : `1px solid ${descartadaColumn.color}30`,
            overflow: 'hidden',
            width: descartadaExpanded ? '280px' : '44px',
            minWidth: descartadaExpanded ? '280px' : '44px',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
        >
          {descartadaExpanded ? (
            <div
              onDragOver={(e) => handleDragOver(e, 'descartada')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'descartada')}
              style={{
                height: '100%',
                ...(dragOverColumn === 'descartada' ? { backgroundColor: `${descartadaColumn.color}08` } : {}),
              }}
            >
              {/* Header expandido */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: `2px solid ${descartadaColumn.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: `${descartadaColumn.color}10`,
                }}
              >
                <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: descartadaColumn.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: descartadaColumn.color,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontFamily: "'Poppins', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {descartadaColumn.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      backgroundColor: `${descartadaColumn.color}20`,
                      color: descartadaColumn.color,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      minWidth: '20px',
                      textAlign: 'center',
                    }}
                  >
                    {descartadaCount}
                  </span>
                  <button
                    onClick={() => setDescartadaExpanded(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: descartadaColumn.color,
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Minimizar"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div
                style={{
                  padding: '10px',
                  minHeight: '200px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                }}
              >
                {children(descartadaColumn.id)}
                {descartadaCount === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 8px',
                      color: '#4b5563',
                      fontSize: '0.7rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Nenhum item
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Header minimizado - vertical */
            <button
              onClick={() => setDescartadaExpanded(true)}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '200px',
                backgroundColor: `${descartadaColumn.color}08`,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 4px',
                gap: '8px',
              }}
              title="Expandir Descartada"
            >
              <ChevronLeft size={14} color={descartadaColumn.color} />
              <span
                style={{
                  backgroundColor: `${descartadaColumn.color}20`,
                  color: descartadaColumn.color,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}
              >
                {descartadaCount}
              </span>
              <span
                style={{
                  color: descartadaColumn.color,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                }}
              >
                {descartadaColumn.label}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
