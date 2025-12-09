'use client';

import React from 'react';
import { ClusterType } from '../types';

interface ClusterBadgeProps {
  cluster: ClusterType | string;
  size?: 'sm' | 'md' | 'lg';
}

const clusterConfig: Record<ClusterType, { label: string; color: string }> = {
  CALOURO_INICIANTE: {
    label: 'Calouro Iniciante',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  CALOURO: {
    label: 'Calouro',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  GRADUADO: {
    label: 'Graduado',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  POS_GRADUADO: {
    label: 'Pós-Graduado',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function ClusterBadge({ cluster, size = 'md' }: ClusterBadgeProps) {
  const normalizedCluster = cluster.toUpperCase().replace(/-/g, '_') as ClusterType;
  const config = clusterConfig[normalizedCluster] || clusterConfig.CALOURO;

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${config.color}
        ${sizeClasses[size]}
      `}
    >
      {config.label}
    </span>
  );
}

export default ClusterBadge;
