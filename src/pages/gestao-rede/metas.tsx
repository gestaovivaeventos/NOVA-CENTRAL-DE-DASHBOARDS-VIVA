/**
 * Página de Gerenciamento de Metas - Gestão Rede
 * Permite configurar metas dos indicadores PEX por unidade
 * Editável: altera diretamente na planilha de metas
 * ACESSO RESTRITO: Apenas Franqueadora (accessLevel >= 1)
 * 
 * Permissões de edição:
 * - cris (38793) e gabriel.braz (96998): podem editar TODAS as colunas
 * - EVERDAN (10): pode editar tudo EXCETO VVR e VVR Carteira
 * - Cada consultor responsável: pode editar apenas metas das suas franquias
 * - Validado: apenas EVERDAN, cris e gabriel.braz podem marcar
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Save, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { GestaoRedeLayout, Card } from '@/modules/gestao-rede';
import { MetaIndicadorUnidade, Franquia } from '@/modules/gestao-rede/types';

// ========== CONSTANTES DE PERMISSÃO ==========
const ADMINS = ['cris', 'gabriel.braz'];
const ADMIN_IDS = ['38793', '96998'];
const GERENTES = ['EVERDAN'];
const GERENTE_IDS = ['10'];
const VALIDADORES = [...ADMINS, ...GERENTES];
const VALIDADOR_IDS = [...ADMIN_IDS, ...GERENTE_IDS];
// Colunas restritas (apenas admins)
const COLUNAS_RESTRITAS_EVERDAN = ['vvr', 'vvr_carteira'];

const INDICADORES_COLUNAS = [
  { id: 'vvr', label: 'VVR', coluna: 'vvr', formato: 'moeda', placeholder: 'R$ 0,00' },
  { id: 'vvr_carteira', label: 'VVR Carteira', coluna: 'vvr_carteira', formato: 'moeda', placeholder: 'R$ 0,00' },
  { id: 'endividamento', label: '% Endivid.', coluna: 'endividamento', formato: 'percentual', placeholder: '0,00%' },
  { id: 'nps', label: 'NPS', coluna: 'nps', formato: 'numero', placeholder: '0' },
  { id: 'mc_entrega', label: '% MC Entrega', coluna: 'mc_entrega', formato: 'percentual', placeholder: '0,00%' },
  { id: 'enps', label: 'E-NPS', coluna: 'enps', formato: 'numero', placeholder: '0' },
  { id: 'conformidade', label: 'Conformid.', coluna: 'conformidade', formato: 'percentual', placeholder: '0,00%' },
  { id: 'reclame_aqui', label: 'Reclame Aqui', coluna: 'reclame_aqui', formato: 'numero', placeholder: '0' },
  { id: 'colab_1_ano', label: 'Colab. +1 Ano', coluna: 'colab_1_ano', formato: 'percentual', placeholder: '0,00%' },
  { id: 'estrutura_organizacional', label: 'Estrut. Org.', coluna: 'estrutura_organizacional', formato: 'percentual', placeholder: '0,00%' },
  { id: 'churn', label: 'Churn', coluna: 'churn', formato: 'percentual', placeholder: '0,00%' },
];

const ABREV_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Formata data DD/MM/YYYY → "jan/2026" */
function formatarData(data: string): string {
  if (!data) return '';
  const partes = data.split('/');
  if (partes.length >= 3) {
    const mes = parseInt(partes[1], 10);
    const ano = partes[2];
    if (mes >= 1 && mes <= 12) return `${ABREV_MESES[mes - 1]}/${ano}`;
  }
  if (partes.length === 2) {
    const mes = parseInt(partes[0], 10);
    const ano = partes[1];
    if (mes >= 1 && mes <= 12) return `${ABREV_MESES[mes - 1]}/${ano}`;
  }
  return data;
}

// ========== COMPONENTE DROPDOWN MULTI-SELECT INLINE ==========
interface DropdownMultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  width?: string;
}

