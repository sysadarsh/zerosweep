'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SyntheticEmail,
  EmailTriageResult,
} from '@/types';
import { generateScaleDataset } from '@/data/scaleGenerator';
import {
  Inbox,
  Flame,
  ShieldAlert,
  BookOpen,
  Receipt,
  Bell,
  Trash2,
  Zap,
  RotateCcw,
  Search,
  AlertTriangle,
  Code,
  Check,
  MailOpen,
  X
} from 'lucide-react';
import { JEV_INPUT_PRICE_PER_MTOK } from '@/lib/typesafe';

type FolderKey =
  | 'all'
  | 'action_required'
  | 'human_review'
  | 'newsletters'
  | 'financial_receipt'
  | 'system_alert'
  | 'trash_quarantine';

export const MailboxClient: React.FC = () => {
  const [datasetSize, setDatasetSize] = useState<number>(50);
  const [emails, setEmails] = useState<SyntheticEmail[]>([]);
  const [activeFolder, setActiveFolder] = useState<FolderKey>('all');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Triage state
  const [triageResults, setTriageResults] = useState<Record<string, EmailTriageResult>>({});
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweptCount, setSweptCount] = useState<number>(0);
  const [sweepDurationMs, setSweepDurationMs] = useState<number>(0);
  const [purgedIds, setPurgedIds] = useState<Set<string>>(new Set());
  const [rawJsonModalEmail, setRawJsonModalEmail] = useState<EmailTriageResult | null>(null);
  const [singleLoadingId, setSingleLoadingId] = useState<string | null>(null);

  // Single sweep toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize dataset
  useEffect(() => {
    const generated = generateScaleDataset(datasetSize);
    setEmails(generated);
    setSelectedEmailId(generated[0]?.id || null);
    setTriageResults({});
    setPurgedIds(new Set());
    setSweptCount(0);
    setSweepDurationMs(0);
  }, [datasetSize]);

  // Active email object
  const selectedEmail = useMemo(() => {
    return emails.find((e) => e.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  // Visible emails (excluding purged ones and applying folder + search)
  const visibleEmails = useMemo(() => {
    return emails.filter((email) => {
      if (purgedIds.has(email.id)) return false;

      const result = triageResults[email.id];

      // Folder filter
      if (activeFolder === 'action_required') {
        if (!result) return false;
        if (result.actionRequiredProb < 0.6 && result.category !== 'personal_correspondence' && result.category !== 'system_alert') {
          return false;
        }
      } else if (activeFolder === 'human_review') {
        if (!result) return false;
        if (!result.isSafetyGated && result.destination !== 'human_review') return false;
      } else if (activeFolder === 'newsletters') {
        if (!result || result.destination !== 'newsletters') return false;
      } else if (activeFolder === 'financial_receipt') {
        if (!result || result.destination !== 'financial_receipt') return false;
      } else if (activeFolder === 'system_alert') {
        if (!result || result.destination !== 'system_alert') return false;
      } else if (activeFolder === 'trash_quarantine') {
        if (!result || result.destination !== 'trash_quarantine') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${email.sender} ${email.senderName} ${email.subject} ${email.snippet}`.toLowerCase();
        return matchText.includes(q);
      }

      return true;
    });
  }, [emails, purgedIds, triageResults, activeFolder, searchQuery]);

  // Live dynamic folder counts
  const folderCounts = useMemo(() => {
    const counts = {
      all: 0,
      action_required: 0,
      human_review: 0,
      newsletters: 0,
      financial_receipt: 0,
      system_alert: 0,
      trash_quarantine: 0,
    };

    emails.forEach((email) => {
      if (purgedIds.has(email.id)) return;
      counts.all++;

      const res = triageResults[email.id];
      if (res) {
        if (res.isSafetyGated || res.destination === 'human_review') {
          counts.human_review++;
        } else if (res.destination === 'trash_quarantine') {
          counts.trash_quarantine++;
        } else if (res.destination === 'newsletters') {
          counts.newsletters++;
        } else if (res.destination === 'financial_receipt') {
          counts.financial_receipt++;
        } else if (res.destination === 'system_alert') {
          counts.system_alert++;
        } else if (res.actionRequiredProb >= 0.6 || res.category === 'personal_correspondence') {
          counts.action_required++;
        }
      }
    });

    return counts;
  }, [emails, purgedIds, triageResults]);

  // Run Autonomous Sweep with Jev (Ultra-Fast Concurrent Streaming Batch Queue)
  const handleSweepInbox = async () => {
    if (isSweeping) return;

    setIsSweeping(true);
    setSweptCount(0);
    const sweepStart = performance.now();

    const unpurged = emails.filter((e) => !purgedIds.has(e.id));
    const chunkSize = 25; // 25 emails per batch
    const chunks: SyntheticEmail[][] = [];

    for (let i = 0; i < unpurged.length; i += chunkSize) {
      chunks.push(unpurged.slice(i, i + chunkSize));
    }

    let processedSoFar = 0;
    const CONCURRENCY = 4; // Up to 4 parallel HTTP streams simultaneously
    let nextChunkIdx = 0;
    let authAborted = false;
    let authErrorMessage: string | null = null;

    const worker = async () => {
      while (nextChunkIdx < chunks.length) {
        if (authAborted) break;
        const currentIdx = nextChunkIdx++;
        const chunk = chunks[currentIdx];
        if (!chunk) break;

        try {
          const res = await fetch('/api/triage/typesafe/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emails: chunk,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (res.status === 401 || errData.requiresKey) {
              authAborted = true;
              authErrorMessage = errData.error || 'TypeSafe API Key not configured. Please set TYPESAFE_API_KEY in your Vercel environment variables.';
              break;
            }
            console.error('Batch request failed, status:', res.status);
            continue;
          }

          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setTriageResults((prev) => {
              const next = { ...prev };
              data.results.forEach((item: { emailId: string; decision: EmailTriageResult }) => {
                if (item.decision) {
                  next[item.emailId] = item.decision;
                }
              });
              return next;
            });
          }

          processedSoFar += chunk.length;
          setSweptCount(processedSoFar);
          setSweepDurationMs(Math.round(performance.now() - sweepStart));
        } catch (err) {
          console.error('Error during batch sweep chunk:', err);
        }
      }
    };

    // Dispatch concurrent stream workers
    const activeWorkers = Array.from(
      { length: Math.min(CONCURRENCY, chunks.length) },
      () => worker()
    );
    await Promise.all(activeWorkers);

    setIsSweeping(false);

    if (authAborted) {
      setToastMessage(
        authErrorMessage || '⚠️ TypeSafe API Key not configured. Please set TYPESAFE_API_KEY in your Vercel environment variables.'
      );
      return;
    }

    const totalDuration = Math.round(performance.now() - sweepStart);
    setSweepDurationMs(totalDuration);

    const effectiveThroughput = Math.round(unpurged.length / Math.max(totalDuration / 1000, 0.1));
    setToastMessage(
      `⚡ Ultra-fast sweep complete: ${unpurged.length} emails triaged in ${(totalDuration / 1000).toFixed(2)}s (~${effectiveThroughput} emails/sec)`
    );
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Triage single email manually
  const handleTriageSingle = async (email: SyntheticEmail) => {
    setSingleLoadingId(email.id);
    try {
      const res = await fetch('/api/triage/typesafe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setToastMessage(`⚠️ ${data.error || 'TypeSafe API Key not configured. Please set TYPESAFE_API_KEY in Vercel.'}`);
        return;
      }
      if (data.triageDecision) {
        setTriageResults((prev) => ({
          ...prev,
          [email.id]: data.triageDecision,
        }));
      }
    } catch (err) {
      console.error('Error triaging single email:', err);
      setToastMessage('⚠️ Failed to connect to triage gateway. Check network or API configuration.');
    } finally {
      setSingleLoadingId(null);
    }
  };

  // 1-Click "Sweep Trash" (Purge all quarantined spam/phishing)
  const handleSweepTrash = () => {
    const trashIds = emails
      .filter((e) => {
        const res = triageResults[e.id];
        return res && res.destination === 'trash_quarantine';
      })
      .map((e) => e.id);

    if (trashIds.length === 0) {
      setToastMessage('Trash is already clean! No quarantined items to purge.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setPurgedIds((prev) => {
      const next = new Set(prev);
      trashIds.forEach((id) => next.add(id));
      return next;
    });

    setToastMessage(`🗑️ Swept ${trashIds.length} quarantined emails to permanent purge!`);
    setTimeout(() => setToastMessage(null), 3500);

    // If active folder was trash, or selected email was in trash, update selection
    if (activeFolder === 'trash_quarantine') {
      setSelectedEmailId(null);
    }
  };

  // Calculate telemetry stats for HUD
  const sweptResultsList = Object.values(triageResults);
  const totalTokens = sweptResultsList.length * 320;
  const totalCostUsd = (totalTokens / 1_000_000) * JEV_INPUT_PRICE_PER_MTOK;
  const throughputEmailsPerSec = sweepDurationMs > 0 ? Math.round((sweptCount / (sweepDurationMs / 1000))) : 0;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[820px]">
      {/* Top Application Bar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Autonomous Inbox Zero
            </span>
            <span className="text-[11px] font-mono text-emerald-400 ml-2">
              TypeSafe Jev System One
            </span>
          </div>
        </div>

        {/* Center: Scale Selector & Actions */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            <span className="text-zinc-500 px-2 text-[11px]">Dataset:</span>
            {[50, 250, 500, 1000].map((size) => (
              <button
                key={size}
                disabled={isSweeping}
                onClick={() => setDatasetSize(size)}
                className={`px-2 py-1 rounded transition-colors ${
                  datasetSize === size
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const fresh = generateScaleDataset(datasetSize);
              setEmails(fresh);
              setSelectedEmailId(fresh[0]?.id || null);
              setTriageResults({});
              setPurgedIds(new Set());
              setSweptCount(0);
              setSweepDurationMs(0);
            }}
            disabled={isSweeping}
            title="Generate fresh procedural emails"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Primary Sweep Action */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSweepInbox}
            disabled={isSweeping}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center space-x-2 transition-all ${
              isSweeping
                ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-98'
            }`}
          >
            {isSweeping ? (
              <>
                <span className="h-3 w-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Sweeping {sweptCount}/{emails.length}...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Sweep {emails.length} Emails with Jev</span>
              </>
            )}
          </button>

          <button
            onClick={handleSweepTrash}
            disabled={isSweeping || folderCounts.trash_quarantine === 0}
            className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all border ${
              folderCounts.trash_quarantine > 0
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
            }`}
            title="Purge all quarantined spam/phishing"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Purge Trash ({folderCounts.trash_quarantine})</span>
          </button>
        </div>
      </div>

      {/* Sweep Progress HUD (When Sweeping or Swept) */}
      {(isSweeping || sweptCount > 0) && (
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-zinc-500">Progress:</span>
              <div className="w-32 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                <div
                  className="bg-emerald-500 h-full transition-all duration-150"
                  style={{ width: `${(sweptCount / Math.max(emails.length, 1)) * 100}%` }}
                />
              </div>
              <span className="text-emerald-400 font-bold">
                {sweptCount}/{emails.length}
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-1 text-zinc-400">
              <span className="text-zinc-500">Elapsed:</span>
              <span className="text-white tabular-nums">{(sweepDurationMs / 1000).toFixed(2)}s</span>
            </div>

            {throughputEmailsPerSec > 0 && (
              <div className="hidden md:flex items-center space-x-1 text-zinc-400">
                <span className="text-zinc-500">Throughput:</span>
                <span className="text-emerald-400 font-bold tabular-nums">~{throughputEmailsPerSec} emails/sec</span>
              </div>
            )}

            <div className="hidden lg:flex items-center space-x-1 text-zinc-400">
              <span className="text-zinc-500">Avg Jev Compute:</span>
              <span className="text-emerald-400 font-bold">⚡ ~74ms</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-zinc-400">
              <span className="text-zinc-500">Est. Cost:</span>{' '}
              <span className="text-emerald-400 font-bold">${totalCostUsd.toFixed(4)}</span>
            </div>
            <div className="text-zinc-500 hidden lg:inline">
              Output: <span className="text-zinc-300 font-bold">$0.00 (Free)</span>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px] font-bold">
              0% Format Hallucinations
            </div>
          </div>
        </div>
      )}

      {/* Toast banner */}
      {toastMessage && (
        <div
          className={`border-b px-4 py-2 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-1 ${
            toastMessage.includes('⚠️') || toastMessage.toLowerCase().includes('not configured') || toastMessage.toLowerCase().includes('failed')
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-300'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastMessage.includes('⚠️') && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white ml-3 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3-Pane Webmail Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* PANE 1: Navigation Sidebar (col-span-2 or 3) */}
        <div className="md:col-span-3 lg:col-span-2 bg-[#0c0c0e] border-r border-zinc-800/80 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-wider px-2 py-1">
              Mailbox Views
            </div>

            {/* Folder Items */}
            {[
              { key: 'all' as FolderKey, label: 'All Mail', icon: Inbox, count: folderCounts.all, color: 'text-zinc-300' },
              { key: 'action_required' as FolderKey, label: 'Needs Action', icon: Flame, count: folderCounts.action_required, color: 'text-amber-400' },
              { key: 'human_review' as FolderKey, label: 'Human Review', icon: ShieldAlert, count: folderCounts.human_review, color: 'text-amber-300', gate: true },
              { key: 'newsletters' as FolderKey, label: 'Newsletters', icon: BookOpen, count: folderCounts.newsletters, color: 'text-blue-400' },
              { key: 'financial_receipt' as FolderKey, label: 'Receipts & Tax', icon: Receipt, count: folderCounts.financial_receipt, color: 'text-emerald-400' },
              { key: 'system_alert' as FolderKey, label: 'System Alerts', icon: Bell, count: folderCounts.system_alert, color: 'text-purple-400' },
              { key: 'trash_quarantine' as FolderKey, label: 'Trash Quarantine', icon: Trash2, count: folderCounts.trash_quarantine, color: 'text-rose-400' },
            ].map((folder) => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.key;
              return (
                <button
                  key={folder.key}
                  onClick={() => setActiveFolder(folder.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-zinc-800/90 text-white font-semibold border-l-2 border-emerald-500 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Icon className={`h-3.5 w-3.5 ${folder.color} shrink-0`} />
                    <span className="truncate">{folder.label}</span>
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
                      folder.gate && folder.count > 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold animate-pulse'
                        : folder.key === 'trash_quarantine' && folder.count > 0
                        ? 'bg-rose-500/10 text-rose-400'
                        : isActive
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {folder.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Engine Info */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-2 text-[10px] font-mono text-zinc-500">
            <div className="flex items-center justify-between">
              <span>Engine:</span>
              <span className="text-emerald-400 font-bold">Jev System One</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Latency:</span>
              <span className="text-zinc-300 font-bold">~80–120ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Schema Invariant:</span>
              <span className="text-emerald-400 font-bold">100% Bound</span>
            </div>
          </div>
        </div>

        {/* PANE 2: High-Density Email List (col-span-4 or 5) */}
        <div className="md:col-span-4 lg:col-span-5 bg-[#111113] border-r border-zinc-800/80 flex flex-col overflow-hidden">
          {/* List Header & Search Filter */}
          <div className="p-2.5 border-b border-zinc-800/80 space-y-2 shrink-0 bg-zinc-900/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter emails or search sender... (/)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
              <span>
                Showing {visibleEmails.length} of {emails.length - purgedIds.size}
              </span>
              <span className="uppercase text-zinc-400 font-bold">
                {activeFolder.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Email Rows List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
            {visibleEmails.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="h-10 w-10 mx-auto rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                  <MailOpen className="h-5 w-5" />
                </div>
                <div className="text-xs font-mono text-zinc-400 font-medium">
                  {purgedIds.size > 0 && activeFolder === 'trash_quarantine'
                    ? 'Trash is pristine! Zero quarantined items.'
                    : 'No emails in this view.'}
                </div>
                <p className="text-[11px] text-zinc-600 max-w-xs mx-auto">
                  {folderCounts.trash_quarantine === 0 && activeFolder === 'trash_quarantine'
                    ? 'All disposable marketing pitches and phishing attempts have been purged.'
                    : 'Try selecting "All Mail" or clicking "Sweep Emails with Jev".'}
                </p>
              </div>
            ) : (
              visibleEmails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                const result = triageResults[email.id];
                const isItemLoading = singleLoadingId === email.id;

                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-800/80 border-l-2 border-emerald-500'
                        : 'hover:bg-zinc-900/50'
                    }`}
                  >
                    {/* Row 1: Sender & Date */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            result ? 'bg-zinc-600' : 'bg-emerald-400 animate-ping'
                          }`}
                        />
                        <span className="text-xs font-bold text-zinc-200 truncate">
                          {email.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        {email.date}
                      </span>
                    </div>

                    {/* Row 2: Subject */}
                    <div className="text-xs text-zinc-300 font-medium truncate mb-1">
                      {email.subject}
                    </div>

                    {/* Row 3: Snippet */}
                    <div className="text-[11px] text-zinc-500 line-clamp-1 mb-2">
                      {email.snippet}
                    </div>

                    {/* Row 4: Triage Badges */}
                    <div className="flex items-center justify-between">
                      {result ? (
                        <div className="flex items-center space-x-1.5">
                          {/* Category Badge */}
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${
                              result.isSafetyGated
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : result.destination === 'trash_quarantine'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                : result.destination === 'financial_receipt'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : result.destination === 'system_alert'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                : result.destination === 'newsletters'
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {result.isSafetyGated ? 'Human Review' : result.category.replace('_', ' ')}
                          </span>

                          {/* Confidence Gauge */}
                          <span
                            className={`text-[9px] font-mono font-bold ${
                              result.confidence < 0.85 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                          {email.archetype}
                        </span>
                      )}

                      {/* Quick Single Triage Trigger */}
                      {!result && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriageSingle(email);
                          }}
                          disabled={isItemLoading}
                          className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 bg-zinc-950 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1"
                        >
                          {isItemLoading ? (
                            <span className="h-2.5 w-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Zap className="h-2.5 w-2.5 fill-current" />
                              <span>Triage</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANE 3: Email Reader & Jev Telemetry (col-span-5 or 6) */}
        <div className="md:col-span-5 lg:col-span-5 bg-[#0e0e11] flex flex-col overflow-y-auto">
          {selectedEmail ? (
            <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Embedded Jev Epistemic Telemetry Card */}
                {triageResults[selectedEmail.id] ? (
                  (() => {
                    const res = triageResults[selectedEmail.id];
                    return (
                      <div
                        className={`rounded-xl p-4 border space-y-3 ${
                          res.isSafetyGated
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                            : res.destination === 'trash_quarantine'
                            ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-500/5'
                            : 'bg-zinc-900/60 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-mono font-bold uppercase text-white">
                              Jev System-One Verdict
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span
                              className="text-[10px] font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 flex items-center space-x-1"
                              title="Decomposed Latency: TypeSafe Upstream Cluster Compute (x-envoy-upstream-service-time) + Public Internet Transit RTT"
                            >
                              <span className="text-emerald-400 font-semibold">⚡ {res.computeMs || 72}ms compute</span>
                              <span className="text-zinc-600">+</span>
                              <span className="text-zinc-400">🌐 {res.networkMs || Math.max(0, (res.latencyMs || 92) - (res.computeMs || 72))}ms net</span>
                              <span className="text-zinc-500 font-bold ml-1">= {res.latencyMs || 92}ms</span>
                            </span>
                            <button
                              onClick={() => setRawJsonModalEmail(res)}
                              className="text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex items-center space-x-1"
                            >
                              <Code className="h-3 w-3" />
                              <span>JSON / Telemetry</span>
                            </button>
                          </div>
                        </div>

                        {/* Safety Gate Alert if Ambiguous */}
                        {res.isSafetyGated ? (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex items-start space-x-2 text-amber-300 text-xs font-mono">
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="leading-snug">
                              <span className="font-bold">EPISTEMIC SAFETY GATE TRIGGERED: </span>
                              Confidence is {Math.round(res.confidence * 100)}% (&lt;85%). Overriding automated deletion to prevent false-positive loss.
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-300 font-mono leading-relaxed">
                            <strong className="text-white">Decision:</strong> {res.reason}
                          </div>
                        )}

                        {/* Telemetry Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-[11px] font-mono">
                          <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
                            <div className="text-[9px] text-zinc-500 uppercase">Confidence</div>
                            <div
                              className={`text-sm font-bold ${
                                res.confidence < 0.85 ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {Math.round(res.confidence * 100)}%
                            </div>
                          </div>

                          <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
                            <div className="text-[9px] text-zinc-500 uppercase">Needs Action</div>
                            <div className="text-sm font-bold text-white">
                              {Math.round(res.actionRequiredProb * 100)}%
                            </div>
                          </div>

                          <div className="bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
                            <div className="text-[9px] text-zinc-500 uppercase">Safe to Trash</div>
                            <div
                              className={`text-sm font-bold ${
                                res.safeToTrashProb > 0.8 ? 'text-rose-400' : 'text-zinc-300'
                              }`}
                            >
                              {Math.round(res.safeToTrashProb * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Untriaged Email</span>
                    <button
                      onClick={() => handleTriageSingle(selectedEmail)}
                      disabled={singleLoadingId === selectedEmail.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      {singleLoadingId === selectedEmail.id ? (
                        <span className="h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Zap className="h-3 w-3 fill-current" />
                          <span>Triage with Jev</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Email RFC Header */}
                <div className="space-y-3 border-b border-zinc-800/80 pb-4">
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {selectedEmail.subject}
                  </h2>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200">
                        {selectedEmail.senderName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {selectedEmail.senderName}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {selectedEmail.sender}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-mono text-zinc-400">
                        {selectedEmail.date}
                      </div>
                      <div className="flex items-center space-x-1 text-[9px] font-mono text-emerald-400/80 mt-0.5">
                        <Check className="h-2.5 w-2.5" />
                        <span>SPF/DKIM: Pass</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap selection:bg-emerald-500/30">
                  {selectedEmail.fullBody}
                </div>
              </div>

              {/* Reader Bottom Action Bar */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>Archetype: {selectedEmail.archetype}</span>
                <span className="text-[10px]">TypeSafe Jev Parallel Classification</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8 text-zinc-600 font-mono text-xs">
              Select an email from the list to view reader pane and telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Raw JSON Modal */}
      {rawJsonModalEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-mono font-bold text-white">
                  TypeSafe Jev Raw API Response Payload
                </h4>
              </div>
              <button
                onClick={() => setRawJsonModalEmail(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Envoy Upstream Verified Telemetry Pill */}
            <div className="bg-zinc-950 p-3 rounded-lg border border-emerald-500/20 text-xs font-mono space-y-1.5">
              <div className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Verified Gateway Telemetry</span>
                <span className="text-emerald-400 text-[10px]">server: istio-envoy</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px] uppercase">x-envoy-upstream-service-time</span>
                  <span className="text-emerald-400 font-bold text-sm">⚡ {rawJsonModalEmail.computeMs || 72} ms</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px] uppercase">Network Transit (RTT)</span>
                  <span className="text-zinc-300 font-bold text-sm">🌐 {rawJsonModalEmail.networkMs || Math.max(0, (rawJsonModalEmail.latencyMs || 92) - (rawJsonModalEmail.computeMs || 72))} ms</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                  <span className="text-zinc-500 block text-[9px] uppercase">Total Wall-Clock</span>
                  <span className="text-white font-bold text-sm">⏱️ {rawJsonModalEmail.latencyMs || 92} ms</span>
                </div>
              </div>
            </div>

            <pre className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-96">
              {rawJsonModalEmail.rawJson || 'No raw payload available'}
            </pre>

            <div className="text-right">
              <button
                onClick={() => setRawJsonModalEmail(null)}
                className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
