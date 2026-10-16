export type AutomatonType = 'DFA' | 'NFA' | 'ENFA';

export const EPSILON = 'ε';
export const EPSILON_ALIASES = ['ε', 'λ', 'e', 'E', 'eps', 'epsilon'];

export interface State {
  id: string;
  label: string;
  isStart: boolean;
  isFinal: boolean;
  x: number;
  y: number;
}

export interface Transition {
  id: string;
  from: string; // state id
  to: string;   // state id
  symbol: string; // character or EPSILON
}

export interface Automaton {
  id: string;
  title: string;
  description: string;
  type: AutomatonType;
  alphabet: string[];
  states: State[];
  transitions: Transition[];
}

export interface SimulationStep {
  stepIndex: number;
  symbolRead: string | null; // null for step 0
  activeStates: string[]; // State IDs
  activeTransitions: string[]; // Transition IDs followed in this step
  remainingInput: string;
  consumedInput: string;
  explanation: string;
  isEpsilonStep?: boolean;
}

export interface SimulationResult {
  accepted: boolean;
  steps: SimulationStep[];
  finalActiveStates: string[];
  message: string;
  inputString: string;
}

export interface ValidationError {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  stateId?: string;
  transitionId?: string;
}

export interface ValidationSummary {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface BatchTestItem {
  id: string;
  input: string;
  expected?: boolean;
  actual?: boolean;
  passed?: boolean;
  explanation?: string;
}

export interface SubsetConstructionStep {
  subsetName: string; // e.g. "q0,q1" or "{q0, q1}"
  stateSet: string[]; // ['q0', 'q1']
  transitions: Record<string, string[]>; // symbol -> stateSet
  isStart: boolean;
  isFinal: boolean;
}

export interface ConvertedDFA {
  automaton: Automaton;
  steps: SubsetConstructionStep[];
  mapping: Record<string, string>; // subsetKey -> new state id
}
