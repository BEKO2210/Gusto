
import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-in fade-in duration-500">
      <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-light italic">GUSTO stellt Ihre Liste zusammen...</p>
    </div>
  );
};
