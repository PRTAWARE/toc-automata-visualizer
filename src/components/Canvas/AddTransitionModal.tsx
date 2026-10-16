import React, { useState } from 'react';
import { X, ArrowRight, Plus, ArrowRightLeft } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import { EPSILON } from '../../types/automata';

interface AddTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrom?: string;
  defaultTo?: string;
}

export const AddTransitionModal: React.FC<AddTransitionModalProps> = ({
  isOpen,
  onClose,
  defaultFrom,
  defaultTo
}) => {
  const { automaton, addTransition } = useAutomata();
  const [fromState, setFromState] = useState<string>(defaultFrom || automaton.states[0]?.id || '');
  const [toState, setToState] = useState<string>(defaultTo || automaton.states[0]?.id || '');
  const [symbol, setSymbol] = useState<string>(automaton.alphabet[0] || '0');

  // Keep state updated when modal opens or defaults change
  React.useEffect(() => {
    if (isOpen) {
      setFromState(defaultFrom || automaton.states[0]?.id || '');
      setToState(defaultTo || automaton.states[1]?.id || automaton.states[0]?.id || '');
    }
  }, [isOpen, defaultFrom, defaultTo, automaton.states]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fromState || !toState || !symbol.trim()) return;

    addTransition(fromState, toState, symbol.trim());
    onClose();
  };

  const isENFA = automaton.type === 'ENFA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Add Transition</h3>
              <p className="text-xs text-slate-400">Define a labeled directed edge δ(from, symbol) = to</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <div className="grid grid-cols-2 gap-4 items-center">
              {/* From State */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Origin State (From)
                </label>
                <select
                  value={fromState}
                  onChange={(e) => setFromState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                >
                  {automaton.states.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label} {s.isStart ? '(Start)' : ''} {s.isFinal ? '(Final)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* To State */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Target State (To)
                </label>
                <select
                  value={toState}
                  onChange={(e) => setToState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                >
                  {automaton.states.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label} {s.isStart ? '(Start)' : ''} {s.isFinal ? '(Final)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                type="button"
                onClick={() => {
                  const temp = fromState;
                  setFromState(toState);
                  setToState(temp);
                }}
                title="Swap From and To"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-full border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick connection preview */}
          <div className="flex items-center justify-center gap-3 py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400">
            <span className="font-bold text-indigo-400">
              {automaton.states.find(s => s.id === fromState)?.label || 'from'}
            </span>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-8 h-[1px] bg-slate-600 inline-block" />
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                '{symbol || '?'}'
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="font-bold text-indigo-400">
              {automaton.states.find(s => s.id === toState)?.label || 'to'}
            </span>
          </div>

          {/* Transition Symbol */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Input Symbol
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                maxLength={4}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. 0"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                autoFocus
              />
            </div>

            {/* Quick Alphabet Buttons */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 mr-1">Quick pick:</span>
              {automaton.alphabet.map(sym => (
                <button
                  type="button"
                  key={sym}
                  onClick={() => setSymbol(sym)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                    symbol === sym
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {sym}
                </button>
              ))}

              {isENFA && (
                <button
                  type="button"
                  onClick={() => setSymbol(EPSILON)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                    symbol === EPSILON
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-950/40 text-amber-300 border border-amber-600/30 hover:bg-amber-900/40'
                  }`}
                >
                  ε (Epsilon)
                </button>
              )}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!symbol.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Transition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
