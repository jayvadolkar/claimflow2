import React, { useState, useEffect, useRef } from 'react';
import { DocumentDef, ImageDef, SurveyProfile, SurveyProfileDocument, SurveyProfileImage, LossType, VehicleType, VehicleClass, HypothecationType } from '../../types';
import { api } from '../../services/api';
import { INITIAL_SURVEY_PROFILES } from '../../data/surveyProfiles';
import { predefinedImages } from '../../data/images';
import { buildRuleLabel } from '../../utils/ruleEngine';
import {
  Plus, Trash2, Save, AlertTriangle, FileText, Camera, Search,
  X, Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';

const LOSS_TYPES: LossType[]          = ['Repair', 'Theft', 'Total Loss', 'Third Party'];
const VEHICLE_TYPES: VehicleType[]    = ['2W', '4W', 'Others'];
const VEHICLE_CLASSES: VehicleClass[] = ['Commercial', 'Personal'];
const HYPO_OPTS: HypothecationType[]  = ['Yes', 'No'];
const WORKFLOW_STAGES = [
  'Survey Create/Intake',
  'Evidence Collection',
  'Inspection, Assessment & Repair',
  'Settlement Stage',
  'Closing Stage',
] as const;

// ── Pill selector ───────────────────────────────────────────────────────────
function PillSelector<T extends string>({
  label, options, selected, onChange,
}: { label: string; options: T[]; selected: T[]; onChange: (v: T[]) => void }) {
  const toggle = (v: T) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-[9px] text-gray-400">{selected.length === 0 ? 'All' : `${selected.length} selected`}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} onClick={() => toggle(opt)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${active
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && <p className="text-[10px] text-gray-400 mt-1 italic">Empty = applies to all</p>}
    </div>
  );
}

// ── Inline stage multi-selector ─────────────────────────────────────────────
const STAGE_SHORT: Record<string, string> = {
  'Survey Create/Intake': 'Intake',
  'Evidence Collection': 'Evidence',
  'Inspection, Assessment & Repair': 'Inspection',
  'Settlement Stage': 'Settlement',
  'Closing Stage': 'Closing',
};

