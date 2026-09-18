import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterLive, DEFAULT_OPENROUTER_MODEL } from '@/lib/llmBenchmark';
import { SyntheticEmail } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      apiKey
    }: {
      email: SyntheticEmail;
      apiKey?: string;
    } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email payload' }, { status: 400 });
    }

    // Resolve key: client-provided key takes precedence over server-side env var
    const activeKey = apiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim();
    if (!activeKey) {
      return NextResponse.json(
        {
          error: 'OpenRouter API Key not configured. Please set OPENROUTER_API_KEY in your Vercel environment variables to execute benchmark comparison.',
          requiresKey: true
        },
        { status: 401 }
      );
    }

    // Security & Budget Invariant: The backend strictly locks the model to the single
    // authorized free baseline (deepseek/deepseek-v4-flash-0731:free).
    // External actors cannot pass arbitrary paid models to consume API credits.
    const safeModel = DEFAULT_OPENROUTER_MODEL;

    const result = await callOpenRouterLive(email, activeKey, safeModel);

    return NextResponse.json({
      success: true,
      isLive: true,
      emailId: email.id,
      model: result.model,
      requestId: result.requestId,
      latencyMs: result.latencyMs,
      computeMs: result.computeMs,
      networkMs: result.networkMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
      rawJson: result.rawJson
    });
  } catch (error: unknown) {
    console.error('Error in /api/triage/llm:', error);
    const message = error instanceof Error ? error.message : 'Failed to process triage with Frontier LLM';
    const isRateLimit = message.includes('429') || message.toLowerCase().includes('rate limit');
    return NextResponse.json(
      {
        error: isRateLimit
          ? 'OpenRouter free-tier rate limit reached. The model is experiencing high demand from multiple users. Please wait a few seconds and try again.'
          : message,
        isRateLimited: isRateLimit
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
