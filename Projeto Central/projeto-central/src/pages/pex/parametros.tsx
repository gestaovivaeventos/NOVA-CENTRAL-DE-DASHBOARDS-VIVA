/**
 * Página de Gerenciamento de Parâmetros
 * Permite configurar pesos e metas dos indicadores do PEX
 * ACESSO RESTRITO: Apenas Franqueadora (accessLevel = 1)
 */

import React, { useState, useEffect } from 'react';
import { withAuthAndFranchiser } from '@/utils/auth';
import Head from 'next/head';
import Image from 'next/image';
import { Card, PexLayout, useSheetsData, useParametrosData } from '@/modules/pex';

interface UnidadeConsultor {
  unidade: string;
  consultor: string;
}

interface UnidadeCluster {
  unidade: string;
  cluster: string;
}

interface IndicadorPeso {
  indicador: string;
  quarter1: string;
  quarter2: string;
  quarter3: string;
  quarter4: string;
}

interface MetaCluster {
  cluster: string;
  vvr: string;
  percentualAtigimentoMac: string;
  percentualEndividamento: string;
  nps: string;
  percentualMcEntrega: string;
  enps: string;
  conformidade: string;
}

interface BonusUnidade {
  unidade: string;
  quarter1: string;
  quarter2: string;
  quarter3: string;
  quarter4: string;
}

