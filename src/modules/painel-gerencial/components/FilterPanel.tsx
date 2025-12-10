import React from 'react';
import { Filter } from 'lucide-react';
import SingleSelect from './SingleSelect';

interface FilterPanelProps {
  competencias: string[];
  selectedCompetencia: string;
  onCompetenciaChange: (competencia: string) => void;
  onRefresh: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  competencias,
  selectedCompetencia,
  onCompetenciaChange,
  onRefresh
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Título da seção de filtros */}
      <div 
        className="flex items-center gap-2"
        style={{ marginBottom: '8px' }}
      >
        <Filter size={18} className="text-primary-500" />
        <span 
          className="text-sm font-semibold uppercase tracking-wide text-text-secondary"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Filtros
        </span>
      </div>

      {/* Competência com SingleSelect */}
      <SingleSelect
        label="Competência"
        options={competencias}
        selectedValue={selectedCompetencia}
        onChange={onCompetenciaChange}
        placeholder="Selecione uma competência..."
      />
    </div>
  );
};

export default FilterPanel;
