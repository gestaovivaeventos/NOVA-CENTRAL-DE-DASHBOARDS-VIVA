/**
 * PainelFranquia — Painel exibido quando uma franquia é selecionada
 * Mostra comparativo Território vs Brasil
 */

import React from 'react';
import { MapPin, Target, AlertTriangle, BarChart3 } from 'lucide-react';
import type { DadosFranquia } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';

interface PainelFranquiaProps {
  dados: DadosFranquia;
}

export default function PainelFranquia({ dados }: PainelFranquiaProps) {
  const { franquia, matriculasLocal, concluintesLocal, turmasLocal, participacaoTerritorio, gapOportunidade, carteiraAtual, comparativoBrasil } = dados;

  return (
    <div style={{
      backgroundColor: '#2D3238',
      borderRadius: 12,
      border: '1px solid #3B82F6',
      padding: 20,
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MapPin size={18} color="#3B82F6" />
        <h3 style={{
          color: '#F8F9FA', fontSize: '1rem', fontWeight: 700, margin: 0,
          fontFamily: "'Poppins', sans-serif",
        }}>
          Território: {franquia.nome}
        </h3>
      </div>

      {/* Grid de métricas locais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Matrículas Local', valor: matriculasLocal, cor: CORES.azul },
          { label: 'Concluintes Local', valor: concluintesLocal, cor: CORES.verde },
          { label: 'Turmas Local', valor: turmasLocal, cor: CORES.laranja },
        ].map(m => (
          <div key={m.label} style={{
            backgroundColor: '#343A40', borderRadius: 8, padding: 12,
            borderTop: `3px solid ${m.cor}`, textAlign: 'center',
          }}>
            <p style={{ color: '#6C757D', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>
              {m.label}
            </p>
            <div style={{ color: m.cor, fontSize: '1.2rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
              {fmtNum(m.valor)}
            </div>
          </div>
        ))}
      </div>

      {/* Comparativo vs Brasil */}
      <div style={{
        backgroundColor: '#343A40', borderRadius: 8, padding: 14,
        border: '1px solid #495057', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <BarChart3 size={14} color="#FF6600" />
          <span style={{ color: '#FF6600', fontSize: '0.75rem', fontWeight: 600 }}>
            Comparativo vs Brasil
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#6C757D', fontSize: '0.7rem' }}>% do total nacional:</span>
          <span style={{ color: '#F8F9FA', fontSize: '0.8rem', fontWeight: 600 }}>
            {fmtPct(comparativoBrasil.percentualDoTotal)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#6C757D', fontSize: '0.7rem' }}>Matrículas Brasil:</span>
          <span style={{ color: '#ADB5BD', fontSize: '0.8rem' }}>{fmtNum(comparativoBrasil.matriculasBrasil)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6C757D', fontSize: '0.7rem' }}>Turmas Brasil:</span>
          <span style={{ color: '#ADB5BD', fontSize: '0.8rem' }}>{fmtNum(comparativoBrasil.turmasBrasil)}</span>
        </div>
      </div>

      {/* Participação e Gap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ backgroundColor: '#343A40', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
            <Target size={12} color="#10B981" />
            <span style={{ color: '#6C757D', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Participação
            </span>
          </div>
          <div style={{ color: '#10B981', fontSize: '1.4rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
            {fmtPct(participacaoTerritorio)}
          </div>
          <p style={{ color: '#6C757D', fontSize: '0.6rem', margin: '2px 0 0' }}>do território</p>
        </div>

        <div style={{ backgroundColor: '#343A40', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
            <AlertTriangle size={12} color="#F59E0B" />
            <span style={{ color: '#6C757D', fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Gap Oportunidade
            </span>
          </div>
          <div style={{ color: '#F59E0B', fontSize: '1.4rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
            {fmtNum(gapOportunidade)}
          </div>
          <p style={{ color: '#6C757D', fontSize: '0.6rem', margin: '2px 0 0' }}>turmas não atendidas</p>
        </div>
      </div>

      {/* Carteira atual */}
      <div style={{
        marginTop: 12, padding: '10px 14px', borderRadius: 8,
        backgroundColor: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: '#ADB5BD', fontSize: '0.72rem' }}>Carteira Atual</span>
        <span style={{ color: '#FF6600', fontSize: '1rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
          {fmtInteiro(carteiraAtual)} contratos
        </span>
      </div>
    </div>
  );
}
