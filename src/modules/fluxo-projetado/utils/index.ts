/**
 * Utilitários do Módulo Fluxo Projetado
 */

// ============================================
// Formatadores
// ============================================

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatarMoedaCompleta(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

// ============================================
// Cálculos de FEE
// ============================================

export function calcularFeeTotal(valorArrecadacao: number, percentualFee: number): number {
  return valorArrecadacao * (percentualFee / 100);
}

export function calcularFeeRecebido(
  feeTotal: number,
  parcelasRecebidas: number,
  fechamentoRecebido: boolean
): number {
  // 60% em 6 parcelas de 10%
  const fee60 = feeTotal * 0.6;
  const porParcela = fee60 / 6;
  let recebido = porParcela * parcelasRecebidas;
  
  // 40% no fechamento
  if (fechamentoRecebido) {
    recebido += feeTotal * 0.4;
  }
  
  return recebido;
}

export function calcularFeeAReceber(
  feeTotal: number,
  parcelasRecebidas: number,
  fechamentoRecebido: boolean
): number {
  return feeTotal - calcularFeeRecebido(feeTotal, parcelasRecebidas, fechamentoRecebido);
}

// ============================================
// Cálculos de Convite Extra
// ============================================

export function calcularReceitaConviteExtra(
  vendasConvites: number,
  margemPercentual: number = 12
): number {
  return vendasConvites * (margemPercentual / 100);
}

// ============================================
// Cálculos de Margem de Fechamento
// ============================================

export function calcularMargemFechamento(
  valorArrecadacao: number,
  convitesExtras: number,
  margemPercentual: number,
  feeValor: number
): number {
  const base = valorArrecadacao + convitesExtras;
  const margemBruta = base * (margemPercentual / 100);
  return Math.max(0, margemBruta - feeValor);
}

// ============================================
// Helpers de Data
// ============================================

export function getAnoAtual(): number {
  return new Date().getFullYear();
}

export function getAnosDisponiveis(): number[] {
  const anoAtual = getAnoAtual();
  return [anoAtual - 1, anoAtual, anoAtual + 1, anoAtual + 2, anoAtual + 3];
}

export function formatarData(dataStr: string): string {
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatarMesAno(dataStr: string): string {
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });
}
