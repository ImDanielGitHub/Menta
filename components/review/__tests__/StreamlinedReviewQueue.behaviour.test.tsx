import React from 'react';
import { Modal } from 'react-native';
import {
  act,
  fireEvent,
  render,
  waitFor,
  type RenderAPI,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StreamlinedReviewQueue } from '@/components/review/StreamlinedReviewQueue';
import { ReviewDecisionError } from '@/lib/review-decision';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
} from '@/lib/motion/haptics';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockGetVerifications = jest.fn();
const mockReviewVerification = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'reviewer-one' } }),
}));

jest.mock('@/store/challenge-store', () => {
  const useChallengeStore = Object.assign(
    jest.fn(() => ({ reviewVerification: mockReviewVerification })),
    {
      getState: () => ({
        getVerificationsByStatus: mockGetVerifications,
      }),
    }
  );

  return { useChallengeStore };
});

jest.mock('@/components/ui/AppShell', () => ({
  AppTopBar: ({
    title,
    subtitle,
    onBack,
    trailing,
  }: {
    title?: string;
    subtitle?: string;
    onBack?: () => void;
    trailing?: React.ReactNode;
  }) => {
    const { Pressable, Text, View } =
      require('react-native') as typeof import('react-native');
    return (
      <View>
        {onBack ? (
          <Pressable accessibilityLabel="Back" onPress={onBack}>
            <Text>Back</Text>
          </Pressable>
        ) : null}
        {title ? <Text>{title}</Text> : null}
        {subtitle ? <Text>{subtitle}</Text> : null}
        {trailing}
      </View>
    );
  },
}));

jest.mock('@/components/ui/AppButton', () => ({
  AppButton: ({
    title,
    onPress,
    disabled,
    loading,
    testID,
    accessibilityLabel,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    testID?: string;
    accessibilityLabel?: string;
  }) => {
    const { Pressable, Text } =
      require('react-native') as typeof import('react-native');
    const unavailable = Boolean(disabled || loading);
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        accessibilityState={{ disabled: unavailable, busy: Boolean(loading) }}
        disabled={unavailable}
        onPress={onPress}
        testID={testID ?? `button-${title}`}
      >
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/components/ui/AppFields', () => ({
  AppTextArea: ({
    accessibilityLabel,
    editable,
    helperText,
    label,
    maxLength,
    onChangeText,
    placeholder,
    testID,
    value,
  }: {
    accessibilityLabel?: string;
    editable?: boolean;
    helperText?: string;
    label: string;
    maxLength?: number;
    onChangeText: (value: string) => void;
    placeholder?: string;
    testID?: string;
    value: string;
  }) => {
    const { Text, TextInput, View } =
      require('react-native') as typeof import('react-native');
    return (
      <View>
        <Text>{label}</Text>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          editable={editable}
          maxLength={maxLength}
          multiline
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID={testID}
          value={value}
        />
        {helperText ? <Text>{helperText}</Text> : null}
      </View>
    );
  },
}));

jest.mock('@/components/ui/AppFeedback', () => ({
  AppInlineNotice: ({
    title,
    description,
    testID,
  }: {
    title: string;
    description: string;
    testID?: string;
  }) => {
    const { Text, View } =
      require('react-native') as typeof import('react-native');
    return (
      <View testID={testID}>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    );
  },
}));

jest.mock('@/components/challenge/PromiseArtefact', () => ({
  PromiseArtefact: ({ promise }: { promise: string }) => {
    const { Text } = require('react-native') as typeof import('react-native');
    return <Text>{promise}</Text>;
  },
}));

jest.mock('@/components/review/ReviewEvidenceImage', () => ({
  EvidenceUnavailablePanel: () => null,
  ReviewEvidenceImage: () => null,
  ReviewEvidenceVideo: () => null,
}));

jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => null,
}));

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    CheckCircleIcon: Icon,
    ChevronRightIcon: Icon,
    AlertTriangleIcon: Icon,
    ImageIcon: Icon,
    ThumbsDownIcon: Icon,
    ThumbsUpIcon: Icon,
    TypeIcon: Icon,
    VideoIcon: Icon,
    XIcon: Icon,
  };
});

jest.mock('@/lib/accessibility', () => ({
  useLargeTypeLineLimit: () => 3,
}));

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    reduceMotion: true,
    duration: () => 0,
    distance: () => 0,
  }),
}));

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: jest.fn((source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  })),
  emitConfirmedOutcome: jest.fn(() => Promise.resolve(true)),
  emitHaptic: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/review-rewards', () => ({
  claimReviewQueueReward: jest.fn(() =>
    Promise.resolve({ granted: false, alreadyGranted: true, amount: 0 })
  ),
}));

