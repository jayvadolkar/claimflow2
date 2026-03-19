import React, { useState, useMemo } from 'react';
import { Search, Bell, UserPlus, MoveRight, XCircle, Calendar, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Survey } from '../types';

interface ProgressSectionProps {
  title: string;
  description: string;
  data: Survey[];
  type: 'docs' | 'photos' | 'progress';
  onSurveyClick: (survey: Survey) => void;
  getSystemRefNo: (id: string) => string;
  onAssign: (selectedIds: Set<string>) => void;
  onCancel: (selectedIds: Set<string>) => void;
  onUpdateStage?: (selectedIds: Set<string>) => void;
  onAddComments?: (selectedIds: Set<string>) => void;
  onSendReminder?: (selectedIds: Set<string>) => void;
  isReadOnly?: boolean;
}

export function ProgressSection({
  title,
  description,
  data,
  type,
  onSurveyClick,
  getSystemRefNo,
  onAssign,
  onCancel,
  onUpdateStage,
  onAddComments,
  onSendReminder,
  isReadOnly
}: ProgressSectionProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterInsurer, setFilterInsurer] = useState('');
  const [filterHandler, setFilterHandler] = useState('');
  const [filterSpecific, setFilterSpecific] = useState('');

  const filteredData = useMemo(() => {
    let result = data;
    if (filterInsurer) result = result.filter(s => s.insurer === filterInsurer);
    if (filterHandler) result = result.filter(s => s.handler === filterHandler);
    if (filterSpecific) {
      if (type === 'docs') {
        result = result.filter(s => s.docsStatus.includes(filterSpecific));
      } else if (type === 'progress') {
        result = result.filter(s => s.stage.includes(filterSpecific));
      }
    }
    return result;
  }, [data, filterInsurer, filterHandler, filterSpecific, type]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const insurers = useMemo(() => Array.from(new Set(data.map(s => s.insurer))), [data]);
  const handlers = useMemo(() => Array.from(new Set(data.map(s => s.handler))), [data]);

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

  const clearSelection = () => setSelectedRows(new Set());

  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 text-left">{title}</h2>
        <p className="text-sm text-gray-500 mt-1 text-left">{description}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-fit">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              value={filterInsurer}
              onChange={(e) => setFilterInsurer(e.target.value)}
            >
              <option value="">All Insurers</option>
              {insurers.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              value={filterHandler}
              onChange={(e) => setFilterHandler(e.target.value)}
            >
              <option value="">All Handlers</option>
              {handlers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            {type === 'docs' && (
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                value={filterSpecific}
                onChange={(e) => setFilterSpecific(e.target.value)}
              >
                <option value="">All Doc Types</option>
                <option value="RC">RC</option>
                <option value="DL">DL</option>
                <option value="Policy">Policy</option>
              </select>
            )}
            {type === 'progress' && (
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                value={filterSpecific}
                onChange={(e) => setFilterSpecific(e.target.value)}
              >
                <option value="">All Stages</option>
                <option value="Photos Uploaded">Photos Uploaded</option>
                <option value="Drafting Report">Drafting Report</option>
                <option value="Under Review">Under Review</option>
              </select>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {!isReadOnly && selectedRows.size > 0 && (
          <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-800">
              {selectedRows.size} selected
            </span>
            <div className="flex items-center gap-2">
              {onSendReminder && (
                <button onClick={() => { onSendReminder(selectedRows); clearSelection(); }} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
                  <Bell className="w-4 h-4" />
                  Send Reminder
                </button>
              )}
              <button onClick={() => { onAssign(selectedRows); clearSelection(); }} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                <UserPlus className="w-4 h-4" />
                Update Handler
              </button>
              {onUpdateStage && (
                <button onClick={() => { onUpdateStage(selectedRows); clearSelection(); }} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                  <MoveRight className="w-4 h-4" />
                  Update Stage
                </button>
              )}
              {onAddComments && (
                <button onClick={() => { onAddComments(selectedRows); clearSelection(); }} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Add Comments
                </button>
              )}
              <button onClick={() => { onCancel(selectedRows); clearSelection(); }} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors">
                <XCircle className="w-4 h-4" />
                Cancel Claim
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
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Ref No</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Claim No</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Vehicle No</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Insurer Name</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Insured Name</th>
                {type === 'docs' && <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Documents</th>}
                {type === 'photos' && <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Photos</th>}
                {type === 'progress' && <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">Current Stage</th>}
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
                  <td className="px-4 py-3 text-sm text-gray-900">{survey.customerName || 'John Doe'}</td>
                  
                  {type === 'docs' && (
                    <td className="px-4 py-3 text-sm text-gray-500 group relative">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        survey.docsStatus === 'Complete' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {survey.docsStatus === 'Complete' ? 'Complete' : `${survey.docsStatus} Collected`}
                      </span>
                      {survey.docsStatus !== 'Complete' && (
                        <div className="hidden group-hover:block absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded p-2 shadow-lg">
                          <p className="font-semibold mb-1">Pending Documents:</p>
                          <ul className="list-disc pl-4 text-gray-300">
                            <li>Driving License</li>
                            <li>Claim Form</li>
                            <li>Registration Certificate</li>
                          </ul>
                        </div>
                      )}
                    </td>
                  )}
                  {type === 'photos' && (
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        survey.photosStatus === 'Complete' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {survey.photosStatus === 'Complete' ? 'Complete' : `${survey.photosStatus} Submitted`}
                      </span>
                    </td>
                  )}
                  {type === 'progress' && (
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {survey.stage}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={isReadOnly ? 8 : 9} className="px-4 py-12 text-center text-sm text-gray-500">
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
              {data.length === 0 
                ? '0 records' 
                : `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, data.length)} of ${data.length}`}
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
    </div>
  );
}
