import React from 'react';
import {
  Keyboard,
  Pressable,
  Share,
  Text,
  type TextInputProps,
  View,
} from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};

let mockRouteParams: Record<string, string> = {
  challengeId: 'challenge-123',
  verificationType: 'text',
};

const mockSubmitChallengeProof = jest.fn();
const mockResumeProofSubmission = jest.fn();
const mockEmitConfirmedSuccess = jest.fn();
const mockEmitHaptic = jest.fn();
const mockGetProofDraft = jest.fn();
const mockGetActiveProofDraftForChallenge = jest.fn();
const mockQueuePositiveOutcomeReview = jest.fn().mockResolvedValue(true);
const mockGetProofAdBreakHint = jest.fn();
const mockAttemptProofAdBreak = jest.fn();

type MockTextAreaProps = TextInputProps & {
  containerStyle?: unknown;
  errorText?: string;
  helperText?: string;
  inputStyle?: TextInputProps['style'];
};

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ children }: { children?: React.ReactNode }) => children ?? null,
  },
  useLocalSearchParams: () => mockRouteParams,
  useRouter: () => mockRouter,
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    AppButton: ({ title, onPress }: { title: string; onPress: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
    AppInlineNotice: ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => (
      <View>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    ),
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    AppTopBar: ({ title, onBack }: { title?: string; onBack?: () => void }) => (
      <View>
        <Text>{title}</Text>
        {onBack ? <Pressable testID="top-bar-back" onPress={onBack} /> : null}
      </View>
    ),
    KeyboardDismissWrapper: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
    }) => <Pressable testID={testID}>{children}</Pressable>,
    MentaMascot: () => <View testID="mascot" />,
  };
});

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    CameraIcon: Icon,
    TypeIcon: Icon,
    UploadIcon: Icon,
    VideoIcon: Icon,
  };
});

jest.mock('@/components/ui/AppFields', () => {
  const React = require('react') as typeof import('react');
  const { TextInput: MockTextInput } =
    require('react-native') as typeof import('react-native');

  return {
    AppTextArea: ({
      containerStyle: _containerStyle,
      errorText: _errorText,
      helperText: _helperText,
      inputStyle,
      ...props
    }: MockTextAreaProps) =>
      React.createElement(MockTextInput, {
        ...props,
        multiline: true,
        style: inputStyle,
      }),
  };
});

jest.mock('@/components/proof', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    HoldToSendButton: ({
      onComplete,
      testID,
    }: {
      onComplete: () => void;
      testID: string;
    }) => (
      <Pressable testID={`${testID}-tap-alternative`} onPress={onComplete} />
    ),
    ProofReceiptPanel: ({
      status,
      detailOverride,
      primaryActionLabel,
      onPrimaryAction,
      secondaryActionLabel,
      onSecondaryAction,
      shareActionLabel,
      onShareAction,
    }: {
      status: string;
      detailOverride?: string;
      primaryActionLabel?: string;
      onPrimaryAction?: () => void;
      secondaryActionLabel?: string;
      onSecondaryAction?: () => void;
      shareActionLabel?: string;
      onShareAction?: () => void;
    }) => (
      <View>
        <Text>{status}</Text>
        {detailOverride ? <Text>{detailOverride}</Text> : null}
        {primaryActionLabel && onPrimaryAction ? (
          <Pressable onPress={onPrimaryAction}>
            <Text>{primaryActionLabel}</Text>
          </Pressable>
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <Pressable onPress={onSecondaryAction}>
            <Text>{secondaryActionLabel}</Text>
          </Pressable>
        ) : null}
        {shareActionLabel && onShareAction ? (
          <Pressable onPress={onShareAction}>
            <Text>{shareActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    ),
  };
});

jest.mock('@/components/CameraVerification', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraVerification: () => <View testID="camera-verification" />,
  };
});

jest.mock('@/components/challenge/MilestoneModal', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    MilestoneModal: () => <View testID="milestone-modal" />,
  };
});

