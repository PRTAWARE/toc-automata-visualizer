import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { useAutomata } from '../../context/AutomataContext';

export interface StateNodeData {
  id: string;
  label: string;
  isStart: boolean;
  isFinal: boolean;
  isActive: boolean;
  activeCount?: number;
}

export const StateNode = memo(({ data }: { data: StateNodeData }) => {
  const {
    toggleStartState,
    toggleFinalState,
    deleteState,
    setSelectedElement,
    selectedElement
  } = useAutomata();

  const isSelected = selectedElement?.type === 'state' && selectedElement.id === data.id;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElement({ type: 'state', id: data.id });
      }}
      className={`relative group cursor-pointer transition-all duration-200 select-none ${
        data.isActive ? 'scale-110 z-20' : 'hover:scale-105 z-10'
      }`}
    >
      {/* Start State Indicator Arrow */}
      {data.isStart && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
          <div className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold mr-1 shadow-sm border border-indigo-500/30">
            START
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-400 animate-pulse drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
        </div>
      )}

      {/* Active Pulse Wave (during simulation) */}
      {data.isActive && (
        <span className="absolute -inset-2 rounded-full bg-cyan-500/25 animate-ping pointer-events-none" />
      )}

      {/* Main Node Circle */}
      <div
        className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all shadow-lg ${
          data.isActive
            ? 'bg-slate-900 border-2 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.7)] ring-4 ring-cyan-500/30'
            : isSelected
            ? 'bg-slate-900 border-2 border-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.5)] ring-2 ring-indigo-500/20'
            : 'bg-slate-800/90 border-2 border-slate-600 hover:border-slate-400 hover:shadow-slate-700/50'
        }`}
      >
        {/* Inner concentric ring for Accepting / Final States */}
        {data.isFinal && (
          <div
            className={`absolute inset-1 rounded-full border-2 pointer-events-none transition-colors ${
              data.isActive
                ? 'border-cyan-400/80 shadow-[inset_0_0_8px_rgba(34,211,238,0.4)]'
                : 'border-emerald-400/80'
            }`}
          />
        )}

        {/* State Label */}
        <span
          className={`font-mono font-bold tracking-tight px-1 text-center truncate max-w-[56px] ${
            data.label.length > 6
              ? 'text-[10px]'
              : data.label.length > 3
              ? 'text-xs'
              : 'text-sm'
          } ${
            data.isActive
              ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]'
              : data.isFinal
              ? 'text-emerald-300'
              : 'text-slate-100'
          }`}
          title={data.label}
        >
          {data.label}
        </span>

        {/* Sub-label indicators */}
        <div className="flex items-center gap-1 mt-0.5">
          {data.isFinal && (
            <span className="text-[9px] font-semibold text-emerald-400 tracking-wider">
              FINAL
            </span>
          )}
        </div>
      </div>

      {/* Active State Badge on simulation */}
      {data.isActive && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-cyan-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">
          ACTIVE
        </div>
      )}

      {/* Floating Quick Action Toolbar on hover/select */}
      <div
        className={`absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 border border-slate-700 rounded-lg p-1 shadow-xl backdrop-blur-md transition-opacity duration-200 z-30 ${
          isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStartState(data.id);
          }}
          title={data.isStart ? 'Remove Start State' : 'Set as Start State'}
          className={`p-1 rounded text-xs transition-colors ${
            data.isStart ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFinalState(data.id);
          }}
          title={data.isFinal ? 'Remove Accepting State' : 'Set as Accepting State'}
          className={`p-1 rounded text-xs transition-colors ${
            data.isFinal ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteState(data.id);
          }}
          title="Delete State"
          className="p-1 rounded text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Connection Handles (all 4 cardinal points) */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-3.5 !h-3.5 !bg-cyan-500 hover:!bg-cyan-300 !border-2 !border-slate-900 shadow-md shadow-cyan-500/50 transition-all cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3.5 !h-3.5 !bg-cyan-500 hover:!bg-cyan-300 !border-2 !border-slate-900 shadow-md shadow-cyan-500/50 transition-all cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3.5 !h-3.5 !bg-cyan-500 hover:!bg-cyan-300 !border-2 !border-slate-900 shadow-md shadow-cyan-500/50 transition-all cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-3.5 !h-3.5 !bg-cyan-500 hover:!bg-cyan-300 !border-2 !border-slate-900 shadow-md shadow-cyan-500/50 transition-all cursor-crosshair"
      />

      {/* Target Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-2.5 !h-2.5 !bg-transparent !border-0 pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!w-2.5 !h-2.5 !bg-transparent !border-0 pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="!w-2.5 !h-2.5 !bg-transparent !border-0 pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2.5 !h-2.5 !bg-transparent !border-0 pointer-events-none"
      />
    </div>
  );
});

StateNode.displayName = 'StateNode';
