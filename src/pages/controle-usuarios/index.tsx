/**
 * Página Principal - Controle de Usuários e Senhas
 * Somente leitura - tabela de usuários com dados da planilha de acesso
 * Visível apenas para franqueadora (mesmos usuários do módulo branches)
 */

import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AlertTriangle, Users, KeyRound, Percent } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useModuloPermissions } from '@/modules/controle-modulos/hooks';
import { Header, Sidebar, Loading, Footer, UsuariosTable } from '@/modules/controle-usuarios/components';
import { useUsuariosData } from '@/modules/controle-usuarios/hooks';
import { TABLE_COLUMNS } from '@/modules/controle-usuarios/config';
import { AUTHORIZED_USERNAMES } from '@/modules/controle-usuarios/types';
import { MultiSelect } from '@/modules/vendas/components/filters';

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function ControleUsuariosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { allowedIds, loading: permissionsLoading } = useModuloPermissions(
    user?.username,
    user?.accessLevel,
    { unitNames: user?.unitNames }
  );
  const { data: usuarios, loading, error } = useUsuariosData();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<string[]>([]);
  const [statusSelecionados, setStatusSelecionados] = useState<string[]>(['Ativo']);

  // Carregar estado da sidebar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed_controleUsuarios');
    if (saved === 'true') setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed_controleUsuarios', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Verificar autorização (mesmos usuários do branches)
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return (user.accessLevel ?? 0) >= 1 && AUTHORIZED_USERNAMES.includes(user.username);
  }, [user]);

  // Lista de unidades principais únicas para o filtro
  const unidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    usuarios.forEach(u => { if (u.unidadePrincipal) set.add(u.unidadePrincipal); });
    return Array.from(set).sort();
  }, [usuarios]);

  // Opções de status
  const statusDisponiveis = useMemo(() => ['Ativo', 'Inativo'], []);

  // Dados filtrados por unidade principal e status
  const dadosFiltrados = useMemo(() => {
    let result = usuarios;
    if (unidadesSelecionadas.length > 0) {
      result = result.filter(u => unidadesSelecionadas.includes(u.unidadePrincipal));
    }
    if (statusSelecionados.length > 0) {
      result = result.filter(u => statusSelecionados.includes(u.enabled));
    }
    return result;
  }, [usuarios, unidadesSelecionadas, statusSelecionados]);

  // Métricas dos KPI cards (baseadas nos dados filtrados)
  const totalAtivos = useMemo(() => dadosFiltrados.filter(u => u.enabled === 'Ativo').length, [dadosFiltrados]);
  const totalComSenha = useMemo(() => dadosFiltrados.filter(u => !!u.senhaHash).length, [dadosFiltrados]);
  const percCadastrados = useMemo(() => {
    if (totalAtivos === 0) return 0;
    return Math.round((totalComSenha / totalAtivos) * 100);
  }, [totalAtivos, totalComSenha]);

  // Loading de autenticação
  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <Loading mensagem="Verificando permissões..." />
      </div>
    );
  }

  // Redirecionar se não autenticado
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  // Sem permissão
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <div className="text-center">
          <AlertTriangle size={48} color="#FF6600" className="mx-auto mb-4" />
          <p style={{ color: '#FF6600', fontSize: '1.25rem', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
            Acesso Restrito
          </p>
          <p style={{ color: '#adb5bd', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif', marginTop: '8px' }}>
            Este módulo é exclusivo para usuários autorizados da franqueadora.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 24px',
              backgroundColor: '#FF6600',
              color: '#fff',
              borderRadius: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
          >
            Voltar à Central
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Controle de Usuários e Senhas | Central de Dashboards</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#212529' }}>
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        >
          {/* Filtro de Status */}
          <MultiSelect
            label="Status"
            icon="🔵"
            options={statusDisponiveis}
            selectedValues={statusSelecionados}
            onChange={setStatusSelecionados}
            placeholder="Todos"
          />

          {/* Filtro de Unidades */}
          <div style={{ marginTop: '16px' }}>
            <MultiSelect
              label="Unidade Principal"
              icon="🏢"
              options={unidadesDisponiveis}
              selectedValues={unidadesSelecionadas}
              onChange={setUnidadesSelecionadas}
              placeholder="Todas as unidades"
            />
          </div>
        </Sidebar>

        {/* Main content */}
        <div
          className="transition-all duration-300"
          style={{
            marginLeft: sidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
          }}
        >
          {/* Header */}
          <Header />

          {/* Conteúdo principal */}
          <main className="px-4 py-6">
            {/* Título da seção */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{
                color: '#F8F9FA',
                fontSize: '1.25rem',
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                margin: 0,
              }}>
                Base de Usuários
              </h2>
              <p style={{
                color: '#6c757d',
                fontSize: '0.825rem',
                fontFamily: 'Poppins, sans-serif',
                margin: '4px 0 0',
              }}>
                Visualização somente leitura da base de controle de acesso
              </p>
            </div>

            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {/* Card: Usuários Ativos */}
              <div style={{
                backgroundColor: '#2a2f36',
                borderRadius: '10px',
                padding: '20px 24px',
                border: '1px solid #444',
                borderLeft: '4px solid #28a745',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#adb5bd', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                      Usuários Ativos
                    </p>
                    <p style={{ color: '#28a745', fontSize: '2rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: '6px 0 0' }}>
                      {totalAtivos}
                    </p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <Users size={24} color="#28a745" />
                  </div>
                </div>
              </div>

              {/* Card: Usuários com Senha */}
              <div style={{
                backgroundColor: '#2a2f36',
                borderRadius: '10px',
                padding: '20px 24px',
                border: '1px solid #444',
                borderLeft: '4px solid #FF6600',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#adb5bd', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                      Acessaram a Central
                    </p>
                    <p style={{ color: '#FF6600', fontSize: '2rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: '6px 0 0' }}>
                      {totalComSenha}
                    </p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255, 102, 0, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <KeyRound size={24} color="#FF6600" />
                  </div>
                </div>
              </div>

              {/* Card: % Cadastrados */}
              <div style={{
                backgroundColor: '#2a2f36',
                borderRadius: '10px',
                padding: '20px 24px',
                border: '1px solid #444',
                borderLeft: '4px solid #17a2b8',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#adb5bd', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                      % Cadastrados
                    </p>
                    <p style={{ color: '#17a2b8', fontSize: '2rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', margin: '6px 0 0' }}>
                      {percCadastrados}%
                    </p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(23, 162, 184, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <Percent size={24} color="#17a2b8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && <Loading mensagem="Carregando dados de usuários..." />}

            {/* Erro */}
            {error && !loading && (
              <div style={{
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <AlertTriangle size={20} color="#dc3545" />
                <span style={{ color: '#dc3545', fontFamily: 'Poppins, sans-serif', fontSize: '0.9rem' }}>
                  {error}
                </span>
              </div>
            )}

            {/* Tabela */}
            {!loading && !error && (
              <UsuariosTable
                data={dadosFiltrados}
                columns={TABLE_COLUMNS}
                pageSize={25}
              />
            )}

            {/* Footer */}
            <Footer />
          </main>
        </div>
      </div>
    </>
  );
}
