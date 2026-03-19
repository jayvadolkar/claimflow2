import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, FileText, User, LayoutDashboard, FileBarChart, Plus, ClipboardList } from 'lucide-react';
import { searchService, SearchResult } from '../services/searchService';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      searchService.getRecentItems().then(setRecentItems);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length > 0) {
      searchService.search(query).then(setResults);
    } else {
      setResults([]);
    }
  }, [query]);

  const displayResults = query.length > 0 ? results : recentItems;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search claims, customers, vehicles... (Ctrl+K)"
          className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
          onClick={() => setIsOpen(true)}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100]">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query.length === 0 && (
              <div className="p-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg text-sm font-semibold text-gray-700 hover:text-indigo-700">
                    <Plus className="w-4 h-4" /> New Survey
                  </button>
                  <button className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg text-sm font-semibold text-gray-700 hover:text-indigo-700">
                    <ClipboardList className="w-4 h-4" /> View All Reports
                  </button>
                </div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Recent</h3>
              </div>
            )}
            
            {displayResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {query ? 'No results found.' : 'Search for claims, reports, people, or pages.'}
              </div>
            ) : (
              displayResults.map((result) => (
                <div key={result.id} className="p-3 hover:bg-indigo-50 rounded-lg cursor-pointer border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                      {result.type === 'survey' && <ClipboardList className="w-4 h-4" />}
                      {result.type === 'claim' && <FileText className="w-4 h-4" />}
                      {result.type === 'report' && <FileBarChart className="w-4 h-4" />}
                      {result.type === 'people' && <User className="w-4 h-4" />}
                      {result.type === 'navigation' && <LayoutDashboard className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{result.title}</p>
                      {result.description && <p className="text-xs text-gray-500">{result.description}</p>}
                    </div>
                    {result.type === 'navigation' && <span className="text-xs font-medium text-indigo-600">ACTION</span>}
                  </div>
                  
                  {result.metadata && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 pl-11">
                      {Object.entries(result.metadata).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="text-gray-500">{key}: </span>
                          <span className="font-medium text-gray-700">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-right">
            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