jest.mock('@/constants/ThemeContext', () => {
  const theme = {
    colors: {
      background: {
        primary: '#080909',
        secondary: '#101111',
        tertiary: '#181919',
        card: '#101111',
        surface: '#101111',
        overlay: 'rgba(0,0,0,0.5)',
      },
      text: {
        primary: '#F8F7F1',
        secondary: '#B7B6AF',
        tertiary: '#8F8E89',
        muted: '#B7B6AF',
        placeholder: '#7F7E78',
        inverse: '#080909',
      },
      border: { primary: '#2B2C2C', secondary: '#2B2C2C', light: '#2B2C2C' },
      interactive: {
        primary: '#B88CFF',
        secondary: '#181919',
        disabled: '#555555',
      },
      brand: {
        primary: '#B88CFF',
        secondary: '#B88CFF',
        orange: '#F0C15C',
        purple: '#B88CFF',
        success: '#8DE7B7',
      },
      status: {
        success: '#8DE7B7',
        warning: '#F0C15C',
        error: '#FF6B7A',
        info: '#B88CFF',
      },
    },
    gradients: { background: { screen: ['#080909', '#101111'] } },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    typography: {
      sizes: { xs: 10, sm: 12, base: 14, lg: 16, xl: 18, '2xl': 22, '3xl': 28 },
      weights: { medium: '500', semibold: '600', bold: '700' },
    },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16 },
    shadows: { none: {}, small: {}, medium: {}, soft: {} },
  };
  return {
    useTheme: () => theme,
    useThemedStyles: (createStyles: (value: typeof theme) => unknown) =>
      createStyles(theme),
  };
});

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user-123' } }),
}));

jest.mock('@/lib/proof-types', () => ({
  isProofMediaType: (value: unknown) =>
    value === 'text' || value === 'photo' || value === 'video',
}));

jest.mock('@/lib/proof-drafts', () => ({
  createClientEventId: () => 'client-event-123',
  getProofDraft: (...args: unknown[]) => mockGetProofDraft(...args),
  getActiveProofDraftForChallenge: (...args: unknown[]) =>
    mockGetActiveProofDraftForChallenge(...args),
  isShareableProofReceipt: (status: string | null | undefined) =>
    status === 'pending-review' || status === 'accepted',
}));

jest.mock('@/lib/services/proof-submission-service', () => {
  class ProofSubmissionError extends Error {
    readonly receiptStatus: string;
    readonly clientEventId: string;
    readonly draft: Record<string, unknown> | null;
    readonly code: string | null;

    constructor(
      message: string,
      options: {
        receiptStatus: string;
        clientEventId: string;
        draft?: Record<string, unknown> | null;
        code?: string | null;
      }
    ) {
      super(message);
      this.name = 'ProofSubmissionError';
      this.receiptStatus = options.receiptStatus;
      this.clientEventId = options.clientEventId;
      this.draft = options.draft ?? null;
      this.code = options.code ?? null;
    }
  }

  return {
    ProofSubmissionError,
    submitChallengeProof: (...args: unknown[]) =>
      mockSubmitChallengeProof(...args),
    resumeProofSubmission: (...args: unknown[]) =>
      mockResumeProofSubmission(...args),
  };
});

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: (source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  }),
  emitConfirmedSuccess: (...args: unknown[]) =>
    mockEmitConfirmedSuccess(...args),
  emitHaptic: (...args: unknown[]) => mockEmitHaptic(...args),
}));

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => ({ reduceMotion: false }),
}));

jest.mock('@/lib/store-review', () => ({
  queuePositiveOutcomeReview: (...args: unknown[]) =>
    mockQueuePositiveOutcomeReview(...args),
}));

jest.mock('@/lib/proof-ad-break', () => ({
  getProofAdBreakHint: (...args: unknown[]) => mockGetProofAdBreakHint(...args),
  attemptProofAdBreak: (...args: unknown[]) => mockAttemptProofAdBreak(...args),
}));

import ChallengeVerificationScreen from '../verification';

type MockProofSubmissionErrorConstructor = new (
  message: string,
  options: {
    receiptStatus: string;
    clientEventId: string;
    draft?: Record<string, unknown> | null;
    code?: string | null;
  }
) => Error;

const MockProofSubmissionError = (
  jest.requireMock('@/lib/services/proof-submission-service') as {
    ProofSubmissionError: MockProofSubmissionErrorConstructor;
  }
).ProofSubmissionError;

const proofText =
  'I studied for 45 minutes and finished the problem set review.';
const proofPlaceholder = 'Walked 20 minutes after work at 6:10 PM.';

const acceptedDraft = {
  clientEventId: 'client-event-123',
  userId: 'user-123',
  challengeId: 'challenge-123',
  proofType: 'text' as const,
  proofValue: proofText,
  localMediaUri: null,
  remoteMediaUrl: null,
  clientTimeZone: 'Pacific/Auckland',
  status: 'accepted' as const,
  attemptCount: 1,
  createdAt: '2026-08-03T00:00:00.000Z',
  updatedAt: '2026-08-03T00:02:00.000Z',
  lastError: null,
  submissionId: 'submission-123',
  serverStatus: 'approved',
  allowSelfReview: true,
};

