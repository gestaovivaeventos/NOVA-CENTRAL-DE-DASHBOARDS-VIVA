/**
 * Componente compartilhado: seção de eixo de acesso (Franqueadora / Franquia).
 * Usado tanto em EditModuloModal quanto em AddExternalLinkModal para manter
 * paridade visual e funcional entre edição e criação de módulos.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, Check, ChevronDown } from 'lucide-react';
import type { AcessoEixo } from '../types';

export interface UsuarioEixo {
  username: string;
  name: string;
  accessLevel: number;
  setor: string;
  nmGrupo: string;
}

export interface EixoAcessoSectionProps {
  titulo: string;
  descricao: string;
  cor: string;
  eixo: AcessoEixo;
  setEixo: (v: AcessoEixo) => void;
  setoresSelecionados: string[];
  setSetoresSelecionados: (v: string[]) => void;
  gruposSelecionados: string[];
  setGruposSelecionados: (v: string[]) => void;
  usuariosSelecionados: string[];
  setUsuariosSelecionados: (v: string[]) => void;
  usuariosDisponiveis: UsuarioEixo[];
}

export default function EixoAcessoSection({
  titulo,
  descricao,
  cor,
  eixo,
  setEixo,
  setoresSelecionados,
  setSetoresSelecionados,
  gruposSelecionados,
  setGruposSelecionados,
  usuariosSelecionados,
  setUsuariosSelecionados,
  usuariosDisponiveis,
}: EixoAcessoSectionProps) {
  const [openSetor, setOpenSetor] = useState(false);
  const [openGrupo, setOpenGrupo] = useState(false);
  const [openUsuario, setOpenUsuario] = useState(false);
  const [searchSetor, setSearchSetor] = useState('');
  const [searchGrupo, setSearchGrupo] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const setorRef = useRef<HTMLDivElement>(null);
  const grupoRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (setorRef.current && !setorRef.current.contains(e.target as Node)) setOpenSetor(false);
      if (grupoRef.current && !grupoRef.current.contains(e.target as Node)) setOpenGrupo(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setOpenUsuario(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const setoresPool = useMemo(() => {
    const s = new Set<string>();
    usuariosDisponiveis.forEach(u => { if (u.setor) s.add(u.setor); });
    return Array.from(s).sort();
  }, [usuariosDisponiveis]);

  const gruposPool = useMemo(() => {
    const s = new Set<string>();
    const base = setoresSelecionados.length > 0
      ? usuariosDisponiveis.filter(u => setoresSelecionados.includes(u.setor))
      : usuariosDisponiveis;
    base.forEach(u => { if (u.nmGrupo) s.add(u.nmGrupo); });
    return Array.from(s).sort();
  }, [usuariosDisponiveis, setoresSelecionados]);

  const usuariosPool = useMemo(() => {
    let base = usuariosDisponiveis;
    if (setoresSelecionados.length > 0) base = base.filter(u => setoresSelecionados.includes(u.setor));
    if (gruposSelecionados.length > 0) base = base.filter(u => gruposSelecionados.includes(u.nmGrupo));
    return [...base].sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username));
  }, [usuariosDisponiveis, setoresSelecionados, gruposSelecionados]);

  const toggleItem = (arr: string[], setter: (v: string[]) => void, val: string) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const toggleSetor = (s: string) => {
    const next = setoresSelecionados.includes(s)
      ? setoresSelecionados.filter(x => x !== s)
      : [...setoresSelecionados, s];
    setSetoresSelecionados(next);
    if (next.length > 0) {
      const gruposValidos = new Set<string>();
      usuariosDisponiveis.filter(u => next.includes(u.setor)).forEach(u => { if (u.nmGrupo) gruposValidos.add(u.nmGrupo); });
      setGruposSelecionados(gruposSelecionados.filter(g => gruposValidos.has(g)));
      const usersValidos = new Set<string>();
      usuariosDisponiveis.filter(u => next.includes(u.setor)).forEach(u => usersValidos.add(u.username));
      setUsuariosSelecionados(usuariosSelecionados.filter(u => usersValidos.has(u)));
    }
  };

  const toggleGrupo = (g: string) => {
    const next = gruposSelecionados.includes(g)
      ? gruposSelecionados.filter(x => x !== g)
      : [...gruposSelecionados, g];
    setGruposSelecionados(next);
    if (next.length > 0) {
      const usersValidos = new Set<string>();
      let base = usuariosDisponiveis;
      if (setoresSelecionados.length > 0) base = base.filter(u => setoresSelecionados.includes(u.setor));
      base.filter(u => next.includes(u.nmGrupo)).forEach(u => usersValidos.add(u.username));
      setUsuariosSelecionados(usuariosSelecionados.filter(u => usersValidos.has(u)));
    }
  };

  const opcoes: { v: AcessoEixo; label: string; sub: string; cor: string }[] = [
    { v: 'geral',      label: 'Geral',       sub: 'Todos os usuários deste eixo',        cor: '#10b981' },
    { v: 'sem_acesso', label: 'Sem acesso',  sub: 'Nenhum usuário deste eixo',           cor: '#ef4444' },
    { v: 'restrito',   label: 'Restrito',    sub: 'Filtrar por setor, grupo ou usuário', cor: '#f59e0b' },
  ];

  return (
    <div
      style={{
        marginBottom: '24px',
        padding: '16px',
        border: `1px solid ${cor}40`,
        borderRadius: '10px',
        background: `${cor}0D`,
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: 0, color: cor, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {titulo}
        </h4>
        <p style={{ margin: '4px 0 0', color: '#adb5bd', fontSize: '0.75rem' }}>{descricao}</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {opcoes.map(opt => {
          const active = eixo === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => setEixo(opt.v)}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '10px 12px',
                border: `1px solid ${active ? opt.cor : '#444'}`,
                background: active ? `${opt.cor}20` : '#1a1d21',
                color: active ? opt.cor : '#adb5bd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{opt.label}</div>
              <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.85 }}>{opt.sub}</div>
            </button>
          );
        })}
      </div>

      {eixo === 'restrito' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Setores */}
          <div ref={setorRef} style={{ position: 'relative' }}>
            <label style={{ ...labelStyle, marginBottom: '6px' }}>
              Setores {setoresSelecionados.length > 0 && <span style={{ color: cor }}>({setoresSelecionados.length} selecionados)</span>}
            </label>
            <button
              type="button"
              onClick={() => setOpenSetor(o => !o)}
              style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <span style={{ color: setoresSelecionados.length ? '#F8F9FA' : '#6c757d' }}>
                {setoresSelecionados.length ? `${setoresSelecionados.length} setor(es) selecionado(s)` : 'Todos os setores deste eixo'}
              </span>
              <ChevronDown size={16} />
            </button>
            {setoresSelecionados.length > 0 && (
              <div style={chipsContainerStyle}>
                {setoresSelecionados.map(s => (
                  <span key={s} style={chipStyle(cor)}>
                    {s}
                    <button type="button" onClick={() => toggleSetor(s)} style={chipRemoveBtnStyle} title="Remover">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {openSetor && (
              <div style={dropdownStyle}>
                <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f1114', padding: '6px 8px', borderRadius: '6px' }}>
                    <Search size={14} color="#6c757d" />
                    <input
                      value={searchSetor}
                      onChange={e => setSearchSetor(e.target.value)}
                      placeholder="Buscar setor..."
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8F9FA', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {setoresPool.filter(s => s.toLowerCase().includes(searchSetor.toLowerCase())).map(s => {
                    const sel = setoresSelecionados.includes(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleSetor(s)} style={dropdownItemStyle(sel, cor)}>
                        <span>{s}</span>
                        {sel && <Check size={14} color={cor} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Grupos / Cargos */}
          <div ref={grupoRef} style={{ position: 'relative' }}>
            <label style={{ ...labelStyle, marginBottom: '6px' }}>
              Grupos / Cargos {gruposSelecionados.length > 0 && <span style={{ color: cor }}>({gruposSelecionados.length} selecionados)</span>}
            </label>
            <button
              type="button"
              onClick={() => setOpenGrupo(o => !o)}
              style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <span style={{ color: gruposSelecionados.length ? '#F8F9FA' : '#6c757d' }}>
                {gruposSelecionados.length ? `${gruposSelecionados.length} grupo(s)/cargo(s) selecionado(s)` : 'Todos os grupos/cargos'}
              </span>
              <ChevronDown size={16} />
            </button>
            {gruposSelecionados.length > 0 && (
              <div style={chipsContainerStyle}>
                {gruposSelecionados.map(g => (
                  <span key={g} style={chipStyle(cor)}>
                    {g}
                    <button type="button" onClick={() => toggleGrupo(g)} style={chipRemoveBtnStyle} title="Remover">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {openGrupo && (
              <div style={dropdownStyle}>
                <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f1114', padding: '6px 8px', borderRadius: '6px' }}>
                    <Search size={14} color="#6c757d" />
                    <input
                      value={searchGrupo}
                      onChange={e => setSearchGrupo(e.target.value)}
                      placeholder="Buscar grupo/cargo..."
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8F9FA', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {gruposPool.filter(g => g.toLowerCase().includes(searchGrupo.toLowerCase())).map(g => {
                    const sel = gruposSelecionados.includes(g);
                    return (
                      <button key={g} type="button" onClick={() => toggleGrupo(g)} style={dropdownItemStyle(sel, cor)}>
                        <span>{g}</span>
                        {sel && <Check size={14} color={cor} />}
                      </button>
                    );
                  })}
                  {gruposPool.length === 0 && (
                    <div style={{ padding: '12px', color: '#6c757d', fontSize: '0.8rem', textAlign: 'center' }}>Nenhum grupo disponível</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Usuários específicos */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <label style={{ ...labelStyle, marginBottom: '6px' }}>
              Usuários específicos {usuariosSelecionados.length > 0 && <span style={{ color: cor }}>({usuariosSelecionados.length} selecionados)</span>}
            </label>
            <button
              type="button"
              onClick={() => setOpenUsuario(o => !o)}
              style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <span style={{ color: usuariosSelecionados.length ? '#F8F9FA' : '#6c757d' }}>
                {usuariosSelecionados.length ? `${usuariosSelecionados.length} usuário(s) selecionado(s)` : 'Todos os usuários do filtro'}
              </span>
              <ChevronDown size={16} />
            </button>
            {usuariosSelecionados.length > 0 && (
              <div style={chipsContainerStyle}>
                {usuariosSelecionados.map(username => {
                  const u = usuariosDisponiveis.find(x => x.username === username);
                  const label = u ? (u.name || u.username) : username;
                  return (
                    <span key={username} style={chipStyle(cor)} title={u ? `@${u.username} · ${u.setor || 's/ setor'} · ${u.nmGrupo || 's/ grupo'}` : username}>
                      {label}
                      <button
                        type="button"
                        onClick={() => toggleItem(usuariosSelecionados, setUsuariosSelecionados, username)}
                        style={chipRemoveBtnStyle}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {openUsuario && (
              <div style={dropdownStyle}>
                <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f1114', padding: '6px 8px', borderRadius: '6px' }}>
                    <Search size={14} color="#6c757d" />
                    <input
                      value={searchUser}
                      onChange={e => setSearchUser(e.target.value)}
                      placeholder="Buscar usuário..."
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8F9FA', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {usuariosPool
                    .filter(u => (u.name || u.username).toLowerCase().includes(searchUser.toLowerCase()) || u.username.toLowerCase().includes(searchUser.toLowerCase()))
                    .map(u => {
                      const sel = usuariosSelecionados.includes(u.username);
                      return (
                        <button
                          key={u.username}
                          type="button"
                          onClick={() => toggleItem(usuariosSelecionados, setUsuariosSelecionados, u.username)}
                          style={dropdownItemStyle(sel, cor)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                            <span style={{ fontWeight: 600 }}>{u.name || u.username}</span>
                            <span style={{ fontSize: '0.7rem', color: '#6c757d' }}>@{u.username} · {u.setor || 's/ setor'} · {u.nmGrupo || 's/ grupo'}</span>
                          </div>
                          {sel && <Check size={14} color={cor} />}
                        </button>
                      );
                    })}
                  {usuariosPool.length === 0 && (
                    <div style={{ padding: '12px', color: '#6c757d', fontSize: '0.8rem', textAlign: 'center' }}>Nenhum usuário disponível</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#adb5bd',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'Poppins, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  flex: 1,
  padding: '10px 14px',
  backgroundColor: '#1a1d21',
  color: '#F8F9FA',
  border: '1px solid #444',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: '#1a1d21',
  border: '1px solid #444',
  borderRadius: '8px',
  zIndex: 50,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

const dropdownItemStyle = (selected: boolean, cor: string): React.CSSProperties => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '8px 12px',
  background: selected ? `${cor}15` : 'transparent',
  color: '#F8F9FA',
  border: 'none',
  borderBottom: '1px solid #2a2d31',
  cursor: 'pointer',
  fontFamily: 'Poppins, sans-serif',
  fontSize: '0.8rem',
  textAlign: 'left',
});

const chipsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '8px',
};

const chipStyle = (cor: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 4px 4px 10px',
  background: `${cor}20`,
  color: '#F8F9FA',
  border: `1px solid ${cor}60`,
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontFamily: 'Poppins, sans-serif',
  fontWeight: 500,
});

const chipRemoveBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '18px',
  height: '18px',
  padding: 0,
  background: 'rgba(0,0,0,0.3)',
  color: '#F8F9FA',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
};
