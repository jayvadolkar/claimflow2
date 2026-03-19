import React, { useState } from 'react';
import { ArrowLeft, Save, X, Building2, ShieldAlert, Car, MapPin, UserCircle, Calendar, FileText } from 'lucide-react';
import { Survey } from '../types';
import { insurers, handlers, surveyors, makesAndModels, stateData } from '../data';
import toast from 'react-hot-toast';

interface NewSurveyFormProps {
  onSave: (survey: Survey) => void;
  onCancel: () => void;
}

const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
      <Icon className="w-5 h-5 text-indigo-600" />
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </div>
);

const InputField = ({ label, name, type = "text", required = false, options, formData, handleChange }: any) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        name={name}
        value={(formData as any)[name] || ''}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
      >
        <option value="">Select {label}...</option>
        {options.map((opt: any) => (
          <option key={typeof opt === 'string' ? opt : opt.make || opt.state} value={typeof opt === 'string' ? opt : opt.make || opt.state}>
            {typeof opt === 'string' ? opt : opt.make || opt.state}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={(formData as any)[name] || ''}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
    )}
  </div>
);

export function NewSurveyForm({ onSave, onCancel }: NewSurveyFormProps) {
  const [formData, setFormData] = useState<Partial<Survey>>({
    stage: 'Draft',
    docsStatus: '0/5',
    photosStatus: '0',
    aiStatus: 'Pending',
    lastUpdated: 'Just now',
    requestDate: new Date().toISOString().split('T')[0],
    intimationDate: new Date().toISOString().split('T')[0],
    lossValue: 0,
    vehicleCategory: '4W',
    vehicleClass: 'Personal',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerName || !formData.vehicle || !formData.insurer) {
      toast.error('Please fill in all required fields (Customer, Vehicle, Insurer)');
      return;
    }

    const newSurvey: Survey = {
      id: `IAR-2510-${Math.floor(100000 + Math.random() * 900000)}`,
      ref: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      claimNo: formData.claimNo || '',
      vehicle: formData.vehicle || '',
      insurer: formData.insurer || '',
      division: formData.division || '',
      branch: formData.branch || '',
      ro: formData.ro || '',
      handler: formData.handler || '',
      stage: 'Draft',
      docsStatus: '0/5',
      photosStatus: '0',
      aiStatus: 'Pending',
      lastUpdated: 'Just now',
      requestDate: formData.requestDate || new Date().toISOString().split('T')[0],
      intimationDate: formData.intimationDate || new Date().toISOString().split('T')[0],
      requesterName: formData.requesterName || '',
      requesterContact: formData.requesterContact || '',
      customerName: formData.customerName || '',
      customerPhone: formData.customerPhone || '',
      policyNumber: formData.policyNumber || '',
      policyPeriodStart: formData.policyPeriodStart || '',
      policyPeriodEnd: formData.policyPeriodEnd || '',
      garageName: formData.garageName || '',
      garageContact: formData.garageContact || '',
      lossType: formData.lossType || '',
      lossValue: Number(formData.lossValue) || 0,
      vehicleCategory: formData.vehicleCategory || '4W',
      vehicleClass: formData.vehicleClass || 'Personal',
      vehicleMake: formData.vehicleMake || '',
      vehicleModel: formData.vehicleModel || '',
      vehicleVersion: formData.vehicleVersion || '',
      surveyLocation: formData.surveyLocation || '',
      zone: formData.zone || '',
      state: formData.state || '',
      surveyor: formData.surveyor || '',
      documentCollector: formData.documentCollector || '',
      requestFor: formData.requestFor || 'Initial Survey',
      remarks: formData.remarks || '',
      isHypothecated: formData.isHypothecated === 'Yes',
    };

    onSave(newSurvey);
    toast.success('New survey created successfully');
  };

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
        <Icon className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );

  const FormInputField = ({ label, name, type = "text", required = false, options }: any) => (
    <InputField label={label} name={name} type={type} required={required} options={options} formData={formData} handleChange={handleChange} />
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 shrink-0 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-5">
          <button 
            onClick={onCancel}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-10 w-px bg-gray-200"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">New Intake</span>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Claim Intimation Form</h2>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Initialize a new survey by providing the primary claim details.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            Discard
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            Create & Proceed
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <Section title="Claim & Insurer Context" icon={Building2}>
            <FormInputField label="Insurer" name="insurer" required options={insurers} formData={formData} handleChange={handleChange} />
            <FormInputField label="Claim Number" name="claimNo" formData={formData} handleChange={handleChange} />
            <FormInputField label="Division" name="division" formData={formData} handleChange={handleChange} />
            <FormInputField label="Branch" name="branch" formData={formData} handleChange={handleChange} />
            <FormInputField label="Regional Office" name="ro" formData={formData} handleChange={handleChange} />
            <FormInputField label="Intimation Date" name="intimationDate" type="date" formData={formData} handleChange={handleChange} />
          </Section>

          <Section title="Policy Details" icon={ShieldAlert}>
            <FormInputField label="Policy Number" name="policyNumber" formData={formData} handleChange={handleChange} />
            <FormInputField label="Policy Start Date" name="policyPeriodStart" type="date" formData={formData} handleChange={handleChange} />
            <FormInputField label="Policy End Date" name="policyPeriodEnd" type="date" formData={formData} handleChange={handleChange} />
            <FormInputField label="Customer Name" name="customerName" required formData={formData} handleChange={handleChange} />
            <FormInputField label="Customer Phone" name="customerPhone" formData={formData} handleChange={handleChange} />
            <FormInputField label="Requester Name" name="requesterName" formData={formData} handleChange={handleChange} />
            <FormInputField label="Requester Contact" name="requesterContact" formData={formData} handleChange={handleChange} />
          </Section>

          <Section title="Vehicle Details" icon={Car}>
            <FormInputField label="Vehicle Number" name="vehicle" required formData={formData} handleChange={handleChange} />
            <FormInputField label="Vehicle Category" name="vehicleCategory" options={['2W', '4W', 'Others']} formData={formData} handleChange={handleChange} />
            <FormInputField label="Vehicle Class" name="vehicleClass" options={['Commercial', 'Personal']} formData={formData} handleChange={handleChange} />
            <FormInputField label="Hypothecation" name="isHypothecated" options={['Yes', 'No']} formData={formData} handleChange={handleChange} />
            <FormInputField label="Make" name="vehicleMake" options={makesAndModels} formData={formData} handleChange={handleChange} />
            <FormInputField label="Model" name="vehicleModel" options={formData.vehicleMake ? makesAndModels.find(m => m.make === formData.vehicleMake)?.models : []} formData={formData} handleChange={handleChange} />
            <FormInputField label="Version" name="vehicleVersion" formData={formData} handleChange={handleChange} />
          </Section>

          <Section title="Loss & Workshop" icon={FileText}>
            <FormInputField label="Loss Type" name="lossType" options={['Repair', 'Total Loss', 'Theft', 'Third Party']} formData={formData} handleChange={handleChange} />
            <FormInputField label="Estimated Loss Value" name="lossValue" type="number" formData={formData} handleChange={handleChange} />
            <FormInputField label="Garage Name" name="garageName" formData={formData} handleChange={handleChange} />
            <FormInputField label="Garage Contact" name="garageContact" formData={formData} handleChange={handleChange} />
          </Section>

          <Section title="Location & Assignment" icon={MapPin}>
            <FormInputField label="State" name="state" options={stateData} formData={formData} handleChange={handleChange} />
            <FormInputField label="City/Location" name="surveyLocation" options={formData.state ? stateData.find(s => s.state === formData.state)?.cities : []} formData={formData} handleChange={handleChange} />
            <FormInputField label="Zone" name="zone" options={['North', 'South', 'East', 'West', 'Central']} formData={formData} handleChange={handleChange} />
            <FormInputField label="Handler" name="handler" options={handlers} formData={formData} handleChange={handleChange} />
            <FormInputField label="Surveyor" name="surveyor" options={surveyors} formData={formData} handleChange={handleChange} />
            <FormInputField label="Request For" name="requestFor" options={['Initial Survey', 'Final Survey', 'Re-inspection']} formData={formData} handleChange={handleChange} />
          </Section>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-12">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Additional Remarks</h3>
            </div>
            <div className="p-6">
              <textarea
                name="remarks"
                value={formData.remarks || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                placeholder="Enter any additional remarks or instructions..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mb-12">
            <button 
              type="button"
              onClick={onCancel}
              className="px-8 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Discard
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              <Save className="w-5 h-5" />
              Create Survey & Open Details
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
}
