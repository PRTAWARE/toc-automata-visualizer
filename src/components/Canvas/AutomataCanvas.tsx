import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  Panel,
  BackgroundVariant,
  MarkerType
} from '@xyflow/react';
import type { Connection, Node, Edge, NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, ArrowRightLeft, Sparkles, Trash2, HelpCircle } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import { AddTransitionModal } from './AddTransitionModal';

const nodeTypes = {
  stateNode: StateNode
};

const edgeTypes = {
  transitionEdge: TransitionEdge
};

const FlowContent: React.FC = () => {
  const {
    automaton,
    updateState,
    addState,
    clearCanvas,
    activeStepIndex,
    simulationResult,
    setSelectedElement
  } = useAutomata();

  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{ from?: string; to?: string }>({});
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Trigger fitView whenever automaton ID (e.g. minimization, conversion, preset load) changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 50);
    return () => clearTimeout(timer);
  }, [automaton.id, fitView]);

  // Determine which states and transitions are active in the current step
  const currentStep = simulationResult?.steps[activeStepIndex];
  const activeStateIds = useMemo(() => currentStep?.activeStates || [], [currentStep]);
  const activeTransitionIds = useMemo(() => currentStep?.activeTransitions || [], [currentStep]);

  // Convert automaton states to React Flow nodes
  const nodes: Node[] = useMemo(() => {
    return automaton.states.map(s => ({
      id: s.id,
      type: 'stateNode',
      position: { x: s.x, y: s.y },
      data: {
        id: s.id,
        label: s.label,
        isStart: s.isStart,
        isFinal: s.isFinal,
        isActive: activeStateIds.includes(s.id)
      }
    }));
  }, [automaton.states, activeStateIds]);

  // Convert automaton transitions to React Flow edges with grouping & curve offsets
  const edges: Edge[] = useMemo(() => {
    const pairMap = new Map<string, Array<{ id: string; symbol: string }>>();

    // Group transitions by ordered pair `${from}->${to}`
    automaton.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, []);
      }
      pairMap.get(key)!.push({ id: t.id, symbol: t.symbol });
    });

    const resultEdges: Edge[] = [];

    pairMap.forEach((transList, key) => {
      const [from, to] = key.split('->');
      const isSelfLoop = from === to;
      const reverseKey = `${to}->${from}`;
      const isBidirectional = !isSelfLoop && pairMap.has(reverseKey);

      // Check if any transition in this edge is currently active
      const isActive = transList.some(t => activeTransitionIds.includes(t.id));

      const edgeId = `edge_${from}_${to}`;

      resultEdges.push({
        id: edgeId,
        source: from,
        target: to,
        type: 'transitionEdge',
        data: {
          transitions: transList,
          isActive,
          isSelfLoop,
          isBidirectional,
          curvatureOffset: 36
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isActive ? '#22d3ee' : '#64748b'
        }
      });
    });

    return resultEdges;
  }, [automaton.transitions, activeTransitionIds]);

  // Handle node position changes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach(change => {
        if (change.type === 'position' && change.position && change.id) {
          updateState(change.id, {
            x: Math.round(change.position.x),
            y: Math.round(change.position.y)
          });
        }
      });
    },
    [updateState]
  );

  // Handle connecting two nodes via dragging handles
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      setPendingConnection({
        from: connection.source,
        to: connection.target
      });
      setIsTransitionModalOpen(true);
    }
  }, []);

  // Handle double clicking empty canvas to create state
  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const x = event.clientX - bounds.left - 32;
        const y = event.clientY - bounds.top - 32;
        addState(undefined, Math.max(50, x), Math.max(50, y));
      }
    },
    [addState]
  );

  // Auto layout states in a neat circle or row
  const handleAutoLayout = useCallback(() => {
    const total = automaton.states.length;
    if (total === 0) return;

    if (total <= 4) {
      // Horizontal linear layout
      automaton.states.forEach((s, idx) => {
        updateState(s.id, {
          x: 140 + idx * 180,
          y: 220
        });
      });
    } else {
      // Circular layout
      const radius = Math.max(160, total * 38);
      const centerX = 360;
      const centerY = 280;

      automaton.states.forEach((s, idx) => {
        const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
        const x = Math.round(centerX + radius * Math.cos(angle));
        const y = Math.round(centerY + radius * Math.sin(angle));
        updateState(s.id, { x, y });
      });
    }
    setTimeout(() => fitView({ padding: 0.25, duration: 300 }), 50);
  }, [automaton.states, updateState, fitView]);

  return (
    <div
      ref={reactFlowWrapper}
      className="relative w-full h-full min-h-[460px] bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner"
      onDoubleClick={onDoubleClick}
      onClick={() => setSelectedElement(null)}
    >
      <ReactFlow
        key={automaton.id}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        connectionLineStyle={{ stroke: '#22d3ee', strokeWidth: 3, strokeDasharray: '6,6' }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#334155"
          className="opacity-50"
        />

        <Controls
          className="!bg-slate-900 !border-slate-800 !shadow-xl !rounded-xl !overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 hover:[&>button]:!bg-slate-800"
        />

        {/* Floating Quick Action Toolbar */}
        <Panel position="top-right" className="m-3 flex items-center gap-2">
          <button
            onClick={() => addState()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add State
          </button>

          <button
            onClick={() => {
              setPendingConnection({});
              setIsTransitionModalOpen(true);
            }}
            disabled={automaton.states.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            Add Transition
          </button>

          <button
            onClick={handleAutoLayout}
            title="Auto-arrange nodes"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={clearCanvas}
            title="Clear all states & transitions"
            className="p-2 bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 rounded-xl border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Panel>

        {/* Tip Badge at Bottom Left */}
        <Panel position="bottom-left" className="m-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl text-[11px] text-slate-400 select-none shadow-lg">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Double-click canvas to add state • Drag handle to connect</span>
          </div>
        </Panel>
      </ReactFlow>

      {/* Add Transition Modal */}
      <AddTransitionModal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        defaultFrom={pendingConnection.from}
        defaultTo={pendingConnection.to}
      />
    </div>
  );
};

export const AutomataCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
};
