/**
 * Filtro de Franquia
 * Dropdown para seleção de franquia
 * Busca dinâmica da lista de franquias da aba carteira_realizado
 * Respeita o nível de acesso do usuário
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, Search, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface FiltroFranquiaProps {
  franquiaSelecionada: string;
  onFranquiaChange: (franquia: string) => void;
  fullWidth?: boolean;
}

export default function FiltroFranquia({ franquiaSelecionada, onFranquiaChange, fullWidth = false }: FiltroFranquiaProps) {
  const { user } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [todasFranquias, setTodasFranquias] = useState<string[]>([]);
  const [loadingFranquias, setLoadingFranquias] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar franquias da API (aba carteira_realizado, coluna A)
  useEffect(() => {
    let cancelled = false;
    async function fetchFranquias() {
      try {
        const response = await fetch('/api/fluxo-projetado/franquias');
        const json = await response.json();
        if (!cancelled && json.data) {
          setTodasFranquias(json.data);
        }
      } catch (err) {
        console.error('Erro ao buscar franquias:', err);
      } finally {
        if (!cancelled) setLoadingFranquias(false);
      }
    }
    fetchFranquias();
    return () => { cancelled = true; };
  }, []);
  
  // Franqueado (accessLevel = 0) só pode ver sua própria unidade
  const isFranqueado = user?.accessLevel === 0;
  const franquias = isFranqueado && user?.unitPrincipal 
    ? [user.unitPrincipal] 
    : todasFranquias;
  
  // Auto-selecionar a franquia do usuário se for franqueado
  useEffect(() => {
    if (isFranqueado && user?.unitPrincipal && !franquiaSelecionada) {
      onFranquiaChange(user.unitPrincipal);
    }
  }, [isFranqueado, user?.unitPrincipal, franquiaSelecionada, onFranquiaChange]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
        setBusca('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foco no input ao abrir
  useEffect(() => {
    if (aberto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [aberto]);

  const franquiasFiltradas = franquias.filter(f =>
    f.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSelect = (franquia: string) => {
    onFranquiaChange(franquia);
    setAberto(false);
    setBusca('');
  };
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`} ref={containerRef} style={{ position: 'relative' }}>
      {/* Botão do dropdown */}
      <div
        onClick={() => setAberto(!aberto)}
        className={`flex items-center gap-2 px-3 py-2 bg-[#252830] border rounded-lg cursor-pointer transition-all ${
          aberto ? 'border-orange-500' : 'border-gray-700 hover:border-gray-600'
        } ${fullWidth ? 'w-full' : ''}`}
      >
        <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <span className={`text-sm font-semibold flex-1 min-w-0 truncate ${franquiaSelecionada ? 'text-white' : 'text-gray-400'}`}>
          {franquiaSelecionada || 'Selecione uma franquia'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown com busca */}
      {aberto && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: '#1e2028',
            border: '1px solid #374151',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Campo de busca */}
          <div style={{ padding: '8px', borderBottom: '1px solid #374151' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#6b7280' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar franquia..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 28px',
                  background: '#252830',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              />
              {busca && (
                <button
                  onClick={(e) => { e.stopPropagation(); setBusca(''); inputRef.current?.focus(); }}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          </div>

          {/* Lista de franquias */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {loadingFranquias ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.8125rem' }}>
                Carregando franquias...
              </div>
            ) : franquiasFiltradas.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.8125rem' }}>
                Nenhuma franquia encontrada
              </div>
            ) : (
              franquiasFiltradas.map((franquia) => (
                <div
                  key={franquia}
                  onClick={() => handleSelect(franquia)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: franquia === franquiaSelecionada ? '#fb923c' : '#e5e7eb',
                    backgroundColor: franquia === franquiaSelecionada ? 'rgba(251,146,60,0.1)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (franquia !== franquiaSelecionada) e.currentTarget.style.backgroundColor = '#2a2f36'; }}
                  onMouseLeave={(e) => { if (franquia !== franquiaSelecionada) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {franquia}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