describe('ChallengeVerificationScreen durable proof receipts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {
      challengeId: 'challenge-123',
      verificationType: 'text',
    };
    mockGetProofDraft.mockResolvedValue(null);
    mockGetActiveProofDraftForChallenge.mockResolvedValue(null);
    mockEmitConfirmedSuccess.mockResolvedValue(true);
    mockEmitHaptic.mockResolvedValue(true);
    mockGetProofAdBreakHint.mockResolvedValue(null);
    mockAttemptProofAdBreak.mockResolvedValue({
      attempted: false,
      claimed: false,
      shown: false,
      reason: 'not_due',
    });
  });

  it('dismisses the keyboard on return without submitting or clearing text', () => {
    const dismissSpy = jest
      .spyOn(Keyboard, 'dismiss')
      .mockImplementation(jest.fn());
    const { getByPlaceholderText, getByTestId } = render(
      <ChallengeVerificationScreen />
    );
    const input = getByPlaceholderText(proofPlaceholder);
    expect(getByTestId('text-proof-input')).toBe(input);
    expect(input.props.submitBehavior).toBe('blurAndSubmit');

    fireEvent.changeText(input, proofText);
    fireEvent(input, 'submitEditing');

    expect(dismissSpy).toHaveBeenCalledTimes(1);
    expect(mockSubmitChallengeProof).not.toHaveBeenCalled();
    expect(input.props.value).toBe(proofText);
    dismissSpy.mockRestore();
  });

  it('keeps success feedback behind a confirmed accepted receipt', async () => {
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' });
    mockSubmitChallengeProof.mockResolvedValue({
      success: true,
      clientEventId: 'client-event-123',
      submissionId: 'submission-123',
      receiptStatus: 'accepted',
      inputAccepted: true,
      draft: acceptedDraft,
      milestone: null,
      freezeUsed: false,
      freezesRemaining: 0,
    });
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ChallengeVerificationScreen />
    );

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), proofText);
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    await waitFor(() => expect(getByText('accepted')).toBeTruthy());
    expect(getByText('View promise')).toBeTruthy();
    expect(mockSubmitChallengeProof).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: 'challenge-123',
        clientEventId: 'client-event-123',
        localMediaUri: null,
        proofType: 'text',
        proofValue: proofText,
        userId: 'user-123',
      })
    );
    expect(mockEmitConfirmedSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmed: true,
        receiptId: 'submission-123',
        source: 'proof',
      })
    );
    expect(mockQueuePositiveOutcomeReview).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Share proof receipt'));
    await waitFor(() =>
      expect(shareSpy).toHaveBeenCalledWith({
        title: 'Menta proof receipt',
        message: "My proof for today's promise was approved on Menta.",
      })
    );
    shareSpy.mockRestore();
  });

  it('returns to the promise when route information is incomplete', () => {
    mockRouteParams = { verificationType: 'text' };

    const { getByText } = render(<ChallengeVerificationScreen />);

    expect(
      getByText(
        'Missing promise information. Reopen this from the promise screen.'
      )
    ).toBeTruthy();
    fireEvent.press(getByText('Return to promise'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('announces a due ad break and keeps receipt exit navigation immediate', async () => {
    mockSubmitChallengeProof.mockResolvedValue({
      success: true,
      clientEventId: 'client-event-123',
      submissionId: 'submission-123',
      receiptStatus: 'accepted',
      inputAccepted: true,
      isCorrection: false,
      proofAdBreakHint: { due: true, ordinal: 2 },
      draft: acceptedDraft,
      milestone: null,
      freezeUsed: false,
      freezesRemaining: 0,
    });
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ChallengeVerificationScreen />
    );

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), proofText);
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    await waitFor(() => expect(getByText('Ad break next')).toBeTruthy());
    expect(
      getByText(
        'A short ad may appear after you leave this receipt. It will not change your proof or Momenta balance.'
      )
    ).toBeTruthy();

    fireEvent.press(getByText('Close receipt'));

    expect(mockAttemptProofAdBreak).toHaveBeenCalledWith('submission-123');
    expect(mockGetProofAdBreakHint).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('keeps a malformed optional ad hint out of the proof receipt', async () => {
    mockGetProofAdBreakHint.mockResolvedValue(null);
    mockSubmitChallengeProof.mockResolvedValue({
      success: true,
      clientEventId: 'client-event-123',
      submissionId: 'submission-123',
      receiptStatus: 'accepted',
      inputAccepted: true,
      isCorrection: false,
      draft: acceptedDraft,
      milestone: null,
      freezeUsed: false,
      freezesRemaining: 0,
    });
    const { getByPlaceholderText, getByTestId, getByText, queryByText } =
      render(<ChallengeVerificationScreen />);

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), proofText);
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    await waitFor(() => expect(getByText('accepted')).toBeTruthy());
    await waitFor(() =>
      expect(mockGetProofAdBreakHint).toHaveBeenCalledWith('submission-123')
    );
    expect(queryByText('Ad break next')).toBeNull();

    fireEvent.press(getByText('Close receipt'));

    expect(mockAttemptProofAdBreak).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('does not request cadence metadata for a correction receipt', async () => {
    mockSubmitChallengeProof.mockResolvedValue({
      success: true,
      clientEventId: 'client-event-123',
      submissionId: 'submission-123',
      receiptStatus: 'pending-review',
      inputAccepted: true,
      isCorrection: true,
      draft: { ...acceptedDraft, status: 'pending-review' },
      milestone: null,
      freezeUsed: false,
      freezesRemaining: 0,
    });
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ChallengeVerificationScreen />
    );

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), proofText);
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    await waitFor(() => expect(getByText('pending-review')).toBeTruthy());
    expect(mockGetProofAdBreakHint).not.toHaveBeenCalled();
    expect(mockAttemptProofAdBreak).not.toHaveBeenCalled();
  });

  it('turns an ambiguous send into a manual reconciliation receipt', async () => {
    const unknownDraft = {
      ...acceptedDraft,
      status: 'unknown-result' as const,
      submissionId: null,
      serverStatus: null,
    };
    mockSubmitChallengeProof.mockRejectedValue(
      new MockProofSubmissionError('Connection dropped', {
        receiptStatus: 'unknown-result',
        clientEventId: 'client-event-123',
        draft: unknownDraft,
        code: 'UNKNOWN_RESULT',
      })
    );
    mockResumeProofSubmission.mockResolvedValue({
      success: true,
      clientEventId: 'client-event-123',
      receiptStatus: 'pending-review',
      draft: { ...unknownDraft, status: 'pending-review' },
      milestone: null,
      freezeUsed: false,
      freezesRemaining: 0,
    });
    const { getByPlaceholderText, getByTestId, getByText, queryByText } =
      render(<ChallengeVerificationScreen />);

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), proofText);
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    await waitFor(() => expect(getByText('unknown-result')).toBeTruthy());
    expect(mockEmitConfirmedSuccess).not.toHaveBeenCalled();
    expect(queryByText('Share proof receipt')).toBeNull();

    fireEvent.press(getByText('Check proof status'));
    await waitFor(() =>
      expect(mockResumeProofSubmission).toHaveBeenCalledWith('client-event-123')
    );
    await waitFor(() => expect(getByText('pending-review')).toBeTruthy());
  });

  it('shows an existing daily proof as a final fact instead of offering another retry', async () => {
    mockSubmitChallengeProof.mockRejectedValue(
      new MockProofSubmissionError(
        "Today's proof is already waiting for review.",
        {
          receiptStatus: 'pending-review',
          clientEventId: 'client-event-123',
          draft: null,
          code: 'DAILY_SUBMISSION_EXISTS',
        }
      )
    );
    const { getByPlaceholderText, getByTestId, getByText, queryByText } =
      render(<ChallengeVerificationScreen />);

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), proofText);
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    await waitFor(() =>
      expect(
        getByText("Today's proof is already waiting for review.")
      ).toBeTruthy()
    );
    expect(getByText('View promise')).toBeTruthy();
    expect(queryByText('Try again')).toBeNull();

    fireEvent.press(getByText('View promise'));
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/challenges/challenge-123'
    );
    expect(mockResumeProofSubmission).not.toHaveBeenCalled();
  });

  it('does not surface a milestone without an accepted proof receipt', async () => {
    mockSubmitChallengeProof.mockResolvedValue({
      success: true,
      clientEventId: 'client-event-123',
      submissionId: 'submission-123',
      receiptStatus: 'pending-review',
      draft: { ...acceptedDraft, status: 'pending-review' },
      milestone: { reached: true, milestone: 12, reward: 20 },
      freezeUsed: false,
      freezesRemaining: 0,
    });
    const { getByPlaceholderText, getByTestId, queryByTestId } = render(
      <ChallengeVerificationScreen />
    );

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), proofText);
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    await waitFor(() =>
      expect(mockSubmitChallengeProof).toHaveBeenCalledTimes(1)
    );
    expect(queryByTestId('milestone-modal')).toBeNull();
    expect(mockEmitConfirmedSuccess).not.toHaveBeenCalled();
  });

  it('keeps a generic text check-in behind the specificity gate', () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ChallengeVerificationScreen />
    );

    fireEvent.changeText(getByPlaceholderText(proofPlaceholder), 'Done');
    fireEvent.press(getByTestId('text-proof-hold-to-send-tap-alternative'));

    expect(
      getByText('Add a detail to continue. “Done” alone is not enough.')
    ).toBeTruthy();
    expect(mockSubmitChallengeProof).not.toHaveBeenCalled();
  });
});
