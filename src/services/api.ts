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
  }
};
