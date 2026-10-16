import type { Automaton, BatchTestItem } from '../types/automata';
import { simulateDFA } from './dfa';
import { simulateNFA } from './nfa';

export function runBatchTests(automaton: Automaton, testCases: BatchTestItem[]): BatchTestItem[] {
  return testCases.map(tc => {
    let result;
    if (automaton.type === 'DFA') {
      result = simulateDFA(automaton, tc.input);
    } else {
      result = simulateNFA(automaton, tc.input);
    }

    const passed = tc.expected !== undefined ? result.accepted === tc.expected : undefined;

    return {
      ...tc,
      actual: result.accepted,
      passed,
      explanation: result.message
    };
  });
}

/**
 * Generate systematic test strings (length 0, 1, 2, 3...) from the given alphabet
 */
export function generateSystematicStrings(alphabet: string[], maxLength: number = 3): string[] {
  const results: string[] = ['']; // Empty string epsilon first

  if (alphabet.length === 0) return results;

  let currentLevel = [''];
  for (let len = 1; len <= maxLength; len++) {
    const nextLevel: string[] = [];
    for (const prefix of currentLevel) {
      for (const symbol of alphabet) {
        const nextStr = prefix + symbol;
        nextLevel.push(nextStr);
        results.push(nextStr);
      }
    }
    currentLevel = nextLevel;
  }

  return results;
}
