/**
 * commSeedData.ts
 *
 * Generate rich, realistic seed conversations for a survey.
 * Sender logic:
 *   'handler'     = the logged-in handler (shown on the right, labelled "You")
 *   'participant' = the external party in this thread (shown on the left)
 *   'system'      = automated platform event (shown as centered pill)
 *
 * Times are real ISO timestamps spaced realistically throughout a single day.
 */

import { CommThread, CommMessage, CommChannel, PartyRole, Survey, EmailTicket } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
let _idCounter = 1;
function uid(): string { return `sm-${_idCounter++}-${Math.random().toString(36).slice(2, 6)}`; }

/** Produce an ISO timestamp offset by `minOffset` minutes from a base date */
function ts(base: Date, minOffset: number): string {
  return new Date(base.getTime() + minOffset * 60 * 1000).toISOString();
}

/** Build a single CommMessage */
function msg(
  channel: CommChannel,
  sender: CommMessage['sender'],
  content: string,
  base: Date,
  offsetMin: number,
  extras: Partial<CommMessage> = {}
): CommMessage {
  return {
    id: uid(),
    channel,
    sender,
    content,
    timestamp: ts(base, offsetMin),
    status: sender === 'handler' ? 'read' : undefined,
    ...extras,
  };
}

function autoEvent(label: string, base: Date, offsetMin: number): CommMessage {
  return msg('internal', 'system', label, base, offsetMin, {
    isAutoEvent: true,
    eventLabel: label,
    status: undefined,
  });
}

// ── Thread builders ───────────────────────────────────────────────────────────
function insuredThread(survey: Survey, base: Date): CommThread {
  const name = survey.customerName;
  const mobile = survey.customerPhone || '+91 98765 43210';
  const surveyId = survey.id;
  const claimNo = survey.claimNo || surveyId;

  const messages: CommMessage[] = [
    autoEvent(`Survey created for ${name} — claim ${claimNo}`, base, 0),

    msg('whatsapp', 'handler',
      `Dear ${name}, your motor claim (${claimNo}) has been registered successfully. Our surveyor will reach out to coordinate the vehicle inspection. Please keep your vehicle, RC, and insurance documents ready.`,
      base, 2, { status: 'read', templateId: 'tpl-survey-created-insured' }),

    msg('sms', 'handler',
      `ClaimFlow: Your claim ${claimNo} is registered. Surveyor will contact you soon. -Team`,
      base, 2, { status: 'delivered' }),

    msg('whatsapp', 'participant',
      `Thank you. When will the surveyor visit?`,
      base, 18),

    msg('whatsapp', 'handler',
      `The surveyor is expected to visit within 24-48 hours. We'll confirm the exact time soon.`,
      base, 22, { status: 'read' }),

    msg('whatsapp', 'participant',
      `Okay. Should I bring the vehicle to the garage or will they come home?`,
      base, 35),

    msg('whatsapp', 'handler',
      `The vehicle needs to be at ${survey.garageName} for the inspection. Let us know once it's dropped off.`,
      base, 38, { status: 'read' }),

    msg('whatsapp', 'participant',
      `It's already at the garage. Here's the RC photo.`,
      base, 95,
      { attachments: [{ name: 'RC_Original.jpg', type: 'image/jpeg', size: '1.2 MB' }] }),

    autoEvent('RC document received from insured', base, 96),

    msg('whatsapp', 'handler',
      `Received the RC, thank you. Could you also share a clear photo of the front and rear of the vehicle showing the damage?`,
      base, 100, { status: 'read' }),

    msg('whatsapp', 'participant',
      `Sure, sending now.`,
      base, 108),

    msg('whatsapp', 'participant',
      `Here are the photos.`,
      base, 109,
      { attachments: [
        { name: 'damage_front.jpg', type: 'image/jpeg', size: '2.4 MB' },
        { name: 'damage_rear.jpg',  type: 'image/jpeg', size: '2.1 MB' },
        { name: 'damage_left.jpg',  type: 'image/jpeg', size: '1.9 MB' },
      ]}),

    autoEvent('Damage photos received from insured', base, 110),

    msg('whatsapp', 'handler',
      `All photos received. Our AI inspection is running now. We'll update you shortly.`,
      base, 112, { status: 'delivered' }),

    autoEvent('AI inspection completed — Confidence score 94%', base, 125),

    msg('whatsapp', 'handler',
      `Great news — the AI inspection is complete. We have verified the damage details. The garage estimate is under review. We'll notify you once the settlement figures are ready.`,
      base, 128, { status: 'read' }),

    msg('whatsapp', 'participant',
      `How long does that usually take?`,
      base, 145),

    msg('whatsapp', 'handler',
      `Typically 2-3 business days once the estimate is approved. We'll keep you posted.`,
      base, 148, { status: 'read' }),

    msg('whatsapp', 'participant',
      `Okay, thank you for the update.`,
      base, 150),

    autoEvent(`Survey moved to Settlement Stage`, base, 300),

    msg('sms', 'handler',
      `ClaimFlow: Your claim ${claimNo} has moved to Settlement stage. Payment will be processed within 3-5 business days. -Team`,
      base, 302, { status: 'delivered', templateId: 'tpl-stage-settlement' }),

    msg('whatsapp', 'handler',
      `Dear ${name}, your claim has been approved for settlement. The payment of the approved amount will be processed to your registered bank account within 3-5 business days.`,
      base, 303, { status: 'read', templateId: 'tpl-stage-settlement' }),

    msg('whatsapp', 'participant',
      `Thank you so much! Really appreciate the quick turnaround.`,
      base, 320),

    msg('whatsapp', 'handler',
      `Happy to help! Do reach out if you have any questions.`,
      base, 323, { status: 'read' }),
  ];

  return {
    id: `${surveyId}:insured`,
    surveyId,
    party: { role: 'insured', name, mobile },
    messages,
    unreadCount: 1,
    lastMessage: messages[messages.length - 1].content,
    lastActivityAt: messages[messages.length - 1].timestamp,
    threadStatus: 'active',
  };
}

