import React from "react";
import AutomatonDiagram from "./AutomatonDiagram.jsx";
import StepLog from "./StepLog.jsx";
import TransitionTable from "./TransitionTable.jsx";
import "./AutomatonPanel.css";

export default function AutomatonPanel({ title, subtitle, data }) {
  return (
    <section className="automaton-panel">
      <header className="automaton-panel__header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      <AutomatonDiagram
        states={data.states}
        start={data.start}
        accept={data.accept}
        transitions={data.transitions}
        stateLabels={data.stateLabels}
      />

      <div className="automaton-panel__section">
        <h3>Construction steps</h3>
        <StepLog steps={data.steps} />
      </div>

      <div className="automaton-panel__section">
        <h3>Transition table</h3>
        <TransitionTable
          states={data.states}
          transitions={data.transitions}
          start={data.start}
          accept={data.accept}
          stateLabels={data.stateLabels}
        />
      </div>
    </section>
  );
}
