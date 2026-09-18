import { ModelOption } from '@/types';

export const JEV_MODELS: ModelOption[] = [
  {
    id: 'jev-latest',
    name: 'Jev (Latest)',
    provider: 'typesafe',
    category: 'system_one',
    description: "TypeSafe's flagship non-autoregressive System One model with parallel sampling and RLCD calibration.",
    inputCostPerMTok: 0.042,
    outputCostPerMTok: 0.0,
    typicalLatencyMs: 110,
  },
  {
    id: 'jev-1.13',
    name: 'Jev 1.13 (Stable)',
    provider: 'typesafe',
    category: 'system_one',
    description: 'Stable production checkpoint optimized for high-throughput enterprise classification.',
    inputCostPerMTok: 0.042,
    outputCostPerMTok: 0.0,
    typicalLatencyMs: 125,
  },
];

// Single Verified Free OpenRouter Comparison Model (DeepSeek V4 Flash)
export const OPENROUTER_FREE_MODELS: ModelOption[] = [
  {
    id: 'deepseek/deepseek-v4-flash-0731:free',
    name: 'DeepSeek V4 Flash',
    provider: 'openrouter',
    isFree: true,
    category: 'frontier_free',
    description: "DeepSeek's optimized high-throughput flash model with structured JSON mode.",
    inputCostPerMTok: 0.0,
    outputCostPerMTok: 0.0,
    typicalLatencyMs: 2400,
  },
];
