import React from 'react';
import { CheckCircle2, XCircle, Info, Sparkles, Navigation } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';

export const ResultBanner: React.FC = () => {
  const { simulationResult, activeStepIndex, automaton } = useAutomata();

  if (!simulationResult) return null;

  const currentStep = simulationResult.steps[activeStepIndex];
  const isFinalStep = activeStepIndex === simulationResult.steps.length - 1;

  // Active state labels
  const activeStateLabels = (currentStep?.activeStates || [])
    .map(id => automaton.states.find(s => s.id === id)?.label || id)
    .join(', ');

  return (
    <div className="w-full space-y-3">
      {/* Current Step Explanation Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5 border border-cyan-500/20 shrink-0">
            <Navigation className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Step {activeStepIndex}: Execution Step Explanation
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Active: {'{'}{activeStateLabels || 'None'}{'}'}
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-mono">
              {currentStep?.explanation || 'Simulation ready to run.'}
            </p>
          </div>
        </div>
      </div>

      {/* Final Outcome Banner (Shown prominently when simulation reaches the end) */}
      {isFinalStep && (
        <div
          className={`relative overflow-hidden rounded-2xl p-5 border shadow-2xl transition-all duration-300 ${
            simulationResult.accepted
              ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/40 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
              : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/40 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                simulationResult.accepted
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 animate-bounce'
                  : 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/30'
              }`}
            >
              {simulationResult.accepted ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-xl font-extrabold tracking-tight ${
                    simulationResult.accepted ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {simulationResult.accepted ? 'STRING ACCEPTED' : 'STRING REJECTED'}
                </h3>
                {simulationResult.accepted && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <Sparkles className="w-3 h-3" /> Valid Language Member
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-200 font-mono">
                {simulationResult.message}
              </p>

              {/* Mathematical formal acceptance statement */}
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Formal test: Final active state set {'{'}{activeStateLabels}{'}'}{' '}
                  {simulationResult.accepted ? '∩ F ≠ ∅ (Contains accepting state)' : '∩ F = ∅ (No accepting states)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
