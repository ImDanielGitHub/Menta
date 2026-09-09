import type {
  EventAttendanceState,
  EventPostQueueStatus,
  EventPostStatus,
} from '@/types/event';

export type EventParticipationFact =
  | 'joined'
  | 'checked_in'
  | 'proof_saved'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'unavailable';

export type EventProofReceiptStage =
  | 'approved'
  | 'pending_review'
  | 'rejected'
  | 'unexpected_post_status';

export const eventProofStageForPostStatus = (
  status: EventPostStatus
): EventProofReceiptStage => {
  if (status === 'approved') return 'approved';
  if (status === 'pending_review') return 'pending_review';
  if (status === 'rejected') return 'rejected';
  return 'unexpected_post_status';
};

export const deriveEventParticipationFacts = (input: {
  attendanceState: EventAttendanceState | null;
  checkedInAt: string | null;
  postStatus: EventPostStatus | null;
  localUploadStatus: EventPostQueueStatus | null;
}): EventParticipationFact[] => {
  if (input.attendanceState !== 'joined') return ['unavailable'];

  const facts: EventParticipationFact[] = ['joined'];
  if (input.checkedInAt) facts.push('checked_in');

  if (
    input.localUploadStatus === 'saved_local' ||
    input.localUploadStatus === 'uploading' ||
    input.localUploadStatus === 'unknown_result'
  ) {
    facts.push('proof_saved');
  }

  if (input.postStatus === 'pending_review') facts.push('pending_review');
  if (input.postStatus === 'approved') facts.push('approved');
  if (input.postStatus === 'rejected') facts.push('rejected');

  return facts;
};

export const canRetryEventUpload = (status: EventPostQueueStatus): boolean =>
  status === 'saved_local' ||
  status === 'failed' ||
  status === 'unknown_result';
