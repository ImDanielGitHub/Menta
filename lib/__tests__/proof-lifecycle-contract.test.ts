import {
  addCivilDays,
  buildLoopDayContext,
  formatLocalDay,
  isAcceptedReceiptFresh,
  isSameLocalDay,
  mustPreserveLocalProofMedia,
  proofLifecycleFactLabel,
  selectProofLifecycleState,
  DEFAULT_ACCEPTED_RECEIPT_FRESH_MS,
} from '@/lib/loop';
import type { LocalProofOverlayFact, ProofLifecycleState } from '@/lib/loop';

const LOCAL_DAY = '2026-08-02';
const TIMEZONE = 'Pacific/Auckland';

const localOverlay = (
  overrides: Partial<LocalProofOverlayFact> &
    Pick<LocalProofOverlayFact, 'status'>
): LocalProofOverlayFact => ({
  clientEventId: 'client-evt-1',
  challengeId: 'ch-1',
  localDay: LOCAL_DAY,
  updatedAtIso: '2026-08-02T09:30:00.000Z',
  localMediaUri: 'file://proof.jpg',
  ...overrides,
});

describe('proof-lifecycle contract', () => {
  it('keeps Auckland civil dates correct across midnight and DST boundaries', () => {
    expect(formatLocalDay('2026-09-26T12:30:00.000Z', 'Pacific/Auckland')).toBe(
      '2026-09-27'
    );
    expect(addCivilDays('2026-09-27', 6)).toBe('2026-10-03');
    expect(addCivilDays('2026-04-05', 29)).toBe('2026-05-04');
  });
  it('formats timezone-aware local day context', () => {
    // 2026-08-02 10:00 UTC is 2026-08-02 22:00 in Auckland (UTC+12)
    const auckland = buildLoopDayContext(
      '2026-08-02T10:00:00.000Z',
      'Pacific/Auckland'
    );
    expect(auckland.localDay).toBe('2026-08-02');
    expect(auckland.timezone).toBe('Pacific/Auckland');

    // Same instant is still 2026-08-02 morning in New York (UTC-4)
    expect(formatLocalDay('2026-08-02T10:00:00.000Z', 'America/New_York')).toBe(
      '2026-08-02'
    );

    // Just before Auckland midnight rolls the calendar day forward.
    expect(formatLocalDay('2026-08-02T11:30:00.000Z', 'Pacific/Auckland')).toBe(
      '2026-08-02'
    );
    expect(formatLocalDay('2026-08-02T12:30:00.000Z', 'Pacific/Auckland')).toBe(
      '2026-08-03'
    );

    expect(
      isSameLocalDay('2026-08-02T09:00:00.000Z', LOCAL_DAY, TIMEZONE)
    ).toBe(true);
  });

  it('keeps accepted receipt freshness on the same local day only', () => {
    expect(
      isAcceptedReceiptFresh({
        receipt: {
          kind: 'accepted',
          challengeId: 'ch-1',
          localDay: LOCAL_DAY,
          confirmedAtIso: '2026-08-02T08:00:00.000Z',
        },
        localDay: LOCAL_DAY,
        timezone: TIMEZONE,
        nowIso: '2026-08-02T10:00:00.000Z',
        freshMs: DEFAULT_ACCEPTED_RECEIPT_FRESH_MS,
      })
    ).toBe(true);

    expect(
      isAcceptedReceiptFresh({
        receipt: {
          kind: 'pending-review',
          challengeId: 'ch-1',
          localDay: LOCAL_DAY,
          confirmedAtIso: '2026-08-02T08:00:00.000Z',
        },
        localDay: LOCAL_DAY,
        timezone: TIMEZONE,
        nowIso: '2026-08-02T10:00:00.000Z',
      })
    ).toBe(false);

    expect(
      isAcceptedReceiptFresh({
        receipt: {
          kind: 'accepted',
          challengeId: 'ch-1',
          localDay: LOCAL_DAY,
          confirmedAtIso: '2026-08-02T01:00:00.000Z',
        },
        localDay: LOCAL_DAY,
        timezone: TIMEZONE,
        nowIso: '2026-08-02T10:00:00.000Z',
        freshMs: 60 * 60 * 1000,
      })
    ).toBe(false);
  });

  it('lets authoritative server proof supersede stale local overlays', () => {
    const localOnlyStates: Array<LocalProofOverlayFact['status']> = [
      'saved-local',
      'uploading',
      'unknown-result',
      'terminal-failure',
    ];

    for (const status of localOnlyStates) {
      const selection = selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: 'approved',
        localOverlay: localOverlay({ status }),
        submitAcknowledged: true,
      });

      expect(selection.isLocalOnly).toBe(false);
      expect(selection.isServerConfirmed).toBe(true);
      expect(selection.state).toBe('accepted');
    }
  });

  it('resolves durable proof lifecycle states with deterministic precedence', () => {
    expect(
      selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: 'none',
        localOverlay: localOverlay({ status: 'uploading' }),
        submitAcknowledged: false,
      }).state
    ).toBe('uploading');

    expect(
      selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: 'none',
        localOverlay: localOverlay({ status: 'saved-local' }),
        submitAcknowledged: false,
      }).state
    ).toBe('saved-local');

    expect(
      selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: 'rejected',
        localOverlay: null,
        submitAcknowledged: true,
      }).state
    ).toBe('correction-requested');

    expect(
      selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: 'pending',
        localOverlay: null,
        submitAcknowledged: true,
      }).state
    ).toBe('pending-review');

    expect(
      selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: 'approved',
        localOverlay: null,
        submitAcknowledged: true,
      }).state
    ).toBe('accepted');

    expect(
      selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: 'none',
        localOverlay: null,
        submitAcknowledged: true,
      }).state
    ).toBe('sent');

    expect(
      selectProofLifecycleState({
        challengeId: 'ch-1',
        localDay: LOCAL_DAY,
        serverProofStatus: null,
        localOverlay: null,
        submitAcknowledged: false,
      }).state
    ).toBe('idle');
  });

  it('preserves local media for unresolved and failed local states', () => {
    const preserve: ProofLifecycleState[] = [
      'saved-local',
      'uploading',
      'unknown-result',
      'terminal-failure',
    ];
    const release: ProofLifecycleState[] = [
      'idle',
      'sent',
      'pending-review',
      'accepted',
      'correction-requested',
    ];

    for (const state of preserve) {
      expect(mustPreserveLocalProofMedia(state)).toBe(true);
    }
    for (const state of release) {
      expect(mustPreserveLocalProofMedia(state)).toBe(false);
    }
  });

  it('names the fact before the feeling for user-facing labels', () => {
    expect(proofLifecycleFactLabel('saved-local')).toBe('Saved on this device');
    expect(proofLifecycleFactLabel('uploading')).toBe('Uploading proof');
    expect(proofLifecycleFactLabel('sent')).toBe('Proof sent');
    expect(proofLifecycleFactLabel('pending-review')).toBe('Pending review');
    expect(proofLifecycleFactLabel('accepted')).toBe('Proof accepted');
    expect(proofLifecycleFactLabel('correction-requested')).toBe(
      'Proof needs a clearer answer'
    );
    expect(proofLifecycleFactLabel('unknown-result')).toBe(
      'We couldn’t confirm the result'
    );
    expect(proofLifecycleFactLabel('terminal-failure')).toBe(
      'Proof wasn’t sent'
    );
  });

  it('ignores local overlays from another local day', () => {
    const selection = selectProofLifecycleState({
      challengeId: 'ch-1',
      localDay: LOCAL_DAY,
      serverProofStatus: 'pending',
      localOverlay: localOverlay({
        status: 'saved-local',
        localDay: '2026-08-01',
      }),
      submitAcknowledged: true,
    });

    expect(selection.state).toBe('pending-review');
    expect(selection.isServerConfirmed).toBe(true);
  });
});
