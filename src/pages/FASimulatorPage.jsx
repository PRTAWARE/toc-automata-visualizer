import React, { useState } from "react";
import AutomatonDiagram from "../components/AutomatonDiagram.jsx";
import TransitionTable from "../components/TransitionTable.jsx";
import { simulateDFA, simulateNFA } from "../algorithms/faSimulate.js";
import "./RegexPage.css";
import "./FASimulatorPage.css";

// ── Built-in examples ─────────────────────────────────────────
const EXAMPLES = {
  dfa_ends01: {
    label: "DFA: ends with 01",
    type: "dfa",
    states: [0, 1, 2],
    alphabet: ["0", "1"],
    start: 0,
    accept: [2],
    transitions: [
      { from: 0, to: 0, symbol: "1" },
      { from: 0, to: 1, symbol: "0" },
      { from: 1, to: 1, symbol: "0" },
      { from: 1, to: 2, symbol: "1" },
      { from: 2, to: 1, symbol: "0" },
      { from: 2, to: 0, symbol: "1" },
    ],
    testString: "1001",
  },
  nfa_contains01: {
    label: "NFA: contains 01",
    type: "nfa",
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
    testString: "1001",
  },
  dfa_even0s: {
    label: "DFA: even number of 0s",
    type: "dfa",
    states: [0, 1],
    alphabet: ["0", "1"],
    start: 0,
    accept: [0],
    transitions: [
      { from: 0, to: 1, symbol: "0" },
      { from: 0, to: 0, symbol: "1" },
      { from: 1, to: 0, symbol: "0" },
      { from: 1, to: 1, symbol: "1" },
    ],
    testString: "100100",
  },
};

