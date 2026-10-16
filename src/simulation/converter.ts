import type { Automaton, ConvertedDFA, State, SubsetConstructionStep, Transition } from '../types/automata';
import { computeEpsilonClosure } from './nfa';

export function convertNfaToDfa(nfa: Automaton): ConvertedDFA | { error: string } {
  const startState = nfa.states.find(s => s.isStart);
  if (!startState) {
    return { error: 'NFA must have a start state to convert.' };
  }

  const isENFA = nfa.type === 'ENFA';
  const initialSet = isENFA
    ? computeEpsilonClosure([startState.id], nfa).closureStates
    : [startState.id];

  const getKey = (ids: string[]) => [...ids].sort().join(',');
  const getDisplayLabel = (ids: string[]) => {
    if (ids.length === 0) return '∅ (Trap)';
    const labels = ids
      .map(id => nfa.states.find(s => s.id === id)?.label || id)
      .sort();
    return `{${labels.join(', ')}}`;
  };

  const finalSet = new Set(nfa.states.filter(s => s.isFinal).map(s => s.id));

  const subsetMap = new Map<string, string[]>(); // key -> stateIds
  const subsetKeyToDfaId = new Map<string, string>();
  const dfaStates: State[] = [];
  const dfaTransitions: Transition[] = [];
  const steps: SubsetConstructionStep[] = [];

  const initialKey = getKey(initialSet);
  subsetMap.set(initialKey, initialSet);

  const initialDfaId = 'dfa_q0';
  subsetKeyToDfaId.set(initialKey, initialDfaId);

  const queue: string[] = [initialKey];
  let stateCounter = 0;

  // Track if we need a trap state
  let hasTrapState = false;
  const trapKey = '';

  while (queue.length > 0) {
    const currentKey = queue.shift()!;
    const currentStates = subsetMap.get(currentKey) || [];
    const currentDfaId = subsetKeyToDfaId.get(currentKey)!;

    const isStart = currentDfaId === initialDfaId;
    const isFinal = currentStates.some(id => finalSet.has(id));

    const stepTransitions: Record<string, string[]> = {};

    for (const symbol of nfa.alphabet) {
      // Find destinations from all states in currentStates on symbol
      const directTransitions = nfa.transitions.filter(
        t => currentStates.includes(t.from) && t.symbol === symbol
      );
      const directDestinations = Array.from(new Set(directTransitions.map(t => t.to)));

      let targetStates = directDestinations;
      if (isENFA && directDestinations.length > 0) {
        targetStates = computeEpsilonClosure(directDestinations, nfa).closureStates;
      }

      stepTransitions[symbol] = targetStates;
      const targetKey = getKey(targetStates);

      if (targetStates.length === 0) {
        // Leads to dead-end/trap state
        if (!hasTrapState) {
          hasTrapState = true;
          const trapDfaId = `dfa_trap`;
          subsetKeyToDfaId.set(trapKey, trapDfaId);
          subsetMap.set(trapKey, []);
          queue.push(trapKey);
        }
        dfaTransitions.push({
          id: `t_${currentDfaId}_${subsetKeyToDfaId.get(trapKey)}_${symbol}_${dfaTransitions.length}`,
          from: currentDfaId,
          to: subsetKeyToDfaId.get(trapKey)!,
          symbol
        });
      } else {
        if (!subsetKeyToDfaId.has(targetKey)) {
          stateCounter++;
          const newDfaId = `dfa_q${stateCounter}`;
          subsetKeyToDfaId.set(targetKey, newDfaId);
          subsetMap.set(targetKey, targetStates);
          queue.push(targetKey);
        }

        const targetDfaId = subsetKeyToDfaId.get(targetKey)!;
        dfaTransitions.push({
          id: `t_${currentDfaId}_${targetDfaId}_${symbol}_${dfaTransitions.length}`,
          from: currentDfaId,
          to: targetDfaId,
          symbol
        });
      }
    }

    steps.push({
      subsetName: getDisplayLabel(currentStates),
      stateSet: currentStates,
      transitions: stepTransitions,
      isStart,
      isFinal
    });
  }

  // Position the states in a neat layout
  const allKeys = Array.from(subsetKeyToDfaId.keys());
  const total = allKeys.length;
  const radius = Math.max(160, total * 35);
  const centerX = 350;
  const centerY = 280;

  allKeys.forEach((key, index) => {
    const dfaId = subsetKeyToDfaId.get(key)!;
    const statesInSubset = subsetMap.get(key) || [];
    const isStart = dfaId === initialDfaId;
    const isFinal = statesInSubset.some(id => finalSet.has(id));

    let x = centerX;
    let y = centerY;
    if (total === 1) {
      x = centerX;
      y = centerY;
    } else {
      const angle = (2 * Math.PI * index) / total - Math.PI / 2;
      x = Math.round(centerX + radius * Math.cos(angle));
      y = Math.round(centerY + radius * Math.sin(angle));
    }

    const label = key === trapKey ? 'Trap' : `Q${index}: ${getDisplayLabel(statesInSubset)}`;

    dfaStates.push({
      id: dfaId,
      label,
      isStart,
      isFinal,
      x,
      y
    });
  });

  const mappingObj: Record<string, string> = {};
  subsetKeyToDfaId.forEach((v, k) => {
    mappingObj[k] = v;
  });

  const convertedAutomaton: Automaton = {
    id: `converted_dfa_${Date.now()}`,
    title: `DFA converted from ${nfa.title || nfa.type}`,
    description: `Equivalent Deterministic Finite Automaton generated via Subset Construction.`,
    type: 'DFA',
    alphabet: [...nfa.alphabet],
    states: dfaStates,
    transitions: dfaTransitions
  };

  return {
    automaton: convertedAutomaton,
    steps,
    mapping: mappingObj
  };
}
