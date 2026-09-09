import type { MascotState } from '@/components/ui/MentaMascot';

/**
 * Deterministic Paper inputs for the 03 Today family.
 *
 * These are deliberately separate from the live selector. A preview can show
 * every approved layout without pretending that optional server facts (weekly
 * recap, an inactivity interval, or a paused streak) exist for an account.
 */
export type TodayFamilyPaperId =
  | 'HOME-01'
  | 'HOME-03'
  | 'HOME-03A'
  | 'HOME-04'
  | 'HOME-06'
  | 'HOME-07'
  | 'HOME-08'
  | 'HOME-09'
  | 'HOME-10'
  | 'HOME-11'
  | 'HOME-12'
  | 'HOME-13'
  | 'STREAK-01'
  | 'STREAK-02'
  | 'STREAK-03';

export type TodayFamilyTone =
  | 'action'
  | 'warning'
  | 'success'
  | 'danger'
  | 'neutral';

export type TodayFamilyAction = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type TodayFamilyFact = {
  label: string;
  value: string;
};

export type TodayFamilyState = {
  id: TodayFamilyPaperId;
  paperNodeId: string;
  kind: 'today' | 'streak';
  overline: string;
  title: string;
  detail: string;
  tone: TodayFamilyTone;
  mascot: MascotState | null;
  facts: readonly TodayFamilyFact[];
  primaryAction: TodayFamilyAction;
  secondaryAction: TodayFamilyAction;
  /** A state is only live when its required authority is available. */
  authority: 'local-proof' | 'server-snapshot' | 'server-derived';
  largeValue?: string;
  calendar?: readonly string[];
};

const today = (state: Omit<TodayFamilyState, 'kind'>): TodayFamilyState => ({
  ...state,
  kind: 'today',
});

const streak = (state: Omit<TodayFamilyState, 'kind'>): TodayFamilyState => ({
  ...state,
  kind: 'streak',
});

