/**
 * Filtro de Franquia
 * Dropdown para seleção de franquia
 */

import React from 'react';
import { MapPin } from 'lucide-react';

interface FiltroFranquiaProps {
  franquiaSelecionada: string;
  onFranquiaChange: (franquia: string) => void;
  fullWidth?: boolean;
}

// Lista de franquias disponíveis (baseada na planilha FLUXO PROJETADO)
const franquias = [
  'Barbacena',
  'Belo Horizonte',
  'Cacoal',
  'Campo Grande',
  'Campos',
  'Cascavel',
  'Contagem',
  'Cuiabá',
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
  'Uberlândia',
  'Vitória',
  'Volta Redonda - VivaMixx',
];

export default function FiltroFranquia({ franquiaSelecionada, onFranquiaChange, fullWidth = false }: FiltroFranquiaProps) {
  return (
    <div className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''}`}>
      <div className={`flex items-center gap-2 px-3 py-2 bg-[#252830] border border-gray-700 rounded-lg ${fullWidth ? 'w-full' : ''}`}>
        <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
        {!fullWidth && <span className="text-xs text-gray-400 font-medium">Franquia:</span>}
        <select
          value={franquiaSelecionada}
          onChange={(e) => onFranquiaChange(e.target.value)}
          className={`bg-transparent text-sm text-white font-semibold focus:outline-none cursor-pointer ${fullWidth ? 'flex-1' : 'pr-2'} ${!franquiaSelecionada ? 'text-gray-400' : ''}`}
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
