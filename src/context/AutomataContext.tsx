import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import type {
  Automaton,
  AutomatonType,
  BatchTestItem,
  ConvertedDFA,
  SimulationResult,
  State,
  Transition,
  ValidationSummary
} from '../types/automata';
import { simulateDFA } from '../simulation/dfa';
import { simulateNFA } from '../simulation/nfa';
import { validateAutomaton, validateInputString } from '../simulation/validation';
import { PRESET_AUTOMATA } from '../simulation/presets';
import { runBatchTests, generateSystematicStrings } from '../simulation/batchRunner';

interface AutomataContextType {
  automaton: Automaton;
  setAutomaton: React.Dispatch<React.SetStateAction<Automaton>>;
  validation: ValidationSummary;
  inputString: string;
  setInputString: (val: string) => void;
  inputStringValidation: { isValid: boolean; invalidSymbols: string[] };
  
  // Simulation
  simulationResult: SimulationResult | null;
  activeStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number; // in milliseconds per step
  setPlaybackSpeed: (speed: number) => void;
  
  // Simulation actions
  runSimulation: (customInput?: string) => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStep: (index: number) => void;
  togglePlay: () => void;
  resetSimulation: () => void;
  
  // Editor actions
  addState: (label?: string, x?: number, y?: number) => string;
  updateState: (id: string, updates: Partial<State>) => void;
  deleteState: (id: string) => void;
  toggleStartState: (id: string) => void;
  toggleFinalState: (id: string) => void;
  addTransition: (from: string, to: string, symbol: string) => void;
  updateTransition: (id: string, updates: Partial<Transition>) => void;
  deleteTransition: (id: string) => void;
  setAlphabet: (symbols: string[]) => void;
  setAutomatonType: (type: AutomatonType) => void;
  loadPreset: (key: string) => void;
  clearCanvas: () => void;
  loadConvertedDfa: (converted: ConvertedDFA) => void;
  
  // Batch testing
  batchTests: BatchTestItem[];
  setBatchTests: React.Dispatch<React.SetStateAction<BatchTestItem[]>>;
  runBatch: () => void;
  generateBatch: () => void;
  
  // Selection
  selectedElement: { type: 'state' | 'transition'; id: string } | null;
  setSelectedElement: (el: { type: 'state' | 'transition'; id: string } | null) => void;

  // Naming Style
  stateNamingStyle: 'alphabetical' | 'numeric';
  setStateNamingStyle: (style: 'alphabetical' | 'numeric') => void;
}

const AutomataContext = createContext<AutomataContextType | null>(null);

const STORAGE_KEY = 'automata_studio_current_v1';

