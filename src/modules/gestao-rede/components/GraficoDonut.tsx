/**
 * GraficoDonut - Gráfico de rosca para visualização de distribuição
 * Padrão Viva Eventos
 */

import React from 'react';

interface SegmentoDonut {
  nome: string;
  valor: number;
  cor: string;
}

interface GraficoDonutProps {
  dados: SegmentoDonut[];
  titulo?: string;
  valorCentral?: string | number;
  labelCentral?: string;
  tamanho?: number;
}

export default function GraficoDonut({ 
  dados, 
  titulo,
  valorCentral,
  labelCentral,
  tamanho = 200
}: GraficoDonutProps) {
  const total = dados.reduce((acc, item) => acc + item.valor, 0);
  const raio = tamanho / 2;
  const espessura = 30;
  const raioInterno = raio - espessura;
  
  // Calcular segmentos do gráfico
  let anguloAcumulado = -90; // Começar do topo
  
  const segmentos = dados.map((item) => {
    const porcentagem = total > 0 ? (item.valor / total) * 100 : 0;
    const angulo = (porcentagem / 100) * 360;
    const anguloInicial = anguloAcumulado;
    anguloAcumulado += angulo;
    
    return {
      ...item,
      porcentagem,
      anguloInicial,
      anguloFinal: anguloAcumulado,
    };
  });

  // Função para criar path SVG de um arco
  const criarArco = (anguloInicial: number, anguloFinal: number, raioExterno: number, raioInt: number) => {
    const startAngleRad = (anguloInicial * Math.PI) / 180;
    const endAngleRad = (anguloFinal * Math.PI) / 180;
    
    const x1Ext = raio + raioExterno * Math.cos(startAngleRad);
    const y1Ext = raio + raioExterno * Math.sin(startAngleRad);
    const x2Ext = raio + raioExterno * Math.cos(endAngleRad);
    const y2Ext = raio + raioExterno * Math.sin(endAngleRad);
    
    const x1Int = raio + raioInt * Math.cos(endAngleRad);
    const y1Int = raio + raioInt * Math.sin(endAngleRad);
    const x2Int = raio + raioInt * Math.cos(startAngleRad);
    const y2Int = raio + raioInt * Math.sin(startAngleRad);
    
    const largeArcFlag = anguloFinal - anguloInicial > 180 ? 1 : 0;
    
    return `
      M ${x1Ext} ${y1Ext}
      A ${raioExterno} ${raioExterno} 0 ${largeArcFlag} 1 ${x2Ext} ${y2Ext}
      L ${x1Int} ${y1Int}
      A ${raioInt} ${raioInt} 0 ${largeArcFlag} 0 ${x2Int} ${y2Int}
      Z
    `;
  };

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
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #555',
          fontFamily: 'Poppins, sans-serif',
        }}>
          {titulo}
        </h3>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        {/* SVG do gráfico */}
        <div style={{ position: 'relative', width: tamanho, height: tamanho }}>
          <svg width={tamanho} height={tamanho}>
            {segmentos.map((seg, index) => (
              seg.valor > 0 && (
                <path
                  key={index}
                  d={criarArco(seg.anguloInicial, seg.anguloFinal, raio - 5, raioInterno)}
                  fill={seg.cor}
                  style={{
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <title>{`${seg.nome}: ${seg.valor} (${seg.porcentagem.toFixed(1)}%)`}</title>
                </path>
              )
            ))}
          </svg>
          
          {/* Valor central */}
          {valorCentral !== undefined && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{
                color: '#FF6600',
                fontSize: '2rem',
                fontWeight: 700,
                fontFamily: "'Orbitron', 'Poppins', sans-serif",
                lineHeight: 1,
              }}>
                {valorCentral}
              </div>
              {labelCentral && (
                <div style={{
                  color: '#adb5bd',
                  fontSize: '0.75rem',
                  marginTop: '4px',
                  textTransform: 'uppercase',
                }}>
                  {labelCentral}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {segmentos.map((seg, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: seg.cor,
              }} />
              <span style={{
                color: '#F8F9FA',
                fontSize: '0.9rem',
                minWidth: '100px',
              }}>
                {seg.nome}
              </span>
              <span style={{
                color: '#adb5bd',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                {seg.valor}
              </span>
              <span style={{
                color: '#6c757d',
                fontSize: '0.8rem',
              }}>
                ({seg.porcentagem.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
