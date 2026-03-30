/**
 * MapaBrasil — Mapa do Brasil com heatmap por estado
 * Drill-down: clique num estado → zoom com cidades em bolhas
 * Usa react-simple-maps com GeoJSON do Brasil
 */

import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import type { DadosEstado, DadosCidade } from '../types';
import { fmtNum, fmtInteiro } from '../utils/formatters';

const BRASIL_TOPO_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

interface MapaBrasilProps {
  dados: DadosEstado[];
  metrica: 'matriculas' | 'concluintes' | 'turmas';
  cidades?: Record<string, DadosCidade[]>;
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

/** Config de zoom por estado: [lng, lat] center + zoom level */
const STATE_ZOOM: Record<string, { center: [number, number]; zoom: number }> = {
  SP: { center: [-49.5, -22.3], zoom: 5 },
  MG: { center: [-44.5, -18.5], zoom: 4 },
  RJ: { center: [-43.2, -22.5], zoom: 8 },
  PR: { center: [-51.5, -24.8], zoom: 5 },
  RS: { center: [-52.5, -29.5], zoom: 4.5 },
  BA: { center: [-41.5, -13.0], zoom: 3.5 },
  SC: { center: [-49.5, -27.5], zoom: 6 },
  GO: { center: [-49.5, -15.9], zoom: 4.5 },
  PE: { center: [-36.5, -8.3], zoom: 6 },
  CE: { center: [-39.5, -5.3], zoom: 5 },
  PA: { center: [-52.0, -4.0], zoom: 3 },
  DF: { center: [-47.9, -15.8], zoom: 18 },
  MA: { center: [-45.0, -5.5], zoom: 4 },
  MT: { center: [-55.0, -13.0], zoom: 3 },
  MS: { center: [-55.0, -21.0], zoom: 4.5 },
  ES: { center: [-40.5, -20.0], zoom: 7 },
  PB: { center: [-36.5, -7.2], zoom: 8 },
  RN: { center: [-36.5, -5.8], zoom: 8 },
  PI: { center: [-43.0, -7.5], zoom: 4 },
  AL: { center: [-36.6, -9.6], zoom: 8 },
  SE: { center: [-37.1, -10.9], zoom: 10 },
  TO: { center: [-48.5, -10.5], zoom: 4 },
  AM: { center: [-64.0, -4.0], zoom: 2.5 },
  RO: { center: [-63.0, -11.0], zoom: 4 },
  AC: { center: [-70.5, -9.5], zoom: 4.5 },
  AP: { center: [-51.0, 1.0], zoom: 5.5 },
  RR: { center: [-61.0, 2.5], zoom: 4.5 },
};

export default function MapaBrasil({
  dados, metrica, cidades, estadoSelecionado, onEstadoClick, altura = 420,
}: MapaBrasilProps) {
  const [tooltip, setTooltip] = useState<{ tipo: 'estado' | 'cidade'; nome: string; valor: number } | null>(null);
  const [estadoExpandido, setEstadoExpandido] = useState<string | null>(null);

  // Escala de cores baseada no valor máximo
  const { getColor, dadosMap } = useMemo(() => {
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
    return { getColor: getCol, dadosMap: map };
  }, [dados, metrica]);

  const metricaLabel = metrica === 'matriculas' ? 'Matrículas' : metrica === 'concluintes' ? 'Concluintes' : 'Turmas';

  // Cidades do estado expandido
  const cidadesEstado = useMemo(() => {
    if (!estadoExpandido || !cidades) return [];
    return (cidades[estadoExpandido] || []).sort((a, b) => b[metrica] - a[metrica]);
  }, [estadoExpandido, cidades, metrica]);

  // Escala de raio para bolhas de cidade
  const getRadius = useMemo(() => {
    if (cidadesEstado.length === 0) return () => 6;
    const maxVal = Math.max(...cidadesEstado.map(c => c[metrica]));
    return (val: number) => {
      const MIN_R = 5;
      const MAX_R = 18;
      if (maxVal === 0) return MIN_R;
      return MIN_R + ((val / maxVal) * (MAX_R - MIN_R));
    };
  }, [cidadesEstado, metrica]);

  // Zoom config
  const zoomConfig = estadoExpandido && STATE_ZOOM[estadoExpandido]
    ? STATE_ZOOM[estadoExpandido]
    : { center: [-54, -15] as [number, number], zoom: 1 };

  const handleEstadoClick = (uf: string) => {
    if (estadoExpandido) return; // Ignora cliques no Brasil quando expandido
    setEstadoExpandido(uf);
    onEstadoClick?.(uf);
  };

  const handleVoltar = () => {
    setEstadoExpandido(null);
    setTooltip(null);
    onEstadoClick?.('');
  };

  // Total do estado expandido
  const totalEstadoExpandido = estadoExpandido
    ? dadosMap.get(estadoExpandido)?.[metrica] || 0
    : 0;

  return (
    <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h3 style={{
            color: '#F8F9FA', fontSize: '1rem', fontWeight: 600, margin: 0,
            fontFamily: "'Poppins', sans-serif",
          }}>
            {estadoExpandido
              ? `${UF_TO_NAME[estadoExpandido]} — Cidades`
              : `Distribuição Geográfica — ${metricaLabel}`}
          </h3>
          <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: '4px 0 0' }}>
            {estadoExpandido
              ? `Total: ${fmtInteiro(totalEstadoExpandido)} ${metricaLabel.toLowerCase()} • ${cidadesEstado.length} cidades`
              : 'Clique em um estado para expandir'}
          </p>
        </div>

