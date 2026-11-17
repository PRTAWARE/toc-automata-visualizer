import React, { useState } from 'react';
import { X, Sparkles, Play, Wand2, Layers, Table, CheckCircle2 } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import { convertPattern } from '../../api/convertApi.js';
import type { Automaton, State, Transition } from '../../types/automata';

interface RegexToAutomataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_EXAMPLES = [
  { label: 'a(b|c)*d', desc: 'Alternation & Star' },
  { label: '(a|b)*abb', desc: 'Ends with abb' },
  { label: '1(0|1)*', desc: 'Binary starting with 1' },
  { label: 'ab?c+', desc: 'Optional & Plus' },
  { label: '(0|1)*01', desc: 'Binary ending with 01' }
];

export const RegexToAutomataModal: React.FC<RegexToAutomataModalProps> = ({ isOpen, onClose }) => {
  const { setAutomaton } = useAutomata();
  const [pattern, setPattern] = useState('(a|b)*abb');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dfa' | 'nfa' | 'steps'>('dfa');

  if (!isOpen) return null;

  const handleConvert = async (regexToRun?: string) => {
    const target = (regexToRun ?? pattern).trim();
    if (!target) {
      setError('Please enter a regular expression pattern.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await convertPattern(target);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to convert regular expression.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDfa = () => {
    if (!result?.dfa) return;
    const dfa = result.dfa;
    const isFinalSet = new Set(dfa.accept);
    const alphabet: string[] = [
      ...new Set(
        dfa.transitions
          .map((t: any) => t.symbol)
          .filter((s: string) => s && s !== 'ε')
      )
    ] as string[];

    const states: State[] = dfa.states.map((s: number, idx: number) => {
      const subsetLabel = dfa.stateLabels?.[s] || `D${s}`;
      const cols = Math.max(3, Math.ceil(Math.sqrt(dfa.states.length * 1.5)));
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        id: `D${s}`,
        label: `D${s} ${subsetLabel}`,
        isStart: s === dfa.start,
        isFinal: isFinalSet.has(s),
        x: 120 + col * 220,
        y: 140 + row * 160
      };
    });

    const transitions: Transition[] = dfa.transitions.map((t: any, i: number) => ({
      id: `t_dfa_${i}`,
      from: `D${t.from}`,
      to: `D${t.to}`,
      symbol: t.symbol
    }));

    const newMachine: Automaton = {
      id: `dfa-regex-${Date.now()}`,
      title: `DFA: /${result.regex}/`,
      description: `Constructed from regex /${result.regex}/ via Thompson & Subset Construction`,
      type: 'DFA',
      alphabet: alphabet.length > 0 ? alphabet : ['a', 'b'],
      states,
      transitions
    };

    setAutomaton(newMachine);
    onClose();
  };

  const handleLoadNfa = () => {
    if (!result?.nfa) return;
    const nfa = result.nfa;
    const isFinalSet = new Set(nfa.accept);
    const alphabet: string[] = (nfa.alphabet || [
      ...new Set(nfa.transitions.map((t: any) => t.symbol).filter((s: string) => s && s !== 'ε'))
    ]) as string[];

    const states: State[] = nfa.states.map((s: number, idx: number) => {
      const cols = Math.max(4, Math.ceil(Math.sqrt(nfa.states.length * 2)));
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        id: `q${s}`,
        label: `q${s}`,
        isStart: s === nfa.start,
        isFinal: isFinalSet.has(s),
        x: 100 + col * 170,
        y: 120 + row * 140
      };
    });

    const transitions: Transition[] = nfa.transitions.map((t: any, i: number) => ({
      id: `t_nfa_${i}`,
      from: `q${t.from}`,
      to: `q${t.to}`,
      symbol: t.symbol
    }));

    const newMachine: Automaton = {
      id: `enfa-regex-${Date.now()}`,
      title: `ε-NFA: /${result.regex}/`,
      description: `Thompson's Construction for regex /${result.regex}/`,
      type: 'ENFA',
      alphabet: alphabet.length > 0 ? alphabet : ['a', 'b'],
      states,
      transitions
    };

    setAutomaton(newMachine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Regex to Automata</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Thompson's &amp; Subset Construction
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Generate equivalent Thompson ε-NFA and Deterministic Finite Automaton directly
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

        {/* Input Controls */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConvert();
                }}
                placeholder="Enter regex (e.g. a(b|c)*d or (0|1)*01)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500 shadow-inner"
              />
            </div>
            <button
              onClick={() => handleConvert()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isLoading ? 'Converting...' : 'Build Automata'}</span>
            </button>
          </div>

          {/* Quick Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Examples:</span>
            {PRESET_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => {
                  setPattern(ex.label);
                  handleConvert(ex.label);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-[11px] rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!result && !error && (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Sparkles className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
              <p className="text-sm font-medium text-slate-400">
                Enter any regular expression above or click one of the example patterns.
              </p>
              <p className="text-xs text-slate-500">
                Supports union (<span className="text-indigo-400 font-mono">|</span>), concatenation, star (<span className="text-indigo-400 font-mono">*</span>), plus (<span className="text-indigo-400 font-mono">+</span>), optional (<span className="text-indigo-400 font-mono">?</span>), and parentheses.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pattern</span>
                  <p className="text-base font-bold font-mono text-indigo-300 mt-0.5 truncate">
                    /{result.regex}/
                  </p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thompson ε-NFA</span>
                  <p className="text-base font-bold font-mono text-purple-300 mt-0.5">
                    {result.nfa?.states?.length || 0} States
                  </p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Equivalent DFA</span>
                  <p className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                    {result.dfa?.states?.length || 0} States
                  </p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alphabet Σ</span>
                  <p className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                    {'{'}{(result.dfa?.transitions ? [...new Set(result.dfa.transitions.map((t: any) => t.symbol).filter((s: string) => s !== 'ε'))] : []).join(', ')}{'}'}
                  </p>
                </div>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('dfa')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'dfa'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>DFA Transition Matrix</span>
                </button>
                <button
                  onClick={() => setActiveTab('nfa')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'nfa'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ε-NFA Transitions</span>
                </button>
                <button
                  onClick={() => setActiveTab('steps')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'steps'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Construction Trace</span>
                </button>
              </div>

              {/* DFA Tab View */}
              {activeTab === 'dfa' && result.dfa && (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">DFA State</th>
                          <th className="py-2.5 px-3 font-semibold">Subset (NFA States)</th>
                          {[...new Set(result.dfa.transitions.map((t: any) => t.symbol).filter((s: string) => s !== 'ε'))].map((sym: any) => (
                            <th key={sym} className="py-2.5 px-3 font-semibold text-center text-indigo-300">
                              δ(State, '{sym}')
                            </th>
                          ))}
                          <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {result.dfa.states.map((s: number) => {
                          const isStart = s === result.dfa.start;
                          const isFinal = result.dfa.accept.includes(s);
                          const subset = result.dfa.stateLabels?.[s] || `D${s}`;
                          const alphabetList = [...new Set(result.dfa.transitions.map((t: any) => t.symbol).filter((sym: string) => sym !== 'ε'))];

                          return (
                            <tr key={s} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-bold text-slate-200">
                                <span className="text-amber-400 mr-1.5 font-bold">
                                  {isStart && isFinal ? '→ *' : isStart ? '→' : isFinal ? '*' : ''}
                                </span>
                                D{s}
                              </td>
                              <td className="py-2.5 px-3 text-cyan-300 font-semibold">
                                {subset}
                              </td>
                              {alphabetList.map((sym: any) => {
                                const trans = result.dfa.transitions.find(
                                  (t: any) => t.from === s && t.symbol === sym
                                );
                                return (
                                  <td key={sym} className="py-2.5 px-3 text-center text-slate-300">
                                    {trans ? `D${trans.to}` : <span className="text-slate-600">∅</span>}
                                  </td>
                                );
                              })}
                              <td className="py-2.5 px-3 text-center">
                                {isFinal ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                                    ACCEPTING
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Non-Final</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NFA Tab View */}
              {activeTab === 'nfa' && result.nfa && (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">From State</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Symbol</th>
                          <th className="py-2.5 px-3 font-semibold">To State</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Transition Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {result.nfa.transitions.map((t: any, idx: number) => {
                          const isEpsilon = t.symbol === 'ε';
                          return (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-bold text-slate-200">
                                q{t.from}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold ${
                                    isEpsilon
                                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                      : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60'
                                  }`}
                                >
                                  {t.symbol}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-200">
                                q{t.to}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-400">
                                {isEpsilon ? 'Epsilon (ε) Closure Branch' : 'Input Symbol Match'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Steps Tab View */}
              {activeTab === 'steps' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Construction Steps
                    </h5>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {(result.dfa?.steps || result.nfa?.steps || []).map((step: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300"
                        >
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-mono">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>

          {result && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleLoadNfa}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Load ε-NFA into Canvas</span>
              </button>

              <button
                onClick={handleLoadDfa}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Load DFA into Canvas &amp; Simulate</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
