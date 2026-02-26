/**
 * MapaBrasilLeaflet — Mapa do Brasil estilo BI com Leaflet
 * 
 * Features:
 * - CartoDB Dark Matter tiles (visual escuro profissional)
 * - Choropleth interativo nos estados (GeoJSON)
 * - Drill-down: clique num estado → zoom + markers de cidades
 * - Tooltips flutuantes no hover
 * - Legenda de gradiente
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip as LTooltip, useMap,
} from 'react-leaflet';
import type { Map as LeafletMap, Layer, PathOptions } from 'leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import type { DadosEstado, DadosCidade } from '../types';
import { fmtNum, fmtInteiro, CORES } from '../utils/formatters';

// ─── Leaflet: import dinâmico (evita "window is not defined" no SSR) ───
const L = typeof window !== 'undefined' ? require('leaflet') : null;
if (L) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// ─── GeoJSON do Brasil ───
const BRASIL_GEO_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';

/** Sigla → nome completo */
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

// ─── Color scale (6 passos laranja) ───
const HEAT_COLORS = [
  '#1E2329',   // quase nulo
  '#3D3020',   // muito baixo
  '#664400',   // baixo
  '#CC7A00',   // médio
  '#FF8533',   // alto
  '#FF6600',   // máximo
];

function getHeatColor(value: number, max: number): string {
  if (max === 0) return HEAT_COLORS[0];
  const ratio = value / max;
  if (ratio > 0.7) return HEAT_COLORS[5];
  if (ratio > 0.5) return HEAT_COLORS[4];
  if (ratio > 0.3) return HEAT_COLORS[3];
  if (ratio > 0.15) return HEAT_COLORS[2];
  if (ratio > 0.05) return HEAT_COLORS[1];
  return HEAT_COLORS[0];
}

// ─── FlyTo helper component ───
function FlyToView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

// ─── Props ───
interface MapaBrasilProps {
  dados: DadosEstado[];
  metrica: 'matriculas' | 'concluintes' | 'turmas';
  cidades?: Record<string, DadosCidade[]>;
  estadoSelecionado?: string | null;
  onEstadoClick?: (uf: string) => void;
  altura?: number;
}

// ─── Zoom / center por UF ───
const STATE_BOUNDS: Record<string, { center: [number, number]; zoom: number }> = {
  SP: { center: [-22.3, -49.5], zoom: 7 },
  MG: { center: [-18.5, -44.5], zoom: 7 },
  RJ: { center: [-22.5, -43.2], zoom: 9 },
  PR: { center: [-24.8, -51.5], zoom: 7 },
  RS: { center: [-29.5, -52.5], zoom: 7 },
  BA: { center: [-13.0, -41.5], zoom: 6 },
  SC: { center: [-27.5, -49.5], zoom: 8 },
  GO: { center: [-15.9, -49.5], zoom: 7 },
  PE: { center: [-8.3, -36.5], zoom: 8 },
  CE: { center: [-5.3, -39.5], zoom: 7 },
  PA: { center: [-4.0, -52.0], zoom: 6 },
  DF: { center: [-15.8, -47.9], zoom: 11 },
  MA: { center: [-5.5, -45.0], zoom: 7 },
  MT: { center: [-13.0, -55.0], zoom: 6 },
  MS: { center: [-21.0, -55.0], zoom: 7 },
  ES: { center: [-20.0, -40.5], zoom: 8 },
  PB: { center: [-7.2, -36.5], zoom: 8 },
  RN: { center: [-5.8, -36.5], zoom: 8 },
  PI: { center: [-7.5, -43.0], zoom: 7 },
  AL: { center: [-9.6, -36.6], zoom: 9 },
  SE: { center: [-10.9, -37.1], zoom: 9 },
  TO: { center: [-10.5, -48.5], zoom: 7 },
  AM: { center: [-4.0, -64.0], zoom: 5 },
  RO: { center: [-11.0, -63.0], zoom: 7 },
  AC: { center: [-9.5, -70.5], zoom: 7 },
  AP: { center: [1.0, -51.0], zoom: 7 },
  RR: { center: [2.5, -61.0], zoom: 7 },
};

const BRASIL_CENTER: [number, number] = [-14.5, -53.0];
const BRASIL_ZOOM = 4;

