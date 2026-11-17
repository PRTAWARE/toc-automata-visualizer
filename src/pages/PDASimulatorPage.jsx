import React, { useState } from "react";
import { Link } from "react-router-dom";
import { simulatePDA, PDA_EXAMPLES } from "../algorithms/pdaSimulate.js";
import {
  ArrowLeft,
  Layers,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Cpu,
  Database,
  Info
} from "lucide-react";

export default function PDASimulatorPage() {
  // Machine definition state
  const [stateCount, setStateCount] = useState(3);
  const [startState, setStartState] = useState(0);
  const [acceptStates, setAcceptStates] = useState([2]);
  const [initialStack, setInitialStack] = useState("Z");
  const [rawTransitions, setRawTransitions] = useState(
    "0,a,Z,0,AZ\n0,a,A,0,AA\n0,b,A,1,ε\n1,b,A,1,ε\n1,ε,Z,2,Z"
  );
  const [testString, setTestString] = useState("aabb");
  const [error, setError] = useState("");

  // Simulation result state
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const states = Array.from({ length: stateCount }, (_, i) => i);

  function parseTransitions() {
    return rawTransitions
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",");
        if (parts.length !== 5) {
          throw new Error(
            `Malformed transition line: "${line}"\nFormat required: from,input,stackTop,to,stackPush`
          );
        }
        const from = parseInt(parts[0]);
        const input = parts[1].trim();
        const stackTop = parts[2].trim();
        const to = parseInt(parts[3]);
        const stackPush = parts[4].trim();
        if (isNaN(from) || isNaN(to)) {
          throw new Error(`State identifiers must be numbers in: "${line}"`);
        }
        return { from, input, stackTop, to, stackPush };
      });
  }

  function handleSimulate() {
    setError("");
    setResult(null);
    setStepIndex(0);
    try {
      if (!initialStack.trim()) {
        throw new Error("Initial stack symbol cannot be empty (e.g. 'Z').");
      }
      if (acceptStates.length === 0) {
        throw new Error("Please select at least one accepting state.");
      }
      const transitions = parseTransitions();
      const res = simulatePDA(
        states,
        transitions,
        startState,
        initialStack.trim(),
        acceptStates,
        testString
      );
      setResult(res);
    } catch (e) {
      setError(e.message);
    }
  }

  function loadExample(key) {
    const ex = PDA_EXAMPLES[key];
    if (!ex) return;
    setStateCount(ex.states.length);
    setStartState(ex.start);
    setAcceptStates([...ex.accept]);
    setInitialStack(ex.initialStack);
    setRawTransitions(
      ex.transitions
        .map((t) => `${t.from},${t.input},${t.stackTop},${t.to},${t.stackPush}`)
        .join("\n")
    );
    setTestString(ex.testInput);
    setResult(null);
    setError("");
    setStepIndex(0);
  }

  function toggleAccept(id) {
    setAcceptStates((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const currentStep = result?.stepLog?.[stepIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Simulator</span>
            </Link>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl text-white shadow-md">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Pushdown Automata (PDA) Simulator
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Context-Free Languages &amp; Stack Machine Execution
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Canvas Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {/* Preset Selector Banner */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">
              Preset Context-Free Languages:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(PDA_EXAMPLES).map(([key, ex]) => (
              <button
                key={key}
                onClick={() => loadExample(key)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white font-mono text-xs rounded-xl border border-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: PDA Specification Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Define Pushdown Automaton</span>
            </h2>

            {/* State Count & Start State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  States Count (|Q|)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={stateCount}
                  onChange={(e) => {
                    setStateCount(Math.max(1, parseInt(e.target.value) || 1));
                    setAcceptStates([]);
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Start State (q₀)
                </label>
                <select
                  value={startState}
                  onChange={(e) => setStartState(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      q{s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accepting States */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Accepting States (F)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {states.map((s) => {
                  const isAccepted = acceptStates.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleAccept(s)}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                        isAccepted
                          ? "bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm shadow-emerald-900/30"
                          : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {isAccepted ? `✓ q${s}` : `q${s}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Initial Stack Symbol */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Initial Stack Symbol (Z₀)
              </label>
              <input
                type="text"
                maxLength={2}
                value={initialStack}
                onChange={(e) => setInitialStack(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
                placeholder="Z"
              />
            </div>

            {/* Transitions Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Transitions (δ)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  from,input,stackTop,to,stackPush
                </span>
              </div>
              <textarea
                value={rawTransitions}
                onChange={(e) => setRawTransitions(e.target.value)}
                rows={7}
                spellCheck={false}
                placeholder={"0,a,Z,0,AZ\n0,b,A,1,ε\n1,ε,Z,2,Z"}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Use <code className="text-amber-400 font-bold">ε</code> for empty transitions or pop without push.
              </p>
            </div>

            {/* Test String */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Input String (w)
              </label>
              <input
                type="text"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="e.g. aabb or aaabbb"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleSimulate}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4" />
              <span>Simulate PDA Execution</span>
            </button>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs font-mono whitespace-pre-line">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Simulation Output (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {result ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Verdict Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-lg ${
                    result.accepted
                      ? "bg-emerald-950/60 border-emerald-800 text-emerald-200 shadow-emerald-950/20"
                      : "bg-rose-950/60 border-rose-800 text-rose-200 shadow-rose-950/20"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-950/40">
                    {result.accepted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      {result.accepted
                        ? "STRING ACCEPTED BY PDA"
                        : "STRING REJECTED BY PDA"}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      {result.accepted
                        ? `The PDA successfully consumed all input and halted in an accepting state (${result.stepLog.length} steps).`
                        : result.hitLimit
                        ? "Simulation halted: Maximum step limit reached without reaching acceptance."
                        : "No valid transition path leads to an accepting state."}
                    </p>
                  </div>
                </div>

                {/* Step Playback Controls & Stack Inspector */}
                {result.stepLog.length > 0 && (
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-slate-200">
                          Step Playback
                        </span>
                        <span className="text-[11px] text-slate-500 ml-2 font-mono">
                          ({result.stepLog.length} total transitions)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          onClick={() => setStepIndex(0)}
                          disabled={stepIndex === 0}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
                          title="Reset to initial state"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStepIndex((p) => Math.max(0, p - 1))}
                          disabled={stepIndex === 0}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
                          title="Previous step"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-xs font-mono font-bold text-indigo-300">
                          {stepIndex + 1} / {result.stepLog.length}
                        </span>
                        <button
                          onClick={() =>
                            setStepIndex((p) =>
                              Math.min(result.stepLog.length - 1, p + 1)
                            )
                          }
                          disabled={stepIndex === result.stepLog.length - 1}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
                          title="Next step"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step Details & Physical Stack Layout */}
                    {currentStep && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Step Parameters (8 cols) */}
                        <div className="md:col-span-8 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800/80 rounded-lg text-xs font-mono font-bold">
                              Step {currentStep.stepNum}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              State Transition:{" "}
                              <span className="text-amber-400 font-bold">
                                q{currentStep.state}
                              </span>{" "}
                              →{" "}
                              <span className="text-cyan-400 font-bold">
                                q{currentStep.nextState}
                              </span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Read Symbol
                              </span>
                              <span className="font-mono text-sm font-bold text-indigo-300">
                                {currentStep.readInput === "ε"
                                  ? "ε (Epsilon)"
                                  : currentStep.readInput}
                              </span>
                            </div>

                            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Stack Top Pop
                              </span>
                              <span className="font-mono text-sm font-bold text-amber-300">
                                {currentStep.stackTop}
                              </span>
                            </div>

                            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Stack Action
                              </span>
                              <span className="font-bold text-slate-200">
                                {currentStep.action}
                              </span>
                            </div>

                            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Remaining Tape
                              </span>
                              <span className="font-mono text-xs font-bold text-cyan-300 truncate block">
                                {currentStep.remainingInput || "ε (consumed)"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Physical Stack Tower (4 cols) */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            STACK (Top ↓ Bottom)
                          </span>

                          <div className="w-24 min-h-[140px] max-h-[180px] overflow-y-auto flex flex-col-reverse justify-end gap-1.5 p-2 bg-slate-900 border-2 border-dashed border-indigo-500/40 rounded-xl">
                            {currentStep.stackAfter.length === 0 ? (
                              <div className="text-center py-6 text-[10px] text-slate-600 font-mono">
                                (Empty Stack)
                              </div>
                            ) : (
                              currentStep.stackAfter.map((sym, idx) => {
                                const isTop = idx === currentStep.stackAfter.length - 1;
                                return (
                                  <div
                                    key={idx}
                                    className={`w-full py-1 text-center font-mono font-bold text-xs rounded-lg shadow transition-all ${
                                      isTop
                                        ? "bg-amber-500 text-slate-950 shadow-amber-500/30 scale-105"
                                        : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                                    }`}
                                  >
                                    {sym} {isTop && <span className="text-[9px]">◄ TOP</span>}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step Execution Log Table */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Full Execution Step Log
                      </span>
                      <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-56 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs font-mono">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                            <tr>
                              <th className="py-2 px-3 font-semibold">Step</th>
                              <th className="py-2 px-3 font-semibold">State</th>
                              <th className="py-2 px-3 font-semibold text-center">Read</th>
                              <th className="py-2 px-3 font-semibold text-center">Stack Top</th>
                              <th className="py-2 px-3 font-semibold">Action</th>
                              <th className="py-2 px-3 font-semibold">Next</th>
                              <th className="py-2 px-3 font-semibold">Remaining</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                            {result.stepLog.map((s, i) => {
                              const isActive = i === stepIndex;
                              return (
                                <tr
                                  key={i}
                                  onClick={() => setStepIndex(i)}
                                  className={`transition-colors cursor-pointer ${
                                    isActive
                                      ? "bg-indigo-600/30 text-white font-bold"
                                      : "hover:bg-slate-800/40 text-slate-300"
                                  }`}
                                >
                                  <td className="py-2 px-3 text-indigo-400">
                                    {s.stepNum}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-amber-300">
                                    q{s.state}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {s.readInput}
                                  </td>
                                  <td className="py-2 px-3 text-center text-amber-400">
                                    {s.stackTop}
                                  </td>
                                  <td className="py-2 px-3 text-slate-200">
                                    {s.action}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-cyan-300">
                                    q{s.nextState}
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 truncate max-w-[90px]">
                                    {s.remainingInput || "ε"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <Database className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-300">
                  Ready to Simulate PDA
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Configure your pushdown automaton on the left or select a preset example (e.g.{" "}
                  <span className="text-indigo-400 font-mono">L = {"{aⁿbⁿ}"}</span> or Palindromes), then click <strong className="text-slate-300">"Simulate PDA Execution"</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
