import * as Sentry from '@sentry/react-native';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({})),
}));
jest.mock('@/lib/e2e', () => ({
  isE2EMode: () => false,
  getExpoExtraString: (key: string) =>
    key === 'supabaseUrl' ? 'https://example.supabase.co' : 'public-anon-key',
}));
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: { sentryDsn: 'https://public@example.ingest.sentry.io/1' },
  },
}));

type Event = { message: string; level?: string; tags?: Record<string, string> };

describe('Supabase diagnostic delivery', () => {
  let instrumentedFetch: typeof fetch;
  let beforeSend: (event: Event, hint: object) => unknown;
  const runtime = globalThis as typeof globalThis & { __DEV__: boolean };
  const originalDev = runtime.__DEV__;
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    jest.requireActual<typeof import('@/lib/supabase')>('@/lib/supabase');
    const create = createClient as jest.Mock;
    instrumentedFetch = create.mock.calls[0][2].global.fetch;
    jest
      .requireActual<typeof import('@/lib/sentry')>('@/lib/sentry')
      .initSentry();
    beforeSend = (Sentry.init as jest.Mock).mock.calls[0][0].beforeSend;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
    runtime.__DEV__ = originalDev;
  });

  it.each([
    [200, 3000, 0.01, true],
    [200, 3000, 0.03, false],
    [429, 100, 0.03, true],
    [429, 100, 0.06, false],
    [500, 100, 0.99, true],
    [403, 100, 0.0, false],
  ])(
    'samples a %s response taking %s ms once at the delivery boundary',
    async (status, duration, sample, delivered) => {
      runtime.__DEV__ = false;
      const random = jest.spyOn(Math, 'random').mockReturnValue(sample);
      const span = { setAttribute: jest.fn(), setStatus: jest.fn() };
      jest
        .spyOn(Sentry, 'startSpan')
        .mockImplementation(async (_context, callback) =>
          callback(span as never)
        );
      jest.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(duration);
      const response = {
        ok: status < 400,
        status,
        headers: { get: () => 'application/json' },
      } as unknown as Response;
      globalThis.fetch = jest.fn().mockResolvedValue(response);
      const accepted: unknown[] = [];
      jest
        .spyOn(Sentry, 'captureMessage')
        .mockImplementation((message, captureContext) => {
          const event = beforeSend(
            {
              message,
              level:
                typeof captureContext === 'object'
                  ? captureContext.level
                  : undefined,
              tags: { http_status: String(status) },
            },
            {}
          );
          if (event) accepted.push(event);
          return 'event-id';
        });

      await expect(
        instrumentedFetch('https://example.supabase.co/rest/v1/profiles')
      ).resolves.toBe(response);
      expect(accepted).toHaveLength(delivered ? 1 : 0);
      expect(random).toHaveBeenCalledTimes(status === 403 ? 0 : 1);
      expect(span.setStatus).toHaveBeenCalledWith({
        code: status >= 400 ? 2 : 1,
      });
    }
  );
});
