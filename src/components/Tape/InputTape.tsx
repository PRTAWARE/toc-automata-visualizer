import React from 'react';
import { ArrowDown, Check, Disc } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';

export const InputTape: React.FC = () => {
  const { inputString, activeStepIndex, simulationResult } = useAutomata();

  const chars = inputString.split('');
  const totalSymbols = chars.length;
  // Step 0 = start (0 symbols read), Step k = symbol at index k-1 read
  const currentReadIndex = activeStepIndex - 1;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Input Tape & Head Position
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Step <span className="text-cyan-400 font-bold">{activeStepIndex}</span> / {simulationResult?.steps.length ? simulationResult.steps.length - 1 : 0}
          {totalSymbols > 0 && (
            <span className="text-slate-500 ml-2">
              ({Math.round((Math.max(0, currentReadIndex + 1) / totalSymbols) * 100)}% processed)
            </span>
          )}
        </div>
      </div>

      {/* Tape Strip Container */}
      <div className="relative pt-6 pb-2 px-4 flex items-center justify-center overflow-x-auto min-h-[90px]">
        {totalSymbols === 0 ? (
          // Empty string ε case
          <div className="flex flex-col items-center">
            <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1 mb-1">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>Tape Head</span>
            </div>
            <div className="px-5 py-3 rounded-xl border-2 border-cyan-400 bg-cyan-950/40 text-cyan-300 font-mono font-bold text-lg shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              ε (Empty String)
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Start marker */}
            <div className="px-2 py-3 rounded-lg border border-slate-800 bg-slate-950/50 text-[10px] font-mono text-slate-500 select-none">
              ├
            </div>

            {chars.map((char, index) => {
              const isConsumed = index < currentReadIndex;
              const isCurrent = index === currentReadIndex;

              return (
                <div key={index} className="relative flex flex-col items-center group">
                  {/* Tape Head Indicator Arrow */}
                  {isCurrent && (
                    <div className="absolute -top-7 flex flex-col items-center z-10">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider bg-slate-950 px-1.5 py-0.5 rounded border border-cyan-500/40 shadow-sm">
                        HEAD
                      </span>
                      <ArrowDown className="w-4 h-4 text-cyan-400 animate-bounce -mt-0.5" />
                    </div>
                  )}

                  {/* Tape Cell */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg transition-all duration-200 select-none ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.5)] scale-110 z-10'
                        : isConsumed
                        ? 'bg-slate-950/70 border border-slate-700/60 text-slate-400 scale-95 opacity-80'
                        : 'bg-slate-800/80 border border-slate-700 text-slate-100 hover:border-slate-500'
                    }`}
                  >
                    {char}

                    {/* Consumed Checkmark */}
                    {isConsumed && (
                      <span className="absolute bottom-1 right-1 text-emerald-400">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Index sublabel */}
                  <span className={`text-[10px] font-mono mt-1 ${isCurrent ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                    [{index}]
                  </span>
                </div>
              );
            })}

            {/* End marker */}
            <div className="px-2 py-3 rounded-lg border border-slate-800 bg-slate-950/50 text-[10px] font-mono text-slate-500 select-none">
              ┤
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
