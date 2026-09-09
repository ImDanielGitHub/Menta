import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import ReportIssueScreen from '@/app/report-issue';
import {
  beginReportSubmission,
  createReportDraft,
  getLatestOpenReportDraft,
  getOpenReportDraftByIdForUser,
  isDefinitiveReportRejection,
  isResponseUnknownError,
  removeReportDraft,
  updateReportDraft,
} from '@/lib/report-drafts';
import type { ReportDraft } from '@/lib/report-drafts';
import * as ImagePicker from 'expo-image-picker';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  replace: jest.fn(),
  setParams: jest.fn(),
};
const mockRouteParams: Record<string, string> = {};
const mockStorageUpload = jest.fn();
const mockStorageRemove = jest.fn();
const mockIssueInsertSingle = jest.fn();
const mockIssueInsertSelect = jest.fn(() => ({
  single: mockIssueInsertSingle,
}));
const mockIssueInsert = jest.fn(() => ({ select: mockIssueInsertSelect }));
const mockFetch = jest.fn();

const mockAuthState: {
  isAuthenticated: boolean;
  user: { id: string } | null;
} = {
  isAuthenticated: true,
  user: { id: 'account-one' },
};

const reportDraft: ReportDraft = {
  id: 'report-draft-one',
  userId: 'account-one',
  contextKey: 'report_issue_screen:general',
  source: 'report_issue_screen',
  reportKind: null,
  challengeId: null,
  groupId: null,
  submissionId: null,
  targetUserId: null,
  targetUserLabel: null,
  contextLabel: null,
  crashReference: null,
  title: 'Private report for account one',
  description: 'This detail must not appear for another account.',
  observedBehavior: '',
  expectedBehavior: '',
  stepsToReproduce: '',
  attachments: [],
  status: 'draft',
  submissionSnapshot: null,
  serverReceiptId: null,
  lastError: null,
  attemptCount: 0,
  createdAt: '2026-08-05T00:00:00.000Z',
  updatedAt: '2026-08-05T00:00:00.000Z',
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockRouteParams,
  useRouter: () => mockRouter,
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/constants/ThemeContext', () => {
  const theme = {
    colors: {
      background: { primary: '#080909' },
      status: { success: '#8DE7B7' },
      text: { inverse: '#080909', tertiary: '#999999' },
    },
    spacing: { sm: 8, md: 12, lg: 16, xl: 24 },
    typography: { sizes: { sm: 14, xs: 12 }, weights: { medium: '500' } },
  };

  return {
    useTheme: () => theme,
    useThemedStyles: (createStyles: (value: typeof theme) => unknown) =>
      createStyles(theme),
  };
});

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthState,
}));

