export type EmailCategory =
  | 'personal_correspondence'
  | 'financial_receipt'
  | 'newsletter_subscription'
  | 'promotional_marketing'
  | 'system_alert'
  | 'phishing_attempt';

export type TriageDestination =
  | 'inbox'
  | 'trash_quarantine'
  | 'human_review'
  | 'newsletters'
  | 'financial_receipt'
  | 'system_alert';

export interface SyntheticEmail {
  id: string;
  sender: string;
  senderName: string;
  subject: string;
  snippet: string;
  fullBody: string;
  date: string;
  archetype: string;
  isAmbiguous?: boolean; // Demonstrates the epistemic safety gate
  ambiguityReason?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: 'typesafe' | 'openrouter';
  isFree?: boolean;
  category: 'system_one' | 'frontier_free' | 'frontier_paid';
  description: string;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  typicalLatencyMs: number;
}

export interface JevChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface JevNoulAnswer {
  type: 'noul';
  noul: number;
}

export interface JevScoreAnswer {
  type: 'score';
  score: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface JevSystemOneResponse {
  model: string;
  answers: {
    category?: JevChoiceAnswer;
    action_required?: JevNoulAnswer;
    safe_to_trash?: JevNoulAnswer;
    urgency?: JevScoreAnswer;
    [key: string]: unknown;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface EmailTriageResult {
  emailId: string;
  category: EmailCategory;
  categoryProbabilities: Record<string, number>;
  actionRequiredProb: number;
  safeToTrashProb: number;
  confidence: number;
  destination: TriageDestination;
  isSafetyGated: boolean; // Triggered if confidence < 0.85
  reason: string;
  latencyMs?: number;
  computeMs?: number; // Server-side model inference time (from x-envoy-upstream-service-time or TTFT processing)
  networkMs?: number; // Internet RTT / transit latency (latencyMs - computeMs)
  modelUsed?: string;
  rawJson?: string;
  requestId?: string;
}

export interface EngineStats {
  engineName: string;
  modelId: string;
  latencyMs: number;
  computeMs?: number;
  networkMs?: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  formatErrors: number;
  speedupVsBaseline?: number;
  costReductionVsBaseline?: number;
}

export interface BenchmarkRun {
  runId: string;
  timestamp: string;
  isLive: boolean;
  totalEmails: number;
  jevStats: EngineStats;
  llmStats: EngineStats;
  results: Record<string, EmailTriageResult>;
}
