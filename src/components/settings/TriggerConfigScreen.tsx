import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Zap, Clock, AlertCircle, MessageSquare, Mail, Smartphone,
  X, ChevronUp, Eye, Send, MoreVertical, Power, Bold, Italic,
  List, Link, Hash
} from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../ui/cn';
import { SystemEvent } from '../../data/eventRegistry';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
export type TriggerChannel = 'whatsapp' | 'email' | 'sms';
type OffsetUnit   = 'minutes' | 'hours' | 'days';
type LogicOp      = 'AND' | 'OR';
type CondField    = 'claim_type' | 'vehicle_type' | 'vehicle_class' | 'hypothecation' | 'stage' | 'party_type';
type CondOperator = 'eq' | 'neq' | 'contains' | 'empty' | 'not_empty';
type StopCond     = 'document_submitted' | 'payment_made' | 'offer_accepted' | 'survey_closed' | 'none';

// Per-channel config types
export interface WAChannelCfg {
  recipients:     string[];
  templateId:     string;
  placeholderMap: Record<string, string>;
}

export interface EmailChannelCfg {
  fromDisplay: string;
  replyTo:     string;
  to:          string[];
  showCcBcc:   boolean;
  cc:          string[];
  bcc:         string[];
  subject:     string;
  body:        string;
  placeholderMap: Record<string, string>;
}

export interface SMSChannelCfg {
  recipients:   string[];
  templateMode: 'approved' | 'freetext';
  templateId:   string;
  freeText:     string;
  placeholderMap: Record<string, string>;
}

export type ChannelCfg = WAChannelCfg | EmailChannelCfg | SMSChannelCfg;

export interface ConditionRow {
  id:       string;
  field:    CondField;
  operator: CondOperator;
  value:    string;
  logic:    LogicOp;
}

export interface ExecBlock {
  id:           string;
  blockType:    'default' | 'conditional' | 'timed-offset';
  blockEnabled: boolean;
  collapsed:    boolean;
  // Timed-offset
  direction:    'before' | 'after';
  offsetValue:  number;
  offsetUnit:   OffsetUnit;
  // Conditions
  conditions:   ConditionRow[];
  // Timing (realtime blocks)
  timing:       'immediate' | 'delayed';
  delayValue:   number;
  delayUnit:    OffsetUnit;
  // Recurring
  hasRecurring:  boolean;
  repeatValue:   number;
  repeatUnit:    OffsetUnit;
  // Suppression
  maxSends:      number;
  cooldownValue: number;
  cooldownUnit:  OffsetUnit;
  stopCondition: StopCond;
  // Channels
  channels:     TriggerChannel[];
  channelCfgs:  Partial<Record<TriggerChannel, ChannelCfg>>;
}

export interface TriggerDraft {
  name:        string;
  description: string;
  status:      'active' | 'inactive';
  blocks:      ExecBlock[];
}

// ── Static config ─────────────────────────────────────────────────────────────
const COND_FIELDS: { value: CondField; label: string }[] = [
  { value: 'claim_type',    label: 'Claim Type'    },
  { value: 'vehicle_type',  label: 'Vehicle Type'  },
  { value: 'vehicle_class', label: 'Vehicle Class' },
  { value: 'hypothecation', label: 'Hypothecation' },
  { value: 'stage',         label: 'Stage'         },
  { value: 'party_type',    label: 'Party Type'    },
];

const COND_OPERATORS: { value: CondOperator; label: string }[] = [
  { value: 'eq',        label: 'Equal To'     },
  { value: 'neq',       label: 'Not Equal To' },
  { value: 'contains',  label: 'Contains'     },
  { value: 'empty',     label: 'Is Empty'     },
  { value: 'not_empty', label: 'Is Not Empty' },
];

const COND_VALUES: Record<CondField, string[]> = {
  claim_type:    ['Own Damage', 'Theft', 'Third Party', 'Comprehensive'],
  vehicle_type:  ['Car', 'Two-Wheeler', 'Commercial Vehicle', 'Tractor'],
  vehicle_class: ['Private', 'Commercial', 'Agricultural'],
  hypothecation: ['Yes', 'No'],
  stage:         ['Intimation', 'Evidence', 'Inspection', 'Assessment', 'Settlement', 'Closed'],
  party_type:    ['Insured', 'Surveyor', 'Garage', 'Insurer', 'Handler'],
};

const STOP_CONDITIONS: { value: StopCond; label: string }[] = [
  { value: 'none',               label: 'None (no stop condition)'  },
  { value: 'document_submitted', label: 'Document Submitted'        },
  { value: 'payment_made',       label: 'Payment Made'              },
  { value: 'offer_accepted',     label: 'Offer Accepted'            },
  { value: 'survey_closed',      label: 'Survey Closed'             },
];

const PARTY_ROLES = ['Insured', 'Surveyor', 'Garage', 'Insurer', 'Handler', 'Manager'];

