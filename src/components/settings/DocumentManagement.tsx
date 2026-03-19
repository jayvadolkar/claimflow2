import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, Save, Eye, EyeOff, 
  FileText, Check, AlertCircle, Shield, Car, User, 
  Briefcase, DollarSign, FileWarning, MoreHorizontal,
  UploadCloud, Settings, ListChecks, Workflow, LayoutTemplate,
  Loader2
} from 'lucide-react';
import { INITIAL_DOCS } from '../../data/documents';
import { DocumentDef, DocCategory, DocField } from '../../types';
import toast from 'react-hot-toast';

const CATEGORIES: { id: DocCategory; icon: any; count: number }[] = [
  { id: 'Identity', icon: User, count: 3 },
  { id: 'Vehicle', icon: Car, count: 5 },
  { id: 'Driver', icon: Shield, count: 2 },
  { id: 'Legal', icon: Briefcase, count: 4 },
  { id: 'Financial', icon: DollarSign, count: 6 },
  { id: 'Claim', icon: FileWarning, count: 3 },
  { id: 'Policy', icon: FileText, count: 2 },
  { id: 'Workshop', icon: Settings, count: 1 },
  { id: 'Other', icon: FileText, count: 2 },
];

export function DocumentManagement() {
  const [activeCategory, setActiveCategory] = useState<DocCategory>('Identity');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingDoc, setEditingDoc] = useState<DocumentDef | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'upload' | 'applicability' | 'workflow' | 'fields' | 'rbac'>('basic');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error loading documents');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocumentsToApi = async (updatedDocs: DocumentDef[]) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDocs)
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success('Documents saved successfully');
    } catch (error) {
      console.error('Error saving documents:', error);
      toast.error('Error saving documents');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.category === activeCategory && 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (doc: DocumentDef) => {
    setEditingDoc({ ...doc });
    setActiveTab('basic');
    setShowPreview(false);
  };

  const handleSave = () => {
    if (editingDoc) {
      const updatedDocs = documents.map(d => d.id === editingDoc.id ? editingDoc : d);
      if (!documents.find(d => d.id === editingDoc.id)) {
        updatedDocs.push(editingDoc);
      }
      setDocuments(updatedDocs);
      saveDocumentsToApi(updatedDocs);
      setEditingDoc(null);
    }
  };

  const handleDelete = (id: string) => {
    const updatedDocs = documents.filter(d => d.id !== id);
    setDocuments(updatedDocs);
    saveDocumentsToApi(updatedDocs);
  };

  const handleCreate = () => {
    const newDoc: DocumentDef = {
      id: `doc-${Date.now()}`,
      name: 'New Document',
      code: 'NEW_DOC',
      category: activeCategory,
      description: '',
      isSystem: false,
      hasFields: false,
      required: false,
      applicableCases: ['Repair', 'Theft', 'Total Loss'],
      allowedTypes: ['PDF', 'JPG', 'PNG'],
      maxSizeMB: 5,
      multipleUpload: false,
      versioning: false,
      vehicleTypes: ['2W', '4W', 'Others'],
      vehicleClasses: ['Commercial', 'Personal'],
      hypothecation: 'Both',
      workflowStage: 'Evidence Collection',
      uploadRoles: ['handler', 'manager', 'admin'],
      verifyRoles: ['manager', 'admin'],
      rejectRoles: ['manager', 'admin'],
      fields: []
    };
    setEditingDoc(newDoc);
    setActiveTab('basic');
    setShowPreview(false);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Categories */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search Documents"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {CATEGORIES.map(cat => {
              const count = documents.filter(d => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                    {cat.id}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeCategory === cat.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Panel: Document List */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{activeCategory} Documents</h2>
              <p className="text-sm text-gray-500">Manage documents for this category</p>
            </div>
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Document
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <tr>
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center">Fields Enabled</th>
                    <th className="px-4 py-3 text-center">Required</th>
                    <th className="px-4 py-3">Workflow Stage</th>
                    <th className="px-4 py-3">Applicable Cases</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No documents found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {doc.name}
                            {doc.isSystem && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider">System</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{doc.description}</td>
                        <td className="px-4 py-3 text-center">
                          {doc.fields.length > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {doc.required ? (
                            <span className="inline-flex px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">Yes</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium whitespace-nowrap">
                            {doc.workflowStage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {doc.applicableCases && doc.applicableCases.includes('Repair') && doc.applicableCases.includes('Theft') && doc.applicableCases.includes('Total Loss') ? (
                              <span className="text-xs text-gray-600">All Cases</span>
                            ) : (
                              doc.applicableCases?.map(c => (
                                <span key={c} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{c}</span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(doc)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(doc.id)}
                              disabled={doc.isSystem}
                              className={`p-1.5 rounded-md transition-colors ${
                                doc.isSystem 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={doc.isSystem ? "System documents cannot be deleted" : "Delete"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Right Panel: Configuration Modal (Sliding Overlay) */}
      {editingDoc && (
        <div className="absolute inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300 z-10">
          <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between shrink-0 bg-gray-50/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingDoc.id.startsWith('doc-') && !editingDoc.name ? 'Create Document' : 'Edit Document'}
              </h2>
              {editingDoc.isSystem && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase tracking-wider">System Doc</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showPreview ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button 
                onClick={() => setEditingDoc(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {showPreview ? (
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{editingDoc.name || 'Document Name'} Upload</h3>
                    <p className="text-xs text-gray-500 mt-1">{editingDoc.description || 'Document description will appear here.'}</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                      <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                      <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {editingDoc.allowedTypes.join(', ')} (Max. {editingDoc.maxSizeMB}MB)
                      </p>
                    </div>
                    
                    {editingDoc.fields.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        {editingDoc.fields.map(field => (
                          <div key={field.id}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'select' ? (
                              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" disabled>
                                <option>{field.placeholder || 'Select option'}</option>
                              </select>
                            ) : (
                              <input 
                                type={field.type === 'date' ? 'date' : 'text'}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                                disabled
                              />
                            )}
                            {field.isMasked && (
                              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Value will be masked for privacy
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
                      Submit Document
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Configuration Tabs */}
                <div className="flex border-b border-gray-200 px-2 shrink-0 overflow-x-auto hide-scrollbar">
                  {[
                    { id: 'basic', label: 'Basic Info', icon: Settings },
                    { id: 'upload', label: 'Upload Rules', icon: UploadCloud },
                    { id: 'applicability', label: 'Applicability', icon: ListChecks },
                    { id: 'workflow', label: 'Workflow', icon: Workflow },
                    { id: 'fields', label: 'Fields', icon: LayoutTemplate },
                    { id: 'rbac', label: 'Access Control', icon: Shield },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === tab.id 
                          ? 'border-indigo-600 text-indigo-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'basic' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                        <input 
                          type="text" 
                          value={editingDoc.name}
                          onChange={(e) => setEditingDoc({...editingDoc, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Code</label>
                        <input 
                          type="text" 
                          value={editingDoc.code}
                          onChange={(e) => setEditingDoc({...editingDoc, code: e.target.value})}
                          disabled={editingDoc.isSystem}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none ${editingDoc.isSystem ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select 
                          value={editingDoc.category}
                          onChange={(e) => setEditingDoc({...editingDoc, category: e.target.value as DocCategory})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          value={editingDoc.description}
                          onChange={(e) => setEditingDoc({...editingDoc, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                          <p className="text-sm font-medium text-gray-900">System Document</p>
                          <p className="text-xs text-gray-500 mt-0.5">Cannot be deleted or fully modified</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors relative ${editingDoc.isSystem ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editingDoc.isSystem ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'upload' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
                        <div className="flex flex-wrap gap-2">
                          {['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX'].map(type => (
                            <label key={type} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                              <input 
                                type="checkbox" 
                                checked={editingDoc.allowedTypes.includes(type)}
                                onChange={(e) => {
                                  const newTypes = e.target.checked 
                                    ? [...editingDoc.allowedTypes, type]
                                    : editingDoc.allowedTypes.filter(t => t !== type);
                                  setEditingDoc({...editingDoc, allowedTypes: newTypes});
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm font-medium text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum File Size (MB)</label>
                        <input 
                          type="number" 
                          value={editingDoc.maxSizeMB}
                          onChange={(e) => setEditingDoc({...editingDoc, maxSizeMB: parseInt(e.target.value) || 5})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Multiple Upload Allowed</p>
                            <p className="text-xs text-gray-500 mt-0.5">Allow users to upload multiple files for this document</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={editingDoc.multipleUpload}
                            onChange={(e) => setEditingDoc({...editingDoc, multipleUpload: e.target.checked})}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                        </label>
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Versioning Enabled</p>
                            <p className="text-xs text-gray-500 mt-0.5">Keep history of previous uploads when updated</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={editingDoc.versioning}
                            onChange={(e) => setEditingDoc({...editingDoc, versioning: e.target.checked})}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'applicability' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Vehicle Type</h3>
                        <div className="space-y-2">
                          {['2W', '4W', 'Others'].map(type => (
                            <label key={type} className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={editingDoc.vehicleTypes?.includes(type as any) || false}
                                onChange={(e) => {
                                  const newTypes = e.target.checked 
                                    ? [...(editingDoc.vehicleTypes || []), type as any]
                                    : (editingDoc.vehicleTypes || []).filter(t => t !== type);
                                  setEditingDoc({...editingDoc, vehicleTypes: newTypes});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Vehicle Class</h3>
                        <div className="space-y-2">
                          {['Commercial', 'Personal'].map(cls => (
                            <label key={cls} className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={editingDoc.vehicleClasses?.includes(cls as any) || false}
                                onChange={(e) => {
                                  const newClasses = e.target.checked 
                                    ? [...(editingDoc.vehicleClasses || []), cls as any]
                                    : (editingDoc.vehicleClasses || []).filter(c => c !== cls);
                                  setEditingDoc({...editingDoc, vehicleClasses: newClasses});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{cls}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Claim Type</h3>
                        <div className="space-y-2">
                          {['Repair', 'Theft', 'Total Loss'].map(caseType => (
                            <label key={caseType} className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={editingDoc.applicableCases?.includes(caseType as any) || false}
                                onChange={(e) => {
                                  const newCases = e.target.checked 
                                    ? [...(editingDoc.applicableCases || []), caseType as any]
                                    : (editingDoc.applicableCases || []).filter(c => c !== caseType);
                                  setEditingDoc({...editingDoc, applicableCases: newCases});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{caseType}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Hypothecation</h3>
                        <div className="flex gap-4">
                          {['Yes', 'No', 'Both'].map(option => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="hypothecation"
                                checked={editingDoc.hypothecation === option}
                                onChange={() => setEditingDoc({...editingDoc, hypothecation: option as any})}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
                          <div>
                            <p className="text-sm font-medium text-amber-900">Required Document</p>
                            <p className="text-xs text-amber-700 mt-0.5">Must be uploaded to proceed in the workflow</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={editingDoc.required}
                            onChange={(e) => setEditingDoc({...editingDoc, required: e.target.checked})}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'workflow' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 mb-4">Select the stage at which this document becomes required in the checklist.</p>
                      
                      {['Survey Create/Intake', 'Evidence Collection', 'Inspection, Assessment & repair', 'Settlement Stage', 'Closing stage'].map(stage => (
                        <label 
                          key={stage} 
                          className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                            editingDoc.workflowStage === stage 
                              ? 'border-indigo-600 bg-indigo-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="workflowStage"
                            checked={editingDoc.workflowStage === stage}
                            onChange={() => setEditingDoc({...editingDoc, workflowStage: stage as any})}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className={`text-sm font-medium ${editingDoc.workflowStage === stage ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {stage}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {stage === 'Survey Create/Intake' && 'Initial claim intimation and assignment'}
                              {stage === 'Evidence Collection' && 'Initial document collection phase'}
                              {stage === 'Inspection, Assessment & repair' && 'During damage assessment and estimation'}
                              {stage === 'Settlement Stage' && 'Final approval and payment processing'}
                              {stage === 'Closing stage' && 'Report generation and finalization'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {activeTab === 'fields' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Metadata Fields</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Define structured data to capture alongside the document.</p>
                        </div>
                        <label className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Enable Fields</span>
                          <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${editingDoc.hasFields ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <input 
                              type="checkbox" 
                              className="sr-only"
                              checked={editingDoc.hasFields}
                              onChange={(e) => setEditingDoc({...editingDoc, hasFields: e.target.checked})}
                            />
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editingDoc.hasFields ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </label>
                      </div>

                      {editingDoc.hasFields && (
                        <div className="space-y-4">
                          {editingDoc.fields.map((field, index) => (
                            <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900">Field {index + 1}</h4>
                                <button 
                                  onClick={() => {
                                    const newFields = [...editingDoc.fields];
                                    newFields.splice(index, 1);
                                    setEditingDoc({...editingDoc, fields: newFields});
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Field Name</label>
                                  <input 
                                    type="text" 
                                    value={field.label}
                                    onChange={(e) => {
                                      const newFields = [...editingDoc.fields];
                                      newFields[index].label = e.target.value;
                                      newFields[index].code = `${editingDoc.code}_${e.target.value.replace(/\s+/g, '_')}`.toLowerCase();
                                      setEditingDoc({...editingDoc, fields: newFields});
                                    }}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Field Code</label>
                                  <input 
                                    type="text" 
                                    value={field.code}
                                    disabled
                                    className="w-full px-3 py-1.5 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500 outline-none font-mono text-[10px]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                  <select 
                                    value={field.type}
                                    onChange={(e) => {
                                      const newFields = [...editingDoc.fields];
                                      newFields[index].type = e.target.value as any;
                                      setEditingDoc({...editingDoc, fields: newFields});
                                    }}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                                  >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="select">Dropdown</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                                  <input 
                                    type="text" 
                                    value={field.placeholder}
                                    onChange={(e) => {
                                      const newFields = [...editingDoc.fields];
                                      newFields[index].placeholder = e.target.value;
                                      setEditingDoc({...editingDoc, fields: newFields});
                                    }}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Validation Rule (Regex)</label>
                                  <input 
                                    type="text" 
                                    value={field.validationRule}
                                    onChange={(e) => {
                                      const newFields = [...editingDoc.fields];
                                      newFields[index].validationRule = e.target.value;
                                      setEditingDoc({...editingDoc, fields: newFields});
                                    }}
                                    placeholder="e.g. ^[0-9]{12}$"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 font-mono text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={field.required}
                                    onChange={(e) => {
                                      const newFields = [...editingDoc.fields];
                                      newFields[index].required = e.target.checked;
                                      setEditingDoc({...editingDoc, fields: newFields});
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-xs font-medium text-gray-700">Required</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={field.isMasked}
                                    onChange={(e) => {
                                      const newFields = [...editingDoc.fields];
                                      newFields[index].isMasked = e.target.checked;
                                      setEditingDoc({...editingDoc, fields: newFields});
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-xs font-medium text-gray-700">Mask Value</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={field.showInReports}
                                    onChange={(e) => {
                                      const newFields = [...editingDoc.fields];
                                      newFields[index].showInReports = e.target.checked;
                                      setEditingDoc({...editingDoc, fields: newFields});
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-xs font-medium text-gray-700">Show in Reports</span>
                                </label>
                              </div>
                            </div>
                          ))}

                          <button 
                            onClick={() => {
                              setEditingDoc({
                                ...editingDoc,
                                fields: [
                                  ...editingDoc.fields,
                                  { id: `f-${Date.now()}`, label: 'New Field', code: `${editingDoc.code}_new_field`.toLowerCase(), type: 'text', placeholder: '', required: false, isEditable: true, isMasked: false, showInReports: true, validationRule: '' }
                                ]
                              });
                            }}
                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Field
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'rbac' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Upload Permissions</h3>
                        <p className="text-xs text-gray-500 mb-2">Roles or specific users that can upload this document.</p>
                        <div className="space-y-2">
                          {['handler', 'manager', 'admin'].map(role => (
                            <label key={role} className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={editingDoc.uploadRoles.includes(role)}
                                onChange={(e) => {
                                  const newRoles = e.target.checked 
                                    ? [...editingDoc.uploadRoles, role]
                                    : editingDoc.uploadRoles.filter(r => r !== role);
                                  setEditingDoc({...editingDoc, uploadRoles: newRoles});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">{role}</span>
                            </label>
                          ))}
                          <div className="mt-2">
                            <input 
                              type="text"
                              placeholder="Type to add specific user..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const user = e.currentTarget.value;
                                  if (user && !editingDoc.uploadRoles.includes(user as any)) {
                                    setEditingDoc({...editingDoc, uploadRoles: [...editingDoc.uploadRoles, user as any]});
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Verification Permissions</h3>
                        <p className="text-xs text-gray-500 mb-2">Roles or specific users that can verify or approve this document.</p>
                        <div className="space-y-2">
                          {['handler', 'manager', 'admin'].map(role => (
                            <label key={role} className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={editingDoc.verifyRoles.includes(role)}
                                onChange={(e) => {
                                  const newRoles = e.target.checked 
                                    ? [...editingDoc.verifyRoles, role]
                                    : editingDoc.verifyRoles.filter(r => r !== role);
                                  setEditingDoc({...editingDoc, verifyRoles: newRoles});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">{role}</span>
                            </label>
                          ))}
                          <div className="mt-2">
                            <input 
                              type="text"
                              placeholder="Type to add specific user..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const user = e.currentTarget.value;
                                  if (user && !editingDoc.verifyRoles.includes(user as any)) {
                                    setEditingDoc({...editingDoc, verifyRoles: [...editingDoc.verifyRoles, user as any]});
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Rejection Permissions</h3>
                        <p className="text-xs text-gray-500 mb-2">Roles or specific users that can reject this document.</p>
                        <div className="space-y-2">
                          {['handler', 'manager', 'admin'].map(role => (
                            <label key={role} className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={editingDoc.rejectRoles.includes(role)}
                                onChange={(e) => {
                                  const newRoles = e.target.checked 
                                    ? [...editingDoc.rejectRoles, role]
                                    : editingDoc.rejectRoles.filter(r => r !== role);
                                  setEditingDoc({...editingDoc, rejectRoles: newRoles});
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">{role}</span>
                            </label>
                          ))}
                          <div className="mt-2">
                            <input 
                              type="text"
                              placeholder="Type to add specific user..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const user = e.currentTarget.value;
                                  if (user && !editingDoc.rejectRoles.includes(user as any)) {
                                    setEditingDoc({...editingDoc, rejectRoles: [...editingDoc.rejectRoles, user as any]});
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 flex items-center justify-end gap-3">
            <button 
              onClick={() => setEditingDoc(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
