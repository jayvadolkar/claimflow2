/**
 * commEvents.ts
 *
 * Phase 5 — Auto-events utility.
 *
 * Inject survey lifecycle events as system messages into the relevant
 * communication threads. Called from survey operations (stage changes,
 * document approvals, AI completion, etc.)
 *
 * Usage:
 *   import { injectAutoEvent } from '../services/commEvents';
 *   const updatedSurvey = injectAutoEvent(survey, 'survey.stage.changed', {
 *     stageName: 'Settlement',
 *     targetRoles: ['insured', 'internal'],
 *   });
 *   onUpdateSurvey(updatedSurvey);
 */

import { Survey, CommThread, CommMessage, CommChannel, PartyRole } from '../types';
import { defaultCommTemplates } from '../data/commTemplates';
import { buildSeededThreads } from '../data/commSeedData';

export type AutoEventKind =
  | 'survey.created'
  | 'survey.stage.changed'
  | 'document.requested'
  | 'document.approved'
  | 'document.rejected'
  | 'ai.inspection.completed'
  | 'survey.report.submitted'
  | 'settlement.approved'
  | 'custom';

export interface AutoEventOptions {
  /** Human-readable label shown as a pill in the thread */
  label: string;
  /** Which party threads to inject into. Defaults to all threads. */
  targetRoles?: PartyRole[];
  /** If set, also fire an outbound message from the matching template */
  templateId?: string;
  /** Template variable overrides */
  vars?: Record<string, string>;
}

function fillTemplate(content: string, survey: Survey, vars: Record<string, string> = {}): string {
  return content
    .replace(/{{customerName}}/g, vars.customerName ?? survey.customerName ?? '')
    .replace(/{{garageName}}/g,   vars.garageName   ?? survey.garageName   ?? '')
    .replace(/{{claimNo}}/g,      vars.claimNo      ?? survey.claimNo      ?? survey.id)
    .replace(/{{vehicleNo}}/g,    vars.vehicleNo     ?? survey.vehicle      ?? '')
    .replace(/{{stageName}}/g,    vars.stageName     ?? '');
}

/**
 * Returns a new Survey object with the auto-event injected into relevant threads.
 * Does NOT mutate the input — returns a new object for React state.
 */
export function injectAutoEvent(
  survey: Survey,
  _kind: AutoEventKind,
  opts: AutoEventOptions
): Survey {
  // Hydrate threads if not yet present
  const threads: CommThread[] = survey.threads && survey.threads.length > 0
    ? survey.threads
    : buildSeededThreads(survey);

  const now = new Date().toISOString();
  const eventId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  // The template to dispatch (if any)
  const tpl = opts.templateId
    ? defaultCommTemplates.find(t => t.id === opts.templateId)
    : defaultCommTemplates.find(t => t.triggerEvent && opts.label.toLowerCase().includes(t.triggerEvent.split('.').pop() ?? ''));

  const updatedThreads = threads.map(thread => {
    const isTarget = !opts.targetRoles || opts.targetRoles.includes(thread.party.role);
    if (!isTarget) return thread;

    const newMessages: CommMessage[] = [...thread.messages];

    // 1. Always inject the auto-event pill
    newMessages.push({
      id: `${eventId}:pill:${thread.party.role}`,
      channel: 'internal',
      sender: 'system',
      content: opts.label,
      timestamp: now,
      isAutoEvent: true,
      eventLabel: opts.label,
    });

    // 2. If a template matches AND this thread's role is in the template's targetRoles,
    //    also inject the outbound message that would be sent to the party
    if (tpl && thread.party.role !== 'internal' && tpl.targetRoles.includes(thread.party.role)) {
      const filledContent = fillTemplate(tpl.content, survey, opts.vars ?? {});
      // Fire on each channel the template supports (for this party)
      tpl.channels.forEach((channel: CommChannel, ci: number) => {
        newMessages.push({
          id: `${eventId}:tpl:${thread.party.role}:${ci}`,
          channel,
          sender: 'handler',
          content: filledContent,
          timestamp: new Date(new Date(now).getTime() + ci * 100).toISOString(),
          status: 'sent',
          templateId: tpl.id,
          isAutoEvent: false, // it's a real outbound message
        });
      });
    }

    return {
      ...thread,
      messages: newMessages,
      lastMessage: newMessages[newMessages.length - 1].content,
      lastActivityAt: now,
    };
  });

  return { ...survey, threads: updatedThreads };
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export function onSurveyCreated(survey: Survey): Survey {
  return injectAutoEvent(survey, 'survey.created', {
    label: `Survey created — parties notified`,
    targetRoles: ['insured', 'garage', 'insurer', 'internal'],
    templateId: 'tpl-survey-created-insured',
  });
}

export function onStageChanged(survey: Survey, newStage: string): Survey {
  return injectAutoEvent(survey, 'survey.stage.changed', {
    label: `Stage changed to: ${newStage}`,
    targetRoles: ['internal'],
    vars: { stageName: newStage },
  });
}

export function onDocumentRequested(survey: Survey, docName: string): Survey {
  return injectAutoEvent(survey, 'document.requested', {
    label: `Document requested: ${docName}`,
    targetRoles: ['insured', 'internal'],
  });
}

export function onDocumentApproved(survey: Survey, docName: string): Survey {
  return injectAutoEvent(survey, 'document.approved', {
    label: `Document approved: ${docName}`,
    targetRoles: ['insured', 'internal'],
    templateId: 'tpl-doc-approved',
  });
}

export function onAiInspectionCompleted(survey: Survey, confidence: number): Survey {
  return injectAutoEvent(survey, 'ai.inspection.completed', {
    label: `AI inspection completed — Confidence: ${confidence}%`,
    targetRoles: ['internal'],
  });
}

export function onSurveyReportSubmitted(survey: Survey): Survey {
  return injectAutoEvent(survey, 'survey.report.submitted', {
    label: 'Survey report submitted to insurer',
    targetRoles: ['insurer', 'internal'],
    templateId: 'tpl-share-report',
  });
}

export function onSettlementApproved(survey: Survey): Survey {
  return injectAutoEvent(survey, 'settlement.approved', {
    label: 'Claim approved for settlement by insurer',
    targetRoles: ['insured', 'internal'],
    templateId: 'tpl-stage-settlement',
  });
}
