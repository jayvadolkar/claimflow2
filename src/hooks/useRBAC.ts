import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { SEED_ROLES } from '../data/roles';

export interface RBACRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  bgColor: string;
  isSystem?: boolean;
}

export function useRBAC(userRoleId: string) {
  const [roles, setRoles] = useState<RBACRole[]>(SEED_ROLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRoles()
      .then(data => { if (data?.length) setRoles(data); })
      .catch(() => {/* keep SEED_ROLES fallback */})
      .finally(() => setLoading(false));
  }, []);

  const hasPermission = useCallback(
    (permId: string): boolean => {
      if (userRoleId === 'role-superadmin') return true; // super admin god mode
      if (loading) return true; // optimistic while loading
      const role = roles.find(r => r.id === userRoleId);
      return role?.permissions.includes(permId) ?? false;
    },
    [roles, userRoleId, loading]
  );

  const currentRole = roles.find(r => r.id === userRoleId) ?? null;

  return { roles, hasPermission, currentRole, loading };
}
