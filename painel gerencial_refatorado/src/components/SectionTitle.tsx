import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, icon }) => {
  return (
    <div className="mb-6">
      <div className="border-b-2 border-orange-500 pb-3">
        <h2 
          className="flex items-center gap-2"
          style={{
            color: '#adb5bd',
            fontSize: '1.2rem',
            letterSpacing: '0.06em',
            fontFamily: "'Poppins', Arial, sans-serif",
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        {subtitle && (
          <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default SectionTitle;
