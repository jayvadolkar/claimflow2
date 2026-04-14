import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Search, ChevronDown, ChevronRight, MoreVertical,
  Edit3, Trash2, Power, Filter, X, Zap, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../ui/cn';
import toast from 'react-hot-toast';
import { SelectEventPanel } from './SelectEventPanel';
import { TriggerConfigScreen, TriggerDraft } from './TriggerConfigScreen';
import { TriggerDetailView, TriggerRecord } from './TriggerDetailView';
import { SystemEvent } from '../../data/eventRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────
type TriggerType = 'realtime' | 'timed';
type TriggerChannel = 'whatsapp' | 'email' | 'sms';
type TriggerStatus = 'active' | 'inactive';
type StageId = 'intake' | 'evidence' | 'inspection' | 'settlement' | 'closing';

interface EventTrigger {
  id: string;
  name: string;
  event: { display: string; machine: string; stage: StageId; type: TriggerType };
  type: TriggerType;
  status: TriggerStatus;
  channels: TriggerChannel[];
  blockCount: number;
  lastModified: { actor: string; at: string };
  stage: StageId;
  fullConfig?: TriggerDraft & { event: SystemEvent };
}

// ── Static config ─────────────────────────────────────────────────────────────
const STAGE_GROUPS: { id: StageId; label: string }[] = [
  { id: 'intake', label: 'Survey Create / Intake (Intimation)' },
  { id: 'evidence', label: 'Evidence Collection' },
  { id: 'inspection', label: 'Inspection, Assessment & Repair' },
  { id: 'settlement', label: 'Settlement' },
  { id: 'closing', label: 'Closing' },
];