const CHANNEL_META: Record<TriggerChannel, { label: string; short: string; icon: React.ElementType; hdr: string; pill: string; border: string }> = {
  whatsapp: { label: 'WhatsApp', short: 'WA',    icon: MessageSquare, hdr: 'bg-emerald-50 border-emerald-200', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-200' },
  email:    { label: 'Email',    short: 'Email', icon: Mail,          hdr: 'bg-sky-50 border-sky-200',         pill: 'bg-sky-50 text-sky-700 border-sky-200',             border: 'border-sky-200'    },
  sms:      { label: 'SMS',      short: 'SMS',   icon: Smartphone,    hdr: 'bg-violet-50 border-violet-200',   pill: 'bg-violet-50 text-violet-700 border-violet-200',    border: 'border-violet-200' },
};

// ── Templates & payload fields ────────────────────────────────────────────────
const WA_TEMPLATES = [
  { id: 'wa-001', name: 'Claim Registration Confirmation', content: 'Hi {{customer_name}}, your claim {{claim_no}} for vehicle {{vehicle_no}} has been registered. Your surveyor will contact you shortly.', placeholders: ['customer_name', 'claim_no', 'vehicle_no'] },
  { id: 'wa-002', name: 'Document Upload Request',         content: 'Dear {{customer_name}}, we need {{document_type}} for claim {{claim_no}}. Upload here: {{upload_link}} (valid 48 hrs)',                placeholders: ['customer_name', 'document_type', 'claim_no', 'upload_link'] },
  { id: 'wa-003', name: 'Surveyor Assignment Notice',      content: 'Hello {{customer_name}}, {{surveyor_name}} has been assigned for claim {{claim_no}}. Expected visit: {{inspection_date}}.',            placeholders: ['customer_name', 'surveyor_name', 'claim_no', 'inspection_date'] },
  { id: 'wa-004', name: 'Settlement Confirmation',         content: 'Dear {{customer_name}}, claim {{claim_no}} approved for ₹{{settlement_amount}}. Amount will be disbursed within 3 working days.',     placeholders: ['customer_name', 'claim_no', 'settlement_amount'] },
];

const SMS_TEMPLATES = [
  { id: 'sms-001', name: 'Claim Intimation Alert',  content: 'Claim {{claim_no}} registered for {{vehicle_no}}. Track: {{portal_link}}',              placeholders: ['claim_no', 'vehicle_no', 'portal_link'] },
  { id: 'sms-002', name: 'Reminder Alert',          content: 'Action pending on claim {{claim_no}}. Login: {{portal_link}}',                           placeholders: ['claim_no', 'portal_link'] },
  { id: 'sms-003', name: 'Payment Notification',    content: '₹{{amount}} credited for claim {{claim_no}}. Ref: {{txn_ref}}',                          placeholders: ['amount', 'claim_no', 'txn_ref'] },
];

export const EVENT_PAYLOAD_FIELDS = [
  { value: 'survey.customer_name',   label: 'Customer Name'          },
  { value: 'survey.claim_no',        label: 'Claim Number'           },
  { value: 'survey.vehicle_no',      label: 'Vehicle Number'         },
  { value: 'survey.insurer_name',    label: 'Insurer Name'           },
  { value: 'survey.surveyor_name',   label: 'Surveyor Name'          },
  { value: 'survey.garage_name',     label: 'Garage Name'            },
  { value: 'survey.upload_link',     label: 'Document Upload Link'   },
  { value: 'survey.inspection_date', label: 'Inspection Date'        },
  { value: 'survey.settlement_amount', label: 'Settlement Amount'    },
  { value: 'survey.portal_link',     label: 'Portal Link'            },
  { value: 'event.timestamp',        label: 'Event Timestamp'        },
];

// ── Factory helpers ───────────────────────────────────────────────────────────
let _id = 1;
const uid = () => `${Date.now()}-${_id++}`;

function defaultWACfg(): WAChannelCfg    { return { recipients: [], templateId: '', placeholderMap: {} }; }
function defaultEmailCfg(): EmailChannelCfg { return { fromDisplay: 'ClaimFlow Notifications', replyTo: 'claims@zoop.one', to: [], showCcBcc: false, cc: [], bcc: [], subject: '', body: '', placeholderMap: {} }; }
function defaultSMSCfg(): SMSChannelCfg  { return { recipients: [], templateMode: 'approved', templateId: '', freeText: '', placeholderMap: {} }; }

function defaultCfg(ch: TriggerChannel): ChannelCfg {
  return ch === 'whatsapp' ? defaultWACfg() : ch === 'email' ? defaultEmailCfg() : defaultSMSCfg();
}

function defaultBlock(type: ExecBlock['blockType']): ExecBlock {
  return {
    id: uid(), blockType: type, blockEnabled: true, collapsed: false,
    direction: 'before', offsetValue: 1, offsetUnit: 'days',
    conditions: [],
    timing: 'immediate', delayValue: 30, delayUnit: 'minutes',
    hasRecurring: false, repeatValue: 1, repeatUnit: 'days',
    maxSends: 3, cooldownValue: 24, cooldownUnit: 'hours', stopCondition: 'none',
    channels: [], channelCfgs: {},
  };
}

function defaultCond(): ConditionRow {
  return { id: uid(), field: 'claim_type', operator: 'eq', value: 'Own Damage', logic: 'AND' };
}

function condSummary(conditions: ConditionRow[]): string {
  if (!conditions.length) return 'No conditions — runs on every occurrence';
  return conditions.slice(0, 2).map((c, i) =>
    `${COND_FIELDS.find(f => f.value === c.field)?.label} ${COND_OPERATORS.find(o => o.value === c.operator)?.label} "${c.value}"`
    + (i < conditions.length - 1 ? ` ${c.logic}` : '')
  ).join(' ') + (conditions.length > 2 ? ` +${conditions.length - 2} more` : '');
}

// ══════════════════════════════════════════════════════════════════════════════
// Main screen
// ══════════════════════════════════════════════════════════════════════════════
interface TriggerConfigScreenProps {
  event:     SystemEvent;
  existing?: TriggerDraft;          // passed when editing
  onBack:    () => void;
  onSave:    (draft: TriggerDraft & { event: SystemEvent }) => void;
}

export function TriggerConfigScreen({ event, existing, onBack, onSave }: TriggerConfigScreenProps) {
  const isRealtime = event.type === 'realtime';

  const [name,        setName]        = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [status,      setStatus]      = useState<'active' | 'inactive'>(existing?.status ?? 'inactive');
  const [blocks,      setBlocks]      = useState<ExecBlock[]>(() =>
    existing?.blocks ?? (isRealtime ? [defaultBlock('default')] : [])
  );
  const [nameError, setNameError] = useState(false);

  const STAGE_LABEL: Record<string, string> = {
    intake: 'Survey Create / Intake', evidence: 'Evidence Collection',
    inspection: 'Inspection, Assessment & Repair', settlement: 'Settlement', closing: 'Closing',
  };

  const updateBlock    = (id: string, patch: Partial<ExecBlock>) =>
    setBlocks(prev => prev.map(b => b.id !== id ? b : { ...b, ...patch }));
  const toggleCollapse = (id: string) =>
    setBlocks(prev => prev.map(b => b.id !== id ? b : { ...b, collapsed: !b.collapsed }));
  const deleteBlock    = (id: string) => setBlocks(prev => prev.filter(b => b.id !== id));

  const handleSave = () => {
    if (!name.trim()) { setNameError(true); return; }
    onSave({ name, description, status, blocks, event });
    toast.success('Trigger saved');
  };

  return (
    <div className="fixed inset-0 bg-white z-[110] flex flex-col font-sans">
      {/* Top bar */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-gray-200 shrink-0" />
          <div className="flex items-center gap-2 text-sm min-w-0">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 shrink-0">Event Triggers</button>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900 truncate">{name.trim() || 'New Trigger'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" onClick={onBack}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Trigger</Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* ── Basic Info ── */}
          <Section title="Basic Info">
            <div className="space-y-4">
              <FormField label="Trigger Name" required error={nameError ? 'Trigger name is required' : undefined}>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setNameError(false); }}
                  placeholder="e.g. New Claim Welcome Message"
                  className={cn('w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none transition-all',
                    nameError ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500')} />
              </FormField>

              <FormField label="Description" hint="Optional">
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what this trigger does…" rows={2}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all" />
              </FormField>

              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">Defaults to Inactive — activate when ready to go live</p>
                </div>
                <Toggle checked={status === 'active'} onChange={() => setStatus(s => s === 'active' ? 'inactive' : 'active')}
                  label={status === 'active' ? 'Active' : 'Inactive'} labelColor={status === 'active' ? 'text-emerald-600' : 'text-gray-400'} />
              </div>

              <FormField label="Event">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{event.display}</p>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">{event.machine}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{STAGE_LABEL[event.stage]}</p>
                  </div>
                  <TypeBadge type={event.type} />
                  <span className="text-xs text-gray-400 italic shrink-0">Read-only</span>
                </div>
              </FormField>
            </div>
          </Section>

          {/* ── Execution Blocks ── */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-900">Execution Blocks</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isRealtime
                  ? 'Block A always runs. Add conditional blocks for rule-based actions.'
                  : 'Each timed offset block fires independently on its schedule.'}
              </p>
            </div>
            <div className="space-y-3">
              {blocks.map((block, i) => (
                <BlockCard key={block.id} block={block} index={i} isRealtime={isRealtime}
                  canDelete={block.blockType !== 'default'}
                  onUpdate={p => updateBlock(block.id, p)}
                  onToggleCollapse={() => toggleCollapse(block.id)}
                  onDelete={() => deleteBlock(block.id)} />
              ))}
              <button onClick={() => setBlocks(p => [...p, defaultBlock(isRealtime ? 'conditional' : 'timed-offset')])}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all">
                <Plus className="w-4 h-4" />
                {isRealtime ? 'Add Conditional Block' : 'Add Time Offset Block'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Block Card
// ══════════════════════════════════════════════════════════════════════════════
function BlockCard({ block, index, isRealtime, canDelete, onUpdate, onToggleCollapse, onDelete }: {
  key?: string;
  block: ExecBlock; index: number; isRealtime: boolean; canDelete: boolean;
  onUpdate: (p: Partial<ExecBlock>) => void; onToggleCollapse: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const isDefault  = block.blockType === 'default';
  const isTimed    = block.blockType === 'timed-offset';
  const isDisabled = !block.blockEnabled;

  const blockLabel = isDefault ? 'Block A — Default Action'
    : isTimed ? `Time Offset Block ${index + 1}`
    : `Block B — Conditional Action ${index + 1}`;

  const hdrCls = isDefault ? 'bg-indigo-50 border-indigo-100'
    : isTimed   ? 'bg-amber-50 border-amber-100'
    : 'bg-gray-50 border-gray-100';

  const addCond    = () => onUpdate({ conditions: [...block.conditions, defaultCond()] });
  const updateCond = (id: string, p: Partial<ConditionRow>) =>
    onUpdate({ conditions: block.conditions.map(c => c.id !== id ? c : { ...c, ...p }) });
  const deleteCond = (id: string) =>
    onUpdate({ conditions: block.conditions.filter(c => c.id !== id) });

  const toggleChannel = (ch: TriggerChannel) => {
    if (block.channels.includes(ch)) {
      if (!window.confirm(`Remove ${CHANNEL_META[ch].label}? Its configuration will be discarded.`)) return;
      const cfgs = { ...block.channelCfgs }; delete cfgs[ch];
      onUpdate({ channels: block.channels.filter(c => c !== ch), channelCfgs: cfgs });
    } else {
      onUpdate({ channels: [...block.channels, ch], channelCfgs: { ...block.channelCfgs, [ch]: defaultCfg(ch) } });
    }
  };

  const updateChannelCfg = (ch: TriggerChannel, cfg: ChannelCfg) =>
    onUpdate({ channelCfgs: { ...block.channelCfgs, [ch]: cfg } });

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm', isDisabled && 'opacity-60')}>
      {/* Header */}
      <div className={cn('flex items-center justify-between px-4 py-3 border-b', hdrCls)}>
        <button onClick={onToggleCollapse} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          {block.collapsed ? <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">{blockLabel}</span>
              {isDisabled && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">Disabled</span>}
            </div>
            {block.collapsed && !isDefault && block.conditions.length > 0 && (
              <p className="text-[11px] text-gray-500 truncate max-w-md mt-0.5">{condSummary(block.conditions)}</p>
            )}
            {block.collapsed && isTimed && (
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">{block.offsetValue} {block.offsetUnit} {block.direction} event</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {block.channels.length > 0 && (
            <div className="flex gap-1 mr-1">
              {block.channels.map(ch => (
                <span key={ch} className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', CHANNEL_META[ch].pill)}>
                  {CHANNEL_META[ch].short}
                </span>
              ))}
            </div>
          )}
          {/* Three-dot menu */}
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                <MenuBtn icon={<Power className="w-3.5 h-3.5" />}
                  label={block.blockEnabled ? 'Disable Block' : 'Enable Block'}
                  onClick={() => { setMenuOpen(false); onUpdate({ blockEnabled: !block.blockEnabled }); }} />
                {canDelete && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <MenuBtn icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete Block" danger
                      onClick={() => { setMenuOpen(false); onDelete(); }} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {!block.collapsed && (
        <div className="p-4 space-y-5">
          {/* Timed offset config */}
          {isTimed && (
            <FieldGroup label="Time Offset">
              <div className="flex items-center gap-2 flex-wrap">
                <NativeSelect value={block.direction} onChange={v => onUpdate({ direction: v as 'before' | 'after' })}
                  options={[{ value: 'before', label: 'Before' }, { value: 'after', label: 'After' }]} />
                <NumInput value={block.offsetValue} onChange={v => onUpdate({ offsetValue: v })} min={1} />
                <NativeSelect value={block.offsetUnit} onChange={v => onUpdate({ offsetUnit: v as OffsetUnit })}
                  options={[{ value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }]} />
                <span className="text-sm text-gray-500">the event</span>
              </div>
            </FieldGroup>
          )}

          {/* Conditions */}
          {!isDefault && (
            <FieldGroup label="Conditions" sub="Evaluated at fire time — not at trigger creation time">
              <div className="space-y-2 mb-2">
                {block.conditions.length === 0
                  ? <p className="text-xs text-gray-400 italic">No conditions — this block runs on every occurrence</p>
                  : block.conditions.map((c, ci) => (
                    <CondRow key={c.id} cond={c} isLast={ci === block.conditions.length - 1}
                      onChange={p => updateCond(c.id, p)} onDelete={() => deleteCond(c.id)} />
                  ))
                }
              </div>
              <button onClick={addCond} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                <Plus className="w-3.5 h-3.5" /> Add Filter
              </button>
            </FieldGroup>
          )}

          {/* Timing (realtime blocks) */}
          {(isDefault || block.blockType === 'conditional') && (
            <FieldGroup label="Trigger Timing">
              <div className="flex items-center gap-4 mb-3">
                {(['immediate', 'delayed'] as const).map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={`timing-${block.id}`} checked={block.timing === opt}
                      onChange={() => onUpdate({ timing: opt })}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700 capitalize">{opt}</span>
                  </label>
                ))}
              </div>
              {block.timing === 'delayed' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Fire after</span>
                  <NumInput value={block.delayValue} onChange={v => onUpdate({ delayValue: v })} min={1} />
                  <NativeSelect value={block.delayUnit} onChange={v => onUpdate({ delayUnit: v as OffsetUnit })}
                    options={[{ value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }]} />
                </div>
              )}
            </FieldGroup>
          )}

          {/* Recurring Reminder */}
          <FieldGroup label="Recurring Reminder" sub="Optional — repeat this block on a schedule">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={block.hasRecurring} onChange={e => onUpdate({ hasRecurring: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm font-medium text-gray-700">Enable recurring sends</span>
            </label>
            {block.hasRecurring && (
              <div className="pl-6 flex items-center gap-2">
                <span className="text-sm text-gray-600">Repeat every</span>
                <NumInput value={block.repeatValue} onChange={v => onUpdate({ repeatValue: v })} min={1} />
                <NativeSelect value={block.repeatUnit} onChange={v => onUpdate({ repeatUnit: v as OffsetUnit })}
                  options={[{ value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }]} />
              </div>
            )}
          </FieldGroup>

          {/* Suppression Rules */}
          <FieldGroup label="Suppression Rules" sub="Controls when this block stops firing">
            <div className="space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <InlineField label="Max sends">
                <NumInput value={block.maxSends} onChange={v => onUpdate({ maxSends: v })} min={1} />
                <span className="text-xs text-gray-500">times per survey per party</span>
              </InlineField>
              <InlineField label="Cooldown">
                <NumInput value={block.cooldownValue} onChange={v => onUpdate({ cooldownValue: v })} min={1} />
                <NativeSelect value={block.cooldownUnit} onChange={v => onUpdate({ cooldownUnit: v as OffsetUnit })}
                  options={[{ value: 'minutes', label: 'Min' }, { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }]} />
                <span className="text-xs text-gray-500">between sends</span>
              </InlineField>
              <InlineField label="Stop condition">
                <NativeSelect value={block.stopCondition} onChange={v => onUpdate({ stopCondition: v as StopCond })}
                  options={STOP_CONDITIONS} />
              </InlineField>
              <p className="text-[11px] text-gray-400 italic pt-1 border-t border-gray-200">
                If stop condition is already met when the block is first evaluated, it does not fire. Logged as "Stop condition already met."
              </p>
            </div>
          </FieldGroup>

          {/* Channel Selection */}
          <FieldGroup label="Channel Selection" sub="Select all channels for this block — each expands independently">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {(['whatsapp', 'email', 'sms'] as TriggerChannel[]).map(ch => {
                const m = CHANNEL_META[ch]; const Icon = m.icon; const active = block.channels.includes(ch);
                return (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={cn('flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 text-sm font-semibold transition-all',
                      active ? cn('border-current', m.hdr) : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white')}>
                    <Icon className="w-4 h-4" />{m.label}
                  </button>
                );
              })}
            </div>
            {block.channels.length === 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> At least one channel must be selected before saving
              </p>
            )}
            {block.channels.map(ch => (
              <ChannelConfigPanel key={ch} channel={ch}
                cfg={block.channelCfgs[ch] ?? defaultCfg(ch)}
                onUpdate={cfg => updateChannelCfg(ch, cfg)} />
            ))}
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Channel Config Panel — dispatcher
// ══════════════════════════════════════════════════════════════════════════════
function ChannelConfigPanel({ channel, cfg, onUpdate }: {
  key?: string;
  channel: TriggerChannel; cfg: ChannelCfg; onUpdate: (cfg: ChannelCfg) => void;
}) {
  if (channel === 'whatsapp') return <WhatsAppPanel cfg={cfg as WAChannelCfg}    onUpdate={c => onUpdate(c)} />;
  if (channel === 'email')    return <EmailPanel    cfg={cfg as EmailChannelCfg} onUpdate={c => onUpdate(c)} />;
  return                             <SMSPanel      cfg={cfg as SMSChannelCfg}   onUpdate={c => onUpdate(c)} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// WhatsApp Panel
// ══════════════════════════════════════════════════════════════════════════════
function WhatsAppPanel({ cfg, onUpdate }: { cfg: WAChannelCfg; onUpdate: (c: WAChannelCfg) => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [testNumber,  setTestNumber]  = useState('');
  const [showTest,    setShowTest]    = useState(false);

  const tpl = WA_TEMPLATES.find(t => t.id === cfg.templateId);

  const toggleRecipient = (r: string) => {
    const next = cfg.recipients.includes(r) ? cfg.recipients.filter(x => x !== r) : [...cfg.recipients, r];
    onUpdate({ ...cfg, recipients: next });
  };

  const setPlaceholder = (ph: string, val: string) =>
    onUpdate({ ...cfg, placeholderMap: { ...cfg.placeholderMap, [ph]: val } });

  const previewContent = tpl ? tpl.content.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const mapped = cfg.placeholderMap[k];
    return mapped ? `[${EVENT_PAYLOAD_FIELDS.find(f => f.value === mapped)?.label ?? mapped}]` : `{{${k}}}`;
  }) : '';

  return (
    <ChannelPanelWrapper channel="whatsapp" title="WhatsApp Configuration">
      {/* Recipients */}
      <PanelSection label="Recipients">
        <RoleMultiSelect selected={cfg.recipients} onChange={r => toggleRecipient(r)} />
        <p className="text-[11px] text-gray-400 mt-1.5">Resolved dynamically from survey parties at send time. If a party type is not linked to the survey, that recipient is skipped.</p>
      </PanelSection>

      {/* Template */}
      <PanelSection label="Template">
        <NativeSelect value={cfg.templateId}
          onChange={v => onUpdate({ ...cfg, templateId: v, placeholderMap: {} })}
          options={[{ value: '', label: 'Select a Meta-approved template…' }, ...WA_TEMPLATES.map(t => ({ value: t.id, label: t.name }))]} />
        {tpl && (
          <>
            <div className="mt-2 px-3 py-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-sm text-gray-700">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Template Content (read-only)</p>
              <p className="leading-relaxed">{tpl.content}</p>
            </div>
            {tpl.placeholders.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Placeholder Mapping</p>
                <div className="space-y-2">
                  {tpl.placeholders.map(ph => (
                    <PlaceholderRow key={ph} placeholder={`{{${ph}}}`}
                      value={cfg.placeholderMap[ph] ?? ''}
                      onChange={v => setPlaceholder(ph, v)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PanelSection>

      {/* Preview & Test */}
      <PanelSection label="Preview & Test">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowPreview(o => !o)} disabled={!tpl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => setShowTest(o => !o)} disabled={!tpl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Send className="w-3.5 h-3.5" /> Send Test
          </button>
        </div>
        {showPreview && tpl && (
          <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Preview — sample values substituted</p>
            <div className="bg-emerald-50 rounded-lg p-3 text-sm text-gray-800 leading-relaxed">{previewContent}</div>
          </div>
        )}
        {showTest && (
          <div className="mt-3 flex items-center gap-2">
            <input type="tel" value={testNumber} onChange={e => setTestNumber(e.target.value)}
              placeholder="+91 98765 43210" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={() => { toast.success(`Test WA sent to ${testNumber}`); setTestNumber(''); }}
              disabled={!testNumber.trim()}
              className="px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors">
              Send
            </button>
          </div>
        )}
      </PanelSection>
    </ChannelPanelWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Email Panel
// ══════════════════════════════════════════════════════════════════════════════
function EmailPanel({ cfg, onUpdate }: { cfg: EmailChannelCfg; onUpdate: (c: EmailChannelCfg) => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail,   setTestEmail]   = useState('');
  const [showTest,    setShowTest]    = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef    = useRef<HTMLTextAreaElement>(null);

  const insertPlaceholder = (field: 'subject' | 'body', placeholder: string) => {
    const token = `{{${placeholder}}}`;
    if (field === 'subject' && subjectRef.current) {
      const el = subjectRef.current;
      const s = el.selectionStart ?? cfg.subject.length;
      const e = el.selectionEnd   ?? cfg.subject.length;
      const next = cfg.subject.slice(0, s) + token + cfg.subject.slice(e);
      onUpdate({ ...cfg, subject: next });
      setTimeout(() => { el.selectionStart = el.selectionEnd = s + token.length; el.focus(); }, 0);
    } else if (field === 'body' && bodyRef.current) {
      const el = bodyRef.current;
      const s = el.selectionStart ?? cfg.body.length;
      const e = el.selectionEnd   ?? cfg.body.length;
      const next = cfg.body.slice(0, s) + token + cfg.body.slice(e);
      onUpdate({ ...cfg, body: next });
      setTimeout(() => { el.selectionStart = el.selectionEnd = s + token.length; el.focus(); }, 0);
    }
  };

  const toggleRecipient = (list: 'to' | 'cc' | 'bcc', r: string) => {
    const arr = cfg[list];
    onUpdate({ ...cfg, [list]: arr.includes(r) ? arr.filter(x => x !== r) : [...arr, r] });
  };

  return (
    <ChannelPanelWrapper channel="email" title="Email Configuration">
      {/* From / Reply-To */}
      <PanelSection label="Sender">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 w-16 shrink-0">From</span>
            <input type="text" value={cfg.fromDisplay}
              onChange={e => onUpdate({ ...cfg, fromDisplay: e.target.value })}
              placeholder="Display name…"
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-xs text-gray-400 shrink-0">&lt;noreply@zoop.one&gt;</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 w-16 shrink-0">Reply-To</span>
            <input type="email" value={cfg.replyTo} onChange={e => onUpdate({ ...cfg, replyTo: e.target.value })}
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </PanelSection>

      {/* Recipients */}
      <PanelSection label="Recipients">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">To</p>
            <RoleMultiSelect selected={cfg.to} onChange={r => toggleRecipient('to', r)} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 font-semibold">
            <input type="checkbox" checked={cfg.showCcBcc} onChange={e => onUpdate({ ...cfg, showCcBcc: e.target.checked })}
              className="w-3.5 h-3.5 text-indigo-600 rounded" />
            Show CC & BCC
          </label>

          {cfg.showCcBcc && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 mb-1.5">CC</p>
                <RoleMultiSelect selected={cfg.cc} onChange={r => toggleRecipient('cc', r)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 mb-1.5">BCC</p>
                <RoleMultiSelect selected={cfg.bcc} onChange={r => toggleRecipient('bcc', r)} />
              </div>
            </>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">Recipients resolved from linked survey parties at send time. Unlinked parties are skipped.</p>
      </PanelSection>

      {/* Template */}
      <PanelSection label="Template">
        {/* Subject */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-gray-600">Subject</p>
            <PlaceholderPickerBtn onInsert={v => insertPlaceholder('subject', v)} />
          </div>
          <input ref={subjectRef} type="text" value={cfg.subject}
            onChange={e => onUpdate({ ...cfg, subject: e.target.value })}
            placeholder="e.g. Your claim {{claim_no}} has been registered"
            className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-gray-600">Body</p>
            <PlaceholderPickerBtn onInsert={v => insertPlaceholder('body', v)} />
          </div>
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border border-gray-200 border-b-0 rounded-t-lg bg-gray-50">
            {[{ Icon: Bold, title: 'Bold' }, { Icon: Italic, title: 'Italic' }, { Icon: List, title: 'List' }, { Icon: Link, title: 'Link' }, { Icon: Hash, title: 'Heading' }].map(({ Icon, title }) => (
              <button key={title} title={title} onClick={() => toast(`${title} — rich text editor coming soon`)}
                className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          <textarea ref={bodyRef} value={cfg.body} onChange={e => onUpdate({ ...cfg, body: e.target.value })}
            placeholder="Write your email body here. Use {{variable}} placeholders or click the picker above."
            rows={6} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-b-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
        </div>
      </PanelSection>

      {/* Preview & Test */}
      <PanelSection label="Preview & Test">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(o => !o)} disabled={!cfg.subject && !cfg.body}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => setShowTest(o => !o)} disabled={!cfg.subject && !cfg.body}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Send className="w-3.5 h-3.5" /> Send Test
          </button>
        </div>
        {showPreview && (
          <div className="mt-3 border border-sky-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-sky-50 px-4 py-2 border-b border-sky-200">
              <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Email Preview — sample values</p>
              {cfg.subject && <p className="text-sm font-semibold text-gray-900 mt-1"><span className="text-gray-500 font-normal">Subject: </span>{cfg.subject}</p>}
            </div>
            <div className="bg-white p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
              {cfg.body || <span className="text-gray-400 italic">No body configured</span>}
            </div>
          </div>
        )}
        {showTest && (
          <div className="mt-3 flex items-center gap-2">
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
              placeholder="test@example.com" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={() => { toast.success(`Test email sent to ${testEmail}`); setTestEmail(''); }}
              disabled={!testEmail.trim()}
              className="px-3 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-40 transition-colors">
              Send
            </button>
          </div>
        )}
      </PanelSection>
    </ChannelPanelWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SMS Panel
// ══════════════════════════════════════════════════════════════════════════════
function SMSPanel({ cfg, onUpdate }: { cfg: SMSChannelCfg; onUpdate: (c: SMSChannelCfg) => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [testNumber,  setTestNumber]  = useState('');
  const [showTest,    setShowTest]    = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 160;
  const tpl = SMS_TEMPLATES.find(t => t.id === cfg.templateId);

  const toggleRecipient = (r: string) => {
    onUpdate({ ...cfg, recipients: cfg.recipients.includes(r) ? cfg.recipients.filter(x => x !== r) : [...cfg.recipients, r] });
  };

  const insertPlaceholder = (ph: string) => {
    const token = `{{${ph}}}`;
    if (!textRef.current) { onUpdate({ ...cfg, freeText: cfg.freeText + token }); return; }
    const el = textRef.current;
    const s = el.selectionStart ?? cfg.freeText.length;
    const e = el.selectionEnd   ?? cfg.freeText.length;
    const next = cfg.freeText.slice(0, s) + token + cfg.freeText.slice(e);
    if (next.length <= MAX_CHARS) {
      onUpdate({ ...cfg, freeText: next });
      setTimeout(() => { el.selectionStart = el.selectionEnd = s + token.length; el.focus(); }, 0);
    }
  };

  const previewText = cfg.templateMode === 'approved' && tpl
    ? tpl.content.replace(/\{\{(\w+)\}\}/g, (_, k) => {
        const mapped = cfg.placeholderMap[k];
        return mapped ? `[${EVENT_PAYLOAD_FIELDS.find(f => f.value === mapped)?.label ?? mapped}]` : `{{${k}}}`;
      })
    : cfg.freeText;

  return (
    <ChannelPanelWrapper channel="sms" title="SMS Configuration">
      {/* Recipients */}
      <PanelSection label="Recipients">
        <RoleMultiSelect selected={cfg.recipients} onChange={r => toggleRecipient(r)} />
        <p className="text-[11px] text-gray-400 mt-1.5">Contact details resolved from linked survey parties at send time.</p>
      </PanelSection>

      {/* Template */}
      <PanelSection label="Template">
        <div className="flex items-center gap-2 mb-3">
          {(['approved', 'freetext'] as const).map(mode => (
            <label key={mode} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`sms-mode`} checked={cfg.templateMode === mode}
                onChange={() => onUpdate({ ...cfg, templateMode: mode })}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">
                {mode === 'approved' ? 'Use Approved Template' : 'Compose Free-text'}
              </span>
            </label>
          ))}
        </div>

        {cfg.templateMode === 'approved' ? (
          <>
            <NativeSelect value={cfg.templateId}
              onChange={v => onUpdate({ ...cfg, templateId: v, placeholderMap: {} })}
              options={[{ value: '', label: 'Select template…' }, ...SMS_TEMPLATES.map(t => ({ value: t.id, label: t.name }))]} />
            {tpl && (
              <>
                <div className="mt-2 px-3 py-2 bg-violet-50 rounded-lg border border-violet-200 text-sm text-gray-700">
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1">Template Content</p>
                  <p>{tpl.content}</p>
                </div>
                {tpl.placeholders.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Placeholder Mapping</p>
                    <div className="space-y-2">
                      {tpl.placeholders.map(ph => (
                        <PlaceholderRow key={ph} placeholder={`{{${ph}}}`}
                          value={cfg.placeholderMap[ph] ?? ''}
                          onChange={v => onUpdate({ ...cfg, placeholderMap: { ...cfg.placeholderMap, [ph]: v } })} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-gray-600">Message</span>
              <div className="flex items-center gap-2">
                <PlaceholderPickerBtn onInsert={insertPlaceholder} />
                <span className={cn('text-[11px] font-mono', cfg.freeText.length > MAX_CHARS ? 'text-red-600' : cfg.freeText.length > 140 ? 'text-amber-600' : 'text-gray-400')}>
                  {cfg.freeText.length}/{MAX_CHARS}
                </span>
              </div>
            </div>
            <textarea ref={textRef} value={cfg.freeText} onChange={e => { if (e.target.value.length <= MAX_CHARS) onUpdate({ ...cfg, freeText: e.target.value }); }}
              placeholder="Type your SMS message… (160 chars max)"
              rows={3} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        )}
      </PanelSection>

      {/* Preview & Test */}
      <PanelSection label="Preview & Test">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(o => !o)} disabled={!previewText}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => setShowTest(o => !o)} disabled={!previewText}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Send className="w-3.5 h-3.5" /> Send Test
          </button>
        </div>
        {showPreview && (
          <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2">SMS Preview — sample values</p>
            <p className="text-sm text-gray-800 leading-relaxed">{previewText}</p>
            <p className="text-[11px] text-gray-400 mt-1.5">{previewText.length} chars</p>
          </div>
        )}
        {showTest && (
          <div className="mt-3 flex items-center gap-2">
            <input type="tel" value={testNumber} onChange={e => setTestNumber(e.target.value)}
              placeholder="+91 98765 43210" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={() => { toast.success(`Test SMS sent to ${testNumber}`); setTestNumber(''); }}
              disabled={!testNumber.trim()}
              className="px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors">
              Send
            </button>
          </div>
        )}
      </PanelSection>
    </ChannelPanelWrapper>
  );
}

// ── Condition row ─────────────────────────────────────────────────────────────
function CondRow({ cond, isLast, onChange, onDelete }: {
  key?: string;
  cond: ConditionRow; isLast: boolean;
  onChange: (p: Partial<ConditionRow>) => void; onDelete: () => void;
}) {
  const needsValue = cond.operator !== 'empty' && cond.operator !== 'not_empty';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <NativeSelect value={cond.field} onChange={v => onChange({ field: v as CondField, value: COND_VALUES[v as CondField][0] })} options={COND_FIELDS} />
        <NativeSelect value={cond.operator} onChange={v => onChange({ operator: v as CondOperator })} options={COND_OPERATORS} />
        {needsValue && <NativeSelect value={cond.value} onChange={v => onChange({ value: v })} options={COND_VALUES[cond.field].map(v => ({ value: v, label: v }))} />}
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {!isLast && (
        <div className="flex items-center gap-1.5 pl-2">
          {(['AND', 'OR'] as LogicOp[]).map(op => (
            <button key={op} onClick={() => onChange({ logic: op })}
              className={cn('px-2.5 py-0.5 text-xs font-bold rounded border transition-colors',
                cond.logic === op ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300')}>
              {op}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Small shared components ───────────────────────────────────────────────────
function ChannelPanelWrapper({ channel, title, children }: { channel: TriggerChannel; title: string; children: React.ReactNode }) {
  const m = CHANNEL_META[channel]; const Icon = m.icon;
  return (
    <div className={cn('rounded-xl border-2 mb-3 overflow-hidden', m.border)}>
      <div className={cn('flex items-center gap-2 px-4 py-2.5', m.hdr)}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-bold">{title}</span>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  );
}

function RoleMultiSelect({ selected, onChange }: { selected: string[]; onChange: (r: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PARTY_ROLES.map(r => (
        <button key={r} onClick={() => onChange(r)}
          className={cn('px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors',
            selected.includes(r) ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400')}>
          {r}
        </button>
      ))}
    </div>
  );
}

function PlaceholderRow({ placeholder, value, onChange }: {
  key?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <code className="text-[11px] font-mono bg-gray-100 text-indigo-700 px-2 py-0.5 rounded w-36 shrink-0">{placeholder}</code>
      <NativeSelect value={value} onChange={onChange}
        options={[{ value: '', label: 'Select event field…' }, ...EVENT_PAYLOAD_FIELDS]} />
    </div>
  );
}

function PlaceholderPickerBtn({ onInsert }: { onInsert: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors">
        <Hash className="w-3 h-3" /> Insert placeholder
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30 max-h-48 overflow-y-auto">
          {EVENT_PAYLOAD_FIELDS.map(f => (
            <button key={f.value} onClick={() => { onInsert(f.value.split('.').pop()!); setOpen(false); }}
              className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition-colors">
              <span className="font-mono text-indigo-600">{`{{${f.value.split('.').pop()}}}`}</span>
              <span className="text-gray-500 ml-2">{f.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldGroup({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function FormField({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  );
}

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, labelColor }: { checked: boolean; onChange: () => void; label: string; labelColor: string }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <span className={cn('text-xs font-semibold', labelColor)}>{label}</span>
      <span className="relative inline-block w-10 h-6">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:border after:border-gray-300 after:rounded-full
                        after:h-5 after:w-5 after:transition-all
                        peer-checked:after:translate-x-4 peer-checked:after:border-white" />
      </span>
    </label>
  );
}

function TypeBadge({ type }: { type: 'realtime' | 'timed' }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border shrink-0',
      type === 'realtime' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
      {type === 'realtime' ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {type === 'realtime' ? 'Realtime' : 'Timed'}
    </span>
  );
}

function NativeSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function NumInput({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <input type="number" min={min} value={value} onChange={e => onChange(Number(e.target.value))}
      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
  );
}

function MenuBtn({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors',
      danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50')}>
      {icon} {label}
    </button>
  );
}
