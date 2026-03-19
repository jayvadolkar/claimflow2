import React, { useState } from 'react';
import { Survey } from '../../types';
import { Building2, Car, MapPin, Calendar, FileText, UserCircle, Edit2, Save, X, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { handlers, surveyors } from '../../data';
import toast from 'react-hot-toast';

export function IntimationTab({ survey, onUpdateSurvey }: { survey: Survey, onUpdateSurvey: (s: Survey) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<Survey>(survey);

  const handleSave = () => {
    onUpdateSurvey(edited);
    setIsEditing(false);
    toast.success('Intimation summary updated successfully');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEdited({ ...edited, [e.target.name]: e.target.value });
  };

  const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <Icon className="w-4 h-4 text-indigo-500" />
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h3>
    </div>
  );

  const DataField = ({ label, name, value, type = "text", options }: { label: string, name: string, value: string | number, type?: string, options?: string[] }) => (
    <div className="group">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1 group-hover:text-indigo-500 transition-colors">{label}</label>
      <div className="text-sm font-medium text-gray-900">
        {isEditing ? (
          options ? (
            <select
              name={name}
              value={value as string}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select...</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input 
              type={type} 
              name={name} 
              value={value} 
              onChange={handleChange} 
              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          )
        ) : (
          <span className="font-mono tracking-tight">{value || '—'}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto p-8">
        
        {/* TOP BAR / HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded">Case File</span>
              <h1 className="text-3xl font-light tracking-tight text-gray-900">
                {edited.claimNo} <span className="text-gray-400 font-thin">/</span> <span className="text-gray-500">{edited.vehicle}</span>
              </h1>
            </div>
            <p className="text-sm text-gray-500 font-medium">Intimation Summary & Field Assignment</p>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Case
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEdited(survey); setIsEditing(false); }} 
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: POLICY & CUSTOMER */}
          <div className="col-span-12 lg:col-span-4 space-y-12">
            <div>
              <SectionHeader title="Policy & Insurer" icon={ShieldAlert} />
              <div className="grid grid-cols-1 gap-6">
                <DataField label="Insurer Name" name="insurer" value={edited.insurer} />
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Division" name="division" value={edited.division} />
                  <DataField label="Branch" name="branch" value={edited.branch} />
                </div>
                <DataField label="Policy Number" name="policyNumber" value={edited.policyNumber} />
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Period Start" name="policyPeriodStart" value={edited.policyPeriodStart} type="date" />
                  <DataField label="Period End" name="policyPeriodEnd" value={edited.policyPeriodEnd} type="date" />
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Customer Information" icon={UserCircle} />
              <div className="grid grid-cols-1 gap-6">
                <DataField label="Full Name" name="customerName" value={edited.customerName} />
                <DataField label="Contact Number" name="customerPhone" value={edited.customerPhone} />
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN: VEHICLE & LOSS */}
          <div className="col-span-12 lg:col-span-4 space-y-12">
            <div>
              <SectionHeader title="Vehicle Details" icon={Car} />
              <div className="grid grid-cols-1 gap-6">
                <DataField label="Registration Number" name="vehicle" value={edited.vehicle} />
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Make" name="vehicleMake" value={edited.vehicleMake} />
                  <DataField label="Model" name="vehicleModel" value={edited.vehicleModel} />
                </div>
                <DataField label="Category" name="vehicleCategory" value={edited.vehicleCategory} />
              </div>
            </div>

            <div>
              <SectionHeader title="Loss Information" icon={ShieldAlert} />
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Type of Loss" name="lossType" value={edited.lossType} />
                  <DataField label="Estimated Value" name="lossValue" value={edited.lossValue} type="number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DataField label="Date of Loss" name="requestDate" value={edited.requestDate} type="date" />
                  <DataField label="Intimation Date" name="intimationDate" value={edited.intimationDate} type="date" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ASSIGNMENT & GARAGE */}
          <div className="col-span-12 lg:col-span-4 space-y-12">
            <div>
              <SectionHeader title="Garage & Location" icon={MapPin} />
              <div className="grid grid-cols-1 gap-6">
                <DataField label="Garage Name" name="garageName" value={edited.garageName} />
                <DataField label="Garage Contact" name="garageContact" value={edited.garageContact} />
                <DataField label="Survey Location" name="surveyLocation" value={edited.surveyLocation} />
                
                <div className="mt-2 group relative h-40 rounded-2xl overflow-hidden border border-gray-200 grayscale hover:grayscale-0 transition-all duration-500">
                  <img src={`https://picsum.photos/seed/${survey.id}/600/400?blur=1`} alt="Location" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-transparent transition-colors" />
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-900">
                      <MapPin className="w-3 h-3 text-red-500" /> Open Maps
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Internal Assignment" icon={UserCircle} />
              <div className="grid grid-cols-1 gap-6">
                <DataField label="Primary Handler" name="handler" value={edited.handler} options={handlers} />
                <DataField label="Field Surveyor" name="surveyor" value={edited.surveyor} options={surveyors} />
                <DataField label="Doc Collector" name="documentCollector" value={edited.documentCollector} options={['Secure Auto', 'Maxum', 'FastTrack']} />
              </div>
            </div>
          </div>

        </div>

        {/* APPOINTMENTS SECTION - REFINED TABLE */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-light tracking-tight text-gray-900">Scheduled Appointments</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Field visits & inspections</p>
            </div>
            <button onClick={() => toast.success('Appointment scheduling opened')} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              <Plus className="w-3.5 h-3.5" /> New Appointment
            </button>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Surveyor</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded">Spot Survey</span>
                  </td>
                  <td className="px-8 py-6 font-medium text-gray-900">{survey.surveyLocation}</td>
                  <td className="px-8 py-6 text-gray-500">{survey.surveyor}</td>
                  <td className="px-8 py-6 font-mono text-gray-500">{survey.requestDate}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-4 items-center">
                      <button className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800">Edit</button>
                      <button className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
