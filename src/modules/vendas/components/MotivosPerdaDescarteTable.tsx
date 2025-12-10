'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface MotivoItem {
  motivo: string;
  total: number;
  percentual: number;
}

interface ConcorrenteItem {
  concorrente: string;
  total: number;
  percentual: number;
}

interface MotivosPerdaDescarteTableProps {
  motivosPerda: MotivoItem[];
  motivosDescarte: MotivoItem[];
  concorrentes: ConcorrenteItem[];
}

// Componente de tabela individual no estilo PEX
const TabelaMotivos: React.FC<{
  titulo: string;
  colunaNome: string;
  dados: MotivoItem[];
  onExport: () => void;
}> = ({ titulo, colunaNome, dados, onExport }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  
  const totalPages = Math.ceil(dados.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dadosPaginados = dados.slice(startIndex, endIndex);
  
  // Calcular totais
  const totalGeral = dados.reduce((sum, item) => sum + item.total, 0);
  const totalPercentual = dados.reduce((sum, item) => sum + item.percentual, 0);
  
  const mensagemVazia = colunaNome.includes('Perda') 
    ? 'Nenhum motivo de perda encontrado no período selecionado'
    : colunaNome.includes('Descarte')
    ? 'Nenhum descarte encontrado no período selecionado'
    : 'Nenhum registro disponível na tabela';

  return (
    <div 
      className="table-card flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.03)',
        borderRadius: '8px',
        padding: '14px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
        minHeight: '340px',
      }}
    >
      {/* Título da tabela */}
      <h3 
        className="section-title"
        style={{ fontSize: '1rem', marginBottom: '8px' }}
      >
        {titulo}
      </h3>

      {/* Botão de exportar */}
      {dados.length > 0 && (
        <div className="mb-2">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      )}
      
      {/* Tabela */}
      <div 
        className="flex-1"
        style={{ 
          maxHeight: '280px', 
          overflowY: 'auto',
          borderRadius: '8px',
          border: '1px solid #444',
        }}
      >
        <table 
          style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              <th 
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  width: '60%',
                }}
              >
                {colunaNome}
              </th>
              <th 
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  width: '20%',
                }}
              >
                %
              </th>
              <th 
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  width: '20%',
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {dados.length === 0 ? (
              <tr>
                <td 
                  colSpan={3} 
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#adb5bd',
                  }}
                >
                  {mensagemVazia}
                </td>
              </tr>
            ) : (
              dadosPaginados.map((item, index) => (
                <tr 
                  key={item.motivo}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#343A40' : '#2c3136',
                    borderBottom: '1px solid #444',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#343A40' : '#2c3136'}
                >
                  <td 
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      color: '#F8F9FA',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      maxWidth: '200px',
                      wordWrap: 'break-word',
                    }}
                  >
                    {item.motivo}
                  </td>
                  <td 
                    style={{
                      padding: '10px 16px',
                      textAlign: 'center',
                      color: '#adb5bd',
                    }}
                  >
                    {item.percentual.toFixed(1)}%
                  </td>
                  <td 
                    style={{
                      padding: '10px 16px',
                      textAlign: 'center',
                      color: '#F8F9FA',
                      fontWeight: 600,
                    }}
                  >
                    {item.total}
                  </td>
                </tr>
              ))
            )}
            {/* Linha de Total */}
            {dados.length > 0 && (
              <tr 
                style={{
                  backgroundColor: '#1a1d21',
                  borderTop: '2px solid #FF6600',
                }}
              >
                <td 
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#FF6600',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Total
                </td>
                <td 
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: '#FF6600',
                    fontWeight: 700,
                  }}
                >
                  {totalPercentual.toFixed(1)}%
                </td>
                <td 
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    color: '#FF6600',
                    fontWeight: 700,
                  }}
                >
                  {totalGeral.toLocaleString('pt-BR')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #444',
          fontSize: '0.875rem',
          color: '#ADB5BD',
          fontFamily: 'Poppins, sans-serif',
        }}>
          <span>
            Mostrando {Math.min(startIndex + 1, dados.length)} a {Math.min(endIndex, dados.length)} de {dados.length} registros
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === 1 
                  ? 'bg-dark-tertiary border border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === totalPages 
                  ? 'bg-dark-tertiary border border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MotivosPerdaDescarteTable: React.FC<MotivosPerdaDescarteTableProps> = ({
  motivosPerda,
  motivosDescarte,
  concorrentes,
}) => {
  // Exportar para CSV
  const exportarCSV = (dados: Array<MotivoItem | ConcorrenteItem>, nomeArquivo: string, colunaNome: string) => {
    if (dados.length === 0) return;
    
    const headers = [colunaNome, '%', 'Total'];
    const rows = dados.map(item => {
      const nome = 'motivo' in item ? item.motivo : item.concorrente;
      return [
        nome,
        item.percentual.toFixed(1),
        item.total.toString()
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${nomeArquivo}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
  };

  // Converter concorrentes para o formato da tabela
  const concorrentesParaTabela: MotivoItem[] = concorrentes.map(c => ({
    motivo: c.concorrente,
    total: c.total,
    percentual: c.percentual
  }));

  return (
    <div className="space-y-5">
      {/* Linha 1: Motivos de Perda e Descarte lado a lado */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        style={{ alignItems: 'stretch' }}
      >
        <TabelaMotivos
          titulo="Motivos de Perda"
          colunaNome="Motivo de Perda"
          dados={motivosPerda}
          onExport={() => exportarCSV(motivosPerda, 'Relatorio_Motivos_Perda', 'Motivo de Perda')}
        />
        <TabelaMotivos
          titulo="Motivos do Descarte"
          colunaNome="Motivo do Descarte"
          dados={motivosDescarte}
          onExport={() => exportarCSV(motivosDescarte, 'Relatorio_Descartes', 'Motivo do Descarte')}
        />
      </div>

      {/* Linha 2: Tabela de Concorrentes */}
      <TabelaMotivos
        titulo="Concorrentes (Leads Perdidos)"
        colunaNome="Concorrente"
        dados={concorrentesParaTabela}
        onExport={() => exportarCSV(concorrentes, 'Relatorio_Concorrentes', 'Concorrente')}
      />
    </div>
  );
};

export default MotivosPerdaDescarteTable;