        {estadoExpandido && (
          <button
            onClick={handleVoltar}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6,
              backgroundColor: 'rgba(255,102,0,0.15)', border: '1px solid #FF6600',
              color: '#FF6600', fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,102,0,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,102,0,0.15)')}
          >
            ← Voltar para Brasil
          </button>
        )}
      </div>

      {/* Mapa */}
      <div style={{ position: 'relative', height: estadoExpandido ? altura + 40 : altura }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 650, center: [-54, -15] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            center={zoomConfig.center}
            zoom={zoomConfig.zoom}
            minZoom={1}
            maxZoom={25}
          >
            <Geographies geography={BRASIL_TOPO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name || geo.properties.NAME || geo.properties.nome;
                  const uf = NAME_TO_UF[geoName] || '';
                  const dadoEstado = dadosMap.get(uf);
                  const val = dadoEstado ? dadoEstado[metrica] : 0;
                  const isThisState = uf === estadoExpandido;

                  // Cor: quando expandido, destaca o estado e esmaece os demais
                  let fill: string;
                  let stroke: string;
                  let strokeWidth: number;
                  let opacity: number;

                  if (estadoExpandido) {
                    fill = isThisState ? '#2D3238' : '#1a1d21';
                    stroke = isThisState ? '#FF6600' : '#333';
                    strokeWidth = isThisState ? 1.5 : 0.3;
                    opacity = isThisState ? 1 : 0.3;
                  } else {
                    const isSelected = estadoSelecionado === uf;
                    fill = isSelected ? '#FF6600' : getColor(val);
                    stroke = isSelected ? '#FFB380' : '#495057';
                    strokeWidth = isSelected ? 2 : 0.5;
                    opacity = 1;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      style={{
                        default: { outline: 'none', cursor: estadoExpandido ? 'default' : 'pointer', opacity },
                        hover: {
                          outline: 'none',
                          fill: estadoExpandido ? fill : '#FF8533',
                          cursor: estadoExpandido ? 'default' : 'pointer',
                          opacity: estadoExpandido ? opacity : 1,
                        },
                        pressed: { outline: 'none' },
                      }}
                      onClick={() => handleEstadoClick(uf)}
                      onMouseEnter={() => {
                        if (!estadoExpandido) {
                          setTooltip({ tipo: 'estado', nome: `${geoName} (${uf})`, valor: val });
                        }
                      }}
                      onMouseLeave={() => {
                        if (!estadoExpandido) setTooltip(null);
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* ── Bolhas de cidade (quando expandido) ── */}
            {estadoExpandido && cidadesEstado.map((cidade, idx) => {
              const r = getRadius(cidade[metrica]);
              const isTop3 = idx < 3;
              return (
                <Marker key={cidade.nome} coordinates={[cidade.lng, cidade.lat]}>
                  {/* Glow */}
                  <circle
                    r={r + 3}
                    fill="rgba(255,102,0,0.15)"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Círculo principal */}
                  <circle
                    r={r}
                    fill="rgba(255,102,0,0.75)"
                    stroke="#FF6600"
                    strokeWidth={1.5}
                    style={{ cursor: 'pointer', transition: 'r 0.3s' }}
                    onMouseEnter={() => setTooltip({ tipo: 'cidade', nome: cidade.nome, valor: cidade[metrica] })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {/* Label para top cidades */}
                  {isTop3 && (
                    <text
                      textAnchor="middle"
                      y={-(r + 6)}
                      style={{
                        fill: '#F8F9FA',
                        fontSize: '3.5px',
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                        pointerEvents: 'none',
                        textShadow: '0 0 3px #000',
                      }}
                    >
                      {cidade.nome}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip flutuante */}
        {tooltip && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: '#212529', border: '1px solid #FF6600',
            borderRadius: 8, padding: '8px 12px', zIndex: 10,
            minWidth: 130,
          }}>
            <p style={{ color: '#F8F9FA', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
              {tooltip.tipo === 'cidade' ? '📍 ' : ''}{tooltip.nome}
            </p>
            <p style={{ color: '#FF6600', fontSize: '0.9rem', fontWeight: 700, margin: '2px 0 0' }}>
              {fmtInteiro(tooltip.valor)} {metricaLabel.toLowerCase()}
            </p>
          </div>
        )}
      </div>

      {/* ── Ranking de cidades (quando expandido) ── */}
      {estadoExpandido && cidadesEstado.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#2D3238' }}>
                  {['#', 'Cidade', metricaLabel, 'Concluintes', 'Turmas', 'Ensino Superior', '% Estado'].map((h, i) => (
                    <th key={h} style={{
                      color: '#6C757D', fontWeight: 600, padding: '8px 8px',
                      textAlign: i <= 1 ? 'left' : 'right', fontSize: '0.68rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '2px solid #495057',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cidadesEstado.map((cidade, idx) => {
                  const pctEstado = totalEstadoExpandido > 0
                    ? ((cidade[metrica] / totalEstadoExpandido) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr
                      key={cidade.nome}
                      style={{ borderBottom: '1px solid #3D4349' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3D4349')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '7px 8px', color: '#FF6600', fontWeight: 700, fontSize: '0.72rem' }}>
                        {idx + 1}º
                      </td>
                      <td style={{ padding: '7px 8px', color: '#F8F9FA', fontWeight: 500 }}>
                        {cidade.nome}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#F8F9FA', textAlign: 'right', fontWeight: 600, fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem' }}>
                        {fmtInteiro(cidade[metrica])}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#ADB5BD', textAlign: 'right' }}>
                        {fmtInteiro(cidade.concluintes)}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#ADB5BD', textAlign: 'right' }}>
                        {fmtInteiro(cidade.turmas)}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#ADB5BD', textAlign: 'right' }}>
                        {cidade.instituicoes}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                        <span style={{
                          color: '#FF6600', fontWeight: 600,
                          backgroundColor: 'rgba(255,102,0,0.1)',
                          padding: '2px 6px', borderRadius: 4,
                        }}>
                          {pctEstado}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legenda (só na visão Brasil) */}
      {!estadoExpandido && (
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
      )}
    </div>
  );
}
