import { SyntheticEmail } from '@/types';

interface EmailTemplate {
  sender: string;
  senderName: string;
  subjectTemplates: string[];
  bodyTemplates: string[];
  archetype: string;
  isAmbiguous?: boolean;
  ambiguityReason?: string;
}

const TEMPLATES: EmailTemplate[] = [
  // 1. VIP Business & Action Required
  {
    sender: 'alex.vance@sequoia-cap.internal',
    senderName: 'Alex Vance (Sequoia)',
    archetype: 'Venture Capital Partner',
    subjectTemplates: [
      'Series B Term Sheet Discussion - Follow Up',
      'Quick sync on Q3 growth metrics & cap table',
      'Introduction to candidate for VP of Infrastructure',
      'Board meeting agenda review for next Thursday',
    ],
    bodyTemplates: [
      'Hi team, our investment committee reviewed your latest growth cohort data. We would love to schedule a 30-minute sync this Wednesday to finalize our term sheet allocation. Let me know what times work best.',
      'Congratulations on the recent milestone. Following up on our partner meeting, we need your updated churn projections and burn rate before next Monday.',
      'Putting you in touch with Sarah Lin, former VP of Eng at Stripe. She was very impressed with your System-One architecture benchmarks and would be a stellar addition.',
    ],
  },
  {
    sender: 'cto@enterprise-client.com',
    senderName: 'David Chen (Enterprise CTO)',
    archetype: 'Critical Customer Churn',
    subjectTemplates: [
      'URGENT: Production API latency spike affecting checkout flow',
      'Contract Renewal: Security audit requirement before sign-off',
      'Escalation: SLA breach on webhook delivery',
    ],
    bodyTemplates: [
      'Our checkout microservices experienced an unacceptable 4.2s latency degradation over the weekend due to downstream classification bottlenecks. We need an immediate RCA and call with your engineering leads today, or we will have to pause our enterprise renewal.',
      'Before our legal team signs the annual renewal ($180k ARR), our CISO requires your SOC2 Type II report and automated epistemic safety validation docs.',
    ],
  },
  // 2. Financial Receipts & Invoices
  {
    sender: 'invoicing@stripe.com',
    senderName: 'Stripe Billing',
    archetype: 'Payment Processor Receipt',
    subjectTemplates: [
      'Invoice #INV-2026-90412 for API Usage ($3,420.50)',
      'Payout of $48,210.00 is on its way to your Silicon Valley Bank account',
      'Monthly account statement: August 2026',
    ],
    bodyTemplates: [
      'Your monthly payment of $3,420.50 has been successfully processed on Visa ending in 4092. Breakdown: 81.4M API invocations. Receipt and tax breakdown attached.',
      'We have initiated a payout of $48,210.00 to your bank account ending in 8831. Funds are expected to clear in 1-2 business days.',
    ],
  },
  {
    sender: 'aws-billing@amazon.com',
    senderName: 'Amazon Web Services',
    archetype: 'Cloud Infrastructure Invoice',
    subjectTemplates: [
      'Amazon Web Services Invoice [Account: 8901-2345-6789] - $12,840.12',
      'Your AWS bill is available for August 2026',
      'Payment processed for AWS Cloud Services',
    ],
    bodyTemplates: [
      'Thank you for using Amazon Web Services. Your payment of $12,840.12 has been successfully charged. Largest cost drivers: EC2 GPU Clusters ($8,200), DynamoDB ($2,100), Data Transfer ($1,540). View console for itemized cost analysis.',
    ],
  },
  {
    sender: 'billing@fly.io',
    senderName: 'Fly.io Billing',
    archetype: 'Infrastructure Receipt',
    subjectTemplates: [
      'Receipt for invoice #FLY-8491 ($380.00)',
      'Your Fly.io monthly invoice is ready',
    ],
    bodyTemplates: [
      'Receipt for your Fly.io organization. Total charged: $380.00 on Mastercard ending in 1102. Deployments: 8 dedicated CPU edge machines.',
    ],
  },
  // 3. System Alerts & DevOps
  {
    sender: 'alerts@pagerduty.com',
    senderName: 'PagerDuty Incident',
    archetype: 'P1 Production Incident',
    subjectTemplates: [
      '[FIRING:1] CRITICAL - DB Connection Pool Exhaustion (prod-us-east-1)',
      '[RESOLVED] P2 High Memory Pressure on inference-worker-04',
      '[FIRING:2] P1 Redis Latency Spike > 500ms',
    ],
    bodyTemplates: [
      'Incident #90214 has been triggered in production. Database connection pool usage exceeded 98% for > 3 minutes. Primary on-call engineer paged. Runbook: https://wiki.internal/runbooks/db-pool.',
      'Alert resolved: Memory utilization has returned to nominal levels (62%) on node inference-worker-04.',
    ],
  },
  {
    sender: 'notifications@github.com',
    senderName: 'GitHub Security',
    archetype: 'Security Vulnerability Alert',
    subjectTemplates: [
      '[Security Advisory] Dependabot detected high severity CVE in next-auth',
      'Pull Request #412: Automated dependency bump to fix CVE-2026-3910',
      'New SSH key added to organization account',
    ],
    bodyTemplates: [
      'Dependabot detected a High severity vulnerability in package next-auth (< 4.25.0). Remediate by merging automated pull request #412. See advisory details for exploit vectors.',
    ],
  },
  {
    sender: 'ops@datadoghq.com',
    senderName: 'Datadog Monitors',
    archetype: 'Infrastructure Monitoring',
    subjectTemplates: [
      '[Triggered] 99th Percentile API Latency > 2,000ms',
      '[Warn] Disk Space Usage > 85% on log-aggregator-02',
    ],
    bodyTemplates: [
      'Monitor: P99 API Latency exceeded threshold of 2,000ms for 5 consecutive check intervals. Current value: 3,410ms. Impacted service: /v1/chat/completions fallback proxy.',
    ],
  },
  // 4. Newsletters & Subscriptions
  {
    sender: 'gergely@pragmaticengineer.com',
    senderName: 'The Pragmatic Engineer',
    archetype: 'Engineering Newsletter',
    subjectTemplates: [
      'Inside the Shift from Autoregressive LLMs to System-One Inference',
      'How Big Tech is Slashing AI Triage Latency by 100x',
      'The Economics of AI Agents: Why Output Tokens are Killing Startups',
    ],
    bodyTemplates: [
      'This week, we analyze how engineering teams at high-throughput startups are replacing slow 30-second LLM chains with single-pass System-One models. We look at benchmarks, real-world cost comparisons, and the rise of RLCD training.',
      'In this edition: The death of JSON repair prompts, calibrated confidence vs hallucinated certainty, and how TypeSafe Jev achieves 80ms classification with $0 output tokens.',
    ],
  },
  {
    sender: 'dan@tldr.tech',
    senderName: 'TLDR Tech',
    archetype: 'Tech News Digest',
    subjectTemplates: [
      'TLDR AI: New benchmarks show parallel classification beats chain-of-thought',
      'TLDR WebDev: Next.js 15, Rust tooling, and latency-critical backends',
      'TLDR: The state of AI in production 2026',
    ],
    bodyTemplates: [
      'Daily curated news for software engineers: DeepMind announces new reasoning primitives, OpenRouter updates free-tier limits, and why deterministic classification loops should never use autoregressive sampling.',
    ],
  },
  // 5. Promotional Marketing & Cold Sales (Safe to Trash)
  {
    sender: 'sales@b2b-growth-leads.io',
    senderName: 'SDR Outbound',
    archetype: 'Cold B2B Sales Pitch',
    subjectTemplates: [
      'Quick question regarding your outbound SDR pipeline',
      '15 mins this Thursday to discuss scaling lead generation?',
      'Noticed you are hiring engineers at ZeroSweep',
      'Did you see our case study on 4x conversion rates?',
    ],
    bodyTemplates: [
      'Hi Alex, I came across your profile and noticed you are scaling your engineering team. We offer offshore SDR teams with guaranteed 50 SQLs per month. Do you have 10 minutes this Thursday for a quick demo?',
      'Following up on my previous note. I know you are busy, but our AI-driven email scraping tool could 10x your response rates. Let me know if you would like me to send a free sample list.',
    ],
  },
  {
    sender: 'promotions@saas-tools-weekly.com',
    senderName: 'SaaS Deals Digest',
    archetype: 'Promotional Marketing Blast',
    subjectTemplates: [
      'Special 40% discount on Enterprise Cloud Hosting',
      'Flash Sale: Limited time offer on Developer Monitor Arm',
      'Your exclusive invite to the 2026 SaaS Scaling Summit',
    ],
    bodyTemplates: [
      'Upgrade your workspace today with our limited-time seasonal discount. Use code DEVELOPER40 at checkout to claim your savings. Offer expires Sunday midnight.',
    ],
  },
  // 6. Phishing Attempts (Quarantine / Danger)
  {
    sender: 'security-update@docusign-verification.net',
    senderName: 'DocuSign Document Portal',
    archetype: 'Credential Harvesting Phishing',
    subjectTemplates: [
      'URGENT: Please sign electronic agreement for Payroll Confirmation',
      'Action Required: Important contract waiting for your signature',
      'Document Access Pending: Expiration in 24 hours',
    ],
    bodyTemplates: [
      'You have received an urgent document requiring your signature from Human Resources. Please click the link below to verify your corporate credentials and sign the payroll addendum. Note: This link will expire in 24 hours. [Sign Document Now: http://docusign-verification.net/auth/login]',
    ],
  },
  {
    sender: 'admin@m1crosoft-office365-security.com',
    senderName: 'Microsoft 365 Account Security',
    archetype: 'Spoofed Security Alert',
    subjectTemplates: [
      'Your Microsoft 365 session has expired - Re-authenticate immediately',
      'Security Alert: Unusual sign-in activity detected from Moscow, Russia',
    ],
    bodyTemplates: [
      'We prevented an unauthorized login attempt to your Microsoft 365 account from IP 194.26.29.112 (Moscow). To protect your emails and files, you must immediately reset your enterprise password at: http://m1crosoft-office365-security.com/reset.',
    ],
  },
  // 7. Ambiguous Edge Cases (Epistemic Safety Gate < 85% Confidence)
  {
    sender: 'travel-deals@delta-airlines.newsletter.com',
    senderName: 'Delta SkyMiles & Travel',
    archetype: 'Ambiguous Promo with Flight Receipt',
    isAmbiguous: true,
    ambiguityReason: 'Promotional newsletter layout containing an embedded confirmation for an upcoming business flight.',
    subjectTemplates: [
      'SkyMiles Weekly Deals + Confirmation for Flight DL-1042 to SFO',
      'Your Travel Update: Special hotel rates and eTicket Receipt DL-892',
    ],
    bodyTemplates: [
      'Explore our Fall Flight Sales! Save 25% on select West Coast routes.\n\n--------------------\nYOUR UPCOMING FLIGHT CONFIRMATION:\nConfirmation Code: #H92LKQ\nFlight DL-1042: JFK -> SFO\nDate: Tomorrow at 08:30 AM\nSeat: 4A (First Class)\nStatus: Confirmed & Paid ($840.00)\n--------------------\n\nCheck in online or manage your SkyMiles account via our mobile app.',
    ],
  },
  {
    sender: 'vip-client-support@mercury.com',
    senderName: 'Mercury Banking Support',
    archetype: 'Ambiguous Transaction / Notice',
    isAmbiguous: true,
    ambiguityReason: 'Routine banking terms update with a critical deadline requiring human confirmation.',
    subjectTemplates: [
      'Notice of updated wire transfer policy & verification request',
      'Banking updates for your corporate checking account',
    ],
    bodyTemplates: [
      'Dear Customer, we have updated our wire transfer compliance policy. To ensure continuous international wire capabilities, please review the attached agreement before the end of the business week or reply to this message.',
    ],
  },
];

