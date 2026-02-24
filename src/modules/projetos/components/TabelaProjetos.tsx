/**
 * Tabela de Acompanhamento de Projetos
 * Com edição inline, modal de edição completa e confirmação de inativação
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Pencil, Check, X, Ban, AlertTriangle, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Filter, Search, Eye } from 'lucide-react';
import { formatarMoeda } from '../utils';
import { Projeto } from '../types';
import { formatarPercentual, formatarData, getProjetoStatusStyle, getStatusColor } from '../utils';
import { TIMES_OPTIONS, INDICADORES_OPTIONS, TENDENCIA_OPTIONS } from '../config/app.config';

interface TabelaProjetosProps {
  projetos: Projeto[];
  onEdit?: (id: string, campo: 'resultadoAtingido' | 'progresso', valor: number) => void;
  onEditFull?: (id: string, dados: Partial<Projeto>, alteradoPor?: string) => void;
  onInativar?: (id: string, inativadoPor?: string) => void;
  responsaveis?: string[];
  currentUserName?: string;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  let color = '#EF4444';
  if (clampedValue >= 80) color = '#22C55E';
  else if (clampedValue >= 50) color = '#EAB308';

  return (
    <div className="w-full">
      <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedValue}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs mt-0.5 block" style={{ color: '#94A3B8' }}>
        {clampedValue}%
      </span>
    </div>
  );
};

const SituacaoBadge: React.FC<{ situacao: string }> = ({ situacao }) => {
  const color = getStatusColor(situacao as any);
  const labels: Record<string, string> = {
    verde: 'No Prazo',
    amarelo: 'Atenção',
    vermelho: 'Crítico',
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{ backgroundColor: color }}
      />
      {labels[situacao] || situacao}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const style = getProjetoStatusStyle(status as any);

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}40`,
      }}
    >
      {status}
    </span>
  );
};

/* ===== Célula editável ===== */
interface EditableCellProps {
  value: number;
  projetoId: string;
  campo: 'resultadoAtingido' | 'progresso';
  onSave: (id: string, campo: 'resultadoAtingido' | 'progresso', valor: number) => void;
  isProgress?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, projetoId, campo, onSave, isProgress = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    let numValue = parseFloat(tempValue) || 0;
    if (isProgress) numValue = Math.min(Math.max(numValue, 0), 100);
    onSave(projetoId, campo, numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-14 px-1.5 py-1 text-center rounded text-xs"
          style={{
            backgroundColor: '#1a1d21',
            border: '1px solid #FF6600',
            color: '#F8FAFC',
            outline: 'none',
          }}
          min={0}
          max={isProgress ? 100 : undefined}
        />
        <button
          onClick={handleSave}
          className="p-1 rounded hover:bg-green-900/30 transition-colors"
          title="Salvar"
        >
          <Check size={14} color="#22C55E" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded hover:bg-red-900/30 transition-colors"
          title="Cancelar"
        >
          <X size={14} color="#EF4444" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 group">
      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{value}</span>
      <button
        onClick={() => {
          setTempValue(value.toString());
          setIsEditing(true);
        }}
        className="p-1 rounded opacity-40 group-hover:opacity-100 hover:bg-orange-900/30 transition-all"
        title="Editar"
      >
        <Pencil size={13} color="#FF9500" />
      </button>
    </div>
  );
};

/* ===== Célula de progresso editável ===== */
interface EditableProgressCellProps {
  value: number;
  projetoId: string;
  onSave: (id: string, campo: 'resultadoAtingido' | 'progresso', valor: number) => void;
}

