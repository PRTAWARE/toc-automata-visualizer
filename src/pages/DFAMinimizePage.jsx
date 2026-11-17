import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AutomatonDiagram from "../components/AutomatonDiagram.jsx";
import TransitionTable from "../components/TransitionTable.jsx";
import { minimizeDFA } from "../algorithms/dfaMinimize.js";
import "./RegexPage.css";
import "./FASimulatorPage.css";

const EXAMPLES = {
  redundant: {
    label: "DFA with redundant states",
    states: [0,1,2,3,4,5],
    alphabet: ["a","b"],
    start: 0,
    accept: [2,4],
    transitions: [
      {from:0,to:1,symbol:"a"},{from:0,to:3,symbol:"b"},
      {from:1,to:2,symbol:"a"},{from:1,to:4,symbol:"b"},
      {from:2,to:2,symbol:"a"},{from:2,to:4,symbol:"b"},
      {from:3,to:1,symbol:"a"},{from:3,to:3,symbol:"b"},
      {from:4,to:2,symbol:"a"},{from:4,to:4,symbol:"b"},
      {from:5,to:5,symbol:"a"},{from:5,to:5,symbol:"b"},
    ],
  },
  alreadyMin: {
    label: "Already minimal DFA",
    states: [0,1],
    alphabet: ["a"],
    start: 0,
    accept: [1],
    transitions: [
      {from:0,to:1,symbol:"a"},
      {from:1,to:1,symbol:"a"},
    ],
  },
};

