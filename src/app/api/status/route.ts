import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const typesafeKey = process.env.TYPESAFE_API_KEY?.trim();
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();

  const isTypesafeConfigured = Boolean(typesafeKey && typesafeKey.length > 0);
  const isOpenrouterConfigured = Boolean(openrouterKey && openrouterKey.length > 0);

  return NextResponse.json({
    status: isTypesafeConfigured && isOpenrouterConfigured ? 'ready' : 'keys_required',
    typesafeConfigured: isTypesafeConfigured,
    openrouterConfigured: isOpenrouterConfigured,
    message: isTypesafeConfigured && isOpenrouterConfigured
      ? 'Live API gateways connected and ready.'
      : 'API keys not configured. Please set TYPESAFE_API_KEY and OPENROUTER_API_KEY in your Vercel environment variables.'
  });
}