const CHANNEL_PILL: Record<TriggerChannel, { label: string; cls: string }> = {
  whatsapp: { label: 'WA', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  email: { label: 'Email', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  sms: { label: 'SMS', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_TRIGGERS: EventTrigger[] = [
  // Intake
  { id: 'trg-001', name: 'New Claim Welcome Message', event: { display: 'Intimation Created', machine: 'intimation.created', stage: 'intake', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['whatsapp', 'email'], blockCount: 2, lastModified: { actor: 'Muskan', at: ago(2) }, stage: 'intake' },
  { id: 'trg-002', name: 'Surveyor Assignment Alert', event: { display: 'Surveyor Assigned', machine: 'survey.surveyor_assigned', stage: 'intake', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['whatsapp', 'sms'], blockCount: 3, lastModified: { actor: 'Rahul', at: ago(5) }, stage: 'intake' },
  { id: 'trg-003', name: 'Intake SLA Breach Alert', event: { display: 'Intake SLA Breached', machine: 'sla.intake_breached', stage: 'intake', type: 'timed' }, type: 'timed', status: 'inactive', channels: ['email'], blockCount: 0, lastModified: { actor: 'Admin', at: ago(10) }, stage: 'intake' },
  // Evidence
  { id: 'trg-004', name: 'Document Upload Request', event: { display: 'Evidence Requested', machine: 'evidence.requested', stage: 'evidence', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['whatsapp', 'sms', 'email'], blockCount: 4, lastModified: { actor: 'Priya', at: ago(1) }, stage: 'evidence' },
  { id: 'trg-005', name: 'Missing Documents Reminder', event: { display: 'Documents Pending', machine: 'evidence.docs_pending', stage: 'evidence', type: 'timed' }, type: 'timed', status: 'active', channels: ['whatsapp'], blockCount: 1, lastModified: { actor: 'Muskan', at: ago(3) }, stage: 'evidence' },
  { id: 'trg-006', name: 'Evidence Rejected Notification', event: { display: 'Evidence Rejected', machine: 'evidence.rejected', stage: 'evidence', type: 'realtime' }, type: 'realtime', status: 'inactive', channels: ['sms', 'email'], blockCount: 0, lastModified: { actor: 'Admin', at: ago(8) }, stage: 'evidence' },
  // Inspection
  { id: 'trg-007', name: 'Inspection Booking Confirmation', event: { display: 'Inspection Scheduled', machine: 'inspection.scheduled', stage: 'inspection', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['whatsapp', 'email'], blockCount: 2, lastModified: { actor: 'Rahul', at: ago(7) }, stage: 'inspection' },
  { id: 'trg-008', name: 'Assessment Report Ready', event: { display: 'Assessment Completed', machine: 'assessment.completed', stage: 'inspection', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['email'], blockCount: 1, lastModified: { actor: 'Admin', at: ago(14) }, stage: 'inspection' },
  { id: 'trg-009', name: 'Repair Progress Update', event: { display: 'Repair Status Updated', machine: 'repair.status_updated', stage: 'inspection', type: 'timed' }, type: 'timed', status: 'inactive', channels: ['sms'], blockCount: 0, lastModified: { actor: 'Priya', at: ago(20) }, stage: 'inspection' },
  // Settlement
  { id: 'trg-010', name: 'Settlement Offer Notification', event: { display: 'Settlement Offer Made', machine: 'settlement.offer_made', stage: 'settlement', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['whatsapp', 'email'], blockCount: 3, lastModified: { actor: 'Muskan', at: ago(4) }, stage: 'settlement' },
  { id: 'trg-011', name: 'Payment Processed Alert', event: { display: 'Payment Disbursed', machine: 'settlement.payment_disbursed', stage: 'settlement', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['whatsapp', 'sms', 'email'], blockCount: 2, lastModified: { actor: 'Rahul', at: ago(6) }, stage: 'settlement' },
  { id: 'trg-012', name: 'Settlement SLA Warning', event: { display: 'Settlement SLA Nearing', machine: 'sla.settlement_nearing', stage: 'settlement', type: 'timed' }, type: 'timed', status: 'inactive', channels: ['email'], blockCount: 0, lastModified: { actor: 'Admin', at: ago(25) }, stage: 'settlement' },
  // Closing
  { id: 'trg-013', name: 'Claim Closure Summary', event: { display: 'Survey Closed', machine: 'survey.closed', stage: 'closing', type: 'realtime' }, type: 'realtime', status: 'active', channels: ['email'], blockCount: 1, lastModified: { actor: 'Admin', at: ago(30) }, stage: 'closing' },
  { id: 'trg-014', name: 'Post-Claim Feedback Request', event: { display: 'Claim Finalised', machine: 'survey.finalised', stage: 'closing', type: 'timed' }, type: 'timed', status: 'inactive', channels: ['whatsapp', 'sms'], blockCount: 0, lastModified: { actor: 'Priya', at: ago(45) }, stage: 'closing' },
];

function ago(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d !== 1 ? 's' : ''} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo !== 1 ? 's' : ''} ago`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
interface EventTriggersViewProps {
  isSuperAdmin?: boolean;
}

type ScreenMode = 'dashboard' | 'select-event' | 'trigger-config' | 'trigger-detail';

export function EventTriggersView({ isSuperAdmin = true }: EventTriggersViewProps) {
  const [triggers, setTriggers] = useState<EventTrigger[]>(INITIAL_TRIGGERS);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TriggerType[]>([]);
  const [filterStatus, setFilterStatus] = useState<TriggerStatus[]>([]);
  const [filterChannels, setFilterChannels] = useState<TriggerChannel[]>([]);
  const [filterStages, setFilterStages] = useState<StageId[]>([]);
  const [collapsed, setCollapsed] = useState<Record<StageId, boolean>>({
    intake: false, evidence: false, inspection: false, settlement: false, closing: false,
  });
  const [openMenu,         setOpenMenu]         = useState<string | null>(null);
  const [page,             setPage]             = useState(1);
  const [screenMode,       setScreenMode]       = useState<ScreenMode>('dashboard');
  const [activeEvent,      setActiveEvent]      = useState<SystemEvent | null>(null);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const hasFilters = !!(search || filterType.length || filterStatus.length || filterChannels.length || filterStages.length);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = triggers.filter(t => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.event.display.toLowerCase().includes(q)) return false;
    }
    if (filterType.length && !filterType.includes(t.type)) return false;
    if (filterStatus.length && !filterStatus.includes(t.status)) return false;
    if (filterChannels.length && !filterChannels.some(c => t.channels.includes(c))) return false;
    if (filterStages.length && !filterStages.includes(t.stage)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const groupedPaged = STAGE_GROUPS
    .map(g => ({ ...g, items: paged.filter(t => t.stage === g.id) }))
    .filter(g => g.items.length > 0);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleStatus = (id: string) => {
    const t = triggers.find(x => x.id === id);
    if (!t) return;
    setTriggers(prev => prev.map(x => x.id !== id ? x : {
      ...x,
      status: x.status === 'active' ? 'inactive' : 'active',
      lastModified: { actor: 'Admin', at: new Date().toISOString() },
    }));
    toast.success(`Trigger ${t.status === 'active' ? 'deactivated' : 'activated'}`);
  };

  const deleteTrigger = (id: string) => {
    setTriggers(prev => prev.filter(x => x.id !== id));
    toast.success('Trigger deleted');
  };

  const toggleCollapse = (stage: StageId) =>
    setCollapsed(prev => ({ ...prev, [stage]: !prev[stage] }));

  const clearFilters = () => {
    setSearch(''); setFilterType([]); setFilterStatus([]);
    setFilterChannels([]); setFilterStages([]); setPage(1);
  };

  function toggleArr<T>(arr: T[], val: T, set: (a: T[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    setPage(1);
  }

  // ── Event/trigger flow handlers ────────────────────────────────────────────
  const configuredMachineNames = triggers.map(t => t.event.machine);

  const handleEventSelected = (event: SystemEvent) => {
    setActiveEvent(event);
    setScreenMode('trigger-config');
  };

  const handleSaveTrigger = (draft: { name: string; description: string; status: 'active' | 'inactive'; event: SystemEvent; blocks: any[] }) => {
    const isEdit = !!selectedTriggerId;
    const uniqueChannels = draft.blocks
      .flatMap(b => b.channels as TriggerChannel[])
      .filter((c, i, arr) => arr.indexOf(c) === i);

    if (isEdit) {
      setTriggers(prev => prev.map(t => t.id !== selectedTriggerId ? t : {
        ...t,
        name:         draft.name,
        status:       draft.status,
        channels:     uniqueChannels,
        blockCount:   draft.blocks.length,
        lastModified: { actor: 'Admin', at: new Date().toISOString() },
        fullConfig:   draft,
      }));
      toast.success('Trigger updated');
    } else {
      const newTrigger: EventTrigger = {
        id:           `trg-${Date.now()}`,
        name:         draft.name,
        event:        { display: draft.event.display, machine: draft.event.machine, stage: draft.event.stage, type: draft.event.type },
        type:         draft.event.type,
        status:       draft.status,
        channels:     uniqueChannels,
        blockCount:   draft.blocks.length,
        lastModified: { actor: 'Admin', at: new Date().toISOString() },
        stage:        draft.event.stage,
        fullConfig:   draft,
      };
      setTriggers(prev => [...prev, newTrigger]);
    }
    setScreenMode('dashboard');
    setActiveEvent(null);
    setSelectedTriggerId(null);
  };

  const handleOpenDetail = (id: string) => {
    setSelectedTriggerId(id);
    setScreenMode('trigger-detail');
  };

  const handleEditTrigger = (id: string) => {
    const t = triggers.find(x => x.id === id);
    if (!t) return;
    setSelectedTriggerId(id);
    // Reconstruct a SystemEvent from the trigger's event data for the config screen
    const syntheticEvent: SystemEvent = {
      id:      t.id,
      display: t.event.display,
      machine: t.event.machine,
      type:    t.event.type,
      stage:   t.event.stage,
    };
    setActiveEvent(syntheticEvent);
    setScreenMode('trigger-config');
  };

  // ── Screen routing ─────────────────────────────────────────────────────────
  if (screenMode === 'trigger-detail' && selectedTriggerId) {
    const t = triggers.find(x => x.id === selectedTriggerId);
    if (t) {
      const record: TriggerRecord = {
        id:           t.id,
        name:         t.name,
        event:        t.event,
        status:       t.status,
        channels:     t.channels,
        blockCount:   t.blockCount,
        lastModified: t.lastModified,
        fullConfig:   t.fullConfig,
      };
      return (
        <TriggerDetailView
          trigger={record}
          onBack={() => { setScreenMode('dashboard'); setSelectedTriggerId(null); }}
          onEdit={() => handleEditTrigger(t.id)}
        />
      );
    }
  }

  if (screenMode === 'trigger-config' && activeEvent) {
    const existing = selectedTriggerId
      ? triggers.find(x => x.id === selectedTriggerId)?.fullConfig
      : undefined;
    return (
      <TriggerConfigScreen
        event={activeEvent}
        existing={existing}
        onBack={() => { setScreenMode('dashboard'); setActiveEvent(null); setSelectedTriggerId(null); }}
        onSave={handleSaveTrigger}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50/20">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Event Triggers</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Map system events to communication actions across channels
            </p>
          </div>
          {isSuperAdmin && (
            <Button variant="primary" onClick={() => setScreenMode('select-event')}>
              <Plus className="w-4 h-4" /> Add New Trigger
            </Button>
          )}
        </div>
      </div>

      {/* ── Select Event panel ── */}
      {screenMode === 'select-event' && (
        <SelectEventPanel
          configuredEventMachineNames={configuredMachineNames}
          onSelect={handleEventSelected}
          onClose={() => setScreenMode('dashboard')}
        />
      )}

      {/* ── Filter bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search triggers or events…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>

        <FilterMulti
          label="Type"
          options={[{ value: 'realtime', label: 'Realtime' }, { value: 'timed', label: 'Timed' }]}
          selected={filterType}
          onChange={v => toggleArr(filterType, v as TriggerType, setFilterType)}
        />
        <FilterMulti
          label="Status"
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          selected={filterStatus}
          onChange={v => toggleArr(filterStatus, v as TriggerStatus, setFilterStatus)}
        />
        <FilterMulti
          label="Channel"
          options={[
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
          ]}
          selected={filterChannels}
          onChange={v => toggleArr(filterChannels, v as TriggerChannel, setFilterChannels)}
        />
        <FilterMulti
          label="Stage"
          options={STAGE_GROUPS.map(g => ({ value: g.id, label: g.label }))}
          selected={filterStages}
          onChange={v => toggleArr(filterStages, v as StageId, setFilterStages)}
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Result count ── */}
      <div className="px-6 pt-4 pb-1 shrink-0">
        <p className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span>{' '}
          trigger{filtered.length !== 1 ? 's' : ''}
          {hasFilters && ' matching filters'}
        </p>
      </div>

      {/* ── Stage groups ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-3 space-y-4">
        {groupedPaged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No triggers found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          groupedPaged.map(group => (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Group header */}
              <button
                onClick={() => toggleCollapse(group.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {collapsed[group.id]
                    ? <ChevronRight className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                  <span className="text-sm font-bold text-gray-800">{group.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {group.items.length}
                  </span>
                </div>
              </button>

              {/* Table */}
              {!collapsed[group.id] && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        {(['Trigger Name', 'Event', 'Type', 'Status', 'Channels', 'Blocks', 'Last Modified', 'Actions'] as const).map(col => (
                          <th
                            key={col}
                            className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap first:pl-5"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.items.map(trigger => (
                        <TriggerRow
                          key={trigger.id}
                          trigger={trigger}
                          isSuperAdmin={isSuperAdmin}
                          openMenu={openMenu}
                          setOpenMenu={setOpenMenu}
                          onToggleStatus={toggleStatus}
                          onDelete={deleteTrigger}
                          onViewDetail={handleOpenDetail}
                          onEdit={handleEditTrigger}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages} · {filtered.length} results
          </p>
          <div className="flex items-center gap-1">
            <PaginationBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              ← Previous
            </PaginationBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-8 h-8 text-xs font-semibold rounded-lg transition-colors',
                  p === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {p}
              </button>
            ))}
            <PaginationBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
              Next →
            </PaginationBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trigger row ───────────────────────────────────────────────────────────────
function TriggerRow({
  trigger, isSuperAdmin, openMenu, setOpenMenu, onToggleStatus, onDelete, onViewDetail, onEdit,
}: {
  key?: string;
  trigger: EventTrigger;
  isSuperAdmin: boolean;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isMenuOpen = openMenu === trigger.id;
  const noActions = trigger.blockCount === 0;

  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMenuOpen, setOpenMenu]);

  return (
    <tr className="hover:bg-gray-50/60 transition-colors">

      {/* Trigger Name */}
      <td className="pl-5 pr-4 py-3.5 align-middle">
        <button
          onClick={() => onViewDetail(trigger.id)}
          className="text-sm font-semibold text-gray-900 leading-tight whitespace-nowrap hover:text-indigo-600 hover:underline transition-colors text-left"
        >
          {trigger.name}
        </button>
        {noActions && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 mt-0.5">
            <AlertCircle className="w-3 h-3 shrink-0" /> No Actions Configured
          </span>
        )}
      </td>

      {/* Event */}
      <td className="px-4 py-3.5 align-middle">
        <p className="text-sm text-gray-800 font-medium leading-tight whitespace-nowrap">{trigger.event.display}</p>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{trigger.event.machine}</p>
      </td>

      {/* Type */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border',
          trigger.type === 'realtime'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-amber-50  text-amber-700  border-amber-200'
        )}>
          {trigger.type === 'realtime'
            ? <Zap className="w-2.5 h-2.5" />
            : <Clock className="w-2.5 h-2.5" />
          }
          {trigger.type === 'realtime' ? 'Realtime' : 'Timed'}
        </span>
      </td>

      {/* Status toggle */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="relative inline-block w-9 h-5">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={trigger.status === 'active'}
              onChange={() => onToggleStatus(trigger.id)}
            />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:border after:border-gray-300 after:rounded-full
                            after:h-4 after:w-4 after:transition-all
                            peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </span>
          <span className={cn(
            'text-[11px] font-semibold',
            trigger.status === 'active' ? 'text-emerald-600' : 'text-gray-400'
          )}>
            {trigger.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </label>
      </td>

      {/* Channels */}
      <td className="px-4 py-3.5 align-middle">
        <div className="flex items-center gap-1">
          {trigger.channels.map(ch => (
            <span
              key={ch}
              className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap', CHANNEL_PILL[ch].cls)}
            >
              {CHANNEL_PILL[ch].label}
            </span>
          ))}
        </div>
      </td>

      {/* Blocks */}
      <td className="px-4 py-3.5 align-middle">
        <span className={cn('text-sm font-bold', noActions ? 'text-red-500' : 'text-gray-700')}>
          {trigger.blockCount}
        </span>
      </td>

      {/* Last Modified */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <p className="text-xs font-medium text-gray-700">{trigger.lastModified.actor}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{formatRelative(trigger.lastModified.at)}</p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 align-middle">
        <div ref={menuRef} className="relative inline-block">
          <button
            onClick={() => setOpenMenu(isMenuOpen ? null : trigger.id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30">
              <MenuAction
                icon={<Edit3 className="w-3.5 h-3.5 text-gray-400" />}
                label="Edit"
                onClick={() => { setOpenMenu(null); onEdit(trigger.id); }}
              />
              <MenuAction
                icon={<Power className="w-3.5 h-3.5 text-gray-400" />}
                label={trigger.status === 'active' ? 'Deactivate' : 'Activate'}
                onClick={() => { setOpenMenu(null); onToggleStatus(trigger.id); }}
              />
              {isSuperAdmin && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <MenuAction
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    label="Delete"
                    danger
                    onClick={() => { setOpenMenu(null); onDelete(trigger.id); }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function MenuAction({
  icon, label, danger = false, onClick,
}: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      )}
    >
      {icon} {label}
    </button>
  );
}

function PaginationBtn({
  children, onClick, disabled,
}: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

// ── Multi-select filter dropdown ──────────────────────────────────────────────
function FilterMulti({
  label, options, selected, onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const active = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap',
          active
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        <Filter className="w-3.5 h-3.5 shrink-0" />
        {label}
        {active && (
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className={cn(
                'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                selected.includes(opt.value) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
              )}>
                {selected.includes(opt.value) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
