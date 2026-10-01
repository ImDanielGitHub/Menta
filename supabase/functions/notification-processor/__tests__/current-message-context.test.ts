/** @jest-environment node */
import { evaluateDeliveryGuard } from '../delivery-guard.ts';

const mockDatabase = { from: jest.fn(), rpc: jest.fn() };
jest.mock(
  'npm:@supabase/supabase-js@2.109.0',
  () => ({
    createClient: () => mockDatabase,
  }),
  { virtual: true }
);

type Context = {
  expiresAt?: string;
  notBefore?: string;
  skipReason?: string;
};
let loadContext: (record: unknown, now: Date) => Promise<Context>;
const now = new Date('2026-09-13T23:30:00.000Z');
const record = {
  user_id: 'test-user',
  notification_type: 'streak_reminder',
  payload: {
    challengeId: 'test-promise',
    localDay: '2026-09-13',
    reminderKind: 'rescue',
  },
};
const preference = {
  push_enabled: true,
  device_permission_status: 'granted',
  timezone: 'Pacific/Auckland',
};

beforeAll(() => {
  // Import the real Edge Function without starting a server or accessing a
  // network. Only the database boundary is mocked; deadline logic stays real.
  const runtime = globalThis as typeof globalThis & { Deno?: unknown };
  const previous = runtime.Deno;
  runtime.Deno = { env: { get: () => 'unit-test-only' }, serve: jest.fn() };
  try {
    loadContext = jest.requireActual<{
      loadCurrentMessageContext: typeof loadContext;
    }>('../index.ts').loadCurrentMessageContext;
  } finally {
    if (previous === undefined) delete runtime.Deno;
    else runtime.Deno = previous;
  }
});

function fixture(
  options: { extension?: string; status?: string; resolved?: boolean } = {}
) {
  mockDatabase.rpc.mockResolvedValue({ data: 'Pacific/Auckland', error: null });
  mockDatabase.from.mockImplementation((table: string) => {
    const rows: Record<string, unknown> = {
      challenges: {
        id: 'test-promise',
        status: options.status ?? 'active',
        start_date: null,
        end_date: '2026-09-13T12:00:00.000Z',
      },
      challenge_participants: { status: 'active' },
      streak_day_outcomes: options.resolved ? [{ id: 'settled-day' }] : [],
      power_up_usage: options.extension
        ? [
            {
              proof_due_at: options.extension,
              effective_timezone: 'Pacific/Auckland',
            },
          ]
        : [],
    };
    if (!(table in rows)) throw new Error(`Unexpected table ${table}`);
    const result = { data: rows[table], error: null };
    const query: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'not', 'order', 'limit']) {
      query[method] = jest.fn(() => query);
    }
    query.maybeSingle = () => Promise.resolve(result);
    query.then = (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve);
    return query;
  });
}

beforeEach(() => jest.clearAllMocks());

describe('current proof obligation before dispatch', () => {
  it('keeps a last-day purchased extension after the separate promise lifetime ends', async () => {
    fixture({ extension: '2026-09-14T00:00:00.000Z' });
    const context = await loadContext(record, now);
    expect(context.skipReason).toBeUndefined();
    expect(context.expiresAt).toBe('2026-09-14T00:00:00.000Z');
    expect(context.notBefore).toBe('2026-09-13T23:00:00.000Z');
    expect(
      evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now,
        preference,
        ...context,
      })
    ).toEqual({ kind: 'allow' });
  });

  it('expires an ordinary old-day reminder without inventing an extension', async () => {
    fixture();
    const context = await loadContext(record, now);
    expect(
      evaluateDeliveryGuard({
        notificationType: 'streak_reminder',
        now,
        preference,
        ...context,
      })
    ).toEqual({ kind: 'skip', reason: 'SKIPPED_MESSAGE_EXPIRED' });
  });

  it('does not revive a cancelled promise even with an unexpired extension', async () => {
    fixture({ status: 'cancelled', extension: '2026-09-14T00:00:00.000Z' });
    expect(await loadContext(record, now)).toEqual({
      skipReason: 'SKIPPED_PROMISE_NOT_ACTIVE',
    });
  });

  it('does not revive a settled obligation with an extension', async () => {
    fixture({ resolved: true, extension: '2026-09-14T00:00:00.000Z' });
    expect(await loadContext(record, now)).toEqual({
      skipReason: 'SKIPPED_OBLIGATION_RESOLVED',
    });
  });

  it('keeps promise-expiry messages bounded by the promise lifetime', async () => {
    fixture({ extension: '2026-09-14T00:00:00.000Z' });
    expect(
      await loadContext(
        { ...record, notification_type: 'challenge_expiring' },
        now
      )
    ).toEqual({ skipReason: 'SKIPPED_PROMISE_NOT_ACTIVE' });
  });
});

describe('queued proof reviewer authority before dispatch', () => {
  const review = {
    user_id: 'reviewer-a',
    notification_type: 'review_reminder',
    payload: { submissionId: 'proof-a', challengeId: 'promise-a' },
  };
  const pending = {
    id: 'proof-a',
    status: 'pending',
    user_id: 'submitter-a',
    challenge_id: 'promise-a',
  };
  const proofFixture = (row: typeof pending | null = pending) => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
    };
    mockDatabase.from.mockReturnValue(query);
  };
  it('checks the authoritative recipient function for an individual queued proof', async () => {
    proofFixture();
    mockDatabase.rpc.mockResolvedValue({ data: true, error: null });
    expect(await loadContext(review, now)).toEqual({ pendingReviews: 1 });
    expect(mockDatabase.rpc).toHaveBeenCalledWith(
      'is_challenge_review_recipient_v1',
      {
        p_challenge_id: 'promise-a',
        p_submitter_id: 'submitter-a',
        p_reviewer_id: 'reviewer-a',
      }
    );
  });
  it.each([false, null])(
    'skips when current authority no longer permits the reviewer: %s',
    data => {
      proofFixture();
      mockDatabase.rpc.mockResolvedValue({ data, error: null });
      return expect(loadContext(review, now)).resolves.toEqual({
        skipReason: 'SKIPPED_REVIEWER_NOT_ALLOWED',
      });
    }
  );
  it('retries an authority lookup failure without sending', async () => {
    proofFixture();
    mockDatabase.rpc.mockResolvedValue({
      data: null,
      error: new Error('unavailable'),
    });
    await expect(loadContext(review, now)).rejects.toThrow(
      'Could not re-check review permission.'
    );
  });
  it.each(['approved', 'rejected'])(
    'still stops immediately after proof review is %s',
    async status => {
      proofFixture({ ...pending, status });
      expect(await loadContext(review, now)).toEqual({
        skipReason: 'SKIPPED_REVIEW_ALREADY_RESOLVED',
      });
      expect(mockDatabase.rpc).not.toHaveBeenCalled();
    }
  );
});
