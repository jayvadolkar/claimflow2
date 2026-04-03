import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, Plus, MoreVertical, Edit3, Trash2, Copy,
  ChevronRight, Check, X, Search, Shield, Eye, Upload, CheckCircle2,
  XCircle, UserCog, Lock, Unlock, Info, User, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission {
  id: string;
  label: string;
  description: string;
  group: string;
}

interface ScopeTarget {
  type: string;
  value: string;
}

interface RoleAssignment {
  id: string;
  name: string; // e.g. "Global Scope", "Scope 2"
  scopes: ScopeTarget[];
  userCount: number;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  isSystem: boolean;
  permissions: string[]; // Permissions are now role-level
  assignments: RoleAssignment[];
  createdAt: string;
}

import { ALL_PERMISSIONS, PERMISSION_GROUPS, SEED_ROLES } from '../../data/roles';
import { SEED_USERS } from '../../data/users';
import { api } from '../../services/api';

// ─── Modals ──────────────────────────────────────────────────────────────────

function ViewPermissionsModal({ roleName, permissions, onClose }: { roleName: string; permissions: string[]; onClose: () => void }) {
  const groupedPerms = PERMISSION_GROUPS.map(g => ({
    group: g,
    permissions: ALL_PERMISSIONS.filter(p => p.group === g && permissions.includes(p.id)),
  })).filter(g => g.permissions.length > 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center`}>
              <Eye className={`w-4 h-4 text-indigo-600`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{roleName} Permissions</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{permissions.length} total privileges</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {groupedPerms.map(({ group, permissions }) => (
            <div key={group}>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-1">{group}</h4>
              <div className="grid grid-cols-1 gap-2">
                {permissions.map(p => (
                  <div key={p.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-gray-50/50 border border-gray-100/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{p.label}</p>
                      <p className="text-[10px] text-gray-500">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 flex justify-end px-6 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRoleModal({ onClose, onSave }: { onClose: () => void; onSave: (role: Role) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState(PERMISSION_GROUPS[0]);
  
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleGroup = (group: string) => {
    const groupIds = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.id);
    const allOn = groupIds.every(id => selected.has(id));
    const next = new Set(selected);
    groupIds.forEach(id => allOn ? next.delete(id) : next.add(id));
    setSelected(next);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const colors = [
      { color: 'text-amber-700', bgColor: 'bg-amber-100' },
      { color: 'text-rose-700', bgColor: 'bg-rose-100' },
      { color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
      { color: 'text-violet-700', bgColor: 'bg-violet-100' },
    ];
    const pick = colors[Math.floor(Math.random() * colors.length)];
    onSave({
      id: `role-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      color: pick.color,
      bgColor: pick.bgColor,
      isSystem: false,
      permissions: [...selected],
      createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      assignments: [
        {
          id: `asg-${Date.now()}`,
          name: 'Global Scope',
          scopes: [],
          userCount: 0
        }
      ]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create New Role</h2>
              <p className="text-xs text-gray-500">Define a template role and its initial privileges</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 border-b border-gray-100 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Role Name <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Senior Surveyor" className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what this role is for…" rows={2} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none focus:bg-white" />
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Role Permissions</h3>
              <span className="text-xs text-gray-500">{selected.size} selected</span>
            </div>

            <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl">
              {PERMISSION_GROUPS.map(g => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeGroup === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {g}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-3 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
              <input type="checkbox" checked={ALL_PERMISSIONS.filter(p => p.group === activeGroup).every(p => selected.has(p.id))} onChange={() => toggleGroup(activeGroup)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-semibold text-gray-700">Select all {activeGroup} permissions</span>
            </label>

            <div className="space-y-2">
              {ALL_PERMISSIONS.filter(p => p.group === activeGroup).map(p => (
                <label key={p.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <Check className="w-4 h-4" /> Create Role
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPrivilegesModal({ role, onClose, onSave }: { role: Role; onClose: () => void; onSave: (permissions: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions));
  const [activeGroup, setActiveGroup] = useState(PERMISSION_GROUPS[0]);
  
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleGroup = (group: string) => {
    const groupIds = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.id);
    const allOn = groupIds.every(id => selected.has(id));
    const next = new Set(selected);
    groupIds.forEach(id => allOn ? next.delete(id) : next.add(id));
    setSelected(next);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Role Privileges - {role.name}</h2>
              <p className="text-xs text-gray-500">Edit permissions for all uses of this role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl">
            {PERMISSION_GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeGroup === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {g}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-3 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
            <input type="checkbox" checked={ALL_PERMISSIONS.filter(p => p.group === activeGroup).every(p => selected.has(p.id))} onChange={() => toggleGroup(activeGroup)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-semibold text-gray-700">Select all {activeGroup} permissions</span>
          </label>

          <div className="space-y-2">
            {ALL_PERMISSIONS.filter(p => p.group === activeGroup).map(p => (
              <label key={p.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { onSave([...selected]); onClose(); }} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Check className="w-4 h-4" /> Save Privileges
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Role Users Modal ──────────────────────────────────────────────────

function ManageRoleUsersModal({ role, allUsers, onClose, onSaveUsers }: {
  role: Role;
  allUsers: any[];
  onClose: () => void;
  onSaveUsers: (users: any[]) => void;
}) {
  const [users, setUsers] = useState<any[]>(allUsers);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const assigned = users.filter(u => u.role === role.id);
  const available = users.filter(u => u.role !== role.id &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const assign = (userId: string) =>
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role.id } : u));

  const unassign = (userId: string) =>
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: '' } : u));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveUsers(users);
    } catch { /* offline — local update still applied */ }
    onSaveUsers(users);
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${role.bgColor} flex items-center justify-center`}>
              <ShieldCheck className={`w-4 h-4 ${role.color}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Manage Users — {role.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{assigned.length} user{assigned.length !== 1 ? 's' : ''} assigned</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Currently assigned */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Assigned Users</p>
            {assigned.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No users assigned to this role yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assigned.map(u => (
                  <div key={u.id} className="flex items-center gap-2 pl-1.5 pr-2 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-none">{u.name}</p>
                      <p className="text-[10px] text-gray-400 leading-none mt-0.5">{u.email}</p>
                    </div>
                    <button onClick={() => unassign(u.id)} className="ml-1 p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors" title="Remove from role">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search + add from directory */}
          <div className="px-6 pt-4 shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Add from User Directory</p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3">
            {available.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4">
                {search ? 'No users match your search.' : 'All users are already assigned to this role.'}
              </p>
            ) : (
              <div className="space-y-1">
                {available.map(u => {
                  const currentRole = u.role ? u.role.replace('role-', '') : 'No role';
                  return (
                    <div key={u.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email} · <span className="italic">{currentRole}</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => assign(u.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60">
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Roles Tab ───────────────────────────────────────────────────────────

function UserRolesTab({ onManageUsers }: { onManageUsers: () => void }) {
  const [roles, setRoles] = useState<Role[]>(SEED_ROLES as Role[]);
  const [allUsers, setAllUsers] = useState<any[]>(SEED_USERS);

  useEffect(() => {
    api.getRoles()
      .then(data => { if (data?.length) setRoles(data); })
      .catch(() => {});
    api.getUsers()
      .then(data => { if (data?.length) setAllUsers(data); })
      .catch(() => {});
  }, []);

  // Compute real user count per role from actual users
  const userCountByRole = (roleId: string) => allUsers.filter(u => u.role === roleId).length;

  const updateRoles = (newRoles: Role[]) => {
    setRoles(newRoles);
    api.saveRoles(newRoles);
  };
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [viewPerms, setViewPerms] = useState<{ roleName: string; permissions: string[] } | null>(null);
  const [manageRoleAccess, setManageRoleAccess] = useState<Role | null>(null);
  const [editingRolePrivileges, setEditingRolePrivileges] = useState<Role | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Section Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Roles</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              User Roles can be assigned to the employees from here. New roles can be created and privileges for all these roles can be managed.
            </p>
          </div>
          <button
            onClick={() => setShowNewRoleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Role
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-200 shrink-0">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200">
              <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-[25%]">User Role</th>
              <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-[25%]">Scope</th>
              <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-[25%]">Permission</th>
              <th className="px-8 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-[25%] text-right pr-12">Total Users</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No roles match your search</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((role) => (
                <React.Fragment key={role.id}>
                  {role.assignments.map((assignment, index) => (
                    <tr key={assignment.id} className="group hover:bg-gray-50/50 transition-all duration-200 border-b last:border-b-0 border-gray-50">
                      {/* Role Info Column - spans all assignments for this role */}
                      {index === 0 && (
                        <td rowSpan={role.assignments.length} className="px-8 py-5 align-top border-r border-gray-100/50 bg-white relative">
                          <div className="flex items-start gap-4">
                            <div className={`w-9 h-9 rounded-xl ${role.bgColor} flex items-center justify-center shrink-0 shadow-sm border border-black/5 mt-0.5`}>
                              <ShieldCheck className={`w-4 h-4 ${role.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900">{role.name}</span>
                                  {role.isSystem && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 border border-gray-200/50">System</span>
                                  )}
                                </div>
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveMenu(activeMenu === role.id ? null : role.id)}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {activeMenu === role.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                                      <div className="absolute left-full top-0 ml-1 w-48 rounded-lg shadow-xl bg-white ring-1 ring-black/5 z-50 py-1" role="menu">
                                        <button
                                          onClick={() => { setActiveMenu(null); setManageRoleAccess(role); }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                                        >
                                          <Users className="w-4 h-4 text-gray-400" /> Manage Users
                                        </button>
                                        {!role.isSystem && (
                                          <button
                                            onClick={() => { setActiveMenu(null); setEditingRolePrivileges(role); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                                          >
                                            <ShieldCheck className="w-4 h-4 text-gray-400" /> Manage Permissions
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 max-w-[200px]" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* Scope Column */}
                      <td className="px-8 py-5 align-top">
                        <div className="flex flex-col justify-start">
                          <span className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${assignment.scopes.length === 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                            {assignment.name}
                          </span>
                          
                          {assignment.scopes.length === 0 ? (
                            <span className="text-xs text-gray-400 font-medium italic">All Entities</span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {assignment.scopes.map((s, idx) => (
                                <span key={idx} className="text-xs font-semibold text-gray-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-fit">
                                  {s.type} | {s.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Permission Column - Spans entire role block */}
                      {index === 0 && (
                        <td rowSpan={role.assignments.length} className="px-8 py-5 align-top border-l border-r border-gray-100/30">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">{role.permissions.length}</span>
                                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Privileges</span>
                              </div>
                              <button 
                                onClick={() => setViewPerms({ roleName: role.name, permissions: role.permissions })}
                                className="p-1.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-gray-200 group-hover:border-indigo-100"
                                title="View Permissions"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {/* Users Count Column — real count from actual users */}
                      <td className="px-8 py-5 text-right pr-12 align-top">
                        {index === 0 && (() => {
                          const count = userCountByRole(role.id);
                          const roleUsers = allUsers.filter(u => u.role === role.id).slice(0, 3);
                          return (
                            <div className="flex items-center justify-end gap-3">
                              <div className="flex -space-x-2">
                                {roleUsers.map((u, i) => (
                                  <div key={i} className="w-7 h-7 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                                    {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                ))}
                                {count > 3 && (
                                  <div className="w-7 h-7 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-500 shadow-sm">
                                    +{count - 3}
                                  </div>
                                )}
                              </div>
                              <div className="text-left w-12">
                                <p className="text-xs font-bold text-gray-900 leading-none">{count}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5 leading-none">Users</p>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNewRoleModal && (
        <NewRoleModal
          onClose={() => setShowNewRoleModal(false)}
          onSave={role => {
            setRoles(prev => {
              const next = [...prev, role];
              api.saveRoles(next);
              return next;
            });
          }}
        />
      )}

      {viewPerms && (
        <ViewPermissionsModal 
          roleName={viewPerms.roleName}
          permissions={viewPerms.permissions}
          onClose={() => setViewPerms(null)} 
        />
      )}

      {manageRoleAccess && (
        <ManageRoleUsersModal
          role={manageRoleAccess}
          allUsers={allUsers}
          onClose={() => setManageRoleAccess(null)}
          onSaveUsers={(updatedUsers) => setAllUsers(updatedUsers)}
        />
      )}

      {editingRolePrivileges && (
        <EditPrivilegesModal
          role={editingRolePrivileges}
          onClose={() => setEditingRolePrivileges(null)}
          onSave={(newPermissions) => {
            setRoles(prev => {
              const next = prev.map(r => r.id === editingRolePrivileges.id ? { ...r, permissions: newPermissions } : r);
              api.saveRoles(next);
              return next;
            });
          }}
        />
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  assignments: { roleId: string; scopes: ScopeTarget[] }[];
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>(
    SEED_USERS.map(u => ({ id: u.id, name: u.name, email: u.email, status: 'Active' as const, assignments: u.role ? [{ roleId: u.role, scopes: [] }] : [] }))
  );
  const [rolesData, setRolesData] = useState<Role[]>(SEED_ROLES as Role[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewPerms, setViewPerms] = useState<{ roleName: string; permissions: string[] } | null>(null);

  useEffect(() => {
    api.getRoles().then(data => { if (data?.length) setRolesData(data); }).catch(() => {});
    api.getUsers().then((rawUsers: any[]) => {
      if (!rawUsers?.length) return;
      setUsers(rawUsers.map(u => ({
        id: u.id, name: u.name, email: u.email,
        status: 'Active' as const,
        assignments: u.role ? [{ roleId: u.role, scopes: [] }] : [],
      })));
    }).catch(() => {});
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="px-8 py-6 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Users</h2>
            <p className="text-sm text-gray-500 mt-1">Manage all users in your organization and their role assignments.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shrink-0">
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>
      
      {/* Table Header / Filters */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/30 relative">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-white shadow-sm z-10 before:absolute before:inset-0 before:border-b before:border-gray-200">
            <tr>
              <th className="px-8 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider bg-transparent">User Details</th>
              <th className="px-8 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider bg-transparent">Status</th>
              <th className="px-8 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider bg-transparent">Assigned Roles</th>
              <th className="px-8 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider bg-transparent">Privileges</th>
              <th className="px-8 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right bg-transparent">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-900">No users found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </td>
              </tr>
            ) : filteredUsers.map(user => {
              // Calculate merged permissions
              const userPerms = new Set<string>();
              user.assignments.forEach(a => {
                const role = rolesData.find(r => r.id === a.roleId);
                role?.permissions.forEach(p => userPerms.add(p));
              });

              return (
                <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200 shadow-sm shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                      {user.status}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-3">
                      {user.assignments.length === 0 && <span className="text-xs font-medium text-gray-400 italic">No roles assigned</span>}
                      {user.assignments.map((asg, idx) => {
                        const role = rolesData.find(r => r.id === asg.roleId);
                        if (!role) return null;
                        return (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-gray-800">{role.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {asg.scopes.length === 0 ? (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-gray-200 shadow-sm">Global Scope</span>
                              ) : asg.scopes.map((s, i) => (
                                <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded font-semibold border border-indigo-100 shadow-sm flex items-center gap-1">
                                  <span className="opacity-60">{s.type}</span> <span className="text-indigo-900">{s.value}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{userPerms.size}</span>
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Privileges</span>
                      </div>
                      <button 
                        onClick={() => setViewPerms({ roleName: user.name, permissions: Array.from(userPerms) })}
                        disabled={userPerms.size === 0}
                        className={`p-1.5 rounded-lg transition-all border ${userPerms.size === 0 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200 group-hover:border-indigo-100'}`}
                        title={userPerms.size === 0 ? "No Privileges" : "View Effective Privileges"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100 hover:border-indigo-200 shadow-sm">
                      Manage Context
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewPerms && (
        <ViewPermissionsModal 
          roleName={viewPerms.roleName}
          permissions={viewPerms.permissions}
          onClose={() => setViewPerms(null)} 
        />
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

type RBACTab = 'user-roles' | 'users';

export function RolesAndPermissions() {
  const [activeTab, setActiveTab] = useState<RBACTab>(() => 
    (localStorage.getItem('cf_rbacTab') as RBACTab) || 'user-roles'
  );

  useEffect(() => {
    localStorage.setItem('cf_rbacTab', activeTab);
  }, [activeTab]);

  const tabs: { id: RBACTab; label: string; icon: any }[] = [
    { id: 'user-roles', label: 'User Roles', icon: ShieldCheck },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Horizontal subtabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 bg-white px-8 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'user-roles' ? (
        <UserRolesTab onManageUsers={() => setActiveTab('users')} />
      ) : (
        <UsersTab />
      )}
    </div>
  );
}
