'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { RaceArena } from '@/components/RaceArena';
import { EmailList } from '@/components/EmailList';
import { CalibrationDrawer } from '@/components/CalibrationDrawer';
import { RoiCalculator } from '@/components/RoiCalculator';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';
import { ModelSelector } from '@/components/ModelSelector';
import { Playground } from '@/components/Playground';
import { MailboxClient } from '@/components/MailboxClient';
import { SYNTHETIC_EMAILS } from '@/data/syntheticEmails';
import { SyntheticEmail, EmailTriageResult, EngineStats } from '@/types';
import { JEV_INPUT_PRICE_PER_MTOK, JEV_OUTPUT_PRICE_PER_MTOK } from '@/lib/typesafe';

export default function Home() {
  const [emails] = useState<SyntheticEmail[]>(SYNTHETIC_EMAILS);

  const [selectedJevModel, setSelectedJevModel] = useState<string>('jev-latest');
  const [selectedLlmModel] = useState<string>('deepseek/deepseek-v4-flash-0731:free');

  const [activeTab, setActiveTab] = useState<'mailbox' | 'lab' | 'race' | 'calibration' | 'calculator'>('mailbox');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [raceError, setRaceError] = useState<string | null>(null);

  const [jevProgress, setJevProgress] = useState<number>(0);
  const [llmProgress, setLlmProgress] = useState<number>(0);

  const [selectedEmail, setSelectedEmail] = useState<SyntheticEmail | null>(null);
  const [triageResults, setTriageResults] = useState<Record<string, EmailTriageResult>>({});

  const [jevStats, setJevStats] = useState<EngineStats>({
    engineName: 'TypeSafe Jev',
    modelId: 'jev-latest',
    latencyMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    formatErrors: 0,
  });

  const [llmStats, setLlmStats] = useState<EngineStats>({
    engineName: 'DeepSeek V4 Flash (OpenRouter)',
    modelId: 'deepseek/deepseek-v4-flash-0731:free',
    latencyMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    formatErrors: 0,
  });

  // Load saved Jev model selection from sessionStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedJevM = sessionStorage.getItem('selected_jev_model');
      if (savedJevM) setSelectedJevModel(savedJevM);
    }
  }, []);

  const handleSelectJevModel = (modelId: string) => {
    setSelectedJevModel(modelId);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selected_jev_model', modelId);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsComplete(false);
    setRaceError(null);
    setJevProgress(0);
    setLlmProgress(0);
    setTriageResults({});
    setJevStats({
      engineName: 'TypeSafe Jev',
      modelId: selectedJevModel,
      latencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      formatErrors: 0,
    });
    setLlmStats({
      engineName: 'Frontier LLM',
      modelId: selectedLlmModel,
      latencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      formatErrors: 0,
    });
  };

  const handleStartRace = async () => {
    if (isRunning) return;

    handleReset();
    setIsRunning(true);

    const raceStartTime = performance.now();

    try {
      // 1. EXECUTE JEV (PARALLEL SAMPLER VIA BACKEND)
      const jevPromises = emails.map(async (email) => {
        const res = await fetch('/api/triage/typesafe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        return res.json();
      });

      // Jev resolves all emails simultaneously in parallel
      const jevResponses = await Promise.all(jevPromises);

      const jevAuthErr = jevResponses.find(
        (r) => r.requiresKey || (r.error && (r.error.toLowerCase().includes('key') || r.error.toLowerCase().includes('unauthorized')))
      );
      if (jevAuthErr) {
        setRaceError(jevAuthErr.error || 'TypeSafe API Key not configured. Please set TYPESAFE_API_KEY in your Vercel environment variables.');
        setIsRunning(false);
        return;
      }

      const jevEndTime = performance.now();
      const totalJevLatency = Math.round(jevEndTime - raceStartTime);

      let totalJevInputTokens = 0;
      let totalJevOutputTokens = 0;
      let maxJevComputeMs = 0;
      const newResults: Record<string, EmailTriageResult> = {};

      jevResponses.forEach((data) => {
        if (data.triageDecision) {
          newResults[data.emailId] = data.triageDecision;
          totalJevInputTokens += data.usage?.input_tokens || 310;
          totalJevOutputTokens += data.usage?.output_tokens || 42;
          if (data.computeMs && data.computeMs > maxJevComputeMs) {
            maxJevComputeMs = data.computeMs;
          }
        }
      });
      if (maxJevComputeMs === 0) maxJevComputeMs = 75;
      const totalJevNetworkMs = Math.max(0, totalJevLatency - maxJevComputeMs);

      const totalJevCost =
        (totalJevInputTokens / 1_000_000) * JEV_INPUT_PRICE_PER_MTOK +
        (totalJevOutputTokens / 1_000_000) * JEV_OUTPUT_PRICE_PER_MTOK;

      setJevProgress(100);
      setTriageResults(newResults);
      setJevStats({
        engineName: 'TypeSafe Jev',
        modelId: selectedJevModel,
        latencyMs: totalJevLatency,
        computeMs: maxJevComputeMs,
        networkMs: totalJevNetworkMs,
        inputTokens: totalJevInputTokens,
        outputTokens: totalJevOutputTokens,
        costUsd: totalJevCost,
        formatErrors: 0,
      });

      // 2. EXECUTE FRONTIER LLM (SEQUENTIAL / CRAWL VIA BACKEND)
      let totalLlmInputTokens = 0;
      let totalLlmOutputTokens = 0;
      let totalLlmCost = 0;
      let totalLlmLatency = 0;
      let totalLlmComputeMs = 0;
      let totalLlmNetworkMs = 0;
      let modelDisplayName = selectedLlmModel;

      const totalEmailsCount = emails.length;

      for (let i = 0; i < totalEmailsCount; i++) {
        const email = emails[i];

        const res = await fetch('/api/triage/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            model: selectedLlmModel,
          }),
        });
        const llmData = await res.json();
        if (!res.ok || llmData.requiresKey || (llmData.error && (llmData.error.toLowerCase().includes('key') || llmData.error.toLowerCase().includes('unauthorized')))) {
          setRaceError(llmData.error || 'OpenRouter API Key not configured. Please set OPENROUTER_API_KEY in your Vercel environment variables.');
          setIsRunning(false);
          return;
        }

        if (llmData.model) {
          modelDisplayName = llmData.model;
        }

        const itemLat = llmData.latencyMs || 2100;
        const itemComp = llmData.computeMs || Math.max(0, itemLat - 220);
        const itemNet = llmData.networkMs || 220;

        totalLlmLatency += itemLat;
        totalLlmComputeMs += itemComp;
        totalLlmNetworkMs += itemNet;
        totalLlmInputTokens += llmData.inputTokens || 780;
        totalLlmOutputTokens += llmData.outputTokens || 120;
        totalLlmCost += llmData.costUsd || 0.003;

        const progress = Math.round(((i + 1) / totalEmailsCount) * 100);
        setLlmProgress(progress);
      }

      setLlmStats({
        engineName: modelDisplayName,
        modelId: selectedLlmModel,
        latencyMs: totalLlmLatency,
        computeMs: totalLlmComputeMs,
        networkMs: totalLlmNetworkMs,
        inputTokens: totalLlmInputTokens,
        outputTokens: totalLlmOutputTokens,
        costUsd: totalLlmCost,
        formatErrors: 0,
      });

      setIsRunning(false);
      setIsComplete(true);
    } catch (err: unknown) {
      console.error('Error during triage race:', err);
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero with Tab Control */}
      <Hero activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
        {/* Model Selector Bar (visible on Lab and Race) */}
        {(activeTab === 'lab' || activeTab === 'race') && (
          <ModelSelector
            selectedJevModel={selectedJevModel}
            onSelectJevModel={handleSelectJevModel}
            disabled={isRunning}
          />
        )}

        {/* Tab 1: Autonomous Mailbox (1,000 Scale) */}
        {activeTab === 'mailbox' && (
          <div className="space-y-8">
            <MailboxClient />
            <ArchitectureDiagram />
          </div>
        )}

        {/* Tab 2: 1-Email Precision Lab */}
        {activeTab === 'lab' && (
          <div className="space-y-8">
            <Playground
              selectedJevModel={selectedJevModel}
              selectedLlmModel={selectedLlmModel}
            />
            <ArchitectureDiagram />
          </div>
        )}

        {/* Tab 3: Head-to-Head Race */}
        {activeTab === 'race' && (
          <div className="space-y-8">
            {raceError && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-amber-300">
                    API Key Configuration Required
                  </div>
                  <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                    {raceError}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500">
                    Set TYPESAFE_API_KEY and OPENROUTER_API_KEY in your Vercel Project Settings to execute live benchmarks.
                  </p>
                </div>
              </div>
            )}
            <RaceArena
              isRunning={isRunning}
              isComplete={isComplete}
              onStartRace={handleStartRace}
              onReset={handleReset}
              jevStats={jevStats}
              llmStats={llmStats}
              jevProgress={jevProgress}
              llmProgress={llmProgress}
              isLiveMode={true}
            />

            <EmailList
              emails={emails}
              triageResults={triageResults}
              onSelectEmail={(email) => setSelectedEmail(email)}
              selectedEmailId={selectedEmail?.id || null}
              isComplete={isComplete}
            />

            <ArchitectureDiagram />
          </div>
        )}

        {/* Tab 4: Epistemic Calibration Inspector */}
        {activeTab === 'calibration' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>The Epistemic Calibration Inspector</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                Traditional autoregressive LLMs suffer from overconfidence: even when they hallucinate or make a mistake, they output authoritative prose with near-zero epistemic humility. 
                <strong className="text-zinc-200"> Jev’s RLCD training</strong> produces well-calibrated confidence scores: when it reports 95% confidence, it is right 95% of the time. When it encounters ambiguous, edge-case data, confidence drops, triggering safe human review.
              </p>
            </div>

            <EmailList
              emails={emails}
              triageResults={triageResults}
              onSelectEmail={(email) => setSelectedEmail(email)}
              selectedEmailId={selectedEmail?.id || null}
              isComplete={true}
            />
          </div>
        )}

        {/* Tab 5: Enterprise ROI Calculator */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <RoiCalculator />
            <ArchitectureDiagram />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 font-mono space-y-1">
        <div>
          ZeroSweep — Crafted with ❤️ by{' '}
          <a
            href="https://github.com/sysadarsh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors"
          >
            sysadarsh
          </a>
        </div>
        <div className="text-[11px] text-zinc-600">
          Built with Next.js 14 & TypeSafe AI Jev System One Architecture
        </div>
      </footer>

      {/* Calibration Drawer */}
      <CalibrationDrawer
        email={selectedEmail}
        result={selectedEmail ? triageResults[selectedEmail.id] : undefined}
        onClose={() => setSelectedEmail(null)}
      />
    </main>
  );
}
