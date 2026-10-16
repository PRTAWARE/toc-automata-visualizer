import React, { useState } from 'react';
import { X, BookOpen, ArrowRight, CheckCircle2, Minimize2, Wand2, Sparkles } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import { PRESET_AUTOMATA } from '../../simulation/presets';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({ isOpen, onClose }) => {
  const { loadPreset, automaton } = useAutomata();
  const [filterCategory, setFilterCategory] = useState<'all' | 'minimization' | 'conversion' | 'classic'>('all');

  if (!isOpen) return null;

  const filteredPresets = Object.entries(PRESET_AUTOMATA).filter(([, item]) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const minimizationCount = Object.values(PRESET_AUTOMATA).filter(i => i.category === 'minimization').length;
  const conversionCount = Object.values(PRESET_AUTOMATA).filter(i => i.category === 'conversion').length;
  const classicCount = Object.values(PRESET_AUTOMATA).filter(i => i.category === 'classic').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Automata Library & Exercises</span>
              </h3>
              <p className="text-xs text-slate-400">
                Explore classic textbook automata patterns with preconfigured test suites
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

        {/* Filter Categories Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-slate-800/80 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All Examples ({Object.keys(PRESET_AUTOMATA).length})
          </button>

          <button
            onClick={() => setFilterCategory('minimization')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'minimization'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-800/40'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>DFA Minimization ({minimizationCount})</span>
          </button>

          <button
            onClick={() => setFilterCategory('conversion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'conversion'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-400/90 hover:text-purple-300 hover:bg-purple-950/40 border border-purple-800/40'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>NFA Conversion ({conversionCount})</span>
          </button>

          <button
            onClick={() => setFilterCategory('classic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === 'classic'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Classic DFAs ({classicCount})
          </button>
        </div>

        {/* List of Presets */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {filteredPresets.map(([key, item]) => {
            const isCurrent = automaton.id === item.automaton.id;
            const isMinimization = item.category === 'minimization';

            return (
              <div
                key={key}
                onClick={() => {
                  loadPreset(key);
                  onClose();
                }}
                className={`group p-4 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg'
                    : isMinimization
                    ? 'bg-slate-950/70 border-cyan-900/40 hover:border-cyan-600/60 hover:bg-slate-900'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          item.automaton.type === 'DFA'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : item.automaton.type === 'NFA'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {item.automaton.type}
                      </span>

                      {item.minimizationTarget && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>{item.minimizationTarget}</span>
                        </span>
                      )}

                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {item.automaton.title}
                      </h4>

                      {isCurrent && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/60">
                          <CheckCircle2 className="w-3 h-3" /> Active on Canvas
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.automaton.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-cyan-400 shrink-0 font-semibold pt-1">
                    <span>Load</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Σ = {'{'}{item.automaton.alphabet.join(', ')}{'}'} • {item.automaton.states.length} States</span>
                  <span>{item.sampleTestCases.length} Pre-built Tests</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