function DropdownMultiSelect({ options, selectedValues, onChange, placeholder = 'Selecione...', width = '250px' }: DropdownMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isPositioned && triggerRef.current) {
      requestAnimationFrame(() => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
          setIsPositioned(true);
        }
      });
    }
    if (!isOpen) setIsPositioned(false);
  }, [isOpen, isPositioned]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && isPositioned && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
    };
    if (isOpen) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true); };
  }, [isOpen, isPositioned]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleSelectOnly = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([option]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return 'Todos';
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} selecionados`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width }}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#343A40',
          color: selectedValues.length > 0 ? '#F8F9FA' : '#6c757d',
          border: '1px solid #555',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontFamily: 'Poppins, sans-serif',
          cursor: 'pointer',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDisplayText()}</span>
        <ChevronDown size={16} style={{ color: '#6c757d', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            backgroundColor: '#2a2f36',
            border: '1px solid #555',
            borderRadius: '8px',
            zIndex: 9999,
            maxHeight: '300px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            opacity: isPositioned ? 1 : 0,
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #3a3f46' }}>
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: '100%',
                padding: '6px 10px',
                backgroundColor: '#1f2329',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', borderBottom: '1px solid #3a3f46' }}>
            <button type="button" onClick={() => onChange(options.map(o => o))} style={{ flex: 1, padding: '3px', background: 'transparent', color: '#adb5bd', border: 'none', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF6600'; }} onMouseLeave={e => { e.currentTarget.style.color = '#adb5bd'; }}>
              ✓ Todos
            </button>
            <button type="button" onClick={() => { onChange([]); setIsOpen(false); }} style={{ flex: 1, padding: '3px', background: 'transparent', color: '#adb5bd', border: 'none', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF6600'; }} onMouseLeave={e => { e.currentTarget.style.color = '#adb5bd'; }}>
              ⟲ Limpar
            </button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
            {filteredOptions.map(option => {
              const isSelected = selectedValues.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => handleToggle(option)}
                  style={{
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#343A40'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(255, 102, 0, 0.1)' : 'transparent'; }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
                    border: isSelected ? '2px solid #FF6600' : '2px solid #555',
                    backgroundColor: isSelected ? '#FF6600' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ color: '#F8F9FA', fontSize: '0.8rem', fontFamily: 'Poppins, sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option}</span>
                  <button
                    type="button"
                    onClick={(e) => handleSelectOnly(option, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6c757d',
                      fontSize: '0.6rem',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'Poppins, sans-serif',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#FF6600'; e.currentTarget.style.backgroundColor = 'rgba(255,102,0,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#6c757d'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    Somente
                  </button>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL ==========
export default function MetasGestaoRede() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [metas, setMetas] = useState<MetaIndicadorUnidade[]>([]);
  const [franquias, setFranquias] = useState<Franquia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [alteracoes, setAlteracoes] = useState<Map<string, Map<string, string>>>(new Map());
  const [filtroUnidades, setFiltroUnidades] = useState<string[]>([]);
  const [filtroConsultor, setFiltroConsultor] = useState<string[]>([]);
  const [filtroMes, setFiltroMes] = useState<string>('todos');

  // ========== PERMISSÕES ==========
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return ADMINS.includes(user.username) || ADMIN_IDS.includes(user.id);
  }, [user]);

  const isGerente = useMemo(() => {
    if (!user) return false;
    return GERENTES.includes(user.username) || GERENTE_IDS.includes(user.id);
  }, [user]);

  const isValidador = useMemo(() => isAdmin || isGerente, [isAdmin, isGerente]);

  // Map de consultor por unidade (de franquias)
  const consultorPorUnidade = useMemo(() => {
    const map = new Map<string, string>();
    franquias.forEach(f => {
      if (f.consultorResponsavel) {
        map.set(f.nome.trim().toLowerCase(), f.consultorResponsavel);
      }
    });
    return map;
  }, [franquias]);

  // Map de usuario_central por unidade (login do consultor na central)
  const usuarioCentralPorUnidade = useMemo(() => {
    const map = new Map<string, string>();
    franquias.forEach(f => {
      if (f.usuarioCentral) {
        map.set(f.nome.trim().toLowerCase(), f.usuarioCentral);
      }
    });
    return map;
  }, [franquias]);

  // Verificar se o usuário é consultor responsável de uma unidade
  const isConsultorDaUnidade = useCallback((unidade: string) => {
    if (!user) return false;
    const usuarioCentral = usuarioCentralPorUnidade.get(unidade.trim().toLowerCase()) || '';
    // Comparar pelo usuario_central (login na central)
    return usuarioCentral.toLowerCase() === user.username.toLowerCase();
  }, [user, usuarioCentralPorUnidade]);

  // Verificar se pode editar uma coluna específica de uma unidade
  const podeEditar = useCallback((unidade: string, coluna: string) => {
    if (!user) return false;
    // VVR e VVR Carteira: SOMENTE admins (cris e gabriel.braz)
    if (COLUNAS_RESTRITAS_EVERDAN.includes(coluna)) return isAdmin;
    // Admins: podem editar TUDO
    if (isAdmin) return true;
    // Gerente (EVERDAN): pode editar tudo EXCETO VVR e VVR Carteira (já filtrado acima)
    if (isGerente) return true;
    // Consultor responsável: pode editar apenas metas das suas franquias (exceto VVR/VVR Carteira)
    if (isConsultorDaUnidade(unidade)) return true;
    return false;
  }, [user, isAdmin, isGerente, isConsultorDaUnidade]);

  // Verificar se pode marcar validado
  const podeValidar = useMemo(() => isValidador, [isValidador]);

  // ========== FETCH DATA ==========
  const fetchMetas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [metasRes, franquiasRes] = await Promise.all([
        fetch('/api/gestao-rede/metas'),
        fetch('/api/gestao-rede/data'),
      ]);
      const metasResult = await metasRes.json();
      const franquiasResult = await franquiasRes.json();
      if (!metasResult.success) throw new Error(metasResult.message || 'Erro ao buscar metas');
      setMetas(metasResult.data || []);
      setFranquias(franquiasResult.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  // Chave única: data + unidade
  const getChave = (meta: MetaIndicadorUnidade) => `${meta.data}||${meta.nm_unidade}`;

  // Handle change
  const handleChange = (meta: MetaIndicadorUnidade, coluna: string, valor: string) => {
    const chave = getChave(meta);
    const novasAlteracoes = new Map(alteracoes);
    if (!novasAlteracoes.has(chave)) {
      novasAlteracoes.set(chave, new Map());
    }
    novasAlteracoes.get(chave)!.set(coluna, valor);
    setAlteracoes(novasAlteracoes);
  };

  // Salvar alterações
  const salvarAlteracoes = async () => {
    if (alteracoes.size === 0) {
      setMensagem({ tipo: 'error', texto: 'Nenhuma alteração para salvar' });
      return;
    }

    try {
      setSaving(true);
      setMensagem(null);

      let totalAlteracoes = 0;
      alteracoes.forEach(colunas => { totalAlteracoes += colunas.size; });

      for (const [chave, colunas] of alteracoes.entries()) {
        const [dataRef, unidade] = chave.split('||');
        
        for (const [coluna, valor] of colunas.entries()) {
          const response = await fetch('/api/gestao-rede/metas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unidade, data: dataRef, coluna, valor }),
          });

          const resultado = await response.json();
          if (!response.ok) {
            throw new Error(resultado.message || `Erro ao atualizar ${unidade} / ${coluna}`);
          }
        }
      }

      await fetchMetas();
      setAlteracoes(new Map());
      setMensagem({ tipo: 'success', texto: `${totalAlteracoes} meta(s) atualizada(s) com sucesso!` });
    } catch (err: any) {
      setMensagem({ tipo: 'error', texto: err.message || 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  // ========== OPÇÕES DE FILTRO ==========
  const unidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    metas.forEach(m => { if (m.nm_unidade) set.add(m.nm_unidade.trim()); });
    return Array.from(set).sort();
  }, [metas]);

  const consultoresDisponiveis = useMemo(() => {
    const set = new Set<string>();
    franquias.forEach(f => { if (f.consultorResponsavel) set.add(f.consultorResponsavel); });
    return Array.from(set).sort();
  }, [franquias]);

  const mesesDisponiveis = useMemo(() => {
    const mesesSet = new Set<string>();
    metas.forEach(m => {
      const f = formatarData(m.data);
      if (f) mesesSet.add(f);
    });
    return Array.from(mesesSet).sort((a, b) => {
      const [mA, yA] = a.split('/');
      const [mB, yB] = b.split('/');
      if (yA !== yB) return parseInt(yB) - parseInt(yA);
      return ABREV_MESES.indexOf(mB) - ABREV_MESES.indexOf(mA);
    });
  }, [metas]);

  // ========== FILTRAGEM ==========
  const metasFiltradas = useMemo(() => {
    let filtered = metas;
    if (filtroMes !== 'todos') {
      filtered = filtered.filter(m => formatarData(m.data) === filtroMes);
    }
    if (filtroUnidades.length > 0) {
      filtered = filtered.filter(m => filtroUnidades.includes(m.nm_unidade?.trim()));
    }
    if (filtroConsultor.length > 0) {
      filtered = filtered.filter(m => {
        const consultor = consultorPorUnidade.get(m.nm_unidade?.trim().toLowerCase()) || '';
        return filtroConsultor.includes(consultor);
      });
    }
    return filtered;
  }, [metas, filtroMes, filtroUnidades, filtroConsultor, consultorPorUnidade]);

  const totalAlteracoes = useMemo(() => {
    let total = 0;
    alteracoes.forEach(c => { total += c.size; });
    return total;
  }, [alteracoes]);

  if (authLoading || isLoading) {
    return (
      <>
        <Head><title>Metas - Gestão Rede</title></Head>
        <GestaoRedeLayout currentPage="metas">
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: '80vh' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }} />
              <p className="mt-4 text-lg" style={{ color: '#adb5bd' }}>Carregando...</p>
            </div>
          </div>
        </GestaoRedeLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Metas - Gestão Rede</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <GestaoRedeLayout currentPage="metas">
        {/* Header */}
        <div style={{ backgroundColor: '#212529' }}>
          <div style={{ padding: '24px' }}>
            <div style={{
              backgroundColor: '#343A40',
              padding: '20px 30px',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
              borderBottom: '3px solid #FF6600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
            }}>
              <div className="flex items-center space-x-6">
                <div style={{ position: 'relative', width: '140px', height: '50px' }}>
                  <Image src="/images/logo_viva.png" alt="Viva Eventos" fill style={{ objectFit: 'contain' }} priority />
                </div>
                <div className="border-l border-gray-600 pl-6 h-14 flex flex-col justify-center">
                  <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    Metas Indicadores
                  </h1>
                  <span style={{ color: '#adb5bd', fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif' }}>
                    Gerenciamento de Metas por Unidade
                  </span>
                </div>
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#c0392b20',
                  border: '1px solid #c0392b',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertCircle size={18} style={{ color: '#c0392b' }} />
                  <span style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '0 24px 24px' }}>
          {/* Mensagem de feedback */}
          {mensagem && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: mensagem.tipo === 'success' ? '#22c55e20' : '#ef444420',
              border: `1px solid ${mensagem.tipo === 'success' ? '#22c55e' : '#ef4444'}`,
              color: mensagem.tipo === 'success' ? '#22c55e' : '#ef4444',
              fontFamily: 'Poppins, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {mensagem.tipo === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {mensagem.texto}
            </div>
          )}

          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Filtro de unidades (multi-select dropdown) */}
              <DropdownMultiSelect
                options={unidadesDisponiveis}
                selectedValues={filtroUnidades}
                onChange={setFiltroUnidades}
                placeholder="Filtrar unidades..."
                width="250px"
              />
              {/* Filtro de consultor responsável */}
              <DropdownMultiSelect
                options={consultoresDisponiveis}
                selectedValues={filtroConsultor}
                onChange={setFiltroConsultor}
                placeholder="Consultor responsável..."
                width="220px"
              />
              {/* Filtro de mês */}
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#343A40',
                  color: '#F8F9FA',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              >
                <option value="todos">Todos os meses</option>
                {mesesDisponiveis.map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
              <span style={{ color: '#6c757d', fontSize: '0.8rem', fontFamily: 'Poppins, sans-serif' }}>
                {metasFiltradas.length} unidade(s)
              </span>
            </div>

            {/* Botão salvar */}
            <button
              onClick={salvarAlteracoes}
              disabled={saving || totalAlteracoes === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: totalAlteracoes > 0 ? '#FF6600' : '#555',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: totalAlteracoes > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Save size={18} />
              {saving ? 'Salvando...' : `Salvar Alterações ${totalAlteracoes > 0 ? `(${totalAlteracoes})` : ''}`}
            </button>
          </div>

          {/* Tabela de metas editável */}
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '1600px' }}>
                {/* Cabeçalho */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 140px 110px repeat(11, 1fr) 80px',
                  gap: '6px',
                  padding: '12px 16px',
                  backgroundColor: '#2a2f36',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 600,
                  color: '#FF6600',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  <div>Data</div>
                  <div>Unidade</div>
                  <div>Consultor</div>
                  {INDICADORES_COLUNAS.map(ind => (
                    <div key={ind.id} style={{ textAlign: 'center' }}>{ind.label}</div>
                  ))}
                  <div style={{ textAlign: 'center' }}>Validado</div>
                </div>

                {/* Linhas */}
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {metasFiltradas.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                      {metas.length === 0
                        ? 'Nenhum dado na planilha. Adicione as linhas com data, unidade e validado na aba BASE.'
                        : 'Nenhuma unidade encontrada com os filtros selecionados.'}
                    </div>
                  ) : (
                    metasFiltradas.map((meta, index) => {
                      const chave = getChave(meta);
                      const alteracoesMeta = alteracoes.get(chave);
                      const foiAlterado = alteracoesMeta && alteracoesMeta.size > 0;
                      const consultor = consultorPorUnidade.get(meta.nm_unidade?.trim().toLowerCase()) || '';

                      return (
                        <div
                          key={chave + index}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '60px 140px 110px repeat(11, 1fr) 80px',
                            gap: '6px',
                            padding: '8px 16px',
                            borderBottom: '1px solid #343A40',
                            backgroundColor: foiAlterado
                              ? '#2a2f3680'
                              : index % 2 === 0
                                ? '#2a2f36'
                                : '#23272d',
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'background-color 0.2s',
                            alignItems: 'center',
                          }}
                        >
                          {/* Data */}
                          <div style={{ color: '#6c757d', fontSize: '0.7rem' }}>
                            {formatarData(meta.data)}
                          </div>

                          {/* Unidade */}
                          <div style={{
                            color: '#F8F9FA',
                            fontSize: '0.78rem',
                            fontWeight: foiAlterado ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            {foiAlterado && <span style={{ color: '#FF6600', marginRight: '6px' }}>●</span>}
                            {meta.nm_unidade}
                          </div>

                          {/* Consultor Responsável */}
                          <div style={{
                            color: '#adb5bd',
                            fontSize: '0.72rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }} title={consultor}>
                            {consultor || '-'}
                          </div>

                          {/* Inputs dos indicadores */}
                          {INDICADORES_COLUNAS.map(ind => {
                            const valorAtual = alteracoesMeta?.get(ind.coluna) ??
                              (meta as unknown as Record<string, string>)[ind.coluna] ?? '';
                            const foiAlteradoCol = alteracoesMeta?.has(ind.coluna);
                            const editavel = podeEditar(meta.nm_unidade, ind.coluna);

                            return (
                              <div key={ind.id} style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  value={valorAtual}
                                  placeholder={ind.placeholder}
                                  onChange={(e) => handleChange(meta, ind.coluna, e.target.value)}
                                  disabled={!editavel}
                                  title={!editavel ? 'Sem permissão para editar esta coluna' : undefined}
                                  style={{
                                    width: '100%',
                                    padding: ind.formato === 'moeda' ? '5px 6px 5px 26px' : ind.formato === 'percentual' ? '5px 20px 5px 6px' : '5px 6px',
                                    backgroundColor: editavel ? '#343A40' : '#2a2e33',
                                    color: editavel ? 'white' : '#6c757d',
                                    border: foiAlteradoCol ? '2px solid #FF6600' : '1px solid #555',
                                    borderRadius: '5px',
                                    fontSize: '0.72rem',
                                    fontFamily: 'Poppins, sans-serif',
                                    textAlign: 'center',
                                    outline: 'none',
                                    cursor: editavel ? 'text' : 'not-allowed',
                                    opacity: editavel ? 1 : 0.7,
                                  }}
                                />
                                {ind.formato === 'moeda' && (
                                  <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '0.65rem', pointerEvents: 'none' }}>R$</span>
                                )}
                                {ind.formato === 'percentual' && valorAtual && (
                                  <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '0.65rem', pointerEvents: 'none' }}>%</span>
                                )}
                              </div>
                            );
                          })}

                          {/* Validado (Checkbox) */}
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: podeValidar ? 'pointer' : 'not-allowed' }}>
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const val = alteracoesMeta?.get('validado') ?? (meta.validado || '');
                                  return val.toUpperCase() === 'SIM' || val.toUpperCase() === 'TRUE' || val === '1';
                                })()}
                                onChange={(e) => {
                                  if (!podeValidar) return;
                                  handleChange(meta, 'validado', e.target.checked ? 'SIM' : 'NÃO');
                                }}
                                disabled={!podeValidar}
                                style={{ display: 'none' }}
                              />
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                border: (() => {
                                  const val = alteracoesMeta?.get('validado') ?? (meta.validado || '');
                                  const isChecked = val.toUpperCase() === 'SIM' || val.toUpperCase() === 'TRUE' || val === '1';
                                  if (alteracoesMeta?.has('validado')) return '2px solid #FF6600';
                                  return isChecked ? '2px solid #27ae60' : '2px solid #555';
                                })(),
                                backgroundColor: (() => {
                                  const val = alteracoesMeta?.get('validado') ?? (meta.validado || '');
                                  const isChecked = val.toUpperCase() === 'SIM' || val.toUpperCase() === 'TRUE' || val === '1';
                                  return isChecked ? '#27ae60' : '#343A40';
                                })(),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                opacity: podeValidar ? 1 : 0.5,
                              }}>
                                {(() => {
                                  const val = alteracoesMeta?.get('validado') ?? (meta.validado || '');
                                  const isChecked = val.toUpperCase() === 'SIM' || val.toUpperCase() === 'TRUE' || val === '1';
                                  return isChecked ? <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>✓</span> : null;
                                })()}
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '0.75rem',
            fontFamily: 'Poppins, sans-serif',
          }}>
            Developed by Gestão de Dados - VIVA Eventos Brasil 2025
          </div>
        </div>
      </GestaoRedeLayout>
    </>
  );
}
