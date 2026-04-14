// ── System Event Registry ─────────────────────────────────────────────────────
// Source of truth for all system events that can be bound to triggers.

export type StageId        = 'intake' | 'evidence' | 'inspection' | 'settlement' | 'closing';
export type EventTriggerType = 'realtime' | 'timed';

export interface SystemEvent {
  id:      string;
  display: string;
  machine: string;
  type:    EventTriggerType;
  stage:   StageId;
}

export const STAGE_GROUPS: { id: StageId; label: string }[] = [
  { id: 'intake',     label: 'Survey Create / Intake (Intimation)' },
  { id: 'evidence',   label: 'Evidence Collection'                  },
  { id: 'inspection', label: 'Inspection, Assessment & Repair'      },
  { id: 'settlement', label: 'Settlement'                           },
  { id: 'closing',    label: 'Closing'                              },
];

export const SYSTEM_EVENTS: SystemEvent[] = [
  // ── Intake ─────────────────────────────────────────────────────────────────
  { id: 'evt-001', display: 'Intimation Created',          machine: 'intimation.created',             type: 'realtime', stage: 'intake'     },
  { id: 'evt-002', display: 'Surveyor Assigned',           machine: 'survey.surveyor_assigned',        type: 'realtime', stage: 'intake'     },
  { id: 'evt-003', display: 'Surveyor Acceptance Pending', machine: 'survey.acceptance_pending',       type: 'timed',    stage: 'intake'     },
  { id: 'evt-004', display: 'Intake SLA Breached',         machine: 'sla.intake_breached',             type: 'timed',    stage: 'intake'     },
  { id: 'evt-005', display: 'Survey Data Updated',         machine: 'survey.data_updated',             type: 'realtime', stage: 'intake'     },

  // ── Evidence ───────────────────────────────────────────────────────────────
  { id: 'evt-006', display: 'Evidence Requested',          machine: 'evidence.requested',              type: 'realtime', stage: 'evidence'   },
  { id: 'evt-007', display: 'Documents Pending',           machine: 'evidence.docs_pending',           type: 'timed',    stage: 'evidence'   },
  { id: 'evt-008', display: 'Evidence Rejected',           machine: 'evidence.rejected',               type: 'realtime', stage: 'evidence'   },
  { id: 'evt-009', display: 'Evidence Approved',           machine: 'evidence.approved',               type: 'realtime', stage: 'evidence'   },
  { id: 'evt-010', display: 'Evidence Upload Reminder Due',machine: 'evidence.reminder_due',           type: 'timed',    stage: 'evidence'   },

  // ── Inspection ─────────────────────────────────────────────────────────────
  { id: 'evt-011', display: 'Inspection Scheduled',        machine: 'inspection.scheduled',            type: 'realtime', stage: 'inspection' },
  { id: 'evt-012', display: 'Inspection Completed',        machine: 'inspection.completed',            type: 'realtime', stage: 'inspection' },
  { id: 'evt-013', display: 'Assessment Completed',        machine: 'assessment.completed',            type: 'realtime', stage: 'inspection' },
  { id: 'evt-014', display: 'Repair Initiated',            machine: 'repair.initiated',                type: 'realtime', stage: 'inspection' },
  { id: 'evt-015', display: 'Repair Status Updated',       machine: 'repair.status_updated',           type: 'timed',    stage: 'inspection' },
  { id: 'evt-016', display: 'Inspection SLA Nearing',      machine: 'sla.inspection_nearing',          type: 'timed',    stage: 'inspection' },

  // ── Settlement ─────────────────────────────────────────────────────────────
  { id: 'evt-017', display: 'Settlement Offer Made',       machine: 'settlement.offer_made',           type: 'realtime', stage: 'settlement' },
  { id: 'evt-018', display: 'Settlement Offer Accepted',   machine: 'settlement.offer_accepted',       type: 'realtime', stage: 'settlement' },
  { id: 'evt-019', display: 'Settlement Offer Disputed',   machine: 'settlement.offer_disputed',       type: 'realtime', stage: 'settlement' },
  { id: 'evt-020', display: 'Payment Disbursed',           machine: 'settlement.payment_disbursed',    type: 'realtime', stage: 'settlement' },
  { id: 'evt-021', display: 'Settlement SLA Nearing',      machine: 'sla.settlement_nearing',          type: 'timed',    stage: 'settlement' },

  // ── Closing ────────────────────────────────────────────────────────────────
  { id: 'evt-022', display: 'Survey Closed',               machine: 'survey.closed',                   type: 'realtime', stage: 'closing'    },
  { id: 'evt-023', display: 'Claim Finalised',             machine: 'survey.finalised',                type: 'timed',    stage: 'closing'    },
  { id: 'evt-024', display: 'Reopen Requested',            machine: 'survey.reopen_requested',         type: 'realtime', stage: 'closing'    },
  { id: 'evt-025', display: 'Post-Claim Feedback Due',     machine: 'survey.feedback_due',             type: 'timed',    stage: 'closing'    },
];
