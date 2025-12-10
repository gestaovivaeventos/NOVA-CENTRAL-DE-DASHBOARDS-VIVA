'use client';

import React from 'react';

interface CardProps {
  title?: string;
  value?: string | number;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  value,
  subtitle,
  className = '',
  children,
  onClick
}) => {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {title && <h3 className="card-title">{title}</h3>}
      {value !== undefined && <p className="card-value">{value}</p>}
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
};

export default Card;
