import {
  canRetryEventUpload,
  deriveEventParticipationFacts,
  eventProofStageForPostStatus,
} from '@/lib/events/participation-state';

describe('event participation facts', () => {
  it('never upgrades a saved or unknown local upload into a reviewed post', () => {
    expect(
      deriveEventParticipationFacts({
        attendanceState: 'joined',
        checkedInAt: '2026-08-03T01:00:00.000Z',
        postStatus: null,
        localUploadStatus: 'unknown_result',
      })
    ).toEqual(['joined', 'checked_in', 'proof_saved']);
  });

  it('keeps pending review, approval and rejection distinct', () => {
    expect(
      deriveEventParticipationFacts({
        attendanceState: 'joined',
        checkedInAt: null,
        postStatus: 'pending_review',
        localUploadStatus: null,
      })
    ).toEqual(['joined', 'pending_review']);
    expect(
      deriveEventParticipationFacts({
        attendanceState: 'joined',
        checkedInAt: null,
        postStatus: 'approved',
        localUploadStatus: null,
      })
    ).toEqual(['joined', 'approved']);
    expect(
      deriveEventParticipationFacts({
        attendanceState: 'joined',
        checkedInAt: null,
        postStatus: 'rejected',
        localUploadStatus: null,
      })
    ).toEqual(['joined', 'rejected']);
  });

  it('only retries durable, unresolved client states', () => {
    expect(canRetryEventUpload('saved_local')).toBe(true);
    expect(canRetryEventUpload('unknown_result')).toBe(true);
    expect(canRetryEventUpload('failed')).toBe(true);
    expect(canRetryEventUpload('uploading')).toBe(false);
    expect(canRetryEventUpload('pending_review')).toBe(false);
  });

  it('maps authoritative attendee post states to distinct receipt surfaces', () => {
    expect(eventProofStageForPostStatus('approved')).toBe('approved');
    expect(eventProofStageForPostStatus('pending_review')).toBe(
      'pending_review'
    );
    expect(eventProofStageForPostStatus('rejected')).toBe('rejected');
    expect(eventProofStageForPostStatus('upload_pending')).toBe(
      'unexpected_post_status'
    );
    expect(eventProofStageForPostStatus('deleting')).toBe(
      'unexpected_post_status'
    );
  });
});
