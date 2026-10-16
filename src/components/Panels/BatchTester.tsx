import React, { useState } from 'react';
import { Layers, Play, Plus, RefreshCw, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import type { BatchTestItem } from '../../types/automata';

export const BatchTester: React.FC = () => {
  const { batchTests, setBatchTests, runBatch, generateBatch, setInputString } = useAutomata();
  const [newInput, setNewInput] = useState('');
  const [expectedType, setExpectedType] = useState<'accept' | 'reject' | 'none'>('none');

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newInput.trim();
    const newItem: BatchTestItem = {
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      input: trimmed,
      expected: expectedType === 'accept' ? true : expectedType === 'reject' ? false : undefined,
      explanation: trimmed === '' ? 'Empty string ε' : `Test string "${trimmed}"`
    };

    setBatchTests(prev => [...prev, newItem]);
    setNewInput('');
  };

  const handleDeleteTest = (id: string) => {
    setBatchTests(prev => prev.filter(t => t.id !== id));
  };

  const passedCount = batchTests.filter(t => t.passed === true).length;
  const testedCount = batchTests.filter(t => t.actual !== undefined).length;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Batch Test Suite ({batchTests.length} Cases)
          </h4>
        </div>

        {testedCount > 0 && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Passed: <strong className="text-emerald-400">{passedCount}</strong> / {testedCount}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={runBatch}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Run All Tests
        </button>

        <button
          onClick={generateBatch}
          title="Generate systematic test strings of lengths 0, 1, 2, 3"
          className="flex items-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          Generate Test Suite
        </button>
      </div>

      {/* Add new test input */}
      <form onSubmit={handleAddTest} className="flex items-center gap-2">
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder="New test string (or leave empty for ε)..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
        />

        <select
          value={expectedType}
          onChange={(e) => setExpectedType(e.target.value as any)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-300 font-mono"
        >
          <option value="none">No Expected</option>
          <option value="accept">Expect Accept</option>
          <option value="reject">Expect Reject</option>
        </select>

        <button
          type="submit"
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Tests table */}
      <div className="overflow-x-auto max-h-[260px] overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="sticky top-0 bg-slate-950/95 z-10 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider">String</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-center">Expected</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-center">Result</th>
              <th className="py-2 px-2 font-semibold uppercase tracking-wider text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {batchTests.map(test => (
              <tr key={test.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-2.5">
                  <span className="font-bold text-slate-200">
                    {test.input === '' ? (
                      <span className="text-cyan-400 italic">ε (empty)</span>
                    ) : (
                      `"${test.input}"`
                    )}
                  </span>
                </td>

                <td className="py-2 px-2 text-center">
                  {test.expected === true ? (
                    <span className="text-emerald-400 font-semibold">Accept</span>
                  ) : test.expected === false ? (
                    <span className="text-rose-400 font-semibold">Reject</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>

                <td className="py-2 px-2 text-center">
                  {test.actual === undefined ? (
                    <span className="text-slate-500">Untested</span>
                  ) : test.actual ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/60 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      ACCEPTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-800/60 text-[10px]">
                      <XCircle className="w-3 h-3" />
                      REJECTED
                    </span>
                  )}
                </td>

                <td className="py-2 px-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setInputString(test.input)}
                      title="Load into Simulation Player"
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded transition-colors"
                    >
                      Simulate
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      title="Delete test case"
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
