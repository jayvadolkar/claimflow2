import React from 'react';
import { 
  Home, User, Users, ClipboardList, Shield, 
  BarChart2, Folder, Settings, Zap, FileText
} from 'lucide-react';

export function Sidebar({ currentView, previousView, onNavigate }: { currentView: string, previousView?: string, onNavigate: (view: string) => void }) {
  const navItems = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'intimation', name: 'Intimation', icon: FileText },
    { id: 'surveys', name: 'Surveys', icon: ClipboardList },
    { id: 'claims', name: 'Claims', icon: Shield },
    { id: 'automations', name: 'Automations', icon: Zap },
    { id: 'reports', name: 'Reports', icon: BarChart2 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-24 bg-white border-r border-gray-200 flex flex-col z-20">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="flex items-center justify-center text-indigo-600">
          <Shield className="w-8 h-8" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = currentView === item.id || 
                             (currentView === 'detail' && item.id === (previousView === 'intimation' ? 'intimation' : 'surveys')) ||
                             (currentView === 'new-survey' && item.id === (previousView === 'intimation' ? 'intimation' : 'surveys'));
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl text-[11px] font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`} />
                <span className="text-center leading-tight">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
