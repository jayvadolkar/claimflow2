import React, { useState } from 'react';
import { Zap, Settings2, Plus, Mail, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export function AutomationsView() {
  const [automations, setAutomations] = useState([
    { id: 1, event: 'Intimation Received', description: 'When a new claim is registered', actions: [{ channel: 'email', target: 'Customer' }, { channel: 'sms', target: 'Customer' }], active: true },
    { id: 2, event: 'Surveyor Assigned', description: 'When a surveyor is allocated to the claim', actions: [{ channel: 'email', target: 'Surveyor' }, { channel: 'sms', target: 'Customer' }], active: true },
    { id: 3, event: 'Documents Missing', description: 'When OCR fails or documents are rejected', actions: [{ channel: 'sms', target: 'Customer (Upload Link)' }], active: false },
    { id: 4, event: 'Assessment Completed', description: 'When the final report is generated', actions: [{ channel: 'email', target: 'Insurer' }], active: true },
  ]);

  const toggleAutomation = (id: number) => {
    setAutomations(automations.map(a => a.id === id ? { ...a, active: !a.active } : a));
    toast.success('Automation rule updated');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Global Automations</h1>
            <p className="text-sm text-gray-500 mt-1">Configure system-wide event triggers and communication rules.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Rule
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((rule) => (
            <div key={rule.id} className={`bg-white rounded-xl border ${rule.active ? 'border-indigo-200 shadow-sm ring-1 ring-indigo-50' : 'border-gray-200 opacity-75'} p-6 transition-all flex flex-col`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${rule.active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{rule.event}</h4>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={rule.active} onChange={() => toggleAutomation(rule.id)} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <p className="text-sm text-gray-500 mb-6 flex-1">{rule.description}</p>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Actions Triggered</p>
                <div className="flex flex-wrap gap-2">
                  {rule.actions.map((action, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700">
                      {action.channel === 'email' ? <Mail className="w-3.5 h-3.5 text-blue-500" /> : <Smartphone className="w-3.5 h-3.5 text-green-500" />}
                      {action.target}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