/**
 * Procedurally generates an arbitrary count of realistic synthetic emails
 * @param count Number of emails to generate (e.g. 50, 100, 250, 500, 1000)
 */
export function generateScaleDataset(count: number): SyntheticEmail[] {
  const emails: SyntheticEmail[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const templateIndex = i % TEMPLATES.length;
    const template = TEMPLATES[templateIndex];

    const subjectIndex = Math.floor(i / TEMPLATES.length) % template.subjectTemplates.length;
    const bodyIndex = Math.floor(i / TEMPLATES.length) % template.bodyTemplates.length;

    const subject = template.subjectTemplates[subjectIndex];
    const fullBody = template.bodyTemplates[bodyIndex];

    // Minutes offset for realistic descending timestamps
    const minutesAgo = i * 4 + Math.floor((i % 7) * 2.5);
    const emailDate = new Date(now - minutesAgo * 60 * 1000);
    const dateFormatted = minutesAgo < 60
      ? `${minutesAgo + 1}m ago`
      : minutesAgo < 1440
      ? `${Math.floor(minutesAgo / 60)}h ago`
      : emailDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    emails.push({
      id: `scale-${i + 1}-${Date.now().toString(36)}`,
      sender: template.sender,
      senderName: template.senderName,
      subject,
      snippet: fullBody.replace(/\n+/g, ' ').slice(0, 130) + '...',
      fullBody,
      date: dateFormatted,
      archetype: template.archetype,
      isAmbiguous: template.isAmbiguous,
      ambiguityReason: template.ambiguityReason,
    });
  }

  return emails;
}
