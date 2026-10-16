import type { Automaton, SimulationResult, SimulationStep } from '../types/automata';

export function simulateDFA(automaton: Automaton, inputString: string): SimulationResult {
  const startState = automaton.states.find(s => s.isStart);
  if (!startState) {
    return {
      accepted: false,
      steps: [],
      finalActiveStates: [],
      message: 'No start state defined for this DFA.',
      inputString
    };
  }

  const steps: SimulationStep[] = [];
  let currentStateId = startState.id;
  const chars = inputString.split('');

  // Step 0: Initial state
  steps.push({
    stepIndex: 0,
    symbolRead: null,
    activeStates: [currentStateId],
    activeTransitions: [],
    remainingInput: inputString,
    consumedInput: '',
    explanation: `Start at initial state ${startState.label || startState.id}`
  });

  let consumed = '';
  let haltedEarly = false;
  let haltReason = '';

  for (let i = 0; i < chars.length; i++) {
    const symbol = chars[i];
    consumed += symbol;
    const remaining = inputString.slice(i + 1);

    // Find outgoing transition from currentStateId on symbol
    const matchingTransitions = automaton.transitions.filter(
      t => t.from === currentStateId && t.symbol === symbol
    );

    if (matchingTransitions.length === 0) {
      haltedEarly = true;
      const currentObj = automaton.states.find(s => s.id === currentStateId);
      haltReason = `Missing transition: State ${currentObj?.label || currentStateId} has no transition for symbol '${symbol}'. Automaton halted.`;
      steps.push({
        stepIndex: i + 1,
        symbolRead: symbol,
        activeStates: [],
        activeTransitions: [],
        remainingInput: remaining,
        consumedInput: consumed,
        explanation: haltReason
      });
      break;
    }

    // In a DFA, take the transition
    const chosenTransition = matchingTransitions[0];
    const prevId = currentStateId;
    currentStateId = chosenTransition.to;

    const fromObj = automaton.states.find(s => s.id === prevId);
    const toObj = automaton.states.find(s => s.id === currentStateId);

    steps.push({
      stepIndex: i + 1,
      symbolRead: symbol,
      activeStates: [currentStateId],
      activeTransitions: [chosenTransition.id],
      remainingInput: remaining,
      consumedInput: consumed,
      explanation: `Read '${symbol}': Move from ${fromObj?.label || prevId} to ${toObj?.label || currentStateId} via δ(${fromObj?.label}, '${symbol}')`
    });
  }

  if (haltedEarly) {
    return {
      accepted: false,
      steps,
      finalActiveStates: [],
      message: haltReason,
      inputString
    };
  }

  const finalStateObj = automaton.states.find(s => s.id === currentStateId);
  const isAccepted = !!finalStateObj?.isFinal;

  const finalExplanation = isAccepted
    ? `Accepted: Halted in accepting state '${finalStateObj?.label || currentStateId}'.`
    : `Rejected: Halted in non-accepting state '${finalStateObj?.label || currentStateId}'.`;

  return {
    accepted: isAccepted,
    steps,
    finalActiveStates: [currentStateId],
    message: finalExplanation,
    inputString
  };
}
