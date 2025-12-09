/**
 * Página Dashboard PEX
 * Visão geral do programa de excelência
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { PexLayout, useSheetsData } from '@/modules/pex';
import { useAuth } from '@/context/AuthContext';
import { filterDataByPermission } from '@/utils/permissoes';

export default function PexDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { dados: dadosOriginal, loading, error, refetch } = useSheetsData();

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Filtrar dados por permissão do usuário
  const dados = useMemo(() => {
    if (!dadosOriginal || !user) return [];
    
    return filterDataByPermission(dadosOriginal, {
      accessLevel: user.accessLevel as 0 | 1,
      unitNames: user.unitNames || []
    });
  }, [dadosOriginal, user]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    if (!dados || dados.length === 0) {
      return {
        totalFranquias: 0,
        mediaGeral: 0,
        porCluster: {} as Record<string, number>,
        porStatus: { verde: 0, amarelo: 0, vermelho: 0 },
      };
    }

    const totalFranquias = dados.length;
    
    // Contagem por cluster
    const porCluster = dados.reduce((acc, item) => {
      const cluster = item.cluster || 'Sem Cluster';
      acc[cluster] = (acc[cluster] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular média geral de pontuação (se existir campo de pontuação)
    const pontuacoes = dados
      .map(item => {
        const val = item.pontuacao_total || item.PONTUACAO_TOTAL || item.pontuacaoTotal || 0;
        return typeof val === 'string' ? parseFloat(val) || 0 : val;
      })
      .filter(p => p > 0);
    
    const mediaGeral = pontuacoes.length > 0
      ? pontuacoes.reduce((sum, p) => sum + p, 0) / pontuacoes.length
      : 0;

    // Status baseado em pontuação
    const porStatus = {
      verde: pontuacoes.filter(p => p >= 70).length,
      amarelo: pontuacoes.filter(p => p >= 50 && p < 70).length,
      vermelho: pontuacoes.filter(p => p < 50).length,
    };

    return { totalFranquias, mediaGeral, porCluster, porStatus };
  }, [dados]);

  // Cores dos clusters
  const clusterColors: Record<string, string> = {
    'Ouro': '#FFD700',
    'Prata': '#C0C0C0',
    'Bronze': '#CD7F32',
    'Iniciante': '#6366F1',
    'OURO': '#FFD700',
    'PRATA': '#C0C0C0',
    'BRONZE': '#CD7F32',
    'INICIANTE': '#6366F1',
  };

  if (loading) {
    return (
      <PexLayout currentPage="dashboard">
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
            <p style={{ marginTop: '16px', color: '#adb5bd' }}>Carregando dados PEX...</p>
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

  if (error) {
    return (
      <PexLayout currentPage="dashboard">
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
            <button
              onClick={() => refetch()}
              style={{
                backgroundColor: '#FF6600',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </PexLayout>
    );
  }

  return (
    <PexLayout currentPage="dashboard">
      <Head>
        <title>Dashboard PEX | Central de Dashboards</title>
      </Head>

      <div style={{
        padding: '30px',
        backgroundColor: '#212529',
        minHeight: '100vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}>
          <div>
            <h1 style={{
              color: '#F8F9FA',
              fontSize: '1.8rem',
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              marginBottom: '5px',
            }}>
              Dashboard PEX
            </h1>
            <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
              Visão geral do Programa de Excelência
            </p>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              backgroundColor: '#2a2f36',
              color: '#adb5bd',
              border: '1px solid #444',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}>
          <div style={{
            backgroundColor: '#2a2f36',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #333',
          }}>
            <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>
              Total Franquias
            </p>
            <p style={{ color: '#F8F9FA', fontSize: '2.5rem', fontWeight: 700 }}>
              {stats.totalFranquias}
            </p>
          </div>

          <div style={{
            backgroundColor: '#2a2f36',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #333',
          }}>
            <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>
              Média Geral
            </p>
            <p style={{ color: '#FF6600', fontSize: '2.5rem', fontWeight: 700 }}>
              {stats.mediaGeral.toFixed(1)}
            </p>
          </div>

          <div style={{
            backgroundColor: '#2a2f36',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #333',
          }}>
            <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>
              No Verde (≥70)
            </p>
            <p style={{ color: '#28a745', fontSize: '2.5rem', fontWeight: 700 }}>
              {stats.porStatus.verde || 0}
            </p>
          </div>

          <div style={{
            backgroundColor: '#2a2f36',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #333',
          }}>
            <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>
              Atenção (&lt;50)
            </p>
            <p style={{ color: '#dc3545', fontSize: '2.5rem', fontWeight: 700 }}>
              {stats.porStatus.vermelho || 0}
            </p>
          </div>
        </div>

        {/* Distribuição por Cluster */}
        <div style={{
          backgroundColor: '#2a2f36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #333',
          marginBottom: '30px',
        }}>
          <h2 style={{
            color: '#F8F9FA',
            fontSize: '1.2rem',
            fontWeight: 600,
            marginBottom: '20px',
          }}>
            Distribuição por Cluster
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
          }}>
            {Object.entries(stats.porCluster).map(([cluster, count]) => (
              <div
                key={cluster}
                style={{
                  backgroundColor: '#212529',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{
                  backgroundColor: clusterColors[cluster] || '#6c757d',
                  color: cluster.toLowerCase().includes('ouro') ? '#000' : '#fff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  {cluster}
                </span>
                <span style={{
                  color: '#F8F9FA',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Links rápidos */}
        <div style={{
          backgroundColor: '#2a2f36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #333',
        }}>
          <h2 style={{
            color: '#F8F9FA',
            fontSize: '1.2rem',
            fontWeight: 600,
            marginBottom: '20px',
          }}>
            Acesso Rápido
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
          }}>
            <Link
              href="/pex/ranking"
              style={{
                backgroundColor: '#212529',
                borderRadius: '8px',
                padding: '20px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #444',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <div>
                <p style={{ color: '#F8F9FA', fontWeight: 600, marginBottom: '4px' }}>
                  Ver Ranking
                </p>
                <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                  Classificação completa
                </p>
              </div>
            </Link>

            <Link
              href="/pex/resultados"
              style={{
                backgroundColor: '#212529',
                borderRadius: '8px',
                padding: '20px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #444',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <div>
                <p style={{ color: '#F8F9FA', fontWeight: 600, marginBottom: '4px' }}>
                  Ver Resultados
                </p>
                <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                  Detalhes por franquia
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </PexLayout>
  );
}
