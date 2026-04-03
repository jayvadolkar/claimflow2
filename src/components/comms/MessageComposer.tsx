import React, { useState, useRef } from 'react';
import { CommChannel, CommThread } from '../../types';
import { CommTemplate } from '../../data/commTemplates';
import { Send, Paperclip, ClipboardList, MessageCircle, Mail, Smartphone, ChevronUp, ChevronDown } from 'lucide-react';

interface MessageComposerProps {
  thread: CommThread;
  templates: CommTemplate[];
  onSend: (content: string, channel: CommChannel) => void;
}

const CHANNEL_CONFIG: { id: CommChannel; label: string; Icon: React.ElementType; color: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, color: 'text-emerald-600 border-emerald-300 bg-emerald-50' },
  { id: 'sms',      label: 'SMS',      Icon: Smartphone,    color: 'text-sky-600 border-sky-300 bg-sky-50'             },
  { id: 'email',    label: 'Email',    Icon: Mail,          color: 'text-indigo-600 border-indigo-300 bg-indigo-50'    },
];

function fillTemplate(content: string, thread: CommThread): string {
  return content
    .replace(/{{customerName}}/g, thread.party.name)
    .replace(/{{garageName}}/g, thread.party.name)
    .replace(/{{claimNo}}/g, thread.surveyId)
    .replace(/{{vehicleNo}}/g, thread.surveyId);
}

export function MessageComposer({ thread, templates, onSend }: MessageComposerProps) {
  const isInternal = thread.party.role === 'internal';
  const [selectedChannel, setSelectedChannel] = useState<CommChannel>(
    isInternal ? 'internal' : 'whatsapp'
  );
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Templates applicable to this party role
  const applicableTemplates = templates.filter(
    t => t.isActive && (t.targetRoles.includes(thread.party.role) || t.targetRoles.length === 0)
  );

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed, selectedChannel);
    setMessage('');
    setShowTemplates(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyTemplate = (tpl: CommTemplate) => {
    setMessage(fillTemplate(tpl.content, thread));
    if (!isInternal && tpl.channels.length > 0) {
      // prefer first channel of template if it's a valid external channel
      const ch = tpl.channels.find(c => c !== 'internal') as CommChannel | undefined;
      if (ch) setSelectedChannel(ch);
    }
    setShowTemplates(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className="border-t border-gray-200 bg-white shrink-0">
      {/* Template panel */}
      {showTemplates && (
        <div className="border-b border-gray-200 p-3 bg-gray-50 max-h-52 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Templates
          </p>
          <div className="flex flex-col gap-1.5">
            {applicableTemplates.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">No templates for this party type</p>
            ) : (
              applicableTemplates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-700">{tpl.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{tpl.content}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 mt-0.5">
                      {tpl.channels.filter(c => c !== 'internal').map(c => {
                        const cfg = CHANNEL_CONFIG.find(x => x.id === c);
                        return cfg ? <cfg.Icon key={c} className={`w-3.5 h-3.5 ${cfg.color.split(' ')[0]}`} /> : null;
                      })}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Top bar: channel selector + template toggle */}
        <div className="flex items-center justify-between">
          {/* Channel selector */}
          {!isInternal ? (
            <div className="flex bg-gray-100 p-0.5 rounded-lg gap-0.5">
              {CHANNEL_CONFIG.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedChannel(id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                    selectedChannel === id
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${
                    selectedChannel === id
                      ? id === 'whatsapp' ? 'text-emerald-500'
                        : id === 'sms' ? 'text-sky-500'
                        : 'text-indigo-500'
                      : ''
                  }`} />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ClipboardList className="w-4 h-4 text-gray-400" />
              Internal note — visible to team only
            </div>
          )}

          {/* Templates toggle */}
          <button
            onClick={() => setShowTemplates(v => !v)}
            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-colors ${
              showTemplates
                ? 'bg-indigo-600 text-white'
                : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Templates
            {showTemplates ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isInternal
                  ? 'Add an internal note...'
                  : `Message ${thread.party.name} via ${
                      selectedChannel === 'whatsapp' ? 'WhatsApp'
                      : selectedChannel === 'sms' ? 'SMS'
                      : 'Email'
                    }...`
              }
              rows={1}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm
                         focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all resize-none min-h-[44px] max-h-36 outline-none"
              style={{ lineHeight: '1.5' }}
            />
            <button className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-200 shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
