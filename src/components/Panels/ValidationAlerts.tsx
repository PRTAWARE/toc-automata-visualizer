import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';

export const ValidationAlerts: React.FC = () => {
  const { validation, automaton } = useAutomata();

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          ) : hasWarnings ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {automaton.type} Formal Validation
          </h4>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            hasErrors
              ? 'bg-rose-950 text-rose-300 border border-rose-800'
              : hasWarnings
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}
        >
          {hasErrors
            ? `${validation.errors.length} Error${validation.errors.length > 1 ? 's' : ''}`
            : hasWarnings
            ? `${validation.warnings.length} Warning${validation.warnings.length > 1 ? 's' : ''}`
            : 'Valid Automaton'}
        </span>
      </div>

      {/* Valid state banner */}
      {!hasErrors && !hasWarnings && (
        <div className="flex items-center gap-2 py-2 px-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Automaton satisfies all formal {automaton.type} definition rules and is ready for simulation!</span>
        </div>
      )}

      {/* Errors list */}
      {hasErrors && (
        <div className="space-y-1.5">
          {validation.errors.map(err => (
            <div
              key={err.id}
              className="flex items-start gap-2 py-2 px-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-300 font-mono"
            >
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings list */}
      {hasWarnings && (
        <div className="space-y-1.5">
          {validation.warnings.map(warn => (
            <div
              key={warn.id}
              className="flex items-start gap-2 py-2 px-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300 font-mono"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{warn.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contextual Academic Tip */}
      <div className="pt-2 border-t border-slate-800/60 flex items-start gap-2 text-[11px] text-slate-400 font-mono">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        {automaton.type === 'DFA' && (
          <span>
            DFA Rule: Every state must have exactly one outgoing transition for each symbol in Σ. No ε-moves are permitted.
          </span>
        )}
        {automaton.type === 'NFA' && (
          <span>
            NFA Rule: States can have 0, 1, or multiple transitions per symbol. String accepts if any path ends in a final state.
          </span>
        )}
        {automaton.type === 'ENFA' && (
          <span>
            ε-NFA Rule: In addition to NFA rules, transitions labeled ε (epsilon) can be traversed without consuming an input symbol.
          </span>
        )}
      </div>
    </div>
  );
};
