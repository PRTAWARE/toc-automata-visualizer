import React from "react";
import "./StepLog.css";

export default function StepLog({ steps }) {
  if (!steps?.length) return null;
  return (
    <ol className="step-log">
      {steps.map((step, i) => (
        <li key={i} className="step-log__item">
          <span className="step-log__index">{i + 1}</span>
          <span className="step-log__text">{step}</span>
        </li>
      ))}
    </ol>
  );
}
