import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SurveysView } from './components/SurveysView';
import { SurveyDetail } from './components/SurveyDetail';
import { NewSurveyForm } from './components/NewSurveyForm';
import { AutomationsView } from './components/AutomationsView';
import { HomeView } from './components/HomeView';
import { GlobalSettingsView } from './components/GlobalSettingsView';
import { LoginView } from './components/LoginView';
import { Survey } from './types';
import { api } from './services/api';
import { Toaster } from 'react-hot-toast';

interface Session {
  id: string;
  name: string;
  role: string;
  username: string;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('cf_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [currentView, setCurrentView] = useState<string>(() => localStorage.getItem('cf_currentView') || 'home');
  const [previousView, setPreviousView] = useState<string>(() => localStorage.getItem('cf_previousView') || 'home');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(() => localStorage.getItem('cf_selectedSurveyId') || null);

  const userRole = session?.role || 'role-handler';

  // Persist navigation state to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('cf_currentView', currentView); }, [currentView]);
  useEffect(() => { localStorage.setItem('cf_previousView', previousView); }, [previousView]);
  useEffect(() => {
    if (selectedSurveyId) localStorage.setItem('cf_selectedSurveyId', selectedSurveyId);
    else localStorage.removeItem('cf_selectedSurveyId');
  }, [selectedSurveyId]);

  useEffect(() => {
    if (!session) return;
    api.getSurveys()
      .then(data => setSurveys(data))
      .catch(err => console.error('Failed to fetch surveys:', err));
  }, [session]);

  const handleLogin = (user: Session) => {
    localStorage.setItem('cf_session', JSON.stringify(user));
    setSession(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('cf_session');
    setSession(null);
  };

  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginView onLogin={handleLogin} />
      </>
    );
  }

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId) || null;

  const handleSurveyClick = (survey: Survey) => {
    setPreviousView(currentView);
    setSelectedSurveyId(survey.id);
    setCurrentView('detail');
  };

  const handleBack = () => {
    setSelectedSurveyId(null);
    setCurrentView(previousView === 'intimation' ? 'intimation' : 'surveys');
  };

  const handleUpdateSurvey = (updatedSurvey: Survey) => {
    const originalSurvey = surveys.find(s => s.id === updatedSurvey.id);
    api.updateSurvey(updatedSurvey)
      .then(data => {
        setSurveys(surveys.map(s => s.id === data.id ? data : s));

        const changes = [];
        if (originalSurvey) {
          if (originalSurvey.stage !== updatedSurvey.stage) changes.push(`Stage changed to ${updatedSurvey.stage}`);
          if (originalSurvey.handler !== updatedSurvey.handler) changes.push(`Handler assigned to ${updatedSurvey.handler}`);
          if (originalSurvey.surveyor !== updatedSurvey.surveyor) changes.push(`Surveyor assigned to ${updatedSurvey.surveyor}`);
          if (originalSurvey.vehicleCategory !== updatedSurvey.vehicleCategory) changes.push(`Vehicle category changed to ${updatedSurvey.vehicleCategory}`);
          if (originalSurvey.vehicleClass !== updatedSurvey.vehicleClass) changes.push(`Vehicle class changed to ${updatedSurvey.vehicleClass}`);
          if (originalSurvey.lossType !== updatedSurvey.lossType) changes.push(`Loss type changed to ${updatedSurvey.lossType}`);
          if (originalSurvey.isHypothecated !== updatedSurvey.isHypothecated) changes.push(`Hypothecation changed to ${updatedSurvey.isHypothecated ? 'Yes' : 'No'}`);
        }

        if (changes.length > 0) {
          api.logEvent(data.id, {
            eventName: 'Survey Updated',
            actor: session.name,
            triggerCondition: 'User updates survey details',
            systemAction: changes.join(', '),
            outcomeState: data.stage
          }).catch(console.error);
        }
      })
      .catch(err => console.error('Failed to update survey:', err));
  };

  const handleNavigate = (view: string) => {
    setPreviousView(currentView);
    if (view === 'surveys') {
      setSelectedSurveyId(null);
    }
    if (view === 'settings') {
      setCurrentView('global-settings');
      return;
    }
    setCurrentView(view);
  };

  const handleCreateSurvey = () => {
    setPreviousView(currentView);
    setCurrentView('new-survey');
  };

  const handleSaveNewSurvey = (newSurvey: Survey) => {
    api.createSurvey(newSurvey)
      .then(data => {
        setSurveys([data, ...surveys]);

        api.logEvent(data.id, {
          eventName: 'Survey Created',
          actor: session.name,
          triggerCondition: 'User creates manually',
          systemAction: 'Create survey record, initialize survey',
          outcomeState: 'Intimation state, awaiting assignment'
        });

        if (previousView === 'intimation') {
          setCurrentView('intimation');
        } else {
          setSelectedSurveyId(data.id);
          setCurrentView('detail');
        }
      })
      .catch(err => console.error('Failed to create survey:', err));
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <Toaster position="top-right" />

      {currentView === 'global-settings' ? (
        <GlobalSettingsView onBack={() => setCurrentView(previousView || 'home')} userRole={userRole} />
      ) : (
        <>
          <Sidebar currentView={currentView} previousView={previousView} onNavigate={handleNavigate} />
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <TopBar
              onSettingsClick={() => handleNavigate('global-settings')}
              userRole={userRole}
              userName={session.name}
              onLogout={handleLogout}
              currentView={currentView}
              onCreateSurvey={handleCreateSurvey}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              {currentView === 'home' && (
                <HomeView
                  surveys={surveys}
                  onNavigate={handleNavigate}
                  onCreateSurvey={handleCreateSurvey}
                />
              )}
              {currentView === 'intimation' && (
                <SurveysView
                  surveys={surveys}
                  onSurveyClick={handleSurveyClick}
                  onUpdateSurvey={handleUpdateSurvey}
                  onCreateSurvey={handleCreateSurvey}
                  userRole={userRole}
                  isReadOnly={true}
                />
              )}
              {currentView === 'surveys' && (
                <SurveysView
                  surveys={surveys}
                  onSurveyClick={handleSurveyClick}
                  onUpdateSurvey={handleUpdateSurvey}
                  onCreateSurvey={handleCreateSurvey}
                  userRole={userRole}
                />
              )}
              {currentView === 'new-survey' && (
                <NewSurveyForm
                  onSave={handleSaveNewSurvey}
                  onCancel={() => handleNavigate(previousView)}
                />
              )}
              {currentView === 'detail' && selectedSurvey && (
                <SurveyDetail
                  survey={selectedSurvey}
                  onBack={handleBack}
                  onUpdateSurvey={handleUpdateSurvey}
                  userRole={userRole}
                />
              )}
              {currentView === 'automations' && (
                <AutomationsView />
              )}
              {['me', 'team', 'claims', 'reports', 'users', 'settings'].includes(currentView) && (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <p>This section is under construction.</p>
                </div>
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
