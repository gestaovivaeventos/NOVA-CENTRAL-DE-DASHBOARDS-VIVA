/**
 * Página de Ranking PEX
 * Primeira página do dashboard - Exibe ranking das unidades
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSheetsData, Card, PexLayout } from '@/modules/pex';
import { useAuth } from '@/context/AuthContext';
import { filterDataByPermission } from '@/utils/permissoes';

export default function RankingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Buscar dados do Google Sheets
  const { dados: dadosBrutosOriginal, loading, error } = useSheetsData();
  
  // Filtrar dados por permissão do usuário
  const dadosBrutos = useMemo(() => {
    if (!dadosBrutosOriginal || !user) return [];
    
    // Na página de ranking, usuários nível 0 veem tudo normalmente
    // Apenas franqueadora (1) pode realmente filtrar por unidade
    if (user.accessLevel === 0) {
      return dadosBrutosOriginal;
    }
    
    // Aplicar filtro de permissão: franqueadora (1) vê tudo (sem filtro)
    return filterDataByPermission(dadosBrutosOriginal, {
      accessLevel: user.accessLevel as 0 | 1,
      unitNames: user.unitNames || []
    });
  }, [dadosBrutosOriginal, user]);

  // Estados para os filtros
  const [filtroQuarter, setFiltroQuarter] = useState<string>('');
  const [filtroUnidade, setFiltroUnidade] = useState<string>('');
  const [filtroCluster, setFiltroCluster] = useState<string>('');
  const [filtroConsultor, setFiltroConsultor] = useState<string>('');
  
  // Nome dinâmico da coluna do consultor
  const [nomeColunaConsultor, setNomeColunaConsultor] = useState<string>('Consultor');

  // Listas para os filtros
  const listaQuarters = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    
    const quarters = dadosBrutos
      .map(item => item.QUARTER)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    
    return quarters;
  }, [dadosBrutos]);

  const listaClusters = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    
    const clusters = dadosBrutos
      .map(item => item.cluster)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    
    return clusters;
  }, [dadosBrutos]);

  const listaConsultores = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    
    const possiveisNomesConsultor = ['Consultor', 'CONSULTOR', 'consultor', 'CONSULTOR RESPONSAVEL', 'Consultor Responsável', 'Consultor Responsavel'];
    const nomeColuna = possiveisNomesConsultor.find(nome => dadosBrutos[0].hasOwnProperty(nome));
    
    if (!nomeColuna) return [];
    
    const consultores = dadosBrutos
      .map(item => item[nomeColuna])
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    
    return consultores;
  }, [dadosBrutos]);

  const listaUnidadesFiltradas = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];

    let dadosFiltrados = dadosBrutos;
    
    if (filtroQuarter) {
      dadosFiltrados = dadosFiltrados.filter(item => item.QUARTER === filtroQuarter);
    }
    
    if (filtroCluster) {
      dadosFiltrados = dadosFiltrados.filter(item => item.cluster === filtroCluster);
    }
    
    if (filtroConsultor) {
      dadosFiltrados = dadosFiltrados.filter(item => item[nomeColunaConsultor] === filtroConsultor);
    }
    
    const unidades = dadosFiltrados
      .map(item => item.nm_unidade)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();

    return unidades;
  }, [dadosBrutos, filtroQuarter, filtroCluster, filtroConsultor, nomeColunaConsultor]);

  // Calcular ranking por média de todos os quarters
  const rankingGeral = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];

    // Agrupar por unidade e calcular média de todos os quarters
    const unidadesComMedia = new Map<string, { 
      soma: number; 
      count: number; 
      cluster?: string;
      consultor?: string;
    }>();

    dadosBrutos.forEach(item => {
      const unidade = item.nm_unidade;
      const pontos = parseFloat((item['Pontuação com bonus'] || item['Pontuação com Bonus'] || '0').toString().replace(',', '.')) || 0;
      
      if (!unidadesComMedia.has(unidade)) {
        unidadesComMedia.set(unidade, { 
          soma: 0, 
          count: 0, 
          cluster: item.cluster,
          consultor: item[nomeColunaConsultor]
        });
      }
      
      const dados = unidadesComMedia.get(unidade)!;
      dados.soma += pontos;
      dados.count += 1;
    });

    // Criar ranking com médias
    return Array.from(unidadesComMedia.entries())
      .map(([unidade, dados]) => ({
        unidade,
        media: dados.soma / dados.count,
        cluster: dados.cluster,
        consultor: dados.consultor
      }))
      .sort((a, b) => b.media - a.media)
      .map((item, index) => ({
        ...item,
        posicao: index + 1
      }));
  }, [dadosBrutos, nomeColunaConsultor]);

  // Aplicar filtros ao ranking
  const rankingFiltrado = useMemo(() => {
    let ranking = rankingGeral;

    if (filtroCluster) {
      ranking = ranking.filter(item => item.cluster === filtroCluster);
      // Recalcular posições após filtro
      ranking = ranking.map((item, index) => ({
        ...item,
        posicao: index + 1
      }));
    }

    if (filtroConsultor) {
      ranking = ranking.filter(item => item.consultor === filtroConsultor);
      // Recalcular posições após filtro
      ranking = ranking.map((item, index) => ({
        ...item,
        posicao: index + 1
      }));
    }

    return ranking;
  }, [rankingGeral, filtroCluster, filtroConsultor]);

  // Detectar o nome da coluna do consultor
  useEffect(() => {
    if (dadosBrutos && dadosBrutos.length > 0) {
      const possiveisNomesConsultor = ['Consultor', 'CONSULTOR', 'consultor', 'CONSULTOR RESPONSAVEL', 'Consultor Responsável', 'Consultor Responsavel'];
      const nomeColuna = possiveisNomesConsultor.find(nome => dadosBrutos[0].hasOwnProperty(nome));
      if (nomeColuna) {
        setNomeColunaConsultor(nomeColuna);
      }
    }
  }, [dadosBrutos]);

  // Inicializar filtros quando os dados carregarem
  useEffect(() => {
    if (listaQuarters.length > 0 && !filtroQuarter) {
      setFiltroQuarter(listaQuarters[0]);
    }
  }, [listaQuarters, filtroQuarter]);

  // Estado de Loading
  if (loading) {
    return (
      <PexLayout currentPage="ranking">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#212529',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #FF6600',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }} />
            <p style={{ marginTop: '16px', color: '#adb5bd' }}>Carregando...</p>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </PexLayout>
    );
  }

  // Estado de Erro
  if (error) {
    return (
      <PexLayout currentPage="ranking">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#212529',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: '#F8F9FA', fontSize: '1.2rem', marginBottom: '8px' }}>
              Erro ao carregar dados
            </h3>
            <p style={{ color: '#adb5bd', marginBottom: '20px' }}>{error}</p>
          </div>
        </div>
      </PexLayout>
    );
  }

  return (
    <PexLayout 
      currentPage="ranking"
      filters={{
        showCluster: (user?.accessLevel ?? 0) >= 1,
        showConsultor: (user?.accessLevel ?? 0) >= 1,
        filtroCluster,
        filtroConsultor,
        onClusterChange: setFiltroCluster,
        onConsultorChange: setFiltroConsultor,
        listaClusters,
        listaConsultores,
      }}
    >
      <Head>
        <title>Ranking PEX | Central de Dashboards</title>
        <meta name="description" content="Ranking de Performance - Programa de Excelência (PEX)" />
      </Head>
      
      <div style={{
        padding: '30px',
        backgroundColor: '#212529',
        minHeight: '100vh',
      }}>
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

          {/* Pódio Top 3 - Glassmorphism */}
          {rankingFiltrado.length >= 3 && (
            <div style={{ 
              marginBottom: '40px',
              padding: '40px 20px',
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.8) 0%, rgba(40, 40, 50, 0.8) 100%)',
              borderRadius: '16px',
              border: '1.5px solid rgba(255, 215, 0, 0.5)',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), 0 8px 32px rgba(255, 165, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background decorativo sutil */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'radial-gradient(circle at top right, rgba(255, 215, 0, 0.08) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />

              <h2 style={{
                textAlign: 'center',
                fontSize: '1.8rem',
                fontWeight: 700,
                background: 'linear-gradient(to bottom, #FFD700 0%, #FFA500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Orbitron', 'Poppins', sans-serif",
                marginBottom: '50px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                textShadow: '0 4px 12px rgba(255, 165, 0, 0.3)',
                position: 'relative',
                zIndex: 1
              }}>
                🏆 TOP 3 PERFORMANCE REDE VIVA
              </h2>

              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '24px',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 1
              }}>
                {/* 2º Lugar */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  order: 1,
                  minHeight: '300px'
                }}>
                  <div style={{
                    width: '220px',
                    height: '240px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(100, 120, 140, 0.3) 0%, rgba(80, 100, 120, 0.2) 100%)',
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(192, 192, 192, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(192, 192, 192, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Marca d'água com número */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '100px',
                      fontWeight: 900,
                      color: 'rgba(192, 192, 192, 0.12)',
                      fontFamily: 'Orbitron, sans-serif',
                      lineHeight: 1,
                      pointerEvents: 'none'
                    }}>
                      2
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        color: '#F8F9FA',
                        fontSize: '1rem',
                        fontWeight: 700,
                        fontFamily: 'Poppins, sans-serif',
                        marginBottom: '12px',
                        lineHeight: '1.4',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {rankingFiltrado[1].unidade}
                      </div>
                      <div style={{
                        color: '#B0B8C0',
                        fontSize: '0.75rem',
                        fontFamily: 'Poppins, sans-serif',
                        marginBottom: '8px'
                      }}>
                        {rankingFiltrado[1].cluster || '-'}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.3) 0%, rgba(192, 192, 192, 0.1) 100%)',
                      padding: '12px',
                      borderRadius: '12px',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <div style={{
                        color: '#E8E8E8',
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        fontFamily: 'Orbitron, sans-serif'
                      }}>
                        {rankingFiltrado[1].media.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1º Lugar - MAIOR */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  order: 2,
                  minHeight: '300px',
                  position: 'relative',
                  top: '-20px'
                }}>
                  <div style={{
                    width: '260px',
                    height: '280px',
                    padding: '28px',
                    background: 'linear-gradient(135deg, rgba(255, 200, 50, 0.4) 0%, rgba(255, 165, 0, 0.3) 100%)',
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 165, 0, 0.4), 0 12px 32px rgba(255, 165, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 1px rgba(0, 0, 0, 0.1)',
                    border: '1.5px solid rgba(255, 200, 100, 0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Marca d'água com número */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '120px',
                      fontWeight: 900,
                      color: 'rgba(255, 200, 100, 0.15)',
                      fontFamily: 'Orbitron, sans-serif',
                      lineHeight: 1,
                      pointerEvents: 'none'
                    }}>
                      1
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        color: '#F8F9FA',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        fontFamily: 'Poppins, sans-serif',
                        marginBottom: '12px',
                        lineHeight: '1.4',
                        minHeight: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {rankingFiltrado[0].unidade}
                      </div>
                      <div style={{
                        color: '#FFD700',
                        fontSize: '0.75rem',
                        fontFamily: 'Poppins, sans-serif',
                        marginBottom: '8px'
                      }}>
                        {rankingFiltrado[0].cluster || '-'}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, rgba(255, 200, 50, 0.3) 0%, rgba(255, 165, 0, 0.2) 100%)',
                      padding: '14px',
                      borderRadius: '12px',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <div style={{
                        color: '#FFD700',
                        fontSize: '2.2rem',
                        fontWeight: 900,
                        fontFamily: 'Orbitron, sans-serif'
                      }}>
                        {rankingFiltrado[0].media.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3º Lugar */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  order: 3,
                  minHeight: '300px'
                }}>
                  <div style={{
                    width: '220px',
                    height: '240px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(140, 100, 60, 0.3) 0%, rgba(120, 80, 50, 0.2) 100%)',
                    borderRadius: '20px',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(205, 127, 50, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(205, 127, 50, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Marca d'água com número */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '100px',
                      fontWeight: 900,
                      color: 'rgba(205, 127, 50, 0.12)',
                      fontFamily: 'Orbitron, sans-serif',
                      lineHeight: 1,
                      pointerEvents: 'none'
                    }}>
                      3
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        color: '#F8F9FA',
                        fontSize: '1rem',
                        fontWeight: 700,
                        fontFamily: 'Poppins, sans-serif',
                        marginBottom: '12px',
                        lineHeight: '1.4',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {rankingFiltrado[2].unidade}
                      </div>
                      <div style={{
                        color: '#D4A574',
                        fontSize: '0.75rem',
                        fontFamily: 'Poppins, sans-serif',
                        marginBottom: '8px'
                      }}>
                        {rankingFiltrado[2].cluster || '-'}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.3) 0%, rgba(205, 127, 50, 0.1) 100%)',
                      padding: '12px',
                      borderRadius: '12px',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <div style={{
                        color: '#E8B883',
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        fontFamily: 'Orbitron, sans-serif'
                      }}>
                        {rankingFiltrado[2].media.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Ranking Top 10 */}
          <h2 
            className="text-2xl font-bold mb-4" 
            style={{ 
              color: '#adb5bd', 
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px'
            }}
          >
            Ranking Top 10 Performance Rede Viva
          </h2>

          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #FF6600' }}>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#FF6600',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      Posição
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#FF6600',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      Unidade
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#FF6600',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      Cluster
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: '#FF6600',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      Consultor
                    </th>
                    <th style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      color: '#FF6600',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      Pontuação Média
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankingFiltrado.slice(0, 10).map((item, index) => (
                    <tr 
                      key={item.unidade}
                      style={{ 
                        borderBottom: '1px solid #343A40',
                        backgroundColor: index % 2 === 0 ? '#2a2f36' : '#23272d',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={{ 
                        padding: '12px',
                        color: '#F8F9FA',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>
                        {item.posicao === 1 && '🥇 '}
                        {item.posicao === 2 && '🥈 '}
                        {item.posicao === 3 && '🥉 '}
                        {item.posicao}º
                      </td>
                      <td style={{ 
                        padding: '12px',
                        color: '#F8F9FA',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: item.posicao <= 3 ? 600 : 400
                      }}>
                        {item.unidade}
                      </td>
                      <td style={{ 
                        padding: '12px',
                        color: '#adb5bd',
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {item.cluster || '-'}
                      </td>
                      <td style={{ 
                        padding: '12px',
                        color: '#adb5bd',
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {item.consultor || '-'}
                      </td>
                      <td style={{ 
                        padding: '12px',
                        textAlign: 'center',
                        color: '#FF6600',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>
                        {item.media.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top 3 por Cluster */}
          <h2 
            className="text-2xl font-bold mb-6 mt-12" 
            style={{ 
              color: '#adb5bd', 
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px'
            }}
          >
            Top 3 Por Cluster
          </h2>

          {/* Grid com 4 tabelas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {/* INICIANTE */}
            <Card>
              <h3 style={{
                color: '#adb5bd',
                fontSize: '1.1rem',
                fontWeight: 700,
                fontFamily: 'Poppins, sans-serif',
                marginBottom: '16px',
                textTransform: 'uppercase',
                textAlign: 'center',
                borderBottom: '1px solid #FF6600',
                paddingBottom: '8px'
              }}>
                Iniciante
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #FF6600' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pos.</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Unidade</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingGeral.filter(item => item.cluster === 'INICIANTE').slice(0, 3).map((item, index) => (
                      <tr key={item.unidade} style={{ borderBottom: '1px solid #343A40', backgroundColor: index % 2 === 0 ? '#2a2f36' : '#23272d' }}>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>
                          {index === 0 && '🥇 '}{index === 1 && '🥈 '}{index === 2 && '🥉 '}{index + 1}º
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem', fontWeight: index === 0 ? 600 : 400 }}>{item.unidade}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>{item.media.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* PADRÃO */}
            <Card>
              <h3 style={{ color: '#adb5bd', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', marginBottom: '16px', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #FF6600', paddingBottom: '8px' }}>
                Padrão
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #FF6600' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pos.</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Unidade</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingGeral.filter(item => item.cluster === 'PADRÃO').slice(0, 3).map((item, index) => (
                      <tr key={item.unidade} style={{ borderBottom: '1px solid #343A40', backgroundColor: index % 2 === 0 ? '#2a2f36' : '#23272d' }}>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>
                          {index === 0 && '🥇 '}{index === 1 && '🥈 '}{index === 2 && '🥉 '}{index + 1}º
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem', fontWeight: index === 0 ? 600 : 400 }}>{item.unidade}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>{item.media.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* MASTER */}
            <Card>
              <h3 style={{ color: '#adb5bd', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', marginBottom: '16px', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #FF6600', paddingBottom: '8px' }}>
                Master
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #FF6600' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pos.</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Unidade</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingGeral.filter(item => item.cluster === 'MASTER').slice(0, 3).map((item, index) => (
                      <tr key={item.unidade} style={{ borderBottom: '1px solid #343A40', backgroundColor: index % 2 === 0 ? '#2a2f36' : '#23272d' }}>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>
                          {index === 0 && '🥇 '}{index === 1 && '🥈 '}{index === 2 && '🥉 '}{index + 1}º
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem', fontWeight: index === 0 ? 600 : 400 }}>{item.unidade}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>{item.media.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* GIGA / MEGA */}
            <Card>
              <h3 style={{ color: '#adb5bd', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', marginBottom: '16px', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #FF6600', paddingBottom: '8px' }}>
                Giga / Mega
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #FF6600' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pos.</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Unidade</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingGeral.filter(item => item.cluster === 'GIGA / MEGA').slice(0, 3).map((item, index) => (
                      <tr key={item.unidade} style={{ borderBottom: '1px solid #343A40', backgroundColor: index % 2 === 0 ? '#2a2f36' : '#23272d' }}>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>
                          {index === 0 && '🥇 '}{index === 1 && '🥈 '}{index === 2 && '🥉 '}{index + 1}º
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem', fontWeight: index === 0 ? 600 : 400 }}>{item.unidade}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#FF6600', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>{item.media.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </PexLayout>
  );
}
