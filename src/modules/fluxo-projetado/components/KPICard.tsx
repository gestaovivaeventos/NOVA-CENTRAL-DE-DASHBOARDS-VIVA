/**
 * KPI Card - Componente de Card Individual
 * Exibe um KPI com valor, título e ícone
 */

import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  Percent,
  CheckCircle,
  Clock,
  Gift,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface KPICardProps {
  titulo: string;
  valor: string | number;
  formato?: 'moeda' | 'percentual' | 'numero';
  icone?: string;
  cor?: 'verde' | 'laranja' | 'azul' | 'vermelho' | 'roxo' | 'cyan';
  descricao?: string;
  variacao?: number;
  tamanho?: 'sm' | 'md' | 'lg';
}

const icones: Record<string, React.ReactNode> = {
  'dollar': <DollarSign className="w-5 h-5" />,
  'trending': <TrendingUp className="w-5 h-5" />,
  'calendar': <Calendar className="w-5 h-5" />,
  'users': <Users className="w-5 h-5" />,
  'percent': <Percent className="w-5 h-5" />,
  'check': <CheckCircle className="w-5 h-5" />,
  'clock': <Clock className="w-5 h-5" />,
  'gift': <Gift className="w-5 h-5" />,
  'pie': <PieChart className="w-5 h-5" />,
  'activity': <Activity className="w-5 h-5" />,
};

const cores: Record<string, { 
  gradient: string; 
  text: string; 
  border: string; 
  iconBg: string;
  glow: string;
  ring: string;
}> = {
  verde: {
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    glow: 'shadow-emerald-500/20',
    ring: 'ring-emerald-500/30',
  },
  laranja: {
    gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
    text: 'text-orange-400',
    border: 'border-orange-500/20 hover:border-orange-500/40',
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    glow: 'shadow-orange-500/20',
    ring: 'ring-orange-500/30',
  },
  azul: {
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    text: 'text-blue-400',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/20',
    ring: 'ring-blue-500/30',
  },
  vermelho: {
    gradient: 'from-red-500/10 via-red-500/5 to-transparent',
    text: 'text-red-400',
    border: 'border-red-500/20 hover:border-red-500/40',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    glow: 'shadow-red-500/20',
    ring: 'ring-red-500/30',
  },
  roxo: {
    gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    text: 'text-purple-400',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    glow: 'shadow-purple-500/20',
    ring: 'ring-purple-500/30',
  },
  cyan: {
    gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    glow: 'shadow-cyan-500/20',
    ring: 'ring-cyan-500/30',
  },
};

export default function KPICard({
  titulo,
  valor,
  formato = 'moeda',
  icone = 'dollar',
  cor = 'laranja',
  descricao,
  variacao,
  tamanho = 'md',
}: KPICardProps) {
  const corConfig = cores[cor] || cores.laranja;
  const iconeEl = icones[icone] || icones.dollar;

  const formatarValor = () => {
    if (typeof valor === 'string') return valor;
    
    switch (formato) {
      case 'moeda':
        if (valor >= 1000000) {
          return `R$ ${(valor / 1000000).toFixed(2).replace('.', ',')}M`;
        }
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(valor);
      case 'percentual':
        return `${valor.toFixed(1)}%`;
      case 'numero':
        return new Intl.NumberFormat('pt-BR').format(valor);
      default:
        return String(valor);
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gray-800/40 backdrop-blur-sm
        border ${corConfig.border}
        rounded-2xl
        p-5
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl hover:${corConfig.glow}
        group
      `}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${corConfig.gradient} opacity-50`} />
      
      {/* Decorative Circle */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${corConfig.iconBg} opacity-10 group-hover:opacity-20 transition-opacity`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className={`${corConfig.iconBg} p-2.5 rounded-xl shadow-lg`}>
            <div className="text-white">
              {iconeEl}
            </div>
          </div>
          
          {variacao !== undefined && (
            <div className={`
              flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
              ${variacao >= 0 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/20 text-red-400'
              }
            `}>
              {variacao >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(variacao).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
          {titulo}
        </p>
        
        {/* Value */}
        <p className={`text-2xl font-bold text-white mb-1 ${corConfig.text.replace('text-', 'group-hover:text-')} transition-colors`}>
          {formatarValor()}
        </p>
        
        {/* Description */}
        {descricao && (
          <p className="text-gray-500 text-xs leading-relaxed mt-2 line-clamp-2">
            {descricao}
          </p>
        )}
      </div>
      
      {/* Bottom Accent Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${corConfig.iconBg} opacity-60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
    </div>
  );
}
