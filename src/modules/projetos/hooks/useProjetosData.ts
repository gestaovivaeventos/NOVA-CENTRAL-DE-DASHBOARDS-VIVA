/**
 * Hook para gerenciar dados de projetos
 * Utiliza localStorage para persistência local
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Projeto, ProjetosDashboardData, ProjetosFiltros, NovoProjetoForm } from '../types';
import { calcularResumo, gerarProjetoId, calcularAtingimento, getSituacao } from '../utils';
import { TIMES_OPTIONS, INDICADORES_OPTIONS } from '../config/app.config';

const STORAGE_KEY = 'projetos_dashboard_data';

// Dados de exemplo para demonstração
const DADOS_EXEMPLO: Projeto[] = [
  {
    id: 'proj_001',
    criadoPor: 'João Silva',
    time: 'MARKETING',
    responsavel: 'Maria Santos',
    projeto: 'Campanha Digital Q1',
    dataInicio: '01/01/2026',
    prazoFinal: '31/03/2026',
    indicador: 'Conversão',
    objetivo: 'Aumentar conversão de leads em 25%',
    esforcoEstimado: 'Alto',
    dataAfericao: '15/03/2026',
    resultadoEsperado: 25,
    resultadoAtingido: 18,
    percentualAtingimento: 72,
    progresso: 65,
    situacao: 'amarelo',
    status: 'Em Andamento',
    tendencia: 'Subir',
    impactoEsperado: 'Aumento de receita recorrente',
    custo: 50000,
  },
  {
    id: 'proj_002',
    criadoPor: 'Ana Costa',
    time: 'TI',
    responsavel: 'Pedro Oliveira',
    projeto: 'Migração Cloud',
    dataInicio: '15/11/2025',
    prazoFinal: '28/02/2026',
    indicador: 'Produtividade',
    objetivo: 'Migrar 100% da infraestrutura para cloud',
    esforcoEstimado: 'Muito Alto',
    dataAfericao: '01/02/2026',
    resultadoEsperado: 100,
    resultadoAtingido: 95,
    percentualAtingimento: 95,
    progresso: 90,
    situacao: 'verde',
    status: 'Em Andamento',
    tendencia: 'Subir',
    impactoEsperado: 'Redução de custos de infraestrutura',
    custo: 120000,
  },
  {
    id: 'proj_003',
    criadoPor: 'Carlos Lima',
    time: 'GESTÃO DE PESSOAS',
    responsavel: 'Fernanda Alves',
    projeto: 'Programa de Engajamento',
    dataInicio: '01/07/2025',
    prazoFinal: '31/12/2025',
    indicador: 'Engajamento',
    objetivo: 'Atingir 85% de engajamento na pesquisa',
    esforcoEstimado: 'Médio',
    dataAfericao: '20/12/2025',
    resultadoEsperado: 85,
    resultadoAtingido: 88,
    percentualAtingimento: 103.5,
    progresso: 100,
    situacao: 'verde',
    status: 'Finalizado',
    tendencia: 'Subir',
    impactoEsperado: 'Melhoria no clima organizacional',
    custo: 30000,
  },
  {
    id: 'proj_004',
    criadoPor: 'Roberto Santos',
    time: 'EXPANSÃO',
    responsavel: 'Luciana Pereira',
    projeto: 'Expansão Região Sul',
    dataInicio: '01/03/2025',
    prazoFinal: '30/09/2025',
    indicador: 'Receita',
    objetivo: 'Abrir 10 novas unidades na região sul',
    esforcoEstimado: 'Muito Alto',
    dataAfericao: '30/09/2025',
    resultadoEsperado: 10,
    resultadoAtingido: 7,
    percentualAtingimento: 70,
    progresso: 100,
    situacao: 'amarelo',
    status: 'Passado',
    tendencia: 'Manter',
    impactoEsperado: 'Expansão de market share',
    custo: 500000,
  },
  {
    id: 'proj_005',
    criadoPor: 'Marcos Ribeiro',
    time: 'ATENDIMENTO',
    responsavel: 'Julia Mendes',
    projeto: 'Chatbot Atendimento 24h',
    dataInicio: '01/05/2025',
    prazoFinal: '31/08/2025',
    indicador: 'NPS',
    objetivo: 'Implementar chatbot com IA para atendimento 24h',
    esforcoEstimado: 'Alto',
    dataAfericao: '31/08/2025',
    resultadoEsperado: 90,
    resultadoAtingido: 0,
    percentualAtingimento: 0,
    progresso: 30,
    situacao: 'vermelho',
    status: 'Cancelado',
    tendencia: 'Descer',
    impactoEsperado: 'Redução de tempo de resposta',
    custo: 80000,
  },
  {
    id: 'proj_006',
    criadoPor: 'Paula Martins',
    time: 'CONSULTORIA',
    responsavel: 'Ricardo Souza',
    projeto: 'Reestruturação Comercial',
    dataInicio: '01/01/2026',
    prazoFinal: '30/06/2026',
    indicador: 'Receita',
    objetivo: 'Aumentar receita líquida em 15%',
    esforcoEstimado: 'Alto',
    dataAfericao: '15/06/2026',
    resultadoEsperado: 15,
    resultadoAtingido: 5,
    percentualAtingimento: 33.3,
    progresso: 25,
    situacao: 'vermelho',
    status: 'Em Andamento',
    tendencia: 'Subir',
    impactoEsperado: 'Crescimento sustentável',
    custo: 75000,
  },
];

function loadFromStorage(): Projeto[] {
  if (typeof window === 'undefined') return DADOS_EXEMPLO;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DADOS_EXEMPLO;
}

function saveToStorage(projetos: Projeto[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projetos));
  } catch {
    // ignore
  }
}

export function useProjetosData() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<ProjetosFiltros>({
    status: 'Todos',
    time: '',
    responsavel: '',
    busca: '',
  });

  // Carregar dados iniciais
  useEffect(() => {
    try {
      const dados = loadFromStorage();
      setProjetos(dados);
    } catch (err) {
      setError('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrar projetos
  const projetosFiltrados = useMemo(() => {
    return projetos.filter(p => {
      if (filtros.status !== 'Todos' && p.status !== filtros.status) return false;
      if (filtros.time && p.time !== filtros.time) return false;
      if (filtros.responsavel && p.responsavel !== filtros.responsavel) return false;
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        return (
          p.projeto.toLowerCase().includes(busca) ||
          p.objetivo.toLowerCase().includes(busca) ||
          p.criadoPor.toLowerCase().includes(busca) ||
          p.responsavel.toLowerCase().includes(busca)
        );
      }
      return true;
    });
  }, [projetos, filtros]);

  // Resumo
  const resumo = useMemo(() => calcularResumo(projetos), [projetos]);

  // Times e responsáveis únicos
  const times = useMemo(() => {
    const set = new Set(projetos.map(p => p.time));
    TIMES_OPTIONS.forEach(t => set.add(t));
    return Array.from(set).sort();
  }, [projetos]);

  const responsaveis = useMemo(() => {
    return [...new Set(projetos.map(p => p.responsavel))].sort();
  }, [projetos]);

  // Atualizar projeto existente
  const atualizarProjeto = useCallback((id: string, campo: keyof Projeto, valor: any) => {
    setProjetos(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const novoProjeto = { ...p, [campo]: valor };
        // Recalcular percentual e situação se alterou resultado atingido
        if (campo === 'resultadoAtingido' || campo === 'progresso') {
          const atingido = campo === 'resultadoAtingido' ? valor : p.resultadoAtingido;
          const esperado = p.resultadoEsperado;
          novoProjeto.percentualAtingimento = calcularAtingimento(atingido, esperado);
          novoProjeto.situacao = getSituacao(novoProjeto.percentualAtingimento);
        }
        return novoProjeto;
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Editar projeto completo
  const editarProjetoCompleto = useCallback((id: string, dadosAtualizados: Partial<Projeto>) => {
    setProjetos(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        const novoProjeto = { ...p, ...dadosAtualizados };
        // Recalcular percentual e situação
        novoProjeto.percentualAtingimento = calcularAtingimento(novoProjeto.resultadoAtingido, novoProjeto.resultadoEsperado);
        novoProjeto.situacao = getSituacao(novoProjeto.percentualAtingimento);
        return novoProjeto;
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Inativar projeto
  const inativarProjeto = useCallback((id: string) => {
    setProjetos(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, status: 'Inativo' as const };
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Adicionar projeto
  const adicionarProjeto = useCallback((form: NovoProjetoForm, criadoPor: string) => {
    const novoProjeto: Projeto = {
      id: gerarProjetoId(),
      criadoPor,
      time: form.time,
      responsavel: form.responsavel,
      projeto: form.projeto,
      dataInicio: form.dataInicio,
      prazoFinal: form.dataFim,
      indicador: form.indicador,
      objetivo: form.objetivo,
      esforcoEstimado: 'Médio',
      dataAfericao: '',
      resultadoEsperado: form.resultadoEsperado,
      resultadoAtingido: 0,
      percentualAtingimento: 0,
      progresso: 0,
      situacao: 'vermelho',
      status: 'Em Andamento',
      tendencia: form.tendencia,
      impactoEsperado: form.impactoEsperado,
      custo: form.custo,
    };

    setProjetos(prev => {
      const updated = [novoProjeto, ...prev];
      saveToStorage(updated);
      return updated;
    });

    return novoProjeto;
  }, []);

  // Dashboard data
  const dashboardData: ProjetosDashboardData = useMemo(() => ({
    projetos: projetosFiltrados,
    resumo,
    times,
    responsaveis,
    indicadores: INDICADORES_OPTIONS,
    ultimaAtualizacao: new Date().toISOString(),
  }), [projetosFiltrados, resumo, times, responsaveis]);

  return {
    data: dashboardData,
    loading,
    error,
    filtros,
    setFiltros,
    adicionarProjeto,
    atualizarProjeto,
    editarProjetoCompleto,
    inativarProjeto,
    refetch: () => {
      setLoading(true);
      const dados = loadFromStorage();
      setProjetos(dados);
      setLoading(false);
    },
  };
}