function ParametrosContent() {
  const { dados: dadosBrutos } = useSheetsData();
  
  // Usar dados do contexto com cache
  const { 
    data: parametrosData, 
    loading: parametrosLoading, 
    hasFetched: parametrosHasFetched,
    forceRefetchAll,
    refetchConsultores,
    refetchClusters,
    refetchPesos,
    refetchMetas,
    refetchBonus,
  } = useParametrosData();
  
  // Forçar busca de dados frescos do banco ao montar o componente
  useEffect(() => {
    console.log('[Parametros] Forçando busca de dados frescos do banco...');
    forceRefetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Estados locais para UI (não afetam o cache)
  const [saving, setSaving] = useState(false);
  const [alteracoes, setAlteracoes] = useState<Map<string, string>>(new Map());
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [pesquisaUnidade, setPesquisaUnidade] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: 'unidade' | 'consultor'; direcao: 'asc' | 'desc' }>({
    coluna: 'unidade',
    direcao: 'asc'
  });

  // Estados para gerenciamento de clusters
  const [savingClusters, setSavingClusters] = useState(false);
  const [alteracoesClusters, setAlteracoesClusters] = useState<Map<string, string>>(new Map());
  const [mensagemClusters, setMensagemClusters] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [pesquisaUnidadeCluster, setPesquisaUnidadeCluster] = useState<string>('');
  const [ordenacaoCluster, setOrdenacaoCluster] = useState<{ coluna: 'unidade' | 'cluster'; direcao: 'asc' | 'desc' }>({
    coluna: 'unidade',
    direcao: 'asc'
  });

  // Estados para gerenciamento de pesos
  const [savingPesos, setSavingPesos] = useState(false);
  const [alteracoesPesos, setAlteracoesPesos] = useState<Map<string, Map<string, string>>>(new Map());
  const [mensagemPesos, setMensagemPesos] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Estados para gerenciamento de metas por cluster
  const [savingMetas, setSavingMetas] = useState(false);
  const [alteracoesMetas, setAlteracoesMetas] = useState<Map<string, Map<string, string>>>(new Map());
  const [mensagemMetas, setMensagemMetas] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Estados para gerenciamento de bônus
  const [savingBonus, setSavingBonus] = useState(false);
  const [alteracoesBonus, setAlteracoesBonus] = useState<Map<string, Map<string, string>>>(new Map());
  const [mensagemBonus, setMensagemBonus] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [pesquisaUnidadeBonus, setPesquisaUnidadeBonus] = useState<string>('');

  // Dados do contexto (com cache)
  const unidadesConsultores = parametrosData.consultores;
  const consultoresAtivos = parametrosData.consultoresAtivos;
  const unidadesClusters = parametrosData.clusters;
  const clustersAtivos = parametrosData.clustersAtivos;
  const indicadoresPesos = parametrosData.pesos;
  const metasClusters = parametrosData.metas;
  const clustersDisponiveis = parametrosData.clustersDisponiveis;
  const bonusUnidades = parametrosData.bonus;
  
  // Loading states do contexto
  const loading = parametrosLoading.consultores;
  const loadingClusters = parametrosLoading.clusters;
  const loadingPesos = parametrosLoading.pesos;
  const loadingMetas = parametrosLoading.metas;
  const loadingBonus = parametrosLoading.bonus;

  // REMOVIDO: Os useEffects de carregamento agora são gerenciados pelo contexto
  // O contexto busca os dados automaticamente na primeira vez que é usado
  // Atualizar consultor localmente
  const handleConsultorChange = (unidade: string, novoConsultor: string) => {
    const novasAlteracoes = new Map(alteracoes);
    novasAlteracoes.set(unidade, novoConsultor);
    setAlteracoes(novasAlteracoes);
  };

  // Filtrar unidades pela pesquisa
  const unidadesFiltradas = unidadesConsultores.filter(uc =>
    uc.unidade.toLowerCase().includes(pesquisaUnidade.toLowerCase())
  );

  // Ordenar unidades
  const unidadesOrdenadas = [...unidadesFiltradas].sort((a, b) => {
    let valorA: string;
    let valorB: string;

    if (ordenacao.coluna === 'unidade') {
      valorA = a.unidade;
      valorB = b.unidade;
    } else {
      valorA = alteracoes.get(a.unidade) || a.consultor || '';
      valorB = alteracoes.get(b.unidade) || b.consultor || '';
    }

    const comparacao = valorA.localeCompare(valorB);
    return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
  });

  // Função para alternar ordenação
  const toggleOrdenacao = (coluna: 'unidade' | 'consultor') => {
    if (ordenacao.coluna === coluna) {
      setOrdenacao({
        coluna,
        direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setOrdenacao({
        coluna,
        direcao: 'asc'
      });
    }
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

      // Salvar cada alteração
      const alteracoesArray = Array.from(alteracoes.entries());
      
      for (let i = 0; i < alteracoesArray.length; i++) {
        const [unidade, consultor] = alteracoesArray[i];
        
        const response = await fetch('/api/pex/consultores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ unidade, consultor }),
        });

        const resultado = await response.json();

        if (!response.ok) {
          throw new Error(resultado.message || `Erro ao atualizar ${unidade}`);
        }
      }

      // Atualizar cache refazendo fetch
      await refetchConsultores();
      setAlteracoes(new Map());
      
      setMensagem({ tipo: 'success', texto: `${alteracoes.size} consultor(es) atualizado(s) com sucesso!` });
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: error.message || 'Erro ao salvar alterações' });
    } finally {
      setSaving(false);
    }
  };

  // Atualizar cluster localmente
  const handleClusterChange = (unidade: string, novoCluster: string) => {
    const novasAlteracoes = new Map(alteracoesClusters);
    novasAlteracoes.set(unidade, novoCluster);
    setAlteracoesClusters(novasAlteracoes);
  };

  // Filtrar unidades pela pesquisa (clusters)
  const unidadesFiltradasClusters = unidadesClusters.filter(uc =>
    uc.unidade.toLowerCase().includes(pesquisaUnidadeCluster.toLowerCase())
  );

  // Ordenar unidades (clusters)
  const unidadesOrdenadasClusters = [...unidadesFiltradasClusters].sort((a, b) => {
    let valorA: string;
    let valorB: string;

    if (ordenacaoCluster.coluna === 'unidade') {
      valorA = a.unidade;
      valorB = b.unidade;
    } else {
      valorA = alteracoesClusters.get(a.unidade) || a.cluster || '';
      valorB = alteracoesClusters.get(b.unidade) || b.cluster || '';
    }

    const comparacao = valorA.localeCompare(valorB);
    return ordenacaoCluster.direcao === 'asc' ? comparacao : -comparacao;
  });

  // Função para alternar ordenação (clusters)
  const toggleOrdenacaoCluster = (coluna: 'unidade' | 'cluster') => {
    if (ordenacaoCluster.coluna === coluna) {
      setOrdenacaoCluster({
        coluna,
        direcao: ordenacaoCluster.direcao === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setOrdenacaoCluster({
        coluna,
        direcao: 'asc'
      });
    }
  };

  // Salvar alterações de clusters
  const salvarAlteracoesClusters = async () => {
    if (alteracoesClusters.size === 0) {
      setMensagemClusters({ tipo: 'error', texto: 'Nenhuma alteração para salvar' });
      return;
    }

    try {
      setSavingClusters(true);
      setMensagemClusters(null);

      const alteracoesArray = Array.from(alteracoesClusters.entries());
      
      for (let i = 0; i < alteracoesArray.length; i++) {
        const [unidade, cluster] = alteracoesArray[i];
        
        const response = await fetch('/api/pex/clusters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ unidade, cluster }),
        });

        const resultado = await response.json();

        if (!response.ok) {
          throw new Error(resultado.message || `Erro ao atualizar cluster de ${unidade}`);
        }
      }

      // Atualizar cache refazendo fetch
      await refetchClusters();
      setAlteracoesClusters(new Map());
      
      setMensagemClusters({ tipo: 'success', texto: `${alteracoesClusters.size} cluster(s) atualizado(s) com sucesso!` });
    } catch (error: any) {
      setMensagemClusters({ tipo: 'error', texto: error.message || 'Erro ao salvar alterações de clusters' });
    } finally {
      setSavingClusters(false);
    }
  };

  // Atualizar peso localmente
  const handlePesoChange = (indicador: string, quarter: '1' | '2' | '3' | '4', novoPeso: string) => {
    const novasAlteracoes = new Map(alteracoesPesos);
    
    if (!novasAlteracoes.has(indicador)) {
      novasAlteracoes.set(indicador, new Map());
    }
    
    novasAlteracoes.get(indicador)!.set(quarter, novoPeso);
    setAlteracoesPesos(novasAlteracoes);
  };

  // Calcular soma total por quarter
  const calcularSomaPorQuarter = (quarter: '1' | '2' | '3' | '4'): number => {
    return indicadoresPesos.reduce((soma, ind) => {
      const alteracoesDoIndicador = alteracoesPesos.get(ind.indicador);
      let valorAtual = '';
      
      switch(quarter) {
        case '1': valorAtual = alteracoesDoIndicador?.get('1') || ind.quarter1; break;
        case '2': valorAtual = alteracoesDoIndicador?.get('2') || ind.quarter2; break;
        case '3': valorAtual = alteracoesDoIndicador?.get('3') || ind.quarter3; break;
        case '4': valorAtual = alteracoesDoIndicador?.get('4') || ind.quarter4; break;
      }
      
      return soma + (parseFloat(valorAtual) || 0);
    }, 0);
  };

  // Validar soma de pesos (deve ser exatamente 10 para cada quarter)
  const validarSomaPesos = (): { valido: boolean; mensagem: string } => {
    const somaQ1 = calcularSomaPorQuarter('1');
    const somaQ2 = calcularSomaPorQuarter('2');
    const somaQ3 = calcularSomaPorQuarter('3');
    const somaQ4 = calcularSomaPorQuarter('4');

    const erros: string[] = [];
    if (somaQ1 !== 10) erros.push(`1º Quarter: ${somaQ1.toFixed(1)}`);
    if (somaQ2 !== 10) erros.push(`2º Quarter: ${somaQ2.toFixed(1)}`);
    if (somaQ3 !== 10) erros.push(`3º Quarter: ${somaQ3.toFixed(1)}`);
    if (somaQ4 !== 10) erros.push(`4º Quarter: ${somaQ4.toFixed(1)}`);

    if (erros.length > 0) {
      return {
        valido: false,
        mensagem: `⚠️ A soma dos pesos deve ser exatamente 10 para cada quarter. Valores atuais: ${erros.join(', ')}`
      };
    }

    return { valido: true, mensagem: '' };
  };

  // Salvar alterações de pesos
  const salvarAlteracoesPesos = async () => {
    if (alteracoesPesos.size === 0) {
      setMensagemPesos({ tipo: 'error', texto: 'Nenhuma alteração para salvar' });
      return;
    }

    // Validar soma antes de salvar
    const validacao = validarSomaPesos();
    if (!validacao.valido) {
      setMensagemPesos({ tipo: 'error', texto: validacao.mensagem });
      return;
    }

    try {
      setSavingPesos(true);
      setMensagemPesos(null);

      // Contar total de alterações
      let totalAlteracoes = 0;
      alteracoesPesos.forEach(quarters => {
        totalAlteracoes += quarters.size;
      });

      let contador = 0;
      const alteracoesArray = Array.from(alteracoesPesos.entries());
      for (let i = 0; i < alteracoesArray.length; i++) {
        const [indicador, quarters] = alteracoesArray[i];
        const quartersArray = Array.from(quarters.entries());
        
        for (let j = 0; j < quartersArray.length; j++) {
          const [quarter, peso] = quartersArray[j];
          contador++;
          
          const response = await fetch('/api/pex/pesos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ indicador, quarter, peso }),
          });

          const resultado = await response.json();

          if (!response.ok) {
            throw new Error(resultado.message || `Erro ao atualizar peso de ${indicador} no Quarter ${quarter}`);
          }
        }
      }

      // Atualizar estado local
      const novosIndicadores = indicadoresPesos.map(ind => {
        const alteracoesDoIndicador = alteracoesPesos.get(ind.indicador);
        if (!alteracoesDoIndicador) return ind;

        return {
          ...ind,
          quarter1: alteracoesDoIndicador.get('1') || ind.quarter1,
          quarter2: alteracoesDoIndicador.get('2') || ind.quarter2,
          quarter3: alteracoesDoIndicador.get('3') || ind.quarter3,
          quarter4: alteracoesDoIndicador.get('4') || ind.quarter4,
        };
      });
      
      // Atualizar cache refazendo fetch
      await refetchPesos();
      setAlteracoesPesos(new Map());
      
      setMensagemPesos({ tipo: 'success', texto: `${totalAlteracoes} peso(s) atualizado(s) com sucesso!` });
    } catch (error: any) {
      setMensagemPesos({ tipo: 'error', texto: error.message || 'Erro ao salvar alterações de pesos' });
    } finally {
      setSavingPesos(false);
    }
  };

  // Atualizar meta localmente
  const handleMetaChange = (cluster: string, coluna: string, novoValor: string) => {
    const novasAlteracoes = new Map(alteracoesMetas);
    
    if (!novasAlteracoes.has(cluster)) {
      novasAlteracoes.set(cluster, new Map());
    }
    
    novasAlteracoes.get(cluster)!.set(coluna, novoValor);
    setAlteracoesMetas(novasAlteracoes);
  };

  // Salvar alterações de metas
  const salvarAlteracoesMetas = async () => {
    if (alteracoesMetas.size === 0) {
      setMensagemMetas({ tipo: 'error', texto: 'Nenhuma alteração para salvar' });
      return;
    }

    try {
      setSavingMetas(true);
      setMensagemMetas(null);

      // Contar total de alterações
      let totalAlteracoes = 0;
      alteracoesMetas.forEach(colunas => {
        totalAlteracoes += colunas.size;
      });

      let contador = 0;
      const alteracoesArray = Array.from(alteracoesMetas.entries());
      for (let i = 0; i < alteracoesArray.length; i++) {
        const [cluster, colunas] = alteracoesArray[i];
        const colunasArray = Array.from(colunas.entries());
        
        for (let j = 0; j < colunasArray.length; j++) {
          const [coluna, valor] = colunasArray[j];
          contador++;
          
          const response = await fetch('/api/pex/metas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cluster, coluna, valor }),
          });

          const resultado = await response.json();

          if (!response.ok) {
            throw new Error(resultado.message || `Erro ao atualizar meta de ${cluster} na coluna ${coluna}`);
          }
        }
      }

      // Atualizar estado local
      const novasMetas = metasClusters.map(meta => {
        const alteracoesDoCluster = alteracoesMetas.get(meta.cluster);
        if (!alteracoesDoCluster) return meta;

        return {
          ...meta,
          vvr: alteracoesDoCluster.get('VVR') || meta.vvr,
          percentualAtigimentoMac: alteracoesDoCluster.get('% ATIGIMENTO MAC') || meta.percentualAtigimentoMac,
          percentualEndividamento: alteracoesDoCluster.get('% ENDIVIDAMENTO') || meta.percentualEndividamento,
          nps: alteracoesDoCluster.get('NPS') || meta.nps,
          percentualMcEntrega: alteracoesDoCluster.get('% MC ENTREGA') || meta.percentualMcEntrega,
          enps: alteracoesDoCluster.get('E-NPS') || meta.enps,
          conformidade: alteracoesDoCluster.get('CONFORMIDADE') || meta.conformidade,
        };
      });
      
      // Atualizar cache refazendo fetch
      await refetchMetas();
      setAlteracoesMetas(new Map());
      
      setMensagemMetas({ tipo: 'success', texto: `${totalAlteracoes} meta(s) atualizada(s) com sucesso!` });
    } catch (error: any) {
      setMensagemMetas({ tipo: 'error', texto: error.message || 'Erro ao salvar alterações de metas' });
    } finally {
      setSavingMetas(false);
    }
  };

  // Função para atualizar bônus localmente
  const handleBonusChange = (unidade: string, quarter: string, valor: string) => {
    // Validar que o valor está entre 0 e 3
    const valorNumerico = parseFloat(valor);
    if (!isNaN(valorNumerico) && (valorNumerico < 0 || valorNumerico > 3)) {
      return; // Não permite valores fora do intervalo
    }
    
    const novasAlteracoes = new Map(alteracoesBonus);
    
    if (!novasAlteracoes.has(unidade)) {
      novasAlteracoes.set(unidade, new Map());
    }
    
    novasAlteracoes.get(unidade)!.set(quarter, valor);
    setAlteracoesBonus(novasAlteracoes);
  };

  // Salvar alterações de bônus
  const salvarAlteracoesBonus = async () => {
    if (alteracoesBonus.size === 0) {
      setMensagemBonus({ tipo: 'error', texto: 'Nenhuma alteração para salvar' });
      return;
    }

    try {
      setSavingBonus(true);
      setMensagemBonus(null);

      // Contar total de alterações
      let totalAlteracoes = 0;
      alteracoesBonus.forEach(quarters => {
        totalAlteracoes += quarters.size;
      });

      let contador = 0;
      const alteracoesArray = Array.from(alteracoesBonus.entries());
      for (let i = 0; i < alteracoesArray.length; i++) {
        const [unidade, quarters] = alteracoesArray[i];
        const quartersArray = Array.from(quarters.entries());
        
        for (let j = 0; j < quartersArray.length; j++) {
          const [quarter, valor] = quartersArray[j];
          contador++;
          
          const response = await fetch('/api/pex/bonus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ unidade, quarter, valor }),
          });

          const resultado = await response.json();

          if (!response.ok) {
            throw new Error(resultado.message || `Erro ao atualizar bônus de ${unidade} no quarter ${quarter}`);
          }
        }
      }

      // Atualizar cache refazendo fetch
      await refetchBonus();
      setAlteracoesBonus(new Map());
      
      setMensagemBonus({ tipo: 'success', texto: `${totalAlteracoes} bônus atualizado(s) com sucesso!` });
      
      setMensagemBonus({ tipo: 'success', texto: `${totalAlteracoes} bônus atualizado(s) com sucesso!` });
    } catch (error: any) {
      setMensagemBonus({ tipo: 'error', texto: error.message || 'Erro ao salvar alterações de bônus' });
    } finally {
      setSavingBonus(false);
    }
  };

  return (
    <PexLayout currentPage="parametros">
      <Head>
        <title>Gerenciamento de Parâmetros - PEX</title>
        <meta name="description" content="Gerenciamento de Parâmetros - Programa de Excelência (PEX)" />
      </Head>

      {/* CSS para aumentar as setas dos inputs de número */}
      <style jsx>{`
        input[type="number"].peso-input::-webkit-inner-spin-button,
        input[type="number"].peso-input::-webkit-outer-spin-button {
          opacity: 0;
          width: 24px;
          height: 24px;
          margin-left: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        input[type="number"].peso-input:focus::-webkit-inner-spin-button,
        input[type="number"].peso-input:focus::-webkit-outer-spin-button,
        input[type="number"].peso-input:hover::-webkit-inner-spin-button,
        input[type="number"].peso-input:hover::-webkit-outer-spin-button {
          opacity: 1;
        }

        input[type="number"].peso-input {
          -moz-appearance: textfield;
          padding-right: 32px !important;
        }

        input[type="number"].peso-input::-webkit-inner-spin-button {
          -webkit-appearance: inner-spin-button;
          display: inline-block;
          position: relative;
        }
      `}</style>

      <main className="container mx-auto px-4 py-4">

        {/* Header com Logo Viva */}
        <div style={{
          backgroundColor: '#343A40',
          padding: '20px 30px',
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
          borderBottom: '3px solid #FF6600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', width: '180px', height: '60px' }}>
              <Image 
                src="/images/logo_viva.png" 
                alt="Viva Eventos" 
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            
            <div style={{ 
              borderLeft: '1px solid #666', 
              paddingLeft: '24px', 
              height: '60px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center' 
            }}>
              <h1 style={{ 
                fontSize: '1.75rem',
                fontWeight: 700,
                background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Orbitron', 'Poppins', sans-serif",
                letterSpacing: '0.05em',
                marginBottom: '0px',
                textTransform: 'uppercase'
              }}>
                PEX - Programa de Excelência Rede Viva
              </h1>
              <span style={{ color: '#adb5bd', fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif', marginTop: '-2px' }}>
                Ciclo {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        <h1 
            className="text-3xl font-bold mb-6" 
            style={{ 
              color: '#adb5bd', 
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px'
            }}
          >
            Gerenciamento de Consultores
          </h1>

          {/* Mensagem de feedback */}
          {mensagem && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: mensagem.tipo === 'success' ? '#22c55e20' : '#ef444420',
              border: `1px solid ${mensagem.tipo === 'success' ? '#22c55e' : '#ef4444'}`,
              color: mensagem.tipo === 'success' ? '#22c55e' : '#ef4444',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {mensagem.texto}
            </div>
          )}

          <Card>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
                <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando dados...</p>
              </div>
            ) : (
              <div>
                {/* Barra de pesquisa */}
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#adb5bd',
                    pointerEvents: 'none',
                    fontSize: '1.1rem'
                  }}>
                    🔍
                  </div>
                  <input
                    type="text"
                    placeholder="Pesquisar unidade..."
                    value={pesquisaUnidade}
                    onChange={(e) => setPesquisaUnidade(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 45px',
                      backgroundColor: '#343A40',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontFamily: 'Poppins, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FF6600'}
                    onBlur={(e) => e.target.style.borderColor = '#555'}
                  />
                  {pesquisaUnidade && (
                    <div style={{ 
                      marginTop: '8px', 
                      color: '#adb5bd', 
                      fontSize: '0.85rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      {unidadesOrdenadas.length} unidade(s) encontrada(s)
                    </div>
                  )}
                </div>

                {/* Cabeçalho da tabela */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#2a2f36',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 600,
                  color: '#FF6600',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem'
                }}>
                  <div 
                    onClick={() => toggleOrdenacao('unidade')}
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    UNIDADE
                    {ordenacao.coluna === 'unidade' && (
                      <span style={{ fontSize: '0.7rem' }}>
                        {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div 
                    onClick={() => toggleOrdenacao('consultor')}
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    CONSULTOR RESPONSÁVEL
                    {ordenacao.coluna === 'consultor' && (
                      <span style={{ fontSize: '0.7rem' }}>
                        {ordenacao.direcao === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de unidades */}
                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  {unidadesOrdenadas.length === 0 ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#adb5bd',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      {pesquisaUnidade ? 'Nenhuma unidade encontrada' : 'Nenhum dado disponível'}
                    </div>
                  ) : (
                    unidadesOrdenadas.map((uc, index) => {
                      const consultorAtual = alteracoes.get(uc.unidade) || uc.consultor;
                      const foiAlterado = alteracoes.has(uc.unidade);

                      return (
                        <div 
                          key={uc.unidade}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            padding: '12px 16px',
                            borderBottom: '1px solid #343A40',
                            backgroundColor: foiAlterado 
                              ? '#2a2f3680' 
                              : index % 2 === 0 
                                ? '#2a2f36' 
                                : '#23272d',
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div style={{ 
                            color: '#F8F9FA',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: foiAlterado ? 600 : 400
                          }}>
                            {foiAlterado && <span style={{ color: '#FF6600', marginRight: '8px' }}>●</span>}
                            {uc.unidade}
                          </div>
                          <div>
                            <select
                              value={consultorAtual}
                              onChange={(e) => handleConsultorChange(uc.unidade, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: foiAlterado ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontFamily: 'Poppons, sans-serif',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="">Selecione um consultor</option>
                              {consultoresAtivos.map(consultor => (
                                <option key={consultor} value={consultor}>
                                  {consultor}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Botão de salvar */}
                <div style={{ 
                  padding: '16px',
                  borderTop: '2px solid #343A40',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#adb5bd', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                    {alteracoes.size > 0 ? (
                      <span style={{ color: '#FF6600', fontWeight: 600 }}>
                        {alteracoes.size} alteração(ões) pendente(s)
                      </span>
                    ) : (
                      'Nenhuma alteração pendente'
                    )}
                  </div>
                  
                  <button
                    onClick={salvarAlteracoes}
                    disabled={saving || alteracoes.size === 0}
                    style={{
                      padding: '10px 24px',
                      background: alteracoes.size > 0 && !saving
                        ? 'linear-gradient(to bottom, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                        : 'linear-gradient(to bottom, #4a5563 0%, #3a4553 50%, #2a3543 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: alteracoes.size > 0 && !saving ? 'pointer' : 'not-allowed',
                      fontFamily: 'Poppins, sans-serif',
                      opacity: saving || alteracoes.size === 0 ? 0.6 : 1,
                      boxShadow: alteracoes.size > 0 && !saving
                        ? '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* SEÇÃO DE GERENCIAMENTO DE CLUSTERS */}
          <h1 
            className="text-3xl font-bold mb-6 mt-12" 
            style={{ 
              color: '#adb5bd', 
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px'
            }}
          >
            Gerenciamento de Clusters
          </h1>

          {/* Mensagem de feedback - Clusters */}
          {mensagemClusters && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: mensagemClusters.tipo === 'success' ? '#22c55e20' : '#ef444420',
              border: `1px solid ${mensagemClusters.tipo === 'success' ? '#22c55e' : '#ef4444'}`,
              color: mensagemClusters.tipo === 'success' ? '#22c55e' : '#ef4444',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {mensagemClusters.texto}
            </div>
          )}

          <Card>
            {loadingClusters ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
                <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando dados...</p>
              </div>
            ) : (
              <div>
                {/* Barra de pesquisa */}
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#adb5bd',
                    pointerEvents: 'none',
                    fontSize: '1.1rem'
                  }}>
                    🔍
                  </div>
                  <input
                    type="text"
                    placeholder="Pesquisar unidade..."
                    value={pesquisaUnidadeCluster}
                    onChange={(e) => setPesquisaUnidadeCluster(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 45px',
                      backgroundColor: '#343A40',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontFamily: 'Poppins, sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FF6600'}
                    onBlur={(e) => e.target.style.borderColor = '#555'}
                  />
                  {pesquisaUnidadeCluster && (
                    <div style={{ 
                      marginTop: '8px', 
                      color: '#adb5bd', 
                      fontSize: '0.85rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      {unidadesOrdenadasClusters.length} unidade(s) encontrada(s)
                    </div>
                  )}
                </div>

                {/* Cabeçalho da tabela */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#2a2f36',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 600,
                  color: '#FF6600',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem'
                }}>
                  <div 
                    onClick={() => toggleOrdenacaoCluster('unidade')}
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    UNIDADE
                    {ordenacaoCluster.coluna === 'unidade' && (
                      <span style={{ fontSize: '0.7rem' }}>
                        {ordenacaoCluster.direcao === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div 
                    onClick={() => toggleOrdenacaoCluster('cluster')}
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    CLUSTER
                    {ordenacaoCluster.coluna === 'cluster' && (
                      <span style={{ fontSize: '0.7rem' }}>
                        {ordenacaoCluster.direcao === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de unidades */}
                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  {unidadesOrdenadasClusters.length === 0 ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#adb5bd',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      {pesquisaUnidadeCluster ? 'Nenhuma unidade encontrada' : 'Nenhum dado disponível'}
                    </div>
                  ) : (
                    unidadesOrdenadasClusters.map((uc, index) => {
                      const clusterAtual = alteracoesClusters.get(uc.unidade) || uc.cluster;
                      const foiAlterado = alteracoesClusters.has(uc.unidade);

                      return (
                        <div 
                          key={uc.unidade}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            padding: '12px 16px',
                            borderBottom: '1px solid #343A40',
                            backgroundColor: foiAlterado 
                              ? '#2a2f3680' 
                              : index % 2 === 0 
                                ? '#2a2f36' 
                                : '#23272d',
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div style={{ 
                            color: '#F8F9FA',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: foiAlterado ? 600 : 400
                          }}>
                            {foiAlterado && <span style={{ color: '#FF6600', marginRight: '8px' }}>●</span>}
                            {uc.unidade}
                          </div>
                          <div>
                            <select
                              value={clusterAtual}
                              onChange={(e) => handleClusterChange(uc.unidade, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: foiAlterado ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontFamily: 'Poppins, sans-serif',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="">Selecione um cluster</option>
                              {clustersAtivos.map(cluster => (
                                <option key={cluster} value={cluster}>
                                  {cluster}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Botão de salvar */}
                <div style={{ 
                  padding: '16px',
                  borderTop: '2px solid #343A40',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#adb5bd', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                    {alteracoesClusters.size > 0 ? (
                      <span style={{ color: '#FF6600', fontWeight: 600 }}>
                        {alteracoesClusters.size} alteração(ões) pendente(s)
                      </span>
                    ) : (
                      'Nenhuma alteração pendente'
                    )}
                  </div>
                  
                  <button
                    onClick={salvarAlteracoesClusters}
                    disabled={savingClusters || alteracoesClusters.size === 0}
                    style={{
                      padding: '10px 24px',
                      background: alteracoesClusters.size > 0 && !savingClusters
                        ? 'linear-gradient(to bottom, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                        : 'linear-gradient(to bottom, #4a5563 0%, #3a4553 50%, #2a3543 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: alteracoesClusters.size > 0 && !savingClusters ? 'pointer' : 'not-allowed',
                      fontFamily: 'Poppins, sans-serif',
                      opacity: savingClusters || alteracoesClusters.size === 0 ? 0.6 : 1,
                      boxShadow: alteracoesClusters.size > 0 && !savingClusters
                        ? '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {savingClusters ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* SEÇÃO DE GERENCIAMENTO DE METAS POR CLUSTER */}
          <h1 
            className="text-3xl font-bold mb-6 mt-12" 
            style={{ 
              color: '#adb5bd', 
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px'
            }}
          >
            Gerenciamento de Metas por Cluster
          </h1>

          {/* Mensagem de feedback - Metas */}
          {mensagemMetas && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: mensagemMetas.tipo === 'success' ? '#22c55e20' : '#ef444420',
              border: `1px solid ${mensagemMetas.tipo === 'success' ? '#22c55e' : '#ef4444'}`,
              color: mensagemMetas.tipo === 'success' ? '#22c55e' : '#ef4444',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {mensagemMetas.texto}
            </div>
          )}

          <Card>
            {loadingMetas ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
                <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando dados...</p>
              </div>
            ) : (
              <div>
                {/* Cabeçalho da tabela */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr repeat(7, 1fr)',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#2a2f36',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 600,
                  color: '#FF6600',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem'
                }}>
                  <div>CLUSTER</div>
                  <div style={{ textAlign: 'center' }}>VVR</div>
                  <div style={{ textAlign: 'center' }}>% ATINGIMENTO MAC</div>
                  <div style={{ textAlign: 'center' }}>% ENDIVIDAMENTO</div>
                  <div style={{ textAlign: 'center' }}>NPS</div>
                  <div style={{ textAlign: 'center' }}>% MC ENTREGA</div>
                  <div style={{ textAlign: 'center' }}>E-NPS</div>
                  <div style={{ textAlign: 'center' }}>% CONFORMIDADES</div>
                </div>

                {/* Lista de metas */}
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {metasClusters.length === 0 ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#adb5bd',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      Nenhum dado disponível
                    </div>
                  ) : (
                    metasClusters.map((meta, index) => {
                      const alteracoesDaMeta = alteracoesMetas.get(meta.cluster);
                      const foiAlterado = alteracoesDaMeta && alteracoesDaMeta.size > 0;

                      const vvrAtual = alteracoesDaMeta?.get('VVR') || meta.vvr;
                      const macAtual = alteracoesDaMeta?.get('% ATIGIMENTO MAC') || meta.percentualAtigimentoMac;
                      const endivAtual = alteracoesDaMeta?.get('% ENDIVIDAMENTO') || meta.percentualEndividamento;
                      const npsAtual = alteracoesDaMeta?.get('NPS') || meta.nps;
                      const mcAtual = alteracoesDaMeta?.get('% MC ENTREGA') || meta.percentualMcEntrega;
                      const enpsAtual = alteracoesDaMeta?.get('E-NPS') || meta.enps;
                      const confAtual = alteracoesDaMeta?.get('CONFORMIDADE') || meta.conformidade;

                      return (
                        <div 
                          key={meta.cluster}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr repeat(7, 1fr)',
                            gap: '12px',
                            padding: '12px 16px',
                            borderBottom: '1px solid #343A40',
                            backgroundColor: foiAlterado 
                              ? '#2a2f3680' 
                              : index % 2 === 0 
                                ? '#2a2f36' 
                                : '#23272d',
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'background-color 0.2s',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ 
                            color: '#F8F9FA',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: foiAlterado ? 600 : 400
                          }}>
                            {foiAlterado && <span style={{ color: '#FF6600', marginRight: '8px' }}>●</span>}
                            {meta.cluster}
                          </div>
                          
                          {/* Input VVR */}
                          <div>
                            <input
                              type="text"
                              value={vvrAtual}
                              onChange={(e) => handleMetaChange(meta.cluster, 'VVR', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDaMeta?.has('VVR') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input % ATIGIMENTO MAC */}
                          <div>
                            <input
                              type="text"
                              value={macAtual}
                              onChange={(e) => handleMetaChange(meta.cluster, '% ATIGIMENTO MAC', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDaMeta?.has('% ATIGIMENTO MAC') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input % ENDIVIDAMENTO */}
                          <div>
                            <input
                              type="text"
                              value={endivAtual}
                              onChange={(e) => handleMetaChange(meta.cluster, '% ENDIVIDAMENTO', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDaMeta?.has('% ENDIVIDAMENTO') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input NPS */}
                          <div>
                            <input
                              type="text"
                              value={npsAtual}
                              onChange={(e) => handleMetaChange(meta.cluster, 'NPS', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDaMeta?.has('NPS') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input % MC ENTREGA */}
                          <div>
                            <input
                              type="text"
                              value={mcAtual}
                              onChange={(e) => handleMetaChange(meta.cluster, '% MC ENTREGA', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDaMeta?.has('% MC ENTREGA') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input E-NPS */}
                          <div>
                            <input
                              type="text"
                              value={enpsAtual}
                              onChange={(e) => handleMetaChange(meta.cluster, 'E-NPS', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDaMeta?.has('E-NPS') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input CONFORMIDADE */}
                          <div>
                            <input
                              type="text"
                              value={confAtual}
                              onChange={(e) => handleMetaChange(meta.cluster, 'CONFORMIDADE', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDaMeta?.has('CONFORMIDADE') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Botão de salvar */}
                <div style={{ 
                  padding: '16px',
                  borderTop: '2px solid #343A40',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#adb5bd', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                    {alteracoesMetas.size > 0 ? (
                      <span style={{ color: '#FF6600', fontWeight: 600 }}>
                        {Array.from(alteracoesMetas.values()).reduce((acc, m) => acc + m.size, 0)} alteração(ões) pendente(s)
                      </span>
                    ) : (
                      'Nenhuma alteração pendente'
                    )}
                  </div>
                  
                  <button
                    onClick={salvarAlteracoesMetas}
                    disabled={savingMetas || alteracoesMetas.size === 0}
                    style={{
                      padding: '10px 24px',
                      background: alteracoesMetas.size > 0 && !savingMetas
                        ? 'linear-gradient(to bottom, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                        : 'linear-gradient(to bottom, #4a5563 0%, #3a4553 50%, #2a3543 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: alteracoesMetas.size > 0 && !savingMetas ? 'pointer' : 'not-allowed',
                      fontFamily: 'Poppins, sans-serif',
                      opacity: savingMetas || alteracoesMetas.size === 0 ? 0.6 : 1,
                      boxShadow: alteracoesMetas.size > 0 && !savingMetas
                        ? '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {savingMetas ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* SEÇÃO DE GERENCIAMENTO DE PESOS POR QUARTER */}
          <h1 
            className="text-3xl font-bold mb-6 mt-12" 
            style={{ 
              color: '#adb5bd', 
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px'
            }}
          >
            Gerenciamento de Pesos por Quarter
          </h1>

          {/* Mensagem de feedback - Pesos */}
          {mensagemPesos && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: mensagemPesos.tipo === 'success' ? '#22c55e20' : '#ef444420',
              border: `1px solid ${mensagemPesos.tipo === 'success' ? '#22c55e' : '#ef4444'}`,
              color: mensagemPesos.tipo === 'success' ? '#22c55e' : '#ef4444',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {mensagemPesos.texto}
            </div>
          )}

          <Card>
            {loadingPesos ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
                <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando dados...</p>
              </div>
            ) : (
              <div>
                {/* Cabeçalho da tabela */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#2a2f36',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 600,
                  color: '#FF6600',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem'
                }}>
                  <div>INDICADOR</div>
                  <div style={{ textAlign: 'center' }}>1º QUARTER</div>
                  <div style={{ textAlign: 'center' }}>2º QUARTER</div>
                  <div style={{ textAlign: 'center' }}>3º QUARTER</div>
                  <div style={{ textAlign: 'center' }}>4º QUARTER</div>
                </div>

                {/* Lista de indicadores */}
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {indicadoresPesos.length === 0 ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#adb5bd',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      Nenhum dado disponível
                    </div>
                  ) : (
                    indicadoresPesos.map((ind, index) => {
                      const alteracoesDoIndicador = alteracoesPesos.get(ind.indicador);
                      const foiAlterado = alteracoesDoIndicador && alteracoesDoIndicador.size > 0;

                      const peso1Atual = alteracoesDoIndicador?.get('1') || ind.quarter1;
                      const peso2Atual = alteracoesDoIndicador?.get('2') || ind.quarter2;
                      const peso3Atual = alteracoesDoIndicador?.get('3') || ind.quarter3;
                      const peso4Atual = alteracoesDoIndicador?.get('4') || ind.quarter4;

                      return (
                        <div 
                          key={ind.indicador}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                            gap: '16px',
                            padding: '12px 16px',
                            borderBottom: '1px solid #343A40',
                            backgroundColor: foiAlterado 
                              ? '#2a2f3680' 
                              : index % 2 === 0 
                                ? '#2a2f36' 
                                : '#23272d',
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'background-color 0.2s',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ 
                            color: '#F8F9FA',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: foiAlterado ? 600 : 400
                          }}>
                            {foiAlterado && <span style={{ color: '#FF6600', marginRight: '8px' }}>●</span>}
                            {ind.indicador}
                          </div>
                          
                          {/* Input Quarter 1 */}
                          <div>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={peso1Atual}
                              onChange={(e) => handlePesoChange(ind.indicador, '1', e.target.value)}
                              className="peso-input"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDoIndicador?.has('1') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input Quarter 2 */}
                          <div>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={peso2Atual}
                              onChange={(e) => handlePesoChange(ind.indicador, '2', e.target.value)}
                              className="peso-input"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDoIndicador?.has('2') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input Quarter 3 */}
                          <div>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={peso3Atual}
                              onChange={(e) => handlePesoChange(ind.indicador, '3', e.target.value)}
                              className="peso-input"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDoIndicador?.has('3') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Input Quarter 4 */}
                          <div>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={peso4Atual}
                              onChange={(e) => handlePesoChange(ind.indicador, '4', e.target.value)}
                              className="peso-input"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#343A40',
                                color: 'white',
                                border: alteracoesDoIndicador?.has('4') ? '2px solid #FF6600' : '1px solid #555',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontFamily: 'Poppins, sans-serif',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Linha de TOTAL */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#1a1d21',
                  borderTop: '3px solid #FF6600',
                  borderBottom: '2px solid #343A40',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#FF6600', textTransform: 'uppercase' }}>
                    TOTAL
                  </div>
                  
                  {/* Total Quarter 1 */}
                  <div style={{ 
                    textAlign: 'center',
                    color: calcularSomaPorQuarter('1') === 10 ? '#22c55e' : '#ef4444',
                    fontSize: '1.1rem'
                  }}>
                    {calcularSomaPorQuarter('1').toFixed(1)}
                    {calcularSomaPorQuarter('1') !== 10 && (
                      <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.8 }}>
                        {calcularSomaPorQuarter('1') < 10 ? '⬇️ Faltam' : '⬆️ Excesso'} {Math.abs(calcularSomaPorQuarter('1') - 10).toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Total Quarter 2 */}
                  <div style={{ 
                    textAlign: 'center',
                    color: calcularSomaPorQuarter('2') === 10 ? '#22c55e' : '#ef4444',
                    fontSize: '1.1rem'
                  }}>
                    {calcularSomaPorQuarter('2').toFixed(1)}
                    {calcularSomaPorQuarter('2') !== 10 && (
                      <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.8 }}>
                        {calcularSomaPorQuarter('2') < 10 ? '⬇️ Faltam' : '⬆️ Excesso'} {Math.abs(calcularSomaPorQuarter('2') - 10).toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Total Quarter 3 */}
                  <div style={{ 
                    textAlign: 'center',
                    color: calcularSomaPorQuarter('3') === 10 ? '#22c55e' : '#ef4444',
                    fontSize: '1.1rem'
                  }}>
                    {calcularSomaPorQuarter('3').toFixed(1)}
                    {calcularSomaPorQuarter('3') !== 10 && (
                      <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.8 }}>
                        {calcularSomaPorQuarter('3') < 10 ? '⬇️ Faltam' : '⬆️ Excesso'} {Math.abs(calcularSomaPorQuarter('3') - 10).toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Total Quarter 4 */}
                  <div style={{ 
                    textAlign: 'center',
                    color: calcularSomaPorQuarter('4') === 10 ? '#22c55e' : '#ef4444',
                    fontSize: '1.1rem'
                  }}>
                    {calcularSomaPorQuarter('4').toFixed(1)}
                    {calcularSomaPorQuarter('4') !== 10 && (
                      <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.8 }}>
                        {calcularSomaPorQuarter('4') < 10 ? '⬇️ Faltam' : '⬆️ Excesso'} {Math.abs(calcularSomaPorQuarter('4') - 10).toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de salvar */}
                <div style={{ 
                  padding: '16px',
                  borderTop: '2px solid #343A40',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#adb5bd', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                    {alteracoesPesos.size > 0 ? (
                      <span style={{ color: '#FF6600', fontWeight: 600 }}>
                        {Array.from(alteracoesPesos.values()).reduce((acc, m) => acc + m.size, 0)} alteração(ões) pendente(s)
                      </span>
                    ) : (
                      'Nenhuma alteração pendente'
                    )}
                  </div>
                  
                  <button
                    onClick={salvarAlteracoesPesos}
                    disabled={savingPesos || alteracoesPesos.size === 0}
                    style={{
                      padding: '10px 24px',
                      background: alteracoesPesos.size > 0 && !savingPesos
                        ? 'linear-gradient(to bottom, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                        : 'linear-gradient(to bottom, #4a5563 0%, #3a4553 50%, #2a3543 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: alteracoesPesos.size > 0 && !savingPesos ? 'pointer' : 'not-allowed',
                      fontFamily: 'Poppins, sans-serif',
                      opacity: savingPesos || alteracoesPesos.size === 0 ? 0.6 : 1,
                      boxShadow: alteracoesPesos.size > 0 && !savingPesos
                        ? '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {savingPesos ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* SEÇÃO DE GERENCIAMENTO DE BÔNUS */}
          <h1 
            className="text-3xl font-bold mb-6 mt-12" 
            style={{ 
              color: '#adb5bd', 
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px'
            }}
          >
            Gerenciamento de Bônus por Unidade
          </h1>

          {/* Mensagem de feedback - Bônus */}
          {mensagemBonus && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: mensagemBonus.tipo === 'success' ? '#22c55e20' : '#ef444420',
              border: `1px solid ${mensagemBonus.tipo === 'success' ? '#22c55e' : '#ef4444'}`,
              color: mensagemBonus.tipo === 'success' ? '#22c55e' : '#ef4444',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {mensagemBonus.texto}
            </div>
          )}

          <Card>
            {loadingBonus ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
                <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando dados...</p>
              </div>
            ) : (
              <div>
                {/* Barra de pesquisa */}
                <div style={{ 
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    placeholder="🔍 Pesquisar unidade..."
                    value={pesquisaUnidadeBonus}
                    onChange={(e) => setPesquisaUnidadeBonus(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#343A40',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Cabeçalho da tabela */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#2a2f36',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 600,
                  color: '#FF6600',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.9rem'
                }}>
                  <div>UNIDADE</div>
                  <div style={{ textAlign: 'center' }}>1º QUARTER</div>
                  <div style={{ textAlign: 'center' }}>2º QUARTER</div>
                  <div style={{ textAlign: 'center' }}>3º QUARTER</div>
                  <div style={{ textAlign: 'center' }}>4º QUARTER</div>
                </div>

                {/* Lista de unidades */}
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {bonusUnidades
                    .filter(bonus => 
                      bonus.unidade.toLowerCase().includes(pesquisaUnidadeBonus.toLowerCase())
                    )
                    .length === 0 ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#adb5bd',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      {pesquisaUnidadeBonus ? 'Nenhuma unidade encontrada' : 'Nenhum dado disponível'}
                    </div>
                  ) : (
                    bonusUnidades
                      .filter(bonus => 
                        bonus.unidade.toLowerCase().includes(pesquisaUnidadeBonus.toLowerCase())
                      )
                      .map((bonus, index) => {
                        const alteracoesDaUnidade = alteracoesBonus.get(bonus.unidade);
                        const foiAlterado = alteracoesDaUnidade && alteracoesDaUnidade.size > 0;

                        const bonus1Atual = alteracoesDaUnidade?.get('1') || bonus.quarter1;
                        const bonus2Atual = alteracoesDaUnidade?.get('2') || bonus.quarter2;
                        const bonus3Atual = alteracoesDaUnidade?.get('3') || bonus.quarter3;
                        const bonus4Atual = alteracoesDaUnidade?.get('4') || bonus.quarter4;

                        return (
                          <div 
                            key={bonus.unidade}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                              gap: '16px',
                              padding: '12px 16px',
                              borderBottom: '1px solid #343A40',
                              backgroundColor: foiAlterado 
                                ? '#2a2f3680' 
                                : index % 2 === 0 
                                  ? '#2a2f36' 
                                  : '#23272d',
                              fontFamily: 'Poppins, sans-serif',
                              transition: 'background-color 0.2s',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ 
                              color: '#F8F9FA',
                              display: 'flex',
                              alignItems: 'center',
                              fontWeight: foiAlterado ? 600 : 400
                            }}>
                              {foiAlterado && <span style={{ color: '#FF6600', marginRight: '8px' }}>●</span>}
                              {bonus.unidade}
                            </div>
                            
                            {/* Input Quarter 1 */}
                            <div>
                              <input
                                type="number"
                                min="0"
                                max="3"
                                step="0.5"
                                value={bonus1Atual}
                                onChange={(e) => handleBonusChange(bonus.unidade, '1', e.target.value)}
                                className="peso-input"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  backgroundColor: '#343A40',
                                  color: 'white',
                                  border: alteracoesDaUnidade?.has('1') ? '2px solid #FF6600' : '1px solid #555',
                                  borderRadius: '6px',
                                  fontSize: '0.9rem',
                                  fontFamily: 'Poppins, sans-serif',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Input Quarter 2 */}
                            <div>
                              <input
                                type="number"
                                min="0"
                                max="3"
                                step="0.5"
                                value={bonus2Atual}
                                onChange={(e) => handleBonusChange(bonus.unidade, '2', e.target.value)}
                                className="peso-input"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  backgroundColor: '#343A40',
                                  color: 'white',
                                  border: alteracoesDaUnidade?.has('2') ? '2px solid #FF6600' : '1px solid #555',
                                  borderRadius: '6px',
                                  fontSize: '0.9rem',
                                  fontFamily: 'Poppins, sans-serif',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Input Quarter 3 */}
                            <div>
                              <input
                                type="number"
                                min="0"
                                max="3"
                                step="0.5"
                                value={bonus3Atual}
                                onChange={(e) => handleBonusChange(bonus.unidade, '3', e.target.value)}
                                className="peso-input"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  backgroundColor: '#343A40',
                                  color: 'white',
                                  border: alteracoesDaUnidade?.has('3') ? '2px solid #FF6600' : '1px solid #555',
                                  borderRadius: '6px',
                                  fontSize: '0.9rem',
                                  fontFamily: 'Poppins, sans-serif',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Input Quarter 4 */}
                            <div>
                              <input
                                type="number"
                                min="0"
                                max="3"
                                step="0.5"
                                value={bonus4Atual}
                                onChange={(e) => handleBonusChange(bonus.unidade, '4', e.target.value)}
                                className="peso-input"
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  backgroundColor: '#343A40',
                                  color: 'white',
                                  border: alteracoesDaUnidade?.has('4') ? '2px solid #FF6600' : '1px solid #555',
                                  borderRadius: '6px',
                                  fontSize: '0.9rem',
                                  fontFamily: 'Poppins, sans-serif',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Botão de salvar */}
                <div style={{ 
                  padding: '16px',
                  borderTop: '2px solid #343A40',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#adb5bd', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                    {alteracoesBonus.size > 0 ? (
                      <span style={{ color: '#FF6600', fontWeight: 600 }}>
                        {Array.from(alteracoesBonus.values()).reduce((acc, m) => acc + m.size, 0)} alteração(ões) pendente(s)
                      </span>
                    ) : (
                      'Nenhuma alteração pendente'
                    )}
                  </div>
                  
                  <button
                    onClick={salvarAlteracoesBonus}
                    disabled={savingBonus || alteracoesBonus.size === 0}
                    style={{
                      padding: '10px 24px',
                      background: alteracoesBonus.size > 0 && !savingBonus
                        ? 'linear-gradient(to bottom, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                        : 'linear-gradient(to bottom, #4a5563 0%, #3a4553 50%, #2a3543 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: alteracoesBonus.size > 0 && !savingBonus ? 'pointer' : 'not-allowed',
                      fontFamily: 'Poppins, sans-serif',
                      opacity: savingBonus || alteracoesBonus.size === 0 ? 0.6 : 1,
                      boxShadow: alteracoesBonus.size > 0 && !savingBonus
                        ? '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {savingBonus ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </main>
      </PexLayout>
  );
}

export default withAuthAndFranchiser(ParametrosContent);
