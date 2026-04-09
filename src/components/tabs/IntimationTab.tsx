import React, { useState } from 'react';
import { Survey } from '../../types';
import { Car, MapPin, UserCircle, Edit2, Save, X, Plus, Trash2, ShieldAlert, Building2 } from 'lucide-react';
import { handlers, surveyors } from '../../data';
import toast from 'react-hot-toast';

// ── Zoop DS: Input field ──────────────────────────────────────────────────────
const ZInput = ({
  label,
  name,
  value,
  type = 'text',
  onChange,
  readOnly,
}: {
  label: string;
  name: string;
  value: string | number;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-medium text-gray-500 leading-none">{label}</label>
    {readOnly ? (
      <div className="h-10 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 truncate">
        {value || <span className="text-gray-300">—</span>}
      </div>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
      />
    )}
  </div>
);

// ── Zoop DS: Select field ─────────────────────────────────────────────────────
const ZSelect = ({
  label,
  name,
  value,
  options,
  onChange,
  readOnly,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  readOnly?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-medium text-gray-500 leading-none">{label}</label>
    {readOnly ? (
      <div className="h-10 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900">
        {value || <span className="text-gray-300">—</span>}
      </div>
    ) : (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none cursor-pointer"
      >
        <option value="">Select…</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )}
  </div>
);

// ── Zoop DS: Section header ───────────────────────────────────────────────────
const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex items-center gap-2 mb-5">
    <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center flex-shrink-0">
      <Icon className="w-3.5 h-3.5 text-white" />
    </div>
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">{title}</h3>
    <div className="flex-1 h-px bg-gray-100 ml-1" />
  </div>
);

export function IntimationTab({ survey, onUpdateSurvey }: { survey: Survey; onUpdateSurvey: (s: Survey) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<Survey>(survey);

  const handleSave = () => {
    onUpdateSurvey(edited);
    setIsEditing(false);
    toast.success('Intimation updated');
  };

  const handleCancel = () => {
    setEdited(survey);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEdited({ ...edited, [e.target.name]: e.target.value });
  };

  const ro = !isEditing;

  return (
    <div className="bg-[#F7F7F7] min-h-full">
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                Intimation
              </span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{edited.claimNo}</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {edited.vehicle}
              <span className="text-gray-400 font-light ml-2 text-lg">{edited.insurer}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 h-10 px-5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 active:scale-95 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 h-10 px-5 bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-50 transition-all"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 h-10 px-5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-12 gap-6">

          {/* ── Column 1: Policy & Customer ── */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <SectionHeader title="Policy & Insurer" icon={Building2} />
              <div className="space-y-4">
                <ZInput label="Insurer Name" name="insurer" value={edited.insurer} onChange={handleChange} readOnly={ro} />
                <div className="grid grid-cols-2 gap-3">
                  <ZInput label="Division" name="division" value={edited.division} onChange={handleChange} readOnly={ro} />
                  <ZInput label="Branch" name="branch" value={edited.branch} onChange={handleChange} readOnly={ro} />
                </div>
                <ZInput label="Policy Number" name="policyNumber" value={edited.policyNumber} onChange={handleChange} readOnly={ro} />
                <div className="grid grid-cols-2 gap-3">
                  <ZInput label="Period Start" name="policyPeriodStart" value={edited.policyPeriodStart} type="date" onChange={handleChange} readOnly={ro} />
                  <ZInput label="Period End" name="policyPeriodEnd" value={edited.policyPeriodEnd} type="date" onChange={handleChange} readOnly={ro} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <SectionHeader title="Customer" icon={UserCircle} />
              <div className="space-y-4">
                <ZInput label="Full Name" name="customerName" value={edited.customerName} onChange={handleChange} readOnly={ro} />
                <ZInput label="Contact Number" name="customerPhone" value={edited.customerPhone} onChange={handleChange} readOnly={ro} />
              </div>
            </div>

          </div>

          {/* ── Column 2: Vehicle & Loss ── */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <SectionHeader title="Vehicle" icon={Car} />
              <div className="space-y-4">
                <ZInput label="Registration Number" name="vehicle" value={edited.vehicle} onChange={handleChange} readOnly={ro} />
                <div className="grid grid-cols-2 gap-3">
                  <ZInput label="Make" name="vehicleMake" value={edited.vehicleMake} onChange={handleChange} readOnly={ro} />
                  <ZInput label="Model" name="vehicleModel" value={edited.vehicleModel} onChange={handleChange} readOnly={ro} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ZSelect
                    label="Category"
                    name="vehicleCategory"
                    value={edited.vehicleCategory}
                    options={['2W', '4W', 'Others']}
                    onChange={handleChange}
                    readOnly={ro}
                  />
                  <ZSelect
                    label="Class"
                    name="vehicleClass"
                    value={edited.vehicleClass}
                    options={['Personal', 'Commercial']}
                    onChange={handleChange}
                    readOnly={ro}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <SectionHeader title="Loss Details" icon={ShieldAlert} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ZSelect
                    label="Type of Loss"
                    name="lossType"
                    value={edited.lossType}
                    options={['Repair', 'Total Loss', 'Theft', 'Third Party']}
                    onChange={handleChange}
                    readOnly={ro}
                  />
                  <ZInput label="Estimated Value (₹)" name="lossValue" value={edited.lossValue} type="number" onChange={handleChange} readOnly={ro} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ZInput label="Date of Loss" name="requestDate" value={edited.requestDate} type="date" onChange={handleChange} readOnly={ro} />
                  <ZInput label="Intimation Date" name="intimationDate" value={edited.intimationDate} type="date" onChange={handleChange} readOnly={ro} />
                </div>
              </div>
            </div>

          </div>

          {/* ── Column 3: Garage & Assignment ── */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <SectionHeader title="Garage & Location" icon={MapPin} />
              <div className="space-y-4">
                <ZInput label="Garage Name" name="garageName" value={edited.garageName} onChange={handleChange} readOnly={ro} />
                <ZInput label="Garage Contact" name="garageContact" value={edited.garageContact} onChange={handleChange} readOnly={ro} />
                <ZInput label="Survey Location" name="surveyLocation" value={edited.surveyLocation} onChange={handleChange} readOnly={ro} />
                <div className="h-36 rounded-xl overflow-hidden border border-gray-100 relative">
                  <img
                    src={`https://picsum.photos/seed/${survey.id}/600/400?blur=1`}
                    alt="Location"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow text-[10px] font-bold uppercase tracking-widest text-gray-800">
                      <MapPin className="w-3 h-3 text-red-500" /> Open Maps
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <SectionHeader title="Assignment" icon={UserCircle} />
              <div className="space-y-4">
                <ZSelect
                  label="Primary Handler"
                  name="handler"
                  value={edited.handler}
                  options={handlers}
                  onChange={handleChange}
                  readOnly={ro}
                />
                <ZSelect
                  label="Field Surveyor"
                  name="surveyor"
                  value={edited.surveyor}
                  options={surveyors}
                  onChange={handleChange}
                  readOnly={ro}
                />
                <ZSelect
                  label="Doc Collector"
                  name="documentCollector"
                  value={edited.documentCollector}
                  options={['Secure Auto', 'Maxum', 'FastTrack']}
                  onChange={handleChange}
                  readOnly={ro}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Appointments ── */}
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Scheduled Appointments</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Field visits & inspections</p>
            </div>
            <button
              onClick={() => toast.success('Appointment scheduling opened')}
              className="inline-flex items-center gap-2 h-9 px-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Surveyor</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest">
                    Spot Survey
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{survey.surveyLocation}</td>
                <td className="px-6 py-4 text-gray-500">{survey.surveyor}</td>
                <td className="px-6 py-4 font-mono text-gray-500 text-xs">{survey.requestDate}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-gray-900 hover:underline">Edit</button>
                    <button className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
