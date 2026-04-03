import React, { useState, useMemo } from 'react';
import { Search, Filter, Bell, UserPlus, MoveRight, Zap, XCircle, Calendar, ChevronLeft, ChevronRight, X, Plus, Briefcase, Users, Building2, FolderOpen, FileText, ChevronDown } from 'lucide-react';
import { Survey, UserRole } from '../types';
import { api } from '../services/api';
import { useRBAC } from '../hooks/useRBAC';
import toast from 'react-hot-toast';
import { ProgressSection } from './ProgressSection';
import { GlobalEvidenceView } from './GlobalEvidenceView';
import { GlobalDocsView } from './GlobalDocsView';

interface SurveysViewProps {
  surveys: Survey[];
  onSurveyClick: (survey: Survey) => void;
  onUpdateSurvey: (survey: Survey) => void;
  onCreateSurvey: () => void;
  userRole: UserRole;
  isReadOnly?: boolean;
}

export function SurveysView({ surveys, onSurveyClick, onUpdateSurvey, onCreateSurvey, userRole, isReadOnly }: SurveysViewProps) {
  const { hasPermission } = useRBAC(userRole);
  const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'survey_list' | 'evidence' | 'docs'>('survey_list');
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'in_progress' | 'all' | 'cancelled' | 'completed'>('new');
  const [scope, setScope] = useState<'me' | 'team' | 'company'>(
    userRole === 'role-handler' ? 'me' : userRole === 'role-manager' ? 'team' : 'company'
  );
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterHypothecation, setFilterHypothecation] = useState<string>('All');
  const [filterRequestFor, setFilterRequestFor] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Update scope when role changes
  React.useEffect(() => {
    setScope(userRole === 'role-handler' ? 'me' : userRole === 'role-manager' ? 'team' : 'company');
  }, [userRole]);

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [updateStageModalOpen, setUpdateStageModalOpen] = useState(false);
  const [addCommentsModalOpen, setAddCommentsModalOpen] = useState(false);
  
  const [selectedHandler, setSelectedHandler] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [newStage, setNewStage] = useState('');
  const [comments, setComments] = useState('');

  // Target IDs for bulk actions from ProgressSections
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCommunicationSurveyId, setSelectedCommunicationSurveyId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  React.useEffect(() => {
    setLoadingUsers(true);
    api.getUsers()
      .then(data => setUsers(data))
      .catch(err => console.error('Failed to fetch users:', err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handlers = users.filter(u => u.role === 'role-handler' || u.role === 'role-manager');

  // Mock Current User & Team
  const currentUser = 'Alex Johnson';
  const teamMembers = ['Alex Johnson', 'Sarah Williams', 'Michael Chen'];

  // Filter surveys based on scope and additional filters
  const filteredSurveys = useMemo(() => {
    let result = surveys;

    // Scope filter
    if (scope === 'me') result = result.filter(s => s.handler === currentUser);
    else if (scope === 'team') result = result.filter(s => teamMembers.includes(s.handler));

    // Category filter
    if (filterCategory !== 'All') result = result.filter(s => s.vehicleCategory === filterCategory);

    // Class filter
    if (filterClass !== 'All') result = result.filter(s => s.vehicleClass === filterClass);

    // Hypothecation filter
    if (filterHypothecation !== 'All') {
      const isHypo = filterHypothecation === 'Yes';
      result = result.filter(s => s.isHypothecated === isHypo);
    }

    // Request Type filter
    if (filterRequestFor !== 'All') result = result.filter(s => s.requestFor === filterRequestFor);

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.id.toLowerCase().includes(q) || 
        s.vehicle.toLowerCase().includes(q) || 
        s.claimNo.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [surveys, scope, filterCategory, filterClass, filterHypothecation, filterRequestFor, searchQuery]);

  const newSurveys = useMemo(() => filteredSurveys.filter(s => s.stage === 'Survey Create/Intake'), [filteredSurveys]);
  const draftSurveys = useMemo(() => filteredSurveys.filter(s => s.stage === 'Draft'), [filteredSurveys]);
  const docsPendingSurveys = useMemo(() => filteredSurveys.filter(s => s.stage === 'Evidence Collection' && !s.docsStatus.includes('Complete')), [filteredSurveys]);
  const photosPendingSurveys = useMemo(() => filteredSurveys.filter(s => s.stage === 'Evidence Collection' && !s.photosStatus.includes('Complete')), [filteredSurveys]);
  const inProgressSurveys = useMemo(() => filteredSurveys.filter(s => s.stage === 'Evidence Collection' && s.docsStatus.includes('Complete') && s.photosStatus.includes('Complete')), [filteredSurveys]);
  const cancelledSurveys = useMemo(() => filteredSurveys.filter(s => s.stage === 'Cancelled'), [filteredSurveys]);
  const completedSurveys = useMemo(() => filteredSurveys.filter(s => s.stage === 'Closing stage'), [filteredSurveys]);
  
  const currentData = useMemo(() => {
    switch (activeSubTab) {
      case 'new': return newSurveys;
      case 'cancelled': return cancelledSurveys;
      case 'completed': return completedSurveys;
      case 'in_progress': return filteredSurveys.filter(s => s.stage === 'Evidence Collection');
      case 'all': default: return filteredSurveys;
    }
  }, [activeSubTab, newSurveys, cancelledSurveys, completedSurveys, filteredSurveys]);

  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    return currentData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [currentData, currentPage, rowsPerPage]);

  // Must be declared unconditionally at top level — used in dashboard tab
  const avgTurnaround = useMemo(() => {
    const completed = filteredSurveys.filter(s => s.stage === 'Closing stage');
    if (completed.length === 0) return '0 Days';
    const totalDays = completed.reduce((acc, s) => {
      const start = new Date(s.requestDate).getTime();
      const end = new Date(s.lastUpdated).getTime();
      if (isNaN(start) || isNaN(end)) return acc + 2.5;
      return acc + Math.max(0.5, (end - start) / (1000 * 60 * 60 * 24));
    }, 0);
    return (totalDays / completed.length).toFixed(1) + ' Days';
  }, [filteredSurveys]);

  const handleTabChange = (tab: 'new' | 'in_progress' | 'all' | 'cancelled' | 'completed') => {
    setActiveSubTab(tab);
    setSelectedRows(new Set());
    setTargetIds(new Set());
    setCurrentPage(1);
  };

  const handleScopeChange = (newScope: 'me' | 'team' | 'company') => {
    setScope(newScope);
    setIsScopeDropdownOpen(false);
    setSelectedRows(new Set());
    setTargetIds(new Set());
    setCurrentPage(1);
  };

  const toggleRowSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const toggleAll = () => {
    const currentPageIds = paginatedData.map(s => s.id);
    const allSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedRows.has(id));
    
    const newSelection = new Set(selectedRows);
    if (allSelected) {
      currentPageIds.forEach(id => newSelection.delete(id));
    } else {
      currentPageIds.forEach(id => newSelection.add(id));
    }
    setSelectedRows(newSelection);
  };

  const handleBulkAction = (action: string, ids?: Set<string>) => {
    const count = ids ? ids.size : selectedRows.size;
    toast.success(`${action} applied to ${count} surveys`);
    if (!ids) setSelectedRows(new Set());
    setTargetIds(new Set());
  };

  const selectedSurveysData = filteredSurveys.filter(s => selectedRows.has(s.id));
  const needsDocs = selectedSurveysData.some(s => !s.docsStatus.includes('Complete'));
  const needsPhotos = selectedSurveysData.some(s => !s.photosStatus.includes('Complete'));

  const handleSmartReminder = () => {
    if (needsDocs && needsPhotos) {
      handleBulkAction('Docs & Photos reminders sent');
    } else if (needsDocs) {
      handleBulkAction('Document reminders sent');
    } else if (needsPhotos) {
      handleBulkAction('Photo reminders sent');
    } else {
      toast.error('Selected surveys already have all documents and photos.');
    }
  };

  const getSystemRefNo = (id: string) => `SYS-${id.replace(/\D/g, '') || Math.floor(Math.random() * 10000)}`;

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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Main Tabs and Scope Selector */}
      {!isReadOnly && (
        <div className="px-8 pt-4 pb-0 border-b border-gray-200 bg-white shrink-0 flex items-end justify-between">
          <div className="flex gap-8">
            <button
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeMainTab === 'dashboard'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
              onClick={() => setActiveMainTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeMainTab === 'survey_list'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
              onClick={() => setActiveMainTab('survey_list')}
            >
              Survey List
            </button>
            <button
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeMainTab === 'docs'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
              onClick={() => setActiveMainTab('docs')}
            >
              Document Collection
            </button>

          </div>

          {hasPermission('survey.assign') && (
            <div className="relative mb-[-1px]">
              <button 
                onClick={() => setIsScopeDropdownOpen(!isScopeDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-t-lg hover:bg-gray-50 transition-colors"
              >
                {scope === 'me' && <><Briefcase className="w-4 h-4 text-indigo-600" /> My Work</>}
                {scope === 'team' && <><Users className="w-4 h-4 text-indigo-600" /> My Team</>}
                {scope === 'company' && <><Building2 className="w-4 h-4 text-indigo-600" /> Company</>}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
              </button>
              
              {isScopeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsScopeDropdownOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                    <button 
                      onClick={() => handleScopeChange('me')}
                      className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors ${scope === 'me' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Briefcase className={`w-4 h-4 ${scope === 'me' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      My Work
                    </button>
                    <button 
                      onClick={() => handleScopeChange('team')}
                      className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors ${scope === 'team' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Users className={`w-4 h-4 ${scope === 'team' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      My Team
                    </button>
                    {userRole === 'role-admin' && (
                      <button 
                        onClick={() => handleScopeChange('company')}
                        className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors ${scope === 'company' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <Building2 className={`w-4 h-4 ${scope === 'company' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        Company
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!isReadOnly && activeMainTab === 'dashboard' ? (
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {/* Dashboard Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Surveys</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{filteredSurveys.filter(s => s.stage !== 'Closed').length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Docs Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{docsPendingSurveys.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">AI Queue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{filteredSurveys.filter(s => s.aiStatus === 'Pending').length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Turnaround</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {avgTurnaround}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Surveys by Stage</h3>
                <div className="flex flex-col gap-4">
                  {[
                    { name: 'New', count: newSurveys.length, color: 'bg-blue-500' },
                    { name: 'In Progress', count: inProgressSurveys.length + docsPendingSurveys.length + photosPendingSurveys.length, color: 'bg-indigo-500' },
                    { name: 'Inspection, Assessment & repair', count: filteredSurveys.filter(s => s.stage === 'Inspection, Assessment & repair').length, color: 'bg-amber-500' },
                    { name: 'Settlement Stage', count: filteredSurveys.filter(s => s.stage === 'Settlement Stage').length, color: 'bg-purple-500' },
                    { name: 'Closing stage', count: filteredSurveys.filter(s => s.stage === 'Closing stage').length, color: 'bg-emerald-500' },
                  ].map(stat => (
                    <div key={stat.name} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-gray-600">{stat.name}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${stat.color} rounded-full`} 
                          style={{ width: `${filteredSurveys.length > 0 ? (stat.count / filteredSurveys.length) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-semibold text-gray-900">{stat.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Recent Activity</h3>
                <div className="flex flex-col gap-4">
                  {filteredSurveys.slice(0, 5).map(survey => (
                    <div 
                      key={survey.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${isReadOnly ? '' : 'hover:bg-gray-50 cursor-pointer'}`} 
                      onClick={() => {
                        if (!isReadOnly) onSurveyClick(survey);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{survey.vehicle}</p>
                        <p className="text-xs text-gray-500 truncate">{survey.id} • {survey.insurer}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {survey.stage}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatLastUpdated(survey.lastUpdated)}</p>
                      </div>
                    </div>
                  ))}
                  {filteredSurveys.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeMainTab === 'evidence' ? (
        <GlobalEvidenceView surveys={filteredSurveys} />
      ) : activeMainTab === 'docs' ? (
        <GlobalDocsView surveys={filteredSurveys} userRole={userRole} />
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Sub Tabs */}
          <div className="px-8 py-3 bg-white border-b border-gray-200 flex gap-2 shrink-0">
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeSubTab === 'new'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleTabChange('new')}
            >
              New
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeSubTab === 'in_progress'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleTabChange('in_progress')}
            >
              In Progress
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeSubTab === 'all'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleTabChange('all')}
            >
              All Surveys
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeSubTab === 'completed'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleTabChange('completed')}
            >
              Completed
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeSubTab === 'cancelled'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleTabChange('cancelled')}
            >
              Cancelled
            </button>
          </div>

          <div className="flex-1 overflow-auto p-8">
            <div className="w-full flex flex-col gap-6">
              
              {/* Header (On Background) */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 text-left">
                    {activeSubTab === 'new' ? 'New Claims' : 
                     activeSubTab === 'all' ? 'All Surveys' : 
                     activeSubTab === 'completed' ? 'Completed Surveys' : 
                     activeSubTab === 'cancelled' ? 'Cancelled Surveys' : 'Surveys'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 text-left">
                    {activeSubTab === 'new' ? 'Claims where Handler Assignment is awaited.' : 
                     activeSubTab === 'all' ? 'Complete directory of all claims and surveys.' : 
                     activeSubTab === 'completed' ? 'Surveys that have been successfully completed.' : 
                     activeSubTab === 'cancelled' ? 'Surveys that were cancelled or rejected.' : ''}
                  </p>
                </div>
                {!isReadOnly && hasPermission('survey.create') && (
                  <button
                    onClick={onCreateSurvey}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Survey
                  </button>
                )}
              </div>

              {/* Global Filters */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Claim, Ref, or Vehicle No..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="2W">2W</option>
                <option value="4W">4W</option>
                <option value="Others">Others</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="All">All Classes</option>
                <option value="Personal">Personal</option>
                <option value="Commercial">Commercial</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                value={filterHypothecation}
                onChange={(e) => setFilterHypothecation(e.target.value)}
              >
                <option value="All">All Hypothecation</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                value={filterRequestFor}
                onChange={(e) => setFilterRequestFor(e.target.value)}
              >
                <option value="All">All Request Types</option>
                <option value="Initial Survey">Initial Survey</option>
                <option value="Final Survey">Final Survey</option>
                <option value="Re-inspection">Re-inspection</option>
              </select>
              <div className="relative">
                <select 
                  className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option>Last Day</option>
                  <option>Last 7 Days</option>
                  <option>Last Week</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                  <option>Custom Date Range</option>
                </select>
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {activeSubTab === 'in_progress' && (
                <div className="flex flex-col gap-8">
                  <ProgressSection
                    title="Documents Pending"
                    description="Surveys pending due to document collection."
                    data={docsPendingSurveys}
                    type="docs"
                    onSurveyClick={onSurveyClick}
                    getSystemRefNo={getSystemRefNo}
                    onAssign={(ids) => { setTargetIds(ids); setAssignModalOpen(true); }}
                    onCancel={(ids) => { setTargetIds(ids); setCancelModalOpen(true); }}
                    onSendReminder={(ids) => handleBulkAction('Document reminders sent', ids)}
                    isReadOnly={isReadOnly}
                  />
                  <ProgressSection
                    title="Photos Pending"
                    description="Surveys pending due to damaged photos collection."
                    data={photosPendingSurveys}
                    type="photos"
                    onSurveyClick={onSurveyClick}
                    getSystemRefNo={getSystemRefNo}
                    onAssign={(ids) => { setTargetIds(ids); setAssignModalOpen(true); }}
                    onCancel={(ids) => { setTargetIds(ids); setCancelModalOpen(true); }}
                    onSendReminder={(ids) => handleBulkAction('Photo reminders sent', ids)}
                    isReadOnly={isReadOnly}
                  />
                  <ProgressSection
                    title="In Progress"
                    description="Survey pending post evidence collection."
                    data={inProgressSurveys}
                    type="progress"
                    onSurveyClick={onSurveyClick}
                    getSystemRefNo={getSystemRefNo}
                    onAssign={(ids) => { setTargetIds(ids); setAssignModalOpen(true); }}
                    onCancel={(ids) => { setTargetIds(ids); setCancelModalOpen(true); }}
                    onUpdateStage={(ids) => { setTargetIds(ids); setUpdateStageModalOpen(true); }}
                    onAddComments={(ids) => { setTargetIds(ids); setAddCommentsModalOpen(true); }}
                    isReadOnly={isReadOnly}
                  />
                </div>
              )}

              {/* Table Card */}
              {activeSubTab !== 'in_progress' && (
                <div className="flex flex-col gap-8">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-fit">
                  
                  {/* Bulk Actions */}

                {/* Bulk Actions */}
                {!isReadOnly && selectedRows.size > 0 && activeSubTab === 'new' && (
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-800">
                      {selectedRows.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                      {hasPermission('survey.assign') && (
                        <button onClick={() => setAssignModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
                          <UserPlus className="w-4 h-4" />
                          Assign
                        </button>
                      )}
                      {hasPermission('survey.stage') && (
                        <button onClick={() => setCancelModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors">
                          <XCircle className="w-4 h-4" />
                          Cancel with Reason
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!isReadOnly && selectedRows.size > 0 && activeSubTab !== 'new' && (
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-800">
                      {selectedRows.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSmartReminder}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Bell className="w-4 h-4" />
                        Send Smart Reminder
                      </button>
                      {hasPermission('survey.assign') && (
                        <button onClick={() => setAssignModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                          <UserPlus className="w-4 h-4" />
                          Assign
                        </button>
                      )}
                      {hasPermission('survey.stage') && (
                        <button onClick={() => handleBulkAction('Stage moved')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                          <MoveRight className="w-4 h-4" />
                          Move
                        </button>
                      )}
                      <button onClick={() => handleBulkAction('AI Inspection triggered')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                        <Zap className="w-4 h-4" />
                        AI Inspect
                      </button>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        {!isReadOnly && (
                          <th className="px-4 py-3 w-12 text-center sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={paginatedData.length > 0 && paginatedData.every(s => selectedRows.has(s.id))}
                              onChange={toggleAll}
                            />
                          </th>
                        )}
                        {activeSubTab === 'new' ? (
                          <>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Ref No</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Claim Number</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Vehicle Number</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Insurer Name</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Claim ID</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Vehicle Number</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Insurer</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">RO</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Handler</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Stage</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Docs Status</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Photos Status</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">AI Status</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Last Updated</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedData.map((survey) => (
                        <tr 
                          key={survey.id} 
                          className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedRows.has(survey.id) ? 'bg-indigo-50/30' : ''}`}
                          onClick={() => {
                            if (!isReadOnly) onSurveyClick(survey);
                          }}
                        >
                          {!isReadOnly && (
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={selectedRows.has(survey.id)}
                                onChange={(e) => toggleRowSelection(survey.id, e as any)}
                              />
                            </td>
                          )}
                          {activeSubTab === 'new' ? (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{getSystemRefNo(survey.id)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onSurveyClick(survey); }}
                                  className="hover:underline focus:outline-none"
                                >
                                  {survey.id}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{survey.vehicle}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{survey.insurer}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onSurveyClick(survey); }}
                                  className="hover:underline focus:outline-none"
                                >
                                  {survey.id}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{survey.vehicle}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{survey.insurer}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{survey.ro}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                    {survey.handler.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  {survey.handler}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {survey.stage}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{survey.docsStatus}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{survey.photosStatus}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{survey.aiStatus}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{survey.lastUpdated}</td>
                            </>
                          )}
                        </tr>
                      ))}
                      {paginatedData.length === 0 && (
                        <tr>
                          <td colSpan={isReadOnly ? (activeSubTab === 'new' ? 4 : 10) : (activeSubTab === 'new' ? 5 : 11)} className="px-4 py-12 text-center text-sm text-gray-500">
                            No claims found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show records:</span>
                    <select 
                      className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {currentData.length === 0 
                        ? '0 records' 
                        : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, currentData.length)} of ${currentData.length}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {activeSubTab === 'new' && draftSurveys.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 text-left">Draft Surveys</h3>
                    <p className="text-sm text-gray-500 mt-1 text-left">Action Yet to be taken on these surveys.</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-fit overflow-hidden">
                    <div className="overflow-x-auto p-0">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/50">
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ref No</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {draftSurveys.map((survey) => (
                            <tr 
                              key={survey.id} 
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => {
                                if (!isReadOnly) onSurveyClick(survey);
                              }}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onSurveyClick(survey); }}
                                  className="hover:underline focus:outline-none"
                                >
                                  {survey.ref}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{survey.requestDate}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {survey.stage}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Assign Handler</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select a handler to assign to the {targetIds.size || selectedRows.size} selected claims.</p>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              value={selectedHandler}
              onChange={(e) => setSelectedHandler(e.target.value)}
              disabled={loadingUsers}
            >
              <option value="">{loadingUsers ? 'Loading handlers...' : 'Select a handler...'}</option>
              {handlers.map(handler => (
                <option key={handler.id} value={handler.name}>{handler.name} ({handler.department})</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setAssignModalOpen(false); setTargetIds(new Set()); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!selectedHandler) return toast.error('Please select a handler');
                  handleBulkAction(`Assigned to ${selectedHandler}`, targetIds.size > 0 ? targetIds : undefined);
                  setAssignModalOpen(false);
                  setSelectedHandler('');
                }} 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Cancel Claims</h3>
              <button onClick={() => { setCancelModalOpen(false); setTargetIds(new Set()); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for cancelling the {targetIds.size || selectedRows.size} selected claims.</p>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            >
              <option value="">Select a reason...</option>
              <option value="Duplicate Claim">Duplicate Claim</option>
              <option value="Customer Requested Cancellation">Customer Requested Cancellation</option>
              <option value="Invalid Vehicle Details">Invalid Vehicle Details</option>
              <option value="Coverage Expired">Coverage Expired</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setCancelModalOpen(false); setTargetIds(new Set()); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Go Back</button>
              <button 
                onClick={() => {
                  if (!cancelReason) return toast.error('Please select a reason');
                  handleBulkAction(`Cancelled: ${cancelReason}`, targetIds.size > 0 ? targetIds : undefined);
                  setCancelModalOpen(false);
                  setCancelReason('');
                }} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Stage Modal */}
      {updateStageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Stage</h3>
              <button onClick={() => { setUpdateStageModalOpen(false); setTargetIds(new Set()); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select the new stage for the {targetIds.size} selected claims.</p>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
            >
              <option value="">Select a stage...</option>
              <option value="Survey Create/Intake">Survey Create/Intake</option>
              <option value="Evidence Collection">Evidence Collection</option>
              <option value="Inspection, Assessment & repair">Inspection, Assessment & repair</option>
              <option value="Settlement Stage">Settlement Stage</option>
              <option value="Closing stage">Closing stage</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setUpdateStageModalOpen(false); setTargetIds(new Set()); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!newStage) return toast.error('Please select a stage');
                  handleBulkAction(`Stage updated to ${newStage}`, targetIds);
                  setUpdateStageModalOpen(false);
                  setNewStage('');
                }} 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comments Modal */}
      {addCommentsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Comments</h3>
              <button onClick={() => { setAddCommentsModalOpen(false); setTargetIds(new Set()); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Add a comment to the {targetIds.size} selected claims.</p>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white h-32 resize-none"
              placeholder="Enter your comments here..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setAddCommentsModalOpen(false); setTargetIds(new Set()); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  if (!comments.trim()) return toast.error('Please enter a comment');
                  handleBulkAction('Comments added', targetIds);
                  setAddCommentsModalOpen(false);
                  setComments('');
                }} 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Save Comments
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
