/**
 * Componente Card - Container genérico
 */

import React from 'react';

interface CardProps {
  titulo?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ titulo, children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {titulo && <h2 className="card-title">{titulo}</h2>}
      {children}
    </div>
  );
}

