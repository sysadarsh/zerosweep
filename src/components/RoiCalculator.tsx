'use client';

import React, { useState } from 'react';
import { Clock, TrendingUp, Sparkles, ShieldCheck, DollarSign } from 'lucide-react';
import { JEV_INPUT_PRICE_PER_MTOK } from '@/lib/typesafe';

interface BenchmarkTier {
  id: string;
  name: string;
  providerBadge: string;
  modelReference: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  avgLatencySeconds: number;
  description: string;
}

const COMPARISON_TIERS: BenchmarkTier[] = [
  {
    id: 'frontier_astra',
    name: 'Frontier Flagship (OpenAI GPT-6 Astra / Claude Fable 5.1)',
    providerBadge: 'OpenRouter Verified: $10 / $50',
    modelReference: 'openai/gpt-6-astra · anthropic/claude-fable-5.1',
    inputPricePerMTok: 10.00,
    outputPricePerMTok: 50.00,
    avgLatencySeconds: 3.2,
    description: 'Current top frontier reasoning models. Massive 5x output token penalty ($50/MTok) for sequential JSON generation.',
  },
  {
    id: 'workhorse_pro',
    name: 'Workhorse Pro (Claude Opus 5 / GPT-5.6 Sol Pro)',
    providerBadge: 'OpenRouter Verified: $3.50 / $17.50',
    modelReference: 'anthropic/claude-opus-5 · openai/gpt-5.6-sol-pro',
    inputPricePerMTok: 3.50,
    outputPricePerMTok: 17.50,
    avgLatencySeconds: 2.4,
    description: 'Mid-frontier models. Output tokens remain priced at a steep 5x multiple over prompt tokens.',
  },
  {
    id: 'gemini_flash',
    name: 'High-Speed Flash (Google Gemini 3.8 Flash)',
    providerBadge: 'OpenRouter Verified: $0.75 / $3.75',
    modelReference: 'google/gemini-3.8-flash · gemini-3.7-flash',
    inputPricePerMTok: 0.75,
    outputPricePerMTok: 3.75,
    avgLatencySeconds: 1.8,
    description: 'Google’s primary commercial flash engine. Even at $0.75/MTok input, output formatting costs $3.75/MTok.',
  },
  {
    id: 'budget_flash',
    name: 'Budget Open-Weights (DeepSeek V4.1 Flash / Luna Pro)',
    providerBadge: 'OpenRouter Verified: $0.15 / $0.60',
    modelReference: 'deepseek/deepseek-v4.1-flash · openai/gpt-5.6-luna-pro',
    inputPricePerMTok: 0.15,
    outputPricePerMTok: 0.60,
    avgLatencySeconds: 1.4,
    description: 'Cheapest commercial autoregressive models. Still 3.5x more expensive on input and infinite on output vs Jev.',
  },
];

