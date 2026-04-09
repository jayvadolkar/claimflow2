import React, { useRef, useEffect, useState } from 'react';
import { CommMessage, EmailTicket } from '../../types';
import { Mail, Zap, Paperclip, ChevronDown, ChevronUp, User } from 'lucide-react';

interface EmailThreadPanelProps {
  ticket: EmailTicket;
  onPersonClick?: (id: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function EmailThreadPanel({ ticket, onPersonClick }: EmailThreadPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});

  const toggleEmail = (id: string) => setExpandedEmails(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter ONLY emails and standard system cross-channel events
  const emailMessages = ticket.messages.filter(m => m.channel === 'email' || m.isAutoEvent);
  const sorted = [...emailMessages].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Auto-expand the latest human email if possible
  useEffect(() => {
    const latestEmail = [...sorted].reverse().find(m => m.channel === 'email' && !m.isAutoEvent && m.sender !== 'system');
    if (latestEmail && !expandedEmails[latestEmail.id]) {
        setExpandedEmails(prev => ({ ...prev, [latestEmail.id]: true }));
    }
  }, [ticket.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sorted.length]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 bg-gray-50/50">
      {sorted.map((msg) => {
        const isSystemEvent = msg.isAutoEvent || (msg.channel === 'email' && msg.sender === 'system');

        return (
          <React.Fragment key={msg.id}>
            {/* System Events / noreply@ */}
            {isSystemEvent ? (
              <div className="flex justify-center my-4">
                <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg text-[11px] font-medium text-gray-500 shadow-sm max-w-[80%] text-center">
                  <Zap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="italic">{msg.eventLabel || msg.content}</span>
                  <span className="text-gray-400 shrink-0 mx-1">•</span>
                  <span className="text-gray-400 shrink-0">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ) : (
              /* Email Card */
              <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                {/* Collapsed Header (Always visible) */}
                <button 
                  className={`w-full text-left px-5 py-4 flex items-center justify-between transition-colors hover:bg-gray-50 ${expandedEmails[msg.id] ? 'bg-gray-50/50 border-b border-gray-100' : ''}`}
                  onClick={() => toggleEmail(msg.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      {msg.sender === 'handler' ? <Mail className="w-4 h-4 text-indigo-500" /> : <User className="w-4 h-4 text-indigo-500" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                         <span className="text-sm font-bold text-gray-900 truncate">
                           {msg.sender === 'handler' ? 'claims@zoop.one' : (msg.senderName || ticket.participants[0]?.name || 'User')}
                         </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 truncate">
                        <span className="font-medium text-gray-700 truncate max-w-[50%]">{msg.subject || ticket.subject}</span>
                        {!expandedEmails[msg.id] && (
                           <>
                              <span className="mx-1 text-gray-300">-</span>
                              <span className="truncate">{msg.content.replace(/\s+/g, ' ')}</span>
                           </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-gray-400 font-medium">{formatTime(msg.timestamp)}</span>
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-50 border border-gray-200">
                      {expandedEmails[msg.id] ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Body */}
                {expandedEmails[msg.id] && (
                  <div className="px-5 py-5 text-sm text-gray-800 leading-relaxed max-w-4xl">
                    {/* Fake routing headers for realism */}
                    <div className="mb-6 pt-2 pb-4 border-b border-gray-100 flex flex-col gap-1.5 text-xs text-gray-500 font-mono">
                       <div><span className="text-gray-400 inline-block w-12">From:</span> {msg.sender === 'handler' ? 'claims@zoop.one' : <button onClick={(e) => { e.stopPropagation(); onPersonClick?.(ticket.participants[0]?.email || 'user@example.com'); }} className="hover:text-indigo-600 transition-colors underline decoration-transparent hover:decoration-indigo-300">{`${ticket.participants[0]?.name || 'User'} <${ticket.participants[0]?.email || 'user@example.com'}>`}</button>}</div>
                       <div><span className="text-gray-400 inline-block w-12">To:</span> {msg.sender === 'handler' ? <button onClick={(e) => { e.stopPropagation(); onPersonClick?.(ticket.participants[0]?.email || 'user@example.com'); }} className="hover:text-indigo-600 transition-colors underline decoration-transparent hover:decoration-indigo-300">{`${ticket.participants[0]?.name || 'User'} <${ticket.participants[0]?.email || 'user@example.com'}>`}</button> : 'claims@zoop.one'}</div>
                       <div className="mt-1"><span className="text-gray-400 inline-block w-12">Subj:</span> <span className="font-bold text-gray-700">{msg.subject || ticket.subject}</span></div>
                    </div>

                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Attachments ({msg.attachments.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((att, i) => (
                            <a key={i} href="#" className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors group">
                               <Paperclip className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500" />
                               <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-700">{att.name}</span>
                               <span className="text-[10px] text-gray-400">({att.size})</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-20">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-indigo-300" />
          </div>
          <p className="text-base font-medium text-gray-800">No email history</p>
          <p className="text-sm text-gray-500 mt-1">Start a new thread</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
