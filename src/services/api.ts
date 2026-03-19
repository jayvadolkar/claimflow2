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
  }
};
