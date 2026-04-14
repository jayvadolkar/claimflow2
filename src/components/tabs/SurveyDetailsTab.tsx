import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Plus, CheckCircle2, AlertCircle, Info, ExternalLink, UserCircle, X, CheckSquare } from 'lucide-react';
import { Survey } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Button, Card, Modal, Input, Select, Textarea } from '../ui';

interface ScheduledSurvey {
  id: string;
  type: string;
  date: string;
  time: string;
  surveyor: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export function SurveyDetailsTab({ survey }: { survey: Survey }) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  React.useEffect(() => {
    setLoadingUsers(true);
    api.getUsers()
      .then(data => setUsers(data))
      .catch(err => console.error('Failed to fetch users:', err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const surveyors = users.filter(u => u.role === 'role-handler' || u.role === 'role-manager');
  const [scheduledSurveys, setScheduledSurveys] = useState<ScheduledSurvey[]>([
    {
      id: '1',
      type: 'Spot Survey',
      date: '2024-03-15',
      time: '10:30 AM',
      surveyor: 'Rajesh Kumar',
      location: 'Workshop - Mumbai Central',
      status: 'completed'
    },
    {
      id: '2',
      type: 'Final Survey',
      date: '2024-03-20',
      time: '02:00 PM',
      surveyor: 'Amit Singh',
      location: 'Customer Residence',
      status: 'scheduled'
    }
  ]);

  const surveyTypes = [
    'Spot Survey',
    'Final Survey',
    'Re-inspection',
    'Valuation',
    'Document Collection'
  ];

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Survey scheduled successfully');
    setShowScheduleForm(false);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(survey.surveyLocation || survey.garageName)}`;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* VALIDATION FLAGS SECTION */}
      {survey.validationFlags && survey.validationFlags.length > 0 && (
        <Card>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Validation Alerts</h3>
          <div className="space-y-3">
            {survey.validationFlags.map((flag, idx) => (
              <div key={idx} className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
                flag.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                flag.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                'bg-green-50 border-green-100 text-green-800'
              }`}>
                {flag.type === 'error' ? <X className="w-4 h-4 shrink-0 mt-0.5 text-red-600" /> :
                 flag.type === 'warning' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" /> :
                 <CheckSquare className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />}
                <div>
                  <span className="font-bold block mb-1">{flag.source}</span>
                  {flag.message}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Intimation Summary Section */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900">Intimation Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insurer</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{survey.insurer}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Claim Number</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{survey.claimNo}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intimation Date</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{survey.intimationDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Policy Number</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{survey.policyNumber}</p>
          </div>
        </div>
      </Card>

      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <UserCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">Claim Handler</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{survey.handler || 'Not assigned'}</p>
              <button className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2">
                Visit Handler's Profile <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="text-right border-l border-gray-100 pl-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hypothecation</p>
              <p className={`text-sm font-bold mt-1 ${survey.isHypothecated ? 'text-amber-600' : 'text-gray-600'}`}>
                {survey.isHypothecated ? 'YES' : 'NO'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">Garage Details</h3>
          </div>
          <p className="text-sm text-gray-600 mb-1 font-medium">{survey.garageName}</p>
          <p className="text-xs text-gray-400 mb-4">{survey.surveyLocation}</p>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            View on Google Maps <ExternalLink className="w-4 h-4" />
          </a>
        </Card>
      </div>

      {/* Scheduling Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Survey Scheduling</h2>
          <p className="text-gray-500 mt-1 text-sm">Manage and schedule different types of surveys for this claim.</p>
        </div>
        <Button variant="primary" onClick={() => setShowScheduleForm(true)}>
          <Plus className="w-4 h-4" />
          Schedule New Survey
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scheduled History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Scheduled Surveys</h3>
          {scheduledSurveys.map((s) => (
            <Card key={s.id} padding="md" className="hover:border-indigo-200 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${
                    s.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    s.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{s.type}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {s.date} at {s.time}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3.5 h-3.5" />
                        {s.surveyor}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 col-span-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {s.location}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Stats / Info */}
        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-4">Next Action</h4>
              <p className="text-lg font-bold mb-2">Final Survey Scheduled</p>
              <p className="text-indigo-300 text-sm mb-6">Scheduled for March 20th at 2:00 PM with Amit Singh.</p>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors border border-white/10">
                Reschedule
              </button>
            </div>
            <Calendar className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
          </div>

          <Card padding="md">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Survey Guidelines</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="p-1.5 bg-amber-50 rounded text-amber-600 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-bold text-gray-900">Photos Required:</span> Ensure at least 12 high-resolution photos are captured including chassis number.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="p-1.5 bg-blue-50 rounded text-blue-600 shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-bold text-gray-900">TAT:</span> Final survey report must be submitted within 24 hours of inspection.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        open={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        blur
        panelClassName="overflow-hidden rounded-2xl shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Schedule New Survey</h3>
          <button onClick={() => setShowScheduleForm(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <Plus className="w-5 h-5 rotate-45 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSchedule} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Survey Type</label>
            <Select className="bg-gray-50">
              {surveyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
              <Input type="date" className="bg-gray-50" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Time</label>
              <Input type="time" className="bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Surveyor</label>
            <Select disabled={loadingUsers} className="bg-gray-50">
              <option value="">{loadingUsers ? 'Loading surveyors...' : 'Select surveyor...'}</option>
              {surveyors.map(s => (
                <option key={s.id} value={s.name}>{s.name} ({s.department})</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Location</label>
            <Textarea rows={2} placeholder="Enter full address..." className="bg-gray-50" />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Confirm Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