jest.mock('@/lib/network', () => ({
  useNetworkState: () => ({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

jest.mock('@/lib/report-drafts', () => ({
  getLatestOpenReportDraft: jest.fn(),
  getOpenReportDraftByIdForUser: jest.fn(),
  createReportDraft: jest.fn(),
  updateReportDraft: jest.fn(),
  beginReportSubmission: jest.fn(),
  removeReportDraft: jest.fn(),
  getReportDraftCopy: jest.fn(),
  isDefinitiveReportRejection: jest.fn(),
  isResponseUnknownError: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'issues') throw new Error(`Unexpected table: ${table}`);
      return { insert: mockIssueInsert };
    },
    storage: {
      from: (bucket: string) => {
        if (bucket !== 'support-attachments') {
          throw new Error(`Unexpected bucket: ${bucket}`);
        }
        return {
          upload: mockStorageUpload,
          remove: mockStorageRemove,
        };
      },
    },
  },
}));
jest.mock('expo-haptics', () => ({}));
jest.mock('@/components/ui/Toast', () => ({
  showToast: { error: jest.fn(), success: jest.fn(), warning: jest.fn() },
}));
jest.mock('@/components/ui/icons', () => ({
  CheckCircleIcon: () => null,
  SendIcon: () => null,
}));

jest.mock('@/components/ui', () => {
  const { Pressable, Text, TextInput, View } =
    jest.requireActual('react-native');
  return {
    AppScreen: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
    }) => <View testID={testID}>{children}</View>,
    AppTopBar: ({ title, onBack }: { title?: string; onBack?: () => void }) => (
      <View>
        {title ? <Text>{title}</Text> : null}
        {onBack ? <Text onPress={onBack}>Back</Text> : null}
      </View>
    ),
    AppButton: ({
      title,
      onPress,
      disabled,
      testID,
    }: {
      title: string;
      onPress: () => void;
      disabled?: boolean;
      testID?: string;
    }) => (
      <Pressable
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
        testID={testID ?? `button-${title}`}
      >
        <Text>{title}</Text>
      </Pressable>
    ),
    AppDivider: () => <View />,
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
    AppTextField: ({
      accessibilityLabel,
      label,
      onChangeText,
      placeholder,
      testID,
      value,
    }: {
      accessibilityLabel?: string;
      label: string;
      onChangeText: (value: string) => void;
      placeholder?: string;
      testID?: string;
      value: string;
    }) => (
      <View>
        <Text>{`${label}: ${value}`}</Text>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID={testID}
          value={value}
        />
      </View>
    ),
    AppTextArea: ({
      accessibilityLabel,
      label,
      onChangeText,
      placeholder,
      testID,
      value,
    }: {
      accessibilityLabel?: string;
      label: string;
      onChangeText: (value: string) => void;
      placeholder?: string;
      testID?: string;
      value: string;
    }) => (
      <View>
        <Text>{`${label}: ${value}`}</Text>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          multiline
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID={testID}
          value={value}
        />
      </View>
    ),
    SkeletonLoader: () => null,
  };
});

const mockedGetLatestOpenReportDraft = jest.mocked(getLatestOpenReportDraft);
const mockedGetOpenReportDraftByIdForUser = jest.mocked(
  getOpenReportDraftByIdForUser
);
const mockedCreateReportDraft = jest.mocked(createReportDraft);
const mockedBeginReportSubmission = jest.mocked(beginReportSubmission);
const mockedIsDefinitiveReportRejection = jest.mocked(
  isDefinitiveReportRejection
);
const mockedIsResponseUnknownError = jest.mocked(isResponseUnknownError);
const mockedRemoveReportDraft = jest.mocked(removeReportDraft);
const mockedUpdateReportDraft = jest.mocked(updateReportDraft);