function garageThread(survey: Survey, base: Date): CommThread {
  const garageName = survey.garageName;
  const garageContact = survey.garageContact || '+91 98001 12345';
  const surveyId = survey.id;

  const messages: CommMessage[] = [
    autoEvent(`Survey assigned — ${survey.vehicle} at ${garageName}`, base, 1),
    msg('whatsapp', 'handler', `Hi ${garageName} Team, vehicle ${survey.vehicle} has been assigned. Please coordinate the estimate.`, base, 3, { status: 'read' }),
    msg('whatsapp', 'participant', `Repair work started. Expected to complete in 3-4 days.`, base, 2880),
    msg('whatsapp', 'handler', `Noted. Please share photos of the progress and the final repair work once complete.`, base, 2885, { status: 'read' }),
    msg('whatsapp', 'participant', `Repair complete. Vehicle is ready for final inspection.`, base, 4320,
      { attachments: [
        { name: 'Repair_Complete_1.jpg', type: 'image/jpeg', size: '1.8 MB' },
        { name: 'Repair_Complete_2.jpg', type: 'image/jpeg', size: '2.1 MB' },
      ]}),
    autoEvent('Final repair photos received from garage', base, 4321),
  ];

  return {
    id: `${surveyId}:garage`,
    surveyId,
    party: { role: 'garage', name: garageName, mobile: garageContact, email: `ops@${garageName.toLowerCase().replace(/\s+/g, '')}.in` },
    messages,
    unreadCount: 0,
    lastMessage: messages[messages.length - 1].content,
    lastActivityAt: messages[messages.length - 1].timestamp,
    threadStatus: 'active',
  };
}

