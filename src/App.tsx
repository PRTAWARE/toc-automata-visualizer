import React, { useState } from 'react';
import { AutomataProvider, useAutomata } from './context/AutomataContext';
import { Navbar } from './components/Navbar/Navbar';
import { AutomataCanvas } from './components/Canvas/AutomataCanvas';
import { InputTape } from './components/Tape/InputTape';
import { SimulationControls } from './components/Simulation/SimulationControls';
import { ResultBanner } from './components/Simulation/ResultBanner';
import { TransitionTable } from './components/Panels/TransitionTable';
import { TraceTable } from './components/Panels/TraceTable';
import { ValidationAlerts } from './components/Panels/ValidationAlerts';
import { BatchTester } from './components/Panels/BatchTester';
import { Table, Layers, AlertCircle, Keyboard } from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { automaton, validation } = useAutomata();
  const [activeTab, setActiveTab] = useState<'trace' | 'batch' | 'validation'>('trace');

  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Automaton Summary Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-3.5 backdrop-blur-md shadow-lg">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                {automaton.title || 'Custom Finite Automaton'}
              </h2>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  automaton.type === 'DFA'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : automaton.type === 'NFA'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {automaton.type === 'ENFA' ? 'ε-NFA' : automaton.type}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {automaton.description || 'Interactive state machine simulator'}
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300">
              <span className="text-slate-500 mr-1.5">Alphabet:</span>
              <span className="text-indigo-400 font-bold">
                Σ = {'{'}{automaton.alphabet.join(', ')}{'}'}
              </span>
            </div>

            <div className="px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300">
              <span className="text-slate-500 mr-1.5">States:</span>
              <span className="text-cyan-400 font-bold">
                |Q| = {automaton.states.length}
              </span>
            </div>

            <div className="px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300">
              <span className="text-slate-500 mr-1.5">Transitions:</span>
              <span className="text-emerald-400 font-bold">
                |δ| = {automaton.transitions.length}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Canvas, Tape & Controls (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Visual Canvas */}
            <div className="h-[480px]">
              <AutomataCanvas />
            </div>

            {/* Input Tape */}
            <InputTape />

            {/* Simulation Controls */}
            <SimulationControls />

            {/* Live Result Banner */}
            <ResultBanner />
          </div>

          {/* Right Column: Tabbed Information Panels (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-md">
              <button
                onClick={() => setActiveTab('trace')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'trace'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Trace & Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('batch')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'batch'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Batch Suite</span>
              </button>

              <button
                onClick={() => setActiveTab('validation')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === 'validation'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Validation</span>
                {(errorCount > 0 || warningCount > 0) && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      errorCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950 font-bold'
                    }`}
                  >
                    {errorCount || warningCount}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'trace' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <TransitionTable />
                <TraceTable />
              </div>
            )}

            {activeTab === 'batch' && (
              <div className="animate-in fade-in duration-150">
                <BatchTester />
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="animate-in fade-in duration-150">
                <ValidationAlerts />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Automata Studio</span>
            <span>•</span>
            <span>Theory of Computation Learning & Visualization Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Space: Play/Pause • → / ←: Step Next/Prev • R: Reset</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AutomataProvider>
      <MainDashboard />
    </AutomataProvider>
  );
}
