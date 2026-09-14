import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Layers, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useApp, DEMO_STEPS } from '../../context/AppContext';

export const DemoController = () => {
  const { 
    currentDemoStepIndex, 
    currentDemoStep, 
    advanceDemoStep, 
    setDemoStepDirectly 
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-[#0b160e]/95 backdrop-blur-md border-b border-emerald-800/40 shadow-sm px-4 py-2.5 transition-all text-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left: Current Step Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs font-bold text-xs shrink-0">
            {currentDemoStepIndex + 1}/{DEMO_STEPS.length}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-700/40 px-2 py-0.5 rounded">
                {currentDemoStep.badge}
              </span>
              <h4 className="text-sm font-bold text-white">{currentDemoStep.title}</h4>
            </div>
            {isExpanded && (
              <p className="text-xs text-emerald-200/70 mt-0.5 max-w-2xl line-clamp-1 sm:line-clamp-none">
                {currentDemoStep.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Step Stepper & Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          
          {/* Step Bubbles */}
          <div className="hidden xl:flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-emerald-900/50">
            {DEMO_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setDemoStepDirectly(idx)}
                className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all ${
                  idx === currentDemoStepIndex
                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                    : idx < currentDemoStepIndex
                    ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Jump to Step ${idx + 1}: ${step.title}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Previous Button */}
          <button
            onClick={() => setDemoStepDirectly(Math.max(0, currentDemoStepIndex - 1))}
            disabled={currentDemoStepIndex === 0}
            className="p-1.5 rounded-lg border border-emerald-800/40 text-emerald-300 hover:text-white hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Previous Demo Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next / Advance Button */}
          <button
            onClick={advanceDemoStep}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <span>Advance Workflow</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            onClick={() => setDemoStepDirectly(0)}
            className="p-1.5 rounded-lg border border-emerald-800/40 text-emerald-300 hover:text-white hover:bg-emerald-900/30 transition-all"
            title="Restart Simulation at Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