jest.mock('@/lib/economy/contract', () => ({
  getReviewRewardHint: () => 'Review fairly.',
}));

jest.mock('@/lib/posthog', () => ({
  trackProductEvent: jest.fn(),
}));

jest.mock('@/lib/navigation/safe-back', () => ({
  backOrReplace: jest.fn(),
}));

const pendingProof = {
  id: 'proof-one',
  user_id: 'alex-one',
  challenge_id: 'promise-one',
  media_url: 'Walked around the lake after work.',
  media_type: 'text' as const,
  submission_date: '2026-08-31T06:00:00.000Z',
  submission_text: 'Walked around the lake after work.',
  status: 'pending' as const,
  users: {
    display_name: 'Alex Morgan',
    username: 'alex',
  },
  challenges: {
    title: 'Walk after work',
    description: 'Walk for at least 20 minutes.',
    verification_description: 'Say when and where you walked.',
    allow_self_review: false,
  },
};

const renderQueue = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <StreamlinedReviewQueue />
    </SafeAreaProvider>
  );

const openFocusedProof = async (view: RenderAPI) => {
  const proof = await view.findByLabelText(
    'Alex Morgan proof for Walk after work'
  );
  fireEvent.press(proof);
  await view.findByText('Does this proof match the promise?');
};

const openCorrectionSheet = async (view: RenderAPI) => {
  await openFocusedProof(view);
  fireEvent.press(view.getByLabelText('Reject submission'));
  await view.findByTestId('review-reject-reason-sheet');
};

