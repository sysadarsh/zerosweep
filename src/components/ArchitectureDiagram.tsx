'use client';

import React from 'react';
import { ArrowDown, Cpu } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Cpu className="h-5 w-5 text-emerald-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Under the Hood: Computational Mechanics (O(1) vs O(N))
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Jev (System One) */}
        <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400">JEV (SYSTEM ONE)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Single Parallel Pass
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-zinc-300">
            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <span>Input State (Subject + Body)</span>
              <span className="text-zinc-500">~300 tokens</span>
            </div>
            <div className="flex justify-center text-emerald-400">
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </div>
            <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              <div className="font-bold">Parallel RLCD Evaluator</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Computes all question logits simultaneously in 1 forward pass
              </div>
            </div>
            <div className="flex justify-center text-emerald-400">
              <ArrowDown className="h-4 w-4" />
            </div>
            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
              <div className="font-bold text-white">Typed Probabilities & Confidences</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                Latency: 70ms – 200ms • Zero Output Tokens • No Parse Errors
              </div>
            </div>
          </div>
        </div>

        {/* Right: Traditional LLM (System Two) */}
        <div className="bg-zinc-950 border border-purple-500/30 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-400">FRONTIER LLM (SYSTEM TWO)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Autoregressive Loop
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-zinc-300">
            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <span>System Prompt + State + Schema</span>
              <span className="text-zinc-500">~900 tokens</span>
            </div>
            <div className="flex justify-center text-purple-400">
              <ArrowDown className="h-4 w-4" />
            </div>
            <div className="p-2.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300">
              <div className="font-bold">Token-by-Token Decoding (O(N) forward passes)</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Generates {`"{"`} then {`"category"`} then {`":"`} then {`"refund"`}...
              </div>
            </div>
            <div className="flex justify-center text-purple-400">
              <ArrowDown className="h-4 w-4" />
            </div>
            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
              <div className="font-bold text-white">JSON String Output</div>
              <div className="text-[10px] text-rose-400 mt-0.5">
                Latency: 2,500ms – 30,000ms • Expensive Output Tokens • Schema Drift Risk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
