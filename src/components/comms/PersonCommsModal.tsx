import React, { useMemo } from 'react';
import { Survey, CommMessage, CommChannel } from '../../types';
import { X, Smartphone, Mail, FileText, ArrowRight } from 'lucide-react';

interface PersonCommsModalProps {
  identifier: string; // email or mobile number
  surveys: Survey[];
  onClose: () => void;
}

interface ThreadItem {
  surveyId: string;
  surveyLabel: string;
  message: CommMessage;
  parentType: CommChannel;
  parentSubject?: string;
  partyName: string;
}

export function PersonCommsModal({ identifier, surveys, onClose }: PersonCommsModalProps) {
  const isEmail = identifier.includes('@');

  const history = useMemo(() => {
    const items: ThreadItem[] = [];

    surveys.forEach(survey => {
      const sLabel = `${survey.vehicle} (${survey.customerName})`;
      
      // Look through threads for matching mobile or email
      if (survey.threads) {
        survey.threads.forEach(t => {
          const match = isEmail ? t.party.email === identifier : t.party.mobile === identifier;
          if (match) {
            t.messages.forEach(m => {
              items.push({
                surveyId: survey.id,
                surveyLabel: sLabel,
                message: m,
                parentType: m.channel,
                partyName: t.party.name
              });
            });
          }
        });
      }

      // Look through emails for matching email
      if (survey.emailTickets) {
        survey.emailTickets.forEach(t => {
          const match = t.participants.some(p => isEmail ? p.email === identifier : false);
          if (match) {
             const partyName = t.participants.find(p => p.email === identifier)?.name || 'Unknown';
             t.messages.forEach(m => {
               items.push({
                 surveyId: survey.id,
                 surveyLabel: sLabel,
                 message: m,
                 parentType: 'email',
                 parentSubject: t.subject,
                 partyName
               });
             });
          }
        });
      }
    });

    return items.sort((a, b) => b.message.timestamp.localeCompare(a.message.timestamp));
  }, [identifier, surveys, isEmail]);

  const partyName = history.length > 0 ? history[0].partyName : identifier;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col transform transition-transform border-l border-gray-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{partyName}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              {isEmail ? <Mail className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              {identifier}
            </div>
            <div className="mt-3">
               <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-widest">
                 Global Record
               </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 text-center">
              <FileText className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No communication history found for this identifier.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item, i) => {
                const isSentByHandler = item.message.sender === 'handler' || item.message.sender === 'system';
                return (
                  <div key={i} className="relative pl-6">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full ring-4 ring-white bg-indigo-400" />
                    {i < history.length - 1 && (
                      <div className="absolute left-[3px] top-4 bottom-[-24px] w-0.5 bg-gray-100" />
                    )}

                    <div className="bg-white border text-left border-gray-200 rounded-xl p-4 shadow-sm">
                      {/* Context Header */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              {item.parentType}
                           </span>
                           <span className="text-[11px] font-semibold text-gray-700 flex items-center gap-1 group">
                              Claim #{item.surveyId} <ArrowRight className="w-3 h-3 text-gray-400" /> {item.surveyLabel}
                           </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(item.message.timestamp).toLocaleString(undefined, {
                             month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {item.parentSubject && (
                        <p className="text-xs font-bold text-gray-900 mb-1.5 line-clamp-1 border-b border-gray-100 pb-1.5">
                          {item.parentSubject}
                        </p>
                      )}

                      <div className={`mt-1 text-sm ${isSentByHandler ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {item.message.content.split('\n').map((line, j) => (
                           <React.Fragment key={j}>{line}<br/></React.Fragment>
                        ))}
                      </div>

                      <div className="mt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                         {isSentByHandler ? 'Sent by Hub' : 'Received via inbound'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
