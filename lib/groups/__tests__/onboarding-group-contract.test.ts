import {
  decodeOnboardingGroupLinkReceipt,
  onboardingGroupLinkErrorMessage,
} from '@/lib/groups/onboarding-group-contract';

const GROUP_ID = '11111111-1111-4111-8111-111111111111';
const PROMISE_ID = '22222222-2222-4222-8222-222222222222';

const receipt = (overrides: Record<string, unknown> = {}) => ({
  success: true,
  result_code: 'ONBOARDING_GROUP_LINKED_V1',
  replayed: false,
  group: {
    id: GROUP_ID,
    name: 'Evening walkers',
    description: 'Walk together',
    privacy: 'private',
    image_url: 'menta-preset:move',
    duration_days: 14,
    start_date: '2026-08-25',
    end_date: '2026-09-07',
    notify_on_member_miss: true,
  },
  first_promise: {
    id: PROMISE_ID,
    title: 'Walk for 20 minutes after work',
    allow_self_review: false,
    submission_expectations: {
      requires_peer_review: true,
      reviewers_required: 1,
    },
  },
  economy: { cost: 0, new_balance: 100 },
  ...overrides,
});

describe('onboarding group link receipt', () => {
  it.each([false, true])('accepts a strict replayed=%s receipt', replayed => {
    expect(
      decodeOnboardingGroupLinkReceipt(receipt({ replayed }))
    ).toMatchObject({
      replayed,
      group: { id: GROUP_ID, name: 'Evening walkers' },
      firstPromise: {
        id: PROMISE_ID,
        title: 'Walk for 20 minutes after work',
        allowSelfReview: false,
      },
      economy: { cost: 0, newBalance: 100 },
    });
  });

  it('rejects malformed, mismatched-review and incomplete economy receipts', () => {
    expect(decodeOnboardingGroupLinkReceipt(null)).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ group: { ...receipt().group, id: undefined } })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({
          first_promise: {
            id: PROMISE_ID,
            title: 'Walk',
            allow_self_review: true,
            submission_expectations: {},
          },
        })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(receipt({ economy: { cost: -1 } }))
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ economy: { new_balance: 100 } })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(receipt({ economy: { cost: 0 } }))
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ economy: { cost: 50, new_balance: 50 } })
      )
    ).toBeNull();
  });

  it.each([
    [7, '2026-08-25', '2026-08-31'],
    [14, '2026-08-25', '2026-09-07'],
    [30, '2026-08-25', '2026-09-23'],
  ])(
    'accepts a %i-day linked promise with its exact inclusive civil span',
    (durationDays, startDate, endDate) => {
      expect(
        decodeOnboardingGroupLinkReceipt(
          receipt({
            group: {
              ...receipt().group,
              duration_days: durationDays,
              start_date: startDate,
              end_date: endDate,
            },
          })
        )
      ).toMatchObject({
        group: { durationDays, startDate, endDate },
        economy: { cost: 0 },
      });
    }
  );

  it('rejects invalid IDs, durations and civil-date ranges', () => {
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ group: { ...receipt().group, id: 'group-1' } })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({
          first_promise: { ...receipt().first_promise, id: 'promise-1' },
        })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ group: { ...receipt().group, duration_days: -14 } })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ group: { ...receipt().group, duration_days: 21 } })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ group: { ...receipt().group, start_date: '2026-02-30' } })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ group: { ...receipt().group, end_date: '2026-08-24' } })
      )
    ).toBeNull();
    expect(
      decodeOnboardingGroupLinkReceipt(
        receipt({ group: { ...receipt().group, end_date: '2026-09-08' } })
      )
    ).toBeNull();
  });

  it('keeps a non-linkable promise distinct from empty-group creation', () => {
    expect(
      onboardingGroupLinkErrorMessage('FIRST_PROMISE_ALREADY_STARTED')
    ).toMatch(/cannot become this group’s promise/i);
    expect(
      onboardingGroupLinkErrorMessage('FIRST_PROMISE_ALREADY_STARTED')
    ).toMatch(/explicitly create an empty group/i);
  });

  it('explains when onboarding group creation is no longer free', () => {
    expect(
      onboardingGroupLinkErrorMessage('ONBOARDING_FIRST_GROUP_UNAVAILABLE')
    ).toMatch(/only available before you create another group/i);
    expect(
      onboardingGroupLinkErrorMessage('ONBOARDING_FIRST_GROUP_UNAVAILABLE')
    ).toMatch(/draft is still here/i);
  });
});
