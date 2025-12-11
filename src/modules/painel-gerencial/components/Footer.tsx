/**
 * Footer - Componente de rodapé com informações de desenvolvimento
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      position: 'relative',
      width: '100%',
      padding: '24px 24px 16px 24px',
      marginTop: '40px',
      textAlign: 'left',
      background: 'none',
      border: 'none',
      fontSize: '0.75rem',
      color: '#6c757d',
      fontFamily: 'Poppins, sans-serif',
      letterSpacing: '0.3px',
      opacity: 0.8
    }}>
      📊 Developed by Gestão de Dados - VIVA Eventos Brasil 2025
    </footer>
  );
};

export default Footer;
