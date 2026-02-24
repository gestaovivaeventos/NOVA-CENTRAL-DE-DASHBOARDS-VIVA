/**
 * Hook para gerenciar dados de projetos
 * Busca / grava dados via API que conecta ao Google Sheets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Projeto, ProjetosDashboardData, ProjetosFiltros, NovoProjetoForm } from '../types';
import { calcularResumo, calcularAtingimento, getSituacao } from '../utils';
import { TIMES_OPTIONS, INDICADORES_OPTIONS } from '../config/app.config';

async function fetchProjetos(): Promise<{ projetos: Projeto[]; responsaveisPlanilha: string[] }> {
  const res = await fetch('/api/projetos');
  if (!res.ok) throw new Error('Erro ao buscar projetos da API');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erro desconhecido');
  return {
    projetos: json.data as Projeto[],
    responsaveisPlanilha: (json.responsaveis || []) as string[],
  };
}

export function useProjetosData() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [responsaveisPlanilha, setResponsaveisPlanilha] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<ProjetosFiltros>({
    status: 'Todos',
    time: '',
    responsavel: '',
    busca: '',
  });

  // Carregar dados da API
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { projetos: dados, responsaveisPlanilha: resp } = await fetchProjetos();
      setProjetos(dados);
      setResponsaveisPlanilha(resp);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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

  // Times únicos
  const times = useMemo(() => {
    const set = new Set(projetos.map(p => p.time));
    TIMES_OPTIONS.forEach(t => set.add(t));
    return Array.from(set).sort();
  }, [projetos]);

  // Responsáveis da coluna X da planilha
  const responsaveis = useMemo(() => {
    return responsaveisPlanilha.length > 0 ? responsaveisPlanilha : [];
  }, [responsaveisPlanilha]);

  // Atualizar campo individual via API
  const atualizarProjeto = useCallback(async (id: string, campo: keyof Projeto, valor: any) => {
    // Otimistic update local
    setProjetos(prev => {
      return prev.map(p => {
        if (p.id !== id) return p;
        const novoProjeto = { ...p, [campo]: valor };
        if (campo === 'resultadoAtingido' || campo === 'progresso') {
          const atingido = campo === 'resultadoAtingido' ? valor : p.resultadoAtingido;
          const esperado = p.resultadoEsperado;
          novoProjeto.percentualAtingimento = calcularAtingimento(esperado, atingido, novoProjeto.tendencia);
          novoProjeto.situacao = getSituacao(novoProjeto.percentualAtingimento);
        }
        return novoProjeto;
      });
    });

    // Persistir na planilha
    try {
      const projeto = projetos.find(p => p.id === id);
      const payload: Record<string, any> = { id, [campo]: valor };
      if (campo === 'resultadoAtingido' && projeto) {
        payload.percentualAtingimento = calcularAtingimento(
          projeto.resultadoEsperado,
          valor,
          projeto.tendencia,
        );
      }
      await fetch('/api/projetos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Erro ao salvar na planilha:', err);
      // Recarregar dados para manter consistência
      carregarDados();
    }
  }, [projetos, carregarDados]);

  // Editar projeto completo via API
  const editarProjetoCompleto = useCallback(async (id: string, dadosAtualizados: Partial<Projeto>, alteradoPor?: string) => {
    // Optimistic update local
    setProjetos(prev => {
      return prev.map(p => {
        if (p.id !== id) return p;
        const novoProjeto = { ...p, ...dadosAtualizados };
        novoProjeto.percentualAtingimento = calcularAtingimento(
          novoProjeto.resultadoEsperado,
          novoProjeto.resultadoAtingido,
          novoProjeto.tendencia,
        );
        novoProjeto.situacao = getSituacao(novoProjeto.percentualAtingimento);
        if (alteradoPor) novoProjeto.alteradoPor = alteradoPor;
        return novoProjeto;
      });
    });

    // Persistir na planilha
    try {
      const merged = { ...dadosAtualizados };
      const projeto = projetos.find(p => p.id === id);
      if (projeto) {
        const esp = merged.resultadoEsperado ?? projeto.resultadoEsperado;
        const ati = merged.resultadoAtingido ?? projeto.resultadoAtingido;
        const tend = merged.tendencia ?? projeto.tendencia;
        merged.percentualAtingimento = calcularAtingimento(esp, ati, tend);
      }
      await fetch('/api/projetos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, alteradoPor, ...merged }),
      });
    } catch (err) {
      console.error('Erro ao salvar na planilha:', err);
      carregarDados();
    }
  }, [projetos, carregarDados]);

  // Inativar projeto via API
  const inativarProjeto = useCallback(async (id: string, inativadoPor?: string) => {
    // Optimistic update
    setProjetos(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'Inativo' as const, inativadoPor: inativadoPor || '' } : p
    ));

    try {
      await fetch('/api/projetos/inactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, inativadoPor }),
      });
    } catch (err) {
      console.error('Erro ao inativar na planilha:', err);
      carregarDados();
    }
  }, [carregarDados]);

  // Adicionar projeto via API
  const adicionarProjeto = useCallback(async (form: NovoProjetoForm, criadoPor: string) => {
    try {
      const res = await fetch('/api/projetos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto: form.projeto,
          objetivo: form.objetivo,
          dataInicio: form.dataInicio,
          prazoFinal: form.dataFim,
          responsavel: form.responsavel,
          time: form.time,
          indicador: form.indicador,
          tendencia: form.tendencia,
          resultadoEsperado: form.resultadoEsperado,
          custo: form.custo,
          criadoPor,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      // Recarregar dados para pegar o novo projeto com ID da planilha
      await carregarDados();
    } catch (err) {
      console.error('Erro ao criar projeto na planilha:', err);
      throw err;
    }
  }, [carregarDados]);

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
    refetch: carregarDados,
  };
}
