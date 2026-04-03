import React, { useState, useEffect } from 'react';
import { Survey } from '../../types';
import { Building2, Car, MapPin, Calendar, UserCircle, ShieldAlert, Edit2, Save, X, Copy } from 'lucide-react';
import { handlers, surveyors } from '../../data';
import toast from 'react-hot-toast';

const SidebarCard = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="bg-white border-b border-gray-100 last:border-0">
    <div className="px-4 py-3 flex items-center gap-2 bg-gray-50/50">
      <Icon className="w-3.5 h-3.5 text-indigo-500" />
      <h3 className="font-bold text-[11px] text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-4 space-y-4">
      {children}
    </div>
  </div>
);

const DataField = ({ label, value, isEditing, name, onChange, type = "text", options, canCopy }: any) => {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value.toString());
      toast.success(`${label} copied to clipboard`);
    }
  };

  return (
    <div>
      <dt className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-1">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium flex items-center justify-between group">
        <span className="truncate">
          {isEditing ? (
            options ? (
              <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select...</option>
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input 
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            )
          ) : (
            value || '—'
          )}
        </span>
        {!isEditing && canCopy && value && (
          <button 
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-all"
            title={`Copy ${label}`}
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </dd>
    </div>
  );
};

export function IntimationSidebar({ survey, onUpdateSurvey }: { survey: Survey, onUpdateSurvey: (s: Survey) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<Survey>(survey);

  const handleSave = () => {
    onUpdateSurvey(edited);
    setIsEditing(false);
    toast.success('Summary updated');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEdited({ ...edited, [e.target.name]: e.target.value });
  };

  // Re-sync local edited state when survey prop changes (e.g. from quick selects)
  // but only when not actively in edit mode to avoid clobbering unsaved changes
  useEffect(() => {
    if (!isEditing) {
      setEdited(survey);
    }
  }, [survey]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <h2 className="font-bold text-gray-900 text-sm">Intimation Summary</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={() => { setEdited(survey); setIsEditing(false); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md">
              <X className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md">
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {/* Quick Filters Card */}
        <div className="bg-white border-b border-gray-100">
          <div className="px-4 py-3 flex items-center gap-2 bg-gray-50/50">
            <Car className="w-3.5 h-3.5 text-indigo-500" />
            <h3 className="font-bold text-[11px] text-gray-500 uppercase tracking-wider">Claim Parameters</h3>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.1em]">Live</span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-1">Vehicle Type</dt>
              <select
                value={survey.vehicleCategory}
                onChange={(e) => onUpdateSurvey({ ...survey, vehicleCategory: e.target.value as any })}
                className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="2W">2 Wheeler</option>
                <option value="4W">4 Wheeler</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-1">Vehicle Class</dt>
              <select
                value={survey.vehicleClass}
                onChange={(e) => onUpdateSurvey({ ...survey, vehicleClass: e.target.value as any })}
                className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Personal">Personal</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-1">Claim Type</dt>
              <select
                value={survey.lossType}
                onChange={(e) => onUpdateSurvey({ ...survey, lossType: e.target.value })}
                className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Repair">Repair</option>
                <option value="Total Loss">Total Loss</option>
                <option value="Theft">Theft</option>
                <option value="Third Party">Third Party</option>
              </select>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mb-1">Hypothecation</dt>
              <select
                value={survey.isHypothecated ? 'Yes' : 'No'}
                onChange={(e) => onUpdateSurvey({ ...survey, isHypothecated: e.target.value === 'Yes' })}
                className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        <SidebarCard title="Claim & Insurer" icon={Building2}>
          <DataField label="Insurer" name="insurer" value={edited.insurer} isEditing={isEditing} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Claim No." name="claimNo" value={edited.claimNo} isEditing={isEditing} onChange={handleChange} canCopy={true} />
            <DataField label="Division" name="division" value={edited.division} isEditing={isEditing} onChange={handleChange} />
          </div>
          <DataField label="Branch" name="branch" value={edited.branch} isEditing={isEditing} onChange={handleChange} />
        </SidebarCard>

        <SidebarCard title="Policy Details" icon={ShieldAlert}>
          <DataField label="Policy No." name="policyNumber" value={edited.policyNumber} isEditing={isEditing} onChange={handleChange} canCopy={true} />
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Start" name="policyPeriodStart" value={edited.policyPeriodStart} isEditing={isEditing} onChange={handleChange} type="date" />
            <DataField label="End" name="policyPeriodEnd" value={edited.policyPeriodEnd} isEditing={isEditing} onChange={handleChange} type="date" />
          </div>
          <DataField label="Customer" name="customerName" value={edited.customerName} isEditing={isEditing} onChange={handleChange} />
        </SidebarCard>

        <SidebarCard title="Loss & Vehicle" icon={Car}>
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Loss Value" name="lossValue" value={edited.lossValue} isEditing={isEditing} onChange={handleChange} type="number" />
          </div>
          <DataField label="Vehicle No." name="vehicle" value={edited.vehicle} isEditing={isEditing} onChange={handleChange} canCopy={true} />
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Make" name="vehicleMake" value={edited.vehicleMake} isEditing={isEditing} onChange={handleChange} />
            <DataField label="Model" name="vehicleModel" value={edited.vehicleModel} isEditing={isEditing} onChange={handleChange} />
          </div>
        </SidebarCard>

        <SidebarCard title="Location" icon={MapPin}>
          <DataField label="Garage" name="garageName" value={edited.garageName} isEditing={isEditing} onChange={handleChange} />
          <DataField label="Survey Location" name="surveyLocation" value={edited.surveyLocation} isEditing={isEditing} onChange={handleChange} />
          <div className="mt-2 w-full h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative">
            <img src={`https://picsum.photos/seed/${survey.id}/300/100?blur=2`} alt="Map" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
          </div>
        </SidebarCard>

        <SidebarCard title="Assignments" icon={UserCircle}>
          <div className="flex items-center justify-between">
            <DataField label="Handler" name="handler" value={edited.handler} isEditing={isEditing} onChange={handleChange} options={handlers} />
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                Update
              </button>
            )}
          </div>
          <DataField label="Surveyor" name="surveyor" value={edited.surveyor} isEditing={isEditing} onChange={handleChange} options={surveyors} />
        </SidebarCard>
      </div>
    </div>
  );
}
