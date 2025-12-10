import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer 
      className="bg-dark-secondary border-t border-dark-border px-6 py-4 mt-auto"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <div className="text-center dashboard-footer">
        <p>© {new Date().getFullYear()} - Painel Gerencial</p>
      </div>
    </footer>
  );
};

export default Footer;
