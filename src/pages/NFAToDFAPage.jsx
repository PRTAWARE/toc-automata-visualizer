import React, { useState } from "react";
import AutomatonDiagram from "../components/AutomatonDiagram.jsx";
import TransitionTable from "../components/TransitionTable.jsx";
import { convertNFAtoDFA } from "../algorithms/nfaToDfa.js";
import "./RegexPage.css";
import "./FASimulatorPage.css";
import "./NFAToDFAPage.css";

// ── Built-in examples ─────────────────────────────────────────
const EXAMPLES = {
  simple: {
    label: "Simple NFA — (a|b)*",
    states: [0, 1, 2, 3],
    alphabet: ["a", "b"],
    start: 0,
    accept: [3],
    transitions: [
      { from: 0, to: 1, symbol: "ε" },
      { from: 0, to: 2, symbol: "ε" },
      { from: 1, to: 3, symbol: "a" },
      { from: 2, to: 3, symbol: "b" },
      { from: 3, to: 0, symbol: "ε" },
    ],
  },
  contains01: {
    label: "NFA: strings containing 01",
    states: [0, 1, 2],
    alphabet: ["0", "1"],
    start: 0,
    accept: [2],
    transitions: [
      { from: 0, to: 0, symbol: "0" },
      { from: 0, to: 0, symbol: "1" },
      { from: 0, to: 1, symbol: "0" },
      { from: 1, to: 2, symbol: "1" },
      { from: 2, to: 2, symbol: "0" },
      { from: 2, to: 2, symbol: "1" },
    ],
  },
  endsWith1: {
    label: "NFA: binary strings ending in 1",
    states: [0, 1],
    alphabet: ["0", "1"],
    start: 0,
    accept: [1],
    transitions: [
      { from: 0, to: 0, symbol: "0" },
      { from: 0, to: 0, symbol: "1" },
      { from: 0, to: 1, symbol: "1" },
    ],
  },
};

