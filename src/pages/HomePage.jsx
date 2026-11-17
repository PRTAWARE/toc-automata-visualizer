import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const MODULES = [
  {
    id: "fa-simulator",
    path: "/fa-simulator",
    icon: "⬡",
    title: "DFA & NFA Simulator",
    desc: "Build finite automata, add states & transitions, then test strings step-by-step with visual state highlighting.",
    tag: "Finite Automata",
  },
  {
    id: "nfa-to-dfa",
    path: "/nfa-to-dfa",
    icon: "⇒",
    title: "NFA → DFA Converter",
    desc: "Define an NFA and watch the Subset Construction algorithm convert it to an equivalent DFA, with every ε-closure shown.",
    tag: "Subset Construction",
  },
  {
    id: "dfa-minimize",
    path: "/dfa-minimize",
    icon: "⊙",
    title: "DFA Minimization",
    desc: "Input a DFA and see Partition Refinement merge equivalent states step-by-step, producing the smallest equivalent DFA.",
    tag: "Partition Refinement",
  },
  {
    id: "regex",
    path: "/regex",
    icon: ".*",
    title: "Regex → Automata",
    desc: "Enter a regular expression and get the NFA (Thompson's Construction) and DFA (Subset Construction) with full traces.",
    tag: "Thompson's Construction",
  },
  {
    id: "pda",
    path: "/pda",
    icon: "⟨S⟩",
    title: "PDA Simulator",
    desc: "Define a Pushdown Automaton with stack operations, then simulate string acceptance with a visual stack display.",
    tag: "Pushdown Automata",
  },
  {
    id: "turing-machine",
    path: "/turing-machine",
    icon: "▶|",
    title: "Turing Machine",
    desc: "Design a Turing Machine and watch the tape head move step-by-step, reading and writing symbols with a full execution log.",
    tag: "Turing Machines",
  },
];

export default function HomePage() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="home__hero-inner">
          <div className="home__badge">Theory of Computation</div>
          <h1 className="home__title">
            Learning &amp; Visualization <span>Platform</span>
          </h1>
          <p className="home__subtitle">
            Learn, Build, Simulate and Visualize Automata — interactively.
          </p>
          <div className="home__hero-pills">
            <span>DFA</span>
            <span>NFA</span>
            <span>Regex</span>
            <span>PDA</span>
            <span>Turing Machine</span>
          </div>
        </div>
      </section>

      {/* Module cards */}
      <section className="home__modules">
        <h2 className="home__section-title">Choose a Module</h2>
        <div className="home__grid">
          {MODULES.map((m) => (
            <div className="module-card" key={m.id} id={`card-${m.id}`}>
              <div className="module-card__icon" aria-hidden="true">{m.icon}</div>
              <div className="module-card__tag">{m.tag}</div>
              <h3 className="module-card__title">{m.title}</h3>
              <p className="module-card__desc">{m.desc}</p>
              <Link to={m.path} className="module-card__btn">
                Open Module →
              </Link>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}
