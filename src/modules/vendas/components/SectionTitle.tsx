/**
 * Componente SectionTitle - Título de seção padronizado
 * Replica o estilo original: fonte Poppins, cor cinza, linha laranja abaixo
 */

import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  indicator?: string;
  className?: string;
}

export default function SectionTitle({ children, indicator, className = '' }: SectionTitleProps) {
  return (
    <h2 className={`section-title ${className}`}>
      {children}
      {indicator && (
        <span className="section-title-highlight"> ({indicator})</span>
      )}
    </h2>
  );
}

