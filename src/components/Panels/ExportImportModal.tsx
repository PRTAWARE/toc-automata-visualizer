import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileJson } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import type { Automaton } from '../../types/automata';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const { automaton, setAutomaton, resetSimulation } = useAutomata();
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(automaton, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${automaton.id || 'automaton'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      setImportError(null);
      const parsed: Automaton = JSON.parse(importText);
      if (!parsed.states || !parsed.transitions || !parsed.alphabet || !parsed.type) {
        throw new Error('Invalid automaton schema. Must contain states, transitions, alphabet, and type.');
      }
      setAutomaton(parsed);
      resetSimulation();
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Export & Import Automaton</h3>
              <p className="text-xs text-slate-400">Save your work as JSON or load an existing automaton configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Export Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Export Current Automaton (JSON)
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 max-h-40 overflow-y-auto">
              {jsonString}
            </pre>
          </div>

          {/* Import Section */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Import from JSON
            </h4>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste automaton JSON specification here..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            {importError && (
              <p className="text-xs text-rose-400 font-mono">{importError}</p>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Load Automaton</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
