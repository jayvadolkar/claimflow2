import { Shield } from 'lucide-react';

export const ALL_PERMISSIONS = [
  // Surveys
  { id: 'survey.create', label: 'Create Surveys', description: 'Manually create a new survey / claim', group: 'Surveys' },
  { id: 'survey.view', label: 'View Surveys', description: 'Access the surveys list and detail pages', group: 'Surveys' },
  { id: 'survey.edit', label: 'Edit Surveys', description: 'Modify survey details and parameters', group: 'Surveys' },
  { id: 'survey.delete', label: 'Delete Surveys', description: 'Permanently remove surveys', group: 'Surveys' },
  { id: 'survey.assign', label: 'Assign Surveys', description: 'Assign handlers and surveyors to surveys', group: 'Surveys' },
  { id: 'survey.stage', label: 'Move Stage', description: 'advance surveys through workflow stages', group: 'Surveys' },
  // Settings
  { id: 'settings.view', label: 'View Settings', description: 'Access the Global Settings panel', group: 'Settings' },
  { id: 'settings.org', label: 'Org Settings', description: 'Edit organization-level settings', group: 'Settings' },
  { id: 'settings.docs', label: 'Document Config', description: 'Create and manage document types', group: 'Settings' },
  { id: 'settings.rbac', label: 'Roles & Permissions', description: 'Manage roles and user access', group: 'Settings' },
  { id: 'settings.users', label: 'User Management', description: 'Create, deactivate and manage users', group: 'Settings' },
  // Reports
  { id: 'reports.view', label: 'View Reports', description: 'Access dashboards and analytics', group: 'Reports' },
  { id: 'reports.export', label: 'Export Reports', description: 'Download report data as CSV/Excel', group: 'Reports' },
];

export const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

export const SEED_ROLES = [
  {
    id: 'role-superadmin',
    name: 'Super Admin',
    description: 'God mode — unrestricted access to everything in the system. Cannot be modified.',
    color: 'text-rose-700',
    bgColor: 'bg-rose-100',
    isSystem: true,
    permissions: ALL_PERMISSIONS.map(p => p.id),
    createdAt: 'Jan 10, 2024',
    assignments: [
      {
        id: 'asg-sa-1',
        name: 'Global Scope',
        scopes: [],
        userCount: 1,
      }
    ]
  },
  {
    id: 'role-admin',
    name: 'Manager Admin',
    description: 'Complete access to all system settings, documents, surveys and users.',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    isSystem: true,
    permissions: ALL_PERMISSIONS.map(p => p.id),
    createdAt: 'Jan 10, 2024',
    assignments: [
      {
        id: 'asg-admin-1',
        name: 'Global Scope',
        scopes: [],
        userCount: 2,
      }
    ]
  },
  {
    id: 'role-manager',
    name: 'Handler Manager',
    description: 'Can verify/reject documents, assign handlers, advance workflow stages and view reports.',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    isSystem: false,
    permissions: [
      'survey.view', 'survey.create', 'survey.edit', 'survey.assign', 'survey.stage',
      'reports.view', 'reports.export',
      'settings.view', 'settings.users'
    ],
    createdAt: 'Jan 10, 2024',
    assignments: [
      {
        id: 'asg-mgr-1',
        name: 'Global Scope',
        scopes: [],
        userCount: 5,
      }
    ]
  },
  {
    id: 'role-handler',
    name: 'Handler',
    description: 'Can upload documents, process individual surveys and communicate with customers.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    isSystem: false,
    permissions: ['survey.view', 'survey.create', 'survey.edit', 'reports.view'],
    createdAt: 'Jan 10, 2024',
    assignments: [
      {
        id: 'asg-hnd-1',
        name: 'Global Scope',
        scopes: [],
        userCount: 8,
      },
      {
        id: 'asg-hnd-2',
        name: 'Scope 2',
        scopes: [{ type: 'Insurer', value: 'HDFC ERGO' }],
        userCount: 4,
      }
    ]
  }
];
