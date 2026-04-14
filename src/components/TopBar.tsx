import React from 'react';
import { Bell, Settings, LogOut, Plus } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { UserRole } from '../types';
import { useRBAC } from '../hooks/useRBAC';
import { Button } from './ui';

interface TopBarProps {
  onSettingsClick?: () => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
  currentView: string;
  onCreateSurvey: () => void;
}

export function TopBar({ onSettingsClick, userRole, userName, onLogout, currentView, onCreateSurvey }: TopBarProps) {
  const { currentRole } = useRBAC(userRole);

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex-1 flex items-center">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-4 ml-4">
        {currentView === 'intimation' && (
          <Button variant="primary" onClick={onCreateSurvey} className="mr-2">
            <Plus className="w-4 h-4" />
            New Survey
          </Button>
        )}
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-gray-200 mx-1"></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {initials}
          </div>
          <div className="text-sm hidden md:block">
            <p className="font-medium text-gray-900 leading-none">{userName}</p>
            <p className="text-gray-500 text-xs mt-1 leading-none">
              {currentRole?.name ?? userRole.replace('role-', '')}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
