import React, { useState } from 'react';
import { DocumentManagement } from './settings/DocumentManagement';
import { UserManagement } from './settings/UserManagement';
import { 
  Database, 
  ShieldCheck, 
  Building2, 
  ChevronRight, 
  ArrowLeft,
  Users,
  Key,
  Globe,
  Mail,
  Bell,
  Lock,
  Search,
  Plus,
  FileText,
  Settings2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit3,
  Eye
} from 'lucide-react';

interface GlobalSettingsViewProps {
  onBack: () => void;
}

type SettingsSection = 'data-masters' | 'rbac' | 'org' | 'docs' | 'users';

export function GlobalSettingsView({ onBack }: GlobalSettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('docs');

  const menuItems = [
    { id: 'org', label: 'Organization Settings', icon: Building2 },
    { id: 'rbac', label: 'Role Based Access', icon: ShieldCheck },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'docs', label: 'Document Configuration', icon: FileText },
    { id: 'data-masters', label: 'Data Masters', icon: Database },
  ];

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <h1 className="text-lg font-semibold text-gray-900">Global Settings</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            AD
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900 leading-none">Admin User</p>
            <p className="text-gray-500 text-xs mt-1 leading-none">Super Admin</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search settings..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <nav className="flex-1 px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SettingsSection)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === item.id 
                    ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {item.label}
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === item.id ? 'rotate-90 opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-gray-200">
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-indigo-900 font-medium">All systems operational</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Settings Content */}
        <main className="flex-1 overflow-hidden bg-white flex flex-col">
          {activeSection === 'docs' ? (
            <div className="flex-1 h-full p-6">
              <DocumentManagement />
            </div>
          ) : activeSection === 'users' ? (
            <div className="flex-1 h-full p-6">
              <UserManagement />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-5xl mx-auto">
                {activeSection === 'org' && <OrgSettings />}
                {activeSection === 'rbac' && <RbacSettings />}
                {activeSection === 'data-masters' && <DataMasters />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}





function OrgSettings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
        <p className="text-gray-500 mt-1 text-sm">Manage your organization's core details and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 p-6 border border-gray-200 rounded-2xl hover:border-indigo-200 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">General Information</h3>
            <p className="text-sm text-gray-500 mt-1">Update company name, logo, and primary contact details.</p>
          </div>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Configure →</button>
        </div>

        <div className="space-y-4 p-6 border border-gray-200 rounded-2xl hover:border-indigo-200 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Email Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">Set up SMTP servers and custom email templates.</p>
          </div>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Configure →</button>
        </div>

        <div className="space-y-4 p-6 border border-gray-200 rounded-2xl hover:border-indigo-200 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500 mt-1">Define system-wide notification rules and channels.</p>
          </div>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Configure →</button>
        </div>

        <div className="space-y-4 p-6 border border-gray-200 rounded-2xl hover:border-indigo-200 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Security & SSO</h3>
            <p className="text-sm text-gray-500 mt-1">Manage authentication methods and single sign-on.</p>
          </div>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Configure →</button>
        </div>
      </div>
    </div>
  );
}

function RbacSettings() {
  const roles = [
    { id: 'admin', name: 'Global Admin', users: 2, permissions: 'Full System Access', color: 'bg-purple-100 text-purple-700', description: 'Complete access to all system settings, documents, and surveys.' },
    { id: 'manager', name: 'Handling Manager', users: 5, permissions: 'Manage & Verify', color: 'bg-emerald-100 text-emerald-700', description: 'Can verify/reject documents and oversee handlers.' },
    { id: 'handler', name: 'Handler (Individual Contributor)', users: 12, permissions: 'Upload & Process', color: 'bg-blue-100 text-blue-700', description: 'Can upload documents and process individual surveys.' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Based Access Control</h2>
          <p className="text-gray-500 mt-1 text-sm">Define roles and manage permissions across your organization.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Users</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${role.color.split(' ')[0]}`}></div>
                    <span className="font-medium text-gray-900">{role.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {role.description}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                    {role.permissions}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    {role.users} users
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
          <Key className="w-6 h-6 text-indigo-600 mb-4" />
          <h4 className="font-semibold text-gray-900">API Keys</h4>
          <p className="text-sm text-gray-500 mt-1">Manage service accounts and API access tokens.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
          <ShieldCheck className="w-6 h-6 text-indigo-600 mb-4" />
          <h4 className="font-semibold text-gray-900">Audit Logs</h4>
          <p className="text-sm text-gray-500 mt-1">Track all administrative actions and security events.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
          <Users className="w-6 h-6 text-indigo-600 mb-4" />
          <h4 className="font-semibold text-gray-900">User Directory</h4>
          <p className="text-sm text-gray-500 mt-1">Bulk manage users and their assigned roles.</p>
        </div>
      </div>
    </div>
  );
}

function DataMasters() {
  const masters = [
    { name: 'Vehicle Makes', count: 142, lastUpdated: '2 days ago' },
    { name: 'Insurers', count: 28, lastUpdated: '1 week ago' },
    { name: 'Loss Types', count: 15, lastUpdated: '1 month ago' },
    { name: 'Divisions', count: 8, lastUpdated: '3 days ago' },
    { name: 'Branches', count: 45, lastUpdated: 'Just now' },
    { name: 'Surveyors', count: 120, lastUpdated: '5 days ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Data Masters</h2>
        <p className="text-gray-500 mt-1 text-sm">Manage master data records used across the application.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {masters.map((master) => (
          <div key={master.name} className="p-5 border border-gray-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-indigo-50 transition-colors">
                <Database className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-gray-400">Updated {master.lastUpdated}</span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{master.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{master.count} records</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-600">Manage Data</span>
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-md">
          <h3 className="text-xl font-bold">Import Master Data</h3>
          <p className="text-indigo-100 mt-2">Bulk upload your master records using CSV or Excel files. We support automated mapping for common formats.</p>
        </div>
        <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shrink-0">
          Start Import
        </button>
      </div>
    </div>
  );
}
