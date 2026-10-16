import React from 'react';
import { Table } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import { EPSILON } from '../../types/automata';

export const TransitionTable: React.FC = () => {
  const { automaton, activeStepIndex, simulationResult } = useAutomata();

  const isENFA = automaton.type === 'ENFA';
  const symbols = [...automaton.alphabet];
  if (isENFA && !symbols.includes(EPSILON)) {
    symbols.push(EPSILON);
  }

  const currentStep = simulationResult?.steps[activeStepIndex];
  const activeTransitions = currentStep?.activeTransitions || [];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Transition Table δ(State, Symbol)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
          Type: {automaton.type}
        </span>
      </div>

      {automaton.states.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">
          No states defined. Add states to view transition matrix.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">
                  State
                </th>
                {symbols.map(sym => (
                  <th key={sym} className="py-2.5 px-3 font-semibold text-center uppercase tracking-wider text-indigo-300">
                    {sym}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {automaton.states.map(state => {
                const isStart = state.isStart;
                const isFinal = state.isFinal;
                const isCurrentActive = currentStep?.activeStates.includes(state.id);

                return (
                  <tr
                    key={state.id}
                    className={`transition-colors ${
                      isCurrentActive
                        ? 'bg-cyan-950/30'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* State Row Header */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="w-5 text-amber-400">
                          {isStart && isFinal ? '→ *' : isStart ? '→' : isFinal ? '*' : ''}
                        </span>
                        <span className={isCurrentActive ? 'text-cyan-300 font-extrabold' : 'text-slate-100'}>
                          {state.label}
                        </span>
                      </div>
                    </td>

                    {/* Symbol Columns */}
                    {symbols.map(sym => {
                      const transitions = automaton.transitions.filter(
                        t => t.from === state.id && t.symbol === sym
                      );

                      const isTransitionActive = transitions.some(t =>
                        activeTransitions.includes(t.id)
                      );

                      const destinations = transitions.map(
                        t => automaton.states.find(s => s.id === t.to)?.label || t.to
                      );

                      let cellText = '—';
                      if (automaton.type === 'DFA') {
                        cellText = destinations.length > 0 ? destinations[0] : '—';
                      } else {
                        cellText = destinations.length > 0 ? `{ ${destinations.join(', ')} }` : '∅';
                      }

                      return (
                        <td
                          key={sym}
                          className={`py-2 px-3 text-center transition-all ${
                            isTransitionActive
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold border-2 border-cyan-400/80 rounded shadow-[inset_0_0_8px_rgba(34,211,238,0.4)]'
                              : 'text-slate-300'
                          }`}
                        >
                          {cellText}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend Footer */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="text-amber-400 font-bold">→</span> Start State
        </span>
        <span className="flex items-center gap-1">
          <span className="text-amber-400 font-bold">*</span> Final (Accepting) State
        </span>
      </div>
    </div>
  );
};
