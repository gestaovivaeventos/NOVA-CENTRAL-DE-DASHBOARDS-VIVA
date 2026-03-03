'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ferramentasData } from '../data/ferramentas';
import { Ferramenta } from '../types';

// ============================================
// MÓDULO TEMPORÁRIO - Mundo Viva Menu (Fiel ao original)
// ============================================

// ====== ESTRUTURA DO MENU ORIGINAL DO MV ======
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  target?: string;
  children?: MenuItem[];
}

const ORIGINAL_MENU: MenuItem[] = [
  {
    id: 'home', label: 'Home', icon: 'fa-home',
    href: 'https://mundovivaextranet.vivaeventos.com.br/relacionamento/dashboardColaborador',
  },
  {
    id: 'gestao-franqueadora', label: 'Gestão Franqueadora', icon: 'fa-star',
    children: [
      { id: 'ger-unidades', label: 'Gerenciar Unidades', icon: '', children: [
        { id: 'cad-unidades', label: 'Cadastrar Unidades', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_unidade_listar' },
      ]},
      { id: 'ger-usuarios', label: 'Gerenciar Usuários', icon: '', children: [
        { id: 'cad-usuarios', label: 'Cadastrar Usuários', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_usuario_listar' },
        { id: 'setores', label: 'Setores', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/setor/' },
      ]},
      { id: 'ger-clientes', label: 'Gerenciar Clientes', icon: '', children: [
        { id: 'tipos-clientes', label: 'Tipos de Clientes', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_tipocliente_listar' },
      ]},
      { id: 'ger-boletos', label: 'Gerenciar Boletos', icon: '', children: [
        { id: 'gerar-boletos', label: 'Gerar boletos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_boletolancamentos' },
        { id: 'ctrl-mensalidades', label: 'Controle de Mensalidades', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/controleMensalidade' },
      ]},
      { id: 'ger-bancos', label: 'Gerenciar Bancos', icon: '', children: [
        { id: 'cad-banco', label: 'Cadastro Banco', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_banco_listar' },
        { id: 'carteiras-cob', label: 'Carteiras de Cobrança', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_carteiracobranca_listar' },
        { id: 'arq-retorno', label: 'Arquivos de Retorno', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_boleto_arquivosRetorno' },
        { id: 'arq-remessa', label: 'Arquivos de Remessa', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_arquivoremessa_listar' },
        { id: 'rel-arq-ret', label: 'Relatórios de Arq. Retorno', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_arquivoprocessado_listar' },
        { id: 'rel-contabil', label: 'Relatório Contábil', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_relatorio_contabil' },
        { id: 'rel-tarifas', label: 'Relatório de Tarifas', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_relatorio_tarifa' },
      ]},
      { id: 'ger-eventos', label: 'Gerenciar Eventos', icon: '', children: [
        { id: 'cad-eventos', label: 'Cadastrar Eventos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_evento_listar' },
        { id: 'eventos-prov', label: 'Eventos com data provisória', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_relatorio_previsao_eventos' },
        { id: 'eventos-sem-val', label: 'Eventos sem Valor', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_relatorio_eventos_sem_valor' },
      ]},
      { id: 'ger-plano-contas', label: 'Gerenciar Plano de Contas', icon: '', children: [
        { id: 'plano-rec', label: 'Plano de Contas a Receber', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_plano_contas_receber_listar' },
        { id: 'plano-pag', label: 'Plano de Contas a Pagar', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_plano_contas_pagar_listar' },
      ]},
      { id: 'ger-cartao', label: 'Gerenciar Cartão de Crédito', icon: '', children: [
        { id: 'planos-venda', label: 'Planos de Venda', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/zoop/taxaParcelamentoCartao/gerenciar_plano_cartao_credito_listar' },
      ]},
      { id: 'ger-banner', label: 'Gerenciar Banner', icon: '', children: [
        { id: 'banner-mv', label: 'Mundo VIVA', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/ERP_BannerPrincipalMundoViva_ListarBanner' },
        { id: 'banner-ext', label: 'Extranet', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/relacionamento/bannerDashboardColaborador/listar' },
        { id: 'banner-clube', label: 'Clube VIVA', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/ERP_BannerPrincipalClubeViva_ListarBanner' },
        { id: 'banner-cartao', label: 'Cartão Virtual', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/bannerVivaCard' },
      ]},
      { id: 'ger-faq', label: 'Gerenciar FAQ', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/cadastroFaqMundoViva' },
      { id: 'dev', label: 'Desenvolvedor', icon: '', children: [
        { id: 'bugs', label: 'Bugs', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/erro/' },
        { id: 'cron', label: 'Cron', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/tarefaCron/' },
        { id: 'testar-emails', label: 'Testar emails', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/email/' },
        { id: 'config-dest', label: 'Config. Destinat. e Remetentes', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/DestinosEOrigensEmail/' },
        { id: 'monitoramento', label: 'Monitoramento', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/relacionamento/dashboardColaborador/monitoramento' },
      ]},
      { id: 'push-notif', label: 'Push Notification', icon: '', children: [
        { id: 'notificacoes', label: 'Notificações', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/pushNotificationService/notificacoes' },
      ]},
      { id: 'categorias', label: 'Categoria', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/categoriaFornecedor_listar' },
      { id: 'rel-recorrentes', label: 'Relatórios Recorrentes', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/relatorioRecorrente' },
      { id: 'ger-ipca', label: 'Gerenciar IPCA', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/gerenciar-ipca/listar' },
    ],
  },
  {
    id: 'gestao-franquia', label: 'Gestão Franquia', icon: 'fa-building',
    children: [
      { id: 'ger-usuarios-franq', label: 'Gerenciar Usuários', icon: '', children: [
        { id: 'rel-consultores', label: 'Relatório de Consultores', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_relatorio_consultor' },
      ]},
      { id: 'agenda-oficial', label: 'Agenda Oficial', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/opAgenda' },
    ],
  },
  {
    id: 'dashboards', label: 'Dashboards', icon: 'fa-dashboard',
    children: [
      { id: 'dash-vendas-mv', label: 'Dashboard de vendas', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/dashboard_unidade/dash_vendas' },
      { id: 'dash-clientes-mv', label: 'Dashboard de clientes', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/dashboard_unidade/dash_clientes' },
      { id: 'dash-nps-mv', label: 'Dashboard de pesquisas (NPS)', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/dashboard_unidade/dash_pesquisa' },
      { id: 'dash-eventos-mv', label: 'Dashboard de eventos', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/dashboard_unidade/dash_eventos' },
    ],
  },
  {
    id: 'clientes', label: 'Clientes', icon: 'fa-user-plus',
    children: [
      { id: 'ger-fundos', label: 'Gerenciar Fundos', icon: '', children: [
        { id: 'fundos', label: 'Fundos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_listar' },
        { id: 'dash-fundo', label: 'Dashboard Fundo', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/dashboardFundo' },
        { id: 'req-pgto', label: 'Req de Pagamento', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_requisicao_pagamento_listar' },
        { id: 'extrato', label: 'Extrato', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_extrato' },
        { id: 'desp-contr', label: 'Despesas Contratuais', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/despesas-contratuais/listar' },
        { id: 'op', label: 'OP', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/op' },
        { id: 'reuniao', label: 'Reunião', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/reuniao' },
      ]},
      { id: 'ger-integrantes', label: 'Gerenciar Integrantes', icon: '', children: [
        { id: 'integrantes', label: 'Integrantes', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_integrante_listartodos' },
        { id: 'cad-rapido', label: 'Cadastro Rápido', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/preIntegrante/' },
      ]},
      { id: 'ger-mundo-viva', label: 'Gerenciar Mundo VIVA', icon: '', children: [
        { id: 'viva-avisa', label: 'Viva Avisa e-mail', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_bank_aviso' },
        { id: 'documentos', label: 'Documentos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_bank_documento_fundo' },
        { id: 'avisos-com', label: 'Avisos Comissões', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/avisosVivaBank' },
        { id: 'eventos-nao-of', label: 'Eventos não oficiais', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/eventosVivaBank' },
        { id: 'enquete', label: 'Enquete', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/enquete_franq' },
      ]},
      { id: 'relatorios', label: 'Relatórios', icon: '', children: [
        { id: 'rel-boletos', label: 'Relatórios de Boletos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_boleto_listar' },
        { id: 'rel-parc-fut', label: 'Relatórios Parcelamentos Futuros', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_relatorio_parcelamentos_futuros' },
        { id: 'rel-lancamentos', label: 'Relatórios de Lançamentos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_integranteFinanceiro_relatorioGeral' },
        { id: 'rel-reg-deb', label: 'Relatórios Regul. de Debitos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_regularizacaoDebito_relatorioGeral' },
        { id: 'rel-lotes', label: 'Relatórios de Lotes', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/indexRetorioDeLote_fundoLote' },
        { id: 'rel-int-evento', label: 'Relatório Integrantes por Evento', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_relatorio_participacaoEventos' },
        { id: 'rel-tarifas-cl', label: 'Relatório de Tarifas', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_relatorio_tarifa' },
        { id: 'rel-pgto-cartao', label: 'Relatório de Pagamentos no Cartão', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/zoop/relatorios_pagamento_cartao' },
        { id: 'rel-acomp-inad', label: 'Relatório de Acompanhamento de Inadimplentes', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/fundo/relatorio_integrantes_inadimplentes' },
        { id: 'rel-saldo-proj', label: 'Relatório Saldo Projetado - SPDX', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/fundo/relatorio_saldo_projetado' },
        { id: 'rel-ctrl-fech', label: 'Relatório de Controle de Fechamentos', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/op/fechamento/relatorio_controle_fechamentos' },
      ]},
    ],
  },
  {
    id: 'fornecedores', label: 'Fornecedores', icon: 'fa-cart-plus',
    children: [
      { id: 'ger-fornecedor', label: 'Gerenciar Fornecedor', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_fornecedor_listar' },
      { id: 'parceiros', label: 'Parceiros (Clube Viva)', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/parceiros/' },
      { id: 'ger-servicos', label: 'Gerenciar Serviços', icon: '', children: [
        { id: 'modulo', label: 'Módulo', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/modulo/' },
        { id: 'servicos', label: 'Serviços', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/produtoServico' },
        { id: 'item', label: 'Item', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/item/' },
      ]},
      { id: 'contratacao-forn', label: 'Contratação de Fornecedores', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/negociacao_em_massa/index' },
    ],
  },
  {
    id: 'comercial', label: 'Comercial', icon: 'fa-map-marker',
    children: [
      { id: 'ger-inst', label: 'Gerenciar Instituições', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_instituicao_listar' },
      { id: 'ger-cursos', label: 'Gerenciar Cursos', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_curso_listar' },
      { id: 'concorrentes', label: 'Concorrentes', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/empresaCerimonial' },
    ],
  },
  {
    id: 'relacionamento', label: 'Relacionamento', icon: 'fa-users',
    children: [
      { id: 'ctrl-mensalidade', label: 'Controle Mensalidade', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/controleMensalidade' },
    ],
  },
  {
    id: 'admin-unidade', label: 'Administrativo Unidade', icon: 'fa-cog',
    children: [
      { id: 'conta', label: 'Conta', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_conta_listar' },
      { id: 'caixa', label: 'Caixa', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_caixa_listar' },
      { id: 'caixas-unif', label: 'Caixas Unificados', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/caixaunificado' },
      { id: 'contas-pagar', label: 'Contas a Pagar Unidade', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/contas_pagar_listar' },
      { id: 'contas-receber', label: 'Contas a Receber Unidade', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/contas_receber_listar' },
      { id: 'contas-pagar-spdx', label: 'Contas a Pagar SPDX', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/contas_pagar_listar/?/spdx/1' },
      { id: 'contas-receber-spdx', label: 'Contas a Receber SPDX', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/contas_receber_listar/?/spdx/1' },
      { id: 'pgto-lotes', label: 'Pagamentos em Lotes BB', icon: '', children: [
        { id: 'gerar-lote', label: 'Gerar', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/bb-payments-api/pagamento-em-lote/gerar' },
        { id: 'rel-status-tit', label: 'Rel. Status Título Lote', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/bb-payments-api/pagamento-em-lote/relatorio-status-titulo-lote' },
        { id: 'rel-status-tit-emp', label: 'Rel. Status Título Lote Empresa', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/bb-payments-api/pagamento-em-lote/relatorio-status-titulo-lote-empresa' },
      ]},
      { id: 'rel-banco', label: 'Relatório de Banco', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/depositoBanco' },
      { id: 'rel-royalties', label: 'Relatório Royalties', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/relatorioRoyalties' },
      { id: 'repasse-carteira', label: 'Repasse Carteira', icon: '', children: [
        { id: 'gerar-repasse', label: 'Gerar Repasse', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/carteira-repasse' },
        { id: 'rel-repasse', label: 'Relatório Repasse', icon: 'fa-circle-o', href: 'https://mundovivaextranet.vivaeventos.com.br/carteira-repasse/relatorio' },
      ]},
    ],
  },
  {
    id: 'viva-academy', label: 'Viva Academy', icon: 'fa-graduation-cap',
    href: 'https://vivaacademy.vivaeventos.com.br/login/index.php', target: '_blank',
  },
  {
    id: 'fale-franqueadora', label: 'Fale com a Franqueadora', icon: 'fa-envelope',
    children: [
      { id: 'central-duvidas', label: 'Central de dúvidas', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/falefranqueadora/comunicacao' },
      { id: 'ajuda', label: 'Ajuda', icon: '', href: 'https://mundovivaextranet.vivaeventos.com.br/falefranqueadora/ajuda' },
    ],
  },
];

// ====== MENU NOVO: Ferramentas UNI agrupadas por time > categoria ======
function buildFerramentasMenu(): MenuItem[] {
  const timeConfig: Record<string, { label: string; icon: string }> = {
    'VENDAS': { label: '🚀 Vendas', icon: 'fa-rocket' },
    'RELACIONAMENTO': { label: '🤝 Relacionamento', icon: 'fa-handshake-o' },
    'ATENDIMENTO': { label: '📞 Atendimento', icon: 'fa-phone' },
    'PRODUÇÃO': { label: '🎪 Produção', icon: 'fa-calendar' },
    'PERFORMANCE': { label: '📈 Performance', icon: 'fa-line-chart' },
    'GP': { label: '👥 Gestão de Pessoas', icon: 'fa-group' },
    'ADMINISTRATIVO': { label: '🏢 Administrativo', icon: 'fa-briefcase' },
  };

  const catLabels: Record<string, string> = {
    'DASHBOARDS': '📊 Dashboards',
    'FERRAMENTAS (GESTÃO PROCESSO)': '⚙️ Gestão de Processo',
    'FERRAMENTAS (SISTEMA)': '🖥️ Sistemas / Web Apps',
    'FERRAMENTAS (OPERACIONAL)': '🛠️ Operacional',
    'FERRAMENTAS (ABRIR CHAMADO)': '🎫 Abrir Chamado',
    'FERRAMENTAS (ATENDIMENTO ALUNO)': '👤 Atendimento Aluno',
    'DOCUMENTOS PADRÕES': '📄 Documentos Padrões',
    'INSTRUÇÕES DE TRABALHO (TREINAMENTO)': '🎓 Treinamento',
    'INSTRUÇÕES DE TRABALHO (MATERIAIS DE APOIO)': '📚 Materiais de Apoio',
  };

  const times = ['VENDAS', 'RELACIONAMENTO', 'ATENDIMENTO', 'PRODUÇÃO', 'PERFORMANCE', 'GP', 'ADMINISTRATIVO'];

  return times.map(time => {
    const items = ferramentasData.filter(f => f.time === time);
    const catMap: Record<string, Ferramenta[]> = {};
    items.forEach(f => {
      const cat = f.categoria || 'OUTROS';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(f);
    });

    const children: MenuItem[] = Object.entries(catMap).map(([cat, ferramentas]) => {
      const catLabel = catLabels[cat] || cat;
      const catChildren = ferramentas
        .filter(f => f.link && f.link.startsWith('http'))
        .map((f, idx) => ({
          id: `${time}-${cat}-${idx}`,
          label: f.nome,
          icon: 'fa-circle-o',
          href: f.link,
          target: '_blank' as string,
        }));

      if (catChildren.length === 0) return null;

      return {
        id: `${time}-${cat}`,
        label: catLabel,
        icon: '',
        children: catChildren,
      };
    }).filter(Boolean) as MenuItem[];

    const config = timeConfig[time] || { label: time, icon: 'fa-folder' };
    return {
      id: `ferramentas-${time.toLowerCase()}`,
      label: config.label,
      icon: config.icon,
      children,
    };
  });
}

// ====== COMPONENTES DE SUBMENU ======

// Sub-item level 3 (folhas - fa-circle-o items)
function SubMenuItem({ item }: { item: MenuItem }) {
  return (
    <li>
      <a
        href={item.href || '#'}
        target={item.target || '_self'}
        rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
        style={{
          display: 'block',
          padding: '7px 10px 7px 30px',
          fontSize: '13px',
          color: '#b4c8d5',
          textDecoration: 'none',
          transition: 'all 0.15s',
          fontFamily: "'Roboto', sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = '#152026'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#b4c8d5'; e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {item.icon && <i className={`fa ${item.icon}`} style={{ marginRight: '8px', fontSize: '10px' }} />}
        {item.label}
        {item.target === '_blank' && <i className="fa fa-external-link" style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.5 }} />}
      </a>
    </li>
  );
}

// Sub-menu level 2 (expandable ou link)
function SubMenu({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <li>
        <a
          href={item.href || '#'}
          target={item.target || '_self'}
          rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
          style={{
            display: 'block',
            padding: '9px 10px 9px 18px',
            fontSize: '13px',
            color: '#c9dbe6',
            textDecoration: 'none',
            transition: 'all 0.15s',
            fontFamily: "'Roboto', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = '#1d3040'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#c9dbe6'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {item.label}
          {item.target === '_blank' && <i className="fa fa-external-link" style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.5 }} />}
        </a>
      </li>
    );
  }

  return (
    <li>
      <a
        href="#"
        onClick={e => { e.preventDefault(); setOpen(!open); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 10px 9px 18px',
          fontSize: '13px',
          color: '#c9dbe6',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: "'Roboto', sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = '#1d3040'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#c9dbe6'; e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <span>{item.label}</span>
        <i className={`fa fa-angle-${open ? 'up' : 'down'}`} style={{ fontSize: '14px', marginRight: '4px' }} />
      </a>
      {open && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, backgroundColor: '#152026' }}>
          {item.children!.map(child => (
            <SubMenuItem key={child.id} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Menu level 1 (itens principais com ícone)
function MainMenuItem({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  // Item simples (link direto: Home, Viva Academy)
  if (!hasChildren) {
    return (
      <li style={{ borderBottom: '1px solid #1e3242' }}>
        <a
          href={item.href || '#'}
          target={item.target || '_self'}
          rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 14px',
            fontSize: '15px',
            color: '#dce6ed',
            textDecoration: 'none',
            transition: 'all 0.15s',
            fontFamily: "'Roboto', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1d3040'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#dce6ed'; }}
        >
          <i className={`fa ${item.icon}`} style={{ width: '20px', textAlign: 'center', fontSize: '16px', color: '#FF8537' }} />
          <span>{item.label}</span>
        </a>
      </li>
    );
  }

  // Item com submenu
  return (
    <li style={{ borderBottom: '1px solid #1e3242' }}>
      <a
        href="#"
        onClick={e => { e.preventDefault(); setOpen(!open); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 14px',
          fontSize: '15px',
          color: open ? '#fff' : '#dce6ed',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: "'Roboto', sans-serif",
          backgroundColor: open ? '#1d3040' : 'transparent',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.backgroundColor = '#1d3040'; e.currentTarget.style.color = '#fff'; }}}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#dce6ed'; }}}
      >
        <i className={`fa ${item.icon}`} style={{ width: '20px', textAlign: 'center', fontSize: '16px', color: '#FF8537' }} />
        <span style={{ flex: 1 }}>{item.label}</span>
        <i className={`fa fa-angle-${open ? 'up' : 'down'}`} style={{ fontSize: '14px' }} />
      </a>
      {open && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, backgroundColor: '#234054' }}>
          {item.children!.map(child => (
            <SubMenu key={child.id} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ====== COMPONENTE PRINCIPAL ======
export function MundoVivaMenu() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeView, setActiveView] = useState<'home' | 'ferramentas'>('home');
  const [searchTerm, setSearchTerm] = useState('');

  const ferramentasMenu = useMemo(() => buildFerramentasMenu(), []);

  // Busca
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return ferramentasData.filter(f =>
      f.nome.toLowerCase().includes(term) ||
      f.finalidade.toLowerCase().includes(term) ||
      f.time.toLowerCase().includes(term) ||
      f.categoria.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const toggleSidebar = useCallback(() => setSidebarVisible(v => !v), []);

  return (
    <>
      {/* Font Awesome + Roboto CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: "'Roboto', sans-serif" }}>

        {/* ===== NAVBAR (Header) - Fiel ao MV ===== */}
        <header style={{
          height: '50px',
          background: 'linear-gradient(to right, #2d5672, #4a7c9f)',
          boxShadow: '1px 1px 1px #ccc',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          zIndex: 20,
        }}>
          {/* Logo area */}
          <div style={{
            width: sidebarVisible ? '240px' : '50px',
            height: '50px',
            backgroundColor: '#2A3B45',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            transition: 'width 0.3s',
            flexShrink: 0,
          }}>
            <a href="#" onClick={e => { e.preventDefault(); setActiveView('home'); }} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="https://mundovivaextranet.vivaeventos.com.br/images/logo-extranet-menu.png"
                alt="Mundo Viva"
                style={{ height: '35px', width: 'auto' }}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = 'none';
                  t.insertAdjacentHTML('afterend', '<span style="color:#fff;font-weight:700;font-size:16px">MUNDO VIVA</span>');
                }}
              />
              {!sidebarVisible && (
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>MV</span>
              )}
            </a>
            <a
              href="#"
              onClick={e => { e.preventDefault(); toggleSidebar(); }}
              style={{ marginLeft: 'auto', color: '#fff', fontSize: '20px', textDecoration: 'none', padding: '5px' }}
            >
              <i className="fa fa-bars" />
            </a>
          </div>

          {/* Saudação */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: "'Roboto', sans-serif" }}>
              Olá <span>Gabriel</span>. Você está logado em <span>Viva Eventos Franqueadora</span>
            </span>
          </div>

          {/* Config icon */}
          <div style={{ padding: '0 16px' }}>
            <i className="fa fa-cog" style={{ color: '#fff', fontSize: '22px', cursor: 'pointer' }} />
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>

          {/* ===== SIDEBAR - Fiel ao MV ===== */}
          {sidebarVisible && (
            <aside style={{
              width: '240px',
              backgroundColor: '#2A3B45',
              overflowY: 'auto',
              flexShrink: 0,
              borderRight: '1px solid #1e3242',
              position: 'sticky',
              top: '50px',
              height: 'calc(100vh - 50px)',
            }}>
              {/* Tabs: Menu Original vs Ferramentas UNI */}
              <div style={{
                display: 'flex',
                borderBottom: '2px solid #1e3242',
              }}>
                <button
                  onClick={() => { setActiveView('home'); setSearchTerm(''); }}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    border: 'none',
                    cursor: 'pointer',
                    color: activeView === 'home' ? '#FF8537' : '#8ba5b5',
                    backgroundColor: activeView === 'home' ? '#1d3040' : 'transparent',
                    borderBottom: activeView === 'home' ? '2px solid #FF8537' : '2px solid transparent',
                    transition: 'all 0.2s',
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  <i className="fa fa-home" style={{ marginRight: '4px' }} /> Menu MV
                </button>
                <button
                  onClick={() => { setActiveView('ferramentas'); setSearchTerm(''); }}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    border: 'none',
                    cursor: 'pointer',
                    color: activeView === 'ferramentas' ? '#FF8537' : '#8ba5b5',
                    backgroundColor: activeView === 'ferramentas' ? '#1d3040' : 'transparent',
                    borderBottom: activeView === 'ferramentas' ? '2px solid #FF8537' : '2px solid transparent',
                    transition: 'all 0.2s',
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  <i className="fa fa-wrench" style={{ marginRight: '4px' }} /> Ferramentas
                </button>
              </div>

              {/* Nav list */}
              <nav>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {activeView === 'home' && ORIGINAL_MENU.map(item => (
                    <MainMenuItem key={item.id} item={item} />
                  ))}
                  {activeView === 'ferramentas' && ferramentasMenu.map(group => (
                    <MainMenuItem key={group.id} item={group} />
                  ))}
                </ul>
              </nav>

              {/* Footer Sprint */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid #1e3242',
                textAlign: 'center',
                color: '#6a8a9d',
                fontSize: '11px',
              }}>
                <span>Última versão:</span><br />
                <span>Sprint 153 - <a href="#" style={{ color: '#FF8537', textDecoration: 'none' }}>Entregas <i className="fa fa-external-link-square" /></a></span><br />
                <span>27/02/2026 12:57:00</span>
                <div style={{ marginTop: '8px', color: '#FF8537', fontWeight: 600, fontSize: '10px' }}>⚠️ PROTÓTIPO MENU - TEMPORÁRIO</div>
              </div>
            </aside>
          )}

          {/* ===== CONTEÚDO PRINCIPAL ===== */}
          <main style={{
            flex: 1,
            backgroundColor: '#f5f5f5',
            minHeight: 'calc(100vh - 50px)',
          }}>
            {/* Banner / carousel area */}
            <div style={{
              margin: '20px',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                height: '250px',
                background: 'linear-gradient(135deg, #FF6B35 0%, #8B1A1A 50%, #2d5672 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ textAlign: 'center', color: '#fff', zIndex: 1 }}>
                  <h1 style={{ fontSize: '42px', fontWeight: 300, margin: 0, letterSpacing: '2px' }}>
                    VIVA <em style={{ fontStyle: 'italic' }}>a felicidade.</em>
                  </h1>
                  <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>Central de Ferramentas e Gestão — Mundo Viva Extranet</p>
                </div>
                <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '30px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>‹</div>
                <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '30px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>›</div>
              </div>
            </div>

            {/* ===== ACESSO RÁPIDO ===== */}
            <div style={{ margin: '0 20px 20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 400, color: '#555', marginBottom: '16px' }}>
                <span style={{ color: '#4a7c9f', fontWeight: 700 }}>// </span>ACESSO RÁPIDO
              </h3>

              {/* Busca */}
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar ferramenta, time, categoria..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: "'Roboto', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#4a7c9f'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#ddd'; }}
                />
              </div>

              {/* Resultados da busca */}
              {searchTerm.trim() && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                    {searchResults.length} resultado(s) para &quot;<strong>{searchTerm}</strong>&quot;
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {searchResults.filter(f => f.link && f.link.startsWith('http')).map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          color: '#333',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a7c9f'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <i className="fa fa-external-link" style={{ color: '#4a7c9f', fontSize: '14px', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>{item.time} · {item.categoria}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de acesso rápido (estilo original MV) */}
              {!searchTerm.trim() && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  justifyContent: 'flex-start',
                }}>
                  {[
                    { label: 'Consulta integrante', icon: 'fa-user', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_integrante_listartodos' },
                    { label: 'Consulta do fundo', icon: 'fa-briefcase', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_fundo_listar' },
                    { label: 'Relatório de inadimplentes', icon: 'fa-file-text', href: 'https://mundovivaextranet.vivaeventos.com.br/fundo/relatorio_integrantes_inadimplentes' },
                    { label: 'Relatório de Títulos Pagos', icon: 'fa-file', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_viva_boleto_listar' },
                    { label: 'Requisição de pagamento', icon: 'fa-money', href: 'https://mundovivaextranet.vivaeventos.com.br/#!/aprimorar_requisicao_pagamento_listar' },
                    { label: 'Central de Dashboards', icon: 'fa-dashboard', href: '/' },
                  ].map((btn, idx) => (
                    <a
                      key={idx}
                      href={btn.href}
                      target={btn.href.startsWith('http') ? '_blank' : '_self'}
                      rel={btn.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      style={{
                        width: '120px',
                        padding: '20px 10px',
                        backgroundColor: '#4a90a4',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        textDecoration: 'none',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3d7a8c'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#4a90a4'; }}
                    >
                      <i className={`fa ${btn.icon}`} style={{ fontSize: '28px' }} />
                      <span>{btn.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ===== FERRAMENTAS POR TIME (cards resumidos) ===== */}
            {!searchTerm.trim() && (
              <div style={{ margin: '0 20px 20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 400, color: '#555', marginBottom: '16px' }}>
                  <span style={{ color: '#FF8537', fontWeight: 700 }}>// </span>FERRAMENTAS POR TIME
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '14px',
                }}>
                  {[
                    { time: 'VENDAS', label: 'Vendas', icon: 'fa-rocket', color: '#e74c3c' },
                    { time: 'RELACIONAMENTO', label: 'Relacionamento', icon: 'fa-handshake-o', color: '#3498db' },
                    { time: 'ATENDIMENTO', label: 'Atendimento', icon: 'fa-phone', color: '#2ecc71' },
                    { time: 'PRODUÇÃO', label: 'Produção', icon: 'fa-calendar', color: '#9b59b6' },
                    { time: 'PERFORMANCE', label: 'Performance', icon: 'fa-line-chart', color: '#f39c12' },
                    { time: 'GP', label: 'Gestão de Pessoas', icon: 'fa-group', color: '#1abc9c' },
                    { time: 'ADMINISTRATIVO', label: 'Administrativo', icon: 'fa-briefcase', color: '#34495e' },
                  ].map(t => {
                    const count = ferramentasData.filter(f => f.time === t.time).length;
                    const dashCount = ferramentasData.filter(f => f.time === t.time && f.categoria === 'DASHBOARDS').length;
                    return (
                      <div
                        key={t.time}
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #e0e0e0',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => { setActiveView('ferramentas'); }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = t.color; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                      >
                        <div style={{ height: '4px', backgroundColor: t.color }} />
                        <div style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <i className={`fa ${t.icon}`} style={{ fontSize: '20px', color: t.color }} />
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#333' }}>{t.label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
                            <span><strong style={{ color: '#333' }}>{count}</strong> ferramentas</span>
                            {dashCount > 0 && <span><strong style={{ color: t.color }}>{dashCount}</strong> dashboards</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          {/* ===== AGENDA (Sidebar direita) ===== */}
          <aside style={{
            width: '320px',
            backgroundColor: '#fff',
            borderLeft: '1px solid #e0e0e0',
            flexShrink: 0,
            overflowY: 'auto',
            position: 'sticky',
            top: '50px',
            height: 'calc(100vh - 50px)',
          }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 400, color: '#333', margin: 0 }}>Agenda Geral de Eventos</h3>
                <button style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  border: '1px solid #2ecc71',
                  borderRadius: '20px',
                  backgroundColor: '#2ecc71',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}>
                  <i className="fa fa-info-circle" style={{ marginRight: '4px' }} /> Legenda
                </button>
              </div>
              <p style={{ color: '#FF8537', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>Próximos eventos</p>

              {/* Eventos fictícios (fiel ao layout original) */}
              {[
                { date: '03/03/2026', title: '7463 | PATRICK-MACHADO DIREITO-FADIVA 2025.2 (PAC)', unit: 'Unidade: Lavras', desc: 'Colação', time: '19:00 - 20:00', color: '#e74c3c', confirmed: true },
                { date: '05/03/2026', title: '8075 | SUPER INTEGRADAS - UNIC - 2025-2 (PAC) (JUNÇÃO)', unit: 'Unidade: Cuiabá', desc: 'EVENTO RELIGIOSO', time: '20:00 - 22:00', color: '#FF8537', confirmed: true },
                { date: '05/03/2026', title: '7463 | PATRICK-MACHADO DIREITO-FADIVA 2025.2 (PAC)', unit: 'Unidade: Lavras', desc: 'Evento Religioso', time: 'Horário indefinido', color: '#f39c12', confirmed: false },
                { date: '05/03/2026', title: '6918 | MULTI SAUDE 25.2 (PAC)', unit: 'Unidade: Volta Redonda - VivaMixx', desc: 'CULTO ECUMÊNICO - MEDVET UBM', time: '', color: '#e74c3c', confirmed: false },
              ].map((ev, idx) => (
                <div key={idx} style={{
                  backgroundColor: ev.color,
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '8px',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                    {ev.date} {ev.confirmed && '✔'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: '1.4' }}>{ev.title}</div>
                  {ev.unit && <div style={{ fontSize: '11px', marginTop: '2px' }}>{ev.unit}</div>}
                  <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>{ev.desc}</div>
                  {ev.time && <div style={{ fontSize: '11px', marginTop: '2px' }}>{ev.time}</div>}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default MundoVivaMenu;
