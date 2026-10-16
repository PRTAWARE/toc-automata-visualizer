import { EPSILON } from '../types/automata';
import type { Automaton, SimulationResult, SimulationStep } from '../types/automata';

/**
 * Computes epsilon-closure for a set of state IDs.
 * Returns both the resulting set of state IDs and the IDs of any epsilon transitions traversed.
 */
export function computeEpsilonClosure(
  stateIds: string[],
  automaton: Automaton
): { closureStates: string[]; epsilonTransitions: string[] } {
  const closure = new Set<string>(stateIds);
  const epsilonTransitions: string[] = [];
  const queue = [...stateIds];

  while (queue.length > 0) {
    const current = queue.shift()!;
    // Find all outgoing transitions with symbol EPSILON or 'ε'
    const epsTransitions = automaton.transitions.filter(
      t => t.from === current && (t.symbol === EPSILON || t.symbol === 'ε' || t.symbol === 'λ')
    );

    for (const t of epsTransitions) {
      if (!epsilonTransitions.includes(t.id)) {
        epsilonTransitions.push(t.id);
      }
      if (!closure.has(t.to)) {
        closure.add(t.to);
        queue.push(t.to);
      }
    }
  }

  return {
    closureStates: Array.from(closure),
    epsilonTransitions
  };
}

export function simulateNFA(automaton: Automaton, inputString: string): SimulationResult {
  const startState = automaton.states.find(s => s.isStart);
  if (!startState) {
    return {
      accepted: false,
      steps: [],
      finalActiveStates: [],
      message: 'No start state defined for this NFA.',
      inputString
    };
  }

  const isENFA = automaton.type === 'ENFA';
  const steps: SimulationStep[] = [];
  const chars = inputString.split('');

  // Initial state computation (with ε-closure if ENFA)
  let currentStates: string[] = [startState.id];
  let initialEpsTransitions: string[] = [];

  if (isENFA) {
    const closureRes = computeEpsilonClosure([startState.id], automaton);
    currentStates = closureRes.closureStates;
    initialEpsTransitions = closureRes.epsilonTransitions;
  }

  const startLabels = currentStates
    .map(id => automaton.states.find(s => s.id === id)?.label || id)
    .join(', ');

  steps.push({
    stepIndex: 0,
    symbolRead: null,
    activeStates: [...currentStates],
    activeTransitions: initialEpsTransitions,
    remainingInput: inputString,
    consumedInput: '',
    explanation: isENFA && currentStates.length > 1
      ? `Start at { ${startState.label} }, expanded via ε-closure to active states: { ${startLabels} }`
      : `Start at active state(s): { ${startLabels} }`
  });

  let consumed = '';
  let deadEnd = false;

  for (let i = 0; i < chars.length; i++) {
    const symbol = chars[i];
    consumed += symbol;
    const remaining = inputString.slice(i + 1);

    if (currentStates.length === 0) {
      deadEnd = true;
      steps.push({
        stepIndex: i + 1,
        symbolRead: symbol,
        activeStates: [],
        activeTransitions: [],
        remainingInput: remaining,
        consumedInput: consumed,
        explanation: `Dead end: No active states remaining to read symbol '${symbol}'. Automaton halted.`
      });
      break;
    }

    // Find all transitions from any state in currentStates on symbol
    const validTransitions = automaton.transitions.filter(
      t => currentStates.includes(t.from) && t.symbol === symbol
    );

    const directTargets = Array.from(new Set(validTransitions.map(t => t.to)));
    const activeTransitions = validTransitions.map(t => t.id);

    let nextStates = directTargets;
    let epsTransitions: string[] = [];

    if (isENFA && directTargets.length > 0) {
      const closureRes = computeEpsilonClosure(directTargets, automaton);
      nextStates = closureRes.closureStates;
      epsTransitions = closureRes.epsilonTransitions;
    }

    const prevLabels = currentStates
      .map(id => automaton.states.find(s => s.id === id)?.label || id)
      .join(', ');
    const nextLabels = nextStates
      .map(id => automaton.states.find(s => s.id === id)?.label || id)
      .join(', ');

    let explanation = '';
    if (nextStates.length === 0) {
      explanation = `Read '${symbol}': From active states { ${prevLabels} }, no valid transitions on '${symbol}'. Branches died out.`;
    } else {
      explanation = `Read '${symbol}': From { ${prevLabels} } → Moved to { ${nextLabels} } (${validTransitions.length} branch${validTransitions.length > 1 ? 'es' : ''})`;
      if (isENFA && epsTransitions.length > 0) {
        explanation += ` including ε-closure expansion.`;
      }
    }

    currentStates = nextStates;

    steps.push({
      stepIndex: i + 1,
      symbolRead: symbol,
      activeStates: [...currentStates],
      activeTransitions: [...activeTransitions, ...epsTransitions],
      remainingInput: remaining,
      consumedInput: consumed,
      explanation
    });
  }

  // Acceptance criteria: At least one active state is an accepting final state
  const finalStateIds = new Set(automaton.states.filter(s => s.isFinal).map(s => s.id));
  const acceptedStates = currentStates.filter(id => finalStateIds.has(id));
  const isAccepted = acceptedStates.length > 0;

  const acceptedLabels = acceptedStates
    .map(id => automaton.states.find(s => s.id === id)?.label || id)
    .join(', ');
  const finalActiveLabels = currentStates
    .map(id => automaton.states.find(s => s.id === id)?.label || id)
    .join(', ');

  let message = '';
  if (deadEnd || currentStates.length === 0) {
    message = `Rejected: Automaton reached a dead-end with no active states remaining.`;
  } else if (isAccepted) {
    message = `Accepted: At least one active path reached final state(s): { ${acceptedLabels} } out of active set { ${finalActiveLabels} }.`;
  } else {
    message = `Rejected: None of the final active states { ${finalActiveLabels || '∅'} } are accepting states.`;
  }

  return {
    accepted: isAccepted,
    steps,
    finalActiveStates: currentStates,
    message,
    inputString
  };
}
