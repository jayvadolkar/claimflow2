import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Camera, CheckSquare, FileBarChart, Activity, Edit2, Save, X, MessageSquare, MapPin, AlertCircle, Calendar } from 'lucide-react';
import { Survey } from '../types';
import { IntimationTab } from './tabs/IntimationTab';
import { IntimationSidebar } from './tabs/IntimationSidebar';
import { DocsTab } from './tabs/DocsTab';
import { AssessmentTab } from './tabs/AssessmentTab';
import { CommunicationTab } from './tabs/CommunicationTab';
import { SurveyDetailsTab } from './tabs/SurveyDetailsTab';
import { SurveyJourneyView } from './SurveyJourneyView';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface SurveyDetailProps {
  survey: Survey;
  onBack: () => void;
  onUpdateSurvey: (survey: Survey) => void;
  userRole: string;
}

export function SurveyDetail({ survey, onBack, onUpdateSurvey, userRole }: SurveyDetailProps) {
  const [activeTab, setActiveTab] = useState<'docs' | 'assessment' | 'communication' | 'report' | 'survey_details'>('docs');
  const [viewMode, setViewMode] = useState<'tabs' | 'journey'>('tabs');
  
  // Editable Overview State
  const [isEditing, setIsEditing] = useState(false);
  const [editedSurvey, setEditedSurvey] = useState<Survey>(survey);

  useEffect(() => {
    setEditedSurvey(survey);
  }, [survey]);

  const handleSaveOverview = () => {
    onUpdateSurvey(editedSurvey);
    setIsEditing(false);
    toast.success('Claim details updated successfully');
  };

  const handleCancelEdit = () => {
    setEditedSurvey(survey);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedSurvey({ ...editedSurvey, [e.target.name]: e.target.value });
  };

  const handleGenerateReport = () => {
    toast.success('Survey Report generated successfully');
    api.logEvent(survey.id, {
      eventName: 'Report Generated',
      actor: 'User',
      triggerCondition: 'Manual trigger',
      systemAction: 'Generated final survey report',
      outcomeState: 'Report ready'
    }).catch(console.error);
  };

  const handlePreviewReport = () => {
    toast.success('Opening report preview...');
  };

  const tabs = [
    { id: 'survey_details', label: 'Intimation', icon: Calendar },
    { id: 'docs', label: 'Evidence Collection', icon: Camera },
    { id: 'assessment', label: 'AI Assessment', icon: CheckSquare },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'report', label: 'Report', icon: FileBarChart },
  ] as const;

  const claimAge = Math.floor((new Date().getTime() - new Date(survey.requestDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* REFINED HEADER */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{survey.id}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {survey.stage}
                </span>
                <span className="text-xs font-semibold text-gray-500">{survey.vehicle}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('tabs')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'tabs' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tabbed
              </button>
              <button 
                onClick={() => setViewMode('journey')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'journey' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Journey
              </button>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION (Only for Tabbed View) */}
        {viewMode === 'tabs' && (
          <div className="bg-white border-b border-gray-200 px-8 py-2 flex gap-2 overflow-x-auto shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-700' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-auto p-8">
          {viewMode === 'journey' ? (
            <SurveyJourneyView survey={survey} onUpdateSurvey={onUpdateSurvey} userRole={userRole} />
          ) : (
            <div className={`${activeTab === 'communication' ? 'h-full' : 'max-w-5xl mx-auto'}`}>
              {activeTab === 'survey_details' && <SurveyDetailsTab survey={survey} />}
              {activeTab === 'docs' && <DocsTab survey={survey} onUpdateSurvey={onUpdateSurvey} userRole={userRole} />}
              {activeTab === 'assessment' && <AssessmentTab survey={survey} onUpdateSurvey={onUpdateSurvey} />}
              {activeTab === 'communication' && <CommunicationTab survey={survey} onUpdateSurvey={onUpdateSurvey} />}
              
              {activeTab === 'report' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                  <FileBarChart className="w-16 h-16 text-indigo-200 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Survey Report Ready</h2>
                  <p className="text-gray-500 mb-10 max-w-md mx-auto">The assessment is complete and the final report is ready to be generated and shared with the insurer.</p>
                  
                  <div className="flex gap-4 justify-center">
                    <button onClick={handleGenerateReport} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </button>
                    <button onClick={handlePreviewReport} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      <Activity className="w-4 h-4" />
                      Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - INTIMATION SUMMARY & VALIDATION */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-lg z-10">
        <div className="flex-1 overflow-hidden">
          <IntimationSidebar survey={survey} onUpdateSurvey={onUpdateSurvey} />
        </div>
      </div>
    </div>
  );
}
