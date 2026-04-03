export type ScopeTarget = { type: string; value: string; } // used by RBAC

// ── Survey context axis types ──────────────────────────────────────────────────
export type LossType = 'Repair' | 'Theft' | 'Total Loss' | 'Third Party';
export type VehicleType = '2W' | '4W' | 'Others';
export type VehicleClass = 'Commercial' | 'Personal';
export type HypothecationType = 'Yes' | 'No';

// ── Rule layer: maps document/image + survey context → appearance & behavior ───
// Empty / absent on any axis means "match all values on that axis"
export interface DocumentRule {
  id: string;
  documentId: string;             // → DocumentDef.id
  label?: string;                 // human-readable summary, auto-built
  applicableCases?: LossType[];
  vehicleTypes?: VehicleType[];
  vehicleClasses?: VehicleClass[];
  hypothecation?: HypothecationType[];
  required: boolean;
  canBeOverridden: boolean;
  overrideRoles?: string[];       // role IDs that may override in this context
  createdAt?: string;
}

export interface ImageRule {
  id: string;
  imageId: string;                // → ImageDef.id
  label?: string;
  applicableCases?: LossType[];
  vehicleTypes?: VehicleType[];
  vehicleClasses?: VehicleClass[];
  hypothecation?: HypothecationType[];
  required: boolean;
  canBeOverridden: boolean;
  overrideRoles?: string[];
  createdAt?: string;
}

// ── Condition-centric profile: one condition set → many document/image assignments ─
// This is the primary storage format for SurveyConfiguration.
// Empty / absent axes = match all surveys on that axis.
export interface SurveyProfileDocument {
  documentId: string;
  required: boolean;
  canBeOverridden: boolean;
  overrideRoles?: string[];
  workflowStages?: string[]; // overrides DocumentDef.workflowStage; empty = use default
}
export interface SurveyProfileImage {
  imageId: string;
  required: boolean;
  canBeOverridden: boolean;
  workflowStages?: string[]; // overrides ImageDef.workflowStage; empty = use default
}
export interface SurveyProfile {
  id: string;
  label?: string;
  applicableCases?: LossType[];
  vehicleTypes?: VehicleType[];
  vehicleClasses?: VehicleClass[];
  hypothecation?: HypothecationType[];
  documents: SurveyProfileDocument[];
  images: SurveyProfileImage[];
  createdAt?: string;
}

// Result of matching rules against a survey context
export interface MatchedRule {
  required: boolean;
  canBeOverridden: boolean;
  overrideRoles: string[];
  matchedRuleId: string;
  specificity: number;
}

export interface DocumentPermissions {
  upload: string[];   // role IDs
  verify: string[];
  reject: string[];
  view: string[];
  create: string[];   // can create/add this doc type
  delete: string[];   // can delete this doc type
  override?: string[]; // can waive/override a missing or rejected document
}
export type UserRole = string; // Migrated to dynamic RBAC role IDs

export type DocCategory = 'Policy' | 'Vehicle' | 'Identity' | 'Claim' | 'Workshop' | 'Other' | 'Driver' | 'Legal' | 'Financial';

export interface DocField {
  id: string;
  code: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'table';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validationRule?: string;
  isMasked?: boolean;
  showInReports?: boolean;
  isEditable?: boolean;
  // for type='table': defines repeating row columns (same shape as DocField but no nesting)
  columns?: Omit<DocField, 'columns'>[];
}

export interface DocumentDef {
  id: string;
  code: string;
  name: string;
  category: DocCategory;
  description: string;
  permissions?: DocumentPermissions;
  fields: DocField[];
  hasFields?: boolean;
  isSystem?: boolean;
  allowedTypes: string[];
  workflowStage: string;
  maxSizeMB?: number;
  multipleUpload?: boolean;
  versioning?: boolean;
  // ── Deprecated: moved to DocumentRule ────────────────────────────────────────
  /** @deprecated Use DocumentRule.required instead */
  required?: boolean;
  /** @deprecated Use DocumentRule.canBeOverridden instead */
  canBeOverridden?: boolean;
  /** @deprecated Use DocumentRule.applicableCases instead */
  applicableCases?: LossType[];
  /** @deprecated Use DocumentRule.vehicleTypes instead */
  vehicleTypes?: VehicleType[];
  /** @deprecated Use DocumentRule.vehicleClasses instead */
  vehicleClasses?: VehicleClass[];
  /** @deprecated Use DocumentRule.hypothecation instead */
  hypothecation?: HypothecationType[];
}

export interface ImageDef {
  id: string;
  name: string;
  description: string;
  workflowStage: string;
  aiInspection: boolean;
  permissions?: DocumentPermissions;
  isSystem?: boolean;
  // ── Deprecated: moved to ImageRule ───────────────────────────────────────────
  /** @deprecated Use ImageRule.required instead */
  required?: boolean;
  /** @deprecated Use ImageRule.applicableCases instead */
  applicableCases?: LossType[];
  /** @deprecated Use ImageRule.vehicleTypes instead */
  vehicleTypes?: VehicleType[];
  /** @deprecated Use ImageRule.vehicleClasses instead */
  vehicleClasses?: VehicleClass[];
  /** @deprecated Use ImageRule.hypothecation instead */
  hypothecation?: HypothecationType[];
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

// ── Communication: Party Identity ─────────────────────────────────────────────
export type PartyRole = 'insured' | 'garage' | 'surveyor' | 'insurer' | 'internal';

export interface CommParty {
  role: PartyRole;
  name: string;
  mobile?: string;
  email?: string;
}

// ── Communication: Channels + Messages ────────────────────────────────────────
export type CommChannel = 'whatsapp' | 'sms' | 'email' | 'internal';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageSender = 'handler' | 'participant' | 'system';

export interface CommAttachment {
  name: string;
  type: string;
  size: string;
  url?: string;
}

export interface CommMessage {
  id: string;
  channel: CommChannel;
  sender: MessageSender;
  senderName?: string;
  content: string;
  timestamp: string;           // ISO 8601
  status?: MessageStatus;
  failureReason?: string;
  retryCount?: number;
  attachments?: CommAttachment[];
  templateId?: string;
  isAutoEvent?: boolean;
  eventLabel?: string;
}

export interface CommThread {
  id: string;                  // surveyId + ':' + partyRole
  surveyId: string;
  party: CommParty;
  messages: CommMessage[];
  unreadCount: number;
  lastMessage?: string;
  lastActivityAt?: string;     // ISO timestamp
  threadStatus: 'active' | 'waiting' | 'closed';
}

// ── Untagged (ghost flow) conversations ──────────────────────────────────────
export type GhostFlowState =
  | 'collecting_vehicle_no'
  | 'collecting_claim_no'
  | 'awaiting_tagging'
  | 'tagged'
  | 'dismissed';

export interface UntaggedConversation {
  id: string;
  channel: CommChannel;
  senderIdentifier: string;
  messages: CommMessage[];
  ghostFlowState: GhostFlowState;
  collectedVehicleNo?: string;
  collectedClaimNo?: string;
  createdAt: string;
  taggedToSurveyId?: string;
  taggedBy?: string;
  taggedAt?: string;
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
  surveyorPhone?: string;
  surveyorEmail?: string;
  insurerEmail?: string;
  documentCollector: string;
  requestFor: string;
  remarks: string;
  validationFlags?: ValidationFlag[];
  documents?: any[];
  photos?: any[];
  assessmentData?: any;
  /** @deprecated use threads */
  communicationThreads?: any[];
  threads?: CommThread[];
}
