import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';

export interface TransitionEdgeData {
  transitions: Array<{ id: string; symbol: string }>;
  isActive: boolean;
  isSelfLoop: boolean;
  isBidirectional: boolean;
  curvatureOffset?: number;
}

export const TransitionEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    markerEnd
  } = props;

  const { deleteTransition, setSelectedElement, selectedElement } = useAutomata();
  const edgeData = data as unknown as TransitionEdgeData | undefined;

  const isActive = !!edgeData?.isActive;
  const isSelfLoop = !!edgeData?.isSelfLoop;
  const isBidirectional = !!edgeData?.isBidirectional;
  const transitions = edgeData?.transitions || [];

  const isSelected = selectedElement?.type === 'transition' &&
    transitions.some(t => t.id === selectedElement.id);

  let edgePath = '';
  let labelX = (sourceX + targetX) / 2;
  let labelY = (sourceY + targetY) / 2;

  if (isSelfLoop) {
    // Loop over the top of the node
    const radiusX = 28;
    const loopHeight = 55;
    
    // Draw SVG loop path starting top-left and ending top-right
    const startX = sourceX - 12;
    const startY = sourceY - 26;
    const endX = sourceX + 12;
    const endY = sourceY - 26;
    
    edgePath = `M ${startX} ${startY} C ${startX - radiusX} ${startY - loopHeight}, ${endX + radiusX} ${endY - loopHeight}, ${endX} ${endY}`;
    labelX = sourceX;
    labelY = sourceY - loopHeight - 10;
  } else if (isBidirectional) {
    // Curve away from the centerline so opposite edge doesn't overlap
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const normX = -dy / len;
    const normY = dx / len;
    const curveAmount = edgeData?.curvatureOffset ?? 35;

    const midX = (sourceX + targetX) / 2 + normX * curveAmount;
    const midY = (sourceY + targetY) / 2 + normY * curveAmount;

    edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
    labelX = midX;
    labelY = midY;
  } else {
    // Slight curve or straight line
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const normX = -dy / len;
    const normY = dx / len;
    const curveAmount = 14;

    const midX = (sourceX + targetX) / 2 + normX * curveAmount;
    const midY = (sourceY + targetY) / 2 + normY * curveAmount;

    edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
    labelX = midX;
    labelY = midY;
  }

  const combinedSymbols = transitions.map(t => t.symbol).join(', ');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isActive ? '#22d3ee' : isSelected ? '#818cf8' : '#64748b',
          strokeWidth: isActive ? 3.5 : isSelected ? 2.5 : 2,
          filter: isActive ? 'drop-shadow(0 0 6px rgba(34,211,238,0.9))' : undefined,
          strokeDasharray: isActive ? '6 4' : undefined,
          animation: isActive ? 'dashflow 0.5s linear infinite' : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s'
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="group"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (transitions.length > 0) {
                setSelectedElement({ type: 'transition', id: transitions[0].id });
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider cursor-pointer border shadow-md transition-all select-none ${
              isActive
                ? 'bg-cyan-950 text-cyan-300 border-cyan-400 ring-2 ring-cyan-400/50 scale-110 shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                : isSelected
                ? 'bg-indigo-950 text-indigo-300 border-indigo-400 ring-2 ring-indigo-400/50 scale-105'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}
          >
            <span>{combinedSymbols || '—'}</span>

            {/* Quick delete on hover */}
            <div className="hidden group-hover:flex items-center gap-1 pl-1 border-l border-slate-700">
              {transitions.map(t => (
                <button
                  key={t.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTransition(t.id);
                  }}
                  title={`Delete transition '${t.symbol}'`}
                  className="p-0.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

TransitionEdge.displayName = 'TransitionEdge';
