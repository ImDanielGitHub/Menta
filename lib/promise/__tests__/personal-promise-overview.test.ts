import { resolvePersonalPromiseLifecycle } from '@/lib/promise/personal-promise-overview';

const now = new Date('2026-08-31T12:00:00.000Z');

describe('personal promise overview lifecycle', () => {
  it.each(['completed', 'expired', 'cancelled', 'archived'])(
    'treats server %s as past',
    status => {
      expect(resolvePersonalPromiseLifecycle({ status, now })).toBe('past');
    }
  );

  it('uses an explicit elapsed end day', () => {
    expect(
      resolvePersonalPromiseLifecycle({
        status: 'active',
        endDate: '2026-08-30',
        now,
      })
    ).toBe('past');
  });

  it('uses the complete duration only when the start and duration are known', () => {
    expect(
      resolvePersonalPromiseLifecycle({
        status: 'active',
        startDate: '2026-08-01',
        duration: 30,
        now,
      })
    ).toBe('past');
    expect(
      resolvePersonalPromiseLifecycle({
        status: 'active',
        duration: 30,
        now,
      })
    ).toBe('active');
  });

  it('keeps incomplete or future facts active', () => {
    expect(
      resolvePersonalPromiseLifecycle({
        status: 'active',
        endDate: '2026-09-01',
        now,
      })
    ).toBe('active');
    expect(resolvePersonalPromiseLifecycle({ now })).toBe('active');
  });
});
