import React from 'react';
import { SyntheticEmail, EmailTriageResult } from '@/types';
import { X, ShieldAlert, CheckCircle, Gauge, Layers } from 'lucide-react';

interface CalibrationDrawerProps {
  email: SyntheticEmail | null;
  result?: EmailTriageResult;
  onClose: () => void;
}

export const CalibrationDrawer: React.FC<CalibrationDrawerProps> = ({
  email,
  result,
  onClose
}) => {
  if (!email) return null;

  const probs = result?.categoryProbabilities || {
    personal_correspondence: 0.1,
    financial_receipt: 0.1,
    newsletter_subscription: 0.1,
    promotional_marketing: 0.6,
    system_alert: 0.05,
    phishing_attempt: 0.05,
  };

  const confidence = result?.confidence ?? 0.92;
  const isSafetyGated = result?.isSafetyGated ?? (email.isAmbiguous ?? false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Epistemic Calibration Telemetry</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                RLCD Verification
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspecting Jev&apos;s parallel logit distribution and confidence metric
            </p>
          </div>
        </div>

        {/* Email Context Card */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span><strong>From:</strong> {email.senderName} &lt;{email.sender}&gt;</span>
            <span className="font-mono text-[11px]">{email.date}</span>
          </div>
          <div className="text-sm font-semibold text-zinc-100">{email.subject}</div>
          <div className="text-xs text-zinc-400 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/50 whitespace-pre-line font-mono text-[11px] max-h-36 overflow-y-auto">
            {email.fullBody}
          </div>
        </div>

        {/* Epistemic Calibration & Safety Banner */}
        {isSafetyGated ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wide">
              <ShieldAlert className="h-4 w-4" />
              <span>Negative-Engineering Safety Gate Triggered</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Jev detected genuine semantic ambiguity and reported a calibrated confidence of{' '}
              <strong className="font-mono text-white underline">{Math.round(confidence * 100)}%</strong> (below the safe 85% automation threshold).
            </p>
            <div className="text-[11px] font-mono bg-zinc-950/80 p-2 rounded text-zinc-300 border border-amber-500/20">
              ⚡ <strong>Action Taken:</strong> Overrode automated trash; routed to <span className="text-amber-300 font-bold">Human Review</span> to protect critical passenger booking data.
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-xs text-zinc-200">
                <strong className="text-emerald-400">High Confidence Decision:</strong> Model calibrated certainty at{' '}
                <span className="font-mono font-bold text-white">{Math.round(confidence * 100)}%</span>. Safe for automated execution.
              </div>
            </div>
          </div>
        )}

        {/* Jev Primitive Distributions */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Choice Primitive: Category Logits</span>
          </h4>

          <div className="space-y-2 text-xs">
            {Object.entries(probs).map(([cat, prob]) => {
              const pct = Math.round((prob || 0) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-zinc-300 capitalize">{cat.replace('_', ' ')}</span>
                    <span className="text-zinc-400 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 50 ? 'bg-emerald-400' : 'bg-zinc-700'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Noul Binary Primitives */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Noul: action_required</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {result ? Math.round(result.actionRequiredProb * 100) : 10}%
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Probability reply is needed</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Noul: safe_to_trash</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {result ? Math.round(result.safeToTrashProb * 100) : 10}%
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Disposable score</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
};
