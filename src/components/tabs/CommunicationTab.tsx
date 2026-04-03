import React, { useState, useCallback } from 'react';
import { Survey, CommThread, CommMessage, CommChannel } from '../../types';
import { defaultCommTemplates } from '../../data/commTemplates';
import { buildSeededThreads } from '../../data/commSeedData';
import { SurveyThreadList } from '../comms/SurveyThreadList';
import { ConversationPanel } from '../comms/ConversationPanel';
import { MessageComposer } from '../comms/MessageComposer';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { User, Smartphone, Mail, ClipboardList, MoreVertical } from 'lucide-react';

// ── Hydrate from persisted data or build seeded threads ───────────────────────
function hydrateThreads(survey: Survey): CommThread[] {
  // Use persisted threads if they exist and have messages
  if (survey.threads && survey.threads.length > 0) return survey.threads;
  // Otherwise build rich seed data from survey info
  return buildSeededThreads(survey);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CommunicationTabProps {
  survey: Survey;
  onUpdateSurvey: (survey: Survey) => void;
}

export function CommunicationTab({ survey, onUpdateSurvey }: CommunicationTabProps) {
  const [threads, setThreads] = useState<CommThread[]>(() => hydrateThreads(survey));
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id ?? '');

  const activeThread = threads.find(t => t.id === activeThreadId) ?? threads[0];

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = useCallback((content: string, channel: CommChannel) => {
    if (!activeThread) return;

    const now = new Date().toISOString();
    const newMsg: CommMessage = {
      id: `msg-${Date.now()}`,
      channel,
      // 'handler' = the logged-in user sending outbound
      sender: 'handler',
      content,
      timestamp: now,
      status: 'sent',
    };

    const updatedThreads = threads.map(t =>
      t.id !== activeThread.id ? t : {
        ...t,
        messages: [...t.messages, newMsg],
        lastMessage: content,
        lastActivityAt: now,
        unreadCount: 0,
      }
    );

    setThreads(updatedThreads);
    onUpdateSurvey({ ...survey, threads: updatedThreads });

    api.logEvent(survey.id, {
      eventName: 'Message Sent',
      actor: 'Handler',
      triggerCondition: `Manual send via ${channel}`,
      systemAction: `Sent message to ${activeThread.party.name} (${activeThread.party.role})`,
      outcomeState: 'Message sent',
    }).catch(console.error);

    // Simulate delivery status progression for realism
    setTimeout(() => {
      setThreads(prev => prev.map(t =>
        t.id !== activeThread.id ? t : {
          ...t,
          messages: t.messages.map(m =>
            m.id !== newMsg.id ? m : { ...m, status: 'delivered' as const }
          ),
        }
      ));
    }, 1500);

    toast.success('Message sent');
  }, [activeThread, threads, survey, onUpdateSurvey]);

  // ── Retry failed message ─────────────────────────────────────────────────────
  const handleRetry = useCallback((messageId: string) => {
    const updatedThreads = threads.map(t => ({
      ...t,
      messages: t.messages.map(m =>
        m.id !== messageId ? m : { ...m, status: 'queued' as const, retryCount: (m.retryCount ?? 0) + 1 }
      ),
    }));
    setThreads(updatedThreads);
    onUpdateSurvey({ ...survey, threads: updatedThreads });
    toast.success('Retrying delivery…');
  }, [threads, survey, onUpdateSurvey]);

  // ── Mark thread read when opened ─────────────────────────────────────────────
  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setThreads(prev => prev.map(t =>
      t.id !== threadId ? t : { ...t, unreadCount: 0 }
    ));
  }, []);

  if (!activeThread) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No threads available for this survey.
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">

      {/* LEFT: Thread list + system timeline */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50/30 shrink-0">
        <SurveyThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
        />

        {/* System timeline mini — shows auto-events across all threads */}
        <div className="p-4 border-t border-gray-200 bg-white max-h-56 overflow-y-auto">
          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 sticky top-0 bg-white pb-1">
            System Timeline
          </h5>
          <div className="space-y-2.5">
            {threads
              .flatMap(t => t.messages.filter(m => m.isAutoEvent))
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .slice(0, 8)
              .map(m => (
                <div key={m.id} className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-gray-600 leading-tight">
                    {m.eventLabel || m.content}
                  </p>
                </div>
              ))}
            {threads.every(t => t.messages.filter(m => m.isAutoEvent).length === 0) && (
              <p className="text-[11px] text-gray-400">No system events yet</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Conversation + Composer (fills remaining space) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Thread header — shows party info inline */}
        <div className="px-6 py-3.5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${
              activeThread.party.role === 'insured'  ? 'bg-indigo-500' :
              activeThread.party.role === 'garage'   ? 'bg-amber-500'  :
              activeThread.party.role === 'surveyor' ? 'bg-emerald-500' :
              activeThread.party.role === 'insurer'  ? 'bg-purple-500' :
              'bg-slate-400'
            }`}>
              {activeThread.party.role === 'internal'
                ? <ClipboardList className="w-4 h-4" />
                : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">{activeThread.party.name}</h3>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activeThread.party.role === 'insured'  ? 'bg-indigo-100 text-indigo-600' :
                  activeThread.party.role === 'garage'   ? 'bg-amber-100 text-amber-600'   :
                  activeThread.party.role === 'surveyor' ? 'bg-emerald-100 text-emerald-600' :
                  activeThread.party.role === 'insurer'  ? 'bg-purple-100 text-purple-600'  :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {activeThread.party.role}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {activeThread.party.mobile && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Smartphone className="w-3 h-3" /> {activeThread.party.mobile}
                  </span>
                )}
                {activeThread.party.email && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Mail className="w-3 h-3" /> {activeThread.party.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <ConversationPanel thread={activeThread} onRetry={handleRetry} />

        {/* Composer */}
        <MessageComposer
          thread={activeThread}
          templates={defaultCommTemplates}
          onSend={handleSend}
        />
      </div>

    </div>
  );
}