export default function MapaBrasilLeaflet({
  dados, metrica, cidades, estadoSelecionado, onEstadoClick, altura = 440,
}: MapaBrasilProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [estadoExpandido, setEstadoExpandido] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const geoRef = useRef<any>(null);

  // Load GeoJSON
  useEffect(() => {
    fetch(BRASIL_GEO_URL)
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Erro ao carregar GeoJSON:', err));
  }, []);

  // Data map
  const { dadosMap, maxVal } = useMemo(() => {
    const map = new Map<string, DadosEstado>();
    let max = 0;
    dados.forEach(d => {
      map.set(d.uf, d);
      if (d[metrica] > max) max = d[metrica];
    });
    return { dadosMap: map, maxVal: max };
  }, [dados, metrica]);

  const metricaLabel = metrica === 'matriculas' ? 'Matrículas' : metrica === 'concluintes' ? 'Concluintes' : 'Turmas';

  // Cidades do estado expandido
  const cidadesEstado = useMemo(() => {
    if (!estadoExpandido || !cidades) return [];
    return (cidades[estadoExpandido] || []).sort((a, b) => b[metrica] - a[metrica]);
  }, [estadoExpandido, cidades, metrica]);

  const totalEstadoExpandido = estadoExpandido
    ? dadosMap.get(estadoExpandido)?.[metrica] || 0
    : 0;

  // Bubble radius
  const getRadius = useMemo(() => {
    if (cidadesEstado.length === 0) return () => 6;
    const maxV = Math.max(...cidadesEstado.map(c => c[metrica]));
    return (val: number) => {
      const MIN = 5, MAX = 20;
      if (maxV === 0) return MIN;
      return MIN + ((val / maxV) * (MAX - MIN));
    };
  }, [cidadesEstado, metrica]);

  // Zoom target
  const flyTarget = useMemo(() => {
    if (estadoExpandido && STATE_BOUNDS[estadoExpandido]) {
      return STATE_BOUNDS[estadoExpandido];
    }
    return { center: BRASIL_CENTER, zoom: BRASIL_ZOOM };
  }, [estadoExpandido]);

  // ─── Handlers ───
  const handleEstadoClick = useCallback((uf: string) => {
    if (estadoExpandido) return;
    setEstadoExpandido(uf);
    onEstadoClick?.(uf);
  }, [estadoExpandido, onEstadoClick]);

  const handleVoltar = useCallback(() => {
    setEstadoExpandido(null);
    setHovered(null);
    onEstadoClick?.('');
  }, [onEstadoClick]);

  // ─── GeoJSON style callback ───
  const styleFeature = useCallback((feature?: Feature): PathOptions => {
    if (!feature) return {};
    const geoName = feature.properties?.name || feature.properties?.NAME || feature.properties?.nome || '';
    const uf = NAME_TO_UF[geoName] || '';
    const val = dadosMap.get(uf)?.[metrica] || 0;
    const isThis = uf === estadoExpandido;
    const isHovered = uf === hovered;

    if (estadoExpandido) {
      return {
        fillColor: isThis ? '#212529' : '#16191d',
        fillOpacity: isThis ? 0.85 : 0.35,
        color: isThis ? CORES.laranja : '#333',
        weight: isThis ? 2.5 : 0.5,
      };
    }

    return {
      fillColor: isHovered ? '#FF8533' : getHeatColor(val, maxVal),
      fillOpacity: isHovered ? 0.95 : 0.85,
      color: isHovered ? '#FFB380' : '#495057',
      weight: isHovered ? 2 : 0.8,
    };
  }, [dadosMap, metrica, maxVal, estadoExpandido, hovered]);

  // ─── GeoJSON feature events ───
  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const geoName = feature.properties?.name || feature.properties?.NAME || feature.properties?.nome || '';
    const uf = NAME_TO_UF[geoName] || '';
    const dadoEstado = dadosMap.get(uf);
    const val = dadoEstado ? dadoEstado[metrica] : 0;

    layer.on({
      mouseover: () => {
        if (!estadoExpandido) setHovered(uf);
      },
      mouseout: () => {
        if (!estadoExpandido) setHovered(null);
      },
      click: () => handleEstadoClick(uf),
    });

    // Tooltip
    if (!estadoExpandido) {
      layer.bindTooltip(
        `<div style="text-align:center;font-family:Poppins,sans-serif">
          <strong style="font-size:13px;color:#F8F9FA">${geoName}</strong><br/>
          <span style="font-size:10px;color:#ADB5BD">${uf}</span><br/>
          <span style="font-size:14px;font-weight:700;color:#FF6600;font-family:Orbitron,monospace">${fmtInteiro(val)}</span><br/>
          <span style="font-size:10px;color:#6C757D">${metricaLabel}</span>
        </div>`,
        {
          direction: 'top',
          sticky: true,
          className: 'leaflet-tooltip-dark',
          offset: [0, -10],
        }
      );
    }
  }, [dadosMap, metrica, metricaLabel, estadoExpandido, handleEstadoClick]);

  return (
    <div style={{
      backgroundColor: '#343A40', borderRadius: 12, border: '1px solid #495057',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px 8px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
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

      {/* Map */}
      <div style={{ height: estadoExpandido ? altura + 40 : altura }}>
        <MapContainer
          center={BRASIL_CENTER}
          zoom={BRASIL_ZOOM}
          minZoom={3}
          maxZoom={14}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ height: '100%', width: '100%', backgroundColor: '#1a1d21' }}
          attributionControl={false}
        >
          {/* CartoDB Dark Matter — visual escuro profissional */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />

          {/* FlyTo para animar zoom */}
          <FlyToView center={flyTarget.center} zoom={flyTarget.zoom} />

          {/* Choropleth GeoJSON */}
          {geoData && (
            <GeoJSON
              key={`geo-${estadoExpandido}-${hovered}-${metrica}`}
              ref={geoRef}
              data={geoData}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Cidades (bolhas) quando drill-down */}
          {estadoExpandido && cidadesEstado.map((cidade, idx) => {
            const r = getRadius(cidade[metrica]);
            const isTop5 = idx < 5;
            return (
              <CircleMarker
                key={cidade.nome}
                center={[cidade.lat, cidade.lng]}
                radius={r}
                pathOptions={{
                  fillColor: CORES.laranja,
                  fillOpacity: isTop5 ? 0.85 : 0.6,
                  color: '#FF6600',
                  weight: isTop5 ? 2.5 : 1.5,
                }}
              >
                <LTooltip
                  direction="top"
                  offset={[0, -r]}
                  className="leaflet-tooltip-dark"
                >
                  <div style={{ textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
                    <strong style={{ fontSize: 13, color: '#F8F9FA' }}>{cidade.nome}</strong><br />
                    <span style={{
                      fontSize: 15, fontWeight: 700, color: '#FF6600',
                      fontFamily: "'Orbitron', monospace",
                    }}>
                      {fmtInteiro(cidade[metrica])}
                    </span><br />
                    <span style={{ fontSize: 10, color: '#6C757D' }}>{metricaLabel}</span>
                  </div>
                </LTooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Ranking cidades (drill-down) */}
      {estadoExpandido && cidadesEstado.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
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
                    ? ((cidade[metrica] / totalEstadoExpandido) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={cidade.nome}
                      style={{ borderBottom: '1px solid #3D4349' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3D4349')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '7px 8px', color: '#FF6600', fontWeight: 700, fontSize: '0.72rem' }}>
                        {idx + 1}º
                      </td>
                      <td style={{ padding: '7px 8px', color: '#F8F9FA', fontWeight: 500 }}>{cidade.nome}</td>
                      <td style={{
                        padding: '7px 8px', color: '#F8F9FA', textAlign: 'right', fontWeight: 600,
                        fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem',
                      }}>
                        {fmtInteiro(cidade[metrica])}
                      </td>
                      <td style={{ padding: '7px 8px', color: '#ADB5BD', textAlign: 'right' }}>{fmtInteiro(cidade.concluintes)}</td>
                      <td style={{ padding: '7px 8px', color: '#ADB5BD', textAlign: 'right' }}>{fmtInteiro(cidade.turmas)}</td>
                      <td style={{ padding: '7px 8px', color: '#ADB5BD', textAlign: 'right' }}>{cidade.instituicoes}</td>
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
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 20px 14px', justifyContent: 'center',
        }}>
          <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>Menor</span>
          {HEAT_COLORS.map((c, i) => (
            <div key={i} style={{
              width: 28, height: 10, backgroundColor: c, borderRadius: 2,
              border: '1px solid #495057',
            }} />
          ))}
          <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>Maior</span>
          {estadoSelecionado && (
            <button onClick={() => onEstadoClick?.('')}
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
