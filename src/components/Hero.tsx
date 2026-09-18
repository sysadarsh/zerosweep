'use client';

import React from 'react';
import { Gauge, Zap, DollarSign, CheckCircle2, ShieldAlert } from 'lucide-react';

interface HeroProps {
  activeTab: 'mailbox' | 'lab' | 'race' | 'calibration' | 'calculator';
  onSelectTab: (tab: 'mailbox' | 'lab' | 'race' | 'calibration' | 'calculator') => void;
}

export const Hero: React.FC<HeroProps> = ({ activeTab, onSelectTab }) => {
  return (
    <div className="py-8 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-950 via-zinc-900/30 to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>The System One Architecture Shift</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Why Autoregressive LLMs Fail at Inbox Zero
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Running 10,000 emails through a 70B+ LLM takes hours, burns fortunes on sequential output tokens, and hallucinates schemas. 
            <strong className="text-zinc-200"> TypeSafe Jev</strong> replaces sequential token generation with a parallel probabilistic sampler—delivering typed decisions in <span className="text-emerald-400 font-semibold font-mono">100ms</span> for pennies.
          </p>
        </div>

        {/* 4 Feature Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-8 text-xs font-mono">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center space-x-2.5">
            <Gauge className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-zinc-400 text-[10px]">INFERENCE SPEED</div>
              <div className="text-white font-bold">70ms – 140ms</div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center space-x-2.5">
            <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-zinc-400 text-[10px]">OUTPUT TOKENS</div>
              <div className="text-white font-bold">$0.00 (FREE)</div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center space-x-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-zinc-400 text-[10px]">OUTPUT FORMAT</div>
              <div className="text-white font-bold">0% Parse Errors</div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center space-x-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-zinc-400 text-[10px]">SAFETY GUARD</div>
              <div className="text-white font-bold">Calibrated RLCD</div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onSelectTab('mailbox')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-mono transition-all ${
              activeTab === 'mailbox'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 scale-102'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            ⚡ Autonomous Mailbox (1,000 Scale)
          </button>
          <button
            onClick={() => onSelectTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-mono transition-all ${
              activeTab === 'lab'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 scale-102'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            🧪 1-Email Precision Lab
          </button>
          <button
            onClick={() => onSelectTab('race')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-mono transition-all ${
              activeTab === 'race'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 scale-102'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            🏁 Head-to-Head Race
          </button>
          <button
            onClick={() => onSelectTab('calibration')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-mono transition-all ${
              activeTab === 'calibration'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 scale-102'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            🔬 Epistemic Safety Gate
          </button>
          <button
            onClick={() => onSelectTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-medium font-mono transition-all ${
              activeTab === 'calculator'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 scale-102'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            📊 Enterprise ROI
          </button>
        </div>
      </div>
    </div>
  );
};
