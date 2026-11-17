// ============================================================
// Turing Machine Simulator
// Pure JavaScript. Single-tape TM with L/R/S directions.
// ============================================================

/**
 * Simulate a Turing Machine step by step.
 *
 * Transition format (each object in `transitions`):
 *   { state: 'q0', read: '0', nextState: 'q1', write: 'X', dir: 'R' }
 *
 * Direction values: 'R' = move right, 'L' = move left, 'S' = stay
 * Blank symbol: typically 'B' or '□'
 *
 * @param {string[]} states
 * @param {Array} transitions
 * @param {string} start     - start state name
 * @param {string} accept    - accept state name
 * @param {string} reject    - reject state name
 * @param {string} blank     - blank tape symbol
 * @param {string} inputString
 * @param {number} maxSteps  - safety limit to prevent infinite loops
 */
export function simulateTM(
  states,
  transitions,
  start,
  accept,
  reject,
  blank,
  inputString,
  maxSteps = 1000
) {
  // Initialize tape: convert input string to array of symbols
  // Add blanks on either side for safety
  const tape = inputString.length > 0 ? inputString.split('') : [blank];
  let head = 0;
  let state = start;
  const stepLog = [];

  // Build lookup map: transMap[state][symbol] = {nextState, write, dir}
  const transMap = {};
  for (const t of transitions) {
    if (!transMap[t.state]) transMap[t.state] = {};
    transMap[t.state][t.read] = {
      nextState: t.nextState,
      write: t.write,
      dir: t.dir,
    };
  }

  // Helper: read tape at head position (extend with blanks if needed)
  function readHead() {
    // Expand left
    while (head < 0) {
      tape.unshift(blank);
      head = 0;
    }
    // Expand right
    while (head >= tape.length) {
      tape.push(blank);
    }
    return tape[head];
  }

  let stepCount = 0;

  while (stepCount < maxSteps) {
    // Check halting states FIRST
    if (state === accept) {
      return {
        result: 'accept',
        stepLog,
        tape: [...tape],
        head,
        message: '✓ Machine halted in ACCEPT state.',
      };
    }
    if (state === reject) {
      return {
        result: 'reject',
        stepLog,
        tape: [...tape],
        head,
        message: '✗ Machine halted in REJECT state.',
      };
    }

    const sym = readHead();
    const trans = transMap[state]?.[sym];

    if (!trans) {
      // No transition defined = implicit reject
      stepLog.push({
        stepNum: stepCount + 1,
        state,
        read: sym,
        write: '—',
        dir: '—',
        nextState: reject || '(reject)',
        tape: [...tape],
        head,
        note: 'No transition defined — machine rejects.',
      });
      return {
        result: 'reject',
        stepLog,
        tape: [...tape],
        head,
        message: `✗ No transition for (${state}, '${sym}') — machine rejects.`,
      };
    }

    // Record step BEFORE making changes
    stepLog.push({
      stepNum: stepCount + 1,
      state,
      read: sym,
      write: trans.write,
      dir: trans.dir,
      nextState: trans.nextState,
      tape: [...tape],
      head,
      note: '',
    });

    // Apply transition:
    // 1. Write symbol
    tape[head] = trans.write;

    // 2. Move head
    if (trans.dir === 'R') head++;
    else if (trans.dir === 'L') head--;
    // 'S' = stay, no change

    // 3. Change state
    state = trans.nextState;

    stepCount++;
  }

  // Reached step limit
  return {
    result: 'limit',
    stepLog,
    tape: [...tape],
    head,
    message: `⚠ Execution stopped after ${maxSteps} steps. The machine may not halt for this input.`,
  };
}

// -------------------------------------------------------
// Built-in TM examples
// -------------------------------------------------------

export const TM_EXAMPLES = {
  // Recognizes strings of the form 0^n 1^n (equal 0s and 1s)
  equal01: {
    name: '0ⁿ1ⁿ — equal zeros and ones',
    description: 'Accepts strings with equal number of 0s followed by 1s',
    states: ['q0', 'q1', 'q2', 'q3', 'qaccept', 'qreject'],
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'X', 'Y', 'B'],
    blank: 'B',
    start: 'q0',
    accept: 'qaccept',
    reject: 'qreject',
    transitions: [
      // Mark a 0 as X, scan right to match a 1
      { state: 'q0', read: 'X', nextState: 'q0', write: 'X', dir: 'R' },
      { state: 'q0', read: 'Y', nextState: 'q3', write: 'Y', dir: 'R' },
      { state: 'q0', read: 'B', nextState: 'qaccept', write: 'B', dir: 'S' },
      { state: 'q0', read: '0', nextState: 'q1', write: 'X', dir: 'R' },
      // Scan right past 0s and Ys looking for a 1
      { state: 'q1', read: '0', nextState: 'q1', write: '0', dir: 'R' },
      { state: 'q1', read: 'Y', nextState: 'q1', write: 'Y', dir: 'R' },
      { state: 'q1', read: '1', nextState: 'q2', write: 'Y', dir: 'L' },
      { state: 'q1', read: 'B', nextState: 'qreject', write: 'B', dir: 'S' },
      // Scan left back to leftmost 0
      { state: 'q2', read: '0', nextState: 'q2', write: '0', dir: 'L' },
      { state: 'q2', read: 'Y', nextState: 'q2', write: 'Y', dir: 'L' },
      { state: 'q2', read: 'X', nextState: 'q0', write: 'X', dir: 'R' },
      // Check all 0s are consumed — verify only Ys remain
      { state: 'q3', read: 'Y', nextState: 'q3', write: 'Y', dir: 'R' },
      { state: 'q3', read: 'B', nextState: 'qaccept', write: 'B', dir: 'S' },
      { state: 'q3', read: '1', nextState: 'qreject', write: '1', dir: 'S' },
    ],
    testInput: '0011',
  },

  // Flip all bits: 0→1, 1→0
  flipBits: {
    name: 'Flip all bits (0↔1)',
    description: 'Simple TM: reads tape and flips every 0 to 1 and every 1 to 0',
    states: ['q0', 'qaccept'],
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blank: 'B',
    start: 'q0',
    accept: 'qaccept',
    reject: 'qreject',
    transitions: [
      { state: 'q0', read: '0', nextState: 'q0', write: '1', dir: 'R' },
      { state: 'q0', read: '1', nextState: 'q0', write: '0', dir: 'R' },
      { state: 'q0', read: 'B', nextState: 'qaccept', write: 'B', dir: 'S' },
    ],
    testInput: '1011001',
  },
};
