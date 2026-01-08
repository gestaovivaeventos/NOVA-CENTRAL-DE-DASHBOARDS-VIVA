/**
 * GraficoBarras - Gráfico de barras horizontais
 * Padrão Viva Eventos
 */

import React from 'react';

interface BarraItem {
  nome: string;
  valor: number;
  cor: string;
}

interface GraficoBarrasProps {
  dados: BarraItem[];
  titulo?: string;
  mostrarValores?: boolean;
  mostrarPorcentagem?: boolean;
}

export default function GraficoBarras({ 
  dados, 
  titulo,
  mostrarValores = true,
  mostrarPorcentagem = true
}: GraficoBarrasProps) {
  const total = dados.reduce((acc, item) => acc + item.valor, 0);
  const maxValor = Math.max(...dados.map(d => d.valor));

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      {titulo && (
        <h3 style={{
          color: '#adb5bd',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #555',
          fontFamily: 'Poppins, sans-serif',
        }}>
          {titulo}
        </h3>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {dados.map((item, index) => {
          const porcentagem = total > 0 ? (item.valor / total) * 100 : 0;
          const larguraBarra = maxValor > 0 ? (item.valor / maxValor) * 100 : 0;
          
          return (
            <div key={index}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <span style={{
                  color: '#F8F9FA',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}>
                  {item.nome}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {mostrarValores && (
                    <span style={{
                      color: item.cor,
                      fontSize: '1rem',
                      fontWeight: 700,
                      fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    }}>
                      {item.valor}
                    </span>
                  )}
                  {mostrarPorcentagem && (
                    <span style={{
                      color: '#6c757d',
                      fontSize: '0.8rem',
                    }}>
                      ({porcentagem.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#212529',
                borderRadius: '6px',
                height: '24px',
                overflow: 'hidden',
              }}>
                <div style={{
                  backgroundColor: item.cor,
                  height: '100%',
                  width: `${larguraBarra}%`,
                  borderRadius: '6px',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: larguraBarra > 10 ? '8px' : '0',
                }}>
                  {larguraBarra > 15 && (
                    <span style={{
                      color: '#000',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {item.valor}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
