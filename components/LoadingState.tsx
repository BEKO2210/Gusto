
import React from 'react';

const CELLS: { c: string; r: string }[] = [
  { c: 'center-gel', r: '' },
  { c: 'c1', r: 'r1' }, { c: 'c2', r: 'r1' }, { c: 'c3', r: 'r1' },
  { c: 'c4', r: 'r1' }, { c: 'c5', r: 'r1' }, { c: 'c6', r: 'r1' },
  { c: 'c7', r: 'r2' }, { c: 'c8', r: 'r2' }, { c: 'c9', r: 'r2' },
  { c: 'c10', r: 'r2' }, { c: 'c11', r: 'r2' }, { c: 'c12', r: 'r2' },
  { c: 'c13', r: 'r2' }, { c: 'c14', r: 'r2' }, { c: 'c15', r: 'r2' },
  { c: 'c16', r: 'r2' }, { c: 'c17', r: 'r2' }, { c: 'c18', r: 'r2' },
  { c: 'c19', r: 'r3' }, { c: 'c20', r: 'r3' }, { c: 'c21', r: 'r3' },
  { c: 'c22', r: 'r3' }, { c: 'c23', r: 'r3' }, { c: 'c24', r: 'r3' },
  { c: 'c25', r: 'r3' }, { c: 'c26', r: 'r3' }, { c: 'c28', r: 'r3' },
  { c: 'c29', r: 'r3' }, { c: 'c30', r: 'r3' }, { c: 'c31', r: 'r3' },
  { c: 'c32', r: 'r3' }, { c: 'c33', r: 'r3' }, { c: 'c34', r: 'r3' },
  { c: 'c35', r: 'r3' }, { c: 'c36', r: 'r3' }, { c: 'c37', r: 'r3' },
];

export const LoadingState: React.FC = () => {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 sm:py-20 space-y-10"
      role="status"
      aria-live="polite"
      aria-label="Liste wird erstellt"
    >
      <div className="gusto-loader" aria-hidden="true">
        <div className="socket">
          {CELLS.map(({ c, r }) => (
            <div key={c} className={`gel ${c}${r ? ` ${r}` : ''}`}>
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-neutral-500 font-light italic text-sm sm:text-base text-center px-6">
        GUSTO stellt Ihre Liste zusammen…
      </p>
    </div>
  );
};
