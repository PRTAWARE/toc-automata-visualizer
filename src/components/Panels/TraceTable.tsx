import React from 'react';
import { ListOrdered, PlayCircle } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';

export const TraceTable: React.FC = () => {
  const { simulationResult, activeStepIndex, jumpToStep, automaton } = useAutomata();

  if (!simulationResult) return null;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Execution Trace ({simulationResult.steps.length} Steps)
          </h4>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Click any step to inspect
        </span>
      </div>

      <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="sticky top-0 bg-slate-950/95 z-10 border-b border-slate-800">
            <tr className="text-slate-400">
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider w-14">
                Step
              </th>
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider w-20 text-center">
                Input
              </th>
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider w-28">
                {automaton.type === 'DFA' ? 'Current State' : 'Active State(s)'}
              </th>
              <th className="py-2 px-3 font-semibold uppercase tracking-wider">
                Explanation / Transition
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {simulationResult.steps.map((step) => {
              const isCurrent = step.stepIndex === activeStepIndex;
              const stateLabels = step.activeStates
                .map(id => automaton.states.find(s => s.id === id)?.label || id)
                .join(', ');

              return (
                <tr
                  key={step.stepIndex}
                  onClick={() => jumpToStep(step.stepIndex)}
                  className={`cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/50 text-cyan-200 font-bold border-l-4 border-cyan-400'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <td className="py-2 px-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && <PlayCircle className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />}
                      <span>{step.stepIndex}</span>
                    </div>
                  </td>

                  <td className="py-2 px-2.5 text-center whitespace-nowrap">
                    {step.symbolRead !== null ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                        '{step.symbolRead}'
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  <td className="py-2 px-2.5 whitespace-nowrap">
                    <span className={isCurrent ? 'text-cyan-300' : 'text-indigo-300'}>
                      {automaton.type === 'DFA' ? (stateLabels || '—') : `{ ${stateLabels || '∅'} }`}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-slate-400 leading-snug">
                    {step.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