export default function DFAMinimizePage() {
  const [searchParams] = useSearchParams();

  const [stateCount, setStateCount] = useState(6);
  const [startState, setStartState] = useState(0);
  const [acceptStates, setAcceptStates] = useState([2,4]);
  const [alphabet, setAlphabet] = useState("a,b");
  const [rawTransitions, setRawTransitions] = useState(
    "0,a,1\n0,b,3\n1,a,2\n1,b,4\n2,a,2\n2,b,4\n3,a,1\n3,b,3\n4,a,2\n4,b,4\n5,a,5\n5,b,5"
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Pre-fill from URL params (when coming from Regex page)
  useEffect(() => {
    const s = searchParams.get("states");
    const a = searchParams.get("alphabet");
    const st = searchParams.get("start");
    const acc = searchParams.get("accept");
    const tr = searchParams.get("transitions");
    if (s && a && st !== null && acc && tr) {
      try {
        const statesArr = s.split(",").map(Number);
        const alphArr = a.split(",");
        const acceptArr = acc.split(",").map(Number).filter((n) => !isNaN(n));
        const transArr = JSON.parse(tr);
        setStateCount(statesArr.length);
        setStartState(Number(st));
        setAcceptStates(acceptArr);
        setAlphabet(alphArr.join(","));
        setRawTransitions(transArr.map((t) => `${t.from},${t.symbol},${t.to}`).join("\n"));
      } catch (_) {}
    }
  }, []);

  const states = Array.from({ length: stateCount }, (_, i) => i);
  const alphabetArr = alphabet.split(",").map((s) => s.trim()).filter(Boolean);

  function parseTransitions() {
    return rawTransitions.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split(",");
      if (parts.length !== 3) throw new Error(`Bad line: "${line}"`);
      const from = parseInt(parts[0]);
      const symbol = parts[1].trim();
      const to = parseInt(parts[2]);
      if (isNaN(from) || isNaN(to)) throw new Error(`State IDs must be numbers in: "${line}"`);
      return { from, to, symbol };
    });
  }

  function handleMinimize() {
    setError("");
    setResult(null);
    try {
      if (!alphabetArr.length) throw new Error("Alphabet cannot be empty.");
      const transitions = parseTransitions();
      const res = minimizeDFA(states, transitions, startState, acceptStates, alphabetArr);
      setResult({
        original: { states, transitions, start: startState, accept: acceptStates },
        ...res,
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
    setRawTransitions(ex.transitions.map((t) => `${t.from},${t.symbol},${t.to}`).join("\n"));
    setResult(null);
    setError("");
  }

  function toggleAccept(id) {
    setAcceptStates((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>DFA Minimization</h1>
        <p>
          Input a DFA and the Partition Refinement algorithm finds equivalent states
          and merges them, producing the smallest equivalent DFA.
        </p>
      </header>

      <div className="fa-examples">
        <span>Load example:</span>
        {Object.entries(EXAMPLES).map(([k, ex]) => (
          <button key={k} className="btn btn--outline" onClick={() => loadExample(k)}>{ex.label}</button>
        ))}
      </div>

      <div className="fa-layout">
        <aside className="fa-builder">
          <h2 className="fa-builder__title">Define DFA</h2>

          <div className="fa-field">
            <label className="fa-label" htmlFor="scm">Number of States</label>
            <input id="scm" type="number" min="1" max="20" value={stateCount}
              onChange={(e) => { setStateCount(Math.max(1, parseInt(e.target.value)||1)); setAcceptStates([]); }}
              className="fa-input" />
          </div>

          <div className="fa-field">
            <label className="fa-label" htmlFor="ssm">Start State</label>
            <select id="ssm" value={startState} onChange={(e) => setStartState(Number(e.target.value))} className="fa-input">
              {states.map((s) => <option key={s} value={s}>q{s}</option>)}
            </select>
          </div>

          <div className="fa-field">
            <label className="fa-label">Accepting States</label>
            <div className="fa-check-row">
              {states.map((s) => (
                <label key={s} className="fa-check">
                  <input type="checkbox" checked={acceptStates.includes(s)} onChange={() => toggleAccept(s)} />
                  q{s}
                </label>
              ))}
            </div>
          </div>

          <div className="fa-field">
            <label className="fa-label" htmlFor="alphm">Alphabet</label>
            <input id="alphm" type="text" value={alphabet} onChange={(e) => setAlphabet(e.target.value)}
              placeholder="a,b" className="fa-input" />
          </div>

          <div className="fa-field">
            <label className="fa-label" htmlFor="transm">Transitions (from,symbol,to)</label>
            <textarea id="transm" value={rawTransitions} onChange={(e) => setRawTransitions(e.target.value)}
              rows={10} className="fa-textarea" spellCheck={false} />
          </div>

          <button className="btn btn--primary fa-build-btn" onClick={handleMinimize}>⊙ Minimize DFA</button>
          {error && <div className="fa-error">{error}</div>}
        </aside>

        <main className="fa-output">
          {result ? (
            <>
              {/* Original DFA */}
              <section className="fa-section">
                <h2>Original DFA — {result.original.states.length} state(s)</h2>
                <AutomatonDiagram
                  states={result.original.states}
                  start={result.original.start}
                  accept={result.original.accept}
                  transitions={result.original.transitions}
                />
                <TransitionTable
                  states={result.original.states}
                  transitions={result.original.transitions}
                  start={result.original.start}
                  accept={result.original.accept}
                />
              </section>

              {/* Unreachable states */}
              {result.unreachable.length > 0 && (
                <div className="min-info-box min-info-box--warn">
                  ⚠ Unreachable states removed: {result.unreachable.map((s) => `q${s}`).join(", ")}
                </div>
              )}

              {/* Partition steps */}
              <section className="fa-section">
                <h2>Partition Refinement — Step by Step</h2>
                <ol className="step-log">
                  {result.partitionSteps.map((step, i) => (
                    <li key={i} className="step-log__item">
                      <span className="step-log__index">{i + 1}</span>
                      <span className="step-log__text" style={{whiteSpace:"pre-line"}}>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Equivalent groups */}
              {result.equivalentGroups.length > 0 && (
                <div className="min-info-box min-info-box--info">
                  <strong>Equivalent states merged:</strong>{" "}
                  {result.equivalentGroups.map((g) => `{${g.merged.join(", ")}} → ${g.newState}`).join(" | ")}
                </div>
              )}
              {result.equivalentGroups.length === 0 && (
                <div className="min-info-box min-info-box--ok">
                  ✓ No states were equivalent — the DFA was already minimal!
                </div>
              )}

              {/* Minimized DFA */}
              <section className="fa-section">
                <h2>Minimized DFA — {result.minimized.states.length} state(s)</h2>
                <AutomatonDiagram
                  states={result.minimized.states}
                  start={result.minimized.start}
                  accept={result.minimized.accept}
                  transitions={result.minimized.transitions}
                  stateLabels={result.minimized.stateLabels}
                />
                <TransitionTable
                  states={result.minimized.states}
                  transitions={result.minimized.transitions}
                  start={result.minimized.start}
                  accept={result.minimized.accept}
                  stateLabels={result.minimized.stateLabels}
                />
              </section>
            </>
          ) : (
            <div className="fa-empty">
              <div className="fa-empty__icon">⊙</div>
              <p>Define a DFA on the left and click <strong>Minimize DFA</strong>.</p>
              <p>You can also send a DFA directly from the Regex → Automata page.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