export default function FASimulatorPage() {
  // ── Form state ──────────────────────────────────────────────
  const [type, setType] = useState("dfa");
  const [stateCount, setStateCount] = useState(3);
  const [startState, setStartState] = useState(0);
  const [acceptStates, setAcceptStates] = useState([2]);
  const [alphabet, setAlphabet] = useState("a,b");
  const [rawTransitions, setRawTransitions] = useState(
    "0,a,1\n1,b,2\n2,a,2\n2,b,0"
  );
  const [testString, setTestString] = useState("abb");
  const [error, setError] = useState("");

  // ── Simulation result state ─────────────────────────────────
  const [simResult, setSimResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [builtAutomaton, setBuiltAutomaton] = useState(null);

  // Derived: state id array
  const states = Array.from({ length: stateCount }, (_, i) => i);
  const alphabetArr = alphabet.split(",").map((s) => s.trim()).filter(Boolean);

  // Parse transitions from textarea: "from,symbol,to" per line
  function parseTransitions() {
    const lines = rawTransitions.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const parts = line.split(",");
      if (parts.length !== 3)
        throw new Error(`Bad transition: "${line}" — use: from,symbol,to`);
      const from = parseInt(parts[0]);
      const symbol = parts[1].trim();
      const to = parseInt(parts[2]);
      if (isNaN(from) || isNaN(to))
        throw new Error(`State IDs must be numbers in: "${line}"`);
      if (!states.includes(from) || !states.includes(to))
        throw new Error(`State out of range in: "${line}"`);
      return { from, to, symbol };
    });
  }

  function buildAndSimulate() {
    setError("");
    setSimResult(null);
    setCurrentStep(0);
    try {
      if (stateCount < 1) throw new Error("Need at least 1 state.");
      if (!alphabetArr.length) throw new Error("Alphabet cannot be empty.");
      if (acceptStates.length === 0)
        throw new Error("Select at least one accepting state.");
      const transitions = parseTransitions();
      const automaton = {
        states,
        transitions,
        start: startState,
        accept: acceptStates,
        alphabet: alphabetArr,
      };
      setBuiltAutomaton(automaton);

      const result =
        type === "dfa"
          ? simulateDFA(states, transitions, startState, acceptStates, testString)
          : simulateNFA(states, transitions, startState, acceptStates, testString);

      setSimResult(result);
      setCurrentStep(0);
    } catch (e) {
      setError(e.message);
    }
  }

  function loadExample(key) {
    const ex = EXAMPLES[key];
    setType(ex.type);
    setStateCount(ex.states.length);
    setStartState(ex.start);
    setAcceptStates([...ex.accept]);
    setAlphabet(ex.alphabet.join(","));
    setRawTransitions(
      ex.transitions.map((t) => `${t.from},${t.symbol},${t.to}`).join("\n")
    );
    setTestString(ex.testString);
    setSimResult(null);
    setBuiltAutomaton(null);
    setError("");
  }

  function toggleAccept(id) {
    setAcceptStates((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  // Highlighted states for the diagram at current step
  const highlightedStates = simResult?.steps[currentStep]?.activeStates ?? [];
  const currentStepData = simResult?.steps[currentStep];

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>DFA &amp; NFA Simulator</h1>
        <p>
          Build a finite automaton using the form, enter a test string, and
          step through the simulation to see each state transition.
        </p>
      </header>

      {/* Examples strip */}
      <div className="fa-examples">
        <span>Load example:</span>
        {Object.entries(EXAMPLES).map(([key, ex]) => (
          <button key={key} className="btn btn--outline" onClick={() => loadExample(key)}>
            {ex.label}
          </button>
        ))}
      </div>

      <div className="fa-layout">
        {/* ── LEFT: Builder form ── */}
        <aside className="fa-builder">
          <h2 className="fa-builder__title">Build Automaton</h2>

          {/* Type selector */}
          <div className="fa-field">
            <label className="fa-label">Type</label>
            <div className="fa-radio-row">
              <label className="fa-radio">
                <input
                  type="radio"
                  name="fatype"
                  value="dfa"
                  checked={type === "dfa"}
                  onChange={() => setType("dfa")}
                />
                DFA (Deterministic)
              </label>
              <label className="fa-radio">
                <input
                  type="radio"
                  name="fatype"
                  value="nfa"
                  checked={type === "nfa"}
                  onChange={() => setType("nfa")}
                />
                NFA (Nondeterministic)
              </label>
            </div>
          </div>

          {/* Number of states */}
          <div className="fa-field">
            <label className="fa-label" htmlFor="fa-stateCount">
              Number of States
            </label>
            <input
              id="fa-stateCount"
              type="number"
              min="1"
              max="20"
              value={stateCount}
              onChange={(e) => {
                const n = Math.max(1, parseInt(e.target.value) || 1);
                setStateCount(n);
                setStartState(0);
                setAcceptStates([]);
              }}
              className="fa-input"
            />
            <p className="fa-hint">
              States will be numbered q0 to q{stateCount - 1}
            </p>
          </div>

          {/* Start state */}
          <div className="fa-field">
            <label className="fa-label" htmlFor="fa-start">
              Start State
            </label>
            <select
              id="fa-start"
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

          {/* Accept states */}
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

          {/* Alphabet */}
          <div className="fa-field">
            <label className="fa-label" htmlFor="fa-alphabet">
              Input Alphabet (comma-separated)
            </label>
            <input
              id="fa-alphabet"
              type="text"
              value={alphabet}
              onChange={(e) => setAlphabet(e.target.value)}
              placeholder="a,b"
              className="fa-input"
            />
            {type === "nfa" && (
              <p className="fa-hint">
                Use <code>ε</code> as a symbol for ε-transitions.
              </p>
            )}
          </div>

          {/* Transitions textarea */}
          <div className="fa-field">
            <label className="fa-label" htmlFor="fa-transitions">
              Transitions — one per line: from,symbol,to
            </label>
            <textarea
              id="fa-transitions"
              value={rawTransitions}
              onChange={(e) => setRawTransitions(e.target.value)}
              rows={7}
              className="fa-textarea"
              spellCheck={false}
              placeholder={"0,a,1\n1,b,2"}
            />
            <p className="fa-hint">
              Example: <code>0,a,1</code> means q0 reads 'a' → q1
            </p>
          </div>

          {/* Test string */}
          <div className="fa-field">
            <label className="fa-label" htmlFor="fa-testString">
              Test String
            </label>
            <input
              id="fa-testString"
              type="text"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="e.g. abb"
              className="fa-input fa-input--mono"
            />
          </div>

          <button className="btn btn--primary fa-build-btn" onClick={buildAndSimulate}>
            ▶ Build &amp; Simulate
          </button>

          {error && <div className="fa-error">{error}</div>}
        </aside>

        {/* ── RIGHT: Visualization + simulation ── */}
        <main className="fa-output">
          {builtAutomaton ? (
            <>
              {/* Diagram section */}
              <section className="fa-section">
                <h2>
                  {type.toUpperCase()} Diagram
                  {simResult && (
                    <span
                      className={`fa-verdict ${
                        simResult.accepted
                          ? "fa-verdict--accept"
                          : "fa-verdict--reject"
                      }`}
                    >
                      {simResult.accepted ? "ACCEPTED ✓" : "REJECTED ✗"}
                    </span>
                  )}
                </h2>
                <AutomatonDiagram
                  states={builtAutomaton.states}
                  start={builtAutomaton.start}
                  accept={builtAutomaton.accept}
                  transitions={builtAutomaton.transitions}
                />
              </section>

              {/* Transition table */}
              <section className="fa-section">
                <h2>Transition Table</h2>
                <TransitionTable
                  states={builtAutomaton.states}
                  transitions={builtAutomaton.transitions}
                  start={builtAutomaton.start}
                  accept={builtAutomaton.accept}
                />
              </section>

              {/* Simulation steps */}
              {simResult && (
                <section className="fa-section">
                  <h2>Simulation Steps</h2>

                  {/* Controls */}
                  <div className="sim-controls">
                    <button
                      className="btn btn--outline"
                      onClick={() => setCurrentStep(0)}
                      disabled={currentStep === 0}
                    >
                      ⟪ Reset
                    </button>
                    <button
                      className="btn btn--outline"
                      onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
                      disabled={currentStep === 0}
                    >
                      ◀ Prev
                    </button>
                    <span className="sim-step-label">
                      Step {currentStep} / {simResult.steps.length - 1}
                    </span>
                    <button
                      className="btn btn--primary"
                      onClick={() =>
                        setCurrentStep((p) =>
                          Math.min(simResult.steps.length - 1, p + 1)
                        )
                      }
                      disabled={currentStep === simResult.steps.length - 1}
                    >
                      Next ▶
                    </button>
                    <button
                      className="btn btn--primary"
                      onClick={() => setCurrentStep(simResult.steps.length - 1)}
                      disabled={currentStep === simResult.steps.length - 1}
                    >
                      End ⟫
                    </button>
                  </div>

                  {/* Input character display */}
                  <div className="sim-input-display">
                    {testString.split("").map((ch, i) => (
                      <span
                        key={i}
                        className={`sim-char ${
                          i < currentStep ? "sim-char--done" : ""
                        } ${
                          i === currentStep - 1 && currentStep > 0
                            ? "sim-char--active"
                            : ""
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                    {testString === "" && (
                      <span className="sim-char sim-char--empty">
                        ε (empty string)
                      </span>
                    )}
                  </div>

                  {/* Current step card */}
                  {currentStepData && (
                    <div className="sim-step-card">
                      <div className="sim-step-desc">
                        {currentStepData.description}
                      </div>
                      <div className="sim-active-states">
                        Active states:{" "}
                        {currentStepData.activeStates.length === 0
                          ? "∅ (none — dead configuration)"
                          : currentStepData.activeStates
                              .map((s) => `q${s}`)
                              .join(", ")}
                      </div>
                    </div>
                  )}

                  {/* Full step log — click any item to jump to that step */}
                  <ol className="sim-log">
                    {simResult.steps.map((step, i) => (
                      <li
                        key={i}
                        className={`sim-log__item ${
                          i === currentStep ? "sim-log__item--active" : ""
                        } ${
                          step.accepted === true ? "sim-log__item--accept" : ""
                        } ${
                          step.accepted === false && step.final
                            ? "sim-log__item--reject"
                            : ""
                        }`}
                        onClick={() => setCurrentStep(i)}
                      >
                        <span className="sim-log__num">{i}</span>
                        <span className="sim-log__text">{step.description}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          ) : (
            <div className="fa-empty">
              <div className="fa-empty__icon">⬡</div>
              <p>
                Fill in the builder on the left and click{" "}
                <strong>Build &amp; Simulate</strong>.
              </p>
              <p>Or load one of the examples above to get started quickly.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
