import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { QueuedProofRecoveryCard } from '@/components/home/QueuedProofRecoveryCard';
import type { QueuedProofSubmission } from '@/lib/services/proof-submission-service';

const queuedProofs: QueuedProofSubmission[] = [
  {
    id: 'queued-1',
    userId: 'user-1',
    challengeId: 'challenge-1',
    proofValue: 'proof-uri',
    proofType: 'photo',
    clientTimeZone: 'Pacific/Auckland',
    clientEventId: 'event-1',
    createdAt: '2026-06-01T09:15:00.000Z',
    sendRequestedAt: '2026-06-01T09:20:00.000Z',
    attempts: 1,
    lastError: 'Network offline',
  },
  {
    id: 'queued-2',
    userId: 'user-1',
    challengeId: 'challenge-2',
    proofValue: 'I did it',
    proofType: 'text',
    clientTimeZone: 'Pacific/Auckland',
    clientEventId: 'event-2',
    createdAt: 'not-a-date',
    sendRequestedAt: 'not-a-date',
    attempts: 0,
  },
  {
    id: 'queued-3',
    userId: 'user-1',
    challengeId: 'challenge-3',
    proofValue: 'video-uri',
    proofType: 'video',
    clientTimeZone: 'Pacific/Auckland',
    clientEventId: 'event-3',
    createdAt: '2026-06-01T10:30:00.000Z',
    sendRequestedAt: '2026-06-01T10:35:00.000Z',
    attempts: 0,
  },
];

const renderCard = (
  props?: Partial<React.ComponentProps<typeof QueuedProofRecoveryCard>>
) =>
  render(
    <ThemeProvider>
      <QueuedProofRecoveryCard
        queuedProofs={queuedProofs}
        getTitle={queuedProof => `Challenge ${queuedProof.challengeId}`}
        onRetry={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );

describe('QueuedProofRecoveryCard', () => {
  it('keeps offline proof details and retry visible', () => {
    const onRetry = jest.fn();

    renderCard({ onRetry });

    expect(screen.getByTestId('queued-proof-recovery-card')).toBeTruthy();
    expect(screen.getByText('Proof waiting to send')).toBeTruthy();
    expect(screen.getByText('Challenge challenge-1')).toBeTruthy();
    expect(screen.getByText(/Photo proof/)).toBeTruthy();
    expect(screen.getAllByText(/Send requested/).length).toBeGreaterThan(0);
    expect(screen.getByText('Last try did not finish.')).toBeTruthy();
    expect(screen.getByText('Challenge challenge-2')).toBeTruthy();
    expect(screen.getByText(/Text proof · Waiting to send/)).toBeTruthy();
    expect(
      screen.getByText(
        'It is saved on this phone but has not reached Menta yet. Try again when you are online.'
      )
    ).toBeTruthy();
    expect(screen.getByText('+1 more waiting to send')).toBeTruthy();

    fireEvent.press(screen.getByText('Try sending again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows processing and loading states without dropping the recovery card', () => {
    const onRetry = jest.fn();

    renderCard({ onRetry, processing: true, loading: true });

    expect(screen.getByText('Sending again…')).toBeTruthy();
    expect(screen.getByText('Checking saved proof…')).toBeTruthy();

    fireEvent.press(screen.getByText('Sending again…'));

    expect(onRetry).not.toHaveBeenCalled();
  });
});
