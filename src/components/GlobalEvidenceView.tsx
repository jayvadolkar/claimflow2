import React, { useState } from 'react';
import {
  CheckSquare, AlertTriangle, Clock, Send,
  FileText, Camera, CheckCircle2, Eye, RefreshCw, Download, Filter, Search,
  BarChart2, ShieldAlert, Image as ImageIcon, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Th, Card } from './ui';

export function GlobalEvidenceView({ surveys }: { surveys: any[] }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'missing_docs' | 'photo_issues' | 'verification'>('overview');

  const formatLastUpdated = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  const missingDocs = surveys.filter(s => 
    s.stage === 'Evidence Collection' && 
    (s.docsStatus === 'Pending' || s.docsStatus === 'In Progress')
  ).map(s => ({
    id: s.id,
    vehicle: s.vehicle,
    missing: s.docsStatus === 'Pending' ? 'All Documents' : 'Partial Documents',
    handler: s.handler || 'Unassigned',
    insurer: s.insurer,
    reason: `Pending: ${s.docsStatus}`,
    lastUpdated: s.lastUpdated
  }));

  const photoIssues = surveys.filter(s => 
    s.stage === 'Evidence Collection' && 
    (s.photosStatus === 'Pending' || s.photosStatus === 'In Progress' || s.aiStatus === 'Pending')
  ).map(s => ({
    id: s.id,
    vehicle: s.vehicle,
    issue: s.aiStatus === 'Pending' ? 'AI Not Run' : 'Photos Missing',
    handler: s.handler || 'Unassigned',
    reason: s.aiStatus === 'Pending' ? 'Pending: AI inspection' : `Pending: ${s.photosStatus}`,
    lastUpdated: s.lastUpdated
  }));

  const verificationQueue = surveys.filter(s => 
    s.docsStatus === 'Complete' && s.photosStatus === 'Complete' && s.stage === 'Evidence Collection'
  ).map(s => ({
    id: s.id,
    docs: 'Complete',
    photos: 'Complete',
    handler: s.handler || 'Unassigned',
    status: 'Awaiting Verification',
    lastUpdated: s.lastUpdated
  }));

  const stats = {
    missingDocs: missingDocs.length,
    missingPhotos: photoIssues.length,
    pendingVerification: verificationQueue.length,
    readyForInspection: surveys.filter(s => s.stage === 'Inspection, Assessment & repair').length
  };

  // Calculate insurer stats
  const insurerStats = surveys.reduce((acc: any, s) => {
    if (s.docsStatus !== 'Complete') {
      acc[s.insurer] = (acc[s.insurer] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedInsurers = Object.entries(insurerStats)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 4);

  const maxInsurerCount = Math.max(...Object.values(insurerStats) as number[], 1);

  // Calculate handler stats
  const handlerStats = surveys.reduce((acc: any, s) => {
    if (s.docsStatus !== 'Complete') {
      const name = s.handler || 'Unassigned';
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedHandlers = Object.entries(handlerStats)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 4);

  const maxHandlerCount = Math.max(...Object.values(handlerStats) as number[], 1);

  const handleAction = (action: string, id: string) => {
    toast.success(`${action} triggered for ${id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Evidence Operations</h2>
            <p className="text-sm text-gray-500 mt-1">System-level visibility of evidence across all surveys.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search surveys..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors bg-white">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100%-80px)]">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4 pt-4 bg-gray-50/50">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('missing_docs')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'missing_docs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Missing Documents
            </button>
            <button 
              onClick={() => setActiveTab('photo_issues')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'photo_issues' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Photo Issues
            </button>
            <button 
              onClick={() => setActiveTab('verification')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'verification' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Verification Queue
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto bg-gray-50/30">
            
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <Card padding="md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Missing Documents</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{stats.missingDocs}</p>
                  </Card>
                  <Card padding="md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><ImageIcon className="w-5 h-5" /></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Missing Photos</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{stats.missingPhotos}</p>
                  </Card>
                  <Card padding="md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Verification</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{stats.pendingVerification}</p>
                  </Card>
                  <Card padding="md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ready for Inspection</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{stats.readyForInspection}</p>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Card padding="md">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      Missing Documents by Insurer
                    </h3>
                    <div className="space-y-4">
                      {sortedInsurers.map(([name, count]: any) => (
                        <div key={name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-gray-700">{name}</span>
                            <span className="text-gray-500">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500"
                              style={{ width: `${(count / maxInsurerCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {sortedInsurers.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">No missing documents</p>
                      )}
                    </div>
                  </Card>

                  <Card padding="md">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      Missing Documents by Handler
                    </h3>
                    <div className="space-y-4">
                      {sortedHandlers.map(([name, count]: any) => (
                        <div key={name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-gray-700">{name}</span>
                            <span className="text-gray-500">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${(count / maxHandlerCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {sortedHandlers.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">No missing documents</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* 2. Missing Documents Tab */}
            {activeTab === 'missing_docs' && (
              <table className="w-full text-left border-collapse bg-white">
                <thead className="sticky top-0 bg-gray-50 shadow-sm z-10 border-b border-gray-200">
                  <tr>
                    <Th>Claim</Th>
                    <Th>Vehicle</Th>
                    <Th>Missing Document</Th>
                    <Th>Handler</Th>
                    <Th>Insurer</Th>
                    <Th>Updated</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {missingDocs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-indigo-600 hover:underline cursor-pointer">{item.id}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.vehicle}</td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-gray-900">{item.missing}</div>
                        <div className="text-[10px] font-bold text-red-600 mt-0.5 bg-red-50 inline-block px-1.5 py-0.5 rounded border border-red-100">{item.reason}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.handler}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.insurer}</td>
                      <td className="py-4 px-6 text-xs text-gray-400">{formatLastUpdated(item.lastUpdated)}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleAction('Send Reminder', item.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors ml-auto shadow-sm">
                          <Send className="w-3.5 h-3.5" />
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. Photo Issues Tab */}
            {activeTab === 'photo_issues' && (
              <table className="w-full text-left border-collapse bg-white">
                <thead className="sticky top-0 bg-gray-50 shadow-sm z-10 border-b border-gray-200">
                  <tr>
                    <Th>Claim</Th>
                    <Th>Vehicle</Th>
                    <Th>Issue</Th>
                    <Th>Handler</Th>
                    <Th>Updated</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {photoIssues.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-indigo-600 hover:underline cursor-pointer">{item.id}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.vehicle}</td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-gray-900">{item.issue}</div>
                        <div className="text-[10px] font-bold text-amber-600 mt-0.5 bg-amber-50 inline-block px-1.5 py-0.5 rounded border border-amber-100">{item.reason}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.handler}</td>
                      <td className="py-4 px-6 text-xs text-gray-400">{formatLastUpdated(item.lastUpdated)}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleAction(item.issue === 'AI Not Run' ? 'Run AI' : 'Send Request', item.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors ml-auto shadow-sm">
                          {item.issue === 'AI Not Run' ? <Camera className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                          {item.issue === 'AI Not Run' ? 'Run AI' : 'Send Request'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. Verification Queue Tab */}
            {activeTab === 'verification' && (
              <table className="w-full text-left border-collapse bg-white">
                <thead className="sticky top-0 bg-gray-50 shadow-sm z-10 border-b border-gray-200">
                  <tr>
                    <Th>Claim</Th>
                    <Th>Docs</Th>
                    <Th>Photos</Th>
                    <Th>Handler</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {verificationQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-indigo-600 hover:underline cursor-pointer">{item.id}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> {item.docs}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> {item.photos}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.handler}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-100">
                          <Clock className="w-3.5 h-3.5" /> {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-400">{formatLastUpdated(item.lastUpdated)}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleAction('Verify', item.id)} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
