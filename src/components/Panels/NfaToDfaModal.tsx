import React, { useMemo } from 'react';
import { X, Wand2, Download } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import { convertNfaToDfa } from '../../simulation/converter';

interface NfaToDfaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NfaToDfaModal: React.FC<NfaToDfaModalProps> = ({ isOpen, onClose }) => {
  const { automaton, loadConvertedDfa } = useAutomata();

  const conversionResult = useMemo(() => {
    if (!isOpen) return null;
    return convertNfaToDfa(automaton);
  }, [automaton, isOpen]);

  if (!isOpen) return null;

  const hasError = conversionResult && 'error' in conversionResult;

  const handleLoadIntoStudio = () => {
    if (conversionResult && !('error' in conversionResult)) {
      loadConvertedDfa(conversionResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>NFA to DFA Conversion</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  Subset Construction Algorithm
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Transforms non-deterministic state sets into equivalent single deterministic states
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {hasError ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-sm font-mono">
              {conversionResult.error}
            </div>
          ) : conversionResult ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Original {automaton.type}</span>
                  <p className="text-lg font-bold font-mono text-indigo-300 mt-0.5">
                    {automaton.states.length} States
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Generated DFA</span>
                  <p className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                    {conversionResult.automaton.states.length} States
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accepting Subsets</span>
                  <p className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
                    {conversionResult.automaton.states.filter(s => s.isFinal).length} States
                  </p>
                </div>
              </div>

              {/* Subset Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  DFA Transition Table & Subset Map
                </h4>
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">DFA State</th>
                        <th className="py-2.5 px-3 font-semibold">NFA Subset</th>
                        {automaton.alphabet.map(sym => (
                          <th key={sym} className="py-2.5 px-3 font-semibold text-center text-indigo-300">
                            δ(Subset, '{sym}')
                          </th>
                        ))}
                        <th className="py-2.5 px-3 font-semibold text-center">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {conversionResult.steps.map((step, idx) => {
                        const dfaState = conversionResult.automaton.states[idx];
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-slate-200">
                              <span className="text-amber-400 mr-1">
                                {step.isStart && step.isFinal ? '→ *' : step.isStart ? '→' : step.isFinal ? '*' : ''}
                              </span>
                              {dfaState?.id || `Q${idx}`}
                            </td>

                            <td className="py-2.5 px-3 text-cyan-300 font-semibold">
                              {step.subsetName}
                            </td>

                            {automaton.alphabet.map(sym => {
                              const targets = step.transitions[sym] || [];
                              const labels = targets
                                .map(id => automaton.states.find(s => s.id === id)?.label || id)
                                .sort();
                              const targetStr = labels.length > 0 ? `{ ${labels.join(', ')} }` : '∅ (Trap)';
                              return (
                                <td key={sym} className="py-2.5 px-3 text-center text-slate-300">
                                  {targetStr}
                                </td>
                              );
                            })}

                            <td className="py-2.5 px-3 text-center">
                              {step.isFinal ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                                  ACCEPTING
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Non-final</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <span className="text-xs text-slate-400 font-mono">
            Subset construction preserves identical language recognition: L(DFA) = L(NFA).
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleLoadIntoStudio}
              disabled={hasError || !conversionResult}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              Load DFA into Studio Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
