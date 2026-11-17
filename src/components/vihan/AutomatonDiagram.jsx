import React, { useMemo } from "react";
import "./AutomatonDiagram.css";

const NODE_R = 24;
const COL_SPACING = 150; // horizontal distance between BFS levels
const ROW_SPACING = 110; // vertical distance between states in the same level
const PADDING = 80;

/**
 * Renders a finite automaton as an SVG state diagram.
 *
 * IMPORTANT: this component only computes *where to draw* the states and
 * edges it is given — it never adds, removes, merges, or relabels states
 * or transitions. The automaton itself (states/transitions/start/accept)
 * always comes from the backend and is passed straight through.
 *
 * Layout: states are arranged left-to-right in columns by their BFS
 * distance from the start state (the standard "flow" layout used in
 * textbook automata diagrams), instead of a circle. This keeps forward
 * transitions mostly straight and short, and only curves edges that
 * genuinely need it (loops, back-edges, parallel pairs).
 *
 * Props:
 *  - states: number[]                 state ids, e.g. [0,1,2]
 *  - start: number
 *  - accept: number[]
 *  - transitions: { from, to, symbol }[]
 *  - stateLabels?: Record<number,string>   optional label override (e.g. DFA subset sets)
 */
export default function AutomatonDiagram({ states, start, accept, transitions, stateLabels }) {
  const layout = useMemo(
    () => computeLayeredLayout(states, transitions, start),
    [states, transitions, start]
  );
  const acceptSet = useMemo(() => new Set(accept), [accept]);

  const { paths, selfLoops } = useMemo(
    () => buildEdges(transitions, layout),
    [transitions, layout]
  );

  const { width, height } = layout;

  return (
    <div className="automaton-diagram">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`State diagram with ${states.length} states`}
      >
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--trace)" />
          </marker>
        </defs>

        {paths.map((p, i) => (
          <g key={`edge-${i}`}>
            <path d={p.d} className="automaton-diagram__edge" markerEnd="url(#arrowhead)" />
            <rect
              x={p.labelX - p.labelW / 2}
              y={p.labelY - 10}
              width={p.labelW}
              height={16}
              className="automaton-diagram__label-bg"
            />
            <text x={p.labelX} y={p.labelY + 2} className="automaton-diagram__label">
              {p.symbol}
            </text>
          </g>
        ))}

        {selfLoops.map((loop, i) => (
          <g key={`loop-${i}`}>
            <path d={loop.d} className="automaton-diagram__edge" markerEnd="url(#arrowhead)" />
            <rect
              x={loop.labelX - loop.labelW / 2}
              y={loop.labelY - 10}
              width={loop.labelW}
              height={16}
              className="automaton-diagram__label-bg"
            />
            <text x={loop.labelX} y={loop.labelY + 2} className="automaton-diagram__label">
              {loop.symbol}
            </text>
          </g>
        ))}

        {/* start marker: a short stub arrow pointing into the start state, per convention "→ q0" */}
        {layout.points[start] && (
          <path
            d={startStub(layout.points[start])}
            className="automaton-diagram__edge automaton-diagram__start-stub"
            markerEnd="url(#arrowhead)"
          />
        )}

        {states.map((id) => {
          const pt = layout.points[id];
          if (!pt) return null; // defensive: never crash on an unpositioned state
          const isAccept = acceptSet.has(id);
          return (
            <g key={`node-${id}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={NODE_R}
                className={`automaton-diagram__node${id === start ? " automaton-diagram__node--start" : ""}`}
              />
              {isAccept && (
                <circle cx={pt.x} cy={pt.y} r={NODE_R - 5} className="automaton-diagram__node-inner" />
              )}
              <text x={pt.x} y={pt.y + 4} className="automaton-diagram__node-label">
                {stateLabels?.[id] ?? `q${id}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout: pure presentation. Given the automaton's states/transitions/start,
// this only decides (x, y) for each state id — it never touches the
// automaton data itself, and callers must not feed its output back into
// the automaton.
// ---------------------------------------------------------------------------
function computeLayeredLayout(states, transitions, start) {
  if (!states.length) {
    return { points: {}, width: PADDING * 2, height: PADDING * 2 };
  }

  // Forward adjacency (self-loops excluded — they don't affect leveling).
  const successors = new Map(states.map((s) => [s, []]));
  const predecessors = new Map(states.map((s) => [s, []]));
  for (const t of transitions) {
    if (t.from === t.to) continue;
    successors.get(t.from)?.push(t.to);
    predecessors.get(t.to)?.push(t.from);
  }

  // 1) Level = shortest BFS distance from the start state. Back-edges
  //    (e.g. a Kleene-star loop returning toward the start) simply don't
  //    change the level of an already-visited state, so cycles are safe.
  const level = new Map();
  const discoveryOrder = [];
  if (states.includes(start)) {
    level.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const current = queue.shift();
      discoveryOrder.push(current);
      for (const next of successors.get(current) || []) {
        if (!level.has(next)) {
          level.set(next, level.get(current) + 1);
          queue.push(next);
        }
      }
    }
  }
  // Defensive fallback for any state unreachable from start (should not
  // happen for a validated automaton, but never crash if it does).
  let maxLevel = level.size ? Math.max(...level.values()) : 0;
  for (const s of states) {
    if (!level.has(s)) {
      maxLevel += 1;
      level.set(s, maxLevel);
      discoveryOrder.push(s);
    }
  }

  // 2) Group states into columns by level, using discovery order as the
  //    initial row order within each column.
  const levels = new Map();
  for (const s of discoveryOrder) {
    const l = level.get(s);
    if (!levels.has(l)) levels.set(l, []);
    levels.get(l).push(s);
  }
  const levelKeys = Array.from(levels.keys()).sort((a, b) => a - b);

  // 3) A couple of barycenter passes: reorder each column by the average
  //    row position of its predecessors in the previous column, which
  //    keeps union/concatenation branches visually untangled without
  //    changing which states or edges exist.
  const rowIndex = new Map();
  for (const l of levelKeys) {
    levels.get(l).forEach((s, i) => rowIndex.set(s, i));
  }
  for (let pass = 0; pass < 2; pass++) {
    for (const l of levelKeys) {
      if (l === 0) continue;
      const scored = levels.get(l).map((s) => {
        const preds = predecessors.get(s) || [];
        const rows = preds.map((p) => rowIndex.get(p)).filter((v) => v !== undefined);
        const score = rows.length
          ? rows.reduce((sum, v) => sum + v, 0) / rows.length
          : rowIndex.get(s) ?? 0;
        return { s, score };
      });
      scored.sort((a, b) => a.score - b.score);
      levels.set(l, scored.map((w) => w.s));
      scored.forEach((w, i) => rowIndex.set(w.s, i));
    }
  }

  // 4) Assign final coordinates, centering each column vertically.
  const maxRows = Math.max(...levelKeys.map((l) => levels.get(l).length), 1);
  const width = PADDING * 2 + maxLevel * COL_SPACING + NODE_R * 2;
  const height = PADDING * 2 + (maxRows - 1) * ROW_SPACING + NODE_R * 2;
  const centerY = height / 2;

  const points = {};
  for (const l of levelKeys) {
    const nodes = levels.get(l);
    const n = nodes.length;
    nodes.forEach((s, i) => {
      points[s] = {
        x: PADDING + NODE_R + l * COL_SPACING,
        y: centerY + (i - (n - 1) / 2) * ROW_SPACING,
      };
    });
  }

  return { points, width, height };
}

function buildEdges(transitions, layout) {
  // Merge transitions sharing a (from,to) pair into one labeled arrow —
  // a purely visual grouping; each original transition is still what was
  // received from the backend, nothing is dropped or invented.
  const groups = new Map();
  for (const t of transitions) {
    const key = `${t.from}->${t.to}`;
    if (!groups.has(key)) groups.set(key, { from: t.from, to: t.to, symbols: [] });
    groups.get(key).symbols.push(t.symbol);
  }

  const paths = [];
  const selfLoops = [];

  for (const { from, to, symbols } of groups.values()) {
    const label = symbols.join(",");
    if (from === to) {
      const pt = layout.points[from];
      if (pt) selfLoops.push(buildSelfLoop(pt, label));
      continue;
    }
    const a = layout.points[from];
    const b = layout.points[to];
    if (!a || !b) continue;
    const reverseExists = groups.has(`${to}->${from}`);
    paths.push(buildEdge(a, b, label, reverseExists));
  }

  return { paths, selfLoops };
}

function buildEdge(a, b, symbol, reverseExists) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  // An edge needs to curve away from the straight line whenever a straight
  // line would either overlap its reverse-direction sibling, or would run
  // backward/sideways through a column of other states (a back-edge, e.g.
  // a loop returning toward the start).
  const isBackwardOrSameColumn = dx <= 1;
  const curve = reverseExists || isBackwardOrSameColumn;

  let bend = 0;
  if (curve) {
    bend = reverseExists && !isBackwardOrSameColumn
      ? 18 // small, symmetric offset for a simple A<->B pair
      : Math.min(90, Math.max(30, (Math.abs(dx) + Math.abs(dy)) * 0.22)); // arc clear of intervening columns
  }

  const start = { x: a.x + ux * NODE_R, y: a.y + uy * NODE_R };
  const end = { x: b.x - ux * NODE_R, y: b.y - uy * NODE_R };
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const control = { x: mid.x - uy * bend, y: mid.y + ux * bend };

  const d = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
  const labelPoint = curve ? quadPoint(start, control, end, 0.5) : mid;

  return {
    d,
    symbol,
    labelX: labelPoint.x,
    labelY: labelPoint.y - 6,
    labelW: labelWidth(symbol),
  };
}

function buildSelfLoop(pt, symbol) {
  const top = { x: pt.x, y: pt.y - NODE_R };
  const d = `M ${top.x - 8} ${top.y + 2}
             C ${top.x - 22} ${top.y - 34}, ${top.x + 22} ${top.y - 34}, ${top.x + 8} ${top.y + 2}`;
  return {
    d,
    symbol,
    labelX: pt.x,
    labelY: pt.y - NODE_R - 26,
    labelW: labelWidth(symbol),
  };
}

function startStub(target) {
  const from = { x: target.x - NODE_R - 34, y: target.y };
  const to = { x: target.x - NODE_R, y: target.y };
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

function quadPoint(p0, p1, p2, t) {
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
  return { x, y };
}

function labelWidth(symbol) {
  return Math.max(18, symbol.length * 9 + 8);
}
