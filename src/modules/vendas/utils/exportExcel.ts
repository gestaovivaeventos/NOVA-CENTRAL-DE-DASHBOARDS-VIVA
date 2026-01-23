/**
 * Utilitário para exportação de dados em formato Excel (.xlsx)
 */

import * as XLSX from 'xlsx';

interface ExportExcelOptions {
  filename: string;
  sheetName?: string;
  headers: string[];
  data: (string | number)[][];
}

/**
 * Exporta dados para arquivo Excel (.xlsx)
 */
export function exportToExcel({ filename, sheetName = 'Dados', headers, data }: ExportExcelOptions): void {
  // Criar array com headers + dados
  const wsData = [headers, ...data];
  
  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Ajustar largura das colunas baseado no conteúdo
  const colWidths = headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[index] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) }; // max 50 chars
  });
  ws['!cols'] = colWidths;
  
  // Criar workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Gerar nome do arquivo com data
  const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const nomeArquivo = `${filename}_${dataAtual}.xlsx`;
  
  // Fazer download
  XLSX.writeFile(wb, nomeArquivo);
}

/**
 * Exporta dados de objeto para Excel
 */
export function exportObjectToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columnMapping: { key: keyof T; header: string; format?: (value: unknown) => string | number }[],
  sheetName?: string
): void {
  const headers = columnMapping.map(col => col.header);
  const rows = data.map(item =>
    columnMapping.map(col => {
      const value = item[col.key];
      if (col.format) {
        return col.format(value);
      }
      return value as string | number;
    })
  );
  
  exportToExcel({ filename, sheetName, headers, data: rows });
}
