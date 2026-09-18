import { NextRequest, NextResponse } from 'next/server';
import { callJevLive } from '@/lib/typesafe';
import { evaluateSafetyGate } from '@/lib/safetyGate';
import { SyntheticEmail, EmailCategory } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, apiKey }: { email: SyntheticEmail; apiKey?: string } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email payload' }, { status: 400 });
    }

    // Resolve key: client-provided key takes precedence over server-side env var
    const activeKey = apiKey?.trim() || process.env.TYPESAFE_API_KEY?.trim();
    if (!activeKey) {
      return NextResponse.json(
        {
          error: 'TypeSafe API Key not configured. Please set TYPESAFE_API_KEY in your Vercel environment variables to execute live System One triage.',
          requiresKey: true
        },
        { status: 401 }
      );
    }

    const result = await callJevLive(email, activeKey);

    const categoryAnswer = result.response.answers.category;
    const actionRequiredAnswer = result.response.answers.action_required;
    const safeToTrashAnswer = result.response.answers.safe_to_trash;

    const category = (categoryAnswer?.choice as EmailCategory) || 'personal_correspondence';
    const categoryProbabilities = categoryAnswer?.probabilities || {};
    const confidence = categoryAnswer?.confidence ?? 0.92;
    const actionRequiredProb = actionRequiredAnswer?.noul ?? 0.1;
    const safeToTrashProb = safeToTrashAnswer?.noul ?? 0.1;

    // Apply negative engineering safety gate
    const triageDecision = evaluateSafetyGate(
      email.id,
      category,
      categoryProbabilities,
      actionRequiredProb,
      safeToTrashProb,
      confidence
    );
    triageDecision.latencyMs = result.latencyMs;
    triageDecision.computeMs = result.computeMs;
    triageDecision.networkMs = result.networkMs;
    triageDecision.requestId = result.requestId;
    triageDecision.modelUsed = 'jev-latest';
    triageDecision.rawJson = JSON.stringify(result.response, null, 2);

    return NextResponse.json({
      success: true,
      isLive: true,
      emailId: email.id,
      latencyMs: result.latencyMs,
      computeMs: result.computeMs,
      networkMs: result.networkMs,
      requestId: result.requestId,
      upstreamHeader: result.upstreamHeader,
      usage: result.response.usage,
      triageDecision,
      rawResponse: result.response
    });
  } catch (error: unknown) {
    console.error('Error in /api/triage/typesafe:', error);
    const message = error instanceof Error ? error.message : 'Failed to process triage with Jev';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
