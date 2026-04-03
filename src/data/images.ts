import { ImageDef } from '../types';

const defaultPermissions = {
  view: ['role-admin', 'role-surveyor', 'role-workshop', 'role-qc', 'role-insured'],
  upload: ['role-surveyor', 'role-workshop', 'role-insured'],
  verify: ['role-admin', 'role-qc', 'role-surveyor'],
  reject: ['role-admin', 'role-qc', 'role-surveyor'],
  create: [],
  delete: []
};

const defaultApplicability = {
  applicableCases: ['Repair', 'Theft', 'Total Loss', 'Third Party'] as ('Repair' | 'Theft' | 'Total Loss' | 'Third Party')[],
  vehicleTypes: ['2W', '4W', 'Others'] as ('2W' | '4W' | 'Others')[],
  vehicleClasses: ['Commercial', 'Personal'] as ('Commercial' | 'Personal')[],
  hypothecation: ['Yes', 'No'] as ('Yes' | 'No')[],
};

export const predefinedImages: ImageDef[] = [
  // 10 Mandatory Vehicle Exterior & Interior Context Photos
  {
    id: 'img-v-left',
    name: 'Left View',
    description: 'Clear horizontal shot of the entire left side of the vehicle',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-right',
    name: 'Right View',
    description: 'Clear horizontal shot of the entire right side of the vehicle',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-rear',
    name: 'Rear View',
    description: 'Clear shot of the rear of the vehicle encompassing the bumper and trunk',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-front',
    name: 'Front View',
    description: 'Clear shot of the front of the vehicle encompassing the grille and hood',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-lf',
    name: 'Left Front View',
    description: 'Diagonal shot capturing both the left profile and the front of the vehicle',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-rf',
    name: 'Right Front View',
    description: 'Diagonal shot capturing both the right profile and the front of the vehicle',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-lr',
    name: 'Left Rear View',
    description: 'Diagonal shot capturing both the left profile and the rear of the vehicle',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-rr',
    name: 'Right Rear View',
    description: 'Diagonal shot capturing both the right profile and the rear of the vehicle',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-vin',
    name: 'VIN number',
    description: 'Direct close-up of the Vehicle Identification Number',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-v-dash',
    name: 'Dash with total KM reading',
    description: 'Clear shot of the dashboard cluster with the odometer miles clearly visible',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },

  // 6 Mandatory Close-up Damage Photos
  {
    id: 'img-d-1',
    name: 'Close up damage photo 1',
    description: 'Specific close-up tracking primary structural damage locus 1',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-d-2',
    name: 'Close up damage photo 2',
    description: 'Specific close-up tracking primary structural damage locus 2',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-d-3',
    name: 'Close up damage photo 3',
    description: 'Specific close-up tracking primary structural damage locus 3',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-d-4',
    name: 'Close up damage photo 4',
    description: 'Specific close-up tracking primary structural damage locus 4',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-d-5',
    name: 'Close up damage photo 5',
    description: 'Specific close-up tracking primary structural damage locus 5',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  },
  {
    id: 'img-d-6',
    name: 'Close up damage photo 6',
    description: 'Specific close-up tracking primary structural damage locus 6',
    workflowStage: 'Evidence Collection',
    required: true,
    aiInspection: true,
    isSystem: true,
    ...defaultApplicability,
    permissions: defaultPermissions
  }
];
