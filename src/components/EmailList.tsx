'use client';

import React from 'react';
import { SyntheticEmail, EmailTriageResult } from '@/types';
import { Mail, Trash2, Inbox, BookOpen, ShieldAlert, ChevronRight } from 'lucide-react';

interface EmailListProps {
  emails: SyntheticEmail[];
  triageResults: Record<string, EmailTriageResult>;
  onSelectEmail: (email: SyntheticEmail) => void;
  selectedEmailId: string | null;
  isComplete: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  triageResults,
  onSelectEmail,
  selectedEmailId,
  isComplete
}) => {
  const getDestinationBadge = (result?: EmailTriageResult) => {
    if (!result) return null;

    if (result.isSafetyGated) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          <span>Human Review (Low Conf)</span>
        </span>
      );
    }

    switch (result.destination) {
      case 'trash_quarantine':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            <Trash2 className="h-3 w-3 text-rose-400" />
            <span>Trash Quarantine</span>
          </span>
        );
      case 'newsletters':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono">
            <BookOpen className="h-3 w-3 text-blue-400" />
            <span>Newsletters</span>
          </span>
        );
      case 'inbox':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
            <Inbox className="h-3 w-3 text-emerald-400" />
            <span>Keep in Inbox</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Synthetic Inbox Queue</h3>
          <span className="text-xs text-zinc-500 font-mono">({emails.length} items)</span>
        </div>
        <div className="text-xs text-zinc-400">
          Click any email to inspect <span className="text-emerald-400 font-mono">Jev Telemetry & Probabilities</span>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/80">
        {emails.map((email) => {
          const result = triageResults[email.id];
          const isSelected = selectedEmailId === email.id;

          return (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className={`p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-zinc-800/60 border-l-4 border-l-emerald-500'
                  : 'hover:bg-zinc-800/30'
              } ${email.isAmbiguous ? 'bg-amber-950/10' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-zinc-200 truncate">
                    {email.senderName}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 truncate hidden md:inline">
                    &lt;{email.sender}&gt;
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                    • {email.date}
                  </span>
                </div>

                <div className="text-sm font-medium text-white truncate mb-1">
                  {email.subject}
                </div>

                <div className="text-xs text-zinc-400 line-clamp-1">
                  {email.snippet}
                </div>
              </div>

              {/* Status / Triage Badges */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                {isComplete && result ? (
                  <div className="flex items-center space-x-2">
                    {getDestinationBadge(result)}
                    <span className="text-xs font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                      Conf: <strong className={result.confidence < 0.85 ? 'text-amber-400' : 'text-emerald-400'}>
                        {Math.round(result.confidence * 100)}%
                      </strong>
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    {email.archetype}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
