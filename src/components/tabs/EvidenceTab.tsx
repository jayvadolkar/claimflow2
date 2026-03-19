import React, { useState } from 'react';
import { Survey } from '../../types';
import { 
  CheckCircle2, AlertTriangle, UploadCloud, Eye, RefreshCw, Send, 
  FileText, Image as ImageIcon, Camera, CheckSquare, Clock, MessageSquare, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

interface EvidenceTabProps {
  survey: Survey;
  userRole?: string;
}

export function EvidenceTab({ survey, userRole }: EvidenceTabProps) {
  const [activePhotoCategory, setActivePhotoCategory] = useState<'vehicle' | 'damage'>('vehicle');

  const documents = [
    { id: 1, type: 'RC', status: 'Uploaded', uploadedBy: 'Insured', uploadedAt: '12 Feb 2026' },
    { id: 2, type: 'DL', status: 'Uploaded', uploadedBy: 'Insured', uploadedAt: '12 Feb 2026' },
    { id: 3, type: 'Claim Form', status: 'Missing', uploadedBy: '—', uploadedAt: '—' },
    { id: 4, type: 'Estimate', status: 'Uploaded', uploadedBy: 'Garage', uploadedAt: '13 Feb 2026' },
  ];

  const vehiclePhotos = [
    { id: 1, label: 'Front View', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified' },
    { id: 2, label: 'Rear View', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified' },
    { id: 3, label: 'Left Side', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified' },
    { id: 4, label: 'Right Side', url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Verified' },
  ];

  const damagePhotos = [
    { id: 5, label: 'Damage 1', url: 'https://images.unsplash.com/photo-1605557202138-097824c3e074?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Pending' },
    { id: 6, label: 'Damage 2', url: 'https://images.unsplash.com/photo-1566315582498-8e6821217822?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Pending' },
    { id: 7, label: 'Damage 3', url: 'https://images.unsplash.com/photo-1507133750070-44d2ce2e6241?auto=format&fit=crop&q=80&w=400&h=300', date: '12 Feb', by: 'Insured', aiStatus: 'Pending' },
  ];

  const requests = [
    { id: 1, request: 'RC Request', sentTo: 'Insured', channel: 'WhatsApp', status: 'Delivered', sentAt: '12 Feb' },
    { id: 2, request: 'Estimate Request', sentTo: 'Garage', channel: 'Email', status: 'Sent', sentAt: '13 Feb' },
  ];

  const verificationItems = [
    { id: 1, label: 'RC Verified', status: 'success' },
    { id: 2, label: 'DL Verified', status: 'success' },
    { id: 3, label: 'Claim Form Missing', status: 'warning' },
    { id: 4, label: 'Photos Valid', status: 'success' },
    { id: 5, label: 'Estimate Valid', status: 'success' },
  ];

  const handleAction = (action: string) => {
    toast.success(`${action} action triggered`);
    api.logEvent(survey.id, {
      eventName: action,
      actor: 'User',
      triggerCondition: 'Manual action',
      systemAction: `Triggered ${action}`,
      outcomeState: 'Pending'
    }).catch(console.error);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-6 space-y-8">
      
      {/* 1. Evidence Status (Top Summary) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Evidence Status
          </h3>
          <div className="flex gap-3">
            <button onClick={() => handleAction('Send Document Request')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
              <Send className="w-4 h-4" />
              Send Request
            </button>
            <button onClick={() => handleAction('Upload Evidence')} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
              <UploadCloud className="w-4 h-4" />
              Upload Evidence
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Documents</span>
            <span className="text-xl font-black text-gray-900">3 / 4 <span className="text-sm font-medium text-gray-500 normal-case">uploaded</span></span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Photos</span>
            <span className="text-xl font-black text-gray-900">8 <span className="text-sm font-medium text-gray-500 normal-case">uploaded</span></span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estimate</span>
            <span className="text-xl font-black text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Uploaded
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">AI Inspection</span>
            <span className="text-xl font-black text-amber-600 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Pending
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md text-sm font-bold border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
            Missing Claim Form
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-sm font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            Evidence ready for inspection
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* 2. Documents (Table) */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />
          Documents
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Uploaded At</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-bold text-gray-900">{doc.type}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                      doc.status === 'Uploaded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {doc.status === 'Uploaded' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{doc.uploadedBy}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{doc.uploadedAt}</td>
                  <td className="py-3 px-4 text-right">
                    {doc.status === 'Uploaded' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleAction(`View ${doc.type}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction(`Replace ${doc.type}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Replace">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction(`Download ${doc.type}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleAction(`Request ${doc.type}`)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors">
                        Request
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* 3. Photos (Grid View) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            Photos
          </h3>
          <div className="flex items-center gap-2">
            <div className="bg-gray-200/50 p-1 rounded-lg flex">
              <button 
                onClick={() => setActivePhotoCategory('vehicle')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activePhotoCategory === 'vehicle' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Vehicle Photos
              </button>
              <button 
                onClick={() => setActivePhotoCategory('damage')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activePhotoCategory === 'damage' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Damage Photos
              </button>
            </div>
            <button onClick={() => handleAction('Run AI Inspection')} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm ml-2">
              <Camera className="w-4 h-4" />
              Run AI Inspection
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {(activePhotoCategory === 'vehicle' ? vehiclePhotos : damagePhotos).map((photo) => (
            <div key={photo.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => handleAction(`View ${photo.label}`)} className="p-2 bg-white text-gray-900 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleAction(`Replace ${photo.label}`)} className="p-2 bg-white text-gray-900 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-gray-900">{photo.label}</h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    photo.aiStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {photo.aiStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{photo.date}</span>
                  <span>By {photo.by}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Upload Placeholder */}
          <button onClick={() => handleAction('Upload Photo')} className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all aspect-video">
            <UploadCloud className="w-6 h-6 mb-2" />
            <span className="text-sm font-bold">Upload Photo</span>
          </button>
        </div>
      </section>

      <hr className="border-gray-200" />

      <div className="grid grid-cols-2 gap-8">
        {/* 4. Requests (Small Table) */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Requests
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Request</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sent To</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-bold text-gray-900">{req.request}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{req.sentAt} • {req.channel}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{req.sentTo}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleAction(`Resend ${req.request}`)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                        Resend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Verification (Checklist) */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Verification
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col h-[calc(100%-2.5rem)]">
            <div className="space-y-3 flex-1">
              {verificationItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  )}
                  <span className={`text-sm font-bold ${item.status === 'success' ? 'text-gray-900' : 'text-amber-700'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            
            <button onClick={() => handleAction('Mark Evidence Complete')} className="w-full mt-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
              Mark Evidence Complete
            </button>
          </div>
        </section>
      </div>

    </div>
  );
}
