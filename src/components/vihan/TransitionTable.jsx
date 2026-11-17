import React, { useMemo } from "react";
import "./TransitionTable.css";

/**
 * Classic transition table: one row per state, one column per alphabet
 * symbol, cell = target state(s) reachable on that symbol.
 */
export default function TransitionTable({ states, transitions, start, accept, stateLabels }) {
  const acceptSet = useMemo(() => new Set(accept), [accept]);

  const symbols = useMemo(() => {
    const set = new Set(transitions.map((t) => t.symbol));
    return Array.from(set).sort();
  }, [transitions]);

  const cell = useMemo(() => {
    const map = {};
    for (const t of transitions) {
      const key = `${t.from}|${t.symbol}`;
      if (!map[key]) map[key] = [];
      map[key].push(t.to);
    }
    return map;
  }, [transitions]);

  return (
    <div className="transition-table">
      <table>
        <thead>
          <tr>
            <th>State</th>
            {symbols.map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((id) => (
            <tr key={id}>
              <th scope="row">
                {id === start ? "→" : ""}
                {stateLabels?.[id] ?? `q${id}`}
                {acceptSet.has(id) ? " *" : ""}
              </th>
              {symbols.map((s) => (
                <td key={s}>
                  {(cell[`${id}|${s}`] || [])
                    .map((to) => stateLabels?.[to] ?? `q${to}`)
                    .join(", ") || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="transition-table__legend">→ start state · * accepting state</p>
    </div>
  );
}