function surveyorThread(survey: Survey, base: Date): CommThread {
  const surveyorName = survey.surveyor || 'Surveyor';
  const surveyorPhone = survey.surveyorPhone || '+91 90000 12345';
  const surveyId = survey.id;

  const messages: CommMessage[] = [
    autoEvent(`Survey assigned to ${surveyorName}`, base, 5),
    msg('whatsapp', 'handler', `Hi ${surveyorName}, this survey (${surveyId}) has been assigned to you. Vehicle is at ${survey.garageName}. Please coordinate inspection at the earliest and update the survey report.`, base, 6, { status: 'read' }),
    msg('whatsapp', 'participant', `Acknowledged. Will visit the garage today afternoon.`, base, 30),
    msg('whatsapp', 'participant', `Inspection done. Significant damage to front bumper, left fender, and headlight assembly. Photos uploaded.`, base, 210),
    autoEvent('Surveyor inspection completed — field photos uploaded', base, 212),
    msg('whatsapp', 'handler', `Good work. Please finalize the assessment report and upload it by EOD.`, base, 215, { status: 'read' }),
    msg('whatsapp', 'participant', `Report is being prepared. Will share by 5 PM.`, base, 220),
    msg('whatsapp', 'participant', `Odometer reading was 42,800 km. I'll update the report.`, base, 395),
    msg('whatsapp', 'handler', `Thanks. Updated report received. Survey closed from our end.`, base, 450, { status: 'read' }),
  ];

  return {
    id: `${surveyId}:surveyor`,
    surveyId,
    party: { role: 'surveyor', name: surveyorName, mobile: surveyorPhone },
    messages,
    unreadCount: 0,
    lastMessage: messages[messages.length - 1].content,
    lastActivityAt: messages[messages.length - 1].timestamp,
    threadStatus: 'active',
  };
}

