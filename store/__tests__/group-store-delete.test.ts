import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGroupStore } from '../group-store';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const stateCheckQuery = (data: unknown, error: unknown = null) => {
  const query: Record<string, jest.Mock> = {};
  ['select', 'eq'].forEach(method => {
    query[method] = jest.fn(() => query);
  });
  query.maybeSingle = jest.fn().mockResolvedValue({ data, error });
  return query;
};

describe('GroupStore - Delete Group', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.from as jest.Mock).mockReset();
    // Reset store state
    act(() => {
      useGroupStore.setState({
        groups: [],
        userGroups: [],
        groupMembers: {},
        isLoading: false,
      });
    });
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('deleteGroup', () => {
    it('successfully deletes a group', async () => {
      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'user-1' },
          },
        },
        error: null,
      } as any);

      // Mock successful function invocation
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, message: 'Group deleted successfully' },
        error: null,
      });

      // Set initial state
      act(() => {
        useGroupStore.setState({
          groups: [
            {
              id: 'group-1',
              name: 'Test Group',
              description: 'Test',
              privacy: 'public',
              memberCount: 1,
              createdAt: '2024-01-01T00:00:00Z',
              ownerId: 'user-1',
            },
          ],
          userGroups: ['group-1'],
          groupMembers: {
            'group-1': [
              {
                groupId: 'group-1',
                userId: 'user-1',
                role: 'owner',
                joinedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await result.current.deleteGroup('group-1');
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'delete-group',
        {
          body: { groupId: 'group-1' },
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );

      expect(result.current.groups).toHaveLength(0);
      expect(result.current.userGroups).not.toContain('group-1');
      expect(result.current.groupMembers['group-1']).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('throws error when group not found', async () => {
      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        try {
          await result.current.deleteGroup('non-existent');
        } catch (error) {
          expect(error).toEqual(new Error('Group not found'));
        }
      });
    });

    it('returns a definitive no-change outcome when session is invalid', async () => {
      // Mock failed session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' },
      } as any);

      // Set initial state
      act(() => {
        useGroupStore.setState({
          groups: [
            {
              id: 'group-1',
              name: 'Test Group',
              description: 'Test',
              privacy: 'public',
              memberCount: 1,
              createdAt: '2024-01-01T00:00:00Z',
              ownerId: 'user-1',
            },
          ],
        });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(
          result.current.deleteGroup('group-1')
        ).resolves.toMatchObject({
          kind: 'rejected',
          action: 'delete-group',
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('throws error when function call fails', async () => {
      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'user-1' },
          },
        },
        error: null,
      } as any);

      // Mock failed function invocation
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      // Set initial state
      act(() => {
        useGroupStore.setState({
          groups: [
            {
              id: 'group-1',
              name: 'Test Group',
              description: 'Test',
              privacy: 'public',
              memberCount: 1,
              createdAt: '2024-01-01T00:00:00Z',
              ownerId: 'user-1',
            },
          ],
        });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        try {
          await result.current.deleteGroup('group-1');
        } catch (error) {
          expect(error).toEqual(new Error('Permission denied'));
        }
      });

      expect(result.current.isLoading).toBe(false);
      // Group should still exist since deletion failed
      expect(result.current.groups).toHaveLength(1);
    });

    it('checks the group state before reporting a failed delete as no change', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'user-1' },
          },
        },
        error: null,
      } as any);
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Network response lost' },
      });
      (mockSupabase.from as jest.Mock).mockReturnValue(
        stateCheckQuery({ id: 'group-1' })
      );

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        await expect(result.current.deleteGroup('group-1')).resolves.toEqual(
          expect.objectContaining({
            kind: 'rejected',
            action: 'delete-group',
          })
        );
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('teams');
    });

    it('throws error when function returns failure', async () => {
      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'user-1' },
          },
        },
        error: null,
      } as any);

      // Mock function returning failure
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: false, error: 'Database error' },
        error: null,
      });

      // Set initial state
      act(() => {
        useGroupStore.setState({
          groups: [
            {
              id: 'group-1',
              name: 'Test Group',
              description: 'Test',
              privacy: 'public',
              memberCount: 1,
              createdAt: '2024-01-01T00:00:00Z',
              ownerId: 'user-1',
            },
          ],
        });
      });

      const { result } = renderHook(() => useGroupStore());

      await act(async () => {
        try {
          await result.current.deleteGroup('group-1');
        } catch (error) {
          expect(error).toEqual(new Error('Database error'));
        }
      });

      expect(result.current.isLoading).toBe(false);
      // Group should still exist since deletion failed
      expect(result.current.groups).toHaveLength(1);
    });

    it('sets loading state correctly during operation', async () => {
      // Mock successful session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'user-1' },
          },
        },
        error: null,
      } as any);

      // Mock function with delay
      let resolveFn: (value: any) => void;
      const deletePromise = new Promise(resolve => {
        resolveFn = resolve;
      });
      mockSupabase.functions.invoke.mockReturnValue(deletePromise as any);

      // Set initial state
      act(() => {
        useGroupStore.setState({
          groups: [
            {
              id: 'group-1',
              name: 'Test Group',
              description: 'Test',
              privacy: 'public',
              memberCount: 1,
              createdAt: '2024-01-01T00:00:00Z',
              ownerId: 'user-1',
            },
          ],
        });
      });

      const { result } = renderHook(() => useGroupStore());

      // Start deletion
      act(() => {
        result.current.deleteGroup('group-1');
      });

      // Should be loading
      await waitFor(() => expect(result.current.isLoading).toBe(true));

      // Complete the operation
      await act(async () => {
        resolveFn!({
          data: { success: true, message: 'Group deleted successfully' },
          error: null,
        });
        await deletePromise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });
  });
});
