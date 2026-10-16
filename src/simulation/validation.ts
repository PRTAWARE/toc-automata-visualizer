import { EPSILON, EPSILON_ALIASES } from '../types/automata';
import type { Automaton, ValidationError, ValidationSummary } from '../types/automata';

export function validateAutomaton(automaton: Automaton): ValidationSummary {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Check states
  if (automaton.states.length === 0) {
    errors.push({
      id: 'no-states',
      type: 'error',
      message: 'Automaton must have at least one state.'
    });
    return { isValid: false, errors, warnings };
  }

  // 2. Start state check
  const startStates = automaton.states.filter(s => s.isStart);
  if (startStates.length === 0) {
    errors.push({
      id: 'no-start-state',
      type: 'error',
      message: 'No initial (start) state is designated. Please select one start state.'
    });
  } else if (startStates.length > 1) {
    errors.push({
      id: 'multiple-start-states',
      type: 'error',
      message: `Multiple start states found (${startStates.map(s => s.label).join(', ')}). Only one initial state is allowed.`
    });
  }

  // 3. Final state check
  const finalStates = automaton.states.filter(s => s.isFinal);
  if (finalStates.length === 0) {
    warnings.push({
      id: 'no-final-state',
      type: 'warning',
      message: 'No accepting (final) states are marked. All input strings will be rejected.'
    });
  }

  // 4. Alphabet check
  if (!automaton.alphabet || automaton.alphabet.length === 0) {
    errors.push({
      id: 'empty-alphabet',
      type: 'error',
      message: 'Alphabet Σ is empty. Please define at least one input symbol (e.g., "0", "1").'
    });
  }

  const stateIds = new Set(automaton.states.map(s => s.id));

  // 5. Transitions validity
  automaton.transitions.forEach((t, idx) => {
    if (!stateIds.has(t.from)) {
      errors.push({
        id: `invalid-from-${idx}`,
        type: 'error',
        message: `Transition #${idx + 1} originates from a non-existent state ID (${t.from}).`,
        transitionId: t.id
      });
    }
    if (!stateIds.has(t.to)) {
      errors.push({
        id: `invalid-to-${idx}`,
        type: 'error',
        message: `Transition #${idx + 1} leads to a non-existent state ID (${t.to}).`,
        transitionId: t.id
      });
    }

    const isEps = t.symbol === EPSILON || EPSILON_ALIASES.includes(t.symbol);
    if (isEps) {
      if (automaton.type === 'DFA') {
        errors.push({
          id: `dfa-epsilon-${t.id}`,
          type: 'error',
          message: `Epsilon (ε) transition found in a DFA (${t.from} → ${t.to}). DFAs do not allow ε-transitions.`,
          transitionId: t.id
        });
      } else if (automaton.type === 'NFA') {
        errors.push({
          id: `nfa-epsilon-${t.id}`,
          type: 'error',
          message: `Epsilon (ε) transition found in an standard NFA. Switch automaton type to ε-NFA to enable ε-moves.`,
          transitionId: t.id
        });
      }
    } else if (!automaton.alphabet.includes(t.symbol)) {
      errors.push({
        id: `symbol-not-in-alphabet-${t.id}`,
        type: 'error',
        message: `Transition symbol '${t.symbol}' is not present in defined alphabet Σ = { ${automaton.alphabet.join(', ')} }.`,
        transitionId: t.id
      });
    }
  });

  // 6. DFA Specific: Determinism & Completeness
  if (automaton.type === 'DFA') {
    for (const state of automaton.states) {
      for (const symbol of automaton.alphabet) {
        const matching = automaton.transitions.filter(
          t => t.from === state.id && t.symbol === symbol
        );

        if (matching.length === 0) {
          warnings.push({
            id: `missing-dfa-trans-${state.id}-${symbol}`,
            type: 'warning',
            message: `Missing transition: State '${state.label}' has no transition on symbol '${symbol}'.`,
            stateId: state.id
          });
        } else if (matching.length > 1) {
          errors.push({
            id: `multiple-dfa-trans-${state.id}-${symbol}`,
            type: 'error',
            message: `Non-deterministic transition: State '${state.label}' has ${matching.length} transitions on symbol '${symbol}'. DFAs require exactly 1.`,
            stateId: state.id
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateInputString(inputString: string, alphabet: string[]): {
  isValid: boolean;
  invalidSymbols: string[];
} {
  if (inputString === '') {
    return { isValid: true, invalidSymbols: [] };
  }

  const alphabetSet = new Set(alphabet);
  const invalidSymbols: string[] = [];

  for (const char of inputString) {
    if (!alphabetSet.has(char)) {
      if (!invalidSymbols.includes(char)) {
        invalidSymbols.push(char);
      }
    }
  }

  return {
    isValid: invalidSymbols.length === 0,
    invalidSymbols
  };
}
