import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  Wand2
} from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import { minimizeDFA } from '../../simulation/minimization';
import { simulateDFA } from '../../simulation/dfa';
import { generateSystematicStrings } from '../../simulation/batchRunner';

interface DfaMinimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestConvertToDfa?: () => void;
}

export const DfaMinimizerModal: React.FC<DfaMinimizerModalProps> = ({
  isOpen,
  onClose,
  onRequestConvertToDfa
}) => {
  const { automaton, loadConvertedDfa } = useAutomata();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [testResultsTab, setTestResultsTab] = useState<'partitions' | 'minimized' | 'verify'>('partitions');

  // Custom test input initialized based on current alphabet
  const defaultSample = useMemo(() => {
    const alpha = automaton.alphabet && automaton.alphabet.length > 0 ? automaton.alphabet : ['0', '1'];
    return (alpha[0] || '0') + (alpha[1] || alpha[0] || '1') + (alpha[0] || '0');
  }, [automaton.alphabet]);

  const [customTestInput, setCustomTestInput] = useState(defaultSample);

  // Update custom test input if alphabet changed significantly
  useEffect(() => {
    setCustomTestInput(defaultSample);
  }, [defaultSample]);

  // Run minimization algorithm when modal opens or automaton changes
  const minimizationResult = useMemo(() => {
    if (!isOpen) return null;
    return minimizeDFA(automaton);
  }, [automaton, isOpen]);

  const hasError = minimizationResult && 'error' in minimizationResult;
  const history = minimizationResult && !hasError ? minimizationResult.partitionsHistory : [];

  // Reset step index and playback whenever modal is opened or automaton changes
  useEffect(() => {
    if (isOpen) {
      setActiveStepIndex(0);
      setIsPlaying(false);
    }
  }, [isOpen, automaton]);

  // Playback timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && history.length > 0) {
      timerRef.current = setInterval(() => {
        setActiveStepIndex(prev => {
          if (prev >= history.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, history.length, playbackSpeed]);

  const handleLoadMinimized = () => {
    if (minimizationResult && !('error' in minimizationResult)) {
      loadConvertedDfa({
        automaton: minimizationResult.minimizedAutomaton,
        steps: [],
        mapping: {}
      });
      onClose();
    }
  };

  // Dynamically generated test strings using actual alphabet
  const dynamicTestStrings = useMemo(() => {
    const alpha = automaton.alphabet && automaton.alphabet.length > 0 ? automaton.alphabet : ['0', '1'];
    return generateSystematicStrings(alpha, 3);
  }, [automaton.alphabet]);

  const verificationResults = useMemo(() => {
    if (hasError || !minimizationResult) return [];
    return dynamicTestStrings.map(str => {
      const resOrig = simulateDFA(automaton, str);
      const resMin = simulateDFA(minimizationResult.minimizedAutomaton, str);
      return {
        input: str === '' ? 'ε (empty)' : str,
        originalAccepted: resOrig.accepted,
        minimizedAccepted: resMin.accepted,
        match: resOrig.accepted === resMin.accepted
      };
    });
  }, [automaton, minimizationResult, dynamicTestStrings, hasError]);

  const customVerification = useMemo(() => {
    if (hasError || !minimizationResult) return null;
    const resOrig = simulateDFA(automaton, customTestInput);
    const resMin = simulateDFA(minimizationResult.minimizedAutomaton, customTestInput);
    return {
      input: customTestInput,
      originalAccepted: resOrig.accepted,
      minimizedAccepted: resMin.accepted,
      match: resOrig.accepted === resMin.accepted
    };
  }, [automaton, minimizationResult, customTestInput, hasError]);

  if (!isOpen) return null;

  const currentStep = history[activeStepIndex] || history[history.length - 1];
  const isNfaError = hasError && (automaton.type === 'NFA' || automaton.type === 'ENFA');

  const stateReduction = minimizationResult && !hasError
    ? minimizationResult.originalStateCount - minimizationResult.minimizedStateCount
    : 0;

  const allVerificationMatched = verificationResults.length > 0 && verificationResults.every(r => r.match);

  const unreachableStateLabels = minimizationResult && !hasError
    ? minimizationResult.unreachableStates.map(id => automaton.states.find(s => s.id === id)?.label || id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>DFA Minimizer Studio</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Partition Refinement Algorithm
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Reduce redundant states while preserving exact formal language equivalence L(M) = L(M<sub>min</sub>)
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

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {hasError ? (
            <div className="p-6 bg-rose-950/40 border border-rose-800/80 rounded-2xl text-rose-300 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-base text-rose-200">Cannot Minimize Automaton</p>
                  <p className="text-xs font-mono text-rose-300/90 leading-relaxed">
                    {minimizationResult.error}
                  </p>
                </div>
              </div>

              {isNfaError && onRequestConvertToDfa && (
                <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between">
                  <span className="text-xs text-rose-300 font-sans">
                    You can convert your {automaton.type === 'ENFA' ? 'ε-NFA' : 'NFA'} to an equivalent DFA using Subset Construction first.
                  </span>
                  <button
                    onClick={onRequestConvertToDfa}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Wand2 className="w-4 h-4" />
                    Open Subset Construction (Convert to DFA)
                  </button>
                </div>
              )}
            </div>
          ) : minimizationResult ? (
            <>
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Original States</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-indigo-400">
                      {minimizationResult.originalStateCount}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">|Q|</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Minimized States</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-cyan-400">
                      {minimizationResult.minimizedStateCount}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        stateReduction > 0
                          ? 'text-emerald-400'
                          : stateReduction === 0
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {stateReduction > 0
                        ? `-${stateReduction} states`
                        : stateReduction === 0
                        ? 'Already minimal'
                        : `+${Math.abs(stateReduction)} states`}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unreachable States</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-amber-400">
                      {minimizationResult.unreachableStates.length}
                    </span>
                    <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]" title={unreachableStateLabels.join(', ')}>
                      {unreachableStateLabels.length > 0 ? `{${unreachableStateLabels.join(', ')}} removed` : 'None'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Equivalence Verification</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    {allVerificationMatched ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300 font-mono">100% Identical</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                        <span className="text-xs font-bold text-rose-300 font-mono">Mismatch</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setTestResultsTab('partitions')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    testResultsTab === 'partitions'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Step-by-Step Refinement Animation
                </button>
                <button
                  onClick={() => setTestResultsTab('minimized')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    testResultsTab === 'minimized'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Minimized DFA Transition Table
                </button>
                <button
                  onClick={() => setTestResultsTab('verify')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    testResultsTab === 'verify'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Language Equivalence Testing
                </button>
              </div>

              {/* Tab 1: Step-by-step Refinement Animation */}
              {testResultsTab === 'partitions' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Playback Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsPlaying(false);
                          setActiveStepIndex(0);
                        }}
                        disabled={activeStepIndex === 0}
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Reset to Step 0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setIsPlaying(false);
                          setActiveStepIndex(prev => Math.max(0, prev - 1));
                        }}
                        disabled={activeStepIndex === 0}
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Previous Step"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={history.length <= 1}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsPlaying(false);
                          setActiveStepIndex(prev => Math.min(history.length - 1, prev + 1));
                        }}
                        disabled={activeStepIndex >= history.length - 1}
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors cursor-pointer"
                        title="Next Step"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                      <span>
                        {currentStep?.iteration === 0 ? (
                          <strong className="text-cyan-300 font-bold">Step 0 (Initial P₀)</strong>
                        ) : (
                          <>
                            Iteration <strong className="text-indigo-300 font-bold">{currentStep?.iteration}</strong>
                          </>
                        )}{' '}
                        of {Math.max(1, history.length - 1)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span>Speed:</span>
                        <select
                          value={playbackSpeed}
                          onChange={e => setPlaybackSpeed(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                        >
                          <option value={1500}>Slow (1.5s)</option>
                          <option value={1000}>Normal (1.0s)</option>
                          <option value={500}>Fast (0.5s)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Explanation Banner */}
                  {currentStep && (
                    <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span>{currentStep.description}</span>
                      </div>
                      {currentStep.splits.map((split, sIdx) => (
                        <p
                          key={sIdx}
                          className="text-xs text-slate-300 font-mono bg-indigo-950/80 p-2.5 rounded-lg border border-indigo-900/60 leading-relaxed"
                        >
                          {split.reason}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Partition Groups Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {currentStep?.iteration === 0
                          ? 'Initial Partitions (P₀)'
                          : `Partitions at Iteration ${currentStep?.iteration} (P${currentStep?.iteration})`}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        {currentStep?.partitionAfter.length} Equivalence Classes
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentStep?.partitionAfter.map((group, gIdx) => {
                        const isFinalGroup = group.some(id => automaton.states.find(s => s.id === id)?.isFinal);
                        const stateLabels = group
                          .map(id => automaton.states.find(s => s.id === id)?.label || id)
                          .sort();

                        return (
                          <div
                            key={gIdx}
                            className={`p-4 rounded-xl border ${
                              isFinalGroup
                                ? 'bg-emerald-950/20 border-emerald-800/60'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-mono font-bold text-slate-300">
                                Class G<sub>{gIdx + 1}</sub>
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                  isFinalGroup
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                                }`}
                              >
                                {isFinalGroup ? 'ACCEPTING GROUP' : 'NON-ACCEPTING GROUP'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {stateLabels.map(label => (
                                <span
                                  key={label}
                                  className="px-3 py-1 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs font-bold rounded-lg shadow-sm"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Minimized DFA Transition Table */}
              {testResultsTab === 'minimized' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Minimized DFA Transition Matrix (δ<sub>min</sub>)
                    </h4>
                    <span className="text-xs font-mono text-cyan-400">
                      Alphabet Σ = {'{'}{minimizationResult.minimizedAutomaton.alphabet.join(', ')}{'}'}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Minimized State</th>
                          <th className="py-3 px-4 font-semibold">Original States Merged</th>
                          {minimizationResult.minimizedAutomaton.alphabet.map(sym => (
                            <th key={sym} className="py-3 px-4 font-semibold text-center text-indigo-300">
                              Input '{sym}'
                            </th>
                          ))}
                          <th className="py-3 px-4 font-semibold text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {minimizationResult.mergedGroups.map((mg, idx) => {
                          return (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-1.5">
                                <span className="text-amber-400 font-bold">
                                  {mg.isStart && mg.isFinal ? '→ *' : mg.isStart ? '→' : mg.isFinal ? '*' : ''}
                                </span>
                                <span className="text-cyan-300">{mg.minimizedStateId}</span>
                              </td>

                              <td className="py-3 px-4 text-slate-300 font-semibold">
                                {mg.label}
                              </td>

                              {minimizationResult.minimizedAutomaton.alphabet.map(sym => {
                                const trans = minimizationResult.minimizedAutomaton.transitions.find(
                                  t => t.from === mg.minimizedStateId && t.symbol === sym
                                );
                                const targetGroup = minimizationResult.mergedGroups.find(
                                  m => m.minimizedStateId === trans?.to
                                );
                                return (
                                  <td key={sym} className="py-3 px-4 text-center font-bold text-indigo-300">
                                    {targetGroup ? targetGroup.minimizedStateId : '—'}
                                  </td>
                                );
                              })}

                              <td className="py-3 px-4 text-center">
                                {mg.isFinal ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800">
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
              )}

              {/* Tab 3: Language Equivalence Testing */}
              {testResultsTab === 'verify' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Equivalence Testing Suite: L(Original) == L(Minimized)
                    </h4>
                    <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Systematic Language Sampling
                    </span>
                  </div>

                  {/* Custom String Tester */}
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-slate-300">Test Custom String Input</div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={customTestInput}
                        onChange={e => setCustomTestInput(e.target.value)}
                        placeholder={`Enter string using Σ = {${automaton.alphabet.join(', ')}}`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                      />
                      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono justify-between">
                        <span>Original:</span>
                        <strong className={customVerification?.originalAccepted ? 'text-emerald-400' : 'text-rose-400'}>
                          {customVerification?.originalAccepted ? 'ACCEPTED' : 'REJECTED'}
                        </strong>
                        <span className="text-slate-600">|</span>
                        <span>Minimized:</span>
                        <strong className={customVerification?.minimizedAccepted ? 'text-emerald-400' : 'text-rose-400'}>
                          {customVerification?.minimizedAccepted ? 'ACCEPTED' : 'REJECTED'}
                        </strong>
                        <span className="text-slate-600">|</span>
                        <span className={customVerification?.match ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {customVerification?.match ? '✓ MATCH' : '✗ MISMATCH'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Systematic Test Suite Grid */}
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Test String (w ∈ Σ*)</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Original DFA</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Minimized DFA</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Behavioral Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {verificationResults.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-4 font-bold text-slate-200">
                              '{item.input}'
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.originalAccepted
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-950 text-slate-500'
                                }`}
                              >
                                {item.originalAccepted ? 'ACCEPT' : 'REJECT'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.minimizedAccepted
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-950 text-slate-500'
                                }`}
                              >
                                {item.minimizedAccepted ? 'ACCEPT' : 'REJECT'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {item.match ? (
                                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Identical
                                </span>
                              ) : (
                                <span className="text-rose-400 font-bold flex items-center justify-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Divergent
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs text-slate-400 font-mono">
            Minimization reduces state complexity while preserving identical formal language acceptance.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleLoadMinimized}
              disabled={hasError || !minimizationResult}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              Load Minimized DFA into Studio Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
