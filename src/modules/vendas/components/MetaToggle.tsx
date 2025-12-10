/**
 * Componente MetaToggle - Seletor de tipo de meta (Super Meta / Meta Interna)
 */

import React from 'react';
import { META_CONFIG } from '@/modules/vendas/config/app.config';

interface MetaToggleProps {
  isMetaInterna: boolean;
  onChange: (isMetaInterna: boolean) => void;
}

export default function MetaToggle({ isMetaInterna, onChange }: MetaToggleProps) {
  return (
    <div className="bg-dark-secondary rounded-lg p-4 border border-dark-border">
      <h2 className="section-title">CONFIGURAÇÃO DE METAS</h2>
      
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {/* Label Esquerda */}
        <span 
          className={`text-sm font-medium transition-colors ${!isMetaInterna ? 'text-primary-500' : 'text-text-muted'}`}
        >
          🚀 Super Meta
        </span>
        
        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isMetaInterna}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div 
            className="w-14 h-7 rounded-full peer transition-colors duration-300"
            style={{
              background: isMetaInterna 
                ? 'linear-gradient(180deg, #ff8a33 0%, #FF6600 50%, #e65500 100%)'
                : '#4B5563',
            }}
          >
            <div 
              className="absolute top-0.5 left-0.5 bg-white w-6 h-6 rounded-full transition-transform duration-300"
              style={{
                transform: isMetaInterna ? 'translateX(28px)' : 'translateX(0)',
              }}
            />
          </div>
        </label>
        
        {/* Label Direita */}
        <span 
          className={`text-sm font-medium transition-colors ${isMetaInterna ? 'text-primary-500' : 'text-text-muted'}`}
        >
          🎯 Meta Interna
        </span>
      </div>
      
      {/* Descrição */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium text-primary-500">
          {isMetaInterna ? META_CONFIG.LABELS.META_INTERNA : META_CONFIG.LABELS.SUPER_META}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {isMetaInterna 
            ? 'Meta ajustada para controle interno da empresa com 85% dos valores originais'
            : 'Metas originais das bases de dados para controle das franquias'
          }
        </p>
      </div>
    </div>
  );
}

