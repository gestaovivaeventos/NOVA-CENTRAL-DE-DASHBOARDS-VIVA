/**
 * TabelaSegmentoMercado - Placeholder
 * Este componente será implementado quando os dados de segmento de mercado
 * estiverem disponíveis na planilha de origem.
 */

import React from 'react';
import { PieChart, Info } from 'lucide-react';
import { Franquia } from '../types';

interface TabelaSegmentoMercadoProps {
  franquias: Franquia[];
  titulo?: string;
}

export default function TabelaSegmentoMercado({ franquias, titulo = 'Análise por Segmento de Mercado' }: TabelaSegmentoMercadoProps) {
  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Título */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <PieChart size={24} color="#17a2b8" />
        <h2 style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#F8F9FA',
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
        }}>
          {titulo}
        </h2>
      </div>

      {/* Placeholder content */}
      <div style={{
        backgroundColor: '#212529',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        border: '1px dashed #555',
      }}>
        <Info size={48} color="#6c757d" style={{ marginBottom: '16px' }} />
        <h3 style={{
          color: '#adb5bd',
          fontSize: '1.1rem',
          fontWeight: 600,
          marginBottom: '8px',
        }}>
          Dados de Segmento não disponíveis
        </h3>
        <p style={{
          color: '#6c757d',
          fontSize: '0.9rem',
          margin: 0,
        }}>
          Os dados de segmento de mercado (Padrão, Master, Mega, Giga) serão exibidos aqui quando estiverem configurados na planilha de origem.
        </p>
        <p style={{
          color: '#FF6600',
          fontSize: '0.85rem',
          marginTop: '12px',
        }}>
          Total de franquias carregadas: {franquias.length}
        </p>
      </div>
    </div>
  );
}
