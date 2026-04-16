/**
 * Lista centralizada de ícones para módulos, grupos e subgrupos.
 * Usa lucide-react para preview inline.
 * Todos os componentes de controle-modulos importam daqui.
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconeOption {
  value: string;
  label: string;
  category: string;
}

/**
 * Catálogo completo de ícones disponíveis, organizados por categoria.
 * O "value" é salvo na planilha e usado pela Sidebar central.
 */
export const ICONES: IconeOption[] = [
  // ── Navegação & Layout ──
  { value: 'dashboard', category: 'Layout', label: 'Painel' },
  { value: 'layout-dashboard', category: 'Layout', label: 'Dashboard' },
  { value: 'layout-grid', category: 'Layout', label: 'Grid' },
  { value: 'layout-list', category: 'Layout', label: 'Lista' },
  { value: 'home', category: 'Layout', label: 'Home' },
  { value: 'menu', category: 'Layout', label: 'Menu' },
  { value: 'sidebar', category: 'Layout', label: 'Sidebar' },
  { value: 'panels-top-left', category: 'Layout', label: 'Painéis' },
  { value: 'app-window', category: 'Layout', label: 'Janela' },
  { value: 'monitor', category: 'Layout', label: 'Monitor' },
  { value: 'tablet', category: 'Layout', label: 'Tablet' },

  // ── Gráficos & Dados ──
  { value: 'bar-chart', category: 'Gráficos', label: 'Barras' },
  { value: 'bar-chart-2', category: 'Gráficos', label: 'Barras Alt' },
  { value: 'bar-chart-3', category: 'Gráficos', label: 'Barras Horiz' },
  { value: 'bar-chart-4', category: 'Gráficos', label: 'Barras Horiz Alt' },
  { value: 'pie-chart', category: 'Gráficos', label: 'Pizza' },
  { value: 'chart', category: 'Gráficos', label: 'Gráfico' },
  { value: 'line-chart', category: 'Gráficos', label: 'Linha' },
  { value: 'area-chart', category: 'Gráficos', label: 'Área' },
  { value: 'trending-up', category: 'Gráficos', label: 'Tendência ↑' },
  { value: 'trending-down', category: 'Gráficos', label: 'Tendência ↓' },
  { value: 'activity', category: 'Gráficos', label: 'Atividade' },
  { value: 'gauge', category: 'Gráficos', label: 'Medidor' },
  { value: 'candlestick-chart', category: 'Gráficos', label: 'Candlestick' },

  // ── Financeiro ──
  { value: 'dollar-sign', category: 'Financeiro', label: 'Dólar' },
  { value: 'money', category: 'Financeiro', label: 'Dinheiro' },
  { value: 'wallet', category: 'Financeiro', label: 'Carteira' },
  { value: 'credit-card', category: 'Financeiro', label: 'Cartão' },
  { value: 'banknote', category: 'Financeiro', label: 'Nota' },
  { value: 'coins', category: 'Financeiro', label: 'Moedas' },
  { value: 'receipt', category: 'Financeiro', label: 'Recibo' },
  { value: 'piggy-bank', category: 'Financeiro', label: 'Cofrinho' },
  { value: 'landmark', category: 'Financeiro', label: 'Banco' },
  { value: 'calculator', category: 'Financeiro', label: 'Calculadora' },
  { value: 'percent', category: 'Financeiro', label: 'Percentual' },
  { value: 'badge-percent', category: 'Financeiro', label: 'Desconto' },
  { value: 'hand-coins', category: 'Financeiro', label: 'Mão Moedas' },

  // ── Pessoas & Organização ──
  { value: 'users', category: 'Pessoas', label: 'Usuários' },
  { value: 'user', category: 'Pessoas', label: 'Usuário' },
  { value: 'user-check', category: 'Pessoas', label: 'Usuário ✓' },
  { value: 'user-plus', category: 'Pessoas', label: 'Novo Usuário' },
  { value: 'user-cog', category: 'Pessoas', label: 'Usuário Config' },
  { value: 'contact', category: 'Pessoas', label: 'Contato' },
  { value: 'building', category: 'Pessoas', label: 'Empresa' },
  { value: 'building-2', category: 'Pessoas', label: 'Prédio' },
  { value: 'store', category: 'Pessoas', label: 'Loja' },
  { value: 'handshake', category: 'Pessoas', label: 'Parceria' },
  { value: 'heart-handshake', category: 'Pessoas', label: 'Acordo' },
  { value: 'network', category: 'Pessoas', label: 'Rede' },
  { value: 'crown', category: 'Pessoas', label: 'Coroa' },
  { value: 'award', category: 'Pessoas', label: 'Prêmio' },

  // ── Metas & Performance ──
  { value: 'target', category: 'Metas', label: 'Meta' },
  { value: 'trophy', category: 'Metas', label: 'Troféu' },
  { value: 'medal', category: 'Metas', label: 'Medalha' },
  { value: 'flag', category: 'Metas', label: 'Bandeira' },
  { value: 'goal', category: 'Metas', label: 'Gol' },
  { value: 'rocket', category: 'Metas', label: 'Foguete' },
  { value: 'zap', category: 'Metas', label: 'Raio' },
  { value: 'flame', category: 'Metas', label: 'Chama' },
  { value: 'star', category: 'Metas', label: 'Estrela' },
  { value: 'sparkles', category: 'Metas', label: 'Brilhos' },
  { value: 'check-circle', category: 'Metas', label: 'Check ✓' },
  { value: 'circle-check-big', category: 'Metas', label: 'Check Grande' },
  { value: 'thumbs-up', category: 'Metas', label: 'Positivo' },

  // ── Documentos & Relatórios ──
  { value: 'file-spreadsheet', category: 'Documentos', label: 'Planilha' },
  { value: 'file-text', category: 'Documentos', label: 'Documento' },
  { value: 'file-bar-chart', category: 'Documentos', label: 'Relatório Gráf.' },
  { value: 'file-pie-chart', category: 'Documentos', label: 'Relatório Pizza' },
  { value: 'file-check', category: 'Documentos', label: 'Doc Verificado' },
  { value: 'clipboard', category: 'Documentos', label: 'Prancheta' },
  { value: 'clipboard-list', category: 'Documentos', label: 'Lista' },
  { value: 'clipboard-check', category: 'Documentos', label: 'Checklist' },
  { value: 'notebook', category: 'Documentos', label: 'Caderno' },
  { value: 'book-open', category: 'Documentos', label: 'Livro' },
  { value: 'newspaper', category: 'Documentos', label: 'Jornal' },
  { value: 'presentation', category: 'Documentos', label: 'Apresentação' },
  { value: 'scroll-text', category: 'Documentos', label: 'Pergaminho' },

  // ── Vendas & Funil ──
  { value: 'funnel', category: 'Vendas', label: 'Funil' },
  { value: 'shopping-cart', category: 'Vendas', label: 'Carrinho' },
  { value: 'shopping-bag', category: 'Vendas', label: 'Sacola' },
  { value: 'package', category: 'Vendas', label: 'Pacote' },
  { value: 'tag', category: 'Vendas', label: 'Etiqueta' },
  { value: 'tags', category: 'Vendas', label: 'Etiquetas' },
  { value: 'megaphone', category: 'Vendas', label: 'Megafone' },
  { value: 'gift', category: 'Vendas', label: 'Presente' },
  { value: 'truck', category: 'Vendas', label: 'Entrega' },
  { value: 'box', category: 'Vendas', label: 'Caixa' },

  // ── Tecnologia & Dev ──
  { value: 'code', category: 'Tecnologia', label: '</>' },
  { value: 'terminal', category: 'Tecnologia', label: 'Terminal' },
  { value: 'git-branch', category: 'Tecnologia', label: 'Branch' },
  { value: 'git-merge', category: 'Tecnologia', label: 'Merge' },
  { value: 'database', category: 'Tecnologia', label: 'Banco de Dados' },
  { value: 'server', category: 'Tecnologia', label: 'Servidor' },
  { value: 'cpu', category: 'Tecnologia', label: 'CPU' },
  { value: 'cloud', category: 'Tecnologia', label: 'Nuvem' },
  { value: 'wifi', category: 'Tecnologia', label: 'WiFi' },
  { value: 'globe', category: 'Tecnologia', label: 'Globo' },
  { value: 'bug', category: 'Tecnologia', label: 'Bug' },
  { value: 'bot', category: 'Tecnologia', label: 'Bot' },
  { value: 'braces', category: 'Tecnologia', label: 'Chaves {}' },
  { value: 'binary', category: 'Tecnologia', label: 'Binário' },

  // ── Configuração & Ferramentas ──
  { value: 'settings', category: 'Config', label: 'Configurações' },
  { value: 'wrench', category: 'Config', label: 'Chave Inglesa' },
  { value: 'hammer', category: 'Config', label: 'Martelo' },
  { value: 'sliders-horizontal', category: 'Config', label: 'Controles' },
  { value: 'toggle-left', category: 'Config', label: 'Toggle' },
  { value: 'lock', category: 'Config', label: 'Cadeado' },
  { value: 'key', category: 'Config', label: 'Chave' },
  { value: 'shield', category: 'Config', label: 'Escudo' },
  { value: 'shield-check', category: 'Config', label: 'Escudo ✓' },
  { value: 'scan', category: 'Config', label: 'Scanner' },
  { value: 'filter', category: 'Config', label: 'Filtro' },

  // ── Links & Navegação Externa ──
  { value: 'link', category: 'Links', label: 'Link' },
  { value: 'external-link', category: 'Links', label: 'Link Externo' },
  { value: 'share-2', category: 'Links', label: 'Compartilhar' },
  { value: 'send', category: 'Links', label: 'Enviar' },
  { value: 'upload', category: 'Links', label: 'Upload' },
  { value: 'download', category: 'Links', label: 'Download' },
  { value: 'qr-code', category: 'Links', label: 'QR Code' },

  // ── Pastas & Organização ──
  { value: 'folder', category: 'Organização', label: 'Pasta' },
  { value: 'folder-open', category: 'Organização', label: 'Pasta Aberta' },
  { value: 'folder-tree', category: 'Organização', label: 'Árvore' },
  { value: 'archive', category: 'Organização', label: 'Arquivo' },
  { value: 'inbox', category: 'Organização', label: 'Caixa Entrada' },
  { value: 'layers', category: 'Organização', label: 'Camadas' },
  { value: 'list', category: 'Organização', label: 'Lista' },
  { value: 'list-checks', category: 'Organização', label: 'Lista ✓' },
  { value: 'kanban', category: 'Organização', label: 'Kanban' },
  { value: 'table', category: 'Organização', label: 'Tabela' },
  { value: 'grid-3x3', category: 'Organização', label: 'Grade' },
  { value: 'blocks', category: 'Organização', label: 'Blocos' },

  // ── Tempo & Calendário ──
  { value: 'calendar', category: 'Tempo', label: 'Calendário' },
  { value: 'calendar-check', category: 'Tempo', label: 'Calendário ✓' },
  { value: 'calendar-days', category: 'Tempo', label: 'Dias' },
  { value: 'clock', category: 'Tempo', label: 'Relógio' },
  { value: 'timer', category: 'Tempo', label: 'Timer' },
  { value: 'hourglass', category: 'Tempo', label: 'Ampulheta' },
  { value: 'history', category: 'Tempo', label: 'Histórico' },

  // ── Comunicação ──
  { value: 'mail', category: 'Comunicação', label: 'E-mail' },
  { value: 'message-circle', category: 'Comunicação', label: 'Chat' },
  { value: 'message-square', category: 'Comunicação', label: 'Mensagem' },
  { value: 'bell', category: 'Comunicação', label: 'Notificação' },
  { value: 'phone', category: 'Comunicação', label: 'Telefone' },
  { value: 'video', category: 'Comunicação', label: 'Vídeo' },
  { value: 'headphones', category: 'Comunicação', label: 'Fone' },
  { value: 'at-sign', category: 'Comunicação', label: '@' },

  // ── Mapa & Localização ──
  { value: 'map', category: 'Localização', label: 'Mapa' },
  { value: 'map-pin', category: 'Localização', label: 'Marcador' },
  { value: 'navigation', category: 'Localização', label: 'Navegação' },
  { value: 'compass', category: 'Localização', label: 'Bússola' },
  { value: 'earth', category: 'Localização', label: 'Mundo' },
  { value: 'route', category: 'Localização', label: 'Rota' },

  // ── Misc ──
  { value: 'eye', category: 'Outros', label: 'Visualizar' },
  { value: 'search', category: 'Outros', label: 'Buscar' },
  { value: 'lightbulb', category: 'Outros', label: 'Ideia' },
  { value: 'puzzle', category: 'Outros', label: 'Peça' },
  { value: 'cog', category: 'Outros', label: 'Engrenagem' },
  { value: 'palette', category: 'Outros', label: 'Paleta' },
  { value: 'image', category: 'Outros', label: 'Imagem' },
  { value: 'camera', category: 'Outros', label: 'Câmera' },
  { value: 'mic', category: 'Outros', label: 'Microfone' },
  { value: 'printer', category: 'Outros', label: 'Impressora' },
  { value: 'scissors', category: 'Outros', label: 'Tesoura' },
  { value: 'heart', category: 'Outros', label: 'Coração' },
  { value: 'smile', category: 'Outros', label: 'Sorriso' },
  { value: 'sun', category: 'Outros', label: 'Sol' },
  { value: 'moon', category: 'Outros', label: 'Lua' },
  { value: 'leaf', category: 'Outros', label: 'Folha' },
  { value: 'tree-pine', category: 'Outros', label: 'Árvore' },
  { value: 'mountain', category: 'Outros', label: 'Montanha' },
  { value: 'graduation-cap', category: 'Outros', label: 'Formatura' },
  { value: 'brain', category: 'Outros', label: 'Cérebro' },
  { value: 'atom', category: 'Outros', label: 'Átomo' },
  { value: 'infinity', category: 'Outros', label: 'Infinito' },
  { value: 'hash', category: 'Outros', label: '#' },
  { value: 'circle-dot', category: 'Outros', label: 'Ponto' },
  { value: 'square', category: 'Outros', label: 'Quadrado' },
  { value: 'hexagon', category: 'Outros', label: 'Hexágono' },
  { value: 'triangle', category: 'Outros', label: 'Triângulo' },
];

/** Todas as categorias disponíveis */
export const ICON_CATEGORIES = [...new Set(ICONES.map(i => i.category))];

/**
 * Converte "kebab-case" para PascalCase usado nos exports do lucide-react.
 * Ex: "bar-chart-2" → "BarChart2"
 */
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Retorna o componente React do lucide-react para um dado value de ícone.
 * Fallback para Settings se não encontrar.
 */
export function getLucideIcon(iconValue: string): React.ElementType {
  const pascalName = toPascalCase(iconValue);
  const Icon = (LucideIcons as any)[pascalName];
  return Icon || LucideIcons.Settings;
}

/**
 * Renderiza o preview de um ícone dado seu value.
 */
export function IconPreview({ value, size = 16, color }: { value: string; size?: number; color?: string }) {
  const Icon = getLucideIcon(value);
  return <Icon size={size} color={color} />;
}
