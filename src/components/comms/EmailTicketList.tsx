import React from 'react';
import { EmailTicket } from '../../types';
import { Mail, Clock } from 'lucide-react';

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface EmailTicketListProps {
  tickets: EmailTicket[];
  activeTicketId: string;
  onSelectTicket: (id: string) => void;
  onNewTicket: () => void;
}

export function EmailTicketList({ tickets, activeTicketId, onSelectTicket, onNewTicket }: EmailTicketListProps) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-800">Email Tickets</h2>
        </div>
        <div className="flex flex-col flex-1 items-center justify-center text-gray-400 p-6 text-center">
          <Mail className="w-8 h-8 mb-3 opacity-20" />
          <p className="text-sm mb-4">No email tickets</p>
          <button 
             onClick={onNewTicket}
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + New Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-800">Email Tickets</h2>
        <button 
           onClick={onNewTicket}
           className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tickets.map(ticket => {
          const isActive = ticket.id === activeTicketId;
          const lastMsg = ticket.messages[ticket.messages.length - 1];

          return (
            <button
              key={ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              className={`w-full text-left p-4 border-b border-gray-100 transition-colors focus:outline-none ${
                isActive 
                  ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' 
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1 gap-2">
                <h3 className={`text-sm truncate ${ticket.unreadCount ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                  {ticket.subject}
                </h3>
                <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                  {lastMsg && <><Clock className="w-3 h-3" /> {formatRelativeTime(lastMsg.timestamp)}</>}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <p className={`text-xs truncate ${ticket.unreadCount ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {lastMsg?.content || 'No messages'}
                </p>
                {ticket.unreadCount > 0 && (
                  <span className="shrink-0 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {ticket.unreadCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
