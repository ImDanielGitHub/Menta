/**
 * Paper coverage contract for the Events family. This stays outside the
 * central gallery registry so production routes can evolve independently of
 * the debug gallery's navigation shell.
 */
export type EventPaperStateContract = {
  paperId: string;
  title: string;
  route: string;
  sourceOfTruth: string;
  status: 'implemented' | 'contract_only';
};

export const eventPaperStateContracts = [
  {
    paperId: '89T-0',
    title: 'EVT-04 Checked In',
    route: '/events/[eventId]/check-in',
    sourceOfTruth: 'Server attendance receipt',
    status: 'implemented',
  },
  {
    paperId: '89U-0',
    title: 'EVT-05 Add Event Proof',
    route: '/events/[eventId]/proof',
    sourceOfTruth: 'Local image until upload receipt',
    status: 'implemented',
  },
  {
    paperId: '89V-0',
    title: 'EVT-06 Posting Participation',
    route: '/events/[eventId]/proof',
    sourceOfTruth: 'Same client event id and server receipt',
    status: 'implemented',
  },
  {
    paperId: '89W-0',
    title: 'EVT-07 Auto-Verified',
    route: '/events/[eventId]/proof',
    sourceOfTruth: 'Approved post receipt',
    status: 'implemented',
  },
  {
    paperId: '89X-0',
    title: 'EVT-08 Awaiting Event Review',
    route: '/events/[eventId]/proof',
    sourceOfTruth: 'Pending-review post receipt',
    status: 'implemented',
  },
  {
    paperId: '89Y-0',
    title: 'EVT-09 Event Proof Not Sent',
    route: '/events/[eventId]/proof',
    sourceOfTruth: 'Definitive failed receipt only',
    status: 'implemented',
  },
  {
    paperId: '89Z-0',
    title: 'EVT-10 Attendee Album',
    route: '/events/[eventId]/album',
    sourceOfTruth: 'Checked-in, approved-only signed album receipt',
    status: 'implemented',
  },
  {
    paperId: '8A0-0',
    title: 'EVT-11 Organiser Review Queue',
    route: '/events/organiser-review/[occurrenceId]',
    sourceOfTruth: 'Role-scoped organiser review queue',
    status: 'implemented',
  },
  {
    paperId: '8A1-0',
    title: 'EVT-12 Verification Rules',
    route: '/events/organiser-review/[occurrenceId]',
    sourceOfTruth: 'Organiser policy copy; no moderation decision',
    status: 'implemented',
  },
  {
    paperId: '922-0',
    title: 'EVT-13 Scan Event QR',
    route: '/events/[eventId]/check-in',
    sourceOfTruth: 'Server-owned attendance receipt after QR value validation',
    status: 'implemented',
  },
  {
    paperId: 'H1I-0',
    title: 'EVT-13B Camera Permission',
    route: '/events/[eventId]/check-in',
    sourceOfTruth: 'Device camera permission; manual organiser-code fallback',
    status: 'implemented',
  },
  {
    paperId: 'H2L-0',
    title: 'EVT-13C QR Not Accepted',
    route: '/events/[eventId]/check-in',
    sourceOfTruth: 'No attendance receipt created',
    status: 'implemented',
  },
  {
    paperId: 'H3O-0',
    title: 'EVT-13D Check-In Offline',
    route: '/events/[eventId]/check-in',
    sourceOfTruth: 'No attendance receipt created',
    status: 'implemented',
  },
  {
    paperId: '923-0',
    title: 'EVT-14 Create Event',
    route: '/events/create',
    sourceOfTruth: 'Owner-scoped local organiser draft; no publish contract',
    status: 'implemented',
  },
  {
    paperId: 'H4R-0',
    title: 'EVT-14B Event Rules',
    route: '/events/create/rules',
    sourceOfTruth: 'Owner-scoped local organiser draft; no publish contract',
    status: 'implemented',
  },
  {
    paperId: '924-0',
    title: 'EVT-15 Event Recap',
    route: '/events/[eventId]/recap',
    sourceOfTruth: 'Organiser-scoped latest-ended occurrence receipt',
    status: 'implemented',
  },
  {
    paperId: '925-0',
    title: 'EVT-16 Participation Needs Evidence',
    route: '/events/[eventId]/proof',
    sourceOfTruth: 'Confirmed check-in plus rejected post receipt',
    status: 'implemented',
  },
  {
    paperId: '926-0',
    title: 'EVT-17 Event Unavailable',
    route: '/events/[eventId]',
    sourceOfTruth: 'Event summary receipt',
    status: 'implemented',
  },
  {
    paperId: 'F9G-0',
    title: 'EVT-SYS-01 Participation State Machine',
    route: '/events/[eventId]/proof',
    sourceOfTruth: 'Contract reference only',
    status: 'contract_only',
  },
  {
    paperId: 'F9H-0',
    title: 'EVT-SYS-02 Data Privacy Moderation Contract',
    route: '/events/organiser-review/[occurrenceId]',
    sourceOfTruth: 'Contract reference only',
    status: 'contract_only',
  },
] as const satisfies readonly EventPaperStateContract[];

export type EventPaperStateId =
  (typeof eventPaperStateContracts)[number]['paperId'];
export type EventProductPaperStateId = Exclude<
  EventPaperStateId,
  'F9G-0' | 'F9H-0'
>;
export type EventProductPaperStateContract = Extract<
  (typeof eventPaperStateContracts)[number],
  { paperId: EventProductPaperStateId }
>;

export const eventProductPaperStateContracts = eventPaperStateContracts.filter(
  (state): state is EventProductPaperStateContract =>
    state.paperId !== 'F9G-0' && state.paperId !== 'F9H-0'
);

export const eventPaperStateIds = eventPaperStateContracts.map(
  state => state.paperId
);