describe('ReportIssueScreen account boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockRouteParams).forEach(key => delete mockRouteParams[key]);
    mockRouter.canGoBack.mockReturnValue(false);
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'account-one' };
    mockedGetLatestOpenReportDraft.mockResolvedValue(reportDraft);
    mockedGetOpenReportDraftByIdForUser.mockResolvedValue(reportDraft);
    mockedCreateReportDraft.mockImplementation(async input => ({
      ...reportDraft,
      ...input,
      id: 'route-report-draft',
      status: 'draft',
      submissionSnapshot: null,
      serverReceiptId: null,
      lastError: null,
      attemptCount: 0,
      createdAt: reportDraft.createdAt,
      updatedAt: reportDraft.updatedAt,
    }));
    mockedRemoveReportDraft.mockResolvedValue(undefined);
    mockedUpdateReportDraft.mockResolvedValue(reportDraft);
    mockedBeginReportSubmission.mockResolvedValue(reportDraft);
    mockedIsDefinitiveReportRejection.mockReturnValue(false);
    mockedIsResponseUnknownError.mockReturnValue(false);
    mockStorageUpload.mockResolvedValue({ error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockIssueInsertSingle.mockResolvedValue({
      data: { id: reportDraft.id },
      error: null,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => ({ size: 1024, type: 'image/png' }),
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: mockFetch,
      writable: true,
    });
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: true,
      assets: null,
    });
  });

  it('removes a visible report payload when the active account changes', async () => {
    const view = render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(
        screen.getByText('Short title: Private report for account one')
      ).toBeTruthy();
    });

    mockAuthState.user = { id: 'account-two' };
    view.rerender(<ReportIssueScreen />);

    await waitFor(() => {
      expect(
        screen.getByText('This report belongs to another account')
      ).toBeTruthy();
    });
    expect(
      screen.queryByText('Short title: Private report for account one')
    ).toBeNull();
    expect(
      screen.queryByText('This detail must not appear for another account.')
    ).toBeNull();
  });

  it('does not reopen a private draft after the session is no longer authenticated', async () => {
    const view = render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(
        screen.getByText('Short title: Private report for account one')
      ).toBeTruthy();
    });

    mockAuthState.isAuthenticated = false;
    view.rerender(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('Sign in required')).toBeTruthy();
    });
    expect(
      screen.queryByText('Short title: Private report for account one')
    ).toBeNull();
  });

  it('keeps the report hidden when authentication has no current profile', async () => {
    const view = render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(
        screen.getByText('Short title: Private report for account one')
      ).toBeTruthy();
    });

    mockAuthState.user = null;
    view.rerender(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('Sign in required')).toBeTruthy();
    });
    expect(
      screen.queryByText('Short title: Private report for account one')
    ).toBeNull();
  });

  it('claims a signed-out route for the first account and blocks a later account switch', async () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;
    const view = render(<ReportIssueScreen />);

    expect(screen.getByText('Sign in required')).toBeTruthy();

    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'account-one' };
    view.rerender(<ReportIssueScreen />);

    await waitFor(() => {
      expect(
        screen.getByText('Short title: Private report for account one')
      ).toBeTruthy();
    });

    mockAuthState.user = { id: 'account-two' };
    view.rerender(<ReportIssueScreen />);

    await waitFor(() => {
      expect(
        screen.getByText('This report belongs to another account')
      ).toBeTruthy();
    });
    expect(
      screen.queryByText('Short title: Private report for account one')
    ).toBeNull();
  });

  it('reviews in two steps and preserves every edit when returning', async () => {
    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('What went wrong?')).toBeTruthy();
    });
    expect(screen.queryByTestId('send-report')).toBeNull();
    expect(screen.queryByTestId('report-expected-field')).toBeNull();

    fireEvent.changeText(
      screen.getByTestId('report-title-field'),
      'Camera proof freezes'
    );
    fireEvent.changeText(
      screen.getByTestId('report-description-field'),
      'I tapped Add photo and the camera stayed black.'
    );
    fireEvent.press(screen.getByTestId('review-report'));

    expect(screen.getByText('Last step')).toBeTruthy();
    expect(screen.getByText('Check it, then send')).toBeTruthy();
    expect(screen.getByText('Camera proof freezes')).toBeTruthy();
    expect(
      screen.getByText('I tapped Add photo and the camera stayed black.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Report type: App issue. This comes from where you opened the report.'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('Menta does not add device diagnostics to this report.')
    ).toBeTruthy();
    expect(screen.getByTestId('send-report')).toBeTruthy();
    expect(screen.queryByTestId('report-expected-field')).toBeNull();

    fireEvent.press(screen.getByTestId('report-show-optional-details'));
    fireEvent.changeText(
      screen.getByTestId('report-expected-field'),
      'The camera should open.'
    );
    fireEvent.changeText(
      screen.getByTestId('report-steps-field'),
      'Open proof, then tap Add photo.'
    );
    fireEvent.press(screen.getByText('Back'));

    expect(screen.getByText('What went wrong?')).toBeTruthy();
    expect(screen.queryByTestId('send-report')).toBeNull();
    expect(screen.getByTestId('report-title-field').props.value).toBe(
      'Camera proof freezes'
    );
    expect(screen.getByTestId('report-description-field').props.value).toBe(
      'I tapped Add photo and the camera stayed black.'
    );

    fireEvent.press(screen.getByTestId('review-report'));

    expect(screen.getByTestId('report-expected-field').props.value).toBe(
      'The camera should open.'
    );
    expect(screen.getByTestId('report-steps-field').props.value).toBe(
      'Open proof, then tap Add photo.'
    );
    expect(screen.getByTestId('send-report')).toBeTruthy();
  });

  it('uses the same receipt-backed delivery path for Settings feedback', async () => {
    Object.assign(mockRouteParams, {
      mode: 'feedback',
      newReport: '1',
      source: 'settings_feedback',
    });
    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('Share feedback')).toBeTruthy();
    });
    expect(screen.getByText('What should we know?')).toBeTruthy();
    expect(screen.getByDisplayValue('Menta feedback')).toBeTruthy();
    expect(screen.queryByTestId('report-expected-field')).toBeNull();

    fireEvent.changeText(
      screen.getByTestId('report-description-field'),
      'The weekly view would be easier to understand with clearer day labels.'
    );
    fireEvent.press(screen.getByTestId('review-report'));

    expect(screen.getByText('Feedback')).toBeTruthy();
    expect(screen.getByText('Send feedback')).toBeTruthy();
  });

  it('lets a person attach and remove one support screenshot', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///support-screenshot.png',
          mimeType: 'image/png',
          fileName: 'support-screenshot.png',
          fileSize: 1024,
          width: 1170,
          height: 2532,
        },
      ],
    });
    render(<ReportIssueScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('report-show-screenshot')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('report-show-screenshot'));
    fireEvent.press(screen.getByTestId('report-choose-screenshot'));

    expect(await screen.findByTestId('report-screenshot-preview')).toBeTruthy();
    expect(screen.getByText('Replace screenshot')).toBeTruthy();
    fireEvent.press(screen.getByTestId('report-remove-screenshot'));
    expect(screen.queryByTestId('report-screenshot-preview')).toBeNull();
    expect(screen.getByTestId('report-show-screenshot')).toBeTruthy();
  });

  it('removes an uploaded screenshot after a definitive report rejection', async () => {
    const attachment = {
      name: 'support-screenshot.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      localUri: 'file:///support-screenshot.png',
    };
    const submittingDraft: ReportDraft = {
      ...reportDraft,
      attachments: [attachment],
      status: 'submitting',
      submissionSnapshot: {
        title: reportDraft.title,
        description: reportDraft.description,
        observedBehavior: null,
        expectedBehavior: null,
        stepsToReproduce: null,
        source: reportDraft.source,
        reportKind: null,
        challengeId: null,
        groupId: null,
        submissionId: null,
        targetUserId: null,
        targetUserLabel: null,
        contextLabel: null,
        crashReference: null,
        attachments: [attachment],
        createdAt: '2026-08-16T00:00:00.000Z',
      },
    };
    mockedBeginReportSubmission.mockResolvedValueOnce(submittingDraft);
    mockedIsDefinitiveReportRejection.mockReturnValueOnce(true);
    mockIssueInsertSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'report rejected' },
    });

    render(<ReportIssueScreen />);
    await waitFor(() => {
      expect(screen.getByText('What went wrong?')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('review-report'));
    fireEvent.press(screen.getByTestId('send-report'));

    const expectedPath = 'account-one/report-draft-one/screenshot-1.png';
    await waitFor(() => {
      expect(mockStorageRemove).toHaveBeenCalledWith([expectedPath]);
    });
    expect(mockStorageUpload).toHaveBeenCalledWith(
      expectedPath,
      expect.anything(),
      { contentType: 'image/png', upsert: false }
    );
  });

  it('stops report creation and cleans the exact upload when the account changes', async () => {
    let finishUpload: ((value: { error: null }) => void) | null = null;
    mockStorageUpload.mockReturnValueOnce(
      new Promise(resolve => {
        finishUpload = resolve;
      })
    );
    const attachment = {
      name: 'support-screenshot.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      localUri: 'file:///support-screenshot.png',
    };
    const submittingDraft: ReportDraft = {
      ...reportDraft,
      attachments: [attachment],
      status: 'submitting',
      submissionSnapshot: {
        title: reportDraft.title,
        description: reportDraft.description,
        observedBehavior: null,
        expectedBehavior: null,
        stepsToReproduce: null,
        source: reportDraft.source,
        reportKind: null,
        challengeId: null,
        groupId: null,
        submissionId: null,
        targetUserId: null,
        targetUserLabel: null,
        contextLabel: null,
        crashReference: null,
        attachments: [attachment],
        createdAt: '2026-08-16T00:00:00.000Z',
      },
    };
    mockedBeginReportSubmission.mockResolvedValueOnce(submittingDraft);

    const view = render(<ReportIssueScreen />);
    await waitFor(() => {
      expect(screen.getByText('What went wrong?')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('review-report'));
    fireEvent.press(screen.getByTestId('send-report'));
    await waitFor(() => expect(mockStorageUpload).toHaveBeenCalledTimes(1));

    mockAuthState.user = { id: 'account-two' };
    view.rerender(<ReportIssueScreen />);
    finishUpload?.({ error: null });

    await waitFor(() => {
      expect(mockStorageRemove).toHaveBeenCalledWith([
        'account-one/report-draft-one/screenshot-1.png',
      ]);
    });
    expect(mockIssueInsert).not.toHaveBeenCalled();
  });

  it('keeps block controls hidden until bilateral filters protect every surface', async () => {
    mockRouteParams.reportKind = 'submission';
    mockRouteParams.submissionId = 'proof-one';
    mockRouteParams.challengeId = 'promise-one';
    mockRouteParams.userId = 'member-two';
    mockRouteParams.userLabel = 'Aroha';
    mockRouteParams.title = 'Report this proof';
    mockRouteParams.description = 'This proof breaks the SFW rule.';
    mockedGetLatestOpenReportDraft.mockResolvedValue(null);

    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('What went wrong?')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('review-report'));

    expect(screen.queryByRole('switch', { name: 'Block Aroha' })).toBeNull();
    expect(mockedCreateReportDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: 'member-two',
        targetUserLabel: 'Aroha',
      })
    );
  });

  it('restores content target authority from the selected draft', async () => {
    const contentDraft: ReportDraft = {
      ...reportDraft,
      reportKind: 'submission',
      challengeId: 'promise-one',
      submissionId: 'proof-one',
      targetUserId: 'member-two',
      targetUserLabel: 'Aroha',
    };
    mockRouteParams.draftId = contentDraft.id;
    mockedGetOpenReportDraftByIdForUser.mockResolvedValue(contentDraft);
    mockedUpdateReportDraft.mockImplementation(async (_owner, _id, patch) => ({
      ...contentDraft,
      ...patch,
    }));

    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('What went wrong?')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('review-report'));

    expect(
      screen.getByText(
        'Report type: Proof. This comes from where you opened the report.'
      )
    ).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Block Aroha' })).toBeNull();
  });

  it('keeps saved null target facts when the route still carries content context', async () => {
    const generalDraft: ReportDraft = {
      ...reportDraft,
      reportKind: null,
      challengeId: null,
      groupId: null,
      submissionId: null,
      targetUserId: null,
      targetUserLabel: null,
      contextLabel: null,
    };
    mockRouteParams.draftId = generalDraft.id;
    mockRouteParams.reportKind = 'submission';
    mockRouteParams.submissionId = 'stale-proof';
    mockRouteParams.challengeId = 'stale-promise';
    mockRouteParams.userId = 'stale-member';
    mockRouteParams.userLabel = 'Stale member';
    mockedGetOpenReportDraftByIdForUser.mockResolvedValue(generalDraft);
    mockedUpdateReportDraft.mockImplementation(async (_owner, _id, patch) => ({
      ...generalDraft,
      ...patch,
    }));

    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('What went wrong?')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('review-report'));

    expect(
      screen.getByText(
        'Report type: App issue. This comes from where you opened the report.'
      )
    ).toBeTruthy();
    expect(mockedCreateReportDraft).not.toHaveBeenCalled();
  });

  it('folds observed behaviour from a restored draft into the visible report', async () => {
    const observedDraft: ReportDraft = {
      ...reportDraft,
      description: 'The proof camera opened from Today.',
      observedBehavior: 'The preview stayed black after the camera opened.',
    };
    mockedGetLatestOpenReportDraft.mockResolvedValue(observedDraft);
    mockedUpdateReportDraft.mockImplementation(async (_owner, _id, patch) => ({
      ...observedDraft,
      ...patch,
    }));

    render(<ReportIssueScreen />);

    const visibleDescription =
      'The proof camera opened from Today.\n\nObserved behaviour: The preview stayed black after the camera opened.';
    await waitFor(() => {
      expect(screen.getByTestId('report-description-field').props.value).toBe(
        visibleDescription
      );
    });

    fireEvent.press(screen.getByTestId('review-report'));
    expect(screen.getByText(visibleDescription)).toBeTruthy();
    await waitFor(() => {
      expect(mockedUpdateReportDraft).toHaveBeenCalledWith(
        'account-one',
        observedDraft.id,
        expect.objectContaining({
          description: visibleDescription,
          observedBehavior: '',
        })
      );
    });
  });

  it('puts route-provided observed behaviour in What happened before saving the draft', async () => {
    mockRouteParams.title = 'Camera preview problem';
    mockRouteParams.description = 'I opened the proof camera.';
    mockRouteParams.observedBehavior = 'The preview stayed black.';
    mockedGetLatestOpenReportDraft.mockResolvedValue(null);

    render(<ReportIssueScreen />);

    const visibleDescription =
      'I opened the proof camera.\n\nObserved behaviour: The preview stayed black.';
    await waitFor(() => {
      expect(screen.getByTestId('report-description-field').props.value).toBe(
        visibleDescription
      );
    });
    expect(mockedCreateReportDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        description: visibleDescription,
        observedBehavior: '',
      })
    );
  });

  it('recovers a cold report route through Support rather than a dead Back action', () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;

    render(<ReportIssueScreen />);
    fireEvent.press(screen.getByText('Back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/support');
  });

  it('reopens only the selected draft instead of the latest matching context', async () => {
    mockRouteParams.draftId = 'report-draft-one';

    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(mockedGetOpenReportDraftByIdForUser).toHaveBeenCalledWith(
        'account-one',
        'report-draft-one'
      );
    });
    expect(mockedGetLatestOpenReportDraft).not.toHaveBeenCalled();
    expect(
      screen.getByText('Short title: Private report for account one')
    ).toBeTruthy();
  });

  it('does not replace a missing selected draft with a new report', async () => {
    mockRouteParams.draftId = 'missing-draft';
    mockedGetOpenReportDraftByIdForUser.mockResolvedValue(null);

    render(<ReportIssueScreen />);

    expect(
      await screen.findByText('Could not find this saved report')
    ).toBeTruthy();
    expect(mockedCreateReportDraft).not.toHaveBeenCalled();
    expect(screen.getByText('Choose another report')).toBeTruthy();
  });

  it('canonicalises a new-report request to the one created draft ID', async () => {
    mockRouteParams.newReport = '1';
    mockedGetLatestOpenReportDraft.mockResolvedValue(reportDraft);

    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(mockedCreateReportDraft).toHaveBeenCalledTimes(1);
      expect(mockRouter.setParams).toHaveBeenCalledWith({
        draftId: 'route-report-draft',
        newReport: '',
      });
    });
    expect(mockedGetLatestOpenReportDraft).not.toHaveBeenCalled();
  });

  it('shows a server-confirmed receipt and clears only that local draft on exit', async () => {
    const confirmedReport: ReportDraft = {
      ...reportDraft,
      serverReceiptId: 'support-receipt-one',
      status: 'server-confirmed',
    };
    mockedGetLatestOpenReportDraft.mockResolvedValue(confirmedReport);

    render(<ReportIssueScreen />);

    await waitFor(() => {
      expect(screen.getByText('Report received')).toBeTruthy();
    });
    expect(screen.getByText('support-receipt-one')).toBeTruthy();

    fireEvent.press(screen.getByTestId('button-Back to support'));

    await waitFor(() => {
      expect(mockedRemoveReportDraft).toHaveBeenCalledWith(
        'account-one',
        'report-draft-one'
      );
      expect(mockRouter.replace).toHaveBeenCalledWith('/support');
    });
  });
});
