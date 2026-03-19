import React, { useState } from 'react';
import { Survey } from '../../types';
import { Play, Eye, Loader2, Plus, Trash2, AlertCircle, CheckCircle2, Camera, ShieldCheck, ChevronRight, Search, Package, Maximize, ArrowLeft, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

export function AssessmentTab({ survey, onUpdateSurvey }: { survey: Survey; onUpdateSurvey: (survey: Survey) => void }) {
  const [isInspecting, setIsInspecting] = useState(false);
  
  // Visual Explorer State
  const [explorerState, setExplorerState] = useState<'full' | 'zoomed'>('full');
  const [activeAssemblyId, setActiveAssemblyId] = useState<string | null>(null);
  const [selectedSubPart, setSelectedSubPart] = useState<any | null>(null);

  // Persistence State
  const [assessmentData, setAssessmentData] = useState<any>(survey.assessmentData || {
    damages: [
      { id: 1, image: `https://picsum.photos/seed/${survey.id}dam1/400/300`, label: 'Front Bumper Scuff', confidence: 98 },
      { id: 2, image: `https://picsum.photos/seed/${survey.id}dam2/400/300`, label: 'Left Headlight Broken', confidence: 95 },
      { id: 3, image: `https://picsum.photos/seed/${survey.id}dam3/400/300`, label: 'Hood Dent', confidence: 85 },
      { id: 4, image: `https://picsum.photos/seed/${survey.id}dam4/400/300`, label: 'Left Fender Scratch', confidence: 92 },
      { id: 5, image: `https://picsum.photos/seed/${survey.id}dam5/400/300`, label: 'Grille Cracked', confidence: 88 },
    ],
    mappings: [
      {
        damageId: 1,
        damageLabel: 'Front Bumper Scuff',
        confidence: 98,
        partName: 'OEM Bumper Cover Unpainted',
        partNumber: 'OEM-BC-1102',
        action: 'Replace',
        cost: 12500,
        status: 'mapped'
      },
      {
        damageId: 2,
        damageLabel: 'Left Headlight Broken',
        confidence: 95,
        partName: 'OEM LED Headlight L',
        partNumber: 'OEM-HL-8820',
        action: 'Replace',
        cost: 8200,
        status: 'mapped'
      },
      {
        damageId: 4,
        damageLabel: 'Left Fender Scratch',
        confidence: 92,
        partName: null,
        partNumber: null,
        action: 'Review',
        cost: 0,
        status: 'pending'
      }
    ]
  });

  const handleRunAI = () => {
    setIsInspecting(true);
    toast.loading('Running AI Damage Inspection...', { id: 'ai-inspect' });
    setTimeout(() => {
      setIsInspecting(false);
      toast.success('AI Inspection completed. 5 damages flagged.', { id: 'ai-inspect' });
      api.logEvent(survey.id, {
        eventName: 'AI Inspection Run',
        actor: 'System',
        triggerCondition: 'User triggered AI inspection',
        systemAction: 'Analyzed photos for damage',
        outcomeState: '5 damages flagged'
      }).catch(console.error);
    }, 2500);
  };

  const handleMapPart = (subPart: any) => {
    const newMapping = {
      damageId: Date.now(),
      damageLabel: 'Manual Mapping',
      confidence: 100,
      partName: subPart.oemName,
      partNumber: subPart.oemNumber,
      action: 'Replace',
      cost: subPart.cost,
      status: 'mapped'
    };

    const updatedData = {
      ...assessmentData,
      mappings: [...assessmentData.mappings, newMapping]
    };

    setAssessmentData(updatedData);
    onUpdateSurvey({
      ...survey,
      assessmentData: updatedData
    });

    toast.success(`Mapped ${subPart.oemName} to estimate`);
  };

  // 3D/Visual Car Data Structure
  const carAssemblies = [
    { 
      id: 'front_left', 
      name: 'Front Left Quarter', 
      hotspot: { top: '55%', left: '65%' },
      zoomedImage: 'https://images.unsplash.com/photo-1605816988069-b11383b50717?auto=format&fit=crop&q=80&w=1000',
      subParts: [
        { id: 'fl_fender', name: 'Fender Panel', hotspot: { top: '30%', left: '40%' }, image: `https://picsum.photos/seed/fender/400/300`, oemName: 'OEM Front Left Fender Assembly', oemNumber: 'OEM-FL-9921', cost: 4500 },
        { id: 'fl_headlight', name: 'Headlight Unit', hotspot: { top: '45%', left: '75%' }, image: `https://picsum.photos/seed/headlight/400/300`, oemName: 'OEM LED Headlight L', oemNumber: 'OEM-HL-8820', cost: 8200 },
        { id: 'fl_wheel', name: 'Alloy Wheel', hotspot: { top: '70%', left: '35%' }, image: `https://picsum.photos/seed/wheel/400/300`, oemName: 'OEM 18" Alloy Wheel', oemNumber: 'OEM-AW-1800', cost: 12000 },
      ]
    },
    { 
      id: 'front_bumper', 
      name: 'Front Bumper & Grille', 
      hotspot: { top: '75%', left: '25%' },
      zoomedImage: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=1000',
      subParts: [
        { id: 'fb_cover', name: 'Bumper Cover', hotspot: { top: '60%', left: '50%' }, image: `https://picsum.photos/seed/bumper/400/300`, oemName: 'OEM Bumper Cover Unpainted', oemNumber: 'OEM-BC-1102', cost: 12500 },
        { id: 'fb_grille', name: 'Main Grille', hotspot: { top: '35%', left: '50%' }, image: `https://picsum.photos/seed/grille/400/300`, oemName: 'OEM Radiator Grille', oemNumber: 'OEM-GR-3301', cost: 3200 },
        { id: 'fb_fog', name: 'Fog Light L', hotspot: { top: '75%', left: '20%' }, image: `https://picsum.photos/seed/fog/400/300`, oemName: 'OEM LED Fog Lamp', oemNumber: 'OEM-FL-4402', cost: 2100 },
      ]
    },
    { 
      id: 'hood', 
      name: 'Hood / Bonnet', 
      hotspot: { top: '42%', left: '38%' },
      zoomedImage: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=1000',
      subParts: [
        { id: 'hd_panel', name: 'Hood Panel', hotspot: { top: '50%', left: '50%' }, image: `https://picsum.photos/seed/hood/400/300`, oemName: 'OEM Hood Panel Assembly', oemNumber: 'OEM-HD-5505', cost: 15000 },
        { id: 'hd_hinge', name: 'Hood Hinge L', hotspot: { top: '20%', left: '80%' }, image: `https://picsum.photos/seed/hinge/400/300`, oemName: 'OEM Hood Hinge Left', oemNumber: 'OEM-HH-5506', cost: 800 },
      ]
    }
  ];

  const activeAssembly = carAssemblies.find(a => a.id === activeAssemblyId);

  const handleAssemblyClick = (assemblyId: string) => {
    setActiveAssemblyId(assemblyId);
    setExplorerState('zoomed');
    setSelectedSubPart(null);
  };

  const handleBackToFull = () => {
    setExplorerState('full');
    setActiveAssemblyId(null);
    setSelectedSubPart(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      
      {/* HEADER */}
      <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 sticky top-0 z-20 shadow-sm">
        <div>
          <h2 className="text-xl font-light tracking-tight text-gray-900">Damage Assessment</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">AI Analysis & Part Mapping</p>
        </div>
        <button 
          onClick={handleRunAI}
          disabled={isInspecting}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
        >
          {isInspecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {isInspecting ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      <div className="p-8 space-y-12">
        
        {/* SECTION 1: AI IDENTIFIED DAMAGES (5xN GRID) */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">AI Identified Damages</h3>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {assessmentData.damages.map((damage: any) => (
              <div key={damage.id} className="group relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-indigo-300">
                <img 
                  src={damage.image} 
                  alt={damage.label} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute top-2 right-2 z-10">
                  <div className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest rounded shadow-sm">
                    {damage.confidence}% Match
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <p className="text-white text-xs font-medium truncate">{damage.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: ESTIMATE TO PART MAPPING TABLE */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Current Estimate Mapping</h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Identified Damage</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mapped Part</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Action</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Est. Cost</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessmentData.mappings.map((mapping: any, idx: number) => (
                  <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${mapping.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{mapping.damageLabel}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">AI Confidence: {mapping.confidence}%</div>
                    </td>
                    <td className="px-6 py-4">
                      {mapping.partName ? (
                        <>
                          <div className="font-medium text-indigo-600">{mapping.partName}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{mapping.partNumber}</div>
                        </>
                      ) : (
                        <div className="text-sm text-amber-600 font-medium italic">Pending Manual Selection</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${
                        mapping.action === 'Replace' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {mapping.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 tracking-tighter">
                      {mapping.cost > 0 ? `₹ ${mapping.cost.toLocaleString()}` : '--'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${
                        mapping.status === 'mapped' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {mapping.status === 'mapped' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {mapping.status === 'mapped' ? 'Mapped' : 'Action Required'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: VISUAL 3D CAR EXPLORER & OEM MAPPING */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Visual Part Explorer</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">Select an area on the 3D model to zoom in and map specific sub-parts.</p>
            </div>
            {explorerState === 'zoomed' && (
              <button 
                onClick={handleBackToFull}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Full View
              </button>
            )}
          </div>

          <div className="flex h-[600px]">
            {/* Left Column: Interactive Canvas */}
            <div className="w-2/3 relative bg-slate-900 overflow-hidden border-r border-gray-200">
              {/* Grid Background Pattern */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              
              {explorerState === 'full' ? (
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500">
                  <img 
                    src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=1200" 
                    alt="Full Car View" 
                    className="w-full h-full object-cover mix-blend-luminosity opacity-60"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-indigo-900/30 mix-blend-overlay"></div>
                  
                  {/* Hotspots for Assemblies */}
                  {carAssemblies.map(assembly => (
                    <button
                      key={assembly.id}
                      onClick={() => handleAssemblyClick(assembly.id)}
                      className="absolute group z-10"
                      style={{ top: assembly.hotspot.top, left: assembly.hotspot.left }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-12 h-12 bg-indigo-500/30 rounded-full animate-ping"></div>
                        <div className="w-6 h-6 bg-indigo-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-transform group-hover:scale-125"></div>
                        
                        {/* Tooltip */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xl border border-slate-700">
                            {assembly.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 animate-in fade-in zoom-in-95">
                  <img 
                    src={activeAssembly?.zoomedImage} 
                    alt={activeAssembly?.name} 
                    className="w-full h-full object-cover mix-blend-luminosity opacity-70"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay"></div>
                  
                  {/* Hotspots for Sub-Parts */}
                  {activeAssembly?.subParts.map(subPart => (
                    <button
                      key={subPart.id}
                      onClick={() => setSelectedSubPart(subPart)}
                      className="absolute group z-10"
                      style={{ top: subPart.hotspot.top, left: subPart.hotspot.left }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className={`absolute w-10 h-10 rounded-full animate-ping ${selectedSubPart?.id === subPart.id ? 'bg-emerald-500/40' : 'bg-indigo-500/30'}`}></div>
                        <div className={`w-5 h-5 border-2 border-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all ${selectedSubPart?.id === subPart.id ? 'bg-emerald-500 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-indigo-500 group-hover:scale-125'}`}></div>
                        
                        {/* Tooltip */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xl border border-slate-700">
                            {subPart.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Overlay Title */}
                  <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white px-4 py-2 rounded-lg shadow-2xl">
                    <h4 className="text-sm font-bold tracking-widest uppercase">{activeAssembly?.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Select a sub-part to view OEM details</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: OEM Mapping Details */}
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
                        <span className="text-xs font-medium text-emerald-600">In Stock (2-3 days)</span>
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
