import React, { useState, useEffect } from 'react';
import { Survey, SurveyEvent } from '../types';
import { api } from '../services/api';
import {
  Check, Lock, FileText, Camera, ShieldCheck, Banknote, FileBarChart2,
  ChevronRight, Clock, AlertCircle, User, Zap, ArrowRight
} from 'lucide-react';

interface SurveyJourneyViewProps {
  survey: Survey;
  onUpdateSurvey: (survey: Survey) => void;
  userRole: string;
}

// ── Stage definitions (aligned with PDF framework) ────────────────────────────

const STAGE_DEFS = [
  {
    name: 'Survey Create/Intake',
    order: 1,
    description: 'Survey created and awaiting handler assignment',
    Icon: FileText,
    accent: { dot: 'bg-indigo-500', ring: 'ring-indigo-200', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', connector: 'bg-indigo-200', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
    entryTriggers: ['Email parser created new survey', 'User clicked "+ New Survey"'],
    exitConditions: [
      { key: 'handlerAssigned', label: 'Handler assigned to survey' },
      { key: 'ackSent', label: 'Acknowledgement sent to all parties' },
    ],
    eventNames: ['Survey Created', 'Handler Assigned', 'Assignment Rejected', 'Handler Re-assigned', 'Survey Cancelled'],
  },
  {
    name: 'Evidence Collection',
    order: 2,
    description: 'Collection of documents and damaged photos',
    Icon: Camera,
    accent: { dot: 'bg-emerald-500', ring: 'ring-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', connector: 'bg-emerald-200', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    entryTriggers: ['Handler assigned to survey', 'Upload links sent to stakeholders'],
    exitConditions: [
      { key: 'docsComplete', label: 'All mandatory documents collected (not missing)' },
      { key: 'photosComplete', label: 'All required photos collected' },
      { key: 'aiInitiated', label: 'AI Inspection initiated' },
      { key: 'allDocsApproved', label: 'All documents verified or overridden — required to advance stage' },
    ],
    eventNames: ['Evidence Request Initiated', 'Evidence Submitted', 'Evidence Reviewed', 'Re-upload Requested', 'Evidence Re-submitted', 'Evidence Sufficiency Evaluated', 'AI Inspection Initiated'],
  },
  {
    name: 'Inspection, AI Assessment & repair',
    order: 3,
    description: 'Damage inspections, AI assessment & repair estimation',
    Icon: ShieldCheck,
    accent: { dot: 'bg-amber-500', ring: 'ring-amber-200', badge: 'bg-amber-50 text-amber-700 border-amber-200', connector: 'bg-amber-200', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    entryTriggers: ['AI Inspect button clicked'],
    exitConditions: [
      { key: 'estimateApproved', label: 'Estimate repair approval sent' },
    ],
    eventNames: ['AI Assessment Started', 'Damage Annotated', 'Repair Estimate Generated', 'Estimate Approved'],
  },
  {
    name: 'Settlement Stage',
    order: 4,
    description: 'Final approval, Bill payment and processing',
    Icon: Banknote,
    accent: { dot: 'bg-blue-500', ring: 'ring-blue-200', badge: 'bg-blue-50 text-blue-700 border-blue-200', connector: 'bg-blue-200', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
    entryTriggers: ['Approval sent for repair'],
    exitConditions: [
      { key: 'billReceived', label: 'Final repair bill received' },
      { key: 'voucherReceived', label: 'Payment voucher received' },
    ],
    eventNames: ['Repair Bill Received', 'Payment Voucher Issued', 'Settlement Approved'],
  },
  {
    name: 'Closing stage',
    order: 5,
    description: 'Evidence survey report and invoice generation',
    Icon: FileBarChart2,
    accent: { dot: 'bg-violet-500', ring: 'ring-violet-200', badge: 'bg-violet-50 text-violet-700 border-violet-200', connector: 'bg-violet-200', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
    entryTriggers: ['Post repair documents received'],
    exitConditions: [
      { key: 'reportGenerated', label: 'Final survey report generated' },
    ],
    eventNames: ['Report Generated', 'Survey Closed', 'Invoice Issued'],
  },
];

// ── Gate computation from live survey data ─────────────────────────────────────

function computeGates(survey: Survey, events: SurveyEvent[]): Record<string, boolean> {
  const names = events.map(e => e.eventName.toLowerCase());

  const handlerAssigned = !!(survey.handler && survey.handler.trim() !== '' && survey.handler !== '-');
  const ackSent = handlerAssigned;

  const docs = survey.documents || [];
  const photos = survey.photos || [];
  // Prefer _matchedRule.required (rule engine) with fallback to docDef.required for legacy surveys
  const requiredDocs = docs.filter((d: any) => d._matchedRule ? d._matchedRule.required : d.docDef?.required);
  // docsComplete: all required docs resolved (not missing) — gates AI analysis
  const docsComplete = requiredDocs.length > 0 && requiredDocs.every((d: any) => d.status !== 'missing');
  // allDocsApproved: every doc is verified OR overridden — gates stage transition
  const allDocsApproved = docs.length > 0 && docs.every((d: any) => d.status === 'verified' || d.status === 'overridden');
  const requiredPhotos = photos.filter((p: any) => p._matchedRule ? p._matchedRule.required : p.imgDef?.required);
  const photosComplete = requiredPhotos.length > 0 && requiredPhotos.every((p: any) => p.status !== 'missing');
  const aiInitiated = (survey.aiStatus !== undefined && survey.aiStatus !== 'Not Started' && survey.aiStatus !== '') ||
    names.some(n => n.includes('ai inspection') || n.includes('ai inspect'));

  const estimateApproved = names.some(n => n.includes('estimate') || n.includes('approval sent'));
  const billReceived = names.some(n => n.includes('bill') || n.includes('repair bill'));
  const voucherReceived = names.some(n => n.includes('voucher'));
  const reportGenerated = names.some(n => n.includes('report generated') || n.includes('survey closed'));

  return {
    handlerAssigned, ackSent,
    docsComplete, allDocsApproved, photosComplete, aiInitiated,
    estimateApproved,
    billReceived, voucherReceived,
    reportGenerated,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SurveyJourneyView({ survey, onUpdateSurvey, userRole }: SurveyJourneyViewProps) {
  const [events, setEvents] = useState<SurveyEvent[]>([]);
  const [selectedStage, setSelectedStage] = useState<number>(0); // index into STAGE_DEFS

  useEffect(() => {
    api.getEvents(survey.id).then(setEvents).catch(console.error);
  }, [survey.id]);

  // Re-fetch events when survey updates (e.g. stage changed)
  useEffect(() => {
    api.getEvents(survey.id).then(setEvents).catch(console.error);
  }, [survey.stage]);

  const currentOrder = STAGE_DEFS.find(s => s.name === survey.stage)?.order ?? 1;
  const gates = computeGates(survey, events);
  const activeStage = STAGE_DEFS[selectedStage];

  const stageStatus = (stageDef: typeof STAGE_DEFS[number]) => {
    if (stageDef.order < currentOrder) return 'completed';
    if (stageDef.order === currentOrder) return 'current';
    return 'locked';
  };

  // Events that roughly belong to the selected stage (by keyword match or all if none)
  const stageEvents = events.filter(e =>
    activeStage.eventNames.some(n => e.eventName.toLowerCase().includes(n.toLowerCase().split(' ')[0]))
  );
  // Fallback: if no keyword match, show events for current stage only
  const visibleEvents = stageEvents.length > 0 ? stageEvents : (activeStage.order === currentOrder ? events : []);

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden" style={{ minHeight: '600px' }}>

      {/* ── Left: Stage Timeline ─────────────────────────────────────────── */}
      <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Survey Journey</p>
          <p className="text-xs font-semibold text-gray-600 mt-0.5">{survey.id}</p>
        </div>

        <div className="flex-1 py-4 px-4 relative">
          {STAGE_DEFS.map((stageDef, idx) => {
            const status = stageStatus(stageDef);
            const isSelected = selectedStage === idx;
            const { Icon, accent } = stageDef;
            const allExitsMet = stageDef.exitConditions.every(c => gates[c.key]);

            return (
              <div key={stageDef.name} className="flex gap-3 mb-1">
                {/* Connector line + dot */}
                <div className="flex flex-col items-center gap-0 shrink-0 w-8">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : status === 'current'
                      ? `${accent.iconBg} border-current ${accent.iconText} ring-4 ${accent.ring}`
                      : 'bg-gray-100 border-gray-200 text-gray-400'
                  }`}>
                    {status === 'completed'
                      ? <Check className="w-4 h-4" />
                      : status === 'locked'
                      ? <Lock className="w-3.5 h-3.5" />
                      : <Icon className="w-4 h-4" />
                    }
                  </div>
                  {idx < STAGE_DEFS.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1 min-h-[32px] rounded-full ${
                      status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>

                {/* Stage info button */}
                <button
                  onClick={() => setSelectedStage(idx)}
                  className={`flex-1 mb-3 text-left px-3 py-2.5 rounded-xl transition-all ${
                    isSelected ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold leading-tight ${
                      status === 'locked' ? 'text-gray-400' : status === 'current' ? 'text-gray-900' : 'text-gray-600'
                    }`}>{stageDef.name}</span>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {status === 'completed' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Done</span>
                    )}
                    {status === 'current' && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${accent.badge}`}>Active</span>
                    )}
                    {status === 'locked' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">Locked</span>
                    )}
                    {status === 'current' && (
                      <span className={`text-[9px] font-medium text-gray-400`}>
                        {stageDef.exitConditions.filter(c => gates[c.key]).length}/{stageDef.exitConditions.length} done
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Stage Detail ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Stage Header */}
          <div className={`rounded-2xl border p-6 ${activeStage.accent.iconBg} border-current`} style={{ borderColor: 'transparent' }}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${activeStage.accent.iconBg} border border-current flex items-center justify-center`}>
                <activeStage.Icon className={`w-6 h-6 ${activeStage.accent.iconText}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{activeStage.name}</h2>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${activeStage.accent.badge}`}>
                    Stage {activeStage.order}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{activeStage.description}</p>
              </div>
            </div>
          </div>

          {/* Entry → Exit flow */}
          <div className="grid grid-cols-2 gap-4">
            {/* Entry Triggers */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Entry Triggers</h3>
              </div>
              <ul className="space-y-2">
                {activeStage.entryTriggers.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Exit Conditions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Exit Conditions</h3>
              </div>
              <ul className="space-y-2.5">
                {activeStage.exitConditions.map((cond) => {
                  const met = gates[cond.key];
                  const isCurrentStage = stageStatus(activeStage) === 'current';
                  return (
                    <li key={cond.key} className="flex items-start gap-2 text-xs">
                      <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center border ${
                        met ? 'bg-emerald-500 border-emerald-500' : isCurrentStage ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-gray-50'
                      }`}>
                        {met && <Check className="w-2.5 h-2.5 text-white" />}
                        {!met && isCurrentStage && <Clock className="w-2.5 h-2.5 text-amber-500" />}
                      </div>
                      <span className={met ? 'text-emerald-700 line-through decoration-emerald-300' : isCurrentStage ? 'text-amber-700 font-semibold' : 'text-gray-400'}>
                        {cond.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Advance indicator */}
              {stageStatus(activeStage) === 'current' && (
                <div className={`mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                  activeStage.exitConditions.every(c => gates[c.key])
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {activeStage.exitConditions.every(c => gates[c.key])
                    ? <><Check className="w-3 h-3" /> Ready to advance to next stage</>
                    : <><AlertCircle className="w-3 h-3" /> Conditions not yet met</>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Event Log */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900">Event Log</h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{visibleEvents.length} events</span>
            </div>

            {visibleEvents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No events recorded for this stage yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {visibleEvents.map((event, i) => (
                  <div key={event.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{event.eventName}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">by {event.actor}</p>
                          {event.triggerCondition && (
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                              <span className="font-medium text-gray-500">Trigger:</span> {event.triggerCondition}
                            </p>
                          )}
                          {event.systemAction && (
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                              <span className="font-medium text-gray-500">Action:</span> {event.systemAction}
                            </p>
                          )}
                          {event.outcomeState && (
                            <span className="inline-block mt-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              → {event.outcomeState}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 mt-1">
                        {new Date(event.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Events toggle (show if stageEvents filtered some out) */}
          {events.length > visibleEvents.length && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-900">All Survey Events</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{events.length} total</span>
              </div>
              <div className="divide-y divide-gray-50">
                {events.map((event) => (
                  <div key={event.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate">{event.eventName}</span>
                      <span className="text-[11px] text-gray-400">by {event.actor}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(event.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
