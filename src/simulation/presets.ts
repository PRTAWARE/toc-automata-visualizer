import { EPSILON } from '../types/automata';
import type { Automaton, BatchTestItem } from '../types/automata';

export interface AutomatonPreset {
  automaton: Automaton;
  sampleTestCases: BatchTestItem[];
  category?: 'minimization' | 'conversion' | 'classic';
  minimizationTarget?: string;
}

export const PRESET_AUTOMATA: Record<string, AutomatonPreset> = {
  // --- DFA Minimization Specialized Presets ---
  'dfa-minimization-multistep': {
    category: 'minimization',
    minimizationTarget: '5 → 4 States (3 iterations)',
    automaton: {
      id: 'dfa-minimization-multistep',
      title: 'DFA Minimization: Multi-Step Refinement (5 → 4 States)',
      description: 'Classic textbook DFA demonstrating sequential partition splitting (P₀ → P₁ → P₂ → Stable). Merges equivalent state pair {A, C}.',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'A', label: 'A', isStart: true, isFinal: false, x: 120, y: 180 },
        { id: 'B', label: 'B', isStart: false, isFinal: false, x: 280, y: 180 },
        { id: 'C', label: 'C', isStart: false, isFinal: false, x: 120, y: 340 },
        { id: 'D', label: 'D', isStart: false, isFinal: false, x: 440, y: 180 },
        { id: 'E', label: 'E', isStart: false, isFinal: true, x: 600, y: 180 }
      ],
      transitions: [
        { id: 't_A_0', from: 'A', to: 'B', symbol: '0' },
        { id: 't_A_1', from: 'A', to: 'C', symbol: '1' },
        { id: 't_B_0', from: 'B', to: 'B', symbol: '0' },
        { id: 't_B_1', from: 'B', to: 'D', symbol: '1' },
        { id: 't_C_0', from: 'C', to: 'B', symbol: '0' },
        { id: 't_C_1', from: 'C', to: 'C', symbol: '1' },
        { id: 't_D_0', from: 'D', to: 'B', symbol: '0' },
        { id: 't_D_1', from: 'D', to: 'E', symbol: '1' },
        { id: 't_E_0', from: 'E', to: 'B', symbol: '0' },
        { id: 't_E_1', from: 'E', to: 'C', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'm1', input: '', expected: false, explanation: 'Starts at non-final state A' },
      { id: 'm2', input: '0', expected: false, explanation: 'A -> B' },
      { id: 'm3', input: '1', expected: false, explanation: 'A -> C' },
      { id: 'm4', input: '01', expected: false, explanation: 'A -> B -> D' },
      { id: 'm5', input: '011', expected: true, explanation: 'A -> B -> D -> E (final)' },
      { id: 'm6', input: '11011', expected: true, explanation: 'A -> C -> C -> B -> D -> E (final)' },
      { id: 'm7', input: '0110', expected: false, explanation: 'A -> B -> D -> E -> B (non-final)' }
    ]
  },

  'dfa-minimization-8states': {
    category: 'minimization',
    minimizationTarget: '8 → 5 States (Hopcroft Classic)',
    automaton: {
      id: 'dfa-minimization-8states',
      title: 'DFA Minimization: Hopcroft 8-State Redundant Machine (8 → 5 States)',
      description: 'Hopcroft & Ullman textbook standard example. Eliminates unreachable state D and collapses equivalent pairs ({A≡E}, {B≡H}).',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'A', label: 'A', isStart: true, isFinal: false, x: 120, y: 160 },
        { id: 'B', label: 'B', isStart: false, isFinal: false, x: 280, y: 160 },
        { id: 'C', label: 'C', isStart: false, isFinal: true, x: 440, y: 160 },
        { id: 'D', label: 'D', isStart: false, isFinal: false, x: 600, y: 160 },
        { id: 'E', label: 'E', isStart: false, isFinal: false, x: 120, y: 340 },
        { id: 'F', label: 'F', isStart: false, isFinal: false, x: 600, y: 340 },
        { id: 'G', label: 'G', isStart: false, isFinal: false, x: 440, y: 340 },
        { id: 'H', label: 'H', isStart: false, isFinal: false, x: 280, y: 340 }
      ],
      transitions: [
        { id: 't_A_0', from: 'A', to: 'B', symbol: '0' },
        { id: 't_A_1', from: 'A', to: 'F', symbol: '1' },
        { id: 't_B_0', from: 'B', to: 'G', symbol: '0' },
        { id: 't_B_1', from: 'B', to: 'C', symbol: '1' },
        { id: 't_C_0', from: 'C', to: 'A', symbol: '0' },
        { id: 't_C_1', from: 'C', to: 'C', symbol: '1' },
        { id: 't_D_0', from: 'D', to: 'C', symbol: '0' },
        { id: 't_D_1', from: 'D', to: 'G', symbol: '1' },
        { id: 't_E_0', from: 'E', to: 'H', symbol: '0' },
        { id: 't_E_1', from: 'E', to: 'F', symbol: '1' },
        { id: 't_F_0', from: 'F', to: 'C', symbol: '0' },
        { id: 't_F_1', from: 'F', to: 'G', symbol: '1' },
        { id: 't_G_0', from: 'G', to: 'G', symbol: '0' },
        { id: 't_G_1', from: 'G', to: 'E', symbol: '1' },
        { id: 't_H_0', from: 'H', to: 'G', symbol: '0' },
        { id: 't_H_1', from: 'H', to: 'C', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'h1', input: '', expected: false, explanation: 'Non-final start state A' },
      { id: 'h2', input: '01', expected: true, explanation: 'A -> B -> C (final)' },
      { id: 'h3', input: '10', expected: true, explanation: 'A -> F -> C (final)' },
      { id: 'h4', input: '011', expected: true, explanation: 'A -> B -> C -> C (final)' },
      { id: 'h5', input: '00', expected: false, explanation: 'A -> B -> G (non-final)' },
      { id: 'h6', input: '00101', expected: true, explanation: 'A -> B -> G -> E -> H -> C (final)' }
    ]
  },

  'dfa-minimization-6states': {
    category: 'minimization',
    minimizationTarget: '6 → 2 States (Unreachable + Equivalent)',
    automaton: {
      id: 'dfa-minimization-6states',
      title: 'DFA Minimization: Unreachable & Dual Pairs (6 → 2 States)',
      description: 'Features 6 states {A, B, C, D, E, F} with unreachable states (E, F) and equivalent pairs (A≡B, C≡D). Minimizes cleanly to 2 states.',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'A', label: 'A', isStart: true, isFinal: false, x: 150, y: 180 },
        { id: 'B', label: 'B', isStart: false, isFinal: false, x: 350, y: 180 },
        { id: 'C', label: 'C', isStart: false, isFinal: true, x: 550, y: 180 },
        { id: 'D', label: 'D', isStart: false, isFinal: true, x: 750, y: 180 },
        { id: 'E', label: 'E', isStart: false, isFinal: false, x: 350, y: 350 },
        { id: 'F', label: 'F', isStart: false, isFinal: false, x: 550, y: 350 }
      ],
      transitions: [
        { id: 't_A_0', from: 'A', to: 'B', symbol: '0' },
        { id: 't_A_1', from: 'A', to: 'C', symbol: '1' },
        { id: 't_B_0', from: 'B', to: 'A', symbol: '0' },
        { id: 't_B_1', from: 'B', to: 'D', symbol: '1' },
        { id: 't_C_0', from: 'C', to: 'A', symbol: '0' },
        { id: 't_C_1', from: 'C', to: 'C', symbol: '1' },
        { id: 't_D_0', from: 'D', to: 'B', symbol: '0' },
        { id: 't_D_1', from: 'D', to: 'D', symbol: '1' },
        { id: 't_E_0', from: 'E', to: 'E', symbol: '0' },
        { id: 't_E_1', from: 'E', to: 'E', symbol: '1' },
        { id: 't_F_0', from: 'F', to: 'E', symbol: '0' },
        { id: 't_F_1', from: 'F', to: 'F', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: '', expected: false, explanation: 'Empty string starts at A (non-final)' },
      { id: 'c2', input: '0', expected: false, explanation: 'A -> B (non-final)' },
      { id: 'c3', input: '1', expected: true, explanation: 'A -> C (final)' },
      { id: 'c4', input: '10', expected: false, explanation: 'A -> C -> A (non-final)' },
      { id: 'c5', input: '101', expected: true, explanation: 'A -> C -> A -> C (final)' },
      { id: 'c6', input: '111', expected: true, explanation: 'A -> C -> C -> C (final)' },
      { id: 'c7', input: '1000', expected: false, explanation: 'Ends in non-final state' }
    ]
  },

  // --- Classic Deterministic Finite Automata ---
  'dfa-ends-in-1': {
    category: 'classic',
    automaton: {
      id: 'dfa-ends-in-1',
      title: 'DFA: Strings ending in 1',
      description: 'Accepts all binary strings that end with the symbol 1. Starts in q0, switches to accepting q1 whenever 1 is seen.',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q0', isStart: true, isFinal: false, x: 180, y: 220 },
        { id: 'q1', label: 'q1', isStart: false, isFinal: true, x: 440, y: 220 }
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q0', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q1', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: '1011', expected: true, explanation: 'Ends in 1' },
      { id: 'c2', input: '110', expected: false, explanation: 'Ends in 0' },
      { id: 'c3', input: '111', expected: true, explanation: 'Ends in 1' },
      { id: 'c4', input: '', expected: false, explanation: 'Empty string' },
      { id: 'c5', input: '1', expected: true, explanation: 'Single 1' },
      { id: 'c6', input: '0', expected: false, explanation: 'Single 0' },
      { id: 'c7', input: '10101', expected: true, explanation: 'Ends in 1' }
    ]
  },

  'dfa-substring-010': {
    category: 'classic',
    automaton: {
      id: 'dfa-substring-010',
      title: 'DFA: Contains Substring "010"',
      description: 'Recognizes any binary string that contains the contiguous pattern "010". Once "010" is seen, it stays in accepting state q3.',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q0', isStart: true, isFinal: false, x: 120, y: 220 },
        { id: 'q1', label: 'q1', isStart: false, isFinal: false, x: 290, y: 220 },
        { id: 'q2', label: 'q2', isStart: false, isFinal: false, x: 460, y: 220 },
        { id: 'q3', label: 'q3', isStart: false, isFinal: true, x: 630, y: 220 }
      ],
      transitions: [
        { id: 't_010_1', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't_010_2', from: 'q0', to: 'q0', symbol: '1' },
        { id: 't_010_3', from: 'q1', to: 'q1', symbol: '0' },
        { id: 't_010_4', from: 'q1', to: 'q2', symbol: '1' },
        { id: 't_010_5', from: 'q2', to: 'q3', symbol: '0' },
        { id: 't_010_6', from: 'q2', to: 'q0', symbol: '1' },
        { id: 't_010_7', from: 'q3', to: 'q3', symbol: '0' },
        { id: 't_010_8', from: 'q3', to: 'q3', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: '010', expected: true, explanation: 'Exact match' },
      { id: 'c2', input: '1101011', expected: true, explanation: 'Contains 010 inside' },
      { id: 'c3', input: '0110', expected: false, explanation: 'Does not contain 010' },
      { id: 'c4', input: '01', expected: false, explanation: 'Partial prefix' },
      { id: 'c5', input: '000100', expected: true, explanation: 'Embedded 010' }
    ]
  },

  'dfa-even-zeros-even-ones': {
    category: 'classic',
    automaton: {
      id: 'dfa-even-zeros-even-ones',
      title: 'DFA: Even 0s and Even 1s',
      description: 'Accepts strings with an even count of zeros AND an even count of ones. qEE is both initial and accepting.',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'qEE', label: 'q(Even,Even)', isStart: true, isFinal: true, x: 180, y: 160 },
        { id: 'qOE', label: 'q(Odd,Even)', isStart: false, isFinal: false, x: 460, y: 160 },
        { id: 'qEO', label: 'q(Even,Odd)', isStart: false, isFinal: false, x: 180, y: 380 },
        { id: 'qOO', label: 'q(Odd,Odd)', isStart: false, isFinal: false, x: 460, y: 380 }
      ],
      transitions: [
        { id: 't_ee_1', from: 'qEE', to: 'qOE', symbol: '0' },
        { id: 't_ee_2', from: 'qEE', to: 'qEO', symbol: '1' },
        { id: 't_oe_1', from: 'qOE', to: 'qEE', symbol: '0' },
        { id: 't_oe_2', from: 'qOE', to: 'qOO', symbol: '1' },
        { id: 't_eo_1', from: 'qEO', to: 'qOO', symbol: '0' },
        { id: 't_eo_2', from: 'qEO', to: 'qEE', symbol: '1' },
        { id: 't_oo_1', from: 'qOO', to: 'qEO', symbol: '0' },
        { id: 't_oo_2', from: 'qOO', to: 'qOE', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: '', expected: true, explanation: '0 zeros and 0 ones (both even)' },
      { id: 'c2', input: '00', expected: true, explanation: 'Two 0s, zero 1s' },
      { id: 'c3', input: '11', expected: true, explanation: 'Zero 0s, two 1s' },
      { id: 'c4', input: '0101', expected: true, explanation: 'Two 0s, two 1s' },
      { id: 'c5', input: '10', expected: false, explanation: 'Odd 0s and odd 1s' },
      { id: 'c6', input: '000', expected: false, explanation: 'Three 0s (odd)' }
    ]
  },

  'dfa-binary-divisible-by-3': {
    category: 'classic',
    automaton: {
      id: 'dfa-binary-divisible-by-3',
      title: 'DFA: Binary Numbers Divisible by 3',
      description: 'Reads binary numbers MSB-first and accepts iff the decimal value is divisible by 3 (value mod 3 = 0). Initial state q0 is accepting (represents 0).',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'rem 0', isStart: true, isFinal: true, x: 180, y: 220 },
        { id: 'q1', label: 'rem 1', isStart: false, isFinal: false, x: 380, y: 140 },
        { id: 'q2', label: 'rem 2', isStart: false, isFinal: false, x: 380, y: 300 }
      ],
      transitions: [
        { id: 't_mod_1', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't_mod_2', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't_mod_3', from: 'q1', to: 'q2', symbol: '0' },
        { id: 't_mod_4', from: 'q1', to: 'q0', symbol: '1' },
        { id: 't_mod_5', from: 'q2', to: 'q1', symbol: '0' },
        { id: 't_mod_6', from: 'q2', to: 'q2', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: '0', expected: true, explanation: 'Decimal 0 (0 % 3 = 0)' },
      { id: 'c2', input: '11', expected: true, explanation: 'Decimal 3 (3 % 3 = 0)' },
      { id: 'c3', input: '110', expected: true, explanation: 'Decimal 6 (6 % 3 = 0)' },
      { id: 'c4', input: '1001', expected: true, explanation: 'Decimal 9 (9 % 3 = 0)' },
      { id: 'c5', input: '1', expected: false, explanation: 'Decimal 1 (1 % 3 = 1)' },
      { id: 'c6', input: '10', expected: false, explanation: 'Decimal 2 (2 % 3 = 2)' },
      { id: 'c7', input: '101', expected: false, explanation: 'Decimal 5 (5 % 3 = 2)' }
    ]
  },

  // --- NFA / ε-NFA Conversion Presets ---
  'nfa-ends-in-01': {
    category: 'conversion',
    automaton: {
      id: 'nfa-ends-in-01',
      title: 'NFA: Strings ending in "01"',
      description: 'Demonstrates non-deterministic branching on symbol 0 at start state q0. When 0 is read, it both loops in q0 and branches to q1.',
      type: 'NFA',
      alphabet: ['0', '1'],
      states: [
        { id: 'q0', label: 'q0', isStart: true, isFinal: false, x: 180, y: 220 },
        { id: 'q1', label: 'q1', isStart: false, isFinal: false, x: 380, y: 220 },
        { id: 'q2', label: 'q2', isStart: false, isFinal: true, x: 580, y: 220 }
      ],
      transitions: [
        { id: 't_nfa_1', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't_nfa_2', from: 'q0', to: 'q0', symbol: '1' },
        { id: 't_nfa_3', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't_nfa_4', from: 'q1', to: 'q2', symbol: '1' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: '01', expected: true, explanation: 'Exact match ends in 01' },
      { id: 'c2', input: '1001', expected: true, explanation: 'Ends in 01' },
      { id: 'c3', input: '11101', expected: true, explanation: 'Ends in 01' },
      { id: 'c4', input: '0', expected: false, explanation: 'Ends in 0, not 01' },
      { id: 'c5', input: '010', expected: false, explanation: 'Ends in 0' },
      { id: 'c6', input: '11', expected: false, explanation: 'Ends in 11' }
    ]
  },

  'nfa-pattern-abb': {
    category: 'conversion',
    automaton: {
      id: 'nfa-pattern-abb',
      title: 'NFA: Contains Substring "abb"',
      description: 'Accepts all strings over {a, b} containing "abb". State q0 loops on a and b, with a non-deterministic branch on "a" toward q1.',
      type: 'NFA',
      alphabet: ['a', 'b'],
      states: [
        { id: 'q0', label: 'q0', isStart: true, isFinal: false, x: 120, y: 220 },
        { id: 'q1', label: 'q1', isStart: false, isFinal: false, x: 280, y: 220 },
        { id: 'q2', label: 'q2', isStart: false, isFinal: false, x: 440, y: 220 },
        { id: 'q3', label: 'q3', isStart: false, isFinal: true, x: 600, y: 220 }
      ],
      transitions: [
        { id: 't_abb_1', from: 'q0', to: 'q0', symbol: 'a' },
        { id: 't_abb_2', from: 'q0', to: 'q0', symbol: 'b' },
        { id: 't_abb_3', from: 'q0', to: 'q1', symbol: 'a' },
        { id: 't_abb_4', from: 'q1', to: 'q2', symbol: 'b' },
        { id: 't_abb_5', from: 'q2', to: 'q3', symbol: 'b' },
        { id: 't_abb_6', from: 'q3', to: 'q3', symbol: 'a' },
        { id: 't_abb_7', from: 'q3', to: 'q3', symbol: 'b' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: 'abb', expected: true, explanation: 'Exact match' },
      { id: 'c2', input: 'ababbb', expected: true, explanation: 'Contains abb' },
      { id: 'c3', input: 'abab', expected: false, explanation: 'Does not contain abb' },
      { id: 'c4', input: 'baab', expected: false, explanation: 'Only has ab, not abb' }
    ]
  },

  'enfa-a-star-b-star-c-star': {
    category: 'conversion',
    automaton: {
      id: 'enfa-a-star-b-star-c-star',
      title: 'ε-NFA: Language a*b*c*',
      description: 'Recognizes strings composed of zero or more "a"s, followed by zero or more "b"s, followed by zero or more "c"s using epsilon transitions.',
      type: 'ENFA',
      alphabet: ['a', 'b', 'c'],
      states: [
        { id: 'qA', label: 'qA', isStart: true, isFinal: true, x: 160, y: 220 },
        { id: 'qB', label: 'qB', isStart: false, isFinal: true, x: 380, y: 220 },
        { id: 'qC', label: 'qC', isStart: false, isFinal: true, x: 600, y: 220 }
      ],
      transitions: [
        { id: 't_ea_1', from: 'qA', to: 'qA', symbol: 'a' },
        { id: 't_ea_2', from: 'qA', to: 'qB', symbol: EPSILON },
        { id: 't_ea_3', from: 'qB', to: 'qB', symbol: 'b' },
        { id: 't_ea_4', from: 'qB', to: 'qC', symbol: EPSILON },
        { id: 't_ea_5', from: 'qC', to: 'qC', symbol: 'c' }
      ]
    },
    sampleTestCases: [
      { id: 'c1', input: '', expected: true, explanation: 'Empty string is in a*b*c*' },
      { id: 'c2', input: 'a', expected: true, explanation: 'Single a' },
      { id: 'c3', input: 'abc', expected: true, explanation: 'One of each in order' },
      { id: 'c4', input: 'aabbcc', expected: true, explanation: 'In order' },
      { id: 'c5', input: 'ba', expected: false, explanation: 'b cannot precede a' },
      { id: 'c6', input: 'cba', expected: false, explanation: 'Reverse order' }
    ]
  }
};
