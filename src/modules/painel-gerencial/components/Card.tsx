import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  headerActions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  className = '',
  headerActions 
}) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title">{title}</h3>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

export default Card;
