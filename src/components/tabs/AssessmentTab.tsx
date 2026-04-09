import React, { useState } from 'react';
import { Survey } from '../../types';
import {
  Play, Loader2, Plus, AlertCircle, CheckCircle2, ShieldCheck,
  ArrowLeft, Crosshair, Package, Camera, Pencil, Move, Trash2,
  ZoomIn, ZoomOut, AlertTriangle, ChevronRight, RotateCcw, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Annotation {
  label: string;
  confidence: number;
  sublabel?: string;
  top: string; left: string; width: string; height: string;
}

interface VehiclePhoto {
  id: number;
  name: string;
  url: string;
  status: 'ok' | 'flagged' | 'warning';
  annotations?: Annotation[];
}

interface PartRow {
  partName: string;
  ref: string;
  damageTag: string;
  decision: 'Repair' | 'Replace' | 'Reject' | 'Inspect';
  aiUnit: number; aiQty: number; aiGstPct: number; aiGross: number;
  estUnit: number; estQty: number; estGross: number;
  invUnit: number; invQty: number; invGross: number;
  invVariance?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

function DecisionBadge({ d }: { d: PartRow['decision'] }) {
  const cfg = {
    Repair:  'text-orange-600 bg-orange-50',
    Replace: 'text-blue-600   bg-blue-50',
    Reject:  'text-red-600    bg-red-50',
    Inspect: 'text-gray-600   bg-gray-100',
  } as const;
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded ${cfg[d]}`}>
      {d}
    </span>
  );
}

function StatusDot({ status }: { status: VehiclePhoto['status'] }) {
  const c = status === 'ok' ? 'bg-emerald-500' : status === 'flagged' ? 'bg-red-500' : 'bg-amber-400';
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${c}`} />;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AssessmentTab({ survey, onUpdateSurvey }: { survey: Survey; onUpdateSurvey: (survey: Survey) => void }) {
  const [isInspecting, setIsInspecting]       = useState(false);
  const [photoFilter, setPhotoFilter]         = useState<'all' | 'flagged'>('all');
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Visual Explorer State
  const [explorerState, setExplorerState]     = useState<'full' | 'zoomed'>('full');
  const [activeAssemblyId, setActiveAssemblyId] = useState<string | null>(null);
  const [selectedSubPart, setSelectedSubPart] = useState<any | null>(null);

  // ── Vehicle Photos ──────────────────────────────────────────────────────────
  const vehiclePhotos: VehiclePhoto[] = [
    {
      id: 1, name: 'Front bumper', status: 'flagged',
      url: `https://picsum.photos/seed/${survey.id}bump/900/650`,
      annotations: [
        { label: 'Car Bumper Damage 0.9799', confidence: 97.99, sublabel: 'Car Bumper Damage 0.676  Area: 3.37 mi', top: '20%', left: '18%', width: '50%', height: '55%' },
      ]
    },
    { id: 2, name: 'Rear',        status: 'ok',      url: `https://picsum.photos/seed/${survey.id}rear/900/650` },
    { id: 3, name: 'Bonnet',      status: 'flagged', url: `https://picsum.photos/seed/${survey.id}bonn/900/650`,
      annotations: [{ label: 'Hood Dent 0.8520', confidence: 85.2, top: '30%', left: '25%', width: '45%', height: '40%' }]
    },
    { id: 4, name: 'Left side',   status: 'ok',      url: `https://picsum.photos/seed/${survey.id}left/900/650` },
    { id: 5, name: 'Headlamp',    status: 'flagged', url: `https://picsum.photos/seed/${survey.id}head/900/650`,
      annotations: [{ label: 'Headlight Broken 0.9501', confidence: 95.01, top: '25%', left: '30%', width: '40%', height: '45%' }]
    },
    { id: 6, name: 'Engine bay',  status: 'warning', url: `https://picsum.photos/seed/${survey.id}eng/900/650` },
    { id: 7, name: 'Left fender', status: 'ok',      url: `https://picsum.photos/seed/${survey.id}fend/900/650` },
    { id: 8, name: 'Right door',  status: 'ok',      url: `https://picsum.photos/seed/${survey.id}door/900/650` },
  ];

  const flaggedPhotos = vehiclePhotos.filter(p => p.status === 'flagged');
  const visiblePhotos = photoFilter === 'flagged' ? flaggedPhotos : vehiclePhotos;
  const activePhoto   = visiblePhotos[selectedPhotoIdx] ?? visiblePhotos[0];

  // ── Part Evaluation Rows ────────────────────────────────────────────────────
  const partRows: PartRow[] = [
    { partName: 'Front bumper', ref: 'FB-2023 · Front', damageTag: 'Dent',
      decision: 'Repair',
      aiUnit: 18500, aiQty: 1, aiGstPct: 16, aiGross: 18500,
      estUnit: 18500, estQty: 1, estGross: 18500,
      invUnit: 22000, invQty: 1, invGross: 22500, invVariance: 18.9 },
    { partName: 'Bonnet', ref: 'FB-2023 · Front', damageTag: 'Broken',
      decision: 'Replace',
      aiUnit: 18500, aiQty: 1, aiGstPct: 16, aiGross: 22000,
      estUnit: 18500, estQty: 1, estGross: 18500,
      invUnit: 18500, invQty: 1, invGross: 18500 },
    { partName: 'Left headlamp', ref: 'FB-2023 · Front', damageTag: 'Dent',
      decision: 'Reject',
      aiUnit: 18500, aiQty: 1, aiGstPct: 16, aiGross: 18500,
      estUnit: 22000, estQty: 1, estGross: 22000,
      invUnit: 22000, invQty: 1, invGross: 22000 },
    { partName: 'Front bumper', ref: 'FB-2023 · Front', damageTag: 'Dent',
      decision: 'Inspect',
      aiUnit: 18500, aiQty: 1, aiGstPct: 16, aiGross: 18500,
      estUnit: 22000, estQty: 1, estGross: 22000,
      invUnit: 22000, invQty: 1, invGross: 22000 },
  ];

  const aiTotal    = partRows.reduce((s, r) => s + r.aiGross, 0);
  const estTotal   = partRows.reduce((s, r) => s + r.estGross, 0);
  const invTotal   = partRows.reduce((s, r) => s + r.invGross, 0);
  const overCost   = partRows.filter(r => r.invVariance && r.invVariance > 15).length;
  const matched    = partRows.filter(r => r.decision !== 'Reject').length;

  // ── Run AI ──────────────────────────────────────────────────────────────────
  const handleRunAI = () => {
    setIsInspecting(true);
    toast.loading('Running AI Damage Inspection…', { id: 'ai-inspect' });
    setTimeout(() => {
      setIsInspecting(false);
      toast.success('AI Inspection completed. 5 damages flagged.', { id: 'ai-inspect' });
      api.logEvent(survey.id, {
        eventName: 'AI Inspection Run', actor: 'System',
        triggerCondition: 'User triggered AI inspection',
        systemAction: 'Analyzed photos for damage',
        outcomeState: '5 damages flagged'
      }).catch(console.error);
    }, 2500);
  };

  // ── 3D Car Data ─────────────────────────────────────────────────────────────
  const carAssemblies = [
    {
      id: 'front_left', name: 'Front Left Quarter',
      hotspot: { top: '55%', left: '65%' },
      zoomedImage: 'https://images.unsplash.com/photo-1605816988069-b11383b50717?auto=format&fit=crop&q=80&w=1000',
      subParts: [
        { id: 'fl_fender',   name: 'Fender Panel',   hotspot: { top: '30%', left: '40%' }, image: `https://picsum.photos/seed/fender/400/300`,   oemName: 'OEM Front Left Fender Assembly', oemNumber: 'OEM-FL-9921', cost: 4500 },
        { id: 'fl_headlight',name: 'Headlight Unit',  hotspot: { top: '45%', left: '75%' }, image: `https://picsum.photos/seed/headlight/400/300`, oemName: 'OEM LED Headlight L',            oemNumber: 'OEM-HL-8820', cost: 8200 },
        { id: 'fl_wheel',    name: 'Alloy Wheel',     hotspot: { top: '70%', left: '35%' }, image: `https://picsum.photos/seed/wheel/400/300`,     oemName: 'OEM 18" Alloy Wheel',           oemNumber: 'OEM-AW-1800', cost: 12000 },
      ]
    },
    {
      id: 'front_bumper', name: 'Front Bumper & Grille',
      hotspot: { top: '75%', left: '25%' },
      zoomedImage: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=1000',
      subParts: [
        { id: 'fb_cover', name: 'Bumper Cover', hotspot: { top: '60%', left: '50%' }, image: `https://picsum.photos/seed/bumper/400/300`, oemName: 'OEM Bumper Cover Unpainted', oemNumber: 'OEM-BC-1102', cost: 12500 },
        { id: 'fb_grille',name: 'Main Grille',  hotspot: { top: '35%', left: '50%' }, image: `https://picsum.photos/seed/grille/400/300`, oemName: 'OEM Radiator Grille',       oemNumber: 'OEM-GR-3301', cost: 3200 },
        { id: 'fb_fog',   name: 'Fog Light L',  hotspot: { top: '75%', left: '20%' }, image: `https://picsum.photos/seed/fog/400/300`,    oemName: 'OEM LED Fog Lamp',          oemNumber: 'OEM-FL-4402', cost: 2100 },
      ]
    },
    {
      id: 'hood', name: 'Hood / Bonnet',
      hotspot: { top: '42%', left: '38%' },
      zoomedImage: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=1000',
      subParts: [
        { id: 'hd_panel', name: 'Hood Panel',  hotspot: { top: '50%', left: '50%' }, image: `https://picsum.photos/seed/hood/400/300`,  oemName: 'OEM Hood Panel Assembly', oemNumber: 'OEM-HD-5505', cost: 15000 },
        { id: 'hd_hinge', name: 'Hood Hinge L',hotspot: { top: '20%', left: '80%' }, image: `https://picsum.photos/seed/hinge/400/300`, oemName: 'OEM Hood Hinge Left',      oemNumber: 'OEM-HH-5506', cost: 800 },
      ]
    }
  ];

  const activeAssembly = carAssemblies.find(a => a.id === activeAssemblyId);

  const handleMapPart = (subPart: any) => {
    toast.success(`Mapped ${subPart.oemName} to estimate`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">

      {/* HEADER */}
      <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="text-xl font-light tracking-tight text-gray-900">Damage Assessment</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Image Evaluation & Part Mapping</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnnotations(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
              showAnnotations
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            {showAnnotations ? 'Annotations On' : 'Annotations Off'}
          </button>
          <button
            onClick={handleRunAI}
            disabled={isInspecting}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
          >
            {isInspecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isInspecting ? 'Analyzing…' : 'Re-run AI'}
          </button>
        </div>
      </div>

      <div className="p-8 space-y-10">

        {/* QUALITY ALERT BANNER */}
        <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              {flaggedPhotos.length} photos have quality issues — blur or partial frame.
              Re-upload requests sent to insured.
            </p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-widest text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap">
            Request again
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION: IMAGE EVALUATION — split view
        ════════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Panel header */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">Vehicle photographs</span>
              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded">
                {vehiclePhotos.length} photos
              </span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => { setPhotoFilter('all'); setSelectedPhotoIdx(0); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  photoFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >All</button>
              <button
                onClick={() => { setPhotoFilter('flagged'); setSelectedPhotoIdx(0); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  photoFilter === 'flagged' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                Flagged ({flaggedPhotos.length})
              </button>
            </div>
          </div>

          {/* Two-column body */}
          <div className="flex" style={{ minHeight: 560 }}>

            {/* ── LEFT: Photo viewer ──────────────────────────────────── */}
            <div className="w-[52%] flex flex-col border-r border-gray-100">

              {/* Main image with annotations */}
              <div className="relative flex-1 bg-gray-900 overflow-hidden">
                <img
                  key={activePhoto?.id}
                  src={activePhoto?.url}
                  alt={activePhoto?.name}
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />

                {/* Annotation overlay */}
                {showAnnotations && activePhoto?.annotations?.map((ann, i) => (
                  <div key={i} className="absolute" style={{ top: ann.top, left: ann.left, width: ann.width, height: ann.height }}>
                    {/* Red bounding box */}
                    <div className="absolute inset-0 border-2 border-red-500 rounded-sm" />
                    {/* Filled semi-transparent shape */}
                    <div className="absolute inset-0 bg-red-500/15 rounded-sm" />
                    {/* Label chip */}
                    <div className="absolute -top-6 left-0 flex flex-col">
                      <span className="bg-gray-900/80 text-white text-[9px] font-mono px-2 py-0.5 rounded whitespace-nowrap leading-tight">
                        {ann.label}
                      </span>
                      {ann.sublabel && (
                        <span className="bg-gray-900/80 text-white text-[9px] font-mono px-2 py-0.5 rounded whitespace-nowrap leading-tight mt-px">
                          {ann.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* "AI annotated" badge */}
                {showAnnotations && activePhoto?.annotations?.length && (
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="px-2 py-1 bg-gray-800/70 text-gray-200 text-[9px] font-bold uppercase tracking-widest rounded">
                      Bounding Box
                    </span>
                    <span className="px-2 py-1 bg-indigo-600/90 text-white text-[9px] font-bold uppercase tracking-widest rounded flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> AI annotated
                    </span>
                  </div>
                )}

                {/* Toolbar */}
                <div className="absolute top-3 right-3 flex gap-1">
                  {[Pencil, Move, Trash2].map((Icon, i) => (
                    <button key={i} className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white border border-gray-200 rounded shadow-sm transition-all">
                      <Icon className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  ))}
                </div>

                {/* Zoom controls */}
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {[ZoomIn, ZoomOut, RotateCcw].map((Icon, i) => (
                    <button key={i} className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white border border-gray-200 rounded shadow-sm transition-all">
                      <Icon className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ClaimVision meta bar */}
              <div className="px-4 py-2 bg-gray-900 flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                <span className="text-gray-300 font-bold">ClaimVision v2.1</span>
                <span>·</span>
                <span>16 Mar, 2:10 AM</span>
                <span>·</span>
                <span className="text-indigo-300 font-bold">
                  {activePhoto?.annotations
                    ? `${activePhoto.annotations[0].confidence.toFixed(0)}% confidence`
                    : 'No annotation'}
                </span>
                <span>·</span>
                <span>{activePhoto?.annotations?.length ?? 0} region{activePhoto?.annotations?.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Thumbnail strip */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
                {visiblePhotos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoIdx(idx)}
                    className={`flex-shrink-0 group relative flex flex-col items-center gap-1 transition-all ${
                      idx === selectedPhotoIdx ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedPhotoIdx ? 'border-indigo-500 shadow-md shadow-indigo-100' : 'border-transparent'
                    }`}>
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex items-center gap-1 max-w-[64px]">
                      <StatusDot status={photo.status} />
                      <span className="text-[9px] text-gray-600 font-medium truncate">{photo.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Part comparison table ────────────────────────── */}
            <div className="w-[48%] flex flex-col">

              {/* Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-gray-400 w-[30%]">Part name</th>
                      <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-gray-400">Decision</th>
                      <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">AI ₹</th>
                      <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">AI Gross ₹</th>
                      <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">Est ₹</th>
                      <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">Est Gross ₹</th>
                      <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">Inv ₹</th>
                      <th className="px-3 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-gray-400">Inv Gross ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {partRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                        {/* Part name */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 leading-tight">{row.partName}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{row.ref}</p>
                          <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] text-amber-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            {row.damageTag}
                          </span>
                        </td>
                        {/* Decision */}
                        <td className="px-3 py-3">
                          <DecisionBadge d={row.decision} />
                        </td>
                        {/* AI */}
                        <td className="px-3 py-3 text-right">
                          <p className="font-semibold text-gray-900 tabular-nums">{fmt(row.aiUnit)}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{row.aiQty} QTY · {row.aiGstPct}% GST</p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="font-semibold text-gray-900 tabular-nums">{fmt(row.aiGross)}</p>
                          <p className="text-[9px] text-gray-400">1 unit</p>
                        </td>
                        {/* Estimate */}
                        <td className="px-3 py-3 text-right">
                          <p className="font-semibold text-gray-900 tabular-nums">{fmt(row.estUnit)}</p>
                          <p className="text-[9px] text-gray-400">1 unit</p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="font-semibold text-gray-900 tabular-nums">{fmt(row.estGross)}</p>
                          <p className="text-[9px] text-gray-400">1 unit</p>
                        </td>
                        {/* Invoice */}
                        <td className="px-3 py-3 text-right">
                          <p className={`font-semibold tabular-nums ${row.invUnit > row.estUnit ? 'text-red-600' : 'text-gray-900'}`}>
                            {fmt(row.invUnit)}
                          </p>
                          <p className="text-[9px] text-gray-400">1 unit</p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className={`font-semibold tabular-nums ${row.invVariance && row.invVariance > 15 ? 'text-red-600' : 'text-gray-900'}`}>
                            {fmt(row.invGross)}
                          </p>
                          {row.invVariance && (
                            <p className="text-[9px] text-red-500 font-bold mt-0.5">+{row.invVariance}%</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add unlisted part */}
                <button className="w-full flex items-center gap-2 px-4 py-3 text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 border-t border-dashed border-gray-200 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add unlisted part
                </button>
              </div>

              {/* Footer: stats + totals */}
              <div className="border-t border-gray-200 bg-gray-50/80 px-4 py-3 flex items-center justify-between">
                {/* Match stats */}
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> {matched} parts matched
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-3 h-3" /> {partRows.length - matched} missing
                  </span>
                  {overCost > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <ChevronRight className="w-3 h-3 rotate-[-45deg]" /> {overCost} over AI cost &gt;15%
                    </span>
                  )}
                </div>
                {/* Price totals */}
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">AI total</p>
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(aiTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Garage est.</p>
                    <p className="text-sm font-bold text-amber-600 tabular-nums">{fmt(estTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Invoice</p>
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(invTotal)}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION: VISUAL 3D CAR EXPLORER & OEM MAPPING
        ════════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Visual Part Explorer</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">Select an area on the 3D model to zoom in and map specific sub-parts.</p>
            </div>
            {explorerState === 'zoomed' && (
              <button
                onClick={() => { setExplorerState('full'); setActiveAssemblyId(null); setSelectedSubPart(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Full View
              </button>
            )}
          </div>

          <div className="flex h-[600px]">
            {/* Left: Interactive Canvas */}
            <div className="w-2/3 relative bg-slate-900 overflow-hidden border-r border-gray-200">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

              {explorerState === 'full' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=1200" alt="Full Car" className="w-full h-full object-cover mix-blend-luminosity opacity-60" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-indigo-900/30 mix-blend-overlay" />
                  {carAssemblies.map(assembly => (
                    <button key={assembly.id} onClick={() => { setActiveAssemblyId(assembly.id); setExplorerState('zoomed'); setSelectedSubPart(null); }} className="absolute group z-10" style={{ top: assembly.hotspot.top, left: assembly.hotspot.left }}>
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-12 h-12 bg-indigo-500/30 rounded-full animate-ping" />
                        <div className="w-6 h-6 bg-indigo-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-transform group-hover:scale-125" />
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xl border border-slate-700">{assembly.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in-95">
                  <img src={activeAssembly?.zoomedImage} alt={activeAssembly?.name} className="w-full h-full object-cover mix-blend-luminosity opacity-70" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay" />
                  {activeAssembly?.subParts.map(subPart => (
                    <button key={subPart.id} onClick={() => setSelectedSubPart(subPart)} className="absolute group z-10" style={{ top: subPart.hotspot.top, left: subPart.hotspot.left }}>
                      <div className="relative flex items-center justify-center">
                        <div className={`absolute w-10 h-10 rounded-full animate-ping ${selectedSubPart?.id === subPart.id ? 'bg-emerald-500/40' : 'bg-indigo-500/30'}`} />
                        <div className={`w-5 h-5 border-2 border-white rounded-full transition-all ${selectedSubPart?.id === subPart.id ? 'bg-emerald-500 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-indigo-500 group-hover:scale-125 shadow-[0_0_15px_rgba(99,102,241,0.8)]'}`} />
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xl border border-slate-700">{subPart.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white px-4 py-2 rounded-lg shadow-2xl">
                    <h4 className="text-sm font-bold tracking-widest uppercase">{activeAssembly?.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Select a sub-part to view OEM details</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: OEM Mapping Details */}
            <div className="w-1/3 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">OEM Mapping Details</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {!selectedSubPart ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                    <Package className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium text-gray-600">No part selected</p>
                    <p className="text-xs mt-2">
                      {explorerState === 'full'
                        ? 'Click a glowing hotspot on the car to zoom into an assembly.'
                        : 'Click a sub-part hotspot to view OEM details and map to estimate.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                      <img src={selectedSubPart.image} alt={selectedSubPart.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded">Selected</span>
                        <span className="text-xs text-gray-500 font-medium">{activeAssembly?.name}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">{selectedSubPart.oemName}</h4>
                      <p className="text-sm font-mono text-gray-500 mt-1">{selectedSubPart.oemNumber}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Part Cost</span>
                        <span className="text-sm font-mono font-medium text-gray-900">₹ {selectedSubPart.cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Availability</span>
                        <span className="text-xs font-medium text-emerald-600">In Stock (2–3 days)</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Action</label>
                      <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option>Replace Part</option>
                        <option>Repair Part</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleMapPart(selectedSubPart)}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                      Map to Estimate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
