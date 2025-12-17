/**
 * Componente Loading para o módulo Carteira
 * Baseado no padrão do módulo de Vendas
 */

import React from 'react';

interface LoadingProps {
  mensagem?: string;
}

export default function Loading({ mensagem = 'Carregando dados...' }: LoadingProps) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#212529' }}
    >
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto"
          style={{ borderColor: '#FF6600' }}
        />
        <p 
          className="mt-4 text-lg"
          style={{ color: '#adb5bd', fontFamily: "'Poppins', sans-serif" }}
        >
          {mensagem}
        </p>
      </div>
    </div>
  );
}
