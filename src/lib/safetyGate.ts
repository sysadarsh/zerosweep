import { EmailCategory, EmailTriageResult, TriageDestination } from '@/types';

export const CONFIDENCE_SAFETY_THRESHOLD = 0.85;

export function evaluateSafetyGate(
  emailId: string,
  category: EmailCategory,
  categoryProbabilities: Record<string, number>,
  actionRequiredProb: number,
  safeToTrashProb: number,
  confidence: number
): EmailTriageResult {
  let destination: TriageDestination = 'inbox';
  let isSafetyGated = false;
  let reason = '';

  // 1. First Principle: Epistemic Calibration Check
  // If the model is uncertain (< 85%), NEVER take an automated destructive or aggressive routing step.
  if (confidence < CONFIDENCE_SAFETY_THRESHOLD) {
    destination = 'human_review';
    isSafetyGated = true;
    reason = `Epistemic Safety Gate Triggered: Model reported ${Math.round(confidence * 100)}% confidence (< 85% threshold). Dispatched to Human Review to prevent false-positive loss.`;
    return {
      emailId,
      category,
      categoryProbabilities,
      actionRequiredProb,
      safeToTrashProb,
      confidence,
      destination,
      isSafetyGated,
      reason,
    };
  }

  // 2. Clear Non-Destructive Categorization
  if (category === 'phishing_attempt') {
    destination = 'trash_quarantine';
    reason = `Security Quarantine: Phishing threat detected (${Math.round((categoryProbabilities['phishing_attempt'] || 0.9) * 100)}% probability). Isolated from inbox.`;
  } else if (safeToTrashProb >= 0.85) {
    destination = 'trash_quarantine';
    reason = `Automated Sweep: Unsolicited outreach / promotional marketing with ${Math.round(safeToTrashProb * 100)}% disposable score. Safe to quarantine.`;
  } else if (category === 'newsletter_subscription') {
    destination = 'newsletters';
    reason = `Digest Routing: Informational newsletter routed to Newsletters folder for asynchronous reading.`;
  } else if (category === 'financial_receipt') {
    destination = 'financial_receipt';
    reason = `Financial Routing: Valid receipt or invoice detected. Auto-routed to Accounting & Receipts.`;
  } else if (category === 'system_alert') {
    destination = 'system_alert';
    reason = `DevOps Routing: Automated monitoring or cloud alert classified and routed to System Alerts.`;
  } else if (actionRequiredProb >= 0.7) {
    destination = 'inbox';
    reason = `Priority Inbox: High-importance correspondence requiring active recipient reply or action.`;
  } else {
    destination = 'inbox';
    reason = `Verified: Legitimate transactional or personal correspondence retained in Inbox.`;
  }

  return {
    emailId,
    category,
    categoryProbabilities,
    actionRequiredProb,
    safeToTrashProb,
    confidence,
    destination,
    isSafetyGated,
    reason,
  };
}
