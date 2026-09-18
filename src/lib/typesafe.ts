import { SyntheticEmail, JevSystemOneResponse } from '@/types';

export const TYPESAFE_API_URL = 'https://api.typesafe.ai/v1/systemone';
export const JEV_INPUT_PRICE_PER_MTOK = 0.042; // $0.042 per million input tokens
export const JEV_OUTPUT_PRICE_PER_MTOK = 0.0;  // Output tokens are FREE

export interface JevTriageCallResult {
  emailId: string;
  response: JevSystemOneResponse;
  latencyMs: number;
  computeMs: number;
  networkMs: number;
  requestId?: string;
  upstreamHeader?: string;
}

export function buildJevQuestionsPayload() {
  return {
    category: {
      type: 'choice',
      instructions: 'Classify this email into exactly one operational category.',
      criteria: {
        personal_correspondence: 'Direct 1-on-1 human communication, colleague discussions, team feedback',
        financial_receipt: 'Invoices, payment receipts, bank charges, subscription billings',
        newsletter_subscription: 'Curated newsletters, blog summaries, industry digests',
        promotional_marketing: 'Unsolicited sales pitches, commercial discounts, offshore recruiting offers',
        system_alert: 'Datadog monitors, cloud infrastructure alerts, P1 incidents, status page notices',
        phishing_attempt: 'Fraudulent urgency, mismatched domains, fake account suspension threats, parcel scams'
      }
    },
    action_required: {
      type: 'noul',
      instructions: 'Does this email require an explicit reply, decision, or personal action from the recipient?',
      criteria: {
        true: 'Recipient must reply, take action, or resolve a critical issue',
        false: 'Informational only or disposable spam'
      }
    },
    safe_to_trash: {
      type: 'noul',
      instructions: 'Is this a disposable promotional blast, marketing offer, cold sales pitch, or malicious phishing email?',
      criteria: {
        true: 'Safe to archive, sweep, or quarantine without user harm',
        false: 'Important correspondence, receipt, or critical account notification'
      }
    },
    urgency: {
      type: 'score',
      instructions: 'How time-sensitive or critical is this email?',
      criteria: ['Low / None', 'Normal', 'Urgent', 'Critical / P1']
    }
  };
}

// Live Call to api.typesafe.ai
export async function callJevLive(
  email: SyntheticEmail,
  apiKey: string
): Promise<JevTriageCallResult> {
  const startTime = performance.now();

  const payload = {
    model: 'jev-latest',
    state: {
      from: email.sender,
      sender_name: email.senderName,
      subject: email.subject,
      snippet: email.snippet,
      body: email.fullBody.slice(0, 1500) // prevent context rot by clipping
    },
    questions: buildJevQuestionsPayload()
  };

  const res = await fetch(TYPESAFE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TypeSafe API Error (${res.status}): ${errText}`);
  }

  const data: JevSystemOneResponse = await res.json();
  const latencyMs = Math.round(performance.now() - startTime);
  const envoyHeader = res.headers.get('x-envoy-upstream-service-time');
  const computeMs = envoyHeader ? parseInt(envoyHeader, 10) : Math.min(latencyMs, 75);
  const networkMs = Math.max(0, latencyMs - computeMs);
  const requestId = res.headers.get('x-typesafe-request-id') || undefined;

  return {
    emailId: email.id,
    response: data,
    latencyMs,
    computeMs,
    networkMs,
    requestId,
    upstreamHeader: envoyHeader || undefined
  };
}
