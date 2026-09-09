import { renderHook } from '@testing-library/react-native';

import { useGroupDetailData } from '@/hooks/useGroupDetail';

const mockUseQuery = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      isAuthenticated: true,
      user: { id: 'viewer-1' },
    }),
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: {
    getState: jest.fn(),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {},
}));

jest.mock('@/lib/queryClient', () => ({
  interactiveQueryConfig: {},
  staticQueryConfig: {},
}));

const queryResult = (data: unknown) => ({
  data,
  dataUpdatedAt: 100,
  error: null,
  fetchStatus: 'idle',
  isError: false,
  isFetching: false,
  isPending: false,
  refetch: jest.fn(() => Promise.resolve()),
});

describe('useGroupDetailData public access boundary', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockImplementation(
      ({
        enabled = true,
        queryKey,
      }: {
        enabled?: boolean;
        queryKey: unknown[];
      }) => {
        const tail = queryKey.at(-1);
        if (tail === 'self-access') return queryResult(false);
        if (tail === 'members' || tail === 'challenges') {
          return {
            ...queryResult(undefined),
            enabled,
            isPending: true,
          };
        }
        return queryResult({
          id: 'public-group',
          name: 'Move together',
          privacy: 'public',
          kind: 'saved',
          status: 'active',
        });
      }
    );
  });

  it('keeps the public shell usable without starting member or promise reads', () => {
    const { result } = renderHook(() => useGroupDetailData('public-group'));

    expect(result.current.group).toMatchObject({
      id: 'public-group',
      privacy: 'public',
    });
    expect(result.current.privateAccessConfirmed).toBe(false);
    expect(result.current.members).toEqual([]);
    expect(result.current.challenges).toEqual([]);
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isError).toBe(false);

    const privateReads = mockUseQuery.mock.calls
      .map(([options]) => options as { enabled?: boolean; queryKey: unknown[] })
      .filter(({ queryKey }) => {
        const tail = queryKey.at(-1);
        return tail === 'members' || tail === 'challenges';
      });
    expect(privateReads).toHaveLength(2);
    expect(privateReads.every(({ enabled }) => enabled === false)).toBe(true);
  });
});
