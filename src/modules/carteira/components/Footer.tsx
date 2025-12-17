/**
 * Componente Footer para o módulo Carteira
 * Baseado no padrão do módulo de Vendas
 */

import React from 'react';

interface FooterProps {
  sidebarCollapsed?: boolean;
}

export default function Footer({ sidebarCollapsed = false }: FooterProps) {
  return (
    <footer
      style={{
        marginTop: '40px',
        padding: '24px 24px 16px 24px',
        borderTop: '1px solid #333',
        textAlign: 'center',
        marginLeft: sidebarCollapsed ? '60px' : '300px',
        transition: 'margin-left 0.3s',
      }}
    >
      <p 
        style={{ 
          color: '#6c757d', 
          fontSize: '0.8rem',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        📊 Developed by Gestão de Dados - VIVA Eventos Brasil 2025
      </p>
    </footer>
  );
}
