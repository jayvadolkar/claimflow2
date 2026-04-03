/**
 * api.ts
 *
 * Dual-mode API service:
 *   - ONLINE mode  : calls the Express/SQLite backend (local dev)
 *   - OFFLINE mode : automatically activates when the backend is unreachable
 *                    (Vercel, GitHub Pages, any static host).
 *                    Data is persisted to localStorage so changes survive
 *                    page refreshes within the same browser session.
 *
 * Detection: the first call probes /api/health. If it fails (network error
 * or non-2xx), all subsequent calls bypass the network and use the mock layer.
 */

import { Survey, SurveyEvent } from '../types';
import { dummySurveys } from '../data';
import { INITIAL_DOCS } from '../data/documents';
import { SEED_ROLES } from '../data/roles';
import { SendMessagePayload } from './commTypes';
import { UntaggedConversation } from '../types';

// ── Offline mode detection ────────────────────────────────────────────────────
let _isOffline: boolean | null = null; // null = not yet determined

async function isOffline(): Promise<boolean> {
  if (_isOffline !== null) return _isOffline;
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
    _isOffline = !res.ok;
  } catch {
    _isOffline = true;
  }
  return _isOffline;
}

// ── Default users (same as server.ts seed) ────────────────────────────────────
const DEFAULT_USERS = [
  { id: '1', name: 'Jay Vadolkar', email: 'jayvadolkar1@gmail.com', role: 'role-superadmin', department: 'Global Admin', username: 'jay', password: 'admin123' },
  { id: '2', name: 'John Doe',     email: 'john@example.com',        role: 'role-manager',    department: 'Claims Management', username: 'john', password: 'manager123' },
  { id: '3', name: 'Alice Smith',  email: 'alice@example.com',       role: 'role-handler',    department: 'Field Operations',  username: 'alice', password: 'handler123' },
];

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`cf_mock_${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(`cf_mock_${key}`, JSON.stringify(value)); } catch {}
  },
};

// Lazy-initialise surveys once from the bundled dummy data
function getMockSurveys(): Survey[] {
  const stored = LS.get<Survey[]>('surveys', []);
  if (stored.length > 0) return stored;
  LS.set('surveys', dummySurveys);
  return dummySurveys;
}

// ── Offline mock implementations ──────────────────────────────────────────────
const mock = {
  getSurveys: (): Survey[] => getMockSurveys(),

  createSurvey: (survey: Survey): Survey => {
    const surveys = getMockSurveys();
    surveys.unshift(survey);
    LS.set('surveys', surveys);
    return survey;
  },

  updateSurvey: (survey: Survey): Survey => {
    const surveys = getMockSurveys().map(s => s.id === survey.id ? survey : s);
    LS.set('surveys', surveys);
    return survey;
  },

  getEvents: (_surveyId: string): SurveyEvent[] => [],

  logEvent: (surveyId: string, event: Omit<SurveyEvent, 'id' | 'surveyId' | 'timestamp'>): SurveyEvent => {
    return { id: `ev-${Date.now()}`, surveyId, timestamp: new Date().toISOString(), ...event };
  },

  getDocuments: (): any[] => LS.get('documents', INITIAL_DOCS),
  saveDocuments: (docs: any[]) => LS.set('documents', docs),

  getDocumentRules: (): any[] => LS.get('documentRules', []),
  saveDocumentRules: (rules: any[]) => LS.set('documentRules', rules),

  getImageRules: (): any[] => LS.get('imageRules', []),
  saveImageRules: (rules: any[]) => LS.set('imageRules', rules),

  getSurveyProfiles: (): any[] => LS.get('surveyProfiles', []),
  saveSurveyProfiles: (profiles: any[]) => LS.set('surveyProfiles', profiles),

  getUsers: (): any[] => LS.get('users', DEFAULT_USERS),
  saveUsers: (users: any[]) => LS.set('users', users),

  getRoles: (): any[] => LS.get('roles', SEED_ROLES),
  saveRoles: (roles: any[]) => LS.set('roles', roles),

  login: (username: string, password: string): { user: any } => {
    const users: any[] = LS.get('users', DEFAULT_USERS);
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser };
  },

  saveUserCredentials: (userId: string, username: string, password: string) => {
    const users: any[] = LS.get('users', DEFAULT_USERS);
    const updated = users.map(u => u.id === userId ? { ...u, username, password } : u);
    LS.set('users', updated);
  },
};

// ── Public API ─────────────────────────────────────────────────────────────────
export const api = {
  getSurveys: async (): Promise<Survey[]> => {
    if (await isOffline()) return mock.getSurveys();
    const res = await fetch('/api/surveys');
    return res.json();
  },

  createSurvey: async (survey: Survey): Promise<Survey> => {
    if (await isOffline()) return mock.createSurvey(survey);
    const res = await fetch('/api/surveys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(survey),
    });
    return res.json();
  },

  updateSurvey: async (survey: Survey): Promise<Survey> => {
    if (await isOffline()) return mock.updateSurvey(survey);
    const res = await fetch(`/api/surveys/${survey.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(survey),
    });
    return res.json();
  },

  getEvents: async (surveyId: string): Promise<SurveyEvent[]> => {
    if (await isOffline()) return mock.getEvents(surveyId);
    const res = await fetch(`/api/surveys/${surveyId}/events`);
    return res.json();
  },

  logEvent: async (surveyId: string, event: Omit<SurveyEvent, 'id' | 'surveyId' | 'timestamp'>): Promise<SurveyEvent> => {
    if (await isOffline()) return mock.logEvent(surveyId, event);
    const res = await fetch(`/api/surveys/${surveyId}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event),
    });
    return res.json();
  },

  getDocuments: async (): Promise<any[]> => {
    if (await isOffline()) return mock.getDocuments();
    const res = await fetch('/api/documents');
    return res.json();
  },

  saveDocuments: async (docs: any[]): Promise<void> => {
    if (await isOffline()) { mock.saveDocuments(docs); return; }
    await fetch('/api/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docs),
    });
  },

  getDocumentRules: async (): Promise<any[]> => {
    if (await isOffline()) return mock.getDocumentRules();
    const res = await fetch('/api/document-rules');
    return res.json();
  },

  saveDocumentRules: async (rules: any[]): Promise<void> => {
    if (await isOffline()) { mock.saveDocumentRules(rules); return; }
    await fetch('/api/document-rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rules),
    });
  },

  getImageRules: async (): Promise<any[]> => {
    if (await isOffline()) return mock.getImageRules();
    const res = await fetch('/api/image-rules');
    return res.json();
  },

  saveImageRules: async (rules: any[]): Promise<void> => {
    if (await isOffline()) { mock.saveImageRules(rules); return; }
    await fetch('/api/image-rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rules),
    });
  },

  getSurveyProfiles: async (): Promise<any[]> => {
    if (await isOffline()) return mock.getSurveyProfiles();
    const res = await fetch('/api/survey-profiles');
    return res.json();
  },

  saveSurveyProfiles: async (profiles: any[]): Promise<void> => {
    if (await isOffline()) { mock.saveSurveyProfiles(profiles); return; }
    await fetch('/api/survey-profiles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profiles),
    });
  },

  getUsers: async (): Promise<any[]> => {
    if (await isOffline()) return mock.getUsers();
    const res = await fetch('/api/users');
    return res.json();
  },

  saveUsers: async (users: any[]): Promise<void> => {
    if (await isOffline()) { mock.saveUsers(users); return; }
    await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(users),
    });
  },

  getRoles: async (): Promise<any[]> => {
    if (await isOffline()) return mock.getRoles();
    const res = await fetch('/api/roles');
    return res.json();
  },

  saveRoles: async (roles: any[]): Promise<void> => {
    if (await isOffline()) { mock.saveRoles(roles); return; }
    await fetch('/api/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roles),
    });
  },

  login: async (username: string, password: string): Promise<{ user: any }> => {
    if (await isOffline()) return mock.login(username, password);
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  saveUserCredentials: async (userId: string, username: string, password: string): Promise<void> => {
    if (await isOffline()) { mock.saveUserCredentials(userId, username, password); return; }
    await fetch(`/api/users/${userId}/credentials`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
    });
  },

  // ── Communication stubs ──────────────────────────────────────────────────────
  sendMessage: async (_threadId: string, _message: SendMessagePayload): Promise<{ messageId: string; status: string }> => {
    return new Promise(resolve => setTimeout(() => resolve({ messageId: `msg-${Date.now()}`, status: 'sent' }), 200));
  },

  retryMessage: async (_messageId: string): Promise<{ status: string }> => {
    return new Promise(resolve => setTimeout(() => resolve({ status: 'queued' }), 200));
  },

  getUntaggedConversations: async (): Promise<UntaggedConversation[]> => {
    return new Promise(resolve => setTimeout(() => resolve([]), 100));
  },

  tagUntaggedConversation: async (conversationId: string, surveyId: string): Promise<void> => {
    console.log(`[API stub] Tag conversation ${conversationId} to survey ${surveyId}`);
    return new Promise(resolve => setTimeout(resolve, 150));
  },

  dismissUntaggedConversation: async (conversationId: string): Promise<void> => {
    console.log(`[API stub] Dismiss conversation ${conversationId}`);
    return new Promise(resolve => setTimeout(resolve, 150));
  },

  sendAutoEvent: async (surveyId: string, eventKind: string, label: string): Promise<void> => {
    console.log(`[API stub] Auto-event for survey ${surveyId}: ${eventKind} — ${label}`);
    return new Promise(resolve => setTimeout(resolve, 100));
  },
};