export const AutomataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial automaton from preset or localStorage
  const [automaton, setAutomaton] = useState<Automaton>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.states && parsed.transitions && parsed.alphabet) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return PRESET_AUTOMATA['dfa-ends-in-1'].automaton;
  });

  const [inputString, setInputString] = useState<string>('1011');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(800); // 800ms default
  const [selectedElement, setSelectedElement] = useState<{ type: 'state' | 'transition'; id: string } | null>(null);
  const [stateNamingStyle, setStateNamingStyle] = useState<'alphabetical' | 'numeric'>('alphabetical');
  
  const [batchTests, setBatchTests] = useState<BatchTestItem[]>(
    () => PRESET_AUTOMATA['dfa-ends-in-1'].sampleTestCases
  );

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(automaton));
    } catch {
      // ignore
    }
  }, [automaton]);

  // Real-time Validation
  const validation = useMemo(() => validateAutomaton(automaton), [automaton]);
  const inputStringValidation = useMemo(
    () => validateInputString(inputString, automaton.alphabet),
    [inputString, automaton.alphabet]
  );

  // Simulation runner function
  const runSimulation = useCallback((customInput?: string) => {
    const stringToTest = customInput !== undefined ? customInput : inputString;
    let result: SimulationResult;

    if (automaton.type === 'DFA') {
      result = simulateDFA(automaton, stringToTest);
    } else {
      result = simulateNFA(automaton, stringToTest);
    }

    setSimulationResult(result);
    setActiveStepIndex(0);
    setIsPlaying(false);

    // If step 0 ends and is already accepted (e.g. empty string)
    if (result.steps.length === 1 && result.accepted) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    }
  }, [automaton, inputString]);

  // Trigger initial simulation whenever automaton or input string changes
  useEffect(() => {
    runSimulation(inputString);
  }, [automaton, inputString, runSimulation]);

  // Step forward
  const stepForward = useCallback(() => {
    if (!simulationResult) return;
    setActiveStepIndex(prev => {
      const nextIndex = Math.min(prev + 1, simulationResult.steps.length - 1);
      if (nextIndex === simulationResult.steps.length - 1 && simulationResult.accepted && prev !== nextIndex) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
      }
      return nextIndex;
    });
  }, [simulationResult]);

  // Step backward
  const stepBackward = useCallback(() => {
    setActiveStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  // Jump to specific step
  const jumpToStep = useCallback((index: number) => {
    if (!simulationResult) return;
    const clamped = Math.max(0, Math.min(index, simulationResult.steps.length - 1));
    setActiveStepIndex(clamped);
    if (clamped === simulationResult.steps.length - 1 && simulationResult.accepted) {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
    }
  }, [simulationResult]);

  // Reset simulation to step 0
  const resetSimulation = useCallback(() => {
    setIsPlaying(false);
    setActiveStepIndex(0);
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev && simulationResult && activeStepIndex >= simulationResult.steps.length - 1) {
        setActiveStepIndex(0);
      }
      return !prev;
    });
  }, [simulationResult, activeStepIndex]);

  // Animation interval timer
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setActiveStepIndex(prev => {
          if (!simulationResult) return 0;
          if (prev >= simulationResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          if (next === simulationResult.steps.length - 1 && simulationResult.accepted) {
            confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
          }
          return next;
        });
      }, playbackSpeed);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, simulationResult]);

  // Editor Actions
  const addState = useCallback((label?: string, x?: number, y?: number): string => {
    let defaultLabel = '';
    if (stateNamingStyle === 'alphabetical') {
      const alphabetLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      let letterIndex = 0;
      while (automaton.states.some(s => s.label === alphabetLetters[letterIndex] || s.id === alphabetLetters[letterIndex])) {
        letterIndex++;
        if (letterIndex >= alphabetLetters.length) break;
      }
      defaultLabel = letterIndex < alphabetLetters.length ? alphabetLetters[letterIndex] : `S${automaton.states.length}`;
    } else {
      let nextNum = 0;
      while (automaton.states.some(s => s.label === `q${nextNum}`)) {
        nextNum++;
      }
      defaultLabel = `q${nextNum}`;
    }

    const newId = `state_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLabel = label || defaultLabel;
    const isFirstState = automaton.states.length === 0;
    const currentCount = automaton.states.length;

    const newState: State = {
      id: newId,
      label: newLabel,
      isStart: isFirstState,
      isFinal: false,
      x: x !== undefined ? x : 150 + (currentCount % 5) * 140,
      y: y !== undefined ? y : 150 + Math.floor(currentCount / 5) * 120
    };

    setAutomaton(prev => ({
      ...prev,
      states: [...prev.states, newState]
    }));

    setSelectedElement({ type: 'state', id: newId });
    return newId;
  }, [automaton.states, stateNamingStyle]);

  const updateState = useCallback((id: string, updates: Partial<State>) => {
    setAutomaton(prev => ({
      ...prev,
      states: prev.states.map(s => (s.id === id ? { ...s, ...updates } : s))
    }));
  }, []);

  const deleteState = useCallback((id: string) => {
    setAutomaton(prev => ({
      ...prev,
      states: prev.states.filter(s => s.id !== id),
      transitions: prev.transitions.filter(t => t.from !== id && t.to !== id)
    }));
    setSelectedElement(null);
  }, []);

  const toggleStartState = useCallback((id: string) => {
    setAutomaton(prev => ({
      ...prev,
      states: prev.states.map(s => ({
        ...s,
        isStart: s.id === id ? !s.isStart : false // only 1 start state
      }))
    }));
  }, []);

  const toggleFinalState = useCallback((id: string) => {
    setAutomaton(prev => ({
      ...prev,
      states: prev.states.map(s => (s.id === id ? { ...s, isFinal: !s.isFinal } : s))
    }));
  }, []);

  const addTransition = useCallback((from: string, to: string, symbol: string) => {
    const trimmedSymbol = symbol.trim();
    if (!trimmedSymbol) return;

    // Check if this exact transition already exists
    setAutomaton(prev => {
      const exists = prev.transitions.some(
        t => t.from === from && t.to === to && t.symbol === trimmedSymbol
      );
      if (exists) return prev;

      const newTransition: Transition = {
        id: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        from,
        to,
        symbol: trimmedSymbol
      };

      return {
        ...prev,
        transitions: [...prev.transitions, newTransition]
      };
    });
  }, []);

  const updateTransition = useCallback((id: string, updates: Partial<Transition>) => {
    setAutomaton(prev => ({
      ...prev,
      transitions: prev.transitions.map(t => (t.id === id ? { ...t, ...updates } : t))
    }));
  }, []);

  const deleteTransition = useCallback((id: string) => {
    setAutomaton(prev => ({
      ...prev,
      transitions: prev.transitions.filter(t => t.id !== id)
    }));
    setSelectedElement(null);
  }, []);

  const setAlphabet = useCallback((symbols: string[]) => {
    const uniqueSymbols = Array.from(new Set(symbols.map(s => s.trim()).filter(Boolean)));
    setAutomaton(prev => ({
      ...prev,
      alphabet: uniqueSymbols
    }));
  }, []);

  const setAutomatonType = useCallback((type: AutomatonType) => {
    setAutomaton(prev => ({
      ...prev,
      type
    }));
  }, []);

  const loadPreset = useCallback((key: string) => {
    const preset = PRESET_AUTOMATA[key];
    if (preset) {
      setAutomaton({ ...preset.automaton });
      setBatchTests([...preset.sampleTestCases]);
      if (preset.sampleTestCases.length > 0) {
        setInputString(preset.sampleTestCases[0].input);
      }
      setSelectedElement(null);
      resetSimulation();
    }
  }, [resetSimulation]);

  const clearCanvas = useCallback(() => {
    setAutomaton({
      id: `custom_${Date.now()}`,
      title: 'Custom Automaton',
      description: 'Newly created canvas',
      type: 'DFA',
      alphabet: ['0', '1'],
      states: [],
      transitions: []
    });
    setSimulationResult(null);
    setSelectedElement(null);
  }, []);

  const loadConvertedDfa = useCallback((converted: ConvertedDFA) => {
    setAutomaton(converted.automaton);
    setSelectedElement(null);
    resetSimulation();
  }, [resetSimulation]);

  const runBatch = useCallback(() => {
    setBatchTests(prev => runBatchTests(automaton, prev));
  }, [automaton]);

  const generateBatch = useCallback(() => {
    const generatedStrings = generateSystematicStrings(automaton.alphabet, 3);
    const newItems: BatchTestItem[] = generatedStrings.map((str, idx) => ({
      id: `gen_${idx}_${str}`,
      input: str,
      explanation: str === '' ? 'Empty string ε' : `Length ${str.length}`
    }));
    const evaluated = runBatchTests(automaton, newItems);
    setBatchTests(evaluated);
  }, [automaton]);

  return (
    <AutomataContext.Provider
      value={{
        automaton,
        setAutomaton,
        validation,
        inputString,
        setInputString,
        inputStringValidation,
        simulationResult,
        activeStepIndex,
        isPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        runSimulation,
        stepForward,
        stepBackward,
        jumpToStep,
        togglePlay,
        resetSimulation,
        addState,
        updateState,
        deleteState,
        toggleStartState,
        toggleFinalState,
        addTransition,
        updateTransition,
        deleteTransition,
        setAlphabet,
        setAutomatonType,
        loadPreset,
        clearCanvas,
        loadConvertedDfa,
        batchTests,
        setBatchTests,
        runBatch,
        generateBatch,
        selectedElement,
        setSelectedElement,
        stateNamingStyle,
        setStateNamingStyle
      }}
    >
      {children}
    </AutomataContext.Provider>
  );
};

export const useAutomata = (): AutomataContextType => {
  const context = useContext(AutomataContext);
  if (!context) {
    throw new Error('useAutomata must be used within an AutomataProvider');
  }
  return context;
};
