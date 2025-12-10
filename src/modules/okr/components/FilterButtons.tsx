import React from 'react';

interface FilterButtonsProps {
  items: string[];
  activeItem: string;
  onSelect: (item: string) => void;
  label?: string;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  items,
  activeItem,
  onSelect,
  label,
}) => {
  return (
    <div className="flex items-center gap-4">
      {label && (
        <span className="text-text-secondary text-sm font-medium uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="flex gap-2 flex-wrap">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={`filter-btn ${activeItem === item ? 'active' : ''}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

interface ObjetivoFilterProps {
  objetivos: Map<string, string>;
  activeObjetivo: string;
  onSelect: (id: string) => void;
}

export const ObjetivoFilter: React.FC<ObjetivoFilterProps> = ({
  objetivos,
  activeObjetivo,
  onSelect,
}) => {
  const sortedObjetivos = Array.from(objetivos.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const activeObjetivoName = objetivos.get(activeObjetivo) || '';

  if (sortedObjetivos.length === 0) {
    return (
      <p className="text-text-secondary text-sm">
        Nenhum objetivo para este time/quarter
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex gap-2 flex-wrap">
        {sortedObjetivos.map(([id, name]) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`filter-btn ${activeObjetivo === id ? 'active' : ''}`}
            title={name}
          >
            {id}
          </button>
        ))}
      </div>
      {activeObjetivoName && (
        <span className="text-accent text-sm font-medium italic max-w-md truncate">
          {activeObjetivoName}
        </span>
      )}
    </div>
  );
};

export default FilterButtons;
