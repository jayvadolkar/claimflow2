import { Survey, SurveyEvent } from '../types';

export const api = {
  getSurveys: async (): Promise<Survey[]> => {
    const res = await fetch('/api/surveys');
    return res.json();
  },
  
  createSurvey: async (survey: Survey): Promise<Survey> => {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey)
    });
    return res.json();
  },
  
  updateSurvey: async (survey: Survey): Promise<Survey> => {
    const res = await fetch(`/api/surveys/${survey.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey)
    });
    return res.json();
  },
  
  getEvents: async (surveyId: string): Promise<SurveyEvent[]> => {
    const res = await fetch(`/api/surveys/${surveyId}/events`);
    return res.json();
  },
  
  logEvent: async (surveyId: string, event: Omit<SurveyEvent, 'id' | 'surveyId' | 'timestamp'>): Promise<SurveyEvent> => {
    const res = await fetch(`/api/surveys/${surveyId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return res.json();
  },
  
  getDocuments: async (): Promise<any[]> => {
    const res = await fetch('/api/documents');
    return res.json();
  },
  
  saveDocuments: async (docs: any[]): Promise<void> => {
    await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docs)
    });
  },

  getDocumentRules: async (): Promise<any[]> => {
    const res = await fetch('/api/document-rules');
    return res.json();
  },

  saveDocumentRules: async (rules: any[]): Promise<void> => {
    await fetch('/api/document-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });
  },

  getImageRules: async (): Promise<any[]> => {
    const res = await fetch('/api/image-rules');
    return res.json();
  },

  saveImageRules: async (rules: any[]): Promise<void> => {
    await fetch('/api/image-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules)
    });
  },

  getSurveyProfiles: async (): Promise<any[]> => {
    const res = await fetch('/api/survey-profiles');
    return res.json();
  },

  saveSurveyProfiles: async (profiles: any[]): Promise<void> => {
    await fetch('/api/survey-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles),
    });
  },

  getUsers: async (): Promise<any[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },
  
  saveUsers: async (users: any[]): Promise<void> => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  },

  getRoles: async (): Promise<any[]> => {
    const res = await fetch('/api/roles');
    return res.json();
  },
  
  saveRoles: async (roles: any[]): Promise<void> => {
    await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roles)
    });
  },

  login: async (username: string, password: string): Promise<{ user: any }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  saveUserCredentials: async (userId: string, username: string, password: string): Promise<void> => {
    await fetch(`/api/users/${userId}/credentials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  // ── Communication stubs ──────────────────────────────────────────────────
  // These are frontend stubs — replace fetch bodies with real endpoints when
  // the backend communication service is available.

  sendMessage: async (
    _threadId: string,
    _message: import('./commTypes').SendMessagePayload
  ): Promise<{ messageId: string; status: string }> => {
    // Stub — optimistic update is handled in component state; this would
    // confirm delivery via the real channel gateway.
    return new Promise(resolve =>
      setTimeout(() => resolve({ messageId: `msg-${Date.now()}`, status: 'sent' }), 200)
    );
  },

  retryMessage: async (
    _messageId: string
  ): Promise<{ status: string }> => {
    return new Promise(resolve =>
      setTimeout(() => resolve({ status: 'queued' }), 200)
    );
  },

  getUntaggedConversations: async (): Promise<import('../types').UntaggedConversation[]> => {
    // Stub — returns empty; real implementation would call /api/comms/untagged
    return new Promise(resolve => setTimeout(() => resolve([]), 100));
  },

  tagUntaggedConversation: async (
    conversationId: string,
    surveyId: string
  ): Promise<void> => {
    console.log(`[API stub] Tag conversation ${conversationId} to survey ${surveyId}`);
    return new Promise(resolve => setTimeout(resolve, 150));
  },

  dismissUntaggedConversation: async (conversationId: string): Promise<void> => {
    console.log(`[API stub] Dismiss conversation ${conversationId}`);
    return new Promise(resolve => setTimeout(resolve, 150));
  },

  sendAutoEvent: async (
    surveyId: string,
    eventKind: string,
    label: string
  ): Promise<void> => {
    console.log(`[API stub] Auto-event for survey ${surveyId}: ${eventKind} — ${label}`);
    return new Promise(resolve => setTimeout(resolve, 100));
  },
};

