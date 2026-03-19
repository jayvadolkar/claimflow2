export type UserRole = 'handler' | 'manager' | 'admin';

export type DocCategory = 'Policy' | 'Vehicle' | 'Identity' | 'Claim' | 'Workshop' | 'Other' | 'Driver' | 'Legal' | 'Financial';

export interface DocField {
  id: string;
  code: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validationRule?: string;
  isMasked?: boolean;
  showInReports?: boolean;
  isEditable?: boolean;
}

export interface DocumentDef {
  id: string;
  code: string;
  name: string;
  category: DocCategory;
  description: string;
  required: boolean;
  uploadRoles: UserRole[];
  verifyRoles: UserRole[];
  rejectRoles: UserRole[];
  fields: DocField[];
  hasFields?: boolean;
  isSystem?: boolean;
  allowedTypes: string[];
  workflowStage: string;
  maxSizeMB?: number;
  multipleUpload?: boolean;
  versioning?: boolean;
  applicableCases?: ('Repair' | 'Theft' | 'Total Loss')[];
  vehicleTypes?: ('2W' | '4W' | 'Others')[];
  vehicleClasses?: ('Commercial' | 'Personal')[];
  hypothecation?: 'Yes' | 'No' | 'Both';
}

export interface ValidationFlag {
  type: 'error' | 'warning' | 'success';
  message: string;
  source: string;
}

export interface SurveyEvent {
  id: string;
  surveyId: string;
  eventName: string;
  actor: string;
  triggerCondition: string;
  systemAction: string;
  outcomeState: string;
  timestamp: string;
}

export interface Survey {
  id: string; // e.g., IAR-2510-154315
  ref: string; // GUID
  claimNo: string;
  vehicle: string;
  insurer: string;
  division: string;
  branch: string;
  ro: string;
  handler: string;
  stage: string;
  docsStatus: string;
  photosStatus: string;
  aiStatus: string;
  lastUpdated: string;
  isHypothecated: boolean;
  
  // Request Details
  requestDate: string;
  intimationDate: string;
  requesterName: string;
  requesterContact: string;

  // Customer
  customerName: string;
  customerPhone: string;
  policyNumber: string;
  policyPeriodStart: string;
  policyPeriodEnd: string;

  // Workshop
  garageName: string;
  garageContact: string;
  lossType: string;
  lossValue: number;

  // Vehicle Details
  vehicleCategory: '2W' | '4W' | 'Others';
  vehicleClass: 'Commercial' | 'Personal';
  vehicleMake: string;
  vehicleModel: string;
  vehicleVersion: string;

  // Survey Details
  surveyLocation: string;
  zone: string;
  state: string;
  surveyor: string;
  documentCollector: string;
  requestFor: string;
  remarks: string;
  validationFlags?: ValidationFlag[];
  documents?: any[];
  photos?: any[];
  assessmentData?: any;
  communicationThreads?: any[];
}