export const TODAY_FAMILY_PAPER_STATES: readonly TodayFamilyState[] = [
  today({
    id: 'HOME-01',
    paperNodeId: '8WN-0',
    overline: 'TODAY · LOADING',
    title: 'Finding your next promise.',
    detail:
      'Menta is checking the latest proof and review state. Nothing is marked complete until the account confirms it.',
    tone: 'warning',
    mascot: null,
    facts: [
      { label: 'Checking the day', value: ' ' },
      { label: 'Deadline and reviewer state will appear here.', value: ' ' },
    ],
    primaryAction: { id: 'wait', label: 'Keep waiting', disabled: true },
    secondaryAction: {
      id: 'last-confirmed',
      label: 'Use last confirmed state',
    },
    authority: 'server-snapshot',
  }),
  today({
    id: 'HOME-03',
    paperNodeId: '8XP-0',
    overline: 'TODAY · OFFLINE',
    title: 'Your promise is still due.',
    detail:
      'The latest server state is unavailable. Menta has not changed the promise, streak, or review result on this phone.',
    tone: 'warning',
    mascot: 'today-review-wait',
    facts: [
      {
        label: 'Connection lost',
        value:
          'You can prepare proof, but sending it will wait for a connection.',
      },
      {
        label: 'Next safe action',
        value: 'Capture proof and keep the original on this phone.',
      },
    ],
    primaryAction: { id: 'prepare-proof', label: 'Prepare proof' },
    secondaryAction: { id: 'retry-connection', label: 'Try connection again' },
    authority: 'server-snapshot',
  }),
  today({
    id: 'HOME-03A',
    paperNodeId: '9FF-0',
    overline: 'TODAY · LAST CONFIRMED',
    title: 'Refreshing Today',
    detail:
      'The last truth stays visible. We are checking for a new review result. Until it returns, this snapshot is the honest version of Today.',
    tone: 'action',
    mascot: 'today-review-wait',
    facts: [
      { label: 'Last confirmed at', value: '7:48 AM' },
      { label: 'LAST KNOWN ACTION', value: 'Walk before dusk' },
      { label: 'Proof due today', value: '2 h 14 m remaining' },
      {
        label: 'Deadline',
        value: 'The deadline does not move while the refresh runs.',
      },
    ],
    primaryAction: { id: 'check-again', label: 'Check again' },
    secondaryAction: {
      id: 'keep-last-view',
      label: 'Keep last confirmed view',
    },
    authority: 'server-snapshot',
  }),
  today({
    id: 'HOME-04',
    paperNodeId: '8N-0',
    overline: 'THURSDAY 30 JULY · SAVED ON THIS PHONE',
    title: 'Your proof is safe here.',
    detail:
      'No signal. Menta will keep the original on this phone until you choose to send it when you are back online.',
    tone: 'warning',
    mascot: 'today-review-wait',
    facts: [],
    primaryAction: { id: 'view-saved-proof', label: 'View saved proof' },
    secondaryAction: { id: 'send-now', label: 'Try sending now' },
    authority: 'local-proof',
  }),
  today({
    id: 'HOME-06',
    paperNodeId: 'AI-0',
    overline: 'CORRECTION REQUESTED',
    title: 'One clearer photo, then you’re done.',
    detail: 'Mia left a note. Your original proof is still saved.',
    tone: 'danger',
    mascot: 'today-correction',
    facts: [],
    primaryAction: { id: 'fix-proof', label: 'Fix proof' },
    secondaryAction: { id: 'see-feedback', label: 'See feedback' },
    authority: 'server-derived',
  }),
  today({
    id: 'HOME-07',
    paperNodeId: '8ZW-0',
    overline: 'TODAY · COULD NOT REFRESH',
    title: 'Your last view is still safe.',
    detail:
      'Menta could not refresh Today. We will not replace a known state with an empty screen.',
    tone: 'warning',
    mascot: null,
    facts: [
      {
        label: 'Refresh did not finish',
        value: 'No new proof, review, or streak result was accepted.',
      },
      {
        label: 'Last confirmed',
        value: 'Yesterday · proof approved · 12 day streak.',
      },
    ],
    primaryAction: { id: 'retry', label: 'Try again' },
    secondaryAction: {
      id: 'open-last-today',
      label: 'Open last confirmed Today',
    },
    authority: 'server-snapshot',
  }),
  today({
    id: 'HOME-08',
    paperNodeId: 'CD-0',
    overline: '1 PROOF TO REVIEW',
    title: 'Mia walked for 20 minutes.',
    detail: 'Check the photo, then approve it or ask for one clear correction.',
    tone: 'action',
    mascot: 'today-review-wait',
    facts: [],
    primaryAction: { id: 'review-proof', label: 'Review proof' },
    secondaryAction: { id: 'see-group', label: 'See group' },
    authority: 'server-derived',
  }),
  today({
    id: 'HOME-09',
    paperNodeId: '9FG-0',
    overline: 'TODAY · GROUP RISK',
    title: 'Group risk',
    detail:
      'One check-in is holding the circle. Night Shift’s shared chain is at risk. The group will see the same plain status — not a hidden penalty.',
    tone: 'warning',
    mascot: 'today-at-risk',
    facts: [
      {
        label: '4 of 5 people are logged',
        value: 'Alex’s proof is due at 8:00 PM.',
      },
      { label: 'You', value: 'Proof saved' },
      { label: 'Alex', value: 'Due in 2 h' },
    ],
    primaryAction: { id: 'open-group', label: 'Open group' },
    secondaryAction: {
      id: 'nudge-alex',
      label: 'Send Alex a nudge',
      disabled: true,
    },
    authority: 'server-derived',
  }),
  today({
    id: 'HOME-10',
    paperNodeId: 'E8-0',
    overline: 'ALL CLEAR',
    title: 'Nothing needs you right now.',
    detail: 'Come back when a promise is due or someone sends proof.',
    tone: 'neutral',
    mascot: 'today-clear',
    facts: [],
    primaryAction: { id: 'make-promise', label: 'Make a promise' },
    secondaryAction: { id: 'browse-groups', label: 'Browse groups' },
    authority: 'server-snapshot',
  }),
  today({
    id: 'HOME-11',
    paperNodeId: '911-0',
    overline: 'TODAY · RETURNING',
    title: 'Ready to start again?',
    detail:
      'It’s been 6 days since your last check-in. Start a new promise, or go back to one you were working on.',
    tone: 'action',
    mascot: 'welcome-back',
    facts: [],
    primaryAction: { id: 'fresh-start', label: 'Start a new promise' },
    secondaryAction: { id: 'view-history', label: 'View my history' },
    authority: 'server-derived',
  }),
  today({
    id: 'HOME-12',
    paperNodeId: '9FH-0',
    overline: 'TODAY · REMINDERS',
    title: 'Turn on reminders',
    detail:
      'A cue. Not a chase. Menta can remind you when today’s proof window is getting close. You choose the time and can change it later.',
    tone: 'action',
    mascot: 'quiet-anchor',
    facts: [
      {
        label: '6:30 PM · proof window',
        value: 'iOS will ask for notification permission next.',
      },
      { label: 'Permission', value: 'Nothing is enabled yet.' },
    ],
    primaryAction: { id: 'notifications', label: 'Continue to notifications' },
    secondaryAction: { id: 'not-now', label: 'Not now' },
    authority: 'server-derived',
  }),
  today({
    id: 'HOME-13',
    paperNodeId: '9FI-0',
    overline: 'TODAY · WEEKLY RECAP',
    title: 'Weekly recap',
    detail:
      'Four promises kept. A clean read of the week — approved work, one carry-forward, no invented momentum.',
    tone: 'success',
    mascot: 'proof-proud',
    facts: [
      { label: 'Week', value: 'M  T  W  F  S' },
      { label: 'Approved proof', value: '4' },
      { label: 'Carried into next week', value: '1' },
    ],
    primaryAction: { id: 'set-week-promise', label: 'Set this week’s promise' },
    secondaryAction: { id: 'full-history', label: 'See full history' },
    authority: 'server-derived',
  }),
  streak({
    id: 'STREAK-01',
    paperNodeId: '9FJ-0',
    overline: 'STREAK · CURRENT',
    title: 'Current streak',
    detail: 'Counted after proof approval, not when a promise is merely made.',
    tone: 'success',
    mascot: null,
    largeValue: '12 days',
    facts: [
      { label: 'CONFIRMED STREAK', value: '12 days' },
      { label: 'LONGEST RUN', value: '18 days' },
      { label: 'Next marker', value: 'Six more approved days to meet it.' },
    ],
    primaryAction: { id: 'streak-history', label: 'View streak history' },
    secondaryAction: { id: 'streak-reminder', label: 'Set a reminder' },
    authority: 'server-derived',
  }),
  streak({
    id: 'STREAK-02',
    paperNodeId: '9FK-0',
    overline: 'PROOF · REMINDER',
    title: 'Proof is still open today',
    detail:
      'Your reminder time is approaching. Proof still counts until midnight, and no outcome has been decided yet.',
    tone: 'warning',
    mascot: 'today-at-risk',
    largeValue: '2 h 14 m',
    facts: [
      { label: 'REMINDER IN', value: '2 h 14 m' },
      {
        label: 'Walk before dusk',
        value: 'Aim to send by 8:00 PM. Proof counts until midnight.',
      },
      {
        label: 'Status',
        value:
          'No review or outcome has changed. Logging proof is the next step.',
      },
    ],
    primaryAction: { id: 'log-proof', label: 'Add today’s proof' },
    secondaryAction: { id: 'change-reminder', label: 'Change reminder' },
    authority: 'server-derived',
  }),
  streak({
    id: 'STREAK-03',
    paperNodeId: '9FL-0',
    overline: 'STREAK · PAUSED',
    title: 'Streak paused',
    detail:
      'No proof counted for Tuesday. Your previous run ended at 12 days, and your history is still here.',
    tone: 'danger',
    mascot: 'welcome-back',
    facts: [
      { label: 'STREAK PAUSED · TUESDAY', value: 'Previous run 12 days' },
      { label: 'New run', value: 'Starts with today' },
      {
        label: 'Return',
        value:
          'A one-day return is enough to begin again. Menta will not erase the earlier run.',
      },
    ],
    primaryAction: { id: 'one-day-return', label: 'Start a one-day return' },
    secondaryAction: { id: 'twelve-day-history', label: 'View 12-day history' },
    authority: 'server-derived',
  }),
] as const;

export const getTodayFamilyPaperState = (
  id: TodayFamilyPaperId
): TodayFamilyState => {
  const state = TODAY_FAMILY_PAPER_STATES.find(item => item.id === id);
  if (!state) throw new Error(`Unknown Today Paper state: ${id}`);
  return state;
};