const EditableProgressCell: React.FC<EditableProgressCellProps> = ({ value, projetoId, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    const numValue = Math.min(Math.max(parseFloat(tempValue) || 0, 0), 100);
    onSave(projetoId, 'progresso', numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-14 px-1.5 py-1 text-center rounded text-xs"
          style={{
            backgroundColor: '#1a1d21',
            border: '1px solid #FF6600',
            color: '#F8FAFC',
            outline: 'none',
          }}
          min={0}
          max={100}
        />
        <span className="text-xs" style={{ color: '#94A3B8' }}>%</span>
        <button
          onClick={handleSave}
          className="p-1 rounded hover:bg-green-900/30 transition-colors"
          title="Salvar"
        >
          <Check size={14} color="#22C55E" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded hover:bg-red-900/30 transition-colors"
          title="Cancelar"
        >
          <X size={14} color="#EF4444" />
        </button>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-center gap-1.5">
        <div className="flex-1">
          <ProgressBar value={value} />
        </div>
        <button
          onClick={() => {
            setTempValue(value.toString());
            setIsEditing(true);
          }}
          className="p-1 rounded opacity-40 group-hover:opacity-100 hover:bg-orange-900/30 transition-all"
          title="Editar"
        >
          <Pencil size={13} color="#FF9500" />
        </button>
      </div>
    </div>
  );
};

/* ===== Modal de Confirmação de Inativação ===== */
interface ConfirmInativarModalProps {
  projeto: Projeto;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmInativarModal: React.FC<ConfirmInativarModalProps> = ({ projeto, onConfirm, onCancel }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', backgroundColor: '#212529', border: '1px solid #444', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={28} color="#EF4444" />
        </div>
        <h3 style={{ color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Inativar Projeto?</h3>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '8px' }}>Você está prestes a inativar o projeto:</p>
        <p style={{ color: '#FF8533', fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>"{projeto.projeto}"</p>
        <p style={{ color: '#6c757d', fontSize: '0.8rem', marginBottom: '24px' }}>Esta ação pode ser revertida alterando o status do projeto.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #555', backgroundColor: 'transparent', color: '#ADB5BD', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
          >
            Sim, Inativar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===== Modal de Edição Completa ===== */
interface EditProjetoModalProps {
  projeto: Projeto;
  responsaveis: string[];
  onSave: (dados: Partial<Projeto>) => void;
  onCancel: () => void;
}

const EditProjetoModal: React.FC<EditProjetoModalProps> = ({ projeto, responsaveis, onSave, onCancel }) => {
  const [form, setForm] = useState({
    projeto: projeto.projeto,
    objetivo: projeto.objetivo,
    time: projeto.time,
    responsavel: projeto.responsavel,
    dataInicio: projeto.dataInicio.includes('/') ? projeto.dataInicio.split('/').reverse().join('-') : projeto.dataInicio,
    prazoFinal: projeto.prazoFinal.includes('/') ? projeto.prazoFinal.split('/').reverse().join('-') : projeto.prazoFinal,
    indicador: projeto.indicador,
    dataAfericao: projeto.dataAfericao || '',
    resultadoEsperado: projeto.resultadoEsperado,
    resultadoAtingido: projeto.resultadoAtingido,
    progresso: projeto.progresso,
    status: projeto.status,
    tendencia: projeto.tendencia,
    impactoEsperado: projeto.impactoEsperado,
    custo: projeto.custo,
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleEsc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleEsc); };
  }, [onCancel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatDate = (d: string) => {
      if (!d) return '';
      if (d.includes('-')) { const [a,m,dia] = d.split('-'); return `${dia}/${m}/${a}`; }
      return d;
    };
    onSave({
      ...form,
      dataInicio: formatDate(form.dataInicio),
      prazoFinal: formatDate(form.prazoFinal),
    });
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#1a1d21', border: '1px solid #333', color: '#F8FAFC', borderRadius: '8px',
    padding: '10px 14px', fontSize: '0.85rem', width: '100%', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    color: '#ADB5BD', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div className="projetos-scroll" style={{ position: 'relative', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#212529', border: '1px solid #444', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '2px solid #FF6600', position: 'sticky', top: 0, backgroundColor: '#212529', zIndex: 2, borderRadius: '16px 16px 0 0' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,102,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={22} color="#FF6600" />
            </div>
            <div>
              <h2 style={{ color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Editar Projeto</h2>
              <p style={{ color: '#6c757d', fontSize: '0.78rem', margin: 0 }}>{projeto.projeto}</p>
            </div>
          </div>
          <button onClick={onCancel} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #444', backgroundColor: 'transparent', color: '#ADB5BD', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            <div className="lg:col-span-2">
              <label style={labelStyle}>Nome do Projeto</label>
              <input type="text" name="projeto" value={form.projeto} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <select name="time" value={form.time} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Selecione</option>
                {TIMES_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label style={labelStyle}>Objetivo</label>
              <textarea name="objetivo" value={form.objetivo} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Responsável</label>
              <select name="responsavel" value={form.responsavel} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Selecione</option>
                {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Data Início</label>
              <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Prazo Final</label>
              <input type="date" name="prazoFinal" value={form.prazoFinal} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Indicador</label>
              <select name="indicador" value={form.indicador} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Selecione</option>
                {INDICADORES_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tendência</label>
              <select name="tendencia" value={form.tendencia} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                {TENDENCIA_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Data Aferição</label>
              <input type="text" name="dataAfericao" value={form.dataAfericao} onChange={handleChange} placeholder="DD/MM/AAAA" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Resultado Esperado</label>
              <input type="number" name="resultadoEsperado" value={form.resultadoEsperado} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Resultado Atingido</label>
              <input type="number" name="resultadoAtingido" value={form.resultadoAtingido} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Progresso (%)</label>
              <input type="number" name="progresso" value={form.progresso} onChange={handleChange} min={0} max={100} style={inputStyle} />
            </div>
            <div className="lg:col-span-2">
              <label style={labelStyle}>Impacto Esperado</label>
              <input type="text" name="impactoEsperado" value={form.impactoEsperado} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Custo (R$)</label>
              <input type="number" name="custo" value={form.custo} onChange={handleChange} step="0.01" style={inputStyle} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5" style={{ borderTop: '1px solid #333' }}>
            <button type="button" onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #555', backgroundColor: 'transparent', color: '#ADB5BD', fontSize: '0.85rem', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#FF6600', color: '#FFFFFF', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ===== Componente de Tendência Badge (para filtro) ===== */
const TendenciaBadge: React.FC<{ tendencia: string }> = ({ tendencia }) => {
  if (tendencia === 'Subir') return <span className="inline-flex items-center gap-1" style={{ color: '#22C55E' }}><TrendingUp size={12} /> Subir</span>;
  return <span className="inline-flex items-center gap-1" style={{ color: '#EF4444' }}><TrendingDown size={12} /> Descer</span>;
};

/* ===== Modal de Visualização de Detalhes ===== */
interface ViewProjetoModalProps {
  projeto: Projeto;
  onClose: () => void;
}

const ViewProjetoModal: React.FC<ViewProjetoModalProps> = ({ projeto, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const labelStyle: React.CSSProperties = {
    color: '#6c757d',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '2px',
  };
  const valueStyle: React.CSSProperties = {
    color: '#F8FAFC',
    fontSize: '0.9rem',
    fontWeight: 500,
  };

  const calcularDiasPrazo = () => {
    if (!projeto.prazoFinal) return null;
    const [dia, mes, ano] = projeto.prazoFinal.split('/').map(Number);
    const prazo = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diff = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const diasPrazo = calcularDiasPrazo();
  const statusPrazo = diasPrazo !== null ? (diasPrazo < 0 ? 'Em Atraso' : diasPrazo === 0 ? 'Vence Hoje' : `${diasPrazo} dias restantes`) : '';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div className="projetos-scroll" style={{ position: 'relative', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#212529', border: '1px solid #444', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '2px solid #FF6600', position: 'sticky', top: 0, backgroundColor: '#212529', zIndex: 2, borderRadius: '16px 16px 0 0' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,102,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={22} color="#FF6600" />
            </div>
            <div>
              <h2 style={{ color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Detalhes do Projeto</h2>
              <p style={{ color: '#6c757d', fontSize: '0.78rem', margin: 0 }}>{projeto.time}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #444', backgroundColor: 'transparent', color: '#ADB5BD', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Nome do Projeto */}
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #333' }}>
            <p style={{ ...labelStyle }}>Projeto</p>
            <h3 style={{ color: '#FF8533', fontSize: '1.2rem', fontWeight: 700, margin: '4px 0' }}>{projeto.projeto}</h3>
          </div>

          {/* Grid de informações */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p style={labelStyle}>Status</p>
              <p style={valueStyle}>{projeto.status}</p>
            </div>
            <div>
              <p style={labelStyle}>Responsável</p>
              <p style={valueStyle}>{projeto.responsavel}</p>
            </div>
            <div>
              <p style={labelStyle}>Início</p>
              <p style={valueStyle}>{formatarData(projeto.dataInicio)}</p>
            </div>
            <div>
              <p style={labelStyle}>Data Limite</p>
              <p style={valueStyle}>{formatarData(projeto.prazoFinal)}</p>
            </div>
            <div>
              <p style={labelStyle}>Prazo (Dias)</p>
              <p style={{ ...valueStyle, color: diasPrazo !== null && diasPrazo < 0 ? '#EF4444' : diasPrazo === 0 ? '#EAB308' : '#22C55E' }}>
                {statusPrazo}
              </p>
            </div>
            <div>
              <p style={labelStyle}>Criado por</p>
              <p style={valueStyle}>{projeto.criadoPor || '-'}</p>
            </div>
            <div>
              <p style={labelStyle}>Data de Criação</p>
              <p style={valueStyle}>{projeto.dataCriacao ? formatarData(projeto.dataCriacao) : '-'}</p>
            </div>
            <div>
              <p style={labelStyle}>Responsável da Alteração</p>
              <p style={valueStyle}>{projeto.alteradoPor || '-'}</p>
            </div>
            <div>
              <p style={labelStyle}>Data da Alteração</p>
              <p style={valueStyle}>{projeto.dataAlteracao ? formatarData(projeto.dataAlteracao) : '-'}</p>
            </div>
          </div>

          {/* KR / Indicador */}
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#1a1d21', borderRadius: '12px', border: '1px solid #333' }}>
            <p style={{ ...labelStyle, color: '#FF8533', marginBottom: '8px' }}>KR | KPI: {projeto.indicador}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p style={labelStyle}>Valor Inicial do KPI | KR</p>
                <p style={valueStyle}>{formatarMoeda(projeto.custo)}</p>
              </div>
              <div>
                <p style={labelStyle}>Tendência</p>
                <p style={valueStyle}>
                  {projeto.tendencia === 'Subir' && <span className="inline-flex items-center gap-1" style={{ color: '#22C55E' }}><TrendingUp size={16} /> Subir</span>}
                  {projeto.tendencia === 'Descer' && <span className="inline-flex items-center gap-1" style={{ color: '#EF4444' }}><TrendingDown size={16} /> Descer</span>}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p style={labelStyle}>Objetivo</p>
              <p style={{ ...valueStyle, lineHeight: 1.5 }}>{projeto.objetivo}</p>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p style={labelStyle}>Data Aferição</p>
              <p style={valueStyle}>{projeto.dataAfericao ? formatarData(projeto.dataAfericao) : 'Não definida'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4" style={{ marginTop: '12px' }}>
              <div>
                <p style={labelStyle}>Resultado Esperado</p>
                <p style={valueStyle}>{projeto.resultadoEsperado}</p>
              </div>
              <div>
                <p style={labelStyle}>Resultado Atingido</p>
                <p style={valueStyle}>{projeto.resultadoAtingido > 0 ? projeto.resultadoAtingido : 'Não apurado'}</p>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p style={labelStyle}>% de Atingimento</p>
              <p style={{ ...valueStyle, fontSize: '1.1rem', color: getStatusColor(projeto.situacao) }}>
                {projeto.percentualAtingimento > 0 ? `${projeto.percentualAtingimento.toFixed(1)}%` : 'Não apurado'}
              </p>
            </div>
          </div>

          {/* Impacto Esperado */}
          {projeto.impactoEsperado && (
            <div style={{ marginBottom: '20px' }}>
              <p style={labelStyle}>Impacto Esperado</p>
              <p style={valueStyle}>{projeto.impactoEsperado}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#FF6600', color: '#FFFFFF', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===== Componente principal ===== */
export const TabelaProjetos: React.FC<TabelaProjetosProps> = ({ projetos, onEdit, onEditFull, onInativar, responsaveis = [], currentUserName = '' }) => {
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [inativandoProjeto, setInativandoProjeto] = useState<Projeto | null>(null);
  const [viewingProjeto, setViewingProjeto] = useState<Projeto | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterTendencia, setFilterTendencia] = useState<string>('Todos');
  const [filterSituacao, setFilterSituacao] = useState<string>('Todos');
  const [filterTime, setFilterTime] = useState<string>('Todos');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Unique values for filter dropdowns
  const uniqueTeams = useMemo(() => {
    const teams = [...new Set(projetos.map(p => p.time))].sort();
    return teams;
  }, [projetos]);

  // Filter & sort logic
  const projetosFiltradosLocais = useMemo(() => {
    let result = [...projetos];

    // Text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.projeto.toLowerCase().includes(term) ||
        p.responsavel.toLowerCase().includes(term) ||
        p.criadoPor.toLowerCase().includes(term) ||
        p.indicador.toLowerCase().includes(term) ||
        p.objetivo.toLowerCase().includes(term) ||
        p.time.toLowerCase().includes(term)
      );
    }

    // Filters
    if (filterStatus !== 'Todos') result = result.filter(p => p.status === filterStatus);
    if (filterTendencia !== 'Todos') result = result.filter(p => p.tendencia === filterTendencia);
    if (filterSituacao !== 'Todos') result = result.filter(p => p.situacao === filterSituacao);
    if (filterTime !== 'Todos') result = result.filter(p => p.time === filterTime);

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        switch (sortColumn) {
          case 'projeto': valA = a.projeto; valB = b.projeto; break;
          case 'time': valA = a.time; valB = b.time; break;
          case 'progresso': valA = a.progresso; valB = b.progresso; break;
          case 'atingimento': valA = a.percentualAtingimento; valB = b.percentualAtingimento; break;
          case 'status': valA = a.status; valB = b.status; break;
          case 'prazoFinal': valA = a.prazoFinal; valB = b.prazoFinal; break;
          default: return 0;
        }
        if (typeof valA === 'string') {
          const cmp = valA.localeCompare(valB);
          return sortDirection === 'asc' ? cmp : -cmp;
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [projetos, searchTerm, filterStatus, filterTendencia, filterSituacao, filterTime, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const activeFiltersCount = [filterStatus, filterTendencia, filterSituacao, filterTime].filter(f => f !== 'Todos').length + (searchTerm.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('Todos');
    setFilterTendencia('Todos');
    setFilterSituacao('Todos');
    setFilterTime('Todos');
    setSortColumn('');
    setSortDirection('asc');
  };

  if (projetos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-lg font-medium" style={{ color: '#ADB5BD' }}>
          Nenhum projeto encontrado
        </p>
        <p className="text-sm mt-1" style={{ color: '#6c757d' }}>
          Utilize os filtros ou adicione um novo projeto
        </p>
      </div>
    );
  }

  const handleEdit = (id: string, campo: 'resultadoAtingido' | 'progresso', valor: number) => {
    if (onEdit) onEdit(id, campo, valor);
  };

  const handleFullEdit = (dados: Partial<Projeto>) => {
    if (onEditFull && editingProjeto) {
      onEditFull(editingProjeto.id, dados, currentUserName);
      setEditingProjeto(null);
    }
  };

  const handleInativar = () => {
    if (onInativar && inativandoProjeto) {
      onInativar(inativandoProjeto.id, currentUserName);
      setInativandoProjeto(null);
    }
  };

  return (
    <>
      {/* Modal de Edição */}
      {editingProjeto && (
        <EditProjetoModal
          projeto={editingProjeto}
          responsaveis={responsaveis}
          onSave={handleFullEdit}
          onCancel={() => setEditingProjeto(null)}
        />
      )}

      {/* Modal de Confirmação de Inativação */}
      {inativandoProjeto && (
        <ConfirmInativarModal
          projeto={inativandoProjeto}
          onConfirm={handleInativar}
          onCancel={() => setInativandoProjeto(null)}
        />
      )}

      {/* Modal de Visualização de Detalhes */}
      {viewingProjeto && (
        <ViewProjetoModal
          projeto={viewingProjeto}
          onClose={() => setViewingProjeto(null)}
        />
      )}

    {/* ===== Barra de Filtros ===== */}
    <div className="mb-4" style={{ backgroundColor: '#1a1d21', borderRadius: '12px', border: '1px solid #333', padding: '12px 16px' }}>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Busca */}
        <div className="relative flex-1" style={{ minWidth: '220px', maxWidth: '360px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
          <input
            type="text"
            placeholder="Buscar projeto, responsável, time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '34px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              backgroundColor: '#212529',
              border: '1px solid #444',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Toggle filtros */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 transition-colors"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: `1px solid ${activeFiltersCount > 0 ? '#FF6600' : '#444'}`,
            backgroundColor: activeFiltersCount > 0 ? 'rgba(255,102,0,0.1)' : 'transparent',
            color: activeFiltersCount > 0 ? '#FF8533' : '#ADB5BD',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <Filter size={14} />
          Filtros
          {activeFiltersCount > 0 && (
            <span style={{
              backgroundColor: '#FF6600',
              color: '#fff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Limpar filtros */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #444',
              backgroundColor: 'transparent',
              color: '#EF4444',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Limpar filtros
          </button>
        )}

        {/* Contador de resultados */}
        <span style={{ color: '#6c757d', fontSize: '0.78rem', marginLeft: 'auto' }}>
          {projetosFiltradosLocais.length} de {projetos.length} projetos
        </span>
      </div>

      {/* Painel de filtros expandido */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3" style={{ borderTop: '1px solid #333' }}>
          <div>
            <label style={{ color: '#6c757d', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', backgroundColor: '#212529', border: '1px solid #444', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Todos">Todos</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label style={{ color: '#6c757d', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Tendência</label>
            <select
              value={filterTendencia}
              onChange={(e) => setFilterTendencia(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', backgroundColor: '#212529', border: '1px solid #444', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Todos">Todos</option>
              <option value="Subir">Subir</option>
              <option value="Descer">Descer</option>
            </select>
          </div>
          <div>
            <label style={{ color: '#6c757d', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Situação</label>
            <select
              value={filterSituacao}
              onChange={(e) => setFilterSituacao(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', backgroundColor: '#212529', border: '1px solid #444', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Todos">Todos</option>
              <option value="verde">No Prazo</option>
              <option value="amarelo">Atenção</option>
              <option value="vermelho">Crítico</option>
            </select>
          </div>
          <div>
            <label style={{ color: '#6c757d', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Time</label>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', backgroundColor: '#212529', border: '1px solid #444', borderRadius: '8px', color: '#F8FAFC', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Todos">Todos</option>
              {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>

    <div
      className="rounded-lg projetos-scroll"
      style={{
        border: '1px solid #333',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <table className="w-full text-sm" style={{ minWidth: '1750px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1a1d21', borderBottom: '2px solid #FF6600' }}>
            {[
              { label: 'Projeto', key: 'projeto' },
              { label: 'Objetivo', key: '' },
              { label: 'Início', key: '' },
              { label: 'Fim', key: 'prazoFinal' },
              { label: 'Situação', key: '' },
              { label: 'Time / Responsável', key: 'time' },
              { label: 'Indicador | KR', key: '' },
              { label: 'Tendência', key: '' },
              { label: 'Data Aferição', key: '' },
              { label: 'Custo', key: '' },
              { label: 'Resultado Esperado', key: '' },
              { label: 'Resultado Atingido', key: '' },
              { label: '% Atingimento', key: 'atingimento' },
              { label: 'Progresso', key: 'progresso' },
              { label: 'Status', key: 'status' },
              { label: 'Ações', key: '' },
            ].map((header) => (
              <th
                key={header.label}
                className={`px-3 py-3 text-left whitespace-nowrap ${header.key ? 'cursor-pointer select-none hover:bg-white/5' : ''}`}
                style={{
                  color: sortColumn === header.key && header.key ? '#FF8533' : '#ADB5BD',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  transition: 'color 0.15s',
                }}
                onClick={() => header.key && handleSort(header.key)}
              >
                <div className="flex items-center gap-1">
                  {header.label}
                  {header.key && sortColumn === header.key && (
                    sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projetosFiltradosLocais.map((projeto, idx) => (
            <tr
              key={projeto.id}
              className="transition-colors duration-150 hover:bg-white/5"
              style={{
                backgroundColor: idx % 2 === 0 ? '#212529' : '#1a1d21',
                borderBottom: '1px solid #333',
              }}
            >
              {/* Projeto */}
              <td className="px-3 py-3" style={{ color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 500, maxWidth: '200px' }}>
                <div className="truncate" title={projeto.projeto}>{projeto.projeto}</div>
              </td>
              {/* Objetivo */}
              <td className="px-3 py-3" style={{ color: '#94A3B8', fontSize: '0.78rem', maxWidth: '220px' }}>
                <div className="truncate" title={projeto.objetivo}>{projeto.objetivo}</div>
              </td>
              {/* Início */}
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {formatarData(projeto.dataInicio)}
              </td>
              {/* Fim */}
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {formatarData(projeto.prazoFinal)}
              </td>
              {/* Situação (cumprimento do prazo) */}
              <td className="px-3 py-3 whitespace-nowrap">
                <SituacaoBadge situacao={projeto.situacao} />
              </td>
              {/* Time / Responsável */}
              <td className="px-3 py-3" style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                <div className="whitespace-nowrap font-medium" style={{ color: '#FF8533' }}>
                  {projeto.time}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  {projeto.responsavel}
                </div>
              </td>
              {/* Indicador | KR */}
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(255,102,0,0.15)', color: '#FF8533' }}>
                  {projeto.indicador}
                </span>
              </td>
              {/* Tendência */}
              <td className="px-3 py-3 whitespace-nowrap text-center" style={{ fontSize: '0.8rem' }}>
                <div className="flex items-center justify-center gap-1">
                  {projeto.tendencia === 'Subir' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <TrendingUp size={14} /> Subir
                    </span>
                  )}
                  {projeto.tendencia === 'Descer' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <TrendingDown size={14} /> Descer
                    </span>
                  )}
                </div>
              </td>
              {/* Data Aferição */}
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {formatarData(projeto.dataAfericao)}
              </td>
              {/* Custo */}
              <td className="px-3 py-3 whitespace-nowrap text-center" style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                {formatarMoeda(projeto.custo)}
              </td>
              {/* Resultado Esperado */}
              <td className="px-3 py-3 whitespace-nowrap text-center" style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                {projeto.resultadoEsperado}
              </td>
              {/* Resultado Atingido - Editável */}
              <td className="px-3 py-3 whitespace-nowrap" style={{ fontSize: '0.8rem' }}>
                <EditableCell
                  value={projeto.resultadoAtingido}
                  projetoId={projeto.id}
                  campo="resultadoAtingido"
                  onSave={handleEdit}
                />
              </td>
              {/* % Atingimento */}
              <td className="px-3 py-3 whitespace-nowrap text-center" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ color: getStatusColor(projeto.situacao) }}>
                  {formatarPercentual(projeto.percentualAtingimento)}
                </span>
              </td>
              {/* Progresso - Editável */}
              <td className="px-3 py-3" style={{ minWidth: '130px' }}>
                <EditableProgressCell
                  value={projeto.progresso}
                  projetoId={projeto.id}
                  onSave={handleEdit}
                />
              </td>
              {/* Status */}
              <td className="px-3 py-3 whitespace-nowrap">
                <StatusBadge status={projeto.status} />
              </td>
              {/* Coluna de Ações */}
              <td className="px-3 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingProjeto(projeto)}
                    className="p-1.5 rounded transition-all hover:bg-blue-900/30"
                    title="Ver Detalhes"
                    style={{ border: '1px solid #444' }}
                  >
                    <Eye size={15} color="#3B82F6" />
                  </button>
                  <button
                    onClick={() => setEditingProjeto(projeto)}
                    className="p-1.5 rounded transition-all hover:bg-orange-900/30"
                    title="Editar Projeto"
                    style={{ border: '1px solid #444' }}
                  >
                    <Pencil size={15} color="#FF9500" />
                  </button>
                  <button
                    onClick={() => setInativandoProjeto(projeto)}
                    className="p-1.5 rounded transition-all hover:bg-red-900/30"
                    title="Inativar Projeto"
                    style={{ border: '1px solid #444' }}
                    disabled={projeto.status === 'Inativo'}
                  >
                    <Ban size={15} color={projeto.status === 'Inativo' ? '#555' : '#EF4444'} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default TabelaProjetos;
