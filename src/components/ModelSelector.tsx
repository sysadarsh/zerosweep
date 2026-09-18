'use client';

import React from 'react';
import { JEV_MODELS } from '@/data/models';
import { Cpu, Zap, ChevronDown } from 'lucide-react';

interface ModelSelectorProps {
  selectedJevModel: string;
  onSelectJevModel: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedJevModel,
  onSelectJevModel,
  disabled = false,
}) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Left: Jev Model Selector */}
      <div className="flex-1 flex items-center space-x-3 bg-zinc-950/80 border border-emerald-500/30 p-2.5 rounded-lg">
        <div className="h-8 w-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Zap className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center space-x-1.5">
            <span>System One Model</span>
            <span className="text-zinc-500 font-normal">($0.042/MTok • Free Outputs)</span>
          </div>
          <div className="relative mt-0.5">
            <select
              value={selectedJevModel}
              onChange={(e) => onSelectJevModel(e.target.value)}
              disabled={disabled}
              className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-6 appearance-none font-mono"
            >
              {JEV_MODELS.map((model) => (
                <option key={model.id} value={model.id} className="bg-zinc-900 text-white">
                  {model.name} — ~{model.typicalLatencyMs}ms (RLCD Calibrated)
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-zinc-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* VS Badge */}
      <div className="self-center text-xs font-mono font-bold text-zinc-500 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800">
        VS
      </div>

      {/* Right: LLM Benchmark Model (DeepSeek V4 Flash Only) */}
      <div className="flex-1 flex items-center space-x-3 bg-zinc-950/80 border border-purple-500/30 p-2.5 rounded-lg">
        <div className="h-8 w-8 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <Cpu className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono text-purple-400 uppercase font-bold flex items-center space-x-1.5">
            <span>Comparative LLM (Baseline)</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded text-[9px]">
              FREE TIER
            </span>
          </div>
          <div className="text-sm font-semibold text-white font-mono mt-0.5 truncate">
            DeepSeek V4 Flash <span className="text-zinc-500 text-xs font-normal">• ~2,400ms (Autoregressive)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
