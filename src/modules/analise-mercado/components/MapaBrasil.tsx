/**
 * MapaBrasil — Mapa do Brasil com heatmap por estado
 * Usa react-simple-maps com TopoJSON do Brasil
 */

import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import type { DadosEstado } from '../types';
import { fmtNum, fmtInteiro } from '../utils/formatters';

const BRASIL_TOPO_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

interface MapaBrasilProps {
  dados: DadosEstado[];
  metrica: 'matriculas' | 'concluintes' | 'turmas';
  estadoSelecionado?: string | null;
  onEstadoClick?: (uf: string) => void;
  altura?: number;
}

/** Mapeia sigla → nome usado no GeoJSON (para fazer match) */
const UF_TO_NAME: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

const NAME_TO_UF: Record<string, string> = Object.fromEntries(
  Object.entries(UF_TO_NAME).map(([k, v]) => [v, k])
);

export default function MapaBrasil({ dados, metrica, estadoSelecionado, onEstadoClick, altura = 420 }: MapaBrasilProps) {
  const [tooltip, setTooltip] = useState<{ nome: string; valor: number; x: number; y: number } | null>(null);

  // Escala de cores baseada no valor máximo
  const { maxVal, getColor, dadosMap } = useMemo(() => {
    const map = new Map<string, DadosEstado>();
    let max = 0;
    dados.forEach(d => {
      map.set(d.uf, d);
      const val = d[metrica];
      if (val > max) max = val;
    });
    const getCol = (val: number) => {
      if (max === 0) return '#2D3238';
      const ratio = val / max;
      if (ratio > 0.7) return '#FF6600';
      if (ratio > 0.5) return '#FF8533';
      if (ratio > 0.3) return '#FFB380';
      if (ratio > 0.15) return '#664400';
      if (ratio > 0.05) return '#3D3020';
      return '#2D3238';
    };
    return { maxVal: max, getColor: getCol, dadosMap: map };
  }, [dados, metrica]);

  const metricaLabel = metrica === 'matriculas' ? 'Matrículas' : metrica === 'concluintes' ? 'Concluintes' : 'Turmas';

  return (
    <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057', position: 'relative' }}>
      <h3 style={{
        color: '#F8F9FA', fontSize: '1rem', fontWeight: 600, marginBottom: 8,
        fontFamily: "'Poppins', sans-serif",
      }}>
        Distribuição Geográfica — {metricaLabel}
      </h3>
      <p style={{ color: '#6C757D', fontSize: '0.7rem', marginBottom: 12 }}>
        Clique em um estado para filtrar
      </p>

      <div style={{ position: 'relative', height: altura }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 650, center: [-54, -15] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup>
            <Geographies geography={BRASIL_TOPO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name || geo.properties.NAME || geo.properties.nome;
                  const uf = NAME_TO_UF[geoName] || '';
                  const dadoEstado = dadosMap.get(uf);
                  const val = dadoEstado ? dadoEstado[metrica] : 0;
                  const isSelected = estadoSelecionado === uf;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSelected ? '#FF6600' : getColor(val)}
                      stroke={isSelected ? '#FFB380' : '#495057'}
                      strokeWidth={isSelected ? 2 : 0.5}
                      style={{
                        default: { outline: 'none', cursor: 'pointer' },
                        hover: { outline: 'none', fill: '#FF8533', cursor: 'pointer' },
                        pressed: { outline: 'none' },
                      }}
                      onClick={() => onEstadoClick?.(uf)}
                      onMouseEnter={(evt) => {
                        const el = evt.currentTarget.getBoundingClientRect();
                        setTooltip({ nome: `${geoName} (${uf})`, valor: val, x: 0, y: 0 });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip simples */}
        {tooltip && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: '#212529', border: '1px solid #FF6600',
            borderRadius: 8, padding: '8px 12px', zIndex: 10,
          }}>
            <p style={{ color: '#F8F9FA', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{tooltip.nome}</p>
            <p style={{ color: '#FF6600', fontSize: '0.9rem', fontWeight: 700, margin: '2px 0 0' }}>
              {fmtInteiro(tooltip.valor)} {metricaLabel.toLowerCase()}
            </p>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
        <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>Menor</span>
        {['#2D3238', '#3D3020', '#664400', '#FFB380', '#FF8533', '#FF6600'].map((c, i) => (
          <div key={i} style={{ width: 24, height: 10, backgroundColor: c, borderRadius: 2 }} />
        ))}
        <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>Maior</span>
        {estadoSelecionado && (
          <button
            onClick={() => onEstadoClick?.('')}
            style={{
              marginLeft: 12, padding: '2px 8px', borderRadius: 4,
              backgroundColor: 'rgba(255,102,0,0.15)', border: '1px solid #FF6600',
              color: '#FF6600', fontSize: '0.65rem', cursor: 'pointer',
            }}
          >
            Limpar filtro
          </button>
        )}
      </div>
    </div>
  );
}
