import React from 'react';
import { CommThread, PartyRole } from '../../types';
import {
  User, ClipboardList, AlertCircle, CheckCircle2, Clock,
  MessageCircle, Mail, Smartphone, Info
} from 'lucide-react';

interface SurveyThreadListProps {
  threads: CommThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
}

const ROLE_LABELS: Record<PartyRole, string> = {
  insured: 'Insured',
  garage: 'Garage',
  surveyor: 'Surveyor',
  insurer: 'Insurer',
  internal: 'Internal',
};

const ROLE_COLORS: Record<PartyRole, string> = {
  insured: 'bg-indigo-100 text-indigo-700',
  garage: 'bg-amber-100 text-amber-700',
  surveyor: 'bg-emerald-100 text-emerald-700',
  insurer: 'bg-purple-100 text-purple-700',
  internal: 'bg-gray-100 text-gray-600',
};

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ChannelPips({ thread }: { thread: CommThread }) {
  const channels = [...new Set(thread.messages.map(m => m.channel))];
  return (
    <div className="flex gap-1">
      {channels.includes('whatsapp') && <MessageCircle className="w-3 h-3 text-emerald-500" />}
      {channels.includes('sms') && <Smartphone className="w-3 h-3 text-sky-500" />}
      {channels.includes('email') && <Mail className="w-3 h-3 text-indigo-400" />}
      {channels.includes('internal') && <Info className="w-3 h-3 text-gray-400" />}
    </div>
  );
}

function StatusIcon({ status }: { status: CommThread['threadStatus'] }) {
  if (status === 'waiting') return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
  if (status === 'active') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === 'closed') return <Clock className="w-3.5 h-3.5 text-gray-400" />;
  return null;
}

export function SurveyThreadList({ threads, activeThreadId, onSelectThread }: SurveyThreadListProps) {
  const orderedRoles: PartyRole[] = ['insured', 'garage', 'surveyor', 'insurer', 'internal'];
  const sorted = [...threads].sort(
    (a, b) => orderedRoles.indexOf(a.party.role) - orderedRoles.indexOf(b.party.role)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Participants</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.map(thread => {
          const isActive = thread.id === activeThreadId;
          const hasFailed = thread.messages.some(m => m.status === 'failed');
          const lastMsg = thread.messages
            .filter(m => !m.isAutoEvent)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

          return (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={`relative w-full text-left px-4 py-3.5 border-b border-gray-100 transition-all ${
                isActive
                  ? 'bg-indigo-50 border-l-2 border-l-indigo-600'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {thread.party.role === 'internal'
                    ? <ClipboardList className="w-4 h-4" />
                    : <User className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ROLE_COLORS[thread.party.role]}`}>
                        {ROLE_LABELS[thread.party.role]}
                      </span>
                      {hasFailed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Delivery failure" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {formatRelativeTime(thread.lastActivityAt)}
                    </span>
                  </div>

                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-800'}`}>
                    {thread.party.name}
                  </p>

                  {lastMsg && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {lastMsg.sender === 'handler' ? 'You: ' : ''}{lastMsg.content}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={thread.threadStatus} />
                      <ChannelPips thread={thread} />
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
