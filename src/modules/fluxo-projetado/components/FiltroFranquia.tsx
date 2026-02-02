/**
 * Filtro de Franquia
 * Dropdown para seleção de franquia
 * Respeita o nível de acesso do usuário
 */

import React, { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface FiltroFranquiaProps {
  franquiaSelecionada: string;
  onFranquiaChange: (franquia: string) => void;
  fullWidth?: boolean;
}

// Lista completa de franquias disponíveis (baseada na planilha FLUXO PROJETADO)
const todasFranquias = [
  'Barbacena',
  'Belo Horizonte',
  'Cacoal',
  'Campo Grande',
  'Campos',
  'Cascavel',
  'Contagem',
  'Cuiaba',
  'Curitiba',
  'Divinópolis',
  'Florianópolis',
  'Fortaleza',
  'Governador Valadares',
  'Ipatinga',
  'Itaperuna Muriae',
  'João Pessoa',
  'Juiz de Fora',
  'Lavras',
  'Linhares',
  'Londrina',
  'Montes Claros',
  'Palmas',
  'Passos',
  'Petropolis',
  'Pocos de Caldas',
  'Porto Alegre',
  'Porto Velho',
  'Pouso Alegre',
  'Recife',
  'Região dos Lagos',
  'Rio Branco',
  'Rio de Janeiro',
  'Salvador',
  'São Luís',
  'Sao Paulo',
  'Uba',
  'Uberlândia',
  'Vitória',
  'Volta Redonda - VivaMixx',
];

export default function FiltroFranquia({ franquiaSelecionada, onFranquiaChange, fullWidth = false }: FiltroFranquiaProps) {
  const { user } = useAuth();
  
  // Franqueado (accessLevel = 0) só pode ver sua própria unidade
  const isFranqueado = user?.accessLevel === 0;
  const franquias = isFranqueado && user?.unitPrincipal 
    ? [user.unitPrincipal] 
    : todasFranquias;
  
  // Auto-selecionar a franquia do usuário se for franqueado
  useEffect(() => {
    if (isFranqueado && user?.unitPrincipal && !franquiaSelecionada) {
      onFranquiaChange(user.unitPrincipal);
    }
  }, [isFranqueado, user?.unitPrincipal, franquiaSelecionada, onFranquiaChange]);
  
  return (
    <div className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''}`}>
      <div className={`flex items-center gap-2 px-3 py-2 bg-[#252830] border border-gray-700 rounded-lg overflow-hidden ${fullWidth ? 'w-full' : ''}`}>
        <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
        {!fullWidth && <span className="text-xs text-gray-400 font-medium">Franquia:</span>}
        <select
          value={franquiaSelecionada}
          onChange={(e) => onFranquiaChange(e.target.value)}
          className={`bg-transparent text-sm text-white font-semibold focus:outline-none cursor-pointer min-w-0 ${fullWidth ? 'flex-1 w-full' : 'pr-2'} ${!franquiaSelecionada ? 'text-gray-400' : ''}`}
          style={{ maxWidth: 'calc(100% - 24px)' }}
        >
          <option value="" className="bg-[#1e2028] text-gray-400">
            Selecione uma franquia
          </option>
          {franquias.map((franquia) => (
            <option key={franquia} value={franquia} className="bg-[#1e2028] text-white">
              {franquia}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
