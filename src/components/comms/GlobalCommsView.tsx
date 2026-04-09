import React, { useState } from 'react';
import { Survey, CommThread, CommMessage, CommChannel, UntaggedConversation, GhostFlowState } from '../../types';
import { CommunicationTab } from '../tabs/CommunicationTab';
import { PersonCommsModal } from './PersonCommsModal';
import { defaultCommTemplates } from '../../data/commTemplates';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Search, MessageSquare, AlertCircle, BarChart2,
  Inbox, Tag, XCircle, Clock, CheckCircle2, ChevronRight, User, Smartphone
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildThreadsFromSurvey(survey: Survey): CommThread[] {
  if (survey.threads && survey.threads.length > 0) return survey.threads;
  const now = new Date().toISOString();
  return (
    [
      survey.customerName && { role: 'insured' as const, name: survey.customerName, mobile: survey.customerPhone },
      survey.garageName   && { role: 'garage'   as const, name: survey.garageName,   mobile: survey.garageContact },
      survey.surveyor     && { role: 'surveyor'  as const, name: survey.surveyor,      mobile: survey.surveyorPhone, email: survey.surveyorEmail },
      survey.insurer      && { role: 'insurer'   as const, name: survey.insurer,        email: survey.insurerEmail },
      { role: 'internal' as const, name: 'Internal Notes' },
    ] as const
  ).filter(Boolean).map(p => ({
    id: `${survey.id}:${p!.role}`,
    surveyId: survey.id,
    party: { role: p!.role, name: p!.name, mobile: (p as any).mobile, email: (p as any).email },
    messages: [],
    unreadCount: 0,
    lastActivityAt: now,
    threadStatus: 'active' as const,
  }));
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Mock untagged conversations seed ─────────────────────────────────────────
const MOCK_UNTAGGED: UntaggedConversation[] = [
  {
    id: 'unt-001',
    channel: 'whatsapp',
    senderIdentifier: '+91 98765 43210',
    ghostFlowState: 'awaiting_tagging',
    collectedVehicleNo: 'MH12AB1234',
    collectedClaimNo: 'CLM-2025-8821',
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    messages: [
      { id: 'u1', channel: 'whatsapp', sender: 'system', content: 'Hi! Please share your Vehicle Registration Number to get started.', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
      { id: 'u2', channel: 'whatsapp', sender: 'participant', content: 'MH12AB1234', timestamp: new Date(Date.now() - 19 * 60000).toISOString() },
      { id: 'u3', channel: 'whatsapp', sender: 'system', content: 'Thank you! Now please share your Claim Number.', timestamp: new Date(Date.now() - 19 * 60000).toISOString() },
      { id: 'u4', channel: 'whatsapp', sender: 'participant', content: 'CLM-2025-8821', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
    ],
  },
  {
    id: 'unt-002',
    channel: 'sms',
    senderIdentifier: '+91 91234 56789',
    ghostFlowState: 'collecting_claim_no',
    collectedVehicleNo: 'KA05CD5678',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    messages: [
      { id: 'u5', channel: 'sms', sender: 'system', content: 'Hi! Please share your Vehicle Registration Number.', timestamp: new Date(Date.now() - 6 * 60000).toISOString() },
      { id: 'u6', channel: 'sms', sender: 'participant', content: 'KA05CD5678', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 'u7', channel: 'sms', sender: 'system', content: 'Got it! Now please share your Claim Number.', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    ],
  },
  {
    id: 'unt-003',
    channel: 'email',
    senderIdentifier: 'manager@quickfixmotors.com',
    ghostFlowState: 'awaiting_tagging',
    collectedVehicleNo: 'MH02XY9999',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    messages: [
      { 
        id: 'u8', 
        channel: 'email', 
        sender: 'participant', 
        senderName: 'QuickFix Motors',
        subject: 'Supplement Request for MH02XY9999',
        content: 'Hello Zoop team,\n\nWe have received the vehicle MH02XY9999. Can you please link this to the appropriate claim and approve the supplement attached?\n\nRegards,\nQuickFix Motors', 
        timestamp: new Date(Date.now() - 60 * 60000).toISOString() 
      },
    ],
  },
];

const GHOST_STATE_LABELS: Record<GhostFlowState, { label: string; color: string }> = {
  collecting_vehicle_no: { label: 'Collecting Vehicle No', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  collecting_claim_no:   { label: 'Collecting Claim No',   color: 'text-sky-600 bg-sky-50 border-sky-200'       },
  awaiting_tagging:      { label: 'Ready to Tag',          color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  tagged:                { label: 'Tagged',                 color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  dismissed:             { label: 'Dismissed',              color: 'text-gray-500 bg-gray-50 border-gray-200'    },
};

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
interface GlobalCommsViewProps {
  surveys: Survey[];
  onUpdateSurvey: (survey: Survey) => void;
}

type SubView = 'surveys' | 'untagged' | 'dashboard';

export function GlobalCommsView({ surveys, onUpdateSurvey }: GlobalCommsViewProps) {
  const [subView, setSubView] = useState<SubView>('surveys');
  const [personModalIdentifier, setPersonModalIdentifier] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Sub-nav */}
      <div className="flex border-b border-gray-200 px-6 shrink-0 bg-white">
        {([
          { id: 'surveys',   label: 'Surveys',   Icon: MessageSquare },
          { id: 'untagged',  label: 'Untagged',  Icon: Inbox,        badge: MOCK_UNTAGGED.filter(u => u.ghostFlowState === 'awaiting_tagging').length },
          { id: 'dashboard', label: 'Dashboard', Icon: BarChart2     },
        ] as { id: SubView; label: string; Icon: React.ElementType; badge?: number }[]).map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            onClick={() => setSubView(id)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              subView === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge! > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {subView === 'surveys'   && <SurveysSubView surveys={surveys} onUpdateSurvey={onUpdateSurvey} onPersonClick={setPersonModalIdentifier} />}
        {subView === 'untagged'  && <UntaggedSubView surveys={surveys} onUpdateSurvey={onUpdateSurvey} />}
        {subView === 'dashboard' && <DashboardSubView surveys={surveys} />}
      </div>

      {personModalIdentifier && (
        <PersonCommsModal
          identifier={personModalIdentifier}
          surveys={surveys}
          onClose={() => setPersonModalIdentifier(null)}
        />
      )}
    </div>
  );
}

// ── Surveys sub-view ──────────────────────────────────────────────────────────
function SurveysSubView({ surveys, onUpdateSurvey, onPersonClick }: { surveys: Survey[]; onUpdateSurvey: (s: Survey) => void; onPersonClick: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  const filtered = surveys.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q || s.id.toLowerCase().includes(q) || s.vehicle.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) || s.claimNo.toLowerCase().includes(q);
  });

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);

  const handleSelectSurvey = (survey: Survey) => {
    setSelectedSurveyId(survey.id);
  };

  return (
    <div className="flex h-full">
      {/* Survey list */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50/30 shrink-0">
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search surveys…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(survey => {
            const isSelected = selectedSurveyId === survey.id;
            return (
              <button
                key={survey.id}
                onClick={() => handleSelectSurvey(survey)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-all ${
                  isSelected ? 'bg-white border-l-2 border-l-indigo-600' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-600 truncate">{survey.id}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{survey.vehicle}</p>
                    <p className="text-xs text-gray-500 truncate">{survey.customerName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className="text-[10px] text-gray-400">
                      {formatRelative(survey.lastUpdated)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">No surveys match your search</div>
          )}
        </div>
      </div>

      {/* Communication Output */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/10">
        {selectedSurvey ? (
          <CommunicationTab survey={selectedSurvey} onUpdateSurvey={onUpdateSurvey} onPersonClick={onPersonClick} />
        ) : (
          <EmptyState
            icon={<MessageSquare className="w-10 h-10 text-gray-200" />}
            title="Select a survey"
            desc="Choose a survey from the left to start messaging"
          />
        )}
      </div>
    </div>
  );
}

// ── Untagged sub-view ─────────────────────────────────────────────────────────
function UntaggedSubView({ surveys, onUpdateSurvey }: { surveys: Survey[], onUpdateSurvey: (s: Survey) => void }) {
  const [conversations, setConversations] = useState<UntaggedConversation[]>(MOCK_UNTAGGED);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taggingSurveySearch, setTaggingSurveySearch] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);

  const selected = conversations.find(c => c.id === selectedId);
  const active = conversations.filter(c => c.ghostFlowState !== 'tagged' && c.ghostFlowState !== 'dismissed');

  const handleTag = (surveyId: string) => {
    if (!selected) return;

    // Apply to survey
    const targetSurvey = surveys.find(s => s.id === surveyId);
    if (targetSurvey) {
      if (selected.channel === 'email') {
        const emailTickets = targetSurvey.emailTickets ? [...targetSurvey.emailTickets] : [];
        emailTickets.push({
          id: `ticket-tagged-${Date.now()}`,
          surveyId: targetSurvey.id,
          subject: selected.messages[0]?.subject || 'Inbound Untagged Request',
          updatedAt: new Date().toISOString(),
          participants: [{ role: 'garage', name: selected.senderIdentifier, email: selected.senderIdentifier, type: 'to' }],
          status: 'open',
          messages: selected.messages.map(m => ({
             ...m,
             senderName: m.senderName || selected.senderIdentifier
          })),
          unreadCount: 1
        });
        onUpdateSurvey({ ...targetSurvey, emailTickets });
      } else {
        const threads = targetSurvey.threads ? [...targetSurvey.threads] : [];
        if (threads.length === 0) {
           threads.push({
             id: `${targetSurvey.id}:insured`,
             surveyId: targetSurvey.id,
             party: { role: 'insured', name: targetSurvey.customerName || selected.senderIdentifier, mobile: selected.senderIdentifier },
             messages: selected.messages,
             threadStatus: 'active',
             unreadCount: 1
           });
        } else {
           threads[0].messages = [...threads[0].messages, ...selected.messages];
        }
        onUpdateSurvey({ ...targetSurvey, threads });
      }
    }

    setConversations(prev => prev.map(c =>
      c.id !== selectedId ? c : { ...c, ghostFlowState: 'tagged', taggedToSurveyId: surveyId, taggedAt: new Date().toISOString() }
    ));
    setShowTagModal(false);
    setSelectedId(null);
    toast.success(`Conversation tagged to ${surveyId}`);
  };

  const handleDismiss = (id: string) => {
    setConversations(prev => prev.map(c =>
      c.id !== id ? c : { ...c, ghostFlowState: 'dismissed' }
    ));
    if (selectedId === id) setSelectedId(null);
    toast.success('Conversation dismissed');
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/30 shrink-0">
        <div className="p-4 border-b border-gray-200 bg-white">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Untagged Inbound</p>
          <p className="text-xs text-gray-500">{active.length} conversation{active.length !== 1 ? 's' : ''} awaiting action</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {active.map(conv => {
            const stateInfo = GHOST_STATE_LABELS[conv.ghostFlowState];
            const isSelected = selectedId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-all ${
                  isSelected ? 'bg-white border-l-2 border-l-indigo-600' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">{conv.senderIdentifier}</span>
                  <span className="text-[10px] text-gray-400">{formatRelative(conv.createdAt)}</span>
                </div>
                <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${stateInfo.color}`}>
                  {stateInfo.label}
                </span>
                {conv.collectedVehicleNo && (
                  <p className="text-[11px] text-gray-500 mt-1.5">Vehicle: {conv.collectedVehicleNo}</p>
                )}
                {conv.collectedClaimNo && (
                  <p className="text-[11px] text-gray-500">Claim: {conv.collectedClaimNo}</p>
                )}
              </button>
            );
          })}
          {active.length === 0 && (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">All caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selected ? (
          <>
            {/* Ghost flow state banner */}
            <div className={`px-6 py-3 border-b border-gray-200 flex items-center justify-between shrink-0 ${
              selected.ghostFlowState === 'awaiting_tagging' ? 'bg-indigo-50' : 'bg-amber-50'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 ${selected.ghostFlowState === 'awaiting_tagging' ? 'text-indigo-500' : 'text-amber-500'}`} />
                <span className="text-xs font-bold text-gray-700">
                  {GHOST_STATE_LABELS[selected.ghostFlowState].label}
                </span>
                {selected.collectedVehicleNo && (
                  <span className="text-xs text-gray-500">· Vehicle: <strong>{selected.collectedVehicleNo}</strong></span>
                )}
                {selected.collectedClaimNo && (
                  <span className="text-xs text-gray-500">· Claim: <strong>{selected.collectedClaimNo}</strong></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTagModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" /> Tag to Survey
                </button>
                <button
                  onClick={() => handleDismiss(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50/30">
              {selected.messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map(msg => {
                const isBot = msg.sender === 'system';
                return (
                  <div key={msg.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isBot ? 'bg-white border border-gray-200 text-gray-900' : 'bg-gray-900 text-white'
                    }`}>
                      {!isBot && (
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Unknown Sender</p>
                      )}
                      {isBot && (
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-1">Bot</p>
                      )}
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Inbox className="w-10 h-10 text-gray-200" />}
            title="Select a conversation"
            desc="Choose an untagged conversation to review and tag it to a survey"
          />
        )}
      </div>

      {/* Tag modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Tag to Survey</h3>
              <p className="text-xs text-gray-500 mt-0.5">Search and select the survey to link this conversation to</p>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Claim No, Vehicle, or Customer…"
                  value={taggingSurveySearch}
                  onChange={e => setTaggingSurveySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {surveys
                  .filter(s => {
                    const q = taggingSurveySearch.toLowerCase();
                    return !q || s.id.toLowerCase().includes(q) || s.claimNo.toLowerCase().includes(q) ||
                      s.vehicle.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q);
                  })
                  .slice(0, 10)
                  .map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleTag(s.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors group"
                    >
                      <div className="text-left">
                        <p className="text-xs font-bold text-indigo-600">{s.id}</p>
                        <p className="text-sm font-semibold text-gray-900">{s.vehicle}</p>
                        <p className="text-xs text-gray-500">{s.customerName}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTagModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard sub-view ────────────────────────────────────────────────────────
function DashboardSubView({ surveys }: { surveys: Survey[] }) {
  const totalThreads = surveys.reduce((acc, s) => acc + (s.threads?.length ?? 5), 0);
  const totalMessages = surveys.reduce((acc, s) => acc + (s.threads?.reduce((a, t) => a + t.messages.length, 0) ?? 0), 0);

  return (
    <div className="p-8 overflow-y-auto h-full">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Communication Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Surveys with Comms', value: surveys.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Active Threads', value: totalThreads, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Messages', value: totalMessages, color: 'bg-sky-50 text-sky-700' },
          { label: 'Untagged Inbound', value: MOCK_UNTAGGED.filter(u => u.ghostFlowState === 'awaiting_tagging').length, color: 'bg-amber-50 text-amber-700' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl p-5 ${stat.color.split(' ')[0]}`}>
            <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
        <BarChart2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-500">Detailed comms analytics coming soon</p>
        <p className="text-xs text-gray-400 mt-1">Response time, channel distribution, and volume trends</p>
      </div>
    </div>
  );
}

// ── Empty state helper ─────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{desc}</p>
    </div>
  );
}
