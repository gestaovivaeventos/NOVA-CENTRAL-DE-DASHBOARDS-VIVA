/**
 * Componente Loading - Indicador de carregamento
 * Estilo idêntico ao PEX para consistência visual
 */

import React from 'react';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" 
          style={{ borderColor: '#FF6600' }}
        />
        <p className="mt-4 text-lg" style={{ color: '#adb5bd' }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default Loader;
