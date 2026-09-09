import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { useGroupNotificationPreferences } from '../useNotifications';

// Mock auth store to provide a user id
jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

// Mock notification service
const mockGetGroupPreferences = jest.fn();
const mockUpdateGroupPreferences = jest.fn();
jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    getGroupPreferences: (...args: any[]) => mockGetGroupPreferences(...args),
    updateGroupPreferences: (...args: any[]) =>
      mockUpdateGroupPreferences(...args),
  },
}));

const HookConsumer: React.FC<{ groupId: string; onUpdate?: () => void }> = ({
  groupId,
  onUpdate,
}) => {
  const { preferences, isLoading, error, updatePreferences } =
    useGroupNotificationPreferences(groupId);
  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'idle'}</Text>
      <Text testID="error">{error || ''}</Text>
      <Text testID="prefs">
        {preferences ? JSON.stringify(preferences) : ''}
      </Text>
      <Text
        testID="update"
        onPress={() => updatePreferences({ notify_all: false } as any)}
      >
        update
      </Text>
    </>
  );
};

describe('useGroupNotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads preferences on mount', async () => {
    mockGetGroupPreferences.mockResolvedValue({
      user_id: 'user-1',
      group_id: 'group-1',
      notify_all: true,
      notify_mentions: true,
      notify_daily_summary: false,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    });

    const { getByTestId } = render(<HookConsumer groupId="group-1" />);

    expect(getByTestId('loading').children.join('')).toBe('loading');

    await waitFor(() => {
      expect(getByTestId('loading').children.join('')).toBe('idle');
      const prefsText = getByTestId('prefs').children.join('');
      expect(prefsText).toContain('notify_all');
    });

    expect(mockGetGroupPreferences).toHaveBeenCalledWith('user-1', 'group-1');
  });

  it('updates preferences and refreshes', async () => {
    // Initial
    mockGetGroupPreferences.mockResolvedValueOnce({
      user_id: 'user-1',
      group_id: 'group-1',
      notify_all: true,
      notify_mentions: true,
      notify_daily_summary: false,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    });
    // After update reload
    mockGetGroupPreferences.mockResolvedValueOnce({
      user_id: 'user-1',
      group_id: 'group-1',
      notify_all: false,
      notify_mentions: true,
      notify_daily_summary: false,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-02T00:00:00.000Z',
    });
    mockUpdateGroupPreferences.mockResolvedValue(undefined);

    const { getByTestId } = render(<HookConsumer groupId="group-1" />);

    await waitFor(() => {
      expect(getByTestId('loading').children.join('')).toBe('idle');
    });

    await act(async () => {
      fireEvent.press(getByTestId('update'));
    });

    expect(mockUpdateGroupPreferences).toHaveBeenCalledWith(
      'user-1',
      'group-1',
      {
        notify_all: false,
      }
    );
    await waitFor(() => {
      const prefsText = getByTestId('prefs').children.join('');
      expect(prefsText).toContain('"notify_all":false');
    });
  });

  it('rolls back an optimistic preference when the server rejects it', async () => {
    mockGetGroupPreferences.mockResolvedValue({
      user_id: 'user-1',
      group_id: 'group-1',
      notify_all: true,
      notify_mentions: true,
      notify_daily_summary: false,
    });
    mockUpdateGroupPreferences.mockRejectedValue(new Error('Write failed'));

    const { getByTestId } = render(<HookConsumer groupId="group-1" />);

    await waitFor(() => {
      expect(getByTestId('prefs').children.join('')).toContain(
        '"notify_all":true'
      );
    });

    fireEvent.press(getByTestId('update'));

    await waitFor(() => {
      expect(getByTestId('error').children.join('')).toBe('Write failed');
      expect(getByTestId('prefs').children.join('')).toContain(
        '"notify_all":true'
      );
    });
  });
});
