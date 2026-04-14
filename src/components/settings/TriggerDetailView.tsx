import React, { useState } from 'react';
import {
  ArrowLeft, Edit3, Zap, Clock, CheckCircle2, XCircle,
  MessageSquare, Mail, Smartphone, AlertCircle, History
} from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../ui/cn';
import { TriggerDraft, ExecBlock, ChannelCfg, WAChannelCfg, EmailChannelCfg, SMSChannelCfg, EVENT_PAYLOAD_FIELDS } from './TriggerConfigScreen';
import { SystemEvent, STAGE_GROUPS } from '../../data/eventRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuditEntry {
  id:        string;
  timestamp: string;
  actor:     string;
  action:    string;
  field?:    string;
  prevValue?: string;
  newValue?:  string;
}

export interface TriggerRecord {
  id:           string;
  name:         string;
  event:        { display: string; machine: string; stage: string; type: 'realtime' | 'timed' };
  status:       'active' | 'inactive';
  channels:     string[];
  blockCount:   number;
  lastModified: { actor: string; at: string };
  fullConfig?:  TriggerDraft & { event: SystemEvent };
  auditLog?:    AuditEntry[];
}

// ── Static data ───────────────────────────────────────────────────────────────
const STAGE_LABEL: Record<string, string> = {
  intake: 'Survey Create / Intake (Intimation)', evidence: 'Evidence Collection',
  inspection: 'Inspection, Assessment & Repair', settlement: 'Settlement', closing: 'Closing',
};

