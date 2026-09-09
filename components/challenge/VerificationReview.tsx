import React from 'react';
import { StreamlinedReviewQueue } from '@/components/review/StreamlinedReviewQueue';

interface VerificationReviewProps {
  challengeId?: string;
  onStatusChange?: () => void;
}

export const VerificationReview: React.FC<VerificationReviewProps> = ({
  challengeId,
  onStatusChange,
}) => (
  <StreamlinedReviewQueue
    challengeId={challengeId}
    onStatusChange={onStatusChange}
  />
);

export default VerificationReview;
