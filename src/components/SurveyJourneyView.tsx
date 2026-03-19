import React, { useState, useEffect } from 'react';
import { Survey, SurveyEvent } from '../types';
import { SurveyDetailsTab } from './tabs/SurveyDetailsTab';
import { DocsTab } from './tabs/DocsTab';
import { AssessmentTab } from './tabs/AssessmentTab';
import { CommunicationTab } from './tabs/CommunicationTab';
import { api } from '../services/api';

interface SurveyJourneyViewProps {
  survey: Survey;
  onUpdateSurvey: (survey: Survey) => void;
  userRole: string;
}

export function SurveyJourneyView({ survey, onUpdateSurvey, userRole }: SurveyJourneyViewProps) {
  const [openMilestone, setOpenMilestone] = useState<string | null>('details');
  const [events, setEvents] = useState<SurveyEvent[]>([]);

  useEffect(() => {
    api.getEvents(survey.id).then(setEvents).catch(console.error);
  }, [survey.id]);

  const milestones = [
    { id: 'intake', title: 'Intimation', description: 'Survey created and awaiting handler assignment', component: <SurveyDetailsTab survey={survey} /> },
    { id: 'evidence', title: 'Evidence', description: 'Collection of documents and damaged photos', component: <DocsTab survey={survey} onUpdateSurvey={onUpdateSurvey} userRole={userRole} /> },
    { id: 'inspection', title: 'Assessment', description: 'Repair, Damaged inspections & assessment', component: <AssessmentTab survey={survey} onUpdateSurvey={onUpdateSurvey} /> },
    { id: 'settlement', title: 'Communication', description: 'Repair, final approval & Bill payment and processing', component: <CommunicationTab survey={survey} onUpdateSurvey={onUpdateSurvey} /> },
    { id: 'closing', title: 'Report', description: 'Evidence Survey Report and invoice generation', component: <div className="text-zinc-500 italic">Report generation and finalization...</div> },
  ];

  return (
    <div className="p-4 font-mono text-xs bg-zinc-950 text-zinc-400 min-h-screen">
      <div className="border border-zinc-800 p-4 mb-6 bg-zinc-900">
        <h2 className="text-lg font-bold text-emerald-400 tracking-widest">SYSTEM_JOURNEY_TRACE: {survey.id}</h2>
        <p className="text-[10px] text-zinc-500">STATUS: ACTIVE_SESSION</p>
      </div>

      <div className="mb-6 border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-widest">Event Log</h3>
        {events.length === 0 ? (
          <p className="text-zinc-600 italic">No events recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="border-l-2 border-emerald-500/50 pl-3 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">{event.eventName}</span>
                  <span className="text-zinc-500 text-[10px]">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                  <div><span className="text-zinc-500">Actor:</span> <span className="text-zinc-300">{event.actor}</span></div>
                  <div><span className="text-zinc-500">Trigger:</span> <span className="text-zinc-300">{event.triggerCondition}</span></div>
                  <div><span className="text-zinc-500">Action:</span> <span className="text-zinc-300">{event.systemAction}</span></div>
                  <div><span className="text-zinc-500">Outcome:</span> <span className="text-zinc-300">{event.outcomeState}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="border border-zinc-800 mb-2 bg-zinc-900/50">
          <button
            onClick={() => setOpenMilestone(openMilestone === milestone.id ? null : milestone.id)}
            className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs ${index === 0 ? 'text-emerald-500' : 'text-zinc-600'}`}>[{index === 0 ? 'DONE' : 'WAIT'}]</span>
              <div className="flex flex-col items-start">
                <span className="font-bold text-zinc-200">{milestone.title}</span>
                <span className="text-[10px] text-zinc-500 font-normal">{milestone.description}</span>
              </div>
            </div>
            <span className="text-zinc-600">{openMilestone === milestone.id ? '[-]' : '[+]'}</span>
          </button>
          {openMilestone === milestone.id && (
            <div className="p-4 border-t border-zinc-800 bg-black">
              {milestone.component}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
