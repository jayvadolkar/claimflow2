import React, { useState, useRef, useEffect } from 'react';
import { Survey } from '../../types';
import { 
  Send, Mail, Smartphone, MessageCircle, Zap, Paperclip, User, 
  HardDrive, X, FileText, Image as ImageIcon, Clock, AlertCircle, 
  CheckCircle2, Info, MoreVertical, Search, Filter, Plus, 
  ChevronRight, Download, Share2, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

type ParticipantId = 'insured' | 'garage' | 'insurer' | 'internal';
type CommChannel = 'whatsapp' | 'sms' | 'email' | 'internal';

interface Message {
  id: string;
  channel: CommChannel;
  sender: 'role-handler' | 'participant' | 'system' | 'role-admin' | 'role-manager' | 'surveyor' | 'garage' | 'insurer' | 'customer';
  content: string;
  time: string;
  status?: 'delivered' | 'read' | 'sent' | 'failed';
  attachments?: { name: string; type: string; size: string }[];
}

interface Thread {
  id: ParticipantId;
  name: string;
  role: string;
  unreadCount: number;
  lastMessage: string;
  lastActivity: string;
  status: 'waiting' | 'received' | 'pending' | 'none';
  statusText: string;
  messages: Message[];
}

export function CommunicationTab({ survey, onUpdateSurvey }: { survey: Survey; onUpdateSurvey: (survey: Survey) => void }) {
  const [activeThreadId, setActiveThreadId] = useState<ParticipantId>('insured');
  const [selectedChannel, setSelectedChannel] = useState<CommChannel>('whatsapp');
  const [newMessage, setNewMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  
  // Initial threads data
  const initialThreads: Record<ParticipantId, Thread> = {
    insured: {
      id: 'insured',
      name: survey.customerName,
      role: 'Insured',
      unreadCount: 2,
      lastMessage: 'We have received your RC. Thank you.',
      lastActivity: 'Just now',
      status: 'waiting',
      statusText: 'Waiting for documents',
      messages: ([
        { id: '1', channel: 'whatsapp', sender: 'role-handler', content: 'Please upload damage photos', time: '10:00 AM', status: 'read' },
        { id: '2', channel: 'sms', sender: 'system', content: 'Reminder sent for photos', time: '10:05 AM' },
        { id: '3', channel: 'whatsapp', sender: 'participant', content: 'Uploading RC now', time: '10:15 AM' },
        { id: '4', channel: 'sms', sender: 'role-handler', content: 'We have received your RC. Thank you.', time: '10:20 AM', status: 'delivered' },
      ] as Message[]).sort((a, b) => a.time.localeCompare(b.time))
    },
    garage: {
      id: 'garage',
      name: survey.garageName,
      role: 'Garage',
      unreadCount: 0,
      lastMessage: 'Please also include photos of the chassis number.',
      lastActivity: 'Just now',
      status: 'received',
      statusText: 'Estimate received',
      messages: ([
        { id: 'g1', channel: 'email', sender: 'role-handler', content: 'Please share the repair estimate for the vehicle. We have noted the damage to the front bumper and left fender. Please ensure the estimate includes labor charges and parts cost.', time: '09:00 AM', status: 'read', attachments: [{ name: 'Damage_Report.pdf', type: 'PDF', size: '200 KB' }] },
        { id: 'g2', channel: 'email', sender: 'participant', content: 'Estimate sent. Please check your portal.', time: '10:30 AM' },
        { id: 'g3', channel: 'email', sender: 'role-handler', content: 'Please also include photos of the chassis number.', time: '11:00 AM', status: 'sent' },
      ] as Message[]).sort((a, b) => a.time.localeCompare(b.time))
    },
    insurer: {
      id: 'insurer',
      name: survey.insurer,
      role: 'Insurer',
      unreadCount: 1,
      lastMessage: 'Please find the attached survey report.',
      lastActivity: 'Just now',
      status: 'pending',
      statusText: 'Awaiting report',
      messages: ([
        { id: 'i1', channel: 'email', sender: 'participant', content: 'Any update on the survey report?', time: '08:00 AM' },
        { id: 'i2', channel: 'email', sender: 'role-handler', content: 'Survey in progress. Will share the report soon.', time: '08:30 AM', status: 'read' },
        { id: 'i3', channel: 'email', sender: 'participant', content: 'Yes, please share it as soon as possible.', time: '11:00 AM' },
        { id: 'i4', channel: 'email', sender: 'role-handler', content: 'Please find the attached survey report.', time: '11:15 AM', status: 'sent', attachments: [{ name: 'Survey_Report_Final.pdf', type: 'PDF', size: '1.5 MB' }] },
      ] as Message[]).sort((a, b) => a.time.localeCompare(b.time))
    },
    internal: {
      id: 'internal',
      name: 'Internal Notes',
      role: 'Team',
      unreadCount: 0,
      lastMessage: 'AI inspection completed',
      lastActivity: '30 mins ago',
      status: 'none',
      statusText: '',
      messages: ([
        { id: 'n1', channel: 'internal', sender: 'system', content: 'AI inspection completed. Confidence score: 92%', time: '10:45 AM' },
        { id: 'n2', channel: 'internal', sender: 'role-handler', content: 'Verified AI findings. Looks consistent with damage.', time: '11:00 AM' },
      ] as Message[]).sort((a, b) => a.time.localeCompare(b.time))
    }
  };

  const [threads, setThreads] = useState<Record<ParticipantId, Thread>>(
    survey.communicationThreads ? 
    survey.communicationThreads.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}) : 
    initialThreads
  );

  const activeThread = threads[activeThreadId];
  const expandedMessage = activeThread.messages.find(m => m.id === expandedEmailId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Determine channel based on thread
    const channel: CommChannel = activeThreadId === 'internal' ? 'internal' : selectedChannel;

    const newMsg: Message = {
      id: Date.now().toString(),
      channel: channel,
      sender: 'role-handler',
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    const updatedThreads = {
      ...threads,
      [activeThreadId]: {
        ...threads[activeThreadId],
        messages: [...threads[activeThreadId].messages, newMsg].sort((a, b) => a.time.localeCompare(b.time)),
        lastMessage: newMessage,
        lastActivity: 'Just now',
        unreadCount: 0
      }
    };

    setThreads(updatedThreads);
    
    // Persist to survey
    onUpdateSurvey({
      ...survey,
      communicationThreads: Object.values(updatedThreads)
    });
    
    api.logEvent(survey.id, {
      eventName: 'Message Sent',
      actor: 'User',
      triggerCondition: `Message sent via ${channel}`,
      systemAction: `Sent message to ${activeThread.role}`,
      outcomeState: 'Message delivered'
    }).catch(console.error);
    
    setNewMessage('');
    toast.success('Message sent');
  };

  const toggleEmailExpansion = (msgId: string) => {
    setExpandedEmailId(prev => prev === msgId ? null : msgId);
  };

  const templates = [
    { title: 'Request RC', content: 'Dear Customer, please upload a clear photo of your Registration Certificate (RC) for claim processing.' },
    { title: 'Request Photos', content: 'Please share clear photos of the vehicle damage from all 4 sides and the odometer reading.' },
    { title: 'Visit Confirmation', content: 'Our surveyor will visit the garage today at 2:00 PM for inspection.' },
    { title: 'Estimate Clarification', content: 'We need clarification on the labor charges mentioned in the estimate.' },
    { title: 'Report Submission', content: 'The survey report has been finalized and submitted for approval.' }
  ];

  const applyTemplate = (content: string) => {
    setNewMessage(content);
    setShowTemplates(false);
  };

  const getChannelIcon = (channel: CommChannel) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="w-3 h-3 text-emerald-500" />;
      case 'sms': return <Smartphone className="w-3 h-3 text-blue-500" />;
      case 'email': return <Mail className="w-3 h-3 text-indigo-500" />;
      case 'internal': return <Info className="w-3 h-3 text-slate-400" />;
    }
  };

  const getStatusIcon = (status: Thread['status']) => {
    switch (status) {
      case 'waiting': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'received': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      
      {/* LEFT PANEL - PARTICIPANTS */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/30">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search threads..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {(Object.values(threads) as Thread[]).map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`w-full p-4 flex items-start gap-3 border-b border-gray-100 transition-all text-left ${
                activeThreadId === thread.id ? 'bg-white shadow-sm z-10' : 'hover:bg-gray-100/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                activeThreadId === thread.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {thread.id === 'internal' ? <ClipboardList className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-bold truncate ${activeThreadId === thread.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {thread.name}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium">{thread.lastActivity}</span>
                </div>
                
                <p className="text-xs text-gray-500 truncate mb-2">{thread.lastMessage}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(thread.status)}
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {thread.statusText}
                    </span>
                  </div>
                  {thread.unreadCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              
              {activeThreadId === thread.id && (
                <div className="w-1 h-10 bg-indigo-600 absolute left-0 rounded-r-full" />
              )}
            </button>
          ))}
        </div>
        
        {/* SYSTEM TIMELINE PREVIEW */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">System Timeline</h5>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p className="text-[11px] text-gray-600 leading-tight">Photos uploaded by insured</p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <p className="text-[11px] text-gray-600 leading-tight">AI inspection completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE PANEL - CONVERSATION */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Thread Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              {activeThread.id === 'internal' ? <ClipboardList className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{activeThread.name}</h3>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{activeThread.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {activeThread.messages.map((msg) => {
            const isHandler = msg.sender === 'role-handler';
            const isSystem = msg.sender === 'system';
            const isEmail = msg.channel === 'email';
            const isExpanded = expandedEmailId === msg.id;
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-gray-200/50 px-4 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {msg.content} • {msg.time}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isHandler ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex flex-col ${isHandler ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 px-2`}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {isHandler ? 'Handler' : activeThread.role}
                    </span>
                  </div>
                  
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    isHandler 
                      ? msg.channel === 'email' ? 'bg-indigo-800 text-white border border-indigo-900' : 
                        msg.channel === 'sms' ? 'bg-sky-600 text-white' : 'bg-indigo-600 text-white'
                      : msg.channel === 'email' ? 'bg-white border border-indigo-200 text-gray-900' : 
                        msg.channel === 'sms' ? 'bg-white border border-sky-200 text-gray-900' : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      {getChannelIcon(msg.channel)}
                      <span className="text-[9px] font-bold uppercase tracking-wider">{msg.channel}</span>
                    </div>
                    {msg.content}
                    {isEmail && msg.attachments && (
                      <button 
                        onClick={() => toggleEmailExpansion(msg.id)}
                        className="block mt-2 text-xs font-bold underline"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                    )}
                    {isEmail && isExpanded && msg.attachments && (
                      <div className="mt-2 pt-2 border-t border-black/10">
                        <p className="text-xs font-bold mb-1">Attachments:</p>
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <Paperclip className="w-3 h-3" />
                            {att.name} ({att.size})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1.5 px-2">
                    <span className="text-[10px] text-gray-400">{msg.time}</span>
                    {isHandler && msg.status === 'read' && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                    {isHandler && msg.status === 'sent' && <CheckCircle2 className="w-3 h-3 text-gray-300" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
          <div className="flex flex-col gap-3">
            {/* Composer Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Participant</span>
                  <div className="px-3 py-1 bg-gray-100 rounded-md text-xs font-bold text-gray-700">
                    {activeThread.name}
                  </div>
                </div>
                
                {activeThreadId !== 'internal' && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Channel</span>
                    <div className="flex bg-gray-100 p-0.5 rounded-md">
                      {(['whatsapp', 'sms', 'email'] as CommChannel[]).map(ch => (
                        <button
                          key={ch}
                          onClick={() => setSelectedChannel(ch)}
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                            selectedChannel === ch ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
              >
                <ClipboardList className="w-3 h-3" />
                Templates
              </button>
            </div>

            {/* Template Selector */}
            {showTemplates && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {templates.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyTemplate(t.content)}
                    className="shrink-0 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Type a message to ${activeThread.name}...`}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none min-h-[44px] max-h-32"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - SURVEY CONTEXT */}
      <div className="w-80 border-l border-gray-200 flex flex-col bg-white overflow-y-auto">
        {expandedMessage && (
          <div className="p-6 border-b border-gray-200 bg-indigo-50">
            <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-4">Expanded Email</h4>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{expandedMessage.content}</p>
            {expandedMessage.attachments && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-indigo-900">Attachments:</p>
                {expandedMessage.attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                    <Paperclip className="w-3 h-3" />
                    {att.name} ({att.size})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Survey Context</h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Claim Number</p>
              <p className="text-sm font-bold text-gray-900">{survey.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</p>
                <p className="text-xs font-semibold text-gray-700">{survey.vehicle}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Insurer</p>
                <p className="text-xs font-semibold text-gray-700">{survey.insurer}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Garage</p>
                <p className="text-xs font-semibold text-gray-700">{survey.garageName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stage</p>
                <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                  {survey.stage}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Attachments</h4>
          <div className="space-y-2">
            {[
              { name: 'RC_Copy.pdf', type: 'PDF', size: '1.2 MB' },
              { name: 'Damage_Photos.zip', type: 'ZIP', size: '15.4 MB' },
              { name: 'Estimate_V1.xlsx', type: 'XLSX', size: '450 KB' }
            ].map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{file.size}</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all border border-gray-200 hover:border-indigo-200">
              <Plus className="w-4 h-4" />
              Request Documents
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all border border-gray-200 hover:border-indigo-200">
              <Clock className="w-4 h-4" />
              Send Photo Reminder
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all border border-gray-200 hover:border-indigo-200">
              <Share2 className="w-4 h-4" />
              Share Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


