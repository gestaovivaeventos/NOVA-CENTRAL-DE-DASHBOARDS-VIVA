import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Carregando dados...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-700 rounded-full animate-spin border-t-primary"></div>
      </div>
      <p className="mt-4 text-slate-400">{message}</p>
    </div>
  );
};

export default Loading;
