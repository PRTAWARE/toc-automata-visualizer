// ============================================================
// PDA Simulator — Pushdown Automaton Simulation
// Pure JavaScript. Uses BFS to handle nondeterminism.
// ============================================================

/**
 * Simulate a PDA on an input string.
 *
 * Transition format (each object in `transitions`):
 *   { from: stateId, input: 'a'|'ε', stackTop: 'Z'|'ε', to: stateId, stackPush: 'AZ'|'ε' }
 *
 * - input = 'ε' means: do not consume input (ε-transition)
 * - stackTop = 'ε' means: do not check / pop the stack top
 * - stackPush = 'ε' or '' means: pop the top (don't push anything)
 * - stackPush = 'AZ' means: pop top, push 'Z' then 'A' (so 'A' is on top)
 *
 * Acceptance: by final state (state is in accept set AND all input consumed).
 *
 * @param {number[]} states
 * @param {Array} transitions
 * @param {number} start
 * @param {string} initialStack  - initial stack symbol, e.g. 'Z'
 * @param {number[]} accept
 * @param {string} inputString
 * @param {number} maxSteps      - prevent infinite loops
 */
export function simulatePDA(
  states,
  transitions,
  start,
  initialStack,
  accept,
  inputString,
  maxSteps = 500
) {
  const acceptSet = new Set(accept);

  // Each configuration:
  // { state, inputPos, stack: string[], stepLog: [] }
  const initial = {
    state: start,
    inputPos: 0,
    stack: initialStack ? [initialStack] : [],
    stepLog: [],
  };

  // BFS queue to handle nondeterminism
  const queue = [initial];

  // Visited set: avoid revisiting same (state, inputPos, stack) triple
  const visited = new Set();

  let totalSteps = 0;

  while (queue.length > 0 && totalSteps < maxSteps) {
    const config = queue.shift();
    const { state, inputPos, stack, stepLog } = config;

    // Canonical key to detect loops
    const key = `${state}|${inputPos}|${stack.join('')}`;
    if (visited.has(key)) continue;
    visited.add(key);
    totalSteps++;

    // Check acceptance: in accept state AND consumed all input
    if (acceptSet.has(state) && inputPos === inputString.length) {
      return { accepted: true, stepLog, hitLimit: false };
    }

    const stackTop = stack.length > 0 ? stack[stack.length - 1] : 'ε';
    const currentInput =
      inputPos < inputString.length ? inputString[inputPos] : 'ε';

    // Find all applicable transitions
    for (const t of transitions) {
      if (t.from !== state) continue;

      // Check if input matches
      const inputMatch = t.input === 'ε' || t.input === currentInput;
      if (!inputMatch) continue;

      // Check if stack top matches
      const stackMatch =
        t.stackTop === 'ε' || (stack.length > 0 && t.stackTop === stackTop);
      if (!stackMatch) continue;

      // Apply the transition:
      // 1. Pop stack top (if stackTop condition is not ε)
      const newStack = [...stack];
      if (t.stackTop !== 'ε' && newStack.length > 0) {
        newStack.pop();
      }

      // 2. Push stackPush (in reverse order so first char ends up on top)
      const pushStr = t.stackPush === 'ε' ? '' : t.stackPush;
      for (let i = pushStr.length - 1; i >= 0; i--) {
        newStack.push(pushStr[i]);
      }

      // 3. Advance input only if we consumed a real symbol
      const newInputPos = t.input === 'ε' ? inputPos : inputPos + 1;

      // Build human-readable step description
      const actionDesc =
        pushStr === ''
          ? `Pop ${t.stackTop === 'ε' ? '(no pop)' : t.stackTop}`
          : `Pop ${t.stackTop === 'ε' ? 'nothing' : t.stackTop}, Push ${pushStr}`;

      const newStepLog = [
        ...stepLog,
        {
          stepNum: stepLog.length + 1,
          state: t.from,
          nextState: t.to,
          readInput: t.input,
          stackTop: t.stackTop === 'ε' ? '(any)' : t.stackTop,
          stackPush: pushStr === '' ? 'ε' : pushStr,
          action: actionDesc,
          stackBefore: [...stack],
          stackAfter: [...newStack],
          remainingInput: inputString.slice(newInputPos),
        },
      ];

      queue.push({
        state: t.to,
        inputPos: newInputPos,
        stack: newStack,
        stepLog: newStepLog,
      });
    }
  }

  // If we exhausted all configurations without acceptance
  return {
    accepted: false,
    stepLog: queue.length === 0 ? [] : queue[0].stepLog,
    hitLimit: totalSteps >= maxSteps,
  };
}

// -------------------------------------------------------
// Built-in examples
// -------------------------------------------------------

export const PDA_EXAMPLES = {
  anbn: {
    name: 'L = {aⁿbⁿ | n ≥ 1}',
    description: 'Equal number of a\'s followed by b\'s',
    states: [0, 1, 2],
    stateNames: { 0: 'q0', 1: 'q1', 2: 'q2' },
    inputAlphabet: ['a', 'b'],
    stackAlphabet: ['Z', 'A'],
    start: 0,
    initialStack: 'Z',
    accept: [2],
    transitions: [
      // Reading a's: push A onto stack
      { from: 0, input: 'a', stackTop: 'Z', to: 0, stackPush: 'AZ' },
      { from: 0, input: 'a', stackTop: 'A', to: 0, stackPush: 'AA' },
      // Switch to reading b's
      { from: 0, input: 'b', stackTop: 'A', to: 1, stackPush: 'ε' },
      // Continue reading b's: pop A for each b
      { from: 1, input: 'b', stackTop: 'A', to: 1, stackPush: 'ε' },
      // When stack has only Z left: move to accept
      { from: 1, input: 'ε', stackTop: 'Z', to: 2, stackPush: 'Z' },
    ],
    testInput: 'aabb',
  },
  palindrome: {
    name: 'Odd-length palindromes over {a,b}',
    description: 'Strings like aba, abcba (with center marker c)',
    states: [0, 1, 2],
    stateNames: { 0: 'q0', 1: 'q1', 2: 'q2' },
    inputAlphabet: ['a', 'b', 'c'],
    stackAlphabet: ['Z', 'A', 'B'],
    start: 0,
    initialStack: 'Z',
    accept: [2],
    transitions: [
      // First half: push symbols
      { from: 0, input: 'a', stackTop: 'Z', to: 0, stackPush: 'AZ' },
      { from: 0, input: 'a', stackTop: 'A', to: 0, stackPush: 'AA' },
      { from: 0, input: 'a', stackTop: 'B', to: 0, stackPush: 'AB' },
      { from: 0, input: 'b', stackTop: 'Z', to: 0, stackPush: 'BZ' },
      { from: 0, input: 'b', stackTop: 'A', to: 0, stackPush: 'BA' },
      { from: 0, input: 'b', stackTop: 'B', to: 0, stackPush: 'BB' },
      // Center marker c: switch to matching
      { from: 0, input: 'c', stackTop: 'A', to: 1, stackPush: 'A' },
      { from: 0, input: 'c', stackTop: 'B', to: 1, stackPush: 'B' },
      // Second half: match and pop
      { from: 1, input: 'a', stackTop: 'A', to: 1, stackPush: 'ε' },
      { from: 1, input: 'b', stackTop: 'B', to: 1, stackPush: 'ε' },
      // All matched: go to accept
      { from: 1, input: 'ε', stackTop: 'Z', to: 2, stackPush: 'Z' },
    ],
    testInput: 'abcba',
  },
};
