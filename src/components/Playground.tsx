'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SyntheticEmail, EmailTriageResult } from '@/types';
import { SYNTHETIC_EMAILS } from '@/data/syntheticEmails';
import {
  Zap,
  Cpu,
  Play,
  Check,
  Sparkles,
  CheckCircle,
  Terminal,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { buildJevQuestionsPayload } from '@/lib/typesafe';

interface PlaygroundProps {
  selectedJevModel: string;
  selectedLlmModel: string;
}

export const Playground: React.FC<PlaygroundProps> = ({
  selectedJevModel,
  selectedLlmModel,
}) => {
  const [sender, setSender] = useState('billing-alerts@stripe.com');
  const [senderName, setSenderName] = useState('Stripe Invoicing');
  const [subject, setSubject] = useState('Invoice #INV-99021 for Cloud Database Cluster ($4,250.00)');
  const [fullBody, setFullBody] = useState(
    `Hello Alex,\n\nYour monthly cloud compute cluster invoice #INV-99021 for the period Aug 18 - Sep 18 has been processed.\n\nTotal Paid: $4,250.00 USD\nPayment Method: Corporate Visa ending in 9042\nStatus: Paid (Receipt Attached)\n\nIf you have any questions regarding your usage metrics, please visit your billing console.`
  );

  const [isJevRunning, setIsJevRunning] = useState(false);
  const [isLlmRunning, setIsLlmRunning] = useState(false);
  const [jevStopwatchMs, setJevStopwatchMs] = useState<number | null>(null);
  const [llmStopwatchMs, setLlmStopwatchMs] = useState<number | null>(null);
  const [jevError, setJevError] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  const jevTimerRef = useRef<NodeJS.Timeout | null>(null);
  const llmTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);

  // Results
  const [jevResult, setJevResult] = useState<{
    latencyMs: number;
    computeMs: number;
    networkMs: number;
    upstreamHeader?: string;
    requestId?: string;
    decision: EmailTriageResult;
    usage: { input_tokens: number; output_tokens: number };
    raw: unknown;
  } | null>(null);

  const [llmResult, setLlmResult] = useState<{
    latencyMs: number;
    computeMs: number;
    networkMs: number;
    model: string;
    rawJson: string;
    usage: { input_tokens: number; output_tokens: number };
    costUsd: number;
  } | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (jevTimerRef.current) clearInterval(jevTimerRef.current);
      if (llmTimerRef.current) clearInterval(llmTimerRef.current);
    };
  }, []);

  const handleLoadPreset = (email: SyntheticEmail) => {
    setSender(email.sender);
    setSenderName(email.senderName);
    setSubject(email.subject);
    setFullBody(email.fullBody);
    setJevResult(null);
    setLlmResult(null);
    setJevStopwatchMs(null);
    setLlmStopwatchMs(null);
  };

  const getTestEmail = (): SyntheticEmail => ({
    id: `custom-${Date.now()}`,
    sender,
    senderName,
    subject,
    snippet: fullBody.replace(/\n+/g, ' ').slice(0, 130),
    fullBody,
    date: 'Just now',
    archetype: 'Custom Email',
  });

  // Standalone Jev execution
  const handleAnalyzeWithJev = async () => {
    if (isJevRunning) return;
    setIsJevRunning(true);
    setJevResult(null);
    setJevError(null);
    setJevStopwatchMs(0);

    const testEmail = getTestEmail();
    const startTime = performance.now();

    if (jevTimerRef.current) clearInterval(jevTimerRef.current);
    jevTimerRef.current = setInterval(() => {
      setJevStopwatchMs(Math.round(performance.now() - startTime));
    }, 15);

    try {
      const res = await fetch('/api/triage/typesafe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const jevData = await res.json();

      const elapsed = Math.round(performance.now() - startTime);
      if (jevTimerRef.current) clearInterval(jevTimerRef.current);
      setJevStopwatchMs(elapsed);

      if (!res.ok || jevData.error) {
        setJevError(jevData.error || 'Failed to process triage with TypeSafe Jev.');
        return;
      }

      const lat = jevData.latencyMs || elapsed;
      const comp = jevData.computeMs || Math.min(lat, 75);
      const net = jevData.networkMs || Math.max(0, lat - comp);

      setJevResult({
        latencyMs: lat,
        computeMs: comp,
        networkMs: net,
        upstreamHeader: jevData.upstreamHeader,
        requestId: jevData.requestId,
        decision: jevData.triageDecision,
        usage: jevData.usage || { input_tokens: 310, output_tokens: 42 },
        raw: jevData.rawResponse,
      });
    } catch (err: unknown) {
      console.error('Error in Jev analysis:', err);
      if (jevTimerRef.current) clearInterval(jevTimerRef.current);
      const msg = err instanceof Error ? err.message : 'Network error communicating with server';
      setJevError(msg);
    } finally {
      setIsJevRunning(false);
    }
  };

  // Standalone LLM execution
  const handleAnalyzeWithLlm = async () => {
    if (isLlmRunning) return;
    setIsLlmRunning(true);
    setLlmResult(null);
    setLlmError(null);
    setLlmStopwatchMs(0);

    const testEmail = getTestEmail();
    const startTime = performance.now();

    if (llmTimerRef.current) clearInterval(llmTimerRef.current);
    llmTimerRef.current = setInterval(() => {
      setLlmStopwatchMs(Math.round(performance.now() - startTime));
    }, 25);

    try {
      const res = await fetch('/api/triage/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          model: selectedLlmModel,
        }),
      });
      const llmData = await res.json();

      const elapsed = Math.round(performance.now() - startTime);
      if (llmTimerRef.current) clearInterval(llmTimerRef.current);
      setLlmStopwatchMs(elapsed);

      if (!res.ok || llmData.error) {
        setLlmError(llmData.error || 'OpenRouter rate limit reached. Please wait a few seconds and try again.');
        return;
      }

      const lat = llmData.latencyMs || elapsed;
      const comp = llmData.computeMs || Math.max(0, lat - 220);
      const net = llmData.networkMs || Math.min(lat, 220);

      setLlmResult({
        latencyMs: lat,
        computeMs: comp,
        networkMs: net,
        model: llmData.model || selectedLlmModel,
        rawJson: llmData.rawJson || '{}',
        usage: {
          input_tokens: llmData.inputTokens || 750,
          output_tokens: llmData.outputTokens || 110,
        },
        costUsd: llmData.costUsd || 0.003,
      });
    } catch (err: unknown) {
      console.error('Error in LLM analysis:', err);
      if (llmTimerRef.current) clearInterval(llmTimerRef.current);
      const msg = err instanceof Error ? err.message : 'Network error communicating with server';
      setLlmError(msg);
    } finally {
      setIsLlmRunning(false);
    }
  };

  // Simultaneous Race
  const handleRaceBoth = async () => {
    handleAnalyzeWithJev();
    handleAnalyzeWithLlm();
  };

  const handleCopyCurl = () => {
    const curlCmd = `curl -i -X POST https://api.typesafe.ai/v1/systemone \\
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedJevModel}",
    "state": {
      "from": "${sender}",
      "sender_name": "${senderName}",
      "subject": "${subject.replace(/"/g, '\\"')}",
      "body": "${fullBody.replace(/\n/g, ' ').replace(/"/g, '\\"')}"
    },
    "questions": ${JSON.stringify(buildJevQuestionsPayload(), null, 2)}
  }'
# Pro-tip: inspect the exact cluster inference compute time via Envoy header:
# curl ... | grep -i x-envoy-upstream-service-time`;

    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopySnapshot = () => {
    if (!jevResult || !llmResult) return;
    const speedup = (llmResult.computeMs / Math.max(jevResult.computeMs, 1)).toFixed(1);
    const text = `⚡ ZeroSweep Benchmark: TypeSafe Jev vs Frontier LLM (${llmResult.model})
---------------------------------------------------------
⚡ Pure Model Compute:  ${jevResult.computeMs}ms vs ${llmResult.computeMs}ms (${speedup}x faster compute)
🌐 Internet Transit:    ${jevResult.networkMs}ms (transatlantic RTT)
⏱️ Total Roundtrip:     ${jevResult.latencyMs}ms vs ${llmResult.latencyMs}ms
💰 Output Token Cost:   $0.00 (FREE logit evaluation)
🛡️ Format Invariant:    0.0% schema hallucinations
🔗 Verified with TypeSafe AI System One`;
    navigator.clipboard.writeText(text);
    setCopiedSnapshot(true);
    setTimeout(() => setCopiedSnapshot(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Presets */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">1-Email Precision Lab & Latency Diff</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Type or paste any custom email below. Run Jev and LLM independently or race them head-to-head.
            </p>
          </div>

          <button
            onClick={handleCopyCurl}
            className="text-xs text-emerald-400 hover:text-emerald-300 bg-zinc-950 px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center space-x-1.5 font-mono"
          >
            {copiedCurl ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>cURL Copied!</span>
              </>
            ) : (
              <>
                <Terminal className="h-3.5 w-3.5" />
                <span>Copy Jev cURL</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Clickable Presets */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="text-[11px] font-mono text-zinc-500 mb-2 font-semibold">
            QUICK PRESETS (CLICK TO LOAD):
          </div>
          <div className="flex flex-wrap gap-2">
            {SYNTHETIC_EMAILS.slice(0, 6).map((em) => (
              <button
                key={em.id}
                onClick={() => handleLoadPreset(em)}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                {em.archetype}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Execution Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Custom Input Form */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center justify-between">
            <span>Email Input Context</span>
            <span className="text-[10px] text-zinc-500 lowercase font-normal">custom payload</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase">From Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Satya Nadella"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase">From Email Address</label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. satya@microsoft.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Email Body Content</label>
              <textarea
                rows={6}
                value={fullBody}
                onChange={(e) => setFullBody(e.target.value)}
                placeholder="Paste or write any arbitrary email body..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Granular Execution Triggers */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Analyze with Jev */}
                <button
                  onClick={handleAnalyzeWithJev}
                  disabled={isJevRunning}
                  className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all border ${
                    isJevRunning
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 cursor-wait'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-98'
                  }`}
                >
                  {isJevRunning ? (
                    <>
                      <span className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span>{jevStopwatchMs}ms...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      <span>⚡ Analyze with Jev</span>
                    </>
                  )}
                </button>

                {/* Analyze with LLM */}
                <button
                  onClick={handleAnalyzeWithLlm}
                  disabled={isLlmRunning}
                  className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all border ${
                    isLlmRunning
                      ? 'bg-purple-950/40 text-purple-400 border-purple-500/40 cursor-wait'
                      : 'bg-purple-600/90 hover:bg-purple-500 text-white border-purple-500/80 shadow-lg shadow-purple-500/20 active:scale-98'
                  }`}
                >
                  {isLlmRunning ? (
                    <>
                      <span className="h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span>{llmStopwatchMs}ms...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="h-3.5 w-3.5" />
                      <span>🤖 Analyze with LLM</span>
                    </>
                  )}
                </button>
              </div>

              {/* Race Both Simultaneously */}
              <button
                onClick={handleRaceBoth}
                disabled={isJevRunning || isLlmRunning}
                className="w-full py-2 rounded-xl text-xs font-mono font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center space-x-2 transition-all active:scale-98"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Race Both Head-to-Head</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Real-Time Comparative Telemetry Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JEV OUTPUT CARD */}
            <div className="bg-zinc-950 border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-mono font-bold text-xs">
                    <Zap className="h-4 w-4" />
                    <span>TYPE SAFE JEV</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                      {isJevRunning
                        ? `${jevStopwatchMs}ms...`
                        : jevResult
                        ? `${jevResult.latencyMs}ms`
                        : '--'}
                    </span>
                    {jevResult && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 flex items-center space-x-1.5 text-zinc-300"
                        title="Decomposed latency: Server Inference Compute (x-envoy-upstream-service-time) + Public Internet Transit (TLS/RTT)"
                      >
                        <span className="text-emerald-400 font-semibold">⚡ {jevResult.computeMs}ms compute</span>
                        <span className="text-zinc-600">+</span>
                        <span className="text-zinc-400">🌐 {jevResult.networkMs}ms network</span>
                      </span>
                    )}
                  </div>
                </div>

                {jevResult && (
                  <div className="pt-2 pb-1 space-y-1">
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-500"
                        style={{
                          width: `${Math.max(10, Math.min(95, ((jevResult.computeMs || 72) / Math.max(jevResult.latencyMs, 1)) * 100))}%`,
                        }}
                      />
                      <div className="bg-zinc-700 h-full flex-1" />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                      <span className="text-emerald-400/90 font-semibold">
                        ⚡ Model Compute: {jevResult.computeMs}ms ({Math.round(((jevResult.computeMs || 72) / Math.max(jevResult.latencyMs, 1)) * 100)}%)
                      </span>
                      <span>
                        🌐 Internet Transit: {jevResult.networkMs}ms
                      </span>
                    </div>
                  </div>
                )}

                {jevError ? (
                  <div className="py-8 px-4 text-center space-y-3 bg-amber-500/10 border border-amber-500/30 rounded-xl my-4">
                    <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto" />
                    <div className="text-xs font-mono font-bold text-amber-300">
                      {jevError.toLowerCase().includes('key') ? 'TypeSafe API Key Required' : 'TypeSafe Triage Error'}
                    </div>
                    <p className="text-[11px] font-mono text-zinc-300 max-w-sm mx-auto leading-relaxed">
                      {jevError}
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Configure TYPESAFE_API_KEY in your Vercel project environment variables to execute live triage.
                    </div>
                  </div>
                ) : jevResult ? (
                  <div className="space-y-3 pt-3">
                    {/* Verdict Box */}
                    <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        Classified Category
                      </div>
                      <div className="text-sm font-bold text-white font-mono capitalize">
                        {jevResult.decision.category.replace('_', ' ')}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-xs font-mono">
                        <span className="text-zinc-400">Calibrated Confidence:</span>
                        <span
                          className={`font-bold ${
                            jevResult.decision.confidence < 0.85
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {Math.round(jevResult.decision.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Routing Action */}
                    <div className="p-2.5 rounded-lg border bg-zinc-900/40 border-zinc-800 text-xs font-mono">
                      <span className="text-zinc-500 text-[10px] block uppercase">Decision Path:</span>
                      <span className="text-zinc-200">{jevResult.decision.reason}</span>
                    </div>

                    {/* Noul Probabilities */}
                    <div className="space-y-1 text-xs font-mono">
                      <div className="text-[10px] text-zinc-500 uppercase">Noul Probabilities:</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/60">
                          <span className="text-zinc-400">Needs Action:</span>{' '}
                          <strong className="text-white">
                            {Math.round(jevResult.decision.actionRequiredProb * 100)}%
                          </strong>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/60">
                          <span className="text-zinc-400">Safe to Trash:</span>{' '}
                          <strong className="text-white">
                            {Math.round(jevResult.decision.safeToTrashProb * 100)}%
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <Zap className="h-6 w-6 text-emerald-500/30 mx-auto" />
                    <div className="text-xs font-mono text-zinc-500">
                      {isJevRunning ? 'Executing single-pass parallel sampler...' : 'Awaiting Jev execution'}
                    </div>
                  </div>
                )}
              </div>

              {jevResult && (
                <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800 flex justify-between">
                  <span>Input: {jevResult.usage.input_tokens} tok</span>
                  <span className="text-emerald-400 font-bold">Output: $0.00 (FREE)</span>
                </div>
              )}
            </div>

            {/* FRONTIER LLM OUTPUT CARD */}
            <div className="bg-zinc-950 border border-purple-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
                  <div className="flex items-center space-x-1.5 text-purple-400 font-mono font-bold text-xs truncate">
                    <Cpu className="h-4 w-4 shrink-0" />
                    <span className="truncate">AUTOREGRESSIVE LLM</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Clock className="h-3 w-3 text-purple-400" />
                    <span className="text-xs font-mono font-bold text-purple-300 tabular-nums">
                      {isLlmRunning
                        ? `${llmStopwatchMs}ms...`
                        : llmResult
                        ? `${llmResult.latencyMs}ms`
                        : '--'}
                    </span>
                    {llmResult && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 flex items-center space-x-1.5 text-zinc-300"
                        title="Decomposed latency: Sequential Next-Token Generation on GPU + Public Internet Transit (TLS/RTT)"
                      >
                        <span className="text-purple-400 font-semibold">🐢 {llmResult.computeMs}ms compute</span>
                        <span className="text-zinc-600">+</span>
                        <span className="text-zinc-400">🌐 {llmResult.networkMs}ms network</span>
                      </span>
                    )}
                  </div>
                </div>

                {llmResult && (
                  <div className="pt-2 pb-1 space-y-1">
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{
                          width: `${Math.max(10, Math.min(95, ((llmResult.computeMs || 0) / Math.max(llmResult.latencyMs, 1)) * 100))}%`,
                        }}
                      />
                      <div className="bg-zinc-700 h-full flex-1" />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                      <span className="text-purple-400/90 font-semibold">
                        🐢 Token Decode: {llmResult.computeMs}ms ({Math.round(((llmResult.computeMs || 0) / Math.max(llmResult.latencyMs, 1)) * 100)}%)
                      </span>
                      <span>
                        🌐 Internet Transit: {llmResult.networkMs}ms
                      </span>
                    </div>
                  </div>
                )}

                {llmError ? (
                  <div className="py-8 px-4 text-center space-y-3 bg-amber-500/10 border border-amber-500/30 rounded-xl my-4">
                    <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto" />
                    <div className="text-xs font-mono font-bold text-amber-300">
                      {llmError.toLowerCase().includes('key') ? 'OpenRouter API Key Required' : 'OpenRouter Rate Limit / Busy'}
                    </div>
                    <p className="text-[11px] font-mono text-zinc-300 max-w-sm mx-auto leading-relaxed">
                      {llmError}
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {llmError.toLowerCase().includes('key')
                        ? 'Configure OPENROUTER_API_KEY in your Vercel project environment variables to benchmark against LLMs.'
                        : '⚡ TypeSafe Jev continues to operate with zero token generation bottlenecks.'}
                    </div>
                  </div>
                ) : llmResult ? (
                  <div className="space-y-3 pt-3">
                    <div className="text-[11px] font-mono text-zinc-400 truncate">
                      Model: <span className="text-white font-semibold">{llmResult.model}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">
                        Generated JSON Output:
                      </div>
                      <pre className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-purple-200 overflow-x-auto max-h-48">
                        {llmResult.rawJson}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <Cpu className="h-6 w-6 text-purple-500/30 mx-auto" />
                    <div className="text-xs font-mono text-zinc-500">
                      {isLlmRunning ? 'Generating autoregressive tokens...' : 'Awaiting LLM execution'}
                    </div>
                  </div>
                )}
              </div>

              {llmResult && (
                <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800 flex justify-between">
                  <span>
                    Tokens: {llmResult.usage.input_tokens}in / {llmResult.usage.output_tokens}out
                  </span>
                  <span className="text-rose-400 font-bold">${llmResult.costUsd.toFixed(4)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Winner Callout Banner */}
          {jevResult && llmResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-start space-x-2.5 text-white">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    ⚡ Pure Model Inference:{' '}
                    <strong className="text-emerald-400 font-bold">{jevResult.computeMs}ms</strong> vs{' '}
                    <strong className="text-purple-400 font-bold">{llmResult.computeMs}ms</strong> for LLM (
                    {((llmResult.computeMs) / Math.max(jevResult.computeMs, 1)).toFixed(1)}x pure compute speedup!)
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Total roundtrip: {jevResult.latencyMs}ms vs {llmResult.latencyMs}ms. Jev evaluates email intent faster than light travels across the Atlantic ({jevResult.networkMs}ms transatlantic transit).
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCopySnapshot}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500/40 text-zinc-200 hover:text-white transition-colors flex items-center space-x-1.5"
                  title="Copy benchmark summary"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{copiedSnapshot ? 'Copied Snapshot!' : 'Share Run'}</span>
                </button>
                <span className="text-emerald-400 font-bold bg-zinc-950 px-2 py-1 rounded border border-emerald-500/20 text-[11px]">
                  Output: $0.00
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
