import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';

export const SimulationControls: React.FC = () => {
  const {
    inputString,
    setInputString,
    inputStringValidation,
    isPlaying,
    togglePlay,
    stepForward,
    stepBackward,
    resetSimulation,
    playbackSpeed,
    setPlaybackSpeed,
    activeStepIndex,
    simulationResult,
    automaton
  } = useAutomata();

  const maxSteps = simulationResult ? simulationResult.steps.length - 1 : 0;
  const isAtStart = activeStepIndex === 0;
  const isAtEnd = activeStepIndex >= maxSteps;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetSimulation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepForward, stepBackward, resetSimulation]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Top Row: Input String Field & Alphabet Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Input String</span>
            <span className="text-[11px] font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              Σ = {'{'}{automaton.alphabet.join(', ')}{'}'}
            </span>
          </label>

          {/* Quick preset strings */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Quick:</span>
            {['1011', '110', '111', ''].map(sample => (
              <button
                key={sample || 'empty'}
                onClick={() => setInputString(sample)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition-colors ${
                  inputString === sample
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {sample === '' ? 'ε (empty)' : sample}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            placeholder="Enter input string (e.g. 1011)..."
            className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-base font-mono font-bold tracking-wider text-slate-100 focus:outline-none focus:ring-2 transition-all ${
              !inputStringValidation.isValid
                ? 'border-rose-500/80 focus:ring-rose-500/50'
                : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30'
            }`}
          />

          {inputString && (
            <button
              onClick={() => setInputString('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5 bg-slate-800 rounded hover:bg-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Validation error if invalid characters entered */}
        {!inputStringValidation.isValid && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-xl animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Invalid character(s) detected: <strong>{inputStringValidation.invalidSymbols.join(', ')}</strong>. Symbols must belong to alphabet Σ.
            </span>
          </div>
        )}
      </div>

      {/* Bottom Row: Playback Controls & Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        {/* Step Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            onClick={resetSimulation}
            title="Reset Simulation (R)"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 border border-slate-700/60 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Previous Step */}
          <button
            onClick={stepBackward}
            disabled={isAtStart}
            title="Previous Step (←)"
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-95 border border-slate-700/60 shadow-sm"
          >
            <SkipBack className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={togglePlay}
            disabled={maxSteps === 0}
            title={isPlaying ? 'Pause (Space)' : 'Play Simulation (Space)'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{isAtEnd ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          {/* Next Step */}
          <button
            onClick={stepForward}
            disabled={isAtEnd}
            title="Next Step (→)"
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-95 border border-slate-700/60 shadow-sm"
          >
            <span>Next</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5" />
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Speed:</span>
          {[
            { label: '0.5x', ms: 1200 },
            { label: '1x', ms: 800 },
            { label: '1.5x', ms: 500 },
            { label: '2x', ms: 300 }
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => setPlaybackSpeed(opt.ms)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                playbackSpeed === opt.ms
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
