/**
 * Formulário de Novo Projeto
 * Abre em popup/modal com duas seções: Dados do Projeto e Resultados e Métricas
 */

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { NovoProjetoForm, Tendencia } from '../types';
import { TIMES_OPTIONS, INDICADORES_OPTIONS, TENDENCIA_OPTIONS } from '../config/app.config';

interface NovoProjetoFormularioProps {
  onSubmit: (form: NovoProjetoForm) => void;
  responsaveis: string[];
}

const initialForm: NovoProjetoForm = {
  projeto: '',
  objetivo: '',
  dataInicio: '',
  dataFim: '',
  time: '',
  responsavel: '',
  indicador: '',
  tendencia: 'Subir',
  resultadoEsperado: 0,
  custo: 0,
};

export const NovoProjetoFormulario: React.FC<NovoProjetoFormularioProps> = ({
  onSubmit,
  responsaveis,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<NovoProjetoForm>(initialForm);

  // Bloquear scroll do body quando modal aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projeto || !form.objetivo || !form.time) return;

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const [ano, mes, dia] = dateStr.split('-');
      return `${dia}/${mes}/${ano}`;
    };

    onSubmit({
      ...form,
      dataInicio: formatDate(form.dataInicio),
      dataFim: formatDate(form.dataFim),
    });
    setForm(initialForm);
    setIsOpen(false);
  };

  const handleClose = () => {
    setForm(initialForm);
    setIsOpen(false);
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#1a1d21',
    border: '1px solid #333',
    color: '#F8FAFC',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    fontFamily: "'Poppins', sans-serif",
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    color: '#ADB5BD',
    fontSize: '0.75rem',
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <>
      {/* Botão Novo Projeto */}
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
          style={{
            backgroundColor: '#FF6600',
            color: '#FFFFFF',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(255,102,0,0.3)',
          }}
        >
          <Plus size={18} />
          Novo Projeto
        </button>
      </div>

      {/* Modal / Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Overlay escuro */}
          <div
            onClick={handleClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal Content */}
          <div
            className="projetos-scroll"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#212529',
              border: '1px solid #444',
              borderRadius: '16px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,102,0,0.15)',
              animation: 'modalFadeIn 0.2s ease-out',
            }}
          >
            {/* Header do Modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '2px solid #FF6600',
                position: 'sticky',
                top: 0,
                backgroundColor: '#212529',
                zIndex: 2,
                borderRadius: '16px 16px 0 0',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,102,0,0.15)',
                  }}
                >
                  <Plus size={22} color="#FF6600" />
                </div>
                <div>
                  <h2
                    style={{
                      color: '#F8FAFC',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      fontFamily: "'Poppins', sans-serif",
                      margin: 0,
                    }}
                  >
                    Novo Projeto
                  </h2>
                  <p style={{ color: '#6c757d', fontSize: '0.78rem', margin: 0 }}>
                    Preencha as informações para criar um novo projeto
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="transition-colors duration-150"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  backgroundColor: 'transparent',
                  color: '#ADB5BD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                  e.currentTarget.style.color = '#FF6600';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ADB5BD';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* Seção 1: Dados do Projeto */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-5 pb-3" style={{ borderBottom: '1px solid #333' }}>
                  <span className="text-lg">🗂</span>
                  <h3
                    style={{
                      color: '#ADB5BD',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      fontFamily: "'Poppins', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      margin: 0,
                    }}
                  >
                    Dados do Projeto
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <label style={labelStyle}>Nome do Projeto *</label>
                    <input
                      type="text"
                      name="projeto"
                      value={form.projeto}
                      onChange={handleChange}
                      placeholder="Ex: Campanha de Marketing Q1"
                      required
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Time *</label>
                    <select
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    >
                      <option value="">Selecione o time</option>
                      {TIMES_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label style={labelStyle}>Objetivo *</label>
                    <textarea
                      name="objetivo"
                      value={form.objetivo}
                      onChange={handleChange}
                      placeholder="Descreva o objetivo do projeto"
                      required
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Responsável</label>
                    <select
                      name="responsavel"
                      value={form.responsavel}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    >
                      <option value="">Selecione o responsável</option>
                      {responsaveis.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Data de Início</label>
                    <input
                      type="date"
                      name="dataInicio"
                      value={form.dataInicio}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Data de Fim</label>
                    <input
                      type="date"
                      name="dataFim"
                      value={form.dataFim}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Resultados e Métricas */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-5 pb-3" style={{ borderBottom: '1px solid #333' }}>
                  <span className="text-lg">📈</span>
                  <h3
                    style={{
                      color: '#ADB5BD',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      fontFamily: "'Poppins', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      margin: 0,
                    }}
                  >
                    Resultados e Métricas
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label style={labelStyle}>Indicador</label>
                    <select
                      name="indicador"
                      value={form.indicador}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    >
                      <option value="">Selecione o indicador</option>
                      {INDICADORES_OPTIONS.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Tendência</label>
                    <select
                      name="tendencia"
                      value={form.tendencia}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    >
                      {TENDENCIA_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Resultado Esperado</label>
                    <input
                      type="number"
                      name="resultadoEsperado"
                      value={form.resultadoEsperado || ''}
                      onChange={handleChange}
                      placeholder="Ex: 100"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Custo (R$)</label>
                    <input
                      type="number"
                      name="custo"
                      value={form.custo || ''}
                      onChange={handleChange}
                      placeholder="Ex: 50000"
                      step="0.01"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#FF6600')}
                      onBlur={(e) => (e.target.style.borderColor = '#333')}
                    />
                  </div>
                </div>
              </div>

              {/* Botões de ação (sticky no rodapé do modal) */}
              <div
                className="flex items-center justify-end gap-3 pt-5 mt-2"
                style={{ borderTop: '1px solid #333' }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ADB5BD',
                    border: '1px solid #555',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF6600')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#555')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: '#FF6600',
                    color: '#FFFFFF',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 12px rgba(255,102,0,0.3)',
                    cursor: 'pointer',
                  }}
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animação do modal */}
      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default NovoProjetoFormulario;
