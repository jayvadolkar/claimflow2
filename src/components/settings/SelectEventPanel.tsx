import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../ui/cn';
import { SYSTEM_EVENTS, STAGE_GROUPS, SystemEvent } from '../../data/eventRegistry';

interface SelectEventPanelProps {
  /** Machine names of events that already have at least one trigger configured */
  configuredEventMachineNames: string[];
  onSelect: (event: SystemEvent) => void;
  onClose:  () => void;
}

export function SelectEventPanel({
  configuredEventMachineNames,
  onSelect,
  onClose,
}: SelectEventPanelProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search on mount, close on Escape
  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const q = search.trim().toLowerCase();
  const filtered = SYSTEM_EVENTS.filter(
    e => !q || e.display.toLowerCase().includes(q) || e.machine.toLowerCase().includes(q)
  );

  const groups = STAGE_GROUPS
    .map(g => ({ ...g, events: filtered.filter(e => e.stage === g.id) }))
    .filter(g => g.events.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[440px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Select an Event</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose the system event this trigger will respond to</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-gray-500">No events match your search</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.id}>
                {/* Stage label */}
                <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{group.label}</p>
                </div>

                {/* Events */}
                {group.events.map(event => {
                  const isConfigured = configuredEventMachineNames.includes(event.machine);
                  return (
                    <EventRow
                      key={event.id}
                      event={event}
                      isConfigured={isConfigured}
                      onSelect={onSelect}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <p className="text-[11px] text-gray-400">
            Events with <CheckCircle2 className="w-3 h-3 inline text-indigo-400 mb-0.5" /> already have a trigger configured.
            Select any event to create a new trigger for it.
          </p>
        </div>
      </div>
    </>
  );
}

// ── Event row ─────────────────────────────────────────────────────────────────
function EventRow({
  event, isConfigured, onSelect,
}: {
  key?: string;
  event: SystemEvent;
  isConfigured: boolean;
  onSelect: (e: SystemEvent) => void;
}) {
  return (
    <button
      onClick={() => onSelect(event)}
      className={cn(
        'w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-50 transition-all text-left',
        'hover:bg-indigo-50/60 group'
      )}
    >
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-900 truncate">
            {event.display}
          </span>
          {isConfigured && (
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          )}
        </div>
        <p className="text-[11px] font-mono text-gray-400 truncate">{event.machine}</p>
      </div>
      <span className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0',
        event.type === 'realtime'
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-amber-50  text-amber-700  border-amber-200'
      )}>
        {event.type === 'realtime'
          ? <Zap   className="w-2.5 h-2.5" />
          : <Clock className="w-2.5 h-2.5" />
        }
        {event.type === 'realtime' ? 'Realtime' : 'Timed'}
      </span>
    </button>
  );
}
