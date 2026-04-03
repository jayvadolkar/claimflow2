import React, { useState, useEffect } from 'react';
import { ImageDef } from '../../types';
import { predefinedImages } from '../../data/images';
import { api } from '../../services/api';
import {
  Plus, Search,
  MoreHorizontal, Trash2, Edit3, X, ShieldCheck,
  Camera, Copy, Shield, User,
  Loader2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';


export function ImageManagement() {
  const [images, setImages] = useState<ImageDef[]>(predefinedImages);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);
  
  const [editingImage, setEditingImage] = useState<ImageDef | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions'>('basic');
  const [openMenu, setOpenMenu] = useState<{ id: string; top: number; right: number } | null>(null);

  // Users & Roles config
  const [users, setUsers] = useState<any[]>([]);
  const [rolesData, setRolesData] = useState<any[]>([]);
  const [assignPopover, setAssignPopover] = useState<{ actionKey: string; top: number; left: number } | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  useEffect(() => {
    // We could fetch images here if they were in the backend instead of predefinedImages
    api.getUsers().then(setUsers).catch(console.error);
    api.getRoles().then(setRolesData).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.actions-dropdown')) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = () => {
    const newImg: ImageDef = {
      id: `img-${Date.now()}`,
      name: 'New Image Requirement',
      description: '',
      workflowStage: 'Evidence Collection',
      required: false,
      aiInspection: false,
      isSystem: false,
      applicableCases: ['Repair', 'Theft', 'Total Loss'],
      vehicleTypes: ['2W', '4W', 'Others'],
      vehicleClasses: ['Commercial', 'Personal'],
      hypothecation: ['Yes', 'No'],
      permissions: { upload: [], verify: [], reject: [], view: [], create: [], delete: [] }
    };
    setEditingImage(newImg);
    setActiveTab('basic');
    setOpenMenu(null);
  };

  const handleDuplicate = (img: ImageDef) => {
    const duplicatedImage: ImageDef = {
      ...img,
      id: `img-${Date.now()}`,
      name: `${img.name} (Copy)`,
      isSystem: false
    };
    setImages([...images, duplicatedImage]);
    toast.success(`"${img.name}" duplicated successfully`);
    setOpenMenu(null);
  };

  const handleEdit = (img: ImageDef) => {
    setEditingImage({ ...img });
    setActiveTab('basic');
    setOpenMenu(null);
  };

  const handleDelete = (id: string) => {
    const img = images.find(i => i.id === id);
    if (img?.isSystem) {
      toast.error('Cannot delete system required images');
      return;
    }
    setImages(images.filter(i => i.id !== id));
    toast.success('Image requirement removed');
    setOpenMenu(null);
  };

  const handleSave = () => {
    if (editingImage) {
      const isNew = !images.find(i => i.id === editingImage.id);
      if (isNew) {
        setImages([...images, editingImage]);
        toast.success(`Created "${editingImage.name}"`);
      } else {
        setImages(images.map(i => i.id === editingImage.id ? editingImage : i));
        toast.success(`Updated "${editingImage.name}"`);
      }
      setEditingImage(null);
    }
  };

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Main List Panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Image Configuration</h2>
                <p className="text-sm text-gray-500">Manage required pictures and templates</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search image rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Requirement
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                    <tr>
                      <th className="px-4 py-3">Photo Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-center">AI Guard</th>
                      <th className="px-4 py-3 text-center">Required</th>
                      <th className="px-4 py-3">Workflow Stage</th>
                      <th className="px-4 py-3">Applicable Cases</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredImages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p>No images found matching criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredImages.map(img => (
                        <tr key={img.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 flex flex-col">
                              <span className="flex items-center gap-2">
                                {img.name}
                                {img.isSystem && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider">System</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{img.description || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {img.aiInspection ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {img.required ? (
                              <span className="inline-flex px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">Yes</span>
                            ) : (
                              <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium whitespace-nowrap">
                              {img.workflowStage}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {img.applicableCases && img.applicableCases.includes('Repair') && img.applicableCases.includes('Theft') && img.applicableCases.includes('Total Loss') ? (
                                <span className="text-xs text-gray-600">All Cases</span>
                              ) : (
                                img.applicableCases?.map(c => (
                                  <span key={c} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{c}</span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="relative inline-block actions-dropdown">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (openMenu?.id === img.id) {
                                    setOpenMenu(null);
                                  } else {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setOpenMenu({ id: img.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {openMenu?.id === img.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                  <div
                                    className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-44 py-1 animate-in fade-in zoom-in-95 duration-100"
                                    style={{ top: openMenu.top, right: openMenu.right }}
                                  >
                                    <button
                                      onClick={() => handleEdit(img)}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4 text-gray-400" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDuplicate(img)}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Copy className="w-4 h-4 text-gray-400" /> Duplicate
                                    </button>
                                    {!img.isSystem && (
                                      <>
                                        <div className="mx-3 my-1 border-t border-gray-100" />
                                        <button
                                          onClick={() => handleDelete(img.id)}
                                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500" /> Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
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
      {editingImage && (
        <div className="absolute inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300 z-10">
          <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between shrink-0 bg-gray-50/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900 truncate max-w-[300px]">
                {editingImage.id.startsWith('img-') && !editingImage.name ? 'Create Image Type' : `Edit Image Type - ${editingImage.name}`}
              </h2>
              {editingImage.isSystem && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase tracking-wider">System Image</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEditingImage(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Configuration Tabs */}
            <div className="flex border-b border-gray-200 px-2 shrink-0 overflow-x-auto hide-scrollbar">
              {[
                { id: 'basic', label: 'Basic Info', icon: Camera },
                { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'basic' | 'permissions')}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image Name</label>
                    <input 
                      type="text" 
                      value={editingImage.name}
                      onChange={(e) => setEditingImage({...editingImage, name: e.target.value})}
                      disabled={editingImage.isSystem}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none ${editingImage.isSystem ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
                    <textarea 
                      value={editingImage.description || ''}
                      onChange={(e) => setEditingImage({...editingImage, description: e.target.value})}
                      rows={3}
                      placeholder="e.g. Ensure the license plate is clearly visible"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection Workflow Stage</label>
                    <select 
                      value={editingImage.workflowStage}
                      onChange={(e) => setEditingImage({...editingImage, workflowStage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      {['Survey Create/Intake', 'Evidence Collection', 'Inspection, Assessment & repair', 'Settlement Stage', 'Closing stage'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">System Requirement</p>
                      <p className="text-xs text-gray-500 mt-0.5">Cannot be deleted or renamed</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${editingImage.isSystem ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editingImage.isSystem ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div className="space-y-6">
                  {/* Redirect notice */}
                  <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <ExternalLink className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">Applicability &amp; required rules moved</p>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        When this image is required, overridable, and which survey types it appears in is now configured per survey context in{' '}
                        <span className="font-bold">Settings → Survey Configuration</span>.
                        This lets you set different rules for Repair vs. Theft vs. Total Loss without touching the image definition.
                      </p>
                    </div>
                  </div>

                  {/* AI Context Guard */}
                  <div>
                    <label className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-200/60 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-blue-900">AI Context Guard</p>
                        <p className="text-xs text-blue-700/80 mt-0.5">Automated image-level validation via AI Vision</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${editingImage.aiInspection ? 'bg-blue-500' : 'bg-blue-200/50'}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={editingImage.aiInspection}
                          onChange={(e) => setEditingImage({...editingImage, aiInspection: e.target.checked})}
                        />
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editingImage.aiInspection ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </label>
                  </div>

                  {/* ─ Actor Permissions ─────────────────────────────── */}
                  <div className="pt-5 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Actor Permissions</h3>
                    <p className="text-xs text-gray-500 mb-4">Assign specific roles that are authorized to perform actions on this image requirement.</p>

                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mt-2">
                      {[
                        { key: 'view', label: 'View Image', desc: 'Can view the collected image' },
                        { key: 'verify', label: 'Verify', desc: 'Can verify standard requirements / approve AI match' },
                        { key: 'reject', label: 'Reject', desc: 'Can reject image and request re-collection' },
                        { key: 'upload', label: 'Upload / Collect', desc: 'Can capture/upload images initially' },
                      ].map(action => {
                        const perms = editingImage.permissions ?? { upload: [], verify: [], reject: [], view: [], create: [], delete: [] };
                        const assignedIds = perms[action.key as keyof typeof perms] as string[];
                        
                        // Map IDs to objects
                        const assignedItems = assignedIds.map(id => {
                          const r = rolesData.find(x => x.id === id);
                          if (r) return { ...r, type: 'role' as const };
                          const u = users.find(x => x.id === id);
                          if (u) return { ...u, type: 'user' as const };
                          return { id, name: 'Unknown', type: 'unknown' as const };
                        }).filter(x => x.type !== 'unknown');

                        return (
                          <div key={action.key} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 bg-gray-50/20 hover:bg-gray-50/60 transition-colors gap-4">
                            <div className="sm:max-w-xs shrink-0 pt-1">
                              <h4 className="text-sm font-bold text-gray-900">{action.label}</h4>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed pr-4">{action.desc}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 flex-1 sm:justify-end">
                              {assignedItems.map(item => (
                                <div key={item.id} className={`flex items-center gap-1.5 px-3 py-1.5 border shadow-sm rounded-lg ${
                                  item.type === 'role' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-200'
                                }`}>
                                  {item.type === 'role' ? <Shield className="w-3.5 h-3.5 text-indigo-500" /> : <User className="w-3.5 h-3.5 text-gray-500" />}
                                  <span className="text-xs font-semibold text-gray-700">
                                    {item.name}
                                    {item.type === 'role' && <span className="ml-1.5 text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Role</span>}
                                  </span>
                                  <button 
                                    onClick={() => {
                                      const updated = assignedIds.filter(id => id !== item.id);
                                      setEditingImage({ ...editingImage, permissions: { ...perms, [action.key]: updated } });
                                    }}
                                    className="p-0.5 text-gray-400 hover:text-red-600 transition-colors ml-1"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignSearch('');
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setAssignPopover({ actionKey: action.key, top: rect.bottom + 4, left: rect.left - 100 });
                                }} 
                                className="px-3 py-1.5 text-xs font-bold border border-dashed border-gray-300 rounded-lg text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95 bg-white"
                              >
                                + Add Link
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 flex items-center justify-between">
              <button 
                onClick={() => setEditingImage(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Popover for Role/User Assignment */}
      {assignPopover && editingImage && (
        <>
          <div className="fixed inset-0 z-[120]" onClick={() => setAssignPopover(null)} />
          <div 
            className="fixed z-[130] w-64 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200 pt-2 pb-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
            style={{ 
              top: Math.min(assignPopover.top, window.innerHeight - 300), 
              left: Math.min(assignPopover.left, window.innerWidth - 300) 
            }}
          >
            <div className="px-3 pb-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search roles or users..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto px-1 py-1 hide-scrollbar">
              {(() => {
                const perms = editingImage.permissions ?? { upload: [], verify: [], reject: [], view: [], create: [], delete: [] };
                const assignedIds = perms[assignPopover.actionKey as keyof typeof perms] as string[];
                
                const filteredRoles = rolesData.filter(r => 
                  !assignedIds.includes(r.id) && r.name.toLowerCase().includes(assignSearch.toLowerCase())
                );
                const filteredUsers = users.filter(u => 
                  !assignedIds.includes(u.id) && (u.name.toLowerCase().includes(assignSearch.toLowerCase()) || u.email.toLowerCase().includes(assignSearch.toLowerCase()))
                );

                return (
                  <div className="space-y-3">
                    {filteredRoles.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Roles</div>
                        {filteredRoles.map(role => (
                          <button
                            key={role.id}
                            onClick={() => {
                              const updated = [...assignedIds, role.id];
                              setEditingImage({ ...editingImage, permissions: { ...perms, [assignPopover.actionKey]: updated } });
                              setAssignPopover(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-md flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-gray-800">{role.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredUsers.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Users</div>
                        {filteredUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              const updated = [...assignedIds, user.id];
                              setEditingImage({ ...editingImage, permissions: { ...perms, [assignPopover.actionKey]: updated } });
                              setAssignPopover(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded-md flex items-center gap-2"
                          >
                            <User className="w-4 h-4 text-gray-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{user.name}</div>
                              <div className="text-[10px] text-gray-400 truncate mt-0.5 leading-none">{user.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredRoles.length === 0 && filteredUsers.length === 0 && (
                      <div className="p-4 text-center">
                        <span className="text-xs text-gray-400">No combinations available</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
