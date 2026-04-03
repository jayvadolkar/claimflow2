import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Edit2, Save, X, Search, Shield, Mail, Building, KeyRound, Eye, EyeOff, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useRBAC } from '../../hooks/useRBAC';
import { SEED_USERS } from '../../data/users';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  username?: string;
  password?: string;
}

export function UserManagement() {
  const { roles } = useRBAC('');
  const [users, setUsers] = useState<UserData[]>(SEED_USERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers()
      .then(data => { if (data?.length) setUsers(data); })
      .catch(() => {/* keep SEED_USERS fallback */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <DirectoryTab users={users} setUsers={setUsers} roles={roles} />;
}

// ─── Directory Tab ─────────────────────────────────────────────────────────────

function DirectoryTab({ users, setUsers, roles }: { users: UserData[]; setUsers: (u: UserData[]) => void; roles: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const startEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditForm({ ...user });
    setShowPassword(false);
  };

  const handleAddUser = () => {
    const newUser: UserData = { id: Date.now().toString(), name: '', email: '', role: 'role-handler', department: '', username: '', password: '' };
    setUsers([newUser, ...users]);
    setEditingId(newUser.id);
    setEditForm(newUser);
    setCurrentPage(1);
  };

  const handleSave = async () => {
    if (!editForm) return;
    if (!editForm.name.trim()) return toast.error('Name is required');
    if (!editForm.email.trim()) return toast.error('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) return toast.error('Invalid email format');

    // Check duplicate username
    if (editForm.username?.trim()) {
      const dup = users.find(u => u.id !== editForm.id && u.username === editForm.username!.trim());
      if (dup) return toast.error(`Username "${editForm.username}" is already taken by ${dup.name}`);
    }

    const updated = users.map(u => u.id === editForm.id ? editForm : u);
    try {
      await api.saveUsers(updated);
      // Save credentials separately if username is provided
      if (editForm.username?.trim()) {
        await api.saveUserCredentials(editForm.id, editForm.username.trim(), editForm.password || '');
      }
      setUsers(updated);
      setEditingId(null);
      setEditForm(null);
      toast.success('User saved');
    } catch {
      // Offline — update local state only
      setUsers(updated);
      setEditingId(null);
      setEditForm(null);
      toast.success('User saved locally (server offline)');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    const updated = users.filter(u => u.id !== id);
    try {
      await api.saveUsers(updated);
      setUsers(updated);
      toast.success('User deleted');
    } catch {
      setUsers(updated);
      toast.success('User deleted locally (server offline)');
    }
  };

  const handleCancel = (id: string) => {
    // If this is a newly-added unsaved user (no name), remove it
    const user = users.find(u => u.id === id);
    if (user && !user.name.trim()) setUsers(users.filter(u => u.id !== id));
    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">User Directory</h3>
          <p className="text-sm text-gray-500">All users in the system — profile, role, and login credentials in one place.</p>
        </div>
        <button onClick={handleAddUser} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or department..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">User</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Department</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Username</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Password</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">No users found</td></tr>
            )}
            {paged.map(user => {
              const isEditing = editingId === user.id;
              const role = roles.find(r => r.id === user.role);
              return (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Name / Email */}
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <input type="text" value={editForm?.name} onChange={e => setEditForm({ ...editForm!, name: e.target.value })} placeholder="Full name" className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" />
                        <input type="email" value={editForm?.email} onChange={e => setEditForm({ ...editForm!, email: e.target.value })} placeholder="Email" className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">{user.name.charAt(0) || '?'}</div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</div>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <select value={editForm?.role} onChange={e => setEditForm({ ...editForm!, role: e.target.value })} className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className={`w-3 h-3 ${role?.color ?? 'text-indigo-500'}`} />
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${role?.bgColor ?? 'bg-gray-100'} ${role?.color ?? 'text-gray-700'}`}>
                          {role?.name ?? user.role.replace('role-', '')}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <input type="text" value={editForm?.department} onChange={e => setEditForm({ ...editForm!, department: e.target.value })} placeholder="Department" className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" />
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-600 text-sm"><Building className="w-3 h-3 text-gray-400 shrink-0" />{user.department || <span className="text-gray-300 italic">—</span>}</div>
                    )}
                  </td>

                  {/* Username */}
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <input type="text" value={editForm?.username ?? ''} onChange={e => setEditForm({ ...editForm!, username: e.target.value })} placeholder="username" className="w-28 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm font-mono focus:border-indigo-500 outline-none" />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-mono text-sm text-gray-700">{user.username || <span className="text-gray-300 italic text-xs font-sans">not set</span>}</span>
                      </div>
                    )}
                  </td>

                  {/* Password */}
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editForm?.password ?? ''}
                          onChange={e => setEditForm({ ...editForm!, password: e.target.value })}
                          placeholder="Set password"
                          className="w-36 px-2.5 py-1.5 pr-8 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-sm text-gray-400 tracking-widest">
                        {user.password ? '••••••••' : <span className="italic text-xs font-sans text-gray-300">not set</span>}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button onClick={() => handleCancel(user.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(user)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
          </div>
        </div>
      )}
    </div>
  );
}
