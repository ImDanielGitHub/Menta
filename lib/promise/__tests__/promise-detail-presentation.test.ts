import {
  formatPromiseFrequency,
  formatPromiseReminderTime,
  isPromiseTermComplete,
  resolveApprovedDayCount,
  resolvePromiseDetailBranch,
  shouldShowSoloActivePromise,
  type SoloActivePromiseGate,
} from '@/lib/promise/promise-detail-presentation';

const dueSolo: SoloActivePromiseGate = {
  allowSelfReview: true,
  groupId: null,
  isUserParticipant: true,
  challengeStatus: 'active',
  isExpired: false,
  isDetailLoading: false,
  submissionStatusUnavailable: false,
  canSubmit: true,
  shouldShowPending: false,
  shouldShowApproved: false,
  shouldShowRejected: false,
};

describe('Promise detail presentation authority', () => {
  it('shows the active sheet only for a confirmed due solo participant', () => {
    expect(shouldShowSoloActivePromise(dueSolo)).toBe(true);
  });

  it.each([
    ['group-linked', { groupId: 'group-one' }],
    ['not self reviewed', { allowSelfReview: false }],
    ['not participating', { isUserParticipant: false }],
    ['not active', { challengeStatus: 'completed' }],
    ['expired', { isExpired: true }],
    ['still loading', { isDetailLoading: true }],
    ['status unavailable', { submissionStatusUnavailable: true }],
    ['cannot submit', { canSubmit: false }],
    ['pending', { shouldShowPending: true }],
    ['approved', { shouldShowApproved: true }],
    ['rejected', { shouldShowRejected: true }],
  ] as const)('falls back for %s state', (_label, change) => {
    expect(
      shouldShowSoloActivePromise({
        ...dueSolo,
        ...change,
      })
    ).toBe(false);
  });

  it('preserves a server-projected zero approved days', () => {
    expect(resolveApprovedDayCount(0, 12)).toBe(0);
    expect(resolveApprovedDayCount(null, 12)).toBe(12);
  });

  it('uses server completion and the terminal challenge state', () => {
    expect(
      isPromiseTermComplete({
        isExpired: false,
        serverCompleted: true,
        challengeStatus: 'active',
      })
    ).toBe(true);
    expect(
      isPromiseTermComplete({
        isExpired: false,
        serverCompleted: false,
        challengeStatus: 'completed',
      })
    ).toBe(true);
  });

  it('translates stored frequency values into ordinary copy', () => {
    expect(formatPromiseFrequency('daily')).toBe('Every day');
    expect(formatPromiseFrequency('weekly')).toBe('Once a week');
    expect(formatPromiseFrequency('three_times_weekly')).toBe(
      'Three times weekly'
    );
  });

  it('formats the saved reminder as a local wall-clock time', () => {
    expect(formatPromiseReminderTime('20:00:00', 'en-NZ', 'Not set')).toBe(
      '8:00 pm'
    );
    expect(formatPromiseReminderTime('07:30', 'en-NZ', 'Not set')).toBe(
      '7:30 am'
    );
  });

  it('falls back instead of exposing an invalid stored reminder', () => {
    expect(formatPromiseReminderTime(null, 'en-NZ', 'Not set')).toBe('Not set');
    expect(formatPromiseReminderTime('25:70', 'en-NZ', 'Not set')).toBe(
      'Not set'
    );
  });

  it('keeps explicit routes ahead of pending, completion and active states', () => {
    expect(
      resolvePromiseDetailBranch({
        requestedView: 'history',
        hasSelectedProof: false,
        showWaiting: true,
        showComplete: true,
        showActive: true,
      })
    ).toBe('history');
    expect(
      resolvePromiseDetailBranch({
        requestedView: 'proof',
        hasSelectedProof: false,
        showWaiting: true,
        showComplete: true,
        showActive: true,
      })
    ).toBe('proof-unavailable');
    expect(
      resolvePromiseDetailBranch({
        requestedView: 'summary',
        hasSelectedProof: false,
        showWaiting: true,
        showComplete: true,
        showActive: true,
      })
    ).toBe('waiting');
    expect(
      resolvePromiseDetailBranch({
        requestedView: 'summary',
        hasSelectedProof: false,
        showWaiting: false,
        showComplete: true,
        showActive: true,
      })
    ).toBe('complete');
  });

  it.each([
    ['queued', { showQueued: true }],
    ['correction', { showCorrection: true }],
    ['approved', { showApproved: true }],
    ['recovery', { showRecovery: true }],
    ['unknown', { showUnknown: true }],
  ] as const)('selects the truthful %s solo detail branch', (branch, state) => {
    expect(
      resolvePromiseDetailBranch({
        requestedView: 'summary',
        hasSelectedProof: false,
        showWaiting: false,
        showComplete: false,
        showActive: false,
        ...state,
      })
    ).toBe(branch);
  });
});