describe('StreamlinedReviewQueue review handoffs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVerifications.mockResolvedValue([pendingProof]);
    mockReviewVerification.mockResolvedValue({
      id: pendingProof.id,
      status: 'rejected',
      reviewNotes: null,
      reviewerId: 'reviewer-one',
      reviewedAt: '2026-08-31T06:02:00.000Z',
    });
  });

  it('opens a bounded report category handoff before the generic report form', async () => {
    const view = renderQueue();
    await openFocusedProof(view);

    fireEvent.press(view.getByLabelText('Report this proof'));

    expect(view.getByTestId('review-report-category-sheet')).toBeTruthy();
    expect(view.getByText('Safety or abuse')).toBeTruthy();
    expect(view.getByText('Privacy or personal information')).toBeTruthy();
    expect(view.getByText('Back to proof')).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockReviewVerification).not.toHaveBeenCalled();

    fireEvent.press(view.getByText('Back to proof'));
    expect(view.queryByTestId('review-report-category-sheet')).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalled();

    fireEvent.press(view.getByLabelText('Report this proof'));
    fireEvent.press(view.getByText('Safety or abuse'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/report-issue',
      params: {
        newReport: '1',
        reportKind: 'submission',
        source: 'review_queue_proof_safety',
        challengeId: 'promise-one',
        submissionId: 'proof-one',
        contextLabel: 'Alex Morgan proof for Walk after work',
        title: 'Safety or abuse',
        userId: 'alex-one',
        userLabel: 'Alex Morgan',
      },
    });
    expect(view.queryByText('Report received')).toBeNull();

    fireEvent.press(view.getByLabelText('Report this proof'));
    fireEvent.press(view.getByText('Privacy or personal information'));
    expect(mockRouter.push).toHaveBeenLastCalledWith({
      pathname: '/report-issue',
      params: expect.objectContaining({
        newReport: '1',
        reportKind: 'submission',
        source: 'review_queue_proof_privacy',
        submissionId: 'proof-one',
        title: 'Privacy or personal information',
      }),
    });
  });

  it('requires one reason, reveals an optional bounded note, and sends both through the existing review action', async () => {
    const view = renderQueue();
    await openCorrectionSheet(view);

    const sendBeforeReason = view.getByLabelText('Send feedback');
    expect(sendBeforeReason.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );
    expect(view.queryByTestId('review-correction-note')).toBeNull();

    fireEvent.press(view.getByText("Doesn't match proof rule"));
    expect(view.getByTestId('review-correction-note')).toBeTruthy();
    expect(
      view.getByLabelText('Send feedback').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: false }));

    const longNote = `Show the full route and the time. ${'x'.repeat(260)}`;
    fireEvent.changeText(view.getByTestId('review-correction-note'), longNote);
    expect(view.getByTestId('review-correction-note')).toHaveProp(
      'value',
      longNote.slice(0, 240)
    );

    fireEvent.press(view.getByLabelText('Send feedback'));

    await waitFor(() => {
      expect(mockReviewVerification).toHaveBeenCalledWith(
        'proof-one',
        'rejected',
        `Doesn't match proof rule\n${longNote.slice(0, 240)}`,
        'reviewer-one'
      );
    });
    expect(createConfirmedReceipt).toHaveBeenCalledWith(
      'review-decision',
      'proof-one'
    );
    expect(emitConfirmedOutcome).toHaveBeenCalledWith(
      'correction-requested',
      expect.objectContaining({ receiptId: 'proof-one' })
    );
  });

  it('uses a distinct confirmed outcome for approval', async () => {
    mockReviewVerification.mockResolvedValueOnce({
      id: pendingProof.id,
      status: 'approved',
      reviewNotes: null,
      reviewerId: 'reviewer-one',
      reviewedAt: '2026-08-31T06:02:00.000Z',
    });
    const view = renderQueue();
    await openFocusedProof(view);

    fireEvent.press(view.getByLabelText('Approve submission'));

    await waitFor(() => {
      expect(emitConfirmedOutcome).toHaveBeenCalledWith(
        'review-approved',
        expect.objectContaining({ receiptId: 'proof-one' })
      );
    });
  });

  it('keeps close and backdrop dismissal mutation-free and blocks dismissal and duplicate sends in flight', async () => {
    let resolveReview: ((value: unknown) => void) | undefined;
    mockReviewVerification.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveReview = resolve;
        })
    );
    const view = renderQueue();
    await openCorrectionSheet(view);

    expect(
      view.getByTestId('review-reject-reason-sheet-scrollable-body')
    ).toHaveProp('keyboardShouldPersistTaps', 'handled');

    fireEvent.press(view.getByText('Keep reviewing'));
    expect(view.queryByTestId('review-reject-reason-sheet')).toBeNull();
    expect(mockReviewVerification).not.toHaveBeenCalled();

    fireEvent.press(view.getByLabelText('Reject submission'));
    await view.findByTestId('review-reject-reason-sheet');
    act(() => view.UNSAFE_getByType(Modal).props.onRequestClose());
    await waitFor(() => {
      expect(view.queryByTestId('review-reject-reason-sheet')).toBeNull();
    });
    expect(mockReviewVerification).not.toHaveBeenCalled();

    fireEvent.press(view.getByLabelText('Reject submission'));
    fireEvent.press(view.getByText('Action not visible'));
    fireEvent.changeText(
      view.getByTestId('review-correction-note'),
      'Include the whole activity in frame.'
    );
    const send = view.getByLabelText('Send feedback');
    fireEvent.press(send);
    fireEvent.press(send);

    await waitFor(() =>
      expect(mockReviewVerification).toHaveBeenCalledTimes(1)
    );
    expect(view.getByTestId('review-reject-reason-sheet')).toBeTruthy();
    act(() => view.UNSAFE_getByType(Modal).props.onRequestClose());
    expect(view.getByTestId('review-reject-reason-sheet')).toBeTruthy();
    expect(
      view.getByLabelText('Keep reviewing').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: true }));

    await act(async () => {
      resolveReview?.({
        id: pendingProof.id,
        status: 'rejected',
        reviewNotes: 'Action not visible',
        reviewerId: 'reviewer-one',
        reviewedAt: '2026-08-31T06:02:00.000Z',
      });
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(view.queryByTestId('review-reject-reason-sheet')).toBeNull();
    });
  });

  it('preserves conflict recovery without a second decision', async () => {
    mockReviewVerification.mockRejectedValue(
      new ReviewDecisionError('This proof changed.', {
        code: 'changed_while_reviewing',
        currentStatus: 'approved',
      })
    );
    const view = renderQueue();
    await openCorrectionSheet(view);
    fireEvent.press(view.getByText('Too unclear to review'));
    fireEvent.changeText(
      view.getByTestId('review-correction-note'),
      'Show the full route next time.'
    );
    fireEvent.press(view.getByLabelText('Send feedback'));

    expect(await view.findByTestId('review-changed-state')).toBeTruthy();
    expect(view.getByText('Reload this proof')).toBeTruthy();
    expect(mockReviewVerification).toHaveBeenCalledTimes(1);
  });

  it('requires a status check after an unknown result before another send', async () => {
    mockReviewVerification.mockRejectedValue(
      new ReviewDecisionError('The server reply was incomplete.', {
        code: 'unknown',
      })
    );
    const view = renderQueue();
    await openCorrectionSheet(view);
    fireEvent.press(view.getByText('Action not visible'));
    fireEvent.press(view.getByLabelText('Send feedback'));

    expect(await view.findByTestId('review-result-unknown-state')).toBeTruthy();
    expect(
      view.getByText('Check this proof before sending again')
    ).toBeTruthy();
    expect(view.queryByLabelText('Send feedback')).toBeNull();
    expect(mockReviewVerification).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByLabelText('Check review status'));
    await waitFor(() => expect(mockGetVerifications).toHaveBeenCalledTimes(2));
    expect(mockReviewVerification).toHaveBeenCalledTimes(1);
  });
});
