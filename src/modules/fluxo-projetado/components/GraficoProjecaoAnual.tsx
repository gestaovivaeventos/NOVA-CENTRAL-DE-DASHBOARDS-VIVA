/**
 * Gráfico de Projeção por Ano
 * Exibe visão de receita projetada por ano
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DadoAno {
  ano: number;
  valor: number;
}

interface GraficoProjecaoAnualProps {
  dados: DadoAno[];
}

const formatarMoeda = (valor: number) => {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(0)}K`;
  }
  return `R$ ${valor}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
      <p className="text-white font-semibold mb-2">Ano {label}</p>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Receita Projetada:</span>
        <span className="text-orange-400 font-bold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(payload[0].value)}
        </span>
      </div>
    </div>
  );
};

export default function GraficoProjecaoAnual({ dados }: GraficoProjecaoAnualProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
        Projeção de Receita por Ano
      </h2>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="ano" 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#4B5563' }}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#4B5563' }}
              tickFormatter={formatarMoeda}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#F97316"
              strokeWidth={3}
              fill="url(#colorValor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
