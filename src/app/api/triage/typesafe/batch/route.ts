import { NextRequest, NextResponse } from 'next/server';
import { callJevLive } from '@/lib/typesafe';
import { evaluateSafetyGate } from '@/lib/safetyGate';
import { SyntheticEmail, EmailCategory } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { emails, apiKey: clientApiKey } = (await req.json()) as {
      emails: SyntheticEmail[];
      apiKey?: string;
    };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'emails array is required' }, { status: 400 });
    }

    // Use client-supplied key or fallback to server env var
    const activeApiKey = clientApiKey?.trim() || process.env.TYPESAFE_API_KEY?.trim();
    if (!activeApiKey) {
      return NextResponse.json(
        {
          error: 'TypeSafe API Key not configured. Please set TYPESAFE_API_KEY in your Vercel environment variables to execute live batch triage.',
          requiresKey: true
        },
        { status: 401 }
      );
    }

    // Parallel execution across all emails in this batch chunk
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          const liveRes = await callJevLive(email, activeApiKey);
          const catAnswer = liveRes.response.answers.category;
          const cat = (catAnswer?.choice as EmailCategory) || 'personal_correspondence';
          const catProbs = catAnswer?.probabilities || {};
          const conf = catAnswer?.confidence ?? 0.92;
          const act = liveRes.response.answers.action_required?.noul ?? 0.1;
          const safe = liveRes.response.answers.safe_to_trash?.noul ?? 0.1;

          const decision = evaluateSafetyGate(email.id, cat, catProbs, act, safe, conf);
          decision.latencyMs = liveRes.latencyMs;
          decision.computeMs = liveRes.computeMs;
          decision.networkMs = liveRes.networkMs;
          decision.modelUsed = liveRes.response.model || 'jev-latest';
          decision.rawJson = JSON.stringify(liveRes.response, null, 2);

          return {
            emailId: email.id,
            decision,
            usage: liveRes.response.usage,
            latencyMs: liveRes.latencyMs,
            computeMs: liveRes.computeMs,
            networkMs: liveRes.networkMs,
          };
        } catch (itemErr: unknown) {
          console.error(`Jev batch item failed (${email.id}):`, itemErr);
          const errMessage = itemErr instanceof Error ? itemErr.message : 'Item triage failed';
          return {
            emailId: email.id,
            error: errMessage,
            latencyMs: 0,
            computeMs: 0,
            networkMs: 0,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal batch server error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
