import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useGroupStore } from '@/store/group-store';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { getSession: jest.fn() },
  },
}));
jest.mock('@/lib/operational-flags', () => ({
  isOperationalFeatureEnabled: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {},
}));

const privateGroup = {
  id: 'own-group',
  name: 'Morning walkers',
  description: 'Walk together before work',
  owner_id: 'another-member',
  status: 'active',
  privacy: 'private',
  kind: 'saved',
  duration_days: 14,
  current_streak: 3,
  notify_on_member_miss: true,
  archived_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
  invite_code: 'SYNTHETIC_PRIVATE_CODE',
};

const requests: URL[] = [];
const delivered: unknown[] = [];
const mockTransport = jest.fn();
const reply = (data: unknown) => {
  delivered.push(data);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => null },
    text: async () => JSON.stringify(data),
  } as Response;
};

beforeEach(() => {
  jest.clearAllMocks();
  requests.length = 0;
  delivered.length = 0;
  useGroupStore.setState({ groups: [], userGroups: [], groupMembers: {} });
  const client = createClient(
    'https://client-scope.invalid',
    'synthetic-public-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: mockTransport },
    }
  );
  jest
    .mocked(supabase.from)
    .mockImplementation(client.from.bind(client) as typeof supabase.from);
  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user: { id: 'viewer' } } },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
  jest.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null });
});

describe('member-facing group read data scope', () => {
  it.each(['list', 'detail', 'archive'] as const)(
    'omits invite secrets from the %s transport response and decoded state',
    async mode => {
      mockTransport.mockImplementation(async (input: string) => {
        const url = new URL(input);
        requests.push(url);
        expect(url.hostname).toBe('client-scope.invalid');
        const table = url.pathname.split('/').pop();
        if (table === 'group_stats') return reply([]);
        if (table === 'team_members' && mode === 'detail') return reply([]);
        const projection = url.searchParams.get('select') ?? '';
        // Model server projection before bytes cross into the client.
        const row = Object.fromEntries(
          Object.entries(privateGroup).filter(([key]) =>
            projection.includes('*') ? true : projection.includes(key)
          )
        );
        if (mode === 'archive') return reply([{ teams: row }]);
        return reply(mode === 'detail' ? row : [row]);
      });
      const store = useGroupStore.getState();
      const groups =
        mode === 'list'
          ? (await store.fetchGroups(), useGroupStore.getState().groups)
          : mode === 'detail'
            ? [await store.fetchGroupDetails(privateGroup.id)]
            : await store.fetchArchivedGroups('viewer');

      expect(JSON.stringify(delivered)).not.toContain(privateGroup.invite_code);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toMatchObject({
        id: privateGroup.id,
        name: privateGroup.name,
        privacy: 'private',
        notify_on_member_miss: true,
        updated_at: privateGroup.updated_at,
        archived_at: privateGroup.archived_at,
      });
      expect(groups[0]).not.toHaveProperty('invite_code');
      const groupRead = requests.find(url =>
        (url.searchParams.get('select') ?? '').includes('owner_id')
      );
      expect(groupRead?.searchParams.get('select')).not.toContain('*');
      if (mode === 'archive') {
        expect(groupRead?.searchParams.get('teams.archived_at')).toBe(
          'not.is.null'
        );
        expect(groupRead?.searchParams.get('teams.order')).toBe(
          'archived_at.desc'
        );
      }
    }
  );

  it('discards an unexpected invite-code field even if a response includes it', async () => {
    mockTransport.mockImplementation(async (input: string) => {
      const table = new URL(input).pathname.split('/').pop();
      return reply(table === 'teams' ? [privateGroup] : []);
    });
    await useGroupStore.getState().fetchGroups();
    expect(useGroupStore.getState().groups[0]).not.toHaveProperty(
      'invite_code'
    );
    expect(useGroupStore.getState().groups[0].name).toBe(privateGroup.name);
  });
});
