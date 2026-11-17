import React, { useState } from "react";
import { Link } from "react-router-dom";
import { simulateTM, TM_EXAMPLES } from "../algorithms/tmSimulate.js";
import {
  ArrowLeft,
  Disc,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  Info
} from "lucide-react";

export default function TuringMachinePage() {
  // Machine definition state
  const [rawStates, setRawStates] = useState("q0,q1,q2,q3,qaccept,qreject");
  const [startState, setStartState] = useState("q0");
  const [acceptState, setAcceptState] = useState("qaccept");
  const [rejectState, setRejectState] = useState("qreject");
  const [blank, setBlank] = useState("B");
  const [rawTransitions, setRawTransitions] = useState(
    "q0,X,q0,X,R\nq0,Y,q3,Y,R\nq0,B,qaccept,B,S\nq0,0,q1,X,R\nq1,0,q1,0,R\nq1,Y,q1,Y,R\nq1,1,q2,Y,L\nq1,B,qreject,B,S\nq2,0,q2,0,L\nq2,Y,q2,Y,L\nq2,X,q0,X,R\nq3,Y,q3,Y,R\nq3,B,qaccept,B,S\nq3,1,qreject,1,S"
  );
  const [testInput, setTestInput] = useState("0011");
  const [maxSteps, setMaxSteps] = useState(250);
  const [error, setError] = useState("");

  // Simulation result state
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  function parseTransitions() {
    return rawTransitions
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",");
        if (parts.length !== 5) {
          throw new Error(
            `Malformed line: "${line}"\nFormat required: state,read,nextState,write,dir`
          );
        }
        return {
          state: parts[0].trim(),
          read: parts[1].trim(),
          nextState: parts[2].trim(),
          write: parts[3].trim(),
          dir: parts[4].trim().toUpperCase(),
        };
      });
  }

  function handleSimulate() {
    setError("");
    setResult(null);
    setStepIndex(0);
    try {
      const statesArr = rawStates.split(",").map((s) => s.trim()).filter(Boolean);
      if (statesArr.length === 0) throw new Error("Define at least one state.");
      if (!startState.trim()) throw new Error("Start state cannot be empty.");
      if (!blank.trim()) throw new Error("Blank symbol cannot be empty.");
      const transitions = parseTransitions();
      const res = simulateTM(
        statesArr,
        transitions,
        startState.trim(),
        acceptState.trim(),
        rejectState.trim(),
        blank.trim(),
        testInput,
        maxSteps
      );
      setResult(res);
    } catch (e) {
      setError(e.message);
    }
  }

  function loadExample(key) {
    const ex = TM_EXAMPLES[key];
    if (!ex) return;
    setRawStates(ex.states.join(","));
    setStartState(ex.start);
    setAcceptState(ex.accept);
    setRejectState(ex.reject);
    setBlank(ex.blank);
    setRawTransitions(
      ex.transitions
        .map((t) => `${t.state},${t.read},${t.nextState},${t.write},${t.dir}`)
        .join("\n")
    );
    setTestInput(ex.testInput);
    setResult(null);
    setError("");
    setStepIndex(0);
  }

  function renderTape(tape, head) {
    if (!tape) return null;
    const windowStart = Math.max(0, head - 6);
    const windowEnd = Math.min(tape.length - 1, head + 8);
    const cells = [];
    if (windowStart > 0) cells.push({ sym: "…", isHead: false, key: "left-ellipsis" });
    for (let i = windowStart; i <= windowEnd; i++) {
      cells.push({ sym: tape[i], isHead: i === head, key: i });
    }
    if (windowEnd < tape.length - 1) cells.push({ sym: "…", isHead: false, key: "right-ellipsis" });
    return cells;
  }

  const currentStep = result?.stepLog?.[stepIndex];
  const tapeCells = currentStep
    ? renderTape(currentStep.tape, currentStep.head)
    : result
    ? renderTape(result.tape, result.head)
    : null;

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
              <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white shadow-md">
                <Disc className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Turing Machine Simulator
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Universal Computation, Tape Head Movement &amp; Halting Logic
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
        {/* Presets Bar */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">
              Preset Turing Machines:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(TM_EXAMPLES).map(([key, ex]) => (
              <button
                key={key}
                onClick={() => loadExample(key)}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 hover:text-white font-mono text-xs rounded-xl border border-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: TM Builder Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Disc className="w-4 h-4 text-cyan-400" />
              <span>Define Turing Machine</span>
            </h2>

            {/* States */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                States (comma-separated)
              </label>
              <input
                type="text"
                value={rawStates}
                onChange={(e) => setRawStates(e.target.value)}
                placeholder="q0,q1,qaccept,qreject"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            {/* Start, Accept & Reject States */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Start State
                </label>
                <input
                  type="text"
                  value={startState}
                  onChange={(e) => setStartState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Accept State
                </label>
                <input
                  type="text"
                  value={acceptState}
                  onChange={(e) => setAcceptState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Reject State
                </label>
                <input
                  type="text"
                  value={rejectState}
                  onChange={(e) => setRejectState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-cyan-500 shadow-inner"
                />
              </div>
            </div>

            {/* Blank Symbol & Step Limit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Blank Symbol
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={blank}
                  onChange={(e) => setBlank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Max Steps Limit
                </label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={maxSteps}
                  onChange={(e) => setMaxSteps(Math.max(10, parseInt(e.target.value) || 200))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 shadow-inner"
                />
              </div>
            </div>

            {/* Transitions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Transitions (δ)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  state,read,nextState,write,dir
                </span>
              </div>
              <textarea
                value={rawTransitions}
                onChange={(e) => setRawTransitions(e.target.value)}
                rows={8}
                spellCheck={false}
                placeholder={"q0,0,q1,X,R\nq1,1,q2,Y,L"}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 shadow-inner leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Direction: <code className="text-cyan-400 font-bold">R</code> = Right, <code className="text-cyan-400 font-bold">L</code> = Left, <code className="text-cyan-400 font-bold">S</code> = Stay.
              </p>
            </div>

            {/* Input Tape */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Initial Tape Input
              </label>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="e.g. 0011"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            {/* Simulate Button */}
            <button
              onClick={handleSimulate}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4" />
              <span>Simulate Turing Machine</span>
            </button>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs font-mono whitespace-pre-line">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Tape Visualizer & Stepper (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {result ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Verdict Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-lg ${
                    result.result === "accept"
                      ? "bg-emerald-950/60 border-emerald-800 text-emerald-200 shadow-emerald-950/20"
                      : result.result === "reject"
                      ? "bg-rose-950/60 border-rose-800 text-rose-200 shadow-rose-950/20"
                      : "bg-amber-950/60 border-amber-800 text-amber-200 shadow-amber-950/20"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-950/40">
                    {result.result === "accept" && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                    {result.result === "reject" && (
                      <XCircle className="w-6 h-6 text-rose-400" />
                    )}
                    {result.result === "limit" && (
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight uppercase">
                      {result.result === "accept"
                        ? "MACHINE HALTED IN ACCEPT STATE"
                        : result.result === "reject"
                        ? "MACHINE HALTED IN REJECT STATE"
                        : "STEP SAFETY LIMIT REACHED"}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      {result.message} ({result.stepLog.length} steps simulated)
                    </p>
                  </div>
                </div>

                {/* Tape Display & Stepper */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                  {/* Stepper Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        Interactive Tape Head
                      </span>
                      {currentStep && (
                        <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-mono font-bold">
                          State: {currentStep.state}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setStepIndex(0)}
                        disabled={stepIndex === 0}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="Reset to beginning"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStepIndex((p) => Math.max(0, p - 1))}
                        disabled={stepIndex === 0}
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="Step backward"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 text-xs font-mono font-bold text-cyan-300">
                        {result.stepLog.length === 0 ? 0 : stepIndex + 1} / {result.stepLog.length}
                      </span>
                      <button
                        onClick={() =>
                          setStepIndex((p) => Math.min(result.stepLog.length - 1, p + 1))
                        }
                        disabled={
                          result.stepLog.length === 0 ||
                          stepIndex === result.stepLog.length - 1
                        }
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="Step forward"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStepIndex(result.stepLog.length - 1)}
                        disabled={
                          result.stepLog.length === 0 ||
                          stepIndex === result.stepLog.length - 1
                        }
                        className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="Jump to halt"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Tape Cells */}
                  <div className="space-y-2 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Infinite Tape Segment (Tape Head Position Highlighted)
                    </div>

                    <div className="overflow-x-auto p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center min-h-[90px]">
                      {tapeCells && (
                        <div className="flex items-center gap-1.5">
                          {tapeCells.map((cell) => (
                            <div key={cell.key} className="flex flex-col items-center">
                              <div
                                className={`w-11 h-12 flex items-center justify-center font-mono text-base font-bold rounded-xl border transition-all ${
                                  cell.isHead
                                    ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/40 scale-110"
                                    : "bg-slate-900 text-slate-200 border-slate-800"
                                }`}
                              >
                                {cell.sym}
                              </div>
                              {cell.isHead ? (
                                <span className="text-[11px] text-cyan-400 font-bold mt-1">
                                  ▲ HEAD
                                </span>
                              ) : (
                                <span className="text-[11px] text-transparent mt-1">.</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Step Diagnostics */}
                  {currentStep && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Read Symbol
                        </span>
                        <span className="font-mono text-sm font-bold text-cyan-300">
                          '{currentStep.read}'
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Write Symbol
                        </span>
                        <span className="font-mono text-sm font-bold text-amber-300">
                          '{currentStep.write}'
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Head Direction
                        </span>
                        <span className="font-bold text-indigo-300">
                          {currentStep.dir === "R"
                            ? "→ Right"
                            : currentStep.dir === "L"
                            ? "← Left"
                            : "● Stay"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Next State
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {currentStep.nextState}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Execution Log Table */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Execution Step History
                    </span>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-56 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Step</th>
                            <th className="py-2 px-3 font-semibold">State</th>
                            <th className="py-2 px-3 font-semibold text-center">Read</th>
                            <th className="py-2 px-3 font-semibold text-center">Write</th>
                            <th className="py-2 px-3 font-semibold text-center">Dir</th>
                            <th className="py-2 px-3 font-semibold">Next State</th>
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
                                    ? "bg-cyan-600/30 text-white font-bold"
                                    : "hover:bg-slate-800/40 text-slate-300"
                                }`}
                              >
                                <td className="py-2 px-3 text-cyan-400">
                                  {s.stepNum}
                                </td>
                                <td className="py-2 px-3 font-bold text-indigo-300">
                                  {s.state}
                                </td>
                                <td className="py-2 px-3 text-center text-amber-400">
                                  '{s.read}'
                                </td>
                                <td className="py-2 px-3 text-center text-emerald-400">
                                  '{s.write}'
                                </td>
                                <td className="py-2 px-3 text-center font-bold">
                                  {s.dir}
                                </td>
                                <td className="py-2 px-3 font-bold text-cyan-300">
                                  {s.nextState}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <Disc className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-300">
                  Ready to Simulate Turing Machine
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Configure your 5-tuple transitions on the left or select a preset example (e.g.{" "}
                  <span className="text-cyan-400 font-mono">0ⁿ1ⁿ Equal Zeros &amp; Ones</span>), then click <strong className="text-slate-300">"Simulate Turing Machine"</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
