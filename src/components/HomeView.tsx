import React, { useState, useMemo } from 'react';
import { AlertCircle, Plus, UploadCloud, FolderOpen, FileText, CheckCircle2, AlertTriangle, Clock, Activity, Users, ShieldAlert, BarChart3 } from 'lucide-react';
import { Survey } from '../types';
import { Card } from './ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface HomeViewProps {
  surveys: Survey[];
  onNavigate: (view: string) => void;
  onCreateSurvey: () => void;
}

export function HomeView({ surveys, onNavigate, onCreateSurvey }: HomeViewProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'dashboard'>('summary');

  // Calculate metrics
  const pendingDocsCount = surveys.filter(s => s.stage === 'Evidence Collection' && !s.docsStatus.includes('Complete')).length;
  const pendingPhotosCount = surveys.filter(s => s.stage === 'Evidence Collection' && !s.photosStatus.includes('Complete')).length;
  const aiQueueCount = surveys.filter(s => s.aiStatus === 'Pending').length;
  const approvalQueueCount = surveys.filter(s => s.stage === 'Settlement Stage').length;
  const totalActive = surveys.filter(s => s.stage !== 'Closing stage').length;
  const closedThisMonth = surveys.filter(s => s.stage === 'Closing stage').length; // Mock
  const newThisMonth = surveys.filter(s => s.stage === 'Survey Create/Intake').length; // Mock

  const hasIssues = pendingDocsCount > 10 || aiQueueCount > 5 || approvalQueueCount > 5;

  const chartData = [
    { name: 'Survey Create/Intake', count: surveys.filter(s => s.stage === 'Survey Create/Intake').length },
    { name: 'Evidence Collection', count: surveys.filter(s => s.stage === 'Evidence Collection').length },
    { name: 'Inspection, Assessment & repair', count: surveys.filter(s => s.stage === 'Inspection, Assessment & repair').length },
    { name: 'Settlement Stage', count: surveys.filter(s => s.stage === 'Settlement Stage').length },
    { name: 'Closing stage', count: surveys.filter(s => s.stage === 'Closing stage').length },
  ];

  const agingData = [
    { name: '< 24h', count: 45 },
    { name: '1-3 Days', count: 30 },
    { name: '3-7 Days', count: 15 },
    { name: '> 7 Days', count: 5 },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Tabs */}
      <div className="px-8 pt-4 pb-0 border-b border-gray-200 bg-white shrink-0">
        <div className="flex gap-8">
          <button
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'dashboard'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          
          {activeTab === 'summary' ? (
            <>
              {/* 1. System Status */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                {hasIssues ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-amber-800 font-medium">
                      <AlertTriangle className="w-5 h-5" />
                      Attention Required
                    </div>
                    <div className="flex flex-col gap-2">
                      {pendingDocsCount > 10 && (
                        <button onClick={() => onNavigate('surveys')} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors text-left shadow-sm">
                          <span className="text-sm font-medium text-gray-700">
                            <span className="text-amber-600 font-bold mr-1">{pendingDocsCount}</span> claims pending documents for more than 24 hours
                          </span>
                          <span className="text-xs text-amber-600 font-medium">View Queue &rarr;</span>
                        </button>
                      )}
                      {aiQueueCount > 5 && (
                        <button onClick={() => onNavigate('surveys')} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors text-left shadow-sm">
                          <span className="text-sm font-medium text-gray-700">
                            <span className="text-amber-600 font-bold mr-1">{aiQueueCount}</span> surveys awaiting AI inspection
                          </span>
                          <span className="text-xs text-amber-600 font-medium">View Queue &rarr;</span>
                        </button>
                      )}
                      {approvalQueueCount > 5 && (
                        <button onClick={() => onNavigate('surveys')} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors text-left shadow-sm">
                          <span className="text-sm font-medium text-gray-700">
                            <span className="text-amber-600 font-bold mr-1">{approvalQueueCount}</span> claims pending approval for &gt;48 hours
                          </span>
                          <span className="text-xs text-amber-600 font-medium">View Queue &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span className="text-emerald-800 font-medium">System Operating Normally</span>
                  </div>
                )}
              </section>

              {/* 2. Quick Actions */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <button onClick={onCreateSurvey} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <Plus className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">New Claim Intimation</span>
                  </button>
                  <button onClick={() => onNavigate('surveys')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <UploadCloud className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">Upload Survey Photos</span>
                  </button>
                  <button onClick={() => onNavigate('surveys')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <FolderOpen className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">Open Surveys Explorer</span>
                  </button>
                  <button onClick={() => onNavigate('surveys')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">Open My Workboard</span>
                  </button>
                  <button onClick={() => onNavigate('reports')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">Generate Survey Report</span>
                  </button>
                </div>
              </section>

              {/* 3. Key Metrics */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <Card padding="md" className="hover:shadow-md transition-shadow" onClick={() => onNavigate('surveys')}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Outstanding Claims</h3>
                      <Activity className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">{totalActive}</div>
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex justify-between"><span>Current Month</span><span className="font-medium text-gray-700">42</span></div>
                      <div className="flex justify-between"><span>M-1</span><span className="font-medium text-gray-700">18</span></div>
                      <div className="flex justify-between"><span>M-2</span><span className="font-medium text-gray-700">7</span></div>
                      <div className="flex justify-between"><span>Older</span><span className="font-medium text-gray-700">3</span></div>
                    </div>
                  </Card>

                  <Card padding="md" className="hover:shadow-md transition-shadow" onClick={() => onNavigate('surveys')}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Claims Pending Docs</h3>
                      <FolderOpen className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">{pendingDocsCount}</div>
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex justify-between"><span>Current Month</span><span className="font-medium text-gray-700">12</span></div>
                      <div className="flex justify-between"><span>M-1</span><span className="font-medium text-gray-700">5</span></div>
                      <div className="flex justify-between"><span>M-2</span><span className="font-medium text-gray-700">2</span></div>
                      <div className="flex justify-between"><span>Older</span><span className="font-medium text-gray-700">0</span></div>
                    </div>
                  </Card>

                  <Card padding="md" className="hover:shadow-md transition-shadow" onClick={() => onNavigate('surveys')}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Claims Awaiting Approval</h3>
                      <ShieldAlert className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">{approvalQueueCount}</div>
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex justify-between"><span>Current Month</span><span className="font-medium text-gray-700">15</span></div>
                      <div className="flex justify-between"><span>M-1</span><span className="font-medium text-gray-700">4</span></div>
                      <div className="flex justify-between"><span>M-2</span><span className="font-medium text-gray-700">1</span></div>
                      <div className="flex justify-between"><span>Older</span><span className="font-medium text-gray-700">0</span></div>
                    </div>
                  </Card>

                  <Card padding="md" className="hover:shadow-md transition-shadow" onClick={() => onNavigate('surveys')}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">SLA Breach Count</h3>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-red-600 mb-4">14</div>
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex justify-between"><span>Current Month</span><span className="font-medium text-gray-700">8</span></div>
                      <div className="flex justify-between"><span>M-1</span><span className="font-medium text-gray-700">4</span></div>
                      <div className="flex justify-between"><span>M-2</span><span className="font-medium text-gray-700">2</span></div>
                      <div className="flex justify-between"><span>Older</span><span className="font-medium text-gray-700">0</span></div>
                    </div>
                  </Card>

                </div>
              </section>
            </>
          ) : (
            <>
              {/* Dashboard Tab */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Manager Dashboard</h2>
                  <p className="text-sm text-gray-500 mt-1">Operational oversight and team performance.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white shadow-sm">
                    <option>All Regions</option>
                    <option>North</option>
                    <option>South</option>
                    <option>East</option>
                    <option>West</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white shadow-sm">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>This Quarter</option>
                    <option>This Year</option>
                  </select>
                </div>
              </div>

              {/* Dashboard Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="md" className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Team Surveys</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalActive}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                </Card>
                <Card padding="md" className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Docs Pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{pendingDocsCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-amber-600" />
                  </div>
                </Card>
                <Card padding="md" className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">AI Queue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{aiQueueCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                </Card>
                <Card padding="md" className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg Turnaround</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">2.4 Days</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-base font-semibold text-gray-900 mb-6">Team Surveys by Stage</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip 
                          cursor={{ fill: '#f3f4f6' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-base font-semibold text-gray-900 mb-6">Survey Aging</h3>
                  <div className="h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={agingData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {agingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-3 ml-8">
                      {agingData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm text-gray-600">{entry.name}</span>
                          <span className="text-sm font-medium text-gray-900 ml-auto">{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Bottom Row */}
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-gray-900">Handler Productivity</h3>
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Handler Name</th>
                        <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Active Surveys</th>
                        <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Closed (MTD)</th>
                        <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg TAT</th>
                        <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Compliance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-3 text-sm font-medium text-gray-900">Sahil Dash</td>
                        <td className="py-3 text-sm text-gray-500">24</td>
                        <td className="py-3 text-sm text-gray-500">18</td>
                        <td className="py-3 text-sm text-gray-500">1.8 Days</td>
                        <td className="py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">98%</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-sm font-medium text-gray-900">Rohan Mehta</td>
                        <td className="py-3 text-sm text-gray-500">31</td>
                        <td className="py-3 text-sm text-gray-500">12</td>
                        <td className="py-3 text-sm text-gray-500">2.5 Days</td>
                        <td className="py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">85%</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-sm font-medium text-gray-900">Anita Rao</td>
                        <td className="py-3 text-sm text-gray-500">15</td>
                        <td className="py-3 text-sm text-gray-500">22</td>
                        <td className="py-3 text-sm text-gray-500">1.2 Days</td>
                        <td className="py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">99%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
