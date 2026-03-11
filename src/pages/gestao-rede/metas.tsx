/**
 * Página de Gerenciamento de Metas - Gestão Rede
 * Permite configurar metas dos indicadores PEX por unidade
 * Editável: altera diretamente na planilha de metas
 * ACESSO RESTRITO: Apenas Franqueadora (accessLevel >= 1)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Save, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useModuloPermissions } from '@/modules/controle-modulos/hooks';
import { GestaoRedeLayout, Card } from '@/modules/gestao-rede';
import { MetaIndicadorUnidade } from '@/modules/gestao-rede/types';

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

export default function MetasGestaoRede() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { allowedIds, loading: permissionsLoading } = useModuloPermissions(user?.username, user?.accessLevel);

  const [metas, setMetas] = useState<MetaIndicadorUnidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [alteracoes, setAlteracoes] = useState<Map<string, Map<string, string>>>(new Map());
  const [busca, setBusca] = useState('');
  const [filtroMes, setFiltroMes] = useState<string>('todos');

  // Auth check - permissão do módulo pela planilha
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && user && !permissionsLoading && !allowedIds.has('gestao-rede')) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router, user, permissionsLoading, allowedIds]);

  // Fetch metas
  const fetchMetas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/gestao-rede/metas');
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao buscar metas');
      setMetas(result.data || []);
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

  // Meses disponíveis
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

  // Filtrar por busca e mês
  const metasFiltradas = useMemo(() => {
    let filtered = metas;
    if (filtroMes !== 'todos') {
      filtered = filtered.filter(m => formatarData(m.data) === filtroMes);
    }
    if (busca) {
      filtered = filtered.filter(m =>
        m.nm_unidade?.toLowerCase().includes(busca.toLowerCase())
      );
    }
    return filtered;
  }, [metas, busca, filtroMes]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                <input
                  type="text"
                  placeholder="Buscar unidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 34px',
                    backgroundColor: '#343A40',
                    color: '#F8F9FA',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                    width: '250px',
                  }}
                />
              </div>
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
              <div style={{ minWidth: '1400px' }}>
                {/* Cabeçalho */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 180px repeat(11, 1fr) 80px',
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
                  {INDICADORES_COLUNAS.map(ind => (
                    <div key={ind.id} style={{ textAlign: 'center' }}>{ind.label}</div>
                  ))}
                  <div style={{ textAlign: 'center' }}>Ativo PEX</div>
                </div>

                {/* Linhas */}
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {metasFiltradas.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                      {metas.length === 0
                        ? 'Nenhum dado na planilha. Adicione as linhas com data, unidade e ativo_pex na aba BASE.'
                        : 'Nenhuma unidade encontrada com essa busca.'}
                    </div>
                  ) : (
                    metasFiltradas.map((meta, index) => {
                      const chave = getChave(meta);
                      const alteracoesMeta = alteracoes.get(chave);
                      const foiAlterado = alteracoesMeta && alteracoesMeta.size > 0;

                      return (
                        <div
                          key={chave + index}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '60px 180px repeat(11, 1fr) 80px',
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

                          {/* Inputs dos indicadores */}
                          {INDICADORES_COLUNAS.map(ind => {
                            const valorAtual = alteracoesMeta?.get(ind.coluna) ??
                              (meta as unknown as Record<string, string>)[ind.coluna] ?? '';
                            const foiAlteradoCol = alteracoesMeta?.has(ind.coluna);

                            return (
                              <div key={ind.id} style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  value={valorAtual}
                                  placeholder={ind.placeholder}
                                  onChange={(e) => handleChange(meta, ind.coluna, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: ind.formato === 'moeda' ? '5px 6px 5px 26px' : ind.formato === 'percentual' ? '5px 20px 5px 6px' : '5px 6px',
                                    backgroundColor: '#343A40',
                                    color: 'white',
                                    border: foiAlteradoCol ? '2px solid #FF6600' : '1px solid #555',
                                    borderRadius: '5px',
                                    fontSize: '0.72rem',
                                    fontFamily: 'Poppins, sans-serif',
                                    textAlign: 'center',
                                    outline: 'none',
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

                          {/* Ativo PEX */}
                          <div>
                            <select
                              value={alteracoesMeta?.get('ativo_pex') ?? (meta.ativo_pex || 'SIM')}
                              onChange={(e) => handleChange(meta, 'ativo_pex', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '5px 4px',
                                backgroundColor: '#343A40',
                                color: (alteracoesMeta?.get('ativo_pex') ?? (meta.ativo_pex || 'SIM')).toUpperCase() === 'NÃO' ? '#c0392b' : '#27ae60',
                                border: alteracoesMeta?.has('ativo_pex') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '5px',
                                fontSize: '0.72rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            >
                              <option value="SIM">SIM</option>
                              <option value="NÃO">NÃO</option>
                            </select>
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
