'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Sparkles } from 'lucide-react';

interface StatusState {
  status: 'ready' | 'keys_required';
  typesafeConfigured: boolean;
  openrouterConfigured: boolean;
  message: string;
}

export const Header: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<StatusState | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/status')
      .then((res) => res.json())
      .then((data: StatusState) => {
        if (isMounted) setBackendStatus(data);
      })
      .catch((err) => {
        console.error('Failed to fetch backend status:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/20">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">ZeroSweep</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                System One
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Powered by TypeSafe AI <span className="font-mono text-zinc-300">Jev</span>
            </p>
          </div>
        </div>

        {/* Right Status & Navigation */}
        <div className="flex items-center space-x-3">
          {/* Dynamic Engine Status Badge */}
          {backendStatus === null ? (
            <div className="text-xs px-3 py-1.5 rounded-lg border bg-zinc-900/60 text-zinc-400 border-zinc-800 flex items-center space-x-2 font-mono">
              <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
              <span className="hidden sm:inline">Checking Backend...</span>
              <span className="sm:hidden">Checking...</span>
            </div>
          ) : backendStatus.status === 'ready' ? (
            <div className="text-xs px-3 py-1.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center space-x-2 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline font-bold">Live Backend Connected</span>
              <span className="sm:hidden font-bold">Live</span>
            </div>
          ) : (
            <div
              title="API Keys not set. Set TYPESAFE_API_KEY & OPENROUTER_API_KEY in Vercel to activate live triage."
              className="text-xs px-3 py-1.5 rounded-lg border bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center space-x-2 font-mono cursor-help"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="hidden sm:inline font-bold">API Keys Required (Vercel)</span>
              <span className="sm:hidden font-bold">Keys Required</span>
            </div>
          )}

          {/* GitHub Repository */}
          <a
            href="https://github.com/sysadarsh/zerosweep"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-colors"
          >
            <svg className="h-3.5 w-3.5 fill-current text-zinc-400" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* TypeSafe Team */}
          <a
            href="https://typesafe.ai/team"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors hidden lg:flex items-center space-x-1"
          >
            <span>TypeSafe Team</span>
          </a>

          {/* TypeSafe Blog Post */}
          <a
            href="https://typesafe.ai/blog/introducing-system-one-models-and-jev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors hidden md:flex items-center space-x-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>TypeSafe Post</span>
          </a>
        </div>
      </div>
    </header>
  );
};
