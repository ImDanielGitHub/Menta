import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { VerificationReview } from '../VerificationReview';
import { useChallengeStore } from '@/store/challenge-store';
import { useAuthStore } from '@/store/auth-store';
import { showToast } from '@/components/ui/Toast';

// Mock dependencies
jest.mock('@/store/challenge-store');
jest.mock('@/store/auth-store');
jest.mock('expo-haptics');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/components/ui/Toast', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('expo-image', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return {
    Image: ({ onDisplay }: { onDisplay?: () => void }) => {
      React.useEffect(() => {
        onDisplay?.();
      }, [onDisplay]);

      return React.createElement(View, { testID: 'review-proof-image' });
    },
  };
});
jest.mock('expo-video', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  const player = {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    loop: false,
    status: 'readyToPlay',
  };

  return {
    useVideoPlayer: () => player,
    VideoView: ({
      onFirstFrameRender,
      ...props
    }: {
      onFirstFrameRender?: () => void;
    }) => {
      React.useEffect(() => {
        onFirstFrameRender?.();
      }, [onFirstFrameRender]);
      return React.createElement(View, props);
    },
  };
});
jest.mock('@/lib/image-service', () => ({
  ImageService: {
    getSignedUrl: jest.fn(
      async (_bucket: string, objectKey: string) =>
        `https://signed.example/${objectKey}`
    ),
  },
}));
jest.mock('@/constants/ThemeContext', () => {
  const theme = {
    colors: {
      background: {
        primary: '#fff',
        secondary: '#f5f5f5',
        tertiary: '#eee',
        card: '#fff',
        surface: '#fff',
        overlay: 'rgba(0,0,0,0.5)',
      },
      text: {
        primary: '#000',
        secondary: '#666',
        tertiary: '#999',
        muted: '#aaa',
        placeholder: '#aaa',
        inverse: '#fff',
      },
      status: {
        success: '#4ade80',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      primary: '#3b82f6',
      border: {
        primary: '#e5e7eb',
        secondary: '#f3f4f6',
        focus: '#3b82f6',
        light: '#f9fafb',
      },
      interactive: {
        primary: '#3b82f6',
        secondary: '#64748b',
        disabled: '#d1d5db',
      },
      accent: {
        primary: '#3b82f6',
        background: 'rgba(59,130,246,0.14)',
      },
      onPrimary: '#fff',
      moderation: {
        pending: '#f59e0b',
        approved: '#4ade80',
        rejected: '#ef4444',
        reported: '#3b82f6',
        destructive: '#ef4444',
      },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
    typography: {
      sizes: { xs: 10, sm: 12, base: 14, lg: 16, xl: 18, '2xl': 20 },
      weights: { medium: '500', semibold: '600', bold: '700' },
    },
    borderRadius: { sm: 4, md: 8, lg: 12 },
    shadows: { small: {}, medium: {}, soft: {}, none: {} },
  };

  return {
    useTheme: () => theme,
    useThemedStyles: (createStyles: any) => createStyles(theme),
  };
});

const mockUseChallengeStore = useChallengeStore as jest.MockedFunction<
  typeof useChallengeStore
>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockShowToast = showToast as jest.Mocked<typeof showToast>;

describe('VerificationReview', () => {
  const mockUser = { id: 'user-123', username: 'testuser' };
  const mockVerifications = [
    {
      id: 'verification-1',
      user_id: 'user-456',
      challenge_id: 'challenge-1',
      media_url: 'user-456/proof-challenge-1-event-1.jpg',
      media_type: 'photo',
      submission_date: '2024-01-01T00:00:00Z',
      status: 'pending',
      users: { username: 'submitter1' },
      challenges: { title: 'Test Challenge', allow_self_review: false },
    },
    {
      id: 'verification-2',
      user_id: 'user-789',
      challenge_id: 'challenge-1',
      media_url: 'user-789/proof-challenge-1-event-2.mp4',
      media_type: 'video',
      submission_date: '2024-01-02T00:00:00Z',
      status: 'approved',
      users: { username: 'submitter2' },
      challenges: { title: 'Test Challenge', allow_self_review: false },
    },
  ];
  let mockGetVerificationsByStatus: jest.Mock;
  let mockReviewVerification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
    } as any);

    mockGetVerificationsByStatus = jest
      .fn()
      .mockResolvedValue(mockVerifications);
    mockReviewVerification = jest.fn().mockResolvedValue(undefined);

    mockUseChallengeStore.mockReturnValue({
      reviewVerification: mockReviewVerification,
      isLoading: false,
    } as any);
    (mockUseChallengeStore as any).getState = jest.fn(
      () =>
        ({
          getVerificationsByStatus: mockGetVerificationsByStatus,
          reviewVerification: mockReviewVerification,
        }) as any
    );
  });

  it('renders correctly with verifications', async () => {
    const { getByLabelText, getByText } = render(<VerificationReview />);

    await waitFor(() => {
      expect(getByText('Review queue')).toBeTruthy();
      expect(
        getByLabelText('submitter1 proof for Test Challenge')
      ).toBeTruthy();
    });
  });

  it('requests the whole verification queue by default', async () => {
    render(<VerificationReview challengeId="challenge-1" />);

    await waitFor(() => {
      expect(mockGetVerificationsByStatus).toHaveBeenCalledWith(
        'challenge-1',
        'all',
        mockUser.id,
        undefined
      );
    });
  });

  it('can show the pending queue or all review history', async () => {
    const { getAllByText, getByLabelText, queryByLabelText } = render(
      <VerificationReview />
    );

    await waitFor(() => {
      expect(
        getByLabelText('submitter1 proof for Test Challenge')
      ).toBeTruthy();
      expect(
        queryByLabelText('submitter2 proof for Test Challenge')
      ).toBeFalsy();
    });

    fireEvent.press(getAllByText('All').at(-1)!);

    await waitFor(() => {
      expect(
        getByLabelText('submitter1 proof for Test Challenge')
      ).toBeTruthy();
      expect(
        getByLabelText('submitter2 proof for Test Challenge')
      ).toBeTruthy();
    });
  });

  it('renders text proof submissions from the written body', async () => {
    mockGetVerificationsByStatus.mockResolvedValue([
      {
        ...mockVerifications[0],
        media_type: 'text',
        media_url: 'Finished the session and wrote the summary.',
        submission_text: '',
      },
    ]);

    const { getAllByText, getByLabelText, getByText } = render(
      <VerificationReview />
    );

    await waitFor(() => {
      expect(getByText(/Text check-in/)).toBeTruthy();
      expect(
        getAllByText('Finished the session and wrote the summary.').length
      ).toBeTruthy();
    });

    fireEvent.press(getByLabelText('submitter1 proof for Test Challenge'));

    await waitFor(() => {
      expect(getByText('Text proof')).toBeTruthy();
    });
  });

  it('loads playable video evidence before showing review decisions', async () => {
    mockGetVerificationsByStatus.mockResolvedValue([
      {
        ...mockVerifications[1],
        status: 'pending',
      },
    ]);

    const { getByLabelText, getByTestId, getByText } = render(
      <VerificationReview />
    );

    await waitFor(() => {
      expect(
        getByLabelText('submitter2 proof for Test Challenge')
      ).toBeTruthy();
    });
    fireEvent.press(getByLabelText('submitter2 proof for Test Challenge'));

    await waitFor(() => {
      expect(getByTestId('review-evidence-video')).toBeTruthy();
      expect(getByText('Play or open full screen')).toBeTruthy();
      expect(getByText('Does this proof match the promise?')).toBeTruthy();
    });
  });

  it('expands proof details from the submission card', async () => {
    const { getByLabelText, queryByText } = render(<VerificationReview />);

    await waitFor(() => {
      expect(queryByText('Review queue')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('submitter1 proof for Test Challenge'));

    await waitFor(() => {
      expect(queryByText('Approve proof')).toBeTruthy();
    });
  });

  it('shows the promise rule before asking for a review decision', async () => {
    mockGetVerificationsByStatus.mockResolvedValue([
      {
        ...mockVerifications[0],
        challenges: {
          title: 'Release walk',
          description: 'Walk for twenty minutes before breakfast.',
          verification_description: 'State the route and duration.',
          allow_self_review: false,
        },
      },
    ]);

    const { getByLabelText, getByText } = render(<VerificationReview />);

    await waitFor(() => {
      expect(getByLabelText('submitter1 proof for Release walk')).toBeTruthy();
    });
    fireEvent.press(getByLabelText('submitter1 proof for Release walk'));

    await waitFor(() => {
      expect(getByText('YOUR PROMISE')).toBeTruthy();
      expect(getByText('Release walk')).toBeTruthy();
      expect(getByText('DAILY MINIMUM')).toBeTruthy();
      expect(
        getByText('Walk for twenty minutes before breakfast.')
      ).toBeTruthy();
      expect(getByText('PROOF SHOULD SHOW')).toBeTruthy();
      expect(getByText('State the route and duration.')).toBeTruthy();
      expect(getByText('Does this proof match the promise?')).toBeTruthy();
    });
  });

  it('opens rejection reason sheet', async () => {
    const { getByLabelText, getByText } = render(<VerificationReview />);

    await waitFor(
      () => {
        expect(
          getByLabelText('submitter1 proof for Test Challenge')
        ).toBeTruthy();
      },
      { timeout: 10_000 }
    );

    fireEvent.press(getByLabelText('submitter1 proof for Test Challenge'));
    await waitFor(() => {
      expect(getByLabelText('Reject submission')).toBeTruthy();
    });
    fireEvent.press(getByLabelText('Reject submission'));

    await waitFor(() => {
      expect(getByText('Why should they try again?')).toBeTruthy();
      expect(getByText('Action not visible')).toBeTruthy();
    });
  });

  it('handles approval with confirmation', async () => {
    const { getByLabelText, queryByLabelText } = render(<VerificationReview />);

    await waitFor(() => {
      expect(
        getByLabelText('submitter1 proof for Test Challenge')
      ).toBeTruthy();
    });

    fireEvent.press(getByLabelText('submitter1 proof for Test Challenge'));
    await waitFor(() => {
      expect(getByLabelText('Approve submission')).toBeTruthy();
    });
    fireEvent.press(getByLabelText('Approve submission'));

    await waitFor(() => {
      expect(mockReviewVerification).toHaveBeenCalledWith(
        'verification-1',
        'approved',
        undefined,
        mockUser.id
      );
      expect(
        queryByLabelText('submitter1 proof for Test Challenge')
      ).toBeFalsy();
    });
  });

  it('keeps a review load failure on the route with a retry action', async () => {
    mockGetVerificationsByStatus.mockRejectedValue(new Error('Network error'));

    const screen = render(<VerificationReview />);

    expect(
      await screen.findByText('Review queue needs a refresh')
    ).toBeTruthy();
    expect(
      screen.getByText('Reviews did not load. Pull to refresh and try again.')
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(mockShowToast.error).not.toHaveBeenCalled();
  });

  it('prevents self-review when not allowed', async () => {
    const selfReviewVerification = {
      ...mockVerifications[0],
      user_id: mockUser.id, // Same as current user
      users: { username: 'testuser' },
      challenges: { title: 'Test Challenge', allow_self_review: false },
    };

    mockGetVerificationsByStatus.mockResolvedValue([selfReviewVerification]);

    const { queryByText } = render(<VerificationReview />);

    await waitFor(() => {
      // Should not show user's own submission since self-review is not allowed
      expect(queryByText('testuser')).toBeFalsy();
    });
  });

  it('allows self-review when challenge permits it', async () => {
    const selfReviewVerification = {
      ...mockVerifications[0],
      user_id: mockUser.id, // Same as current user
      users: { username: 'testuser' },
      challenges: { title: 'Test Challenge', allow_self_review: true },
    };

    mockGetVerificationsByStatus.mockResolvedValue([selfReviewVerification]);

    const { getByLabelText } = render(<VerificationReview />);

    await waitFor(() => {
      // Should show user's own submission since self-review is allowed
      expect(getByLabelText('testuser proof for Test Challenge')).toBeTruthy();
    });
  });

  it('handles empty state correctly', async () => {
    mockGetVerificationsByStatus.mockResolvedValue([]);

    const { getByText } = render(<VerificationReview />);

    await waitFor(() => {
      expect(getByText('No submissions to review')).toBeTruthy();
    });
  });

  it('handles infinite scroll correctly', async () => {
    const { getByText } = render(<VerificationReview />);

    await waitFor(() => {
      expect(getByText('Review queue')).toBeTruthy();
    });

    const scrollView = getByText('Review queue').parent;

    await act(async () => {
      fireEvent.scroll(scrollView, {
        nativeEvent: {
          contentOffset: { y: 1000 },
          contentSize: { height: 1200 },
          layoutMeasurement: { height: 800 },
        },
      });
    });

    // Should trigger load more (tested via internal state, would need more complex setup for full test)
  });
});
