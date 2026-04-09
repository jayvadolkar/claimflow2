import React, { useState, useCallback } from 'react';
import { Survey, CommThread, CommMessage, CommChannel, EmailTicket } from '../../types';
import { defaultCommTemplates } from '../../data/commTemplates';
import { buildSeededThreads, buildSeededEmailTickets } from '../../data/commSeedData';
import { SurveyThreadList } from '../comms/SurveyThreadList';

import { ConversationPanel } from '../comms/ConversationPanel';
import { MessageComposer } from '../comms/MessageComposer';
import { EmailThreadPanel } from '../comms/EmailThreadPanel';
import { EmailComposer } from '../comms/EmailComposer';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { User, Smartphone, Mail, ClipboardList, MoreVertical, MessageCircle } from 'lucide-react';
import { EmailTicketList } from '../comms/EmailTicketList';

// ── Hydration ─────────────────────────────────────────────────────────────────
function hydrateThreads(survey: Survey): CommThread[] {
  if (survey.threads && survey.threads.length > 0) return survey.threads;
  return buildSeededThreads(survey);
}

function hydrateEmailTickets(survey: Survey): EmailTicket[] {
  if (survey.emailTickets && survey.emailTickets.length > 0) return survey.emailTickets;
  return buildSeededEmailTickets(survey);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CommunicationTabProps {
  survey: Survey;
  onUpdateSurvey: (survey: Survey) => void;
  onPersonClick?: (id: string) => void;
}

export function CommunicationTab({ survey, onUpdateSurvey, onPersonClick }: CommunicationTabProps) {
  // Channel State
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');

  // WhatsApp/SMS State
  const [threads, setThreads] = useState<CommThread[]>(() => hydrateThreads(survey));
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id ?? '');
  const activeThread = threads.find(t => t.id === activeThreadId) ?? threads[0];

  // Email State
  const [emailTickets, setEmailTickets] = useState<EmailTicket[]>(() => hydrateEmailTickets(survey));
  const [activeTicketId, setActiveTicketId] = useState<string>(emailTickets[0]?.id ?? '');
  
  const isCreatingNewEmail = activeTicketId === 'new';
  const activeTicket = isCreatingNewEmail 
    ? {
        id: 'new',
        surveyId: survey.id,
        subject: '',
        participants: [{ role: 'insured', name: survey.customerName, email: '', type: 'to' as const }],
        messages: [],
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
        status: 'open' as const
      }
    : (emailTickets.find(t => t.id === activeTicketId) ?? emailTickets[0]);

  // ── Send Message (WhatsApp / SMS) ────────────────────────────────────────────
  const handleSendComm = useCallback((content: string, channel: CommChannel) => {
    if (!activeThread) return;
    const now = new Date().toISOString();
    const newMsg: CommMessage = {
      id: `msg-${Date.now()}`,
      channel,
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
      systemAction: `Sent message to ${activeThread.party.name}`,
      outcomeState: 'Message sent',
    }).catch(console.error);

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

  // ── Send Email ───────────────────────────────────────────────────────────────
  const handleSendEmail = useCallback((content: string, channel: CommChannel, subject?: string) => {
    if (!activeTicket) return;
    const now = new Date().toISOString();
    const newMsg: CommMessage = {
      id: `msg-${Date.now()}`,
      channel: 'email',
      sender: 'handler',
      content,
      subject: subject || activeTicket.subject,
      timestamp: now,
      status: 'sent',
    };

    const isNew = activeTicket.id === 'new';

    if (isNew) {
      const newTicket: EmailTicket = {
        ...activeTicket,
        id: `ticket-${Date.now()}`,
        subject: subject || 'New Conversation',
        messages: [newMsg],
      };
      const updatedTickets = [newTicket, ...emailTickets];
      setEmailTickets(updatedTickets);
      setActiveTicketId(newTicket.id);
      onUpdateSurvey({ ...survey, emailTickets: updatedTickets });
    } else {
      const updatedTickets = emailTickets.map(t =>
        t.id !== activeTicket.id ? t : {
          ...t,
          messages: [...t.messages, newMsg],
          updatedAt: now,
          unreadCount: 0,
        }
      );
      setEmailTickets(updatedTickets);
      onUpdateSurvey({ ...survey, emailTickets: updatedTickets });
    }
    toast.success('Email sent');
  }, [activeTicket, emailTickets, survey, onUpdateSurvey]);


  // ── Select Handlers ──────────────────────────────────────────────────────────
  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setThreads(prev => prev.map(t => t.id !== threadId ? t : { ...t, unreadCount: 0 }));
  }, []);

  const handleSelectTicket = useCallback((ticketId: string) => {
    setActiveTicketId(ticketId);
    setEmailTickets(prev => prev.map(t => t.id !== ticketId ? t : { ...t, unreadCount: 0 }));
  }, []);

  const handleRetry = useCallback((messageId: string) => {
    // Retry logic here
    toast.success('Retrying delivery…');
  }, []);

  // ── Renders ──────────────────────────────────────────────────────────────────
  const renderWhatsApp = () => {
    if (!activeThread) {
      return <div className="flex-1 flex items-center justify-center text-gray-400">No conversations available.</div>;
    }

    // Header logic
    const roleColors: Record<string, string> = {
      insured: 'bg-indigo-500', garage: 'bg-amber-500', surveyor: 'bg-emerald-500', insurer: 'bg-purple-500',
    };
    const rolePillColors: Record<string, string> = {
      insured: 'bg-indigo-100 text-indigo-600', garage: 'bg-amber-100 text-amber-600', surveyor: 'bg-emerald-100 text-emerald-600', insurer: 'bg-purple-100 text-purple-600',
    };

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Thread List */}
        <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50/30 shrink-0">
          <SurveyThreadList
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
          />
        </div>

        {/* Right Pane - Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="px-6 py-3.5 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${roleColors[activeThread.party.role] || 'bg-slate-400'}`}>
                {activeThread.party.role === 'internal' ? <ClipboardList className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{activeThread.party.name}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rolePillColors[activeThread.party.role] || 'bg-gray-100 text-gray-500'}`}>
                    {activeThread.party.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {activeThread.party.mobile && (
                    <button 
                       onClick={() => onPersonClick?.(activeThread.party.mobile!)}
                       className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" /> {activeThread.party.mobile}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <ConversationPanel thread={activeThread} onRetry={handleRetry} activeTab="whatsapp" />
          <MessageComposer thread={activeThread} templates={defaultCommTemplates} onSend={handleSendComm} activeTab="whatsapp" />
        </div>
      </div>
    );
  };

  const renderSMSOutbox = () => {
    const allSms = threads.flatMap(t =>
      t.messages.filter(m => m.channel === 'sms' || m.isAutoEvent).map(m => ({ ...m, party: t.party }))
    ).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // descending

    return (
      <div className="flex flex-1 overflow-hidden bg-gray-50/50 p-6 justfy-center">
        <div className="max-w-2xl mx-auto w-full flex flex-col space-y-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Survey SMS History</h3>
          {allSms.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No SMS found</div>
          ) : (
            allSms.map((msg, i) => (
              <div key={i} className={`p-4 rounded-xl border ${msg.isAutoEvent ? 'bg-gray-100/50 border-transparent items-center justify-center text-center text-xs text-gray-500' : 'bg-white border-gray-200'}`}>
                {msg.isAutoEvent ? (
                  <i>{msg.eventLabel || msg.content}</i>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">To: {msg.party.name} ({msg.party.mobile})</span>
                      <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800">{msg.content}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderEmail = () => {
    if (!activeTicket && !isCreatingNewEmail) {
      return <div className="flex-1 flex items-center justify-center text-gray-400">No email tickets available.</div>;
    }

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Email Ticket List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/30 shrink-0">
          <EmailTicketList
            tickets={emailTickets}
            activeTicketId={activeTicketId}
            onSelectTicket={handleSelectTicket}
            onNewTicket={() => setActiveTicketId('new')}
          />
        </div>

        {/* Right Pane - Email View */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {!isCreatingNewEmail && <EmailThreadPanel ticket={activeTicket} />}
          {isCreatingNewEmail && (
            <div className="flex-1 flex items-center justify-center bg-gray-50/50 text-gray-400 text-sm">
                Compose in floating window...
            </div>
          )}
          <div className="flex flex-col">
            <EmailComposer ticket={activeTicket} templates={defaultCommTemplates} onSend={handleSendEmail} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top Level Channel Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 shrink-0 pt-2">
        {([
          { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
          { id: 'email', label: 'Email', Icon: Mail },
          { id: 'sms', label: 'SMS', Icon: Smartphone },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'whatsapp' | 'email' | 'sms')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'email' ? renderEmail() : activeTab === 'sms' ? renderSMSOutbox() : renderWhatsApp()}
    </div>
  );
}
