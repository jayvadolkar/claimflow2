import React, { useState, useMemo } from 'react';
import { 
  FileText, CheckCircle2, AlertCircle, Clock, Send, 
  Search, Filter, Download, Eye, MoreVertical, 
  User, Building2, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GlobalDocsViewProps {
  surveys: any[];
  userRole?: string;
}

export function GlobalDocsView({ surveys, userRole }: GlobalDocsViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

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

  const allPendingDocs = useMemo(() => {
    const pending: any[] = [];
    surveys.forEach(survey => {
      // In a real app, we'd fetch actual documents. 
      // Here we simulate based on docsStatus string like "2/5"
      if (survey.docsStatus && survey.docsStatus.includes('/')) {
        const [collected, total] = survey.docsStatus.split('/').map(Number);
        if (collected < total) {
          pending.push({
            id: survey.id,
            vehicle: survey.vehicle,
            customer: survey.customerName,
            handler: survey.handler,
            insurer: survey.insurer,
            status: 'Pending',
            progress: survey.docsStatus,
            lastUpdated: survey.lastUpdated,
            type: 'Required Documents'
          });
        }
      } else if (survey.docsStatus === 'Pending') {
        pending.push({
          id: survey.id,
          vehicle: survey.vehicle,
          customer: survey.customerName,
          handler: survey.handler,
          insurer: survey.insurer,
          status: 'Pending',
          progress: '0/5',
          lastUpdated: survey.lastUpdated,
          type: 'All Documents'
        });
      }
    });
    return pending;
  }, [surveys]);

  const filteredDocs = useMemo(() => {
    let docs = allPendingDocs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => 
        d.id.toLowerCase().includes(q) || 
        d.vehicle.toLowerCase().includes(q) || 
        d.customer.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [allPendingDocs, searchQuery]);

  const handleAction = (action: string, id: string) => {
    toast.success(`${action} triggered for ${id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Document Collection</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor and manage document collection across all active surveys.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Claim, Vehicle or Customer..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-80"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors bg-white">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100%-80px)]">
          <div className="flex border-b border-gray-200 px-4 pt-4 bg-gray-50/50">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Pending Collection ({filteredDocs.length})
            </button>
            <button 
              onClick={() => setActiveTab('verified')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'verified' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Recently Verified
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 shadow-sm z-10 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Claim Details</th>
                  <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle & Customer</th>
                  <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Handler</th>
                  <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-indigo-600 hover:underline cursor-pointer">{item.id}</div>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5">{item.insurer}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-gray-900">{item.vehicle}</div>
                      <div className="text-xs text-gray-500">{item.customer}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                          <div 
                            className="h-full bg-amber-500" 
                            style={{ 
                              width: `${(() => {
                                const [collected, total] = item.progress.split('/').map(Number);
                                return total > 0 ? (collected / total) * 100 : 0;
                              })()}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-amber-600">{item.progress}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{item.type}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {item.handler.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-600">{item.handler}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400">
                      {formatLastUpdated(item.lastUpdated)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleAction('Send Reminder', item.id)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Send Reminder"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">No pending document collections found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
