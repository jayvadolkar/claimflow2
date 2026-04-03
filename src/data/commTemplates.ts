import { CommChannel } from '../types';

export interface CommTemplate {
  id: string;
  name: string;
  /** Survey lifecycle event that triggers this template automatically. Empty = manual-only. */
  triggerEvent: string;
  /** Which channels this template fires on */
  channels: CommChannel[];
  /** Which party roles receive this template */
  targetRoles: string[];
  /** Message content — supports {{customerName}}, {{claimNo}}, {{vehicleNo}}, {{garageName}} */
  content: string;
  isSystem: boolean;
  isActive: boolean;
}

export const defaultCommTemplates: CommTemplate[] = [
  {
    id: 'tpl-survey-created-insured',
    name: 'Survey Created — Insured Notification',
    triggerEvent: 'survey.created',
    channels: ['whatsapp', 'sms', 'email'],
    targetRoles: ['insured'],
    content:
      'Dear {{customerName}}, your motor claim (Claim No: {{claimNo}}) has been registered. Our surveyor will contact you shortly. Please keep your vehicle and documents ready.',
    isSystem: true,
    isActive: true,
  },
  {
    id: 'tpl-survey-created-garage',
    name: 'Survey Created — Garage Notification',
    triggerEvent: 'survey.created',
    channels: ['whatsapp', 'email'],
    targetRoles: ['garage'],
    content:
      'Dear {{garageName}} team, a new survey has been assigned for vehicle {{vehicleNo}} (Claim No: {{claimNo}}). Please ensure the vehicle is accessible for inspection. Our surveyor will coordinate with you directly.',
    isSystem: true,
    isActive: true,
  },
  {
    id: 'tpl-request-rc',
    name: 'Request RC Copy',
    triggerEvent: '',
    channels: ['whatsapp', 'sms'],
    targetRoles: ['insured'],
    content:
      'Dear {{customerName}}, please share a clear photo of your Vehicle Registration Certificate (RC) for claim processing (Claim No: {{claimNo}}).',
    isSystem: false,
    isActive: true,
  },
  {
    id: 'tpl-request-damage-photos',
    name: 'Request Damage Photos',
    triggerEvent: '',
    channels: ['whatsapp'],
    targetRoles: ['insured'],
    content:
      'Dear {{customerName}}, please share clear photos of the vehicle damage from all 4 sides and the odometer reading (Claim No: {{claimNo}}).',
    isSystem: false,
    isActive: true,
  },
  {
    id: 'tpl-visit-confirmation',
    name: 'Surveyor Visit Confirmation',
    triggerEvent: '',
    channels: ['whatsapp', 'sms'],
    targetRoles: ['insured', 'garage'],
    content:
      'Our surveyor will visit for inspection shortly. Please ensure the vehicle (Claim No: {{claimNo}}) is ready and accessible.',
    isSystem: false,
    isActive: true,
  },
  {
    id: 'tpl-request-estimate',
    name: 'Request Repair Estimate',
    triggerEvent: '',
    channels: ['email'],
    targetRoles: ['garage'],
    content:
      'Dear {{garageName}} team, please share the detailed repair estimate for vehicle (Claim No: {{claimNo}}). The estimate should include itemised parts cost, labour charges, and any applicable taxes.',
    isSystem: false,
    isActive: true,
  },
  {
    id: 'tpl-doc-approved',
    name: 'Document Approved',
    triggerEvent: 'document.approved',
    channels: ['whatsapp'],
    targetRoles: ['insured'],
    content:
      'Dear {{customerName}}, your document has been verified and approved for claim {{claimNo}}. Thank you.',
    isSystem: true,
    isActive: true,
  },
  {
    id: 'tpl-stage-settlement',
    name: 'Settlement Stage Notification',
    triggerEvent: 'survey.stage.settlement',
    channels: ['email', 'sms'],
    targetRoles: ['insured'],
    content:
      'Dear {{customerName}}, your claim {{claimNo}} has moved to the Settlement stage. Our team will process the payment shortly. Please ensure your bank details are up to date.',
    isSystem: true,
    isActive: true,
  },
  {
    id: 'tpl-share-report',
    name: 'Share Survey Report',
    triggerEvent: '',
    channels: ['email'],
    targetRoles: ['insurer'],
    content:
      'Dear Team, please find attached the survey report for claim {{claimNo}}. The inspection has been completed and the findings are documented in the attached report.',
    isSystem: false,
    isActive: true,
  },
];
