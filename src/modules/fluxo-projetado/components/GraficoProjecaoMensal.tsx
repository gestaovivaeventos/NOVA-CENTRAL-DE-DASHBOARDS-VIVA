/**
 * Gráfico de Projeção Mensal
 * Exibe gráfico de barras com receitas por mês
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DadosGraficoProjecao } from '../types';

interface GraficoProjecaoMensalProps {
  dados: DadosGraficoProjecao[];
  ano: number;
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
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="text-white font-medium">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function GraficoProjecaoMensal({ dados, ano }: GraficoProjecaoMensalProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        Projeção de Receita Mensal - {ano}
      </h2>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="mes" 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#4B5563' }}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#4B5563' }}
              tickFormatter={formatarMoeda}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-gray-300">{value}</span>}
            />
            <Bar 
              dataKey="fee" 
              name="FEE" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
            <Bar 
              dataKey="conviteExtra" 
              name="Convite Extra" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
            <Bar 
              dataKey="margemFechamento" 
              name="Margem Fechamento" 
              fill="#8B5CF6" 
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
