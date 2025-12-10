'use client';

import React from 'react';

export const Loader: React.FC<{ message?: string }> = ({ message = 'Carregando dados...' }) => {
  return (
    <div className="loader">
      <p>{message}</p>
    </div>
  );
};

export default Loader;
