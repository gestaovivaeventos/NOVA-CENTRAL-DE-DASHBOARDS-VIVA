/**
 * Componente visual de Taxa de Conversão Fase a Fase
 * Mostra o fluxo do funil com taxas de conversão entre cada etapa
 */

import React from 'react';

interface FaseData {
  fase: string;
  quantidade: number;
  cor: string;
}

interface TaxaConversaoFunilProps {
  dados: FaseData[];
}

// Função para formatar a taxa de conversão
const formatarTaxa = (valor: number): string => {
  if (!isFinite(valor) || isNaN(valor)) return '0%';
  return `${valor.toFixed(1)}%`;
};

// Função para determinar a cor da taxa baseada no valor
const getCorTaxa = (taxa: number): string => {
  if (taxa >= 70) return '#4CAF50'; // Verde - ótimo
  if (taxa >= 50) return '#8BC34A'; // Verde claro - bom
  if (taxa >= 30) return '#FFC107'; // Amarelo - médio
  if (taxa >= 15) return '#FF9800'; // Laranja - baixo
  return '#F44336'; // Vermelho - muito baixo
};

// Função para obter o nome curto da fase
const getNomeCurto = (fase: string): string => {
  // Remove o prefixo numérico se existir
  const match = fase.match(/^\d+\.\d+\s*(.*)$/);
  if (match) return match[1];
  return fase;
};

export const TaxaConversaoFunil: React.FC<TaxaConversaoFunilProps> = ({ dados }) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted">
        Nenhum dado disponível
      </div>
    );
  }

  // Filtrar apenas fases com dados relevantes (excluindo Perdido e fases finais)
  const fasesRelevantes = dados.filter(d => 
    !d.fase.includes('Perdido') && 
    !d.fase.includes('Concluído') &&
    d.quantidade >= 0
  );

  // Calcular taxas de conversão entre fases consecutivas
  const taxasConversao: { de: string; para: string; taxa: number; quantidade: number; quantidadeAnterior: number }[] = [];
  
  for (let i = 0; i < fasesRelevantes.length - 1; i++) {
    const faseAtual = fasesRelevantes[i];
    const proximaFase = fasesRelevantes[i + 1];
    
    const taxa = faseAtual.quantidade > 0 
      ? (proximaFase.quantidade / faseAtual.quantidade) * 100 
      : 0;
    
    taxasConversao.push({
      de: faseAtual.fase,
      para: proximaFase.fase,
      taxa,
      quantidade: proximaFase.quantidade,
      quantidadeAnterior: faseAtual.quantidade,
    });
  }

  // Calcular taxa total do funil (primeira fase -> última fase)
  const primeiraFase = fasesRelevantes[0];
  const ultimaFase = fasesRelevantes[fasesRelevantes.length - 1];
  const taxaTotal = primeiraFase?.quantidade > 0 
    ? (ultimaFase?.quantidade / primeiraFase?.quantidade) * 100 
    : 0;

  return (
    <div className="w-full">
      {/* Header com taxa total */}
      <div 
        className="mb-6 p-4 rounded-lg text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(255,102,0,0.15) 0%, rgba(255,102,0,0.05) 100%)',
          border: '1px solid rgba(255,102,0,0.3)',
        }}
      >
        <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">
          Taxa de Conversão Total do Funil
        </div>
        <div 
          className="text-4xl font-bold"
          style={{ color: getCorTaxa(taxaTotal) }}
        >
          {formatarTaxa(taxaTotal)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {primeiraFase?.quantidade || 0} leads → {ultimaFase?.quantidade || 0} conversões
        </div>
      </div>

      {/* Fluxo de conversão fase a fase */}
      <div className="space-y-3">
        {fasesRelevantes.map((fase, index) => {
          const taxaInfo = taxasConversao[index];
          const isLast = index === fasesRelevantes.length - 1;
          
          // Calcular largura proporcional baseada na quantidade (funil visual)
          const maxQuantidade = Math.max(...fasesRelevantes.map(f => f.quantidade)) || 1;
          const larguraPercentual = Math.max(30, (fase.quantidade / maxQuantidade) * 100);

          return (
            <div key={fase.fase} className="relative">
              {/* Barra da fase */}
              <div 
                className="relative flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(90deg, ${fase.cor}40 0%, ${fase.cor}15 100%)`,
                  borderLeft: `4px solid ${fase.cor}`,
                  width: `${larguraPercentual}%`,
                  marginLeft: `${(100 - larguraPercentual) / 2}%`,
                }}
              >
                {/* Nome da fase */}
                <div className="flex-1 min-w-0">
                  <div 
                    className="text-sm font-medium truncate"
                    style={{ color: '#F8F9FA' }}
                    title={fase.fase}
                  >
                    {fase.fase}
                  </div>
                </div>
                
                {/* Quantidade */}
                <div 
                  className="text-lg font-bold ml-4 flex-shrink-0"
                  style={{ color: fase.cor }}
                >
                  {fase.quantidade}
                </div>
              </div>

              {/* Seta e taxa de conversão para próxima fase */}
              {!isLast && taxaInfo && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center gap-2">
                    {/* Seta para baixo */}
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      className="text-gray-500"
                    >
                      <path 
                        d="M12 4v12m0 0l-4-4m4 4l4-4" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                    
                    {/* Badge com taxa de conversão */}
                    <div 
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: `${getCorTaxa(taxaInfo.taxa)}20`,
                        color: getCorTaxa(taxaInfo.taxa),
                        border: `1px solid ${getCorTaxa(taxaInfo.taxa)}40`,
                      }}
                    >
                      {formatarTaxa(taxaInfo.taxa)}
                    </div>
                    
                    {/* Info de perda */}
                    {taxaInfo.quantidadeAnterior > taxaInfo.quantidade && (
                      <div className="text-xs text-gray-500">
                        -{taxaInfo.quantidadeAnterior - taxaInfo.quantidade} leads
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda das cores */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Legenda de Conversão</div>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { cor: '#4CAF50', label: '≥70% Ótimo' },
            { cor: '#8BC34A', label: '50-69% Bom' },
            { cor: '#FFC107', label: '30-49% Médio' },
            { cor: '#FF9800', label: '15-29% Baixo' },
            { cor: '#F44336', label: '<15% Crítico' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.cor }}
              />
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaxaConversaoFunil;

