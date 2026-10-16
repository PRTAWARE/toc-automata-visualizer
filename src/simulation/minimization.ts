import type { Automaton, State, Transition } from '../types/automata';
import { EPSILON, EPSILON_ALIASES } from '../types/automata';
import { simulateDFA } from './dfa';

export interface MinimizationSplit {
  groupId: number;
  reason: string;
  subgroups: string[][];
}

export interface MinimizationStep {
  iteration: number;
  description: string;
  partitionBefore: string[][]; // array of state ID groups
  partitionAfter: string[][];
  splits: MinimizationSplit[];
}

export interface MinimizedGroupMapping {
  minimizedStateId: string;
  originalStateIds: string[];
  label: string;
  isStart: boolean;
  isFinal: boolean;
}

export interface MinimizationResult {
  minimizedAutomaton: Automaton;
  unreachableStates: string[];
  reachableStates: string[];
  initialPartition: string[][];
  partitionsHistory: MinimizationStep[];
  mergedGroups: MinimizedGroupMapping[];
  originalStateCount: number;
  minimizedStateCount: number;
}

export function minimizeDFA(dfa: Automaton): MinimizationResult | { error: string } {
  // 1. Structural & Determinism Validations
  if (dfa.type === 'NFA' || dfa.type === 'ENFA') {
    return {
      error: `Cannot minimize an ${dfa.type === 'ENFA' ? 'ε-NFA' : 'NFA'}. DFA Minimization requires a Deterministic Finite Automaton. Please use "Convert to DFA" (Subset Construction) first.`
    };
  }

  if (!dfa.states || dfa.states.length === 0) {
    return { error: 'Automaton has no states.' };
  }

  const startStates = dfa.states.filter(s => s.isStart);
  if (startStates.length === 0) {
    return { error: 'DFA must have an initial (start) state before minimization.' };
  }
  if (startStates.length > 1) {
    return {
      error: `DFA has multiple start states (${startStates.map(s => s.label).join(', ')}). Exactly one initial state is allowed.`
    };
  }
  const startState = startStates[0];

  if (!dfa.alphabet || dfa.alphabet.length === 0) {
    return { error: 'DFA alphabet cannot be empty.' };
  }

  // Check for epsilon transitions
  const hasEps = dfa.transitions.some(
    t => t.symbol === EPSILON || EPSILON_ALIASES.includes(t.symbol)
  );
  if (hasEps) {
    return { error: 'DFA contains ε (epsilon) transitions. DFAs cannot contain epsilon transitions.' };
  }

  // Check for non-determinism (multiple transitions on same symbol from same state)
  const stateIdSet = new Set(dfa.states.map(s => s.id));
  for (const s of dfa.states) {
    const seenSymbols = new Set<string>();
    const outgoing = dfa.transitions.filter(t => t.from === s.id);
    for (const t of outgoing) {
      if (!dfa.alphabet.includes(t.symbol)) continue;
      if (seenSymbols.has(t.symbol)) {
        return {
          error: `Non-deterministic transition detected at state "${s.label || s.id}" on symbol "${t.symbol}". A DFA can have at most one transition per symbol per state.`
        };
      }
      seenSymbols.add(t.symbol);
    }
  }

  // 2. Reachability Analysis (BFS from start state along valid existing transitions)
  const visited = new Set<string>([startState.id]);
  const queue: string[] = [startState.id];

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const outgoing = dfa.transitions.filter(t => t.from === currId);
    for (const t of outgoing) {
      if (stateIdSet.has(t.to) && !visited.has(t.to)) {
        visited.add(t.to);
        queue.push(t.to);
      }
    }
  }

  const reachableStates = dfa.states.filter(s => visited.has(s.id));
  const unreachableStates = dfa.states.filter(s => !visited.has(s.id)).map(s => s.id);
  const unreachableLabels = dfa.states
    .filter(s => !visited.has(s.id))
    .map(s => s.label || s.id);

  // Transition lookup map for reachable states: stateId -> { symbol -> targetStateId }
  const transitionMap = new Map<string, Map<string, string>>();
  reachableStates.forEach(s => transitionMap.set(s.id, new Map()));
  dfa.transitions.forEach(t => {
    if (visited.has(t.from) && visited.has(t.to)) {
      const map = transitionMap.get(t.from);
      if (map) {
        map.set(t.symbol, t.to);
      }
    }
  });

  // 3. Initial Partition P0: Separate Non-Final and Final among reachable states
  const nonFinalStates = reachableStates.filter(s => !s.isFinal).map(s => s.id);
  const finalStates = reachableStates.filter(s => s.isFinal).map(s => s.id);

  let currentPartition: string[][] = [];
  if (nonFinalStates.length > 0) currentPartition.push(nonFinalStates);
  if (finalStates.length > 0) currentPartition.push(finalStates);

  const initialPartition = currentPartition.map(g => [...g]);
  const partitionsHistory: MinimizationStep[] = [];

  // Step 0: Initial partition and unreachable states removal
  const step0Desc = unreachableStates.length > 0
    ? `Step 0: Removed ${unreachableStates.length} unreachable state(s) {${unreachableLabels.join(', ')}}. Initialized partition P₀ separating Non-Accepting and Accepting states.`
    : `Step 0: Initialized partition P₀ separating Non-Accepting and Accepting states.`;

  partitionsHistory.push({
    iteration: 0,
    description: step0Desc,
    partitionBefore: [reachableStates.map(s => s.id)],
    partitionAfter: currentPartition.map(g => [...g]),
    splits: []
  });

  const getGroupIndex = (stateId: string, partition: string[][]): number => {
    return partition.findIndex(group => group.includes(stateId));
  };

  // 4. Refinement Loop (Moore's algorithm)
  let iteration = 0;
  const maxIterations = 50;

  while (iteration < maxIterations) {
    iteration++;
    const nextPartition: string[][] = [];
    const stepSplits: MinimizationSplit[] = [];
    let partitionChanged = false;

    currentPartition.forEach((group, groupIdx) => {
      if (group.length <= 1) {
        nextPartition.push(group);
        return;
      }

      // Group states by signature: sym:targetGroupIdx
      // If a transition is missing, targetGroupIdx is -1 (halt/reject class)
      const signatureMap = new Map<string, string[]>();

      group.forEach(stateId => {
        const tMap = transitionMap.get(stateId);
        const signatureParts: string[] = [];
        dfa.alphabet.forEach(sym => {
          const target = tMap ? tMap.get(sym) : undefined;
          const targetGroupIdx = target !== undefined ? getGroupIndex(target, currentPartition) : -1;
          signatureParts.push(`${sym}:${targetGroupIdx}`);
        });
        const sigKey = signatureParts.join('|');
        if (!signatureMap.has(sigKey)) {
          signatureMap.set(sigKey, []);
        }
        signatureMap.get(sigKey)!.push(stateId);
      });

      const subgroups = Array.from(signatureMap.values());

      if (subgroups.length > 1) {
        partitionChanged = true;
        const groupLabels = group
          .map(id => reachableStates.find(s => s.id === id)?.label || id)
          .join(', ');
        const reason = `Group { ${groupLabels} } was split into ${subgroups.length} subgroups because states transition to different equivalence classes on alphabet symbols Σ = { ${dfa.alphabet.join(', ')} }.`;

        stepSplits.push({
          groupId: groupIdx,
          reason,
          subgroups: subgroups.map(sg => [...sg])
        });

        subgroups.forEach(sg => nextPartition.push(sg));
      } else {
        nextPartition.push(group);
      }
    });

    const stepBefore = currentPartition.map(g => [...g]);
    const stepAfter = nextPartition.map(g => [...g]);

    partitionsHistory.push({
      iteration,
      description: stepSplits.length > 0
        ? `Iteration ${iteration}: Refined partition by splitting groups with divergent transition signatures.`
        : `Iteration ${iteration}: Partition is stable. No further splits possible.`,
      partitionBefore: stepBefore,
      partitionAfter: stepAfter,
      splits: stepSplits
    });

    if (!partitionChanged) {
      break;
    }

    currentPartition = nextPartition;
  }

  // 5. Construct Minimized DFA from final stable partition
  const finalPartition = currentPartition;
  const mergedGroups: MinimizedGroupMapping[] = [];
  const stateIdToMinId = new Map<string, string>();

  // Ensure the group containing start state is always indexed first as min_q0
  const startGroupIdx = finalPartition.findIndex(g => g.includes(startState.id));
  const orderedPartition: string[][] = [];
  if (startGroupIdx >= 0) {
    orderedPartition.push(finalPartition[startGroupIdx]);
    finalPartition.forEach((g, idx) => {
      if (idx !== startGroupIdx) orderedPartition.push(g);
    });
  } else {
    orderedPartition.push(...finalPartition);
  }

  orderedPartition.forEach((group, idx) => {
    const minId = `min_q${idx}`;
    group.forEach(origId => stateIdToMinId.set(origId, minId));

    const originalStatesInGroup = group
      .map(id => reachableStates.find(s => s.id === id))
      .filter(Boolean) as State[];
    const hasStart = originalStatesInGroup.some(s => s.isStart);
    const hasFinal = originalStatesInGroup.some(s => s.isFinal);
    const labels = originalStatesInGroup.map(s => s.label).sort();
    const groupName = labels.length > 1 ? `{${labels.join(', ')}}` : labels[0] || `q${idx}`;

    mergedGroups.push({
      minimizedStateId: minId,
      originalStateIds: group,
      label: groupName,
      isStart: hasStart,
      isFinal: hasFinal
    });
  });

  const minimizedStates: State[] = [];
  const totalMin = mergedGroups.length;
  const radius = Math.max(140, totalMin * 45);
  const centerX = 350;
  const centerY = 250;

  mergedGroups.forEach((mg, index) => {
    let x = centerX;
    let y = centerY;
    if (totalMin === 1) {
      x = centerX;
      y = centerY;
    } else if (totalMin === 2) {
      x = index === 0 ? centerX - 120 : centerX + 120;
      y = centerY;
    } else {
      const angle = (2 * Math.PI * index) / totalMin - Math.PI / 2;
      x = Math.round(centerX + radius * Math.cos(angle));
      y = Math.round(centerY + radius * Math.sin(angle));
    }

    minimizedStates.push({
      id: mg.minimizedStateId,
      label: mg.label,
      isStart: mg.isStart,
      isFinal: mg.isFinal,
      x,
      y
    });
  });

  // Construct deduplicated minimized transitions
  const minTransitionsMap = new Map<string, Transition>();

  orderedPartition.forEach((group, idx) => {
    const sourceMinId = `min_q${idx}`;
    const repStateId = group[0];
    const tMap = transitionMap.get(repStateId);

    if (tMap) {
      dfa.alphabet.forEach(sym => {
        const targetOrigId = tMap.get(sym);
        if (targetOrigId !== undefined) {
          const targetMinId = stateIdToMinId.get(targetOrigId);
          if (targetMinId) {
            const transKey = `${sourceMinId}_${targetMinId}_${sym}`;
            if (!minTransitionsMap.has(transKey)) {
              minTransitionsMap.set(transKey, {
                id: `mt_${transKey}_${Math.random().toString(36).substring(2, 6)}`,
                from: sourceMinId,
                to: targetMinId,
                symbol: sym
              });
            }
          }
        }
      });
    }
  });

  const minimizedAutomaton: Automaton = {
    id: `minimized_dfa_${Date.now()}`,
    title: `Minimized ${dfa.title || 'DFA'}`,
    description: `Equivalent minimized DFA generated via partition refinement (${dfa.states.length} → ${minimizedStates.length} states).`,
    type: 'DFA',
    alphabet: [...dfa.alphabet],
    states: minimizedStates,
    transitions: Array.from(minTransitionsMap.values())
  };

  return {
    minimizedAutomaton,
    unreachableStates,
    reachableStates: reachableStates.map(s => s.id),
    initialPartition,
    partitionsHistory,
    mergedGroups,
    originalStateCount: dfa.states.length,
    minimizedStateCount: minimizedStates.length
  };
}

export function verifyDfaEquivalence(
  dfa1: Automaton,
  dfa2: Automaton,
  testStrings: string[]
): { input: string; result1: boolean; result2: boolean; matched: boolean }[] {
  return testStrings.map(str => {
    const res1 = simulateDFA(dfa1, str);
    const res2 = simulateDFA(dfa2, str);
    return {
      input: str,
      result1: res1.accepted,
      result2: res2.accepted,
      matched: res1.accepted === res2.accepted
    };
  });
}
