/**
 * Gráficos Históricos para o módulo Carteira
 * Usando Recharts (mesmo padrão do módulo de vendas)
 */

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DadosHistorico } from '@/modules/carteira/types';
import { formatCurrency, formatPercent, getMesNome } from '@/modules/carteira/utils/formatacao';

interface GraficosHistoricosProps {
  dados: DadosHistorico[];
  loading?: boolean;
}

// Formatar dados para exibição
const formatarDados = (dados: DadosHistorico[]) => {
  return dados.map(item => ({
    ...item,
    periodoLabel: getMesNome(item.periodo),
    atingimentoPercent: item.atingimento * 100,
  }));
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        backgroundColor: '#1a1d21',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <p style={{ color: '#FF6600', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ color: entry.color, fontSize: '0.875rem' }}>
          {entry.name}: {
            entry.dataKey === 'atingimentoPercent' 
              ? `${entry.value.toFixed(1)}%`
              : entry.dataKey.includes('mac')
                ? formatCurrency(entry.value)
                : entry.value.toLocaleString('pt-BR')
          }
        </p>
      ))}
    </div>
  );
};

// Skeleton para loading
const ChartSkeleton = () => (
  <div className="h-80 animate-pulse bg-gray-700/30 rounded-lg" />
);

export default function GraficosHistoricos({ dados, loading = false }: GraficosHistoricosProps) {
  const dadosFormatados = formatarDados(dados);

  if (loading) {
    return (
      <div className="space-y-6">
        <div 
          className="rounded-lg p-4"
          style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
        >
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div 
            className="rounded-lg p-4"
            style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
          >
            <ChartSkeleton />
          </div>
          <div 
            className="rounded-lg p-4"
            style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
          >
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Evolução MAC - Área */}
      <div 
        className="rounded-lg p-4"
        style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: '#FF6600', fontFamily: "'Poppins', sans-serif" }}
        >
          📈 Evolução do MAC (Realizado vs Meta)
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={dadosFormatados}>
            <defs>
              <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6600" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="periodoLabel" 
              stroke="#6c757d" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6c757d" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="macMeta"
              name="Meta"
              stroke="#3b82f6"
              fill="url(#colorMeta)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="macRealizado"
              name="Realizado"
              stroke="#FF6600"
              fill="url(#colorRealizado)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Atingimento - Barras */}
        <div 
          className="rounded-lg p-4"
          style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: '#FF6600', fontFamily: "'Poppins', sans-serif" }}
          >
            🎯 Atingimento Mensal (%)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosFormatados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="periodoLabel" 
                stroke="#6c757d" 
                fontSize={11}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6c757d" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="atingimentoPercent"
                name="Atingimento"
                fill="#FF6600"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Fundos e Alunos - Linha */}
        <div 
          className="rounded-lg p-4"
          style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: '#FF6600', fontFamily: "'Poppins', sans-serif" }}
          >
            👥 Evolução de Fundos e Alunos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosFormatados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="periodoLabel" 
                stroke="#6c757d" 
                fontSize={11}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6c757d" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#6c757d" 
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="fundosAtivos"
                name="Fundos Ativos"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="alunosAtivos"
                name="Alunos Ativos"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
