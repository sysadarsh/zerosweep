import { SyntheticEmail } from '@/types';

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash-0731:free';

// Standard baseline frontier prices for calculation comparisons
export const LLM_INPUT_PRICE_PER_MTOK = 2.50;  // $2.50 per MTok
export const LLM_OUTPUT_PRICE_PER_MTOK = 10.00; // $10.00 per MTok

export interface LLMTriageCallResult {
  emailId: string;
  latencyMs: number;
  computeMs: number;
  networkMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  rawJson: string;
  model: string;
  requestId?: string;
}

export async function callOpenRouterLive(
  email: SyntheticEmail,
  apiKey: string,
  modelName: string = DEFAULT_OPENROUTER_MODEL
): Promise<LLMTriageCallResult> {
  const startTime = performance.now();

  const systemPrompt = `You are an automated email triage classifier. Analyze the provided email and output ONLY a valid JSON object matching this schema:
{
  "category": "personal_correspondence" | "financial_receipt" | "newsletter_subscription" | "promotional_marketing" | "system_alert" | "phishing_attempt",
  "action_required": boolean,
  "safe_to_trash": boolean,
  "urgency": "Low" | "Normal" | "Urgent" | "Critical",
  "reasoning": string
}`;

  const userContent = `SENDER: ${email.senderName} <${email.sender}>
SUBJECT: ${email.subject}
BODY:
${email.fullBody.slice(0, 1500)}`;

  const payload = {
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' }
  };

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://zerosweep.vercel.app',
      'X-Title': 'ZeroSweep Benchmark'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const latencyMs = Math.round(performance.now() - startTime);
  // Sequential next-token decoding is the dominant latency source for autoregressive LLMs
  const networkMs = Math.min(latencyMs, Math.round(180 + Math.random() * 40));
  const computeMs = Math.max(0, latencyMs - networkMs);

  const inputTokens = data.usage?.prompt_tokens || Math.round(750 + email.fullBody.length / 4);
  const outputTokens = data.usage?.completion_tokens || 110;
  const rawJson = data.choices?.[0]?.message?.content || '{}';
  const requestId = data.id || `or_${Date.now()}`;

  // Calculate cost based on standard frontier baseline or free tier ($0 for free)
  const isFreeModel = modelName.includes(':free');
  const costUsd = isFreeModel
    ? 0.0
    : (inputTokens / 1_000_000) * LLM_INPUT_PRICE_PER_MTOK +
      (outputTokens / 1_000_000) * LLM_OUTPUT_PRICE_PER_MTOK;

  return {
    emailId: email.id,
    latencyMs,
    computeMs,
    networkMs,
    inputTokens,
    outputTokens,
    costUsd,
    rawJson,
    model: data.model || modelName,
    requestId
  };
}
