// Single source of truth for seed users — used as offline fallback across all components
export const SEED_USERS = [
  { id: '1', name: 'Jay Vadolkar', email: 'jayvadolkar1@gmail.com', role: 'role-superadmin', department: 'Global Admin', username: 'jay', password: 'admin123' },
  { id: '2', name: 'John Doe',     email: 'john@example.com',         role: 'role-manager', department: 'Claims Management', username: 'john',  password: 'manager123' },
  { id: '3', name: 'Alice Smith',  email: 'alice@example.com',        role: 'role-handler', department: 'Field Operations',  username: 'alice', password: 'handler123' },
];
