/**
 * Componente de Funil Horizontal com formato de setas
 * Indicadores Operacionais do Funil com Taxas de Conversão
 */

import React from 'react';

interface FunilIndicador {
  titulo: string;
  valor: number;
}

interface FunilHorizontalProps {
  indicadores: FunilIndicador[];
  leadsPerdidos: number;
  leadsDescartados: number;
}

// Função para calcular a taxa de conversão entre duas fases
const calcularTaxaConversao = (valorAtual: number, valorAnterior: number): number => {
  if (valorAnterior === 0) return 0;
  return (valorAtual / valorAnterior) * 100;
};

export const FunilHorizontal: React.FC<FunilHorizontalProps> = ({
  indicadores,
  leadsPerdidos,
  leadsDescartados,
}) => {
  // Cores gradiente para cada posição do funil (do mais claro ao mais escuro)
  const coresFunil = [
    'linear-gradient(135deg, #FFE082 0%, #FFCC02 100%)',
    'linear-gradient(135deg, #FFD54F 0%, #FFB300 100%)',
    'linear-gradient(135deg, #FFCC02 0%, #FF9800 100%)',
    'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
    'linear-gradient(135deg, #F57C00 0%, #EF6C00 100%)',
    'linear-gradient(135deg, #EF6C00 0%, #E65100 100%)',
  ];

  // Clip paths para formato de seta
  const getClipPath = (index: number, total: number) => {
    if (total === 1) {
      return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
    }
    if (index === 0) {
      // Primeiro: sem seta à esquerda
      return 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%)';
    }
    if (index === total - 1) {
      // Último: sem seta à direita
      return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 20px 50%)';
    }
    // Meio: seta dos dois lados
    return 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 0% 100%, 20px 50%)';
  };

  // Calcular taxas de conversão específicas:
  // - Leads Úteis (índice 1) → Reunião Realizada (índice 3)
  // - Reunião Realizada (índice 3) → Contratos Fechados (índice 5)
  const taxaLeadsUteisParaReuniao = indicadores[1] && indicadores[3] 
    ? calcularTaxaConversao(indicadores[3].valor, indicadores[1].valor) 
    : 0;
  
  const taxaReuniaoParaContratos = indicadores[3] && indicadores[5] 
    ? calcularTaxaConversao(indicadores[5].valor, indicadores[3].valor) 
    : 0;

  return (
    <div className="funil-section">
      <h2 className="section-title">
        INDICADORES OPERACIONAIS (FUNIL)
      </h2>
      
      <div className="flex gap-5 items-start">
        {/* Container do funil horizontal - 75% da largura */}
        <div className="flex-[9] flex flex-col">
          {/* Cards do funil */}
          <div className="flex items-stretch">
            {indicadores.map((ind, index) => (
              <div
                key={index}
                className="funil-card flex-1 relative px-4 text-center transition-all duration-300 flex flex-col gap-2 min-w-[110px] justify-center font-bold hover:scale-[1.03] hover:-translate-y-1"
                style={{
                  background: coresFunil[index] || coresFunil[coresFunil.length - 1],
                  clipPath: getClipPath(index, indicadores.length),
                  marginRight: index < indicadores.length - 1 ? '-5px' : '0',
                  paddingLeft: index === 0 ? '20px' : '25px',
                  paddingTop: '28px',
                  paddingBottom: '28px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  zIndex: indicadores.length - index,
                }}
              >
                <span className="text-[#212529] text-xs font-bold uppercase tracking-wide leading-tight">
                  {ind.titulo}
                </span>
                <span className="text-[#212529] text-2xl font-bold">
                  {ind.valor.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
          
          {/* Setas de conversão abaixo dos cards */}
          <div className="relative w-full" style={{ height: '55px', marginTop: '8px' }}>
            {/* 
              Posições dos cards (6 cards, cada um ~16.67% da largura):
              Card 1 (Leads Úteis): centro em 25% (índice 1)
              Card 3 (Reunião): centro em 58.33% (índice 3)  
              Card 5 (Contratos): centro em 91.67% (índice 5)
              
              Para evitar sobreposição no card Reunião:
              - Seta 1 termina um pouco ANTES do centro do card Reunião
              - Seta 2 começa um pouco DEPOIS do centro do card Reunião
            */}
            
            {/* Seta 1: Leads Úteis → Reunião Realizada */}
            <div 
              className="absolute"
              style={{
                left: 'calc((100% / 6) * 1.5)',          // Centro do card índice 1
                width: 'calc((100% / 6) * 2 - 15px)',   // Termina antes do centro do card Reunião
                top: '0',
              }}
            >
              {/* Linha da seta */}
              <div className="relative h-3 flex items-center">
                {/* Linha */}
                <div className="flex-1 h-0.5 bg-[#6c757d]" />
                {/* Ponta da seta */}
                <div 
                  className="absolute right-0"
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: '8px solid #6c757d',
                  }}
                />
              </div>
              {/* Badge */}
              <div 
                className="absolute left-1/2 top-4 -translate-x-1/2 bg-[#343a40] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-[#6c757d]"
              >
                <span className="text-gray-400 block text-[9px] leading-tight">Úteis → Reunião</span>
                <span className="text-white font-bold text-sm">{taxaLeadsUteisParaReuniao.toFixed(1)}%</span>
              </div>
            </div>
            
            {/* Seta 2: Reunião Realizada → Contratos Fechados */}
            <div 
              className="absolute"
              style={{
                left: 'calc((100% / 6) * 3.5 + 15px)',  // Começa depois do centro do card Reunião
                width: 'calc((100% / 6) * 2 - 15px)',   // Largura ajustada
                top: '0',
              }}
            >
              {/* Linha da seta */}
              <div className="relative h-3 flex items-center">
                {/* Linha */}
                <div className="flex-1 h-0.5 bg-[#6c757d]" />
                {/* Ponta da seta */}
                <div 
                  className="absolute right-0"
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: '8px solid #6c757d',
                  }}
                />
              </div>
              {/* Badge */}
              <div 
                className="absolute left-1/2 top-4 -translate-x-1/2 bg-[#343a40] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-[#6c757d]"
              >
                <span className="text-gray-400 block text-[9px] leading-tight">Reunião → Contratos</span>
                <span className="text-white font-bold text-sm">{taxaReuniaoParaContratos.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards laterais - altura igual aos cards do funil */}
        <div 
          className="flex-[3] flex flex-col gap-2"
          style={{ height: '125px' }} /* Altura fixa = 2 cards + gap */
        >
          {/* Leads Perdidos */}
          <div 
            className="flex-1 rounded-lg px-3 text-center border transition-all duration-300 flex flex-col justify-center hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              borderColor: '#c0392b',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.2)',
            }}
          >
            <span className="text-white text-[10px] font-bold uppercase tracking-wide">
              LEADS PERDIDOS
            </span>
            <span className="text-white text-lg font-bold">
              {leadsPerdidos.toLocaleString('pt-BR')}
            </span>
          </div>

          {/* Leads Descartados */}
          <div 
            className="flex-1 rounded-lg px-3 text-center border transition-all duration-300 flex flex-col justify-center hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              borderColor: '#c0392b',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.2)',
            }}
          >
            <span className="text-white text-[10px] font-bold uppercase tracking-wide">
              LEADS DESCARTADOS
            </span>
            <span className="text-white text-lg font-bold">
              {leadsDescartados.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

