/**
 * Tabela de Acompanhamento de Projetos
 * Com edição inline, modal de edição completa e confirmação de inativação
 */

import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, Ban, AlertTriangle } from 'lucide-react';
import { Projeto } from '../types';
import { formatarPercentual, formatarData, getProjetoStatusStyle, getStatusColor } from '../utils';
import { TIMES_OPTIONS, INDICADORES_OPTIONS, TENDENCIA_OPTIONS } from '../config/app.config';

interface TabelaProjetosProps {
  projetos: Projeto[];
  onEdit?: (id: string, campo: 'resultadoAtingido' | 'progresso', valor: number) => void;
  onEditFull?: (id: string, dados: Partial<Projeto>) => void;
  onInativar?: (id: string) => void;
  responsaveis?: string[];
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
    esforcoEstimado: projeto.esforcoEstimado,
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
                <option value="Passado">Passado</option>
                <option value="Finalizado">Finalizado</option>
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
              <label style={labelStyle}>Esforço Estimado</label>
              <select name="esforcoEstimado" value={form.esforcoEstimado} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="Baixo">Baixo</option>
                <option value="Médio">Médio</option>
                <option value="Alto">Alto</option>
                <option value="Muito Alto">Muito Alto</option>
              </select>
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

/* ===== Componente principal ===== */
export const TabelaProjetos: React.FC<TabelaProjetosProps> = ({ projetos, onEdit, onEditFull, onInativar, responsaveis = [] }) => {
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [inativandoProjeto, setInativandoProjeto] = useState<Projeto | null>(null);

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
      onEditFull(editingProjeto.id, dados);
      setEditingProjeto(null);
    }
  };

  const handleInativar = () => {
    if (onInativar && inativandoProjeto) {
      onInativar(inativandoProjeto.id);
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
              'Criado por',
              'Time / Responsável',
              'Projeto',
              'Data Início',
              'Prazo Final',
              'Indicador | KR',
              'Objetivo',
              'Esforço Estimado',
              'Data Aferição',
              'Resultado Esperado',
              'Resultado Atingido',
              '% Atingimento',
              'Progresso',
              'Situação',
              'Status',
              'Ações',
            ].map((header) => (
              <th
                key={header}
                className="px-3 py-3 text-left whitespace-nowrap"
                style={{
                  color: '#ADB5BD',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projetos.map((projeto, idx) => (
            <tr
              key={projeto.id}
              className="transition-colors duration-150 hover:bg-white/5"
              style={{
                backgroundColor: idx % 2 === 0 ? '#212529' : '#1a1d21',
                borderBottom: '1px solid #333',
              }}
            >
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                {projeto.criadoPor}
              </td>
              <td className="px-3 py-3" style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                <div className="whitespace-nowrap font-medium" style={{ color: '#FF8533' }}>
                  {projeto.time}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                  {projeto.responsavel}
                </div>
              </td>
              <td className="px-3 py-3" style={{ color: '#F8FAFC', fontSize: '0.8rem', fontWeight: 500, maxWidth: '200px' }}>
                <div className="truncate" title={projeto.projeto}>{projeto.projeto}</div>
              </td>
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {formatarData(projeto.dataInicio)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {formatarData(projeto.prazoFinal)}
              </td>
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(255,102,0,0.15)', color: '#FF8533' }}>
                  {projeto.indicador}
                </span>
              </td>
              <td className="px-3 py-3" style={{ color: '#94A3B8', fontSize: '0.78rem', maxWidth: '220px' }}>
                <div className="truncate" title={projeto.objetivo}>{projeto.objetivo}</div>
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-center" style={{ color: '#ADB5BD', fontSize: '0.8rem' }}>
                {projeto.esforcoEstimado}
              </td>
              <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                {formatarData(projeto.dataAfericao)}
              </td>
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
              <td className="px-3 py-3 whitespace-nowrap">
                <SituacaoBadge situacao={projeto.situacao} />
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <StatusBadge status={projeto.status} />
              </td>
              {/* Coluna de Ações */}
              <td className="px-3 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
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