// Insurer thread moved to EmailTickets
function internalThread(survey: Survey, base: Date, surveyorName: string): CommThread {
  const surveyId = survey.id;

  const messages: CommMessage[] = [
    autoEvent('Survey created and parties notified', base, 0),
    autoEvent('Handler assigned', base, 1),

    msg('internal', 'handler',
      `Reached out to ${survey.customerName} on WhatsApp. Awaiting vehicle drop-off at ${survey.garageName}.`,
      base, 25),

    msg('internal', 'handler',
      `Vehicle confirmed at garage. RC and policy docs received.`,
      base, 100),

    autoEvent('AI inspection triggered', base, 122),
    autoEvent('AI inspection completed — 94% confidence', base, 125),

    msg('internal', 'handler',
      `AI inspection flagged minor discrepancy on rear damage — looks like pre-existing scrape. Mentioned in assessment notes.`,
      base, 127),

    msg('internal', 'handler',
      `Garage estimate reviewed. Labour charges were inflated by ~15%. Asked them to revise.`,
      base, 1502),

    autoEvent('Revised estimate accepted', base, 1622),

    msg('internal', 'handler',
      `Survey report draft ready. In final review before submitting to ${survey.insurer}.`,
      base, 4390),

    autoEvent('Survey report submitted to insurer', base, 4411),
    autoEvent('Survey moved to Settlement Stage', base, 7202),

    msg('internal', 'handler',
      `Insurer approved. Coordinating bank details with insured for final settlement.`,
      base, 7215),
  ];

  return {
    id: `${surveyId}:internal`,
    surveyId,
    party: { role: 'internal', name: 'Internal Notes' },
    messages,
    unreadCount: 0,
    lastMessage: messages[messages.length - 1].content,
    lastActivityAt: messages[messages.length - 1].timestamp,
    threadStatus: 'active',
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a full set of seeded threads for a given survey.
 * Uses the survey's requestDate as the base timestamp for all messages.
 */
export function buildSeededThreads(survey: Survey): CommThread[] {
  // Use requestDate as day-zero base, or fall back to a few days ago
  const rawBase = survey.requestDate ? new Date(survey.requestDate) : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  // If invalid, fall back
  const base = isNaN(rawBase.getTime()) ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : rawBase;

  const threads: CommThread[] = [
    insuredThread(survey, base),
    garageThread(survey, base),
    internalThread(survey, base, survey.surveyor || 'Surveyor'),
  ];

  // Include surveyor thread only if surveyor name is set
  if (survey.surveyor && survey.surveyor.trim()) {
    threads.splice(2, 0, surveyorThread(survey, base));
  }

  return threads;
}

export function buildSeededEmailTickets(survey: Survey): EmailTicket[] {
  const rawBase = survey.requestDate ? new Date(survey.requestDate) : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const base = isNaN(rawBase.getTime()) ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : rawBase;
  const claimNo = survey.claimNo || survey.id;
  const garageEmail = `ops@${survey.garageName.toLowerCase().replace(/\s+/g, '')}.in`;
  const insurerEmail = survey.insurerEmail || `claims@${survey.insurer.toLowerCase().replace(/\s+/g, '')}.com`;

  return [
    {
      id: `${survey.id}:et:1`,
      surveyId: survey.id,
      subject: `Repair Estimate Review - ${survey.vehicle}`,
      participants: [
        { role: 'garage', name: survey.garageName, email: garageEmail, type: 'to' }
      ],
      status: 'closed',
      unreadCount: 0,
      updatedAt: ts(base, 4380),
      messages: [
        msg('email', 'handler', `Dear ${survey.garageName} Team,\nA new survey has been assigned for vehicle ${survey.vehicle} (Claim No: ${claimNo}). The vehicle is expected at your workshop for inspection.\nKindly share the detailed repair estimate.\nRegards,\nClaimFlow`, base, 3, { subject: `Repair Estimate Review - ${survey.vehicle}`, attachments: [{ name: 'Assignment.pdf', type: 'application/pdf', size: '320 KB' }] }),
        msg('email', 'participant', `Acknowledged. Vehicle is in our workshop. Estimate attached.`, base, 1440, { senderName: survey.garageName, subject: `Re: Repair Estimate Review - ${survey.vehicle}`, attachments: [{ name: 'Repair_Estimate_v1.xlsx', type: 'application/xlsx', size: '450 KB' }] }),
        msg('email', 'handler', `Received the estimate. We've noticed the labour charges for front bumper replacement are higher than the standard rate. Could you please clarify or revise?`, base, 1500, { subject: `Re: Repair Estimate Review - ${survey.vehicle}` }),
        msg('email', 'participant', `Please find the revised estimate. Labour charges have been adjusted.`, base, 1620, { senderName: survey.garageName, subject: `Re: Repair Estimate Review - ${survey.vehicle}`, attachments: [{ name: 'Repair_Estimate_v2_Final.xlsx', type: 'application/xlsx', size: '460 KB' }] }),
        msg('email', 'handler', `Thank you. The revised estimate is approved. You may proceed.`, base, 1680, { subject: `Re: Repair Estimate Review - ${survey.vehicle}` })
      ]
    },
    {
      id: `${survey.id}:et:2`,
      surveyId: survey.id,
      subject: `Claim Settlement Update - ${claimNo}`,
      participants: [
        { role: 'insurer', name: survey.insurer, email: insurerEmail, type: 'to' }
      ],
      status: 'open',
      unreadCount: 1,
      updatedAt: ts(base, 7200),
      messages: [
        msg('email', 'participant', `Please provide an update on claim ${claimNo}. Our records show this was registered 2 days ago.`, base, 1440, { senderName: survey.insurer, subject: `Claim Settlement Update - ${claimNo}` }),
        msg('email', 'handler', `Dear ${survey.insurer} Claims Team,\nThe survey for claim ${claimNo} is in progress. Vehicle inspection is done.`, base, 1450, { subject: `Re: Claim Settlement Update - ${claimNo}` }),
        msg('email', 'handler', `Dear ${survey.insurer} Claims Team,\nPlease find the completed survey report for claim ${claimNo} attached.\nKindly process the claim at your earliest convenience.`, base, 4410, { subject: `Re: Claim Settlement Update - ${claimNo}`, attachments: [{ name: `Survey_Report.pdf`, type: 'application/pdf', size: '2.4 MB' }] }),
        msg('email', 'participant', `We have reviewed the report. The claim is approved for settlement. Please share the payee bank details.`, base, 7200, { senderName: survey.insurer, subject: `Re: Claim Settlement Update - ${claimNo}` })
      ]
    }
  ];
}