function StageSelector({
  selected,
  defaultStage,
  onChange,
}: {
  selected: string[];
  defaultStage?: string;
  onChange: (v: string[]) => void;
}) {
  const active = selected.length > 0 ? selected : (defaultStage ? [defaultStage] : []);
  const isDefault = selected.length === 0;

  const toggle = (stage: string) => {
    // If currently using default (empty), start from the default value
    const base = isDefault && defaultStage ? [defaultStage] : selected;
    const next = base.includes(stage) ? base.filter(s => s !== stage) : [...base, stage];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {WORKFLOW_STAGES.map(stage => {
        const on = active.includes(stage);
        return (
          <button
            key={stage}
            title={stage}
            onClick={() => toggle(stage)}
            className={`px-1.5 py-0.5 text-[9px] font-bold rounded border transition-all ${
              on
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            {STAGE_SHORT[stage] ?? stage}
          </button>
        );
      })}
      {!isDefault && (
        <button
          title="Reset to document default"
          onClick={() => onChange([])}
          className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-dashed border-gray-300 text-gray-400 hover:text-red-400 hover:border-red-300 transition-all"
        >
          ↺
        </button>
      )}
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, color = 'indigo' }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  };
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-4 rounded-full transition-colors ${checked ? colors[color] : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
    </button>
  );
}

// ── Profile label chip list ─────────────────────────────────────────────────
function ConditionChips({ profile }: { profile: SurveyProfile }) {
  const axes = [
    { vals: profile.applicableCases, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { vals: profile.vehicleTypes,    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { vals: profile.vehicleClasses,  color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { vals: profile.hypothecation,   color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ].filter(a => a.vals && a.vals.length > 0);

  if (axes.length === 0) return <span className="text-[10px] text-gray-400 italic">All surveys (catch-all)</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {axes.map((a, i) => a.vals!.map(v => (
        <span key={`${i}-${v}`} className={`px-1.5 py-0.5 text-[9px] font-bold border rounded ${a.color}`}>{v}</span>
      )))}
    </div>
  );
}

// ── Add item picker (searchable dropdown) ────────────────────────────────────
function ItemPicker({
  items,
  onSelect,
  onClose,
  placeholder,
}: {
  items: { id: string; name: string; category?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
  placeholder: string;
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400" />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {filtered.length === 0
          ? <p className="px-4 py-3 text-xs text-gray-400 italic">No items found</p>
          : filtered.map(item => (
            <button key={item.id}
              onClick={() => { onSelect(item.id); onClose(); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-indigo-50 transition-colors text-left">
              <span className="font-medium text-gray-800 flex-1">{item.name}</span>
              {item.category && <span className="text-[10px] text-gray-400">{item.category}</span>}
            </button>
          ))}
      </div>
      <div className="p-2 border-t border-gray-100">
        <button onClick={onClose} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">Cancel</button>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function SurveyConfiguration() {
  const [profiles, setProfiles] = useState<SurveyProfile[]>([]);
  const [docs, setDocs] = useState<DocumentDef[]>([]);
  const [images] = useState<ImageDef[]>(predefinedImages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showImgPicker, setShowImgPicker] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [docsData, profilesData] = await Promise.all([
          api.getDocuments().catch(() => []),
          api.getSurveyProfiles().catch(() => INITIAL_SURVEY_PROFILES),
        ]);
        setDocs(docsData.length ? docsData : []);
        setProfiles(profilesData.length ? profilesData : INITIAL_SURVEY_PROFILES);
      } catch { toast.error('Failed to load configuration'); }
    })();
  }, []);

  const selected = profiles.find(p => p.id === selectedId) ?? null;

  const mutate = (updater: (p: SurveyProfile) => SurveyProfile) => {
    setProfiles(prev => prev.map(p => p.id === selectedId ? updater(p) : p));
    setIsDirty(true);
  };

  const addProfile = () => {
    const newProfile: SurveyProfile = {
      id: `sp-${Date.now()}`,
      label: 'Default (All)',
      applicableCases: [],
      vehicleTypes: [],
      vehicleClasses: [],
      hypothecation: [],
      documents: [],
      images: [],
      createdAt: new Date().toISOString(),
    };
    setProfiles(prev => [...prev, newProfile]);
    setSelectedId(newProfile.id);
    setIsDirty(true);
  };

  const deleteProfile = () => {
    if (!selected) return;
    setProfiles(prev => prev.filter(p => p.id !== selected.id));
    setSelectedId(null);
    setIsDirty(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await api.saveSurveyProfiles(profiles);
      setIsDirty(false);
      toast.success('Survey configuration saved');
    } catch { toast.error('Failed to save'); }
    finally { setIsSaving(false); }
  };

  // Docs/images not yet in this profile
  const availableDocs = docs.filter(d => !selected?.documents.find(pd => pd.documentId === d.id));
  const availableImgs = images.filter(i => !selected?.images.find(pi => pi.imageId === i.id));

  const filteredProfiles = profiles.filter(p =>
    (p.label ?? buildRuleLabel(p)).toLowerCase().includes(profileSearch.toLowerCase()) ||
    [...(p.applicableCases ?? []), ...(p.vehicleTypes ?? []), ...(p.vehicleClasses ?? []), ...(p.hypothecation ?? [])]
      .some(v => v.toLowerCase().includes(profileSearch.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Survey Configuration</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Create condition profiles — each defines which documents &amp; photos appear for that survey context, and whether they're required or overridable.
          </p>
        </div>
        {isDirty && (
          <button onClick={save} disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : 'Save All Changes'}
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left panel: profile list ──────────────────────────────────────── */}
        <div className="w-72 border-r border-gray-100 flex flex-col shrink-0 bg-gray-50">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <button onClick={addProfile}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Profile
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={profileSearch} onChange={e => setProfileSearch(e.target.value)}
                placeholder="Filter profiles…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 bg-white" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredProfiles.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-6">No profiles yet</p>
            )}
            {filteredProfiles.map(p => {
              const label = p.label || buildRuleLabel(p);
              const isActive = p.id === selectedId;
              const hasNoDocs = p.documents.length === 0 && p.images.length === 0;
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${isActive
                    ? 'bg-white border-indigo-200 shadow-sm'
                    : 'bg-white border-transparent hover:border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-1">
                    <span className={`text-xs font-bold leading-snug ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{label}</span>
                    {hasNoDocs && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" title="No documents or photos assigned" />}
                  </div>
                  <ConditionChips profile={p} />
                  <div className="flex gap-2 mt-1.5">
                    {p.documents.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <FileText className="w-2.5 h-2.5" /> {p.documents.length}
                      </span>
                    )}
                    {p.images.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Camera className="w-2.5 h-2.5" /> {p.images.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: profile editor ───────────────────────────────────── */}
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <Settings2 className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">Select a profile to configure</p>
            <p className="text-xs text-gray-300 max-w-xs">
              Each profile defines a survey context (claim type, vehicle type, etc.) and which documents and photos apply within it.
            </p>
            <button onClick={addProfile}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
              + New Profile
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Profile header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-black text-gray-900">{selected.label || buildRuleLabel(selected)}</p>
                <p className="text-xs text-gray-400">
                  {selected.documents.length} doc{selected.documents.length !== 1 ? 's' : ''} · {selected.images.length} photo{selected.images.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={deleteProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete Profile
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* ── Section 1: Conditions ──────────────────────────────────── */}
              <section>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Conditions</h3>
                <p className="text-xs text-gray-400 mb-4">
                  This profile will apply to surveys matching <strong>all</strong> selected values. Leave an axis empty to match any value on that axis.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <PillSelector label="Survey Type" options={LOSS_TYPES}
                    selected={(selected.applicableCases ?? []) as LossType[]}
                    onChange={v => mutate(p => ({ ...p, applicableCases: v, label: buildRuleLabel({ ...p, applicableCases: v }) }))} />
                  <PillSelector label="Vehicle Type" options={VEHICLE_TYPES}
                    selected={(selected.vehicleTypes ?? []) as VehicleType[]}
                    onChange={v => mutate(p => ({ ...p, vehicleTypes: v, label: buildRuleLabel({ ...p, vehicleTypes: v }) }))} />
                  <PillSelector label="Vehicle Class" options={VEHICLE_CLASSES}
                    selected={(selected.vehicleClasses ?? []) as VehicleClass[]}
                    onChange={v => mutate(p => ({ ...p, vehicleClasses: v, label: buildRuleLabel({ ...p, vehicleClasses: v }) }))} />
                  <PillSelector label="Hypothecation" options={HYPO_OPTS}
                    selected={(selected.hypothecation ?? []) as HypothecationType[]}
                    onChange={v => mutate(p => ({ ...p, hypothecation: v, label: buildRuleLabel({ ...p, hypothecation: v }) }))} />
                </div>
              </section>

              {/* ── Section 2: Documents ───────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Documents</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowDocPicker(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Plus className="w-3 h-3" /> Add Document
                    </button>
                    {showDocPicker && (
                      <ItemPicker
                        items={availableDocs.map(d => ({ id: d.id, name: d.name, category: d.category }))}
                        onSelect={docId => {
                          mutate(p => ({
                            ...p,
                            documents: [...p.documents, { documentId: docId, required: false, canBeOverridden: false }],
                          }));
                        }}
                        onClose={() => setShowDocPicker(false)}
                        placeholder="Search documents…"
                      />
                    )}
                  </div>
                </div>

                {selected.documents.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <FileText className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No documents in this profile. Add documents to control which appear in matching surveys.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Document</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Workflow Stages</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Required</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Overridable</th>
                          <th className="w-10 px-2 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selected.documents.map((pd, i) => {
                          const def = docs.find(d => d.id === pd.documentId);
                          return (
                            <tr key={pd.documentId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <div>
                                    <p className="font-semibold text-gray-800">{def?.name ?? pd.documentId}</p>
                                    {def?.category && <p className="text-[10px] text-gray-400">{def.category}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <StageSelector
                                  selected={pd.workflowStages ?? []}
                                  defaultStage={def?.workflowStage}
                                  onChange={v => mutate(p => ({
                                    ...p,
                                    documents: p.documents.map((d, j) => j === i ? { ...d, workflowStages: v } : d),
                                  }))}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center">
                                  <Toggle checked={pd.required} color="amber"
                                    onChange={v => mutate(p => ({
                                      ...p,
                                      documents: p.documents.map((d, j) => j === i ? { ...d, required: v } : d),
                                    }))} />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center">
                                  <Toggle checked={pd.canBeOverridden} color="purple"
                                    onChange={v => mutate(p => ({
                                      ...p,
                                      documents: p.documents.map((d, j) => j === i ? { ...d, canBeOverridden: v } : d),
                                    }))} />
                                </div>
                              </td>
                              <td className="px-2 py-3">
                                <button onClick={() => mutate(p => ({
                                  ...p,
                                  documents: p.documents.filter((_, j) => j !== i),
                                }))}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* ── Section 3: Photos ──────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Photos</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowImgPicker(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Plus className="w-3 h-3" /> Add Photo
                    </button>
                    {showImgPicker && (
                      <ItemPicker
                        items={availableImgs.map(i => ({ id: i.id, name: i.name, category: i.workflowStage }))}
                        onSelect={imgId => {
                          mutate(p => ({
                            ...p,
                            images: [...p.images, { imageId: imgId, required: false, canBeOverridden: false }],
                          }));
                        }}
                        onClose={() => setShowImgPicker(false)}
                        placeholder="Search photos…"
                      />
                    )}
                  </div>
                </div>

                {selected.images.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <Camera className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No photos in this profile. Add photos to control which appear in matching surveys.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Photo</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Workflow Stages</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Required</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">Overridable</th>
                          <th className="w-10 px-2 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selected.images.map((pi, i) => {
                          const def = images.find(img => img.id === pi.imageId);
                          return (
                            <tr key={pi.imageId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Camera className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <p className="font-semibold text-gray-800">{def?.name ?? pi.imageId}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <StageSelector
                                  selected={pi.workflowStages ?? []}
                                  defaultStage={def?.workflowStage}
                                  onChange={v => mutate(p => ({
                                    ...p,
                                    images: p.images.map((img, j) => j === i ? { ...img, workflowStages: v } : img),
                                  }))}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center">
                                  <Toggle checked={pi.required} color="amber"
                                    onChange={v => mutate(p => ({
                                      ...p,
                                      images: p.images.map((img, j) => j === i ? { ...img, required: v } : img),
                                    }))} />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center">
                                  <Toggle checked={pi.canBeOverridden} color="purple"
                                    onChange={v => mutate(p => ({
                                      ...p,
                                      images: p.images.map((img, j) => j === i ? { ...img, canBeOverridden: v } : img),
                                    }))} />
                                </div>
                              </td>
                              <td className="px-2 py-3">
                                <button onClick={() => mutate(p => ({
                                  ...p,
                                  images: p.images.filter((_, j) => j !== i),
                                }))}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
