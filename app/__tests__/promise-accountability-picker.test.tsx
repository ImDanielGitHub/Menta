import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { PromisePicker } from '@/app/promise-accountability';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockReplace = jest.fn();
const mockTrackProductEvent = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn(() => ({ eq: mockEq }));

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: mockReplace,
  }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: mockSelect }),
  },
}));

jest.mock('@/lib/posthog', () => ({
  trackProductEvent: (...args: unknown[]) => mockTrackProductEvent(...args),
  trackProductOperation: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@/hooks/usePromiseAccountability', () => ({
  promiseAccountabilityQueryKey: (id: string) => ['promise-accountability', id],
  usePromiseAccountability: () => ({
    data: null,
    error: null,
    isError: false,
    isLoading: true,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/components/challenge/PromiseArtefact', () => ({
  PromiseArtefact: () => null,
}));

jest.mock('@/components/ui', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  const passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  return {
    AppButton: passthrough,
    AppCard: passthrough,
    AppInlineNotice: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    AppOptionCard: passthrough,
    AppScreen: ({
      children,
      testID,
    }: {
      children?: React.ReactNode;
      testID?: string;
    }) => React.createElement(View, { testID }, children),
    AppTopBar: ({ title }: { title: string }) =>
      React.createElement(Text, null, title),
    SkeletonLoader: ({ testID }: { testID?: string }) =>
      React.createElement(View, { testID }),
  };
});

jest.mock('@/components/ui/ConfirmDestructiveSheet', () => ({
  ConfirmDestructiveSheet: () => null,
}));

jest.mock('@/components/ui/SimpleBottomSheet', () => ({
  SimpleBottomSheet: () => null,
}));

jest.mock('react-native-qrcode-svg', () => () => null);

const activePromise = (
  id: string,
  title: string,
  group?: { id: string; kind: 'saved' | 'promise' }
) => ({
  status: 'active',
  challenges: {
    id,
    title,
    status: 'active',
    completion_status: 'active',
    is_expired: false,
    team_challenges: group ? [{ group_id: group.id, team: group }] : [],
  },
});

const renderPicker = () =>
  render(
    <ThemeProvider>
      <PromisePicker onBack={jest.fn()} />
    </ThemeProvider>
  );

describe('PromisePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEq.mockReset();
  });

  it('loads in the shape of the ivory promise object, then opens role setup', async () => {
    let resolvePromises: ((value: unknown) => void) | undefined;
    const promiseResult = new Promise(resolve => {
      resolvePromises = resolve;
    });
    mockEq
      .mockReturnValueOnce({ eq: mockEq })
      .mockReturnValueOnce(promiseResult);

    renderPicker();

    expect(
      screen.getByTestId('promise-accountability-picker-loading')
    ).toHaveProp('accessibilityRole', 'progressbar');
    expect(
      screen.getByTestId('promise-accountability-picker-body')
    ).toHaveStyle({
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 32,
    });

    resolvePromises?.({
      data: [activePromise('promise-1', 'Read the Bible daily')],
      error: null,
    });

    const choice = await screen.findByTestId(
      'accountability-promise-promise-1'
    );
    expect(choice).toHaveProp('accessibilityRole', 'button');
    expect(choice).toHaveStyle({ backgroundColor: mentaColors.paper });
    expect(
      screen.getByText('Private now · nothing is shared until someone accepts')
    ).toBeTruthy();

    fireEvent.press(choice);
    expect(mockTrackProductEvent).toHaveBeenCalledWith(
      'Accountability Invite Journey',
      expect.objectContaining({
        context: 'private',
        stage: 'promise_selected',
      })
    );
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/promise-accountability',
      params: { challengeId: 'promise-1' },
    });
  });

  it('takes an already shared promise to its existing group', async () => {
    mockEq.mockReturnValueOnce({ eq: mockEq }).mockResolvedValueOnce({
      data: [
        activePromise('promise-2', 'Walk before work', {
          id: 'group-1',
          kind: 'saved',
        }),
      ],
      error: null,
    });

    renderPicker();

    const choice = await screen.findByTestId(
      'accountability-promise-promise-2'
    );
    fireEvent.press(choice);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/groups/[id]',
        params: { id: 'group-1' },
      })
    );
  });
});
