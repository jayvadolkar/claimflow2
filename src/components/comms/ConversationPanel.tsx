import React, { useRef, useEffect } from 'react';
import { CommMessage, CommThread, CommChannel } from '../../types';
import {
  MessageCircle, Mail, Smartphone, Info, Zap,
  CheckCircle2, AlertTriangle, Paperclip, RotateCcw, User, ClipboardList
} from 'lucide-react';

interface ConversationPanelProps {
  thread: CommThread;
  onRetry?: (messageId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function shouldGroup(curr: CommMessage, prev: CommMessage | undefined): boolean {
  if (!prev) return false;
  if (curr.sender !== prev.sender) return false;
  if (curr.channel !== prev.channel) return false;
  const diff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
  return diff < 2 * 60 * 1000; // within 2 min
}

// ── Channel icon + colour ─────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: CommChannel }) {
  const cfg = {
    whatsapp: { Icon: MessageCircle, color: 'text-emerald-500', label: 'WhatsApp' },
    sms:      { Icon: Smartphone,    color: 'text-sky-500',     label: 'SMS'      },
    email:    { Icon: Mail,          color: 'text-indigo-400',  label: 'Email'    },
    internal: { Icon: Info,          color: 'text-gray-400',    label: 'Internal' },
  }[channel];
  return (
    <span className="flex items-center gap-1 opacity-70">
      <cfg.Icon className={`w-3 h-3 ${cfg.color}`} />
      <span className="text-[9px] font-bold uppercase tracking-wider">{cfg.label}</span>
    </span>
  );
}

// ── Delivery ticks ────────────────────────────────────────────────────────────
function DeliveryStatus({ status }: { status?: CommMessage['status'] }) {
  if (!status || status === 'queued') return null;
  if (status === 'failed') return <AlertTriangle className="w-3 h-3 text-red-500" />;
  if (status === 'read') return <CheckCircle2 className="w-3 h-3 text-indigo-400" />;
  if (status === 'delivered') return <CheckCircle2 className="w-3 h-3 text-gray-400" />;
  // sent
  return <CheckCircle2 className="w-3 h-3 text-gray-300" />;
}

// ── Bubble colours ────────────────────────────────────────────────────────────
function getBubbleClass(msg: CommMessage): string {
  if (msg.sender === 'handler') {
    const map: Record<CommChannel, string> = {
      whatsapp: 'bg-emerald-600 text-white',
      sms:      'bg-sky-600 text-white',
      email:    'bg-indigo-800 text-white',
      internal: 'bg-slate-700 text-white',
    };
    return map[msg.channel];
  }
  const map: Record<CommChannel, string> = {
    whatsapp: 'bg-white border border-emerald-100 text-gray-900',
    sms:      'bg-white border border-sky-100 text-gray-900',
    email:    'bg-white border border-indigo-100 text-gray-900',
    internal: 'bg-white border border-gray-200 text-gray-900',
  };
  return map[msg.channel];
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ConversationPanel({ thread, onRetry }: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sorted = [...thread.messages].sort(
    (a, b) => a.timestamp.localeCompare(b.timestamp)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1 bg-gray-50/40">
      {sorted.map((msg, idx) => {
        const prev = sorted[idx - 1];
        const showDateSep = !prev || !isSameDay(msg.timestamp, prev.timestamp);
        const grouped = shouldGroup(msg, prev);
        const isHandler = msg.sender === 'handler';
        const isSystem = msg.sender === 'system' || msg.isAutoEvent;
        const isFailed = msg.status === 'failed';

        return (
          <React.Fragment key={msg.id}>
            {/* Date separator */}
            {showDateSep && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-200/70 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {formatDateSeparator(msg.timestamp)}
                </span>
              </div>
            )}

            {/* System / auto-event pill */}
            {isSystem ? (
              <div className="flex justify-center my-2">
                <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-full text-[11px] font-medium text-gray-600 shadow-sm">
                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{msg.eventLabel || msg.content}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ) : (
              /* Regular message */
              <div className={`flex ${isHandler ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-4'}`}>
                {/* Participant avatar (not grouped) */}
                {!isHandler && !grouped && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mr-2 self-end mb-1">
                    {thread.party.role === 'internal'
                      ? <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
                      : <User className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                )}
                {!isHandler && grouped && <div className="w-9 shrink-0" />}

                <div className={`max-w-[72%] flex flex-col ${isHandler ? 'items-end' : 'items-start'}`}>
                  {/* Sender label (first in group) */}
                  {!grouped && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {isHandler ? 'You' : thread.party.name}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${getBubbleClass(msg)} ${
                    isFailed ? 'ring-1 ring-red-400' : ''
                  } ${grouped && isHandler ? 'rounded-tr-md' : ''} ${grouped && !isHandler ? 'rounded-tl-md' : ''}`}>
                    {/* Channel badge inside bubble */}
                    <ChannelBadge channel={msg.channel} />

                    {/* Content */}
                    <p className="mt-1">{msg.content}</p>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current/10 space-y-1">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{att.name}</span>
                            <span className="opacity-60">({att.size})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Failure reason */}
                    {isFailed && msg.failureReason && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-300 font-medium">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {msg.failureReason}
                      </div>
                    )}
                  </div>

                  {/* Timestamp + status row */}
                  <div className={`flex items-center gap-1.5 mt-1 px-1 ${isHandler ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                    {isHandler && <DeliveryStatus status={msg.status} />}
                    {isFailed && onRetry && (
                      <button
                        onClick={() => onRetry(msg.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors px-1.5 py-0.5 rounded bg-red-50 border border-red-200"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-16">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <MessageCircle className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No messages yet</p>
          <p className="text-xs text-gray-300 mt-1">Send the first message to {thread.party.name}</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
