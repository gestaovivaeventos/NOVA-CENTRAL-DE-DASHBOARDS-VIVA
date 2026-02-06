/**
 * Gestão Rede - Dashboard Principal
 * Visualização da estrutura das franquias
 * 
 * Alterações v2:
 * - KPIs reestruturados: Ativas, Implantação, Incubação (com detalhe), Maduras
 * - Inativas em bloco colapsável separado
 * - Removidos blocos redundantes (hierarquia, donuts status/maturidade)
 * - Flags em formato kanban
 * - UTI removido, todas entram como UTI Recuperação
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  Building2, 
  XCircle, 
  Clock, 
  Zap, 
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Info,
  X,
  Sprout,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  GestaoRedeLayout,
  KPICard,
  TabelaFranquias,
  TabelaClassificacaoPEX,
  TabelaSegmentoMercado,
  TabelaFlags,
  Footer,
  FiltrosGestaoRede,
} from '@/modules/gestao-rede';
import { useGestaoRede } from '@/modules/gestao-rede/hooks';
import { 
  calcularResumoRede, 
  CORES 
} from '@/modules/gestao-rede/utils';

export default function GestaoRedeDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Hook para buscar dados reais da API
  const { franquias, isLoading, error, refetch } = useGestaoRede();
  
  // Verificar autenticação e nível de acesso
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && user && user.accessLevel === 0) {
      router.push('/pex');
    }
  }, [isAuthenticated, authLoading, router, user]);

  // Calcular resumo baseado nos dados
  const resumo = useMemo(() => calcularResumoRede(franquias), [franquias]);

  // Estado para filtro de tabela
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');
  
  // Estado para filtros avançados
  const [filtros, setFiltros] = useState<FiltrosGestaoRede>({
    maturidade: [],
    classificacao: [],
    flags: [],
  });

  // Estado para bloco de inativas colapsável
  const [inativasExpandido, setInativasExpandido] = useState(false);
  
  // Estado para detalhe de incubação
  const [detalheIncubacao, setDetalheIncubacao] = useState(false);
  
  // Franquias filtradas
  const franquiasFiltradas = useMemo(() => {
    if (filtroStatus === 'TODOS') return franquias;
    return franquias.filter(f => f.status === filtroStatus);
  }, [franquias, filtroStatus]);

  // Franquias inativas detalhadas
  const franquiasInativas = useMemo(() => franquias.filter(f => f.status === 'INATIVA'), [franquias]);
  const encerradasOperacao = useMemo(() => franquiasInativas.filter(f => f.statusInativacao === 'ENCERRADA_OPERACAO'), [franquiasInativas]);
  const encerradasImplantacao = useMemo(() => franquiasInativas.filter(f => f.statusInativacao === 'ENCERRADA_IMPLANTACAO'), [franquiasInativas]);

  if (authLoading || isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#212529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#adb5bd',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #FF6600',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Carregando...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão Rede - Viva Eventos</title>
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>

      <GestaoRedeLayout 
        currentPage="dashboard"
        filtros={filtros}
        onFiltrosChange={setFiltros}
      >
        {/* Header */}
        <div style={{ backgroundColor: '#212529' }}>
          <div style={{ padding: '24px 24px 24px 24px' }}>
            <div 
              style={{
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
              }}
            >
              <div className="flex items-center space-x-6">
                <div style={{ position: 'relative', width: '140px', height: '50px' }}>
                  <Image 
                    src="/images/logo_viva.png" 
                    alt="Viva Eventos" 
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
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
                    textTransform: 'uppercase'
                  }}>
                    Gestão Rede
                  </h1>
                  <span style={{ 
                    color: '#adb5bd', 
                    fontSize: '0.75rem',
                    fontFamily: 'Poppins, sans-serif' 
                  }}>
                    Visão Geral da Rede de Franquias
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                    <span style={{ color: '#c0392b', fontSize: '0.85rem' }}>
                      Erro ao carregar dados
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div style={{ padding: '0 24px 24px 24px' }}>
          
          {/* ===== KPIs Principais - Cards de totais ===== */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <KPICard
              titulo="Franquias Ativas"
              valor={resumo.ativas}
              cor="#27ae60"
              icone={<Building2 size={32} />}
              subtitulo="Rede ativa atual"
            />
            <KPICard
              titulo="Em Implantação"
              valor={resumo.emImplantacao}
              total={resumo.ativas}
              porcentagem={resumo.ativas > 0 ? (resumo.emImplantacao / resumo.ativas) * 100 : 0}
              cor="#FF6600"
              icone={<Clock size={32} />}
              subtitulo="das ativas"
            />
            <KPICard
              titulo="Em Incubação"
              valor={resumo.emIncubacao}
              total={resumo.emOperacao}
              porcentagem={resumo.emOperacao > 0 ? (resumo.emIncubacao / resumo.emOperacao) * 100 : 0}
              cor="#2980b9"
              icone={<Sprout size={32} />}
              subtitulo="em operação"
              onClick={() => setDetalheIncubacao(!detalheIncubacao)}
              selecionado={detalheIncubacao}
            />
            <KPICard
              titulo="Franquias Maduras"
              valor={resumo.maduras}
              total={resumo.emOperacao}
              porcentagem={resumo.emOperacao > 0 ? (resumo.maduras / resumo.emOperacao) * 100 : 0}
              cor="#8e44ad"
              icone={<Zap size={32} />}
              subtitulo="em operação"
            />
          </div>

          {/* ===== Detalhe de Incubação (expansível) ===== */}
          {detalheIncubacao && (
            <div style={{
              backgroundColor: '#343A40',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '16px',
              border: '1px solid #2980b9',
              animation: 'fadeIn 0.3s ease',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="#2980b9" />
                  <span style={{
                    color: '#adb5bd',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                    Detalhamento — Franquias em Incubação
                  </span>
                </div>
                <button
                  onClick={() => setDetalheIncubacao(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: '4px',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}>
                {/* 1º Ano */}
                <div style={{
                  backgroundColor: '#212529',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid #3498db',
                }}>
                  <div style={{ color: '#6c757d', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }}>
                    1º Ano de Operação
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      color: '#3498db',
                      fontSize: '2rem',
                      fontWeight: 700,
                      fontFamily: "'Orbitron', sans-serif",
                    }}>
                      {resumo.incubacao1}
                    </span>
                    <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                      ({resumo.emIncubacao > 0 ? ((resumo.incubacao1 / resumo.emIncubacao) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>

                {/* 2º Ano */}
                <div style={{
                  backgroundColor: '#212529',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid #2980b9',
                }}>
                  <div style={{ color: '#6c757d', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }}>
                    2º Ano de Operação
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      color: '#2980b9',
                      fontSize: '2rem',
                      fontWeight: 700,
                      fontFamily: "'Orbitron', sans-serif",
                    }}>
                      {resumo.incubacao2}
                    </span>
                    <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                      ({resumo.emIncubacao > 0 ? ((resumo.incubacao2 / resumo.emIncubacao) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>

                {/* 3º Ano */}
                <div style={{
                  backgroundColor: '#212529',
                  borderRadius: '8px',
                  padding: '16px',
                  borderLeft: '4px solid #1a6da0',
                }}>
                  <div style={{ color: '#6c757d', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }}>
                    3º Ano de Operação
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      color: '#1a6da0',
                      fontSize: '2rem',
                      fontWeight: 700,
                      fontFamily: "'Orbitron', sans-serif",
                    }}>
                      {resumo.incubacao3}
                    </span>
                    <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                      ({resumo.emIncubacao > 0 ? ((resumo.incubacao3 / resumo.emIncubacao) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
              <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>
          )}

          {/* ===== Bloco Inativas - Colapsável ===== */}
          <div style={{
            backgroundColor: '#343A40',
            borderRadius: '12px',
            marginBottom: '24px',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setInativasExpandido(!inativasExpandido)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: inativasExpandido ? '1px solid #3a3d41' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <XCircle size={20} color="#c0392b" />
                <span style={{
                  color: '#adb5bd',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'Poppins, sans-serif',
                }}>
                  Franquias Inativas
                </span>
                <span style={{
                  backgroundColor: '#c0392b',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  {resumo.inativas}
                </span>
              </div>
              <div style={{ color: '#6c757d' }}>
                {inativasExpandido ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
            </button>

            {inativasExpandido && (
              <div style={{ padding: '16px 20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    backgroundColor: '#212529',
                    borderRadius: '8px',
                    padding: '16px',
                    borderLeft: '4px solid #943126',
                  }}>
                    <div style={{ color: '#6c757d', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Poppins, sans-serif' }}>
                      Encerradas em Operação
                    </div>
                    <span style={{ color: '#943126', fontSize: '1.8rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
                      {resumo.encerradasOperacao}
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: '#212529',
                    borderRadius: '8px',
                    padding: '16px',
                    borderLeft: '4px solid #6c2134',
                  }}>
                    <div style={{ color: '#6c757d', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Poppins, sans-serif' }}>
                      Encerradas em Implantação
                    </div>
                    <span style={{ color: '#6c2134', fontSize: '1.8rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
                      {resumo.encerradasImplantacao}
                    </span>
                  </div>
                </div>

                {/* Lista de franquias inativas */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {franquiasInativas.map((f, idx) => (
                    <div
                      key={f.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: idx % 2 === 0 ? '#212529' : 'transparent',
                        marginBottom: '2px',
                      }}
                    >
                      <span style={{ color: '#F8F9FA', fontSize: '0.85rem', fontFamily: 'Poppins, sans-serif' }}>
                        {f.nome}
                      </span>
                      <span style={{
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '4px',
                        backgroundColor: f.statusInativacao === 'ENCERRADA_OPERACAO' ? '#943126' : '#6c2134',
                        fontFamily: 'Poppins, sans-serif',
                      }}>
                        {f.statusInativacao === 'ENCERRADA_OPERACAO' ? 'Enc. Operação' : 'Enc. Implantação'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabela Kanban - Classificação PEX */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaClassificacaoPEX franquias={franquias} onRefresh={refetch} />
          </div>

          {/* Kanban - Flags Estruturais */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaFlags franquias={franquias} onRefresh={refetch} />
          </div>

          {/* Tabela - Segmento de Mercado */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaSegmentoMercado franquias={franquias} />
          </div>

          {/* Tabela de Franquias */}
          <TabelaFranquias 
            franquias={franquiasFiltradas}
            filtros={filtros}
            titulo={
              filtroStatus === 'TODOS' 
                ? 'Todas as Franquias' 
                : filtroStatus === 'ATIVA' 
                  ? 'Franquias Ativas' 
                  : 'Franquias Inativas'
            }
          />

          {/* Footer */}
          <Footer />
        </div>
      </GestaoRedeLayout>
    </>
  );
}
