// ============================================================
// DFA Minimization — Partition Refinement (Table-filling idea)
// Pure JavaScript. Easy to follow step-by-step.
// ============================================================

/**
 * Minimize a DFA using Partition Refinement.
 *
 * Algorithm:
 * 1. Remove states unreachable from the start state.
 * 2. Initial partition: { accepting states } vs { non-accepting states }.
 * 3. Repeatedly refine: split any group where states disagree on
 *    where they go for some input symbol (i.e., they land in different groups).
 * 4. Stop when no group can be split further.
 * 5. Each final group = one state in the minimized DFA.
 *
 * @param {number[]} states
 * @param {Array<{from,to,symbol}>} transitions
 * @param {number} start
 * @param {number[]} accept
 * @param {string[]} alphabet
 * @returns {{ minimized, partitionSteps, equivalentGroups, unreachable }}
 */
export function minimizeDFA(states, transitions, start, accept, alphabet) {
  const acceptSet = new Set(accept);
  const partitionSteps = [];

  // -------------------------------------------------------
  // Step 1: Find reachable states (BFS from start)
  // -------------------------------------------------------
  const reachable = new Set();
  const bfsQueue = [start];
  reachable.add(start);

  while (bfsQueue.length > 0) {
    const s = bfsQueue.shift();
    for (const t of transitions) {
      if (t.from === s && !reachable.has(t.to)) {
        reachable.add(t.to);
        bfsQueue.push(t.to);
      }
    }
  }

  const unreachable = states.filter((s) => !reachable.has(s));
  const reachableStates = states.filter((s) => reachable.has(s));

  if (unreachable.length > 0) {
    partitionSteps.push(
      `Remove unreachable states: {${unreachable.map((s) => 'q' + s).join(', ')}}\n` +
      `Working with reachable states: {${reachableStates.map((s) => 'q' + s).join(', ')}}`
    );
  } else {
    partitionSteps.push(`All states are reachable from start state q${start}.`);
  }

  // -------------------------------------------------------
  // Step 2: Build transition map for easy lookup
  // -------------------------------------------------------
  // transMap[state][symbol] = nextState (or undefined)
  const transMap = {};
  for (const s of reachableStates) {
    transMap[s] = {};
  }
  for (const t of transitions) {
    if (reachable.has(t.from) && reachable.has(t.to)) {
      transMap[t.from][t.symbol] = t.to;
    }
  }

  // -------------------------------------------------------
  // Step 3: Initial partition
  // P0 = { accepting states, non-accepting states }
  // -------------------------------------------------------
  const accepting = reachableStates.filter((s) => acceptSet.has(s));
  const nonAccepting = reachableStates.filter((s) => !acceptSet.has(s));

  let partitions = [];
  if (accepting.length > 0) partitions.push(accepting);
  if (nonAccepting.length > 0) partitions.push(nonAccepting);

  const formatPartition = (ps) =>
    'P = { ' + ps.map((g) => '{' + g.map((s) => 'q' + s).join(', ') + '}').join(', ') + ' }';

  partitionSteps.push(
    `Initial partition (separate accepting from non-accepting):\n${formatPartition(partitions)}`
  );

  // -------------------------------------------------------
  // Step 4: Refine partitions until stable
  // -------------------------------------------------------
  // Helper: find which partition group a state belongs to
  function groupOf(state) {
    for (let i = 0; i < partitions.length; i++) {
      if (partitions[i].includes(state)) return i;
    }
    return -1; // dead state / undefined transition
  }

  let changed = true;
  let iteration = 1;

  while (changed) {
    changed = false;
    const newPartitions = [];

    for (const group of partitions) {
      if (group.length <= 1) {
        // Single-state group can't be split
        newPartitions.push(group);
        continue;
      }

      // Try to split this group:
      // Two states are in the same group only if, for EVERY symbol,
      // they both go to the same partition group.
      const subGroups = [];

      for (const state of group) {
        // Compute "signature": for each symbol, which group do we land in?
        const sig = alphabet.map((sym) => {
          const next = transMap[state]?.[sym];
          return next !== undefined ? groupOf(next) : -1; // -1 = dead/missing
        }).join(',');

        // Find an existing sub-group with the same signature
        let placed = false;
        for (const sg of subGroups) {
          const refState = sg.states[0];
          const refSig = alphabet.map((sym) => {
            const next = transMap[refState]?.[sym];
            return next !== undefined ? groupOf(next) : -1;
          }).join(',');
          if (sig === refSig) {
            sg.states.push(state);
            placed = true;
            break;
          }
        }
        if (!placed) {
          subGroups.push({ states: [state], sig });
        }
      }

      if (subGroups.length > 1) {
        changed = true; // this group was split
      }
      newPartitions.push(...subGroups.map((sg) => sg.states));
    }

    partitions = newPartitions;

    if (changed) {
      partitionSteps.push(
        `Refinement iteration ${iteration}:\n${formatPartition(partitions)}`
      );
    } else {
      partitionSteps.push(
        `No more splits possible. Final partition:\n${formatPartition(partitions)}`
      );
    }
    iteration++;
  }

  // -------------------------------------------------------
  // Step 5: Build minimized DFA
  // -------------------------------------------------------
  // Representative of each group = its first state
  const representative = partitions.map((g) => g[0]);

  // Map old state → new state id (= index of its group)
  const stateMap = {};
  for (let i = 0; i < partitions.length; i++) {
    for (const s of partitions[i]) {
      stateMap[s] = i;
    }
  }

  // New start state
  const newStart = stateMap[start];

  // New accepting states
  const newAccept = [...new Set(accepting.map((s) => stateMap[s]))];

  // New transitions (deduplicate)
  const transitionSet = new Set();
  const newTransitions = [];
  for (const t of transitions) {
    if (!reachable.has(t.from) || !reachable.has(t.to)) continue;
    const from = stateMap[t.from];
    const to = stateMap[t.to];
    const key = `${from}-${t.symbol}-${to}`;
    if (!transitionSet.has(key)) {
      transitionSet.add(key);
      newTransitions.push({ from, to, symbol: t.symbol });
    }
  }

  // New state ids
  const newStates = partitions.map((_, i) => i);

  // Labels: show which original states merged
  const stateLabels = {};
  partitions.forEach((group, i) => {
    stateLabels[i] =
      group.length === 1
        ? `q${group[0]}`
        : '{' + group.map((s) => 'q' + s).join(',') + '}';
  });

  // Equivalent state groups (groups with more than one original state)
  const equivalentGroups = partitions
    .filter((g) => g.length > 1)
    .map((g) => ({
      merged: g.map((s) => 'q' + s),
      newState: 'q' + stateMap[g[0]],
    }));

  partitionSteps.push(
    `Minimized DFA has ${newStates.length} state(s) (reduced from ${reachableStates.length}).` +
    (equivalentGroups.length > 0
      ? `\nMerged groups:\n` +
        equivalentGroups
          .map((eg) => `  {${eg.merged.join(', ')}} → ${eg.newState}`)
          .join('\n')
      : '\nNo states were merged — the DFA was already minimal.')
  );

  return {
    minimized: {
      states: newStates,
      transitions: newTransitions,
      start: newStart,
      accept: newAccept,
      stateLabels,
    },
    partitionSteps,
    equivalentGroups,
    unreachable,
    finalPartitions: partitions,
    stateMap,
  };
}
