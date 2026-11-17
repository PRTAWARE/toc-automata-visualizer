// ============================================================
// FA Simulate — DFA and NFA string simulation
// All logic is pure JavaScript, no React dependencies.
// ============================================================

/**
 * Compute ε-closure of a set of NFA states.
 * ε-closure = all states reachable by following only ε-transitions.
 * @param {number[]} stateSet - initial states
 * @param {Array<{from,to,symbol}>} transitions
 * @returns {number[]} sorted array of states in closure
 */
export function epsilonClosure(stateSet, transitions) {
  const closure = new Set(stateSet);
  const stack = [...stateSet];

  while (stack.length > 0) {
    const s = stack.pop();
    for (const t of transitions) {
      // ε-transitions are stored as 'ε' in our system
      if (t.from === s && (t.symbol === 'ε' || t.symbol === '') && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }

  return [...closure].sort((a, b) => a - b);
}

/**
 * Compute move(stateSet, symbol) — all NFA states reachable from
 * stateSet by reading exactly one symbol (ignoring ε).
 */
export function nfaMove(stateSet, symbol, transitions) {
  const result = new Set();
  for (const s of stateSet) {
    for (const t of transitions) {
      if (t.from === s && t.symbol === symbol) {
        result.add(t.to);
      }
    }
  }
  return [...result];
}

/**
 * Simulate a DFA on an input string.
 * Returns step-by-step trace and final result.
 *
 * @param {number[]} states
 * @param {Array<{from,to,symbol}>} transitions
 * @param {number} start
 * @param {number[]} accept
 * @param {string} inputString
 * @returns {{ steps, accepted: boolean }}
 */
export function simulateDFA(states, transitions, start, accept, inputString) {
  const acceptSet = new Set(accept);

  // Build transition map: transMap[state][symbol] = nextState
  const transMap = {};
  for (const t of transitions) {
    if (!transMap[t.from]) transMap[t.from] = {};
    transMap[t.from][t.symbol] = t.to;
  }

  let current = start;
  const steps = [];

  // Step 0: initial state
  steps.push({
    step: 0,
    activeStates: [current],
    symbol: null,
    description: `Start in state q${current}`,
  });

  for (let i = 0; i < inputString.length; i++) {
    const sym = inputString[i];
    const next = transMap[current]?.[sym];

    if (next === undefined) {
      steps.push({
        step: i + 1,
        activeStates: [],
        symbol: sym,
        description: `Read '${sym}' from q${current} — no transition defined → STUCK (rejected)`,
      });
      return { steps, accepted: false };
    }

    current = next;
    steps.push({
      step: i + 1,
      activeStates: [current],
      symbol: sym,
      description: `Read '${sym}' → move to q${current}`,
    });
  }

  const accepted = acceptSet.has(current);
  steps.push({
    step: inputString.length + 1,
    activeStates: [current],
    symbol: null,
    description: accepted
      ? `End of input. q${current} is an accepting state → ACCEPTED ✓`
      : `End of input. q${current} is NOT an accepting state → REJECTED ✗`,
    final: true,
    accepted,
  });

  return { steps, accepted };
}

/**
 * Simulate an NFA on an input string.
 * Tracks a SET of active states at each step.
 * Computes ε-closure after every move.
 */
export function simulateNFA(states, transitions, start, accept, inputString) {
  const acceptSet = new Set(accept);

  // Step 0: ε-closure of start state
  let currentStates = epsilonClosure([start], transitions);
  const steps = [];

  steps.push({
    step: 0,
    activeStates: [...currentStates],
    symbol: null,
    description: `ε-closure({q${start}}) = {${currentStates.map((s) => 'q' + s).join(', ') || '∅'}}`,
  });

  for (let i = 0; i < inputString.length; i++) {
    const sym = inputString[i];

    // move: find all states reachable by reading sym
    const moved = nfaMove(currentStates, sym, transitions);

    // ε-closure: follow all ε-transitions from moved states
    const closure = epsilonClosure(moved, transitions);
    currentStates = closure;

    steps.push({
      step: i + 1,
      activeStates: [...currentStates],
      symbol: sym,
      description:
        currentStates.length === 0
          ? `Read '${sym}' → move = ∅ → no active states`
          : `Read '${sym}' → move = {${moved.map((s) => 'q' + s).join(', ')}} → ε-closure = {${currentStates.map((s) => 'q' + s).join(', ')}}`,
    });
  }

  const accepted = currentStates.some((s) => acceptSet.has(s));
  steps.push({
    step: inputString.length + 1,
    activeStates: [...currentStates],
    symbol: null,
    description: accepted
      ? `End of input. Active states {${currentStates.map((s) => 'q' + s).join(', ')}} — at least one is accepting → ACCEPTED ✓`
      : `End of input. Active states {${currentStates.map((s) => 'q' + s).join(', ') || '∅'}} — none are accepting → REJECTED ✗`,
    final: true,
    accepted,
  });

  return { steps, accepted };
}
