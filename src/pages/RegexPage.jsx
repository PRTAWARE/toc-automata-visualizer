import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { convertPattern } from "../api/convertApi.js";
import { useAutomata } from "../context/AutomataContext";
import { ArrowLeft, Sparkles, Wand2, Layers, Table, CheckCircle2, Play, Cpu } from "lucide-react";

const PRESET_EXAMPLES = [
  { label: "a(b|c)*d", desc: "Alternation & Star" },
  { label: "(a|b)*abb", desc: "Ends with abb" },
  { label: "1(0|1)*", desc: "Binary starting with 1" },
  { label: "ab?c+", desc: "Optional & Plus" },
  { label: "(0|1)*01", desc: "Binary ending with 01" }
];

export default function RegexPage() {
  const [pattern, setPattern] = useState("(a|b)*abb");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dfa");
  const navigate = useNavigate();
  const { setAutomaton } = useAutomata();

  async function handleConvert(regexToRun) {
    const target = (regexToRun ?? pattern).trim();
    if (!target) {
      setError("Please enter a regular expression pattern.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await convertPattern(target);
      setResult(data);
    } catch (err) {
      setError(err?.message || "Failed to convert regular expression.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLoadDfa() {
    if (!result?.dfa) return;
    const dfa = result.dfa;
    const isFinalSet = new Set(dfa.accept);
    const alphabet = [
      ...new Set(
        dfa.transitions
          .map((t) => t.symbol)
          .filter((s) => s && s !== "ε")
      )
    ];

    const states = dfa.states.map((s, idx) => {
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

    const transitions = dfa.transitions.map((t, i) => ({
      id: `t_dfa_${i}`,
      from: `D${t.from}`,
      to: `D${t.to}`,
      symbol: t.symbol
    }));

    setAutomaton({
      id: `dfa-regex-${Date.now()}`,
      title: `DFA: /${result.regex}/`,
      description: `Constructed from regex /${result.regex}/ via Thompson & Subset Construction`,
      type: "DFA",
      alphabet: alphabet.length > 0 ? alphabet : ["a", "b"],
      states,
      transitions
    });
    navigate("/");
  }

  function handleLoadNfa() {
    if (!result?.nfa) return;
    const nfa = result.nfa;
    const isFinalSet = new Set(nfa.accept);
    const alphabet = nfa.alphabet || [
      ...new Set(nfa.transitions.map((t) => t.symbol).filter((s) => s !== "ε"))
    ];

    const states = nfa.states.map((s, idx) => {
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

    const transitions = nfa.transitions.map((t, i) => ({
      id: `t_nfa_${i}`,
      from: `q${t.from}`,
      to: `q${t.to}`,
      symbol: t.symbol
    }));

    setAutomaton({
      id: `enfa-regex-${Date.now()}`,
      title: `ε-NFA: /${result.regex}/`,
      description: `Thompson's Construction for regex /${result.regex}/`,
      type: "ENFA",
      alphabet: alphabet.length > 0 ? alphabet : ["a", "b"],
      states,
      transitions
    });
    navigate("/");
  }

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
              <div className="p-2 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-xl text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Regex → Automata Studio
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Thompson's ε-NFA &amp; Subset Construction DFA
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Canvas Simulator</span>
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {/* Input Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Enter Regular Expression</span>
            </h2>
            <p className="text-xs text-slate-400">
              Supports literals, union (<code className="text-indigo-400 font-bold">|</code>), concatenation, Kleene star (<code className="text-indigo-400 font-bold">*</code>), plus (<code className="text-indigo-400 font-bold">+</code>), optional (<code className="text-indigo-400 font-bold">?</code>), and grouping.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConvert();
              }}
              placeholder="e.g. (a|b)*abb or a(b|c)*d"
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 shadow-inner"
            />
            <button
              onClick={() => handleConvert()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isLoading ? "Building..." : "Build Automata"}</span>
            </button>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium">Quick Examples:</span>
            {PRESET_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => {
                  setPattern(ex.label);
                  handleConvert(ex.label);
                }}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-indigo-300 font-mono text-xs rounded-lg border border-slate-800 transition-colors cursor-pointer"
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

        {/* Empty state */}
        {!result && !error && (
          <div className="text-center py-16 text-slate-500 space-y-2 bg-slate-900/30 rounded-2xl border border-slate-800/40">
            <Sparkles className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
            <p className="text-sm font-medium text-slate-400">
              Enter any pattern above and click "Build Automata".
            </p>
            <p className="text-xs text-slate-500">
              The platform will parse your expression, compute the Thompson ε-NFA, and build the minimal equivalent DFA matrix.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Quick Metrics & Load Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Active Regex:</span>
                <span className="font-mono font-bold text-sm text-indigo-300 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800">
                  /{result.regex}/
                </span>
              </div>

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
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pattern</span>
                <p className="text-base font-bold font-mono text-indigo-300 mt-0.5 truncate">
                  /{result.regex}/
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Thompson ε-NFA</span>
                <p className="text-base font-bold font-mono text-purple-300 mt-0.5">
                  {result.nfa?.states?.length || 0} States
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Equivalent DFA</span>
                <p className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                  {result.dfa?.states?.length || 0} States
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Alphabet Σ</span>
                <p className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                  {'{'}{(result.dfa?.transitions ? [...new Set(result.dfa.transitions.map((t) => t.symbol).filter((s) => s !== "ε"))] : []).join(", ")}{'}'}
                </p>
              </div>
            </div>

            {/* Tabbed Result Inspection */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center bg-slate-950/80 p-1.5 border-b border-slate-800">
                <button
                  onClick={() => setActiveTab("dfa")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "dfa"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>DFA Transition Matrix &amp; Subsets</span>
                </button>
                <button
                  onClick={() => setActiveTab("nfa")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "nfa"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Thompson ε-NFA Transitions</span>
                </button>
                <button
                  onClick={() => setActiveTab("steps")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "steps"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Construction Log</span>
                </button>
              </div>

              <div className="p-5">
                {activeTab === "dfa" && result.dfa && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-semibold">DFA State</th>
                            <th className="py-3 px-4 font-semibold">Composite Subset (NFA States)</th>
                            {[...new Set(result.dfa.transitions.map((t) => t.symbol).filter((s) => s !== "ε"))].map((sym) => (
                              <th key={sym} className="py-3 px-4 font-semibold text-center text-indigo-300">
                                δ(State, '{sym}')
                              </th>
                            ))}
                            <th className="py-3 px-4 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                          {result.dfa.states.map((s) => {
                            const isStart = s === result.dfa.start;
                            const isFinal = result.dfa.accept.includes(s);
                            const subset = result.dfa.stateLabels?.[s] || `D${s}`;
                            const alphabetList = [...new Set(result.dfa.transitions.map((t) => t.symbol).filter((sym) => sym !== "ε"))];

                            return (
                              <tr key={s} className="hover:bg-slate-800/40">
                                <td className="py-3 px-4 font-bold text-slate-100">
                                  <span className="text-amber-400 mr-1.5 font-bold">
                                    {isStart && isFinal ? "→ *" : isStart ? "→" : isFinal ? "*" : ""}
                                  </span>
                                  D{s}
                                </td>
                                <td className="py-3 px-4 text-cyan-300 font-semibold">
                                  {subset}
                                </td>
                                {alphabetList.map((sym) => {
                                  const trans = result.dfa.transitions.find(
                                    (t) => t.from === s && t.symbol === sym
                                  );
                                  return (
                                    <td key={sym} className="py-3 px-4 text-center text-slate-200">
                                      {trans ? `D${trans.to}` : <span className="text-slate-600">∅ (Trap)</span>}
                                    </td>
                                  );
                                })}
                                <td className="py-3 px-4 text-center">
                                  {isFinal ? (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                                      ACCEPTING
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-medium">Non-Final</span>
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

                {activeTab === "nfa" && result.nfa && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-semibold">From State</th>
                            <th className="py-3 px-4 font-semibold text-center">Symbol</th>
                            <th className="py-3 px-4 font-semibold">To State</th>
                            <th className="py-3 px-4 font-semibold text-center">Rule / Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                          {result.nfa.transitions.map((t, idx) => {
                            const isEpsilon = t.symbol === "ε";
                            return (
                              <tr key={idx} className="hover:bg-slate-800/40">
                                <td className="py-2.5 px-4 font-bold text-slate-200">
                                  q{t.from}
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-md font-bold ${
                                      isEpsilon
                                        ? "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                                        : "bg-indigo-950/60 text-indigo-300 border border-indigo-800/60"
                                    }`}
                                  >
                                    {t.symbol}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-bold text-slate-200">
                                  q{t.to}
                                </td>
                                <td className="py-2.5 px-4 text-center text-slate-400">
                                  {isEpsilon ? "Thompson ε-Gluing Transition" : "Literal Match"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "steps" && (
                  <div className="space-y-2">
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {(result.dfa?.steps || result.nfa?.steps || []).map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold text-[11px]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-mono whitespace-pre-wrap">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
