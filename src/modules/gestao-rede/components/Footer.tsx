/**
 * Footer - Gestão Rede
 * Rodapé padrão do módulo
 */

import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#1a1d21',
      padding: '20px',
      textAlign: 'center',
      borderTop: '1px solid #333',
      marginTop: '40px',
    }}>
      <p style={{
        color: '#6c757d',
        fontSize: '0.85rem',
        margin: 0,
      }}>
        © {new Date().getFullYear()} Viva Eventos - Gestão Rede | Todos os direitos reservados
      </p>
    </footer>
  );
}