export default function NFAToDFAPage() {
  // ── Form state ──────────────────────────────────────────────
  const [stateCount, setStateCount] = useState(4);
  const [startState, setStartState] = useState(0);
  const [acceptStates, setAcceptStates] = useState([3]);
  const [alphabet, setAlphabet] = useState("a,b");
  const [rawTransitions, setRawTransitions] = useState(
    "0,ε,1\n0,ε,2\n1,a,3\n2,b,3\n3,ε,0"
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const states = Array.from({ length: stateCount }, (_, i) => i);
  const alphabetArr = alphabet.split(",").map((s) => s.trim()).filter(Boolean);

  // Parse transitions: "from,symbol,to" per line
  function parseTransitions() {
    return rawTransitions
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",");
        if (parts.length !== 3)
          throw new Error(`Bad line: "${line}" — use: from,symbol,to`);
        const from = parseInt(parts[0]);
        const symbol = parts[1].trim();
        const to = parseInt(parts[2]);
        if (isNaN(from) || isNaN(to))
          throw new Error(`State IDs must be numbers in: "${line}"`);
        return { from, to, symbol };
      });
  }

  function handleConvert() {
    setError("");
    setResult(null);
    try {
      if (!alphabetArr.length) throw new Error("Alphabet cannot be empty.");
      const transitions = parseTransitions();
      const dfa = convertNFAtoDFA(
        states,
        transitions,
        startState,
        acceptStates,
        alphabetArr
      );
      setResult({
        nfa: { states, transitions, start: startState, accept: acceptStates },
        dfa,
      });
    } catch (e) {
      setError(e.message);
    }
  }

  function loadExample(key) {
    const ex = EXAMPLES[key];
    setStateCount(ex.states.length);
    setStartState(ex.start);
    setAcceptStates([...ex.accept]);
    setAlphabet(ex.alphabet.join(","));
    setRawTransitions(
      ex.transitions.map((t) => `${t.from},${t.symbol},${t.to}`).join("\n")
    );
    setResult(null);
    setError("");
  }

  function toggleAccept(id) {
    setAcceptStates((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>NFA → DFA Converter</h1>
        <p>
          Define an NFA (ε-transitions allowed) and the{" "}
          <strong>Subset Construction</strong> algorithm converts it to an
          equivalent DFA. Every step is explained below.
        </p>
      </header>

      {/* Examples */}
      <div className="fa-examples">
        <span>Load example:</span>
        {Object.entries(EXAMPLES).map(([k, ex]) => (
          <button
            key={k}
            className="btn btn--outline"
            onClick={() => loadExample(k)}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="fa-layout">
        {/* ── Builder form ── */}
        <aside className="fa-builder">
          <h2 className="fa-builder__title">Define NFA</h2>

          <div className="fa-field">
            <label className="fa-label" htmlFor="nfa-sc">
              Number of States
            </label>
            <input
              id="nfa-sc"
              type="number"
              min="1"
              max="15"
              value={stateCount}
              onChange={(e) => {
                setStateCount(Math.max(1, parseInt(e.target.value) || 1));
                setAcceptStates([]);
              }}
              className="fa-input"
            />
            <p className="fa-hint">States numbered q0 to q{stateCount - 1}</p>
          </div>

          <div className="fa-field">
            <label className="fa-label" htmlFor="nfa-ss">
              Start State
            </label>
            <select
              id="nfa-ss"
              value={startState}
              onChange={(e) => setStartState(Number(e.target.value))}
              className="fa-input"
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  q{s}
                </option>
              ))}
            </select>
          </div>

          <div className="fa-field">
            <label className="fa-label">Accepting States</label>
            <div className="fa-check-row">
              {states.map((s) => (
                <label key={s} className="fa-check">
                  <input
                    type="checkbox"
                    checked={acceptStates.includes(s)}
                    onChange={() => toggleAccept(s)}
                  />
                  q{s}
                </label>
              ))}
            </div>
          </div>

          <div className="fa-field">
            <label className="fa-label" htmlFor="nfa-alph">
              Input Alphabet (comma-separated, no ε)
            </label>
            <input
              id="nfa-alph"
              type="text"
              value={alphabet}
              onChange={(e) => setAlphabet(e.target.value)}
              placeholder="a,b"
              className="fa-input"
            />
            <p className="fa-hint">
              Do NOT list ε here — use <code>ε</code> only in transitions.
            </p>
          </div>

          <div className="fa-field">
            <label className="fa-label" htmlFor="nfa-tr">
              Transitions — from,symbol,to (use ε for epsilon)
            </label>
            <textarea
              id="nfa-tr"
              value={rawTransitions}
              onChange={(e) => setRawTransitions(e.target.value)}
              rows={9}
              className="fa-textarea"
              spellCheck={false}
              placeholder={"0,ε,1\n1,a,2"}
            />
          </div>

          <button
            className="btn btn--primary fa-build-btn"
            onClick={handleConvert}
          >
            ⇒ Convert NFA → DFA
          </button>
          {error && <div className="fa-error">{error}</div>}
        </aside>

        {/* ── Output ── */}
        <main className="fa-output">
          {result ? (
            <>
              {/* NFA + DFA side by side */}
              <div className="nfa-dfa-row">
                <section className="fa-section">
                  <h2>Original NFA</h2>
                  <AutomatonDiagram
                    states={result.nfa.states}
                    start={result.nfa.start}
                    accept={result.nfa.accept}
                    transitions={result.nfa.transitions}
                  />
                  <h3 className="nfa-sub-heading">NFA Transition Table</h3>
                  <TransitionTable
                    states={result.nfa.states}
                    transitions={result.nfa.transitions}
                    start={result.nfa.start}
                    accept={result.nfa.accept}
                  />
                </section>

                <section className="fa-section">
                  <h2>Equivalent DFA</h2>
                  <p className="fa-hint" style={{ marginBottom: 12 }}>
                    Each DFA state = a <em>set</em> of NFA states.
                  </p>
                  <AutomatonDiagram
                    states={result.dfa.states}
                    start={result.dfa.start}
                    accept={result.dfa.accept}
                    transitions={result.dfa.transitions}
                    stateLabels={result.dfa.stateLabels}
                  />
                  <h3 className="nfa-sub-heading">DFA Transition Table</h3>
                  <TransitionTable
                    states={result.dfa.states}
                    transitions={result.dfa.transitions}
                    start={result.dfa.start}
                    accept={result.dfa.accept}
                    stateLabels={result.dfa.stateLabels}
                  />
                </section>
              </div>

              {/* Subset construction step-by-step */}
              <section className="fa-section">
                <h2>Subset Construction — Step by Step</h2>
                <p className="fa-hint" style={{ marginBottom: 14 }}>
                  Each new DFA state is the ε-closure of the set of NFA states
                  reachable after reading one symbol. Follow each step below to
                  understand how the DFA is built.
                </p>
                <ol className="step-log">
                  {result.dfa.steps.map((step, i) => (
                    <li key={i} className="step-log__item">
                      <span className="step-log__index">{i + 1}</span>
                      <span
                        className="step-log__text"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          ) : (
            <div className="fa-empty">
              <div className="fa-empty__icon">⇒</div>
              <p>
                Define an NFA on the left and click{" "}
                <strong>Convert NFA → DFA</strong>.
              </p>
              <p>Load an example above to see it in action immediately.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
