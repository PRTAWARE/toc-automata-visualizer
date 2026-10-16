import React, { useState } from 'react';
import {
  Cpu,
  BookOpen,
  Wand2,
  FileJson,
  Settings,
  Minimize2
} from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import type { AutomatonType } from '../../types/automata';
import { PresetModal } from '../Panels/PresetModal';
import { NfaToDfaModal } from '../Panels/NfaToDfaModal';
import { ExportImportModal } from '../Panels/ExportImportModal';
import { DfaMinimizerModal } from '../Panels/DfaMinimizerModal';

export const Navbar: React.FC = () => {
  const { automaton, setAutomatonType, setAlphabet, stateNamingStyle, setStateNamingStyle } = useAutomata();

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isNfaModalOpen, setIsNfaModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMinimizerModalOpen, setIsMinimizerModalOpen] = useState(false);
  const [isAlphabetEditorOpen, setIsAlphabetEditorOpen] = useState(false);
  const [alphabetInput, setAlphabetInput] = useState(automaton.alphabet.join(', '));

  const handleAlphabetSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = alphabetInput.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      setAlphabet(parts);
    }
    setIsAlphabetEditorOpen(false);
  };

  const types: AutomatonType[] = ['DFA', 'NFA', 'ENFA'];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl shadow-lg shadow-cyan-500/20 text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Automata Studio
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  TOC Visualizer
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Interactive Finite State Automata & Formal Languages Engine
              </p>
            </div>
          </div>

          {/* Automaton Type Switcher Pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            {types.map(t => {
              const isActive = automaton.type === t;
              return (
                <button
                  key={t}
                  onClick={() => setAutomatonType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {t === 'ENFA' ? 'ε-NFA' : t}
                </button>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Alphabet Editor Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setAlphabetInput(automaton.alphabet.join(', '));
                  setIsAlphabetEditorOpen(!isAlphabetEditorOpen);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold rounded-xl border border-slate-700 shadow-sm transition-colors cursor-pointer"
              >
                <span>Σ = {'{'}{automaton.alphabet.join(', ')}{'}'}</span>
                <Settings className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Alphabet Dropdown Editor */}
              {isAlphabetEditorOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl p-3.5 shadow-2xl z-50 animate-in fade-in space-y-3">
                  <div>
                    <div className="text-xs font-bold text-slate-200 mb-1">Configure Alphabet Σ</div>
                    <p className="text-[11px] text-slate-400 mb-2">Comma-separated characters</p>
                    <form onSubmit={handleAlphabetSave} className="space-y-2">
                      <input
                        type="text"
                        value={alphabetInput}
                        onChange={(e) => setAlphabetInput(e.target.value)}
                        placeholder="0, 1"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAlphabetEditorOpen(false)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>

                  <hr className="border-slate-800" />

                  <div>
                    <div className="text-xs font-bold text-slate-200 mb-1">State Naming Convention</div>
                    <p className="text-[11px] text-slate-400 mb-2">Default label format when adding new states</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStateNamingStyle('alphabetical')}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                          stateNamingStyle === 'alphabetical'
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        A, B, C, D...
                      </button>
                      <button
                        type="button"
                        onClick={() => setStateNamingStyle('numeric')}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                          stateNamingStyle === 'numeric'
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        q0, q1, q2...
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subset Construction (Convert NFA to DFA) */}
            {(automaton.type === 'NFA' || automaton.type === 'ENFA') && (
              <button
                onClick={() => setIsNfaModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Convert to DFA</span>
              </button>
            )}

            {/* DFA Minimizer */}
            <button
              onClick={() => setIsMinimizerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/80 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Minimize DFA</span>
            </button>

            {/* Presets Library */}
            <button
              onClick={() => setIsPresetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Examples</span>
            </button>

            {/* Export / Import */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 shadow-sm transition-colors cursor-pointer"
              title="Export / Import Automaton JSON"
            >
              <FileJson className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
      />

      <NfaToDfaModal
        isOpen={isNfaModalOpen}
        onClose={() => setIsNfaModalOpen(false)}
      />

      <DfaMinimizerModal
        isOpen={isMinimizerModalOpen}
        onClose={() => setIsMinimizerModalOpen(false)}
        onRequestConvertToDfa={() => {
          setIsMinimizerModalOpen(false);
          setIsNfaModalOpen(true);
        }}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </>
  );
};