export const RoiCalculator: React.FC = () => {
  const [dailyEmails, setDailyEmails] = useState<number>(50000);
  const [selectedTierId, setSelectedTierId] = useState<string>('frontier_astra');

  const selectedTier = COMPARISON_TIERS.find((t) => t.id === selectedTierId) || COMPARISON_TIERS[0];

  // Assumptions per email:
  // Average input tokens: 500 (Headers + Body snippet)
  // Average output tokens (LLM JSON string): 120
  // Average output tokens (Jev): Evaluated at logit layer -> 0 billable output tokens ($0.00)
  const avgInputTokens = 500;
  const avgOutputTokens = 120;

  const monthlyEmails = dailyEmails * 30;

  // Monthly Tokens (in Millions)
  const monthlyInputTokensM = (monthlyEmails * avgInputTokens) / 1_000_000;
  const monthlyOutputTokensM = (monthlyEmails * avgOutputTokens) / 1_000_000;

  // Monthly Costs
  const monthlyJevCost = monthlyInputTokensM * JEV_INPUT_PRICE_PER_MTOK; // Output tokens are $0.00
  const monthlyLlmInputCost = monthlyInputTokensM * selectedTier.inputPricePerMTok;
  const monthlyLlmOutputCost = monthlyOutputTokensM * selectedTier.outputPricePerMTok;
  const monthlyLlmCost = monthlyLlmInputCost + monthlyLlmOutputCost;

  const annualSavings = Math.max(monthlyLlmCost - monthlyJevCost, 0) * 12;
  const costRatio = Math.round(monthlyLlmCost / Math.max(monthlyJevCost, 0.01));

  // Latency hours per month
  const llmHoursPerMonth = Math.round((monthlyEmails * selectedTier.avgLatencySeconds) / 3600);
  const jevHoursPerMonth = Math.round((monthlyEmails * 0.11) / 3600);
  const hoursSavedPerMonth = Math.max(llmHoursPerMonth - jevHoursPerMonth, 0);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white font-mono">Enterprise Unit Economics Calculator</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Calculate the exact cost delta between <strong>TypeSafe Jev System One</strong> and commercial autoregressive LLM tiers at enterprise workload scale.
          </p>
        </div>

        <div className="bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300">
          Workload Volume:{' '}
          <strong className="text-emerald-400 font-bold text-sm">
            {dailyEmails.toLocaleString()}
          </strong>{' '}
          emails/day
        </div>
      </div>

      {/* Context Banner: Free Playground vs Commercial Scale Reality */}
      <div className="bg-zinc-950 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3 text-xs font-mono">
        <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-zinc-200 font-bold">
            Why compare against commercial LLM pricing?
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            In our live playground above, we route to OpenRouter’s free tier (`deepseek-v4-flash:free`) so you can test instantly with zero friction.
            However, at production enterprise scale (100k–10M emails/month), free tiers are impossible due to strict concurrency limits (shared pool of 5–10 requests/min).
            Production data pipelines must deploy commercial models—where <strong>output tokens are charged at a 4x–5x premium</strong> over input tokens.
          </p>
        </div>
      </div>

      {/* Model Benchmark Tier Switcher */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase text-zinc-400 font-bold block">
          Compare Jev Against Commercial LLM Tier:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COMPARISON_TIERS.map((tier) => {
            const isSelected = selectedTierId === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-zinc-800/90 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold truncate max-w-[150px]">
                    {tier.providerBadge}
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 font-semibold shrink-0">
                    ${tier.outputPricePerMTok.toFixed(2)}/M out
                  </span>
                </div>
                <div className="text-xs font-bold text-white mb-0.5">{tier.name}</div>
                <div className="text-[10px] font-mono text-zinc-400 mb-1 truncate">{tier.modelReference}</div>
                <div className="text-[11px] text-zinc-500 line-clamp-2">{tier.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Volume Slider Control */}
      <div className="space-y-3 bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800">
        <div className="flex justify-between text-xs font-mono text-zinc-400">
          <span>1,000 / day (Seed Startup)</span>
          <span className="text-emerald-400 font-bold">{dailyEmails.toLocaleString()} / day</span>
          <span>500,000 / day (Enterprise)</span>
        </div>
        <input
          type="range"
          min={1000}
          max={500000}
          step={5000}
          value={dailyEmails}
          onChange={(e) => setDailyEmails(Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
          <span>Monthly Items: <strong className="text-zinc-300">{monthlyEmails.toLocaleString()}</strong></span>
          <span>Monthly Input Tokens: <strong className="text-zinc-300">~{monthlyInputTokensM.toFixed(1)}M</strong></span>
          <span>Monthly Output Tokens: <strong className="text-zinc-300">~{monthlyOutputTokensM.toFixed(1)}M</strong></span>
        </div>
      </div>

      {/* 3 Metric Output Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Annual Financial Delta */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-2 font-bold">
              <span>ANNUAL CLOUD SAVINGS</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
              ${Math.round(annualSavings).toLocaleString()}
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Jev is <strong className="text-emerald-400">{costRatio}x cheaper</strong> than {selectedTier.name}.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
            Output Token Tax Saved: <strong className="text-emerald-400">${Math.round(monthlyLlmOutputCost * 12).toLocaleString()}/yr</strong>
          </div>
        </div>

        {/* Card 2: Monthly Spend Breakdown */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-xs font-mono text-zinc-400 uppercase font-bold">
            Monthly Cloud Invoice Comparison
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <span className="text-zinc-400 truncate max-w-[160px]">{selectedTier.name}:</span>
              <span className="font-bold text-rose-400 text-sm">
                ${Math.round(monthlyLlmCost).toLocaleString()} / mo
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <span className="text-emerald-400 font-bold">TypeSafe Jev:</span>
              <span className="font-bold text-emerald-400 text-sm">
                ${Math.max(monthlyJevCost, 0.2).toFixed(2)} / mo
              </span>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="space-y-1">
            <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(Math.min((monthlyJevCost / monthlyLlmCost) * 100, 100), 2)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>Jev Cost Share ({((monthlyJevCost / monthlyLlmCost) * 100).toFixed(1)}%)</span>
              <span>100% LLM Baseline</span>
            </div>
          </div>
        </div>

        {/* Card 3: Compute Hours Saved */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2 font-bold">
              <span>PIPELINE LATENCY SAVED</span>
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
              {hoursSavedPerMonth.toLocaleString()} hrs
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Cumulative server-blocking runtime eliminated each month from email/ticket worker queues.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex justify-between">
            <span>LLM: {llmHoursPerMonth} hrs</span>
            <span className="text-emerald-400 font-bold">Jev: {jevHoursPerMonth} hrs</span>
          </div>
        </div>
      </div>

      {/* Unit Economics Pricing Matrix Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
        <div className="text-xs font-mono font-bold text-zinc-300 uppercase mb-3 flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span>Transparent Mathematical Unit Economics Breakdown</span>
        </div>

        <table className="w-full text-left text-xs font-mono text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase">
              <th className="pb-2">Architecture Engine</th>
              <th className="pb-2">Input Tokens (Per MTok)</th>
              <th className="pb-2">Output Tokens (Per MTok)</th>
              <th className="pb-2">Avg Latency</th>
              <th className="pb-2">Schema Guarantees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            <tr className="bg-emerald-500/5">
              <td className="py-2.5 font-bold text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>TypeSafe Jev (System One)</span>
              </td>
              <td className="py-2.5 text-white font-semibold">$0.042 / MTok</td>
              <td className="py-2.5 text-emerald-400 font-bold">$0.00 (FREE / No Token Tax)</td>
              <td className="py-2.5 text-emerald-300">~80–120ms</td>
              <td className="py-2.5 text-emerald-400 font-bold">100% Invariant (Logit-bound)</td>
            </tr>
            <tr>
              <td className="py-2.5 text-zinc-300 font-medium">
                <div>Frontier Flagship</div>
                <div className="text-[10px] text-zinc-500 font-mono">OpenAI GPT-6 Astra · Claude Fable 5.1</div>
              </td>
              <td className="py-2.5 text-zinc-300">$10.00 / MTok</td>
              <td className="py-2.5 text-rose-400 font-semibold">$50.00 / MTok (5x tax)</td>
              <td className="py-2.5 text-zinc-400">~3,200ms</td>
              <td className="py-2.5 text-amber-400">Probabilistic format drift</td>
            </tr>
            <tr>
              <td className="py-2.5 text-zinc-300 font-medium">
                <div>Workhorse Pro</div>
                <div className="text-[10px] text-zinc-500 font-mono">Claude Opus 5 · GPT-5.6 Sol Pro</div>
              </td>
              <td className="py-2.5 text-zinc-300">$3.50 / MTok</td>
              <td className="py-2.5 text-rose-400 font-semibold">$17.50 / MTok (5x tax)</td>
              <td className="py-2.5 text-zinc-400">~2,400ms</td>
              <td className="py-2.5 text-amber-400">Probabilistic format drift</td>
            </tr>
            <tr>
              <td className="py-2.5 text-zinc-300 font-medium">
                <div>High-Speed Flash</div>
                <div className="text-[10px] text-zinc-500 font-mono">Google Gemini 3.8 Flash</div>
              </td>
              <td className="py-2.5 text-zinc-300">$0.75 / MTok</td>
              <td className="py-2.5 text-rose-400 font-semibold">$3.75 / MTok (5x tax)</td>
              <td className="py-2.5 text-zinc-400">~1,800ms</td>
              <td className="py-2.5 text-amber-400">Probabilistic format drift</td>
            </tr>
            <tr>
              <td className="py-2.5 text-zinc-300 font-medium">
                <div>Budget Open-Weights</div>
                <div className="text-[10px] text-zinc-500 font-mono">DeepSeek V4.1 Flash · Luna Pro</div>
              </td>
              <td className="py-2.5 text-zinc-300">$0.15 / MTok</td>
              <td className="py-2.5 text-rose-400 font-semibold">$0.60 / MTok (4x tax)</td>
              <td className="py-2.5 text-zinc-400">~1,400ms</td>
              <td className="py-2.5 text-amber-400">Probabilistic format drift</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