const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', short: 'WA',    icon: MessageSquare, pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  email:    { label: 'Email',    short: 'Email', icon: Mail,          pill: 'bg-sky-50 text-sky-700 border-sky-200'             },
  sms:      { label: 'SMS',      short: 'SMS',   icon: Smartphone,    pill: 'bg-violet-50 text-violet-700 border-violet-200'    },
} as const;

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d !== 1 ? 's' : ''} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo !== 1 ? 's' : ''} ago`;
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Mock audit log generator ──────────────────────────────────────────────────
function mockAuditLog(trigger: TriggerRecord): AuditEntry[] {
  const base = new Date(trigger.lastModified.at).getTime();
  const created = base - 7 * 24 * 60 * 60 * 1000;
  return [
    { id: 'a1', timestamp: trigger.lastModified.at, actor: trigger.lastModified.actor, action: 'Updated status', field: 'Status', prevValue: 'Inactive', newValue: 'Active' },
    { id: 'a2', timestamp: new Date(base - 1 * 24 * 60 * 60 * 1000).toISOString(), actor: trigger.lastModified.actor, action: 'Added channel', field: 'Channels', prevValue: 'Email', newValue: 'Email, WhatsApp' },
    { id: 'a3', timestamp: new Date(base - 3 * 24 * 60 * 60 * 1000).toISOString(), actor: 'Admin', action: 'Updated trigger name', field: 'Name', prevValue: 'Draft Trigger', newValue: trigger.name },
    { id: 'a4', timestamp: new Date(base - 5 * 24 * 60 * 60 * 1000).toISOString(), actor: 'Admin', action: 'Added Block B', field: 'Blocks', prevValue: '1 block', newValue: '2 blocks' },
    { id: 'a5', timestamp: new Date(created).toISOString(), actor: 'Admin', action: 'Trigger created', field: undefined, prevValue: undefined, newValue: undefined },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
interface TriggerDetailViewProps {
  trigger: TriggerRecord;
  onBack:  () => void;
  onEdit:  () => void;
}

type DetailTab = 'overview' | 'history';

export function TriggerDetailView({ trigger, onBack, onEdit }: TriggerDetailViewProps) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const auditLog = trigger.auditLog ?? mockAuditLog(trigger);

  return (
    <div className="fixed inset-0 bg-white z-[110] flex flex-col font-sans">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-gray-200 shrink-0" />
          <div className="flex items-center gap-2 text-sm min-w-0">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 shrink-0">Event Triggers</button>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900 truncate">{trigger.name}</span>
          </div>
        </div>
        <Button variant="primary" onClick={onEdit}>
          <Edit3 className="w-4 h-4" /> Edit Trigger
        </Button>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6 bg-white shrink-0 flex">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'history',  label: 'History',  },
        ] as { id: DetailTab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('py-3.5 px-4 text-sm font-semibold border-b-2 transition-all',
              tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
            {t.id === 'history' && <History className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        {tab === 'overview' && <OverviewTab trigger={trigger} />}
        {tab === 'history'  && <HistoryTab  auditLog={auditLog} trigger={trigger} />}
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ trigger }: { trigger: TriggerRecord }) {
  const blocks = trigger.fullConfig?.blocks;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
      {/* Basic info */}
      <InfoCard title="Basic Info">
        <InfoGrid>
          <InfoRow label="Trigger Name" value={trigger.name} />
          <InfoRow label="Event">
            <div>
              <p className="text-sm font-semibold text-gray-900">{trigger.event.display}</p>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5">{trigger.event.machine}</p>
            </div>
          </InfoRow>
          <InfoRow label="Stage" value={STAGE_LABEL[trigger.event.stage] ?? trigger.event.stage} />
          <InfoRow label="Type">
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border',
              trigger.event.type === 'realtime' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
              {trigger.event.type === 'realtime' ? <Zap className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              {trigger.event.type === 'realtime' ? 'Realtime' : 'Timed'}
            </span>
          </InfoRow>
          <InfoRow label="Status">
            {trigger.status === 'active'
              ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
              : <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
            }
          </InfoRow>
          <InfoRow label="Last Modified" value={`${trigger.lastModified.actor} · ${formatRelative(trigger.lastModified.at)}`} />
        </InfoGrid>
      </InfoCard>

      {/* Blocks */}
      <InfoCard title={`Execution Blocks (${trigger.blockCount})`}>
        {trigger.blockCount === 0 ? (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No action blocks configured. This trigger will not fire until at least one block is added.
          </div>
        ) : blocks ? (
          <div className="space-y-3">
            {blocks.map((block, i) => <BlockSummary key={block.id} block={block} index={i} />)}
          </div>
        ) : (
          <MockBlocksSummary trigger={trigger} />
        )}
      </InfoCard>
    </div>
  );
}

// ── Block summary (from fullConfig) ──────────────────────────────────────────
function BlockSummary({ block, index }: { key?: string; block: ExecBlock; index: number }) {
  const isDefault = block.blockType === 'default';
  const isTimed   = block.blockType === 'timed-offset';
  const label = isDefault ? 'Block A — Default Action' : isTimed ? `Time Offset Block ${index + 1}` : `Block B — Conditional Action ${index + 1}`;

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', !block.blockEnabled && 'opacity-50 bg-gray-50')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">{label}</span>
          {!block.blockEnabled && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">Disabled</span>}
        </div>
        {block.channels.length > 0 && (
          <div className="flex gap-1">
            {block.channels.map(ch => {
              const m = CHANNEL_META[ch as keyof typeof CHANNEL_META]; if (!m) return null;
              return <span key={ch} className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', m.pill)}>{m.short}</span>;
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        {isTimed && (
          <SummaryItem label="Time Offset" value={`${block.offsetValue} ${block.offsetUnit} ${block.direction} event`} />
        )}
        {!isDefault && (
          <SummaryItem label="Conditions" value={block.conditions.length === 0 ? 'None (always runs)' : `${block.conditions.length} condition${block.conditions.length !== 1 ? 's' : ''}`} />
        )}
        {(isDefault || block.blockType === 'conditional') && (
          <SummaryItem label="Timing" value={block.timing === 'immediate' ? 'Immediate' : `Delayed ${block.delayValue} ${block.delayUnit}`} />
        )}
        <SummaryItem label="Recurring" value={block.hasRecurring ? `Every ${block.repeatValue} ${block.repeatUnit}` : 'Disabled'} />
        <SummaryItem label="Max Sends" value={`${block.maxSends} per survey per party`} />
        <SummaryItem label="Cooldown" value={`${block.cooldownValue} ${block.cooldownUnit}`} />
        {block.stopCondition !== 'none' && (
          <SummaryItem label="Stop Condition" value={block.stopCondition.replace(/_/g, ' ')} />
        )}
      </div>

      {/* Channel details */}
      {block.channels.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-1.5">
          {block.channels.map(ch => {
            const cfg = block.channelCfgs[ch as keyof typeof block.channelCfgs];
            return <ChannelSummaryRow key={ch} channel={ch} cfg={cfg} />;
          })}
        </div>
      )}
    </div>
  );
}

// ── Channel summary row ───────────────────────────────────────────────────────
function ChannelSummaryRow({ channel, cfg }: { key?: string; channel: string; cfg: ChannelCfg | undefined }) {
  const m = CHANNEL_META[channel as keyof typeof CHANNEL_META];
  if (!m || !cfg) return null;
  const Icon = m.icon;

  let recipientStr = '—';
  let templateStr  = '—';

  if (channel === 'whatsapp') {
    const c = cfg as WAChannelCfg;
    recipientStr = c.recipients.length ? c.recipients.join(', ') : 'None';
    templateStr  = c.templateId || 'None selected';
  } else if (channel === 'email') {
    const c = cfg as EmailChannelCfg;
    recipientStr = c.to.length ? c.to.join(', ') : 'None';
    templateStr  = c.subject ? `"${c.subject.slice(0, 40)}${c.subject.length > 40 ? '…' : ''}"` : 'No subject';
  } else {
    const c = cfg as SMSChannelCfg;
    recipientStr = c.recipients.length ? c.recipients.join(', ') : 'None';
    templateStr  = c.templateMode === 'freetext' ? 'Free-text' : c.templateId || 'None selected';
  }

  return (
    <div className="flex items-start gap-3 text-xs">
      <div className={cn('flex items-center gap-1 font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5', m.pill)}>
        <Icon className="w-3 h-3" /> {m.short}
      </div>
      <div className="space-y-0.5">
        <p className="text-gray-600"><span className="text-gray-400">Recipients:</span> {recipientStr}</p>
        <p className="text-gray-600"><span className="text-gray-400">Template:</span> {templateStr}</p>
      </div>
    </div>
  );
}

// ── Mock blocks (for existing triggers without fullConfig) ────────────────────
function MockBlocksSummary({ trigger }: { trigger: TriggerRecord }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: trigger.blockCount }, (_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800">
              {i === 0 && trigger.event.type === 'realtime' ? 'Block A — Default Action' : `Block ${String.fromCharCode(65 + i)}`}
            </span>
            {trigger.channels.length > 0 && (
              <div className="flex gap-1">
                {trigger.channels.map(ch => {
                  const m = CHANNEL_META[ch as keyof typeof CHANNEL_META]; if (!m) return null;
                  return <span key={ch} className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', m.pill)}>{m.short}</span>;
                })}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 italic">Full block configuration available after editing.</p>
        </div>
      ))}
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────
function HistoryTab({ auditLog, trigger }: { auditLog: AuditEntry[]; trigger: TriggerRecord }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
      {/* Metadata */}
      <InfoCard title="Audit Metadata">
        <InfoGrid>
          <InfoRow label="Created by" value="Admin" />
          <InfoRow label="Created at" value={formatTs(new Date(new Date(trigger.lastModified.at).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())} />
          <InfoRow label="Last modified by" value={trigger.lastModified.actor} />
          <InfoRow label="Last modified at" value={formatTs(trigger.lastModified.at)} />
        </InfoGrid>
      </InfoCard>

      {/* Change log */}
      <InfoCard title="Change History">
        <div className="space-y-0">
          {auditLog.map((entry, i) => (
            <div key={entry.id} className={cn('flex gap-4 py-3.5', i !== auditLog.length - 1 && 'border-b border-gray-100')}>
              {/* Timeline dot */}
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                {i !== auditLog.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1.5" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{entry.action}</p>
                    {entry.field && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium">{entry.field}:</span>{' '}
                        {entry.prevValue && <span className="line-through text-gray-400">{entry.prevValue}</span>}
                        {entry.prevValue && entry.newValue && ' → '}
                        {entry.newValue && <span className="text-gray-700">{entry.newValue}</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-gray-700">{entry.actor}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatTs(entry.timestamp)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
          Change history is append-only. Entries cannot be edited or deleted.
        </p>
      </InfoCard>
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">{children}</div>;
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      {children ?? <p className="text-sm text-gray-900">{value ?? '—'}</p>}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
