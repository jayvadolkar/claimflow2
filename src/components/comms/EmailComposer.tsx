import React, { useState, useRef } from 'react';
import { CommChannel, EmailTicket } from '../../types';
import { CommTemplate } from '../../data/commTemplates';
import { Send, Paperclip, ClipboardList, Mail, ChevronUp, ChevronDown, Check, Maximize2, Minimize2, X } from 'lucide-react';

interface EmailComposerProps {
  ticket: EmailTicket;
  templates: CommTemplate[];
  onSend: (content: string, channel: CommChannel, subject?: string) => void;
}

function fillTemplate(content: string, ticket: EmailTicket): string {
  const pName = ticket.participants[0]?.name || 'Participant';
  return content
    .replace(/{{customerName}}/g, pName)
    .replace(/{{garageName}}/g, pName)
    .replace(/{{claimNo}}/g, ticket.surveyId)
    .replace(/{{vehicleNo}}/g, ticket.surveyId);
}

export function EmailComposer({ ticket, templates, onSend }: EmailComposerProps) {
  const [subject, setSubject] = useState(ticket.id === 'new' ? '' : `Re: ${ticket.subject || ticket.surveyId}`);
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [toField, setToField] = useState(ticket.participants[0]?.email || '');
  const [ccField, setCcField] = useState('');
  const [bccField, setBccField] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isExpanded, setIsExpanded] = useState(ticket.id === 'new');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const isNew = ticket.id === 'new';
    setSubject(isNew ? '' : `Re: ${ticket.subject || ticket.surveyId}`);
    setToField(isNew ? '' : ticket.participants[0]?.email || '');
    setMessage('');
    setShowTemplates(false);
    setIsExpanded(isNew);
  }, [ticket.id, ticket.subject, ticket.surveyId, ticket.participants]);

  // Email specific templates
  const roles = ticket.participants.map(p => p.role);
  const applicableTemplates = templates.filter(
    t => t.isActive && 
         (roles.some(r => t.targetRoles.includes(r as any)) || t.targetRoles.length === 0) &&
         t.channels.includes('email')
  );

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    
    // In a real app we'd pass subject via onSend, but since CommMessage 
    // expects a string content, we'll format it simply or let the backend handle it.
    // Since we added subject to CommMessage type, ideally onSend would accept it.
    // For this mock, we just pass the content. We wouldn't change the outer onSend signature just yet.
    onSend(trimmed, 'email', subject);
    
    setMessage('');
    setShowTemplates(false);
  };

  const applyTemplate = (tpl: CommTemplate) => {
    setMessage(fillTemplate(tpl.content, ticket));
    // If template implies a certain subject we could set it, but we'll leave it simple
    setShowTemplates(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className={
      isExpanded 
        ? "fixed bottom-0 right-16 w-[550px] shadow-[0_4px_30px_rgba(0,0,0,0.3)] bg-white rounded-t-xl z-50 flex flex-col transition-all overflow-hidden border border-gray-300"
        : "border-t border-gray-200 bg-white shrink-0 flex flex-col"
    }>
      {/* Gmail-style Header Bar (Only visible when expanded or we can just show a small toolbar) */}
      {isExpanded && (
        <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center justify-between shrink-0 cursor-pointer" onClick={() => setIsExpanded(false)}>
          <span className="text-sm font-bold truncate">{ticket.id === 'new' ? 'New Message' : subject}</span>
          <div className="flex items-center gap-3 text-gray-300">
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="hover:bg-gray-700 p-1 rounded transition-colors"><Minimize2 className="w-4 h-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); /* Close logic could just minimize or discard */ setIsExpanded(false); }} className="hover:bg-gray-700 p-1 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Template panel */}
      {showTemplates && (
        <div className="border-b border-gray-200 p-4 bg-gray-50 max-h-64 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Email Templates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {applicableTemplates.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 col-span-full">No email templates found</p>
            ) : (
              applicableTemplates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all group flex flex-col gap-1"
                >
                  <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-700">{tpl.name}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{tpl.content}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Composer Body */}
      <div className={`p-4 sm:p-6 flex flex-col gap-4 ${isExpanded ? 'h-[450px] overflow-y-auto' : ''}`}>
        
        {/* Expand Header Icon if minimizing */}
        {!isExpanded && (
           <div className="flex justify-end -mb-4">
               <button onClick={() => setIsExpanded(true)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Pop out reply">
                   <Maximize2 className="w-4 h-4" />
               </button>
           </div>
        )}

        {/* Header fields */}
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                <span className="w-16 text-xs text-gray-400 font-medium">From:</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                   <Mail className="w-3 h-3" />
                   claims@zoop.one
                </div>
            </div>
            
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2 relative group">
                <span className="w-16 text-xs text-gray-400 font-medium pt-1">To:</span>
                <input 
                   type="text" 
                   value={toField}
                   onChange={e => setToField(e.target.value)}
                   className="flex-1 text-sm text-gray-900 font-medium placeholder-gray-400 outline-none bg-transparent"
                   placeholder="Recipients"
                />
                <div className="absolute right-0 top-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!showCc && <button onClick={() => setShowCc(true)} className="text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">Cc</button>}
                    {!showBcc && <button onClick={() => setShowBcc(true)} className="text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors">Bcc</button>}
                </div>
            </div>

            {showCc && (
              <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                  <span className="w-16 text-xs text-gray-400 font-medium pt-1">Cc:</span>
                  <input 
                     type="text" 
                     value={ccField}
                     onChange={e => setCcField(e.target.value)}
                     className="flex-1 text-sm text-gray-900 font-medium placeholder-gray-400 outline-none bg-transparent"
                  />
              </div>
            )}

            {showBcc && (
              <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                  <span className="w-16 text-xs text-gray-400 font-medium pt-1">Bcc:</span>
                  <input 
                     type="text" 
                     value={bccField}
                     onChange={e => setBccField(e.target.value)}
                     className="flex-1 text-sm text-gray-900 font-medium placeholder-gray-400 outline-none bg-transparent"
                  />
              </div>
            )}

            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                <span className="w-16 text-xs text-gray-400 font-medium pt-1">Subject:</span>
                <input 
                   type="text" 
                   className="flex-1 text-sm text-gray-900 font-medium placeholder-gray-400 outline-none bg-transparent"
                   value={subject}
                   onChange={e => setSubject(e.target.value)}
                   placeholder="Subject"
                />
            </div>
        </div>

        {/* Text Area */}
        <div className="relative mt-2 flex-1 flex flex-col">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your email here..."
                className="w-full h-full min-h-[120px] text-sm text-gray-800 bg-transparent resize-y outline-none"
                style={{ lineHeight: '1.6' }}
            />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-2">
                <button className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Paperclip className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setShowTemplates(v => !v)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors ${
                    showTemplates
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border'
                        : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                    }`}
                >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Templates
                </button>
            </div>

            <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-sm"
            >
                <Send className="w-4 h-4" />
                Send Email
            </button>
        </div>

      </div>
    </div>
  );
}
