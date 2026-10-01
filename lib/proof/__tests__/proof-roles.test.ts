import type {
  PromiseAccountabilityMember,
  PromiseAccountabilitySummary,
} from '@/lib/promises/accountability';
import {
  resolveProofChecker,
  resolveReviewerStance,
} from '@/lib/proof/proof-roles';

const member = (
  id: string,
  name: string,
  role: PromiseAccountabilityMember['role']
): PromiseAccountabilityMember => ({
  id,
  name,
  avatarUrl: null,
  role,
  participates: role === 'owner' || role === 'partner',
  proofStatus: 'none',
});

const summary = (
  members: PromiseAccountabilityMember[],
  overrides: Partial<PromiseAccountabilitySummary> = {},
  allowSelfReview = false
): PromiseAccountabilitySummary => ({
  promise: {
    id: 'promise-1',
    title: 'Read for 20 minutes',
    description: null,
    verificationDescription: 'The open book after 20 minutes',
    duration: 30,
    allowSelfReview,
  },
  group: { id: 'group-1', name: 'Emma’s promise', kind: 'promise' },
  members,
  acceptedCount: members.length,
  isShared: members.length > 1,
  canInvite: true,
  invite: null,
  ...overrides,
});

describe('resolveProofChecker', () => {
  it('never names a supporter as the person who checks proof', () => {
    const result = resolveProofChecker({
      summary: summary([
        member('emma', 'Emma', 'owner'),
        member('kiri', 'Kiri', 'supporter'),
        member('aroha', 'Aroha', 'reviewer'),
      ]),
      viewerId: 'emma',
      mentaChecks: false,
    });

    expect(result).toEqual({
      kind: 'person',
      name: 'Aroha',
      avatarUrl: null,
    });
  });

  it('does not promise a review when only supporters follow the promise', () => {
    const result = resolveProofChecker({
      summary: summary([
        member('emma', 'Emma', 'owner'),
        member('kiri', 'Kiri', 'supporter'),
      ]),
      viewerId: 'emma',
      mentaChecks: false,
    });

    expect(result).toEqual({ kind: 'unknown' });
  });

  it('matches the server: a self-review promise counts as soon as it sends', () => {
    const result = resolveProofChecker({
      summary: summary(
        [member('emma', 'Emma', 'owner'), member('aroha', 'Aroha', 'reviewer')],
        {},
        true
      ),
      viewerId: 'emma',
      mentaChecks: false,
    });

    expect(result).toEqual({ kind: 'self' });
  });

  it('lets Menta Check own the decision for Menta promises', () => {
    expect(
      resolveProofChecker({
        summary: summary([member('emma', 'Emma', 'owner')], {}, true),
        viewerId: 'emma',
        mentaChecks: true,
      })
    ).toEqual({ kind: 'menta' });
  });

  it('names the saved group rather than individual members', () => {
    expect(
      resolveProofChecker({
        summary: summary(
          [member('emma', 'Emma', 'owner'), member('sam', 'Sam', 'partner')],
          { group: { id: 'g', name: 'Morning Readers', kind: 'saved' } }
        ),
        viewerId: 'emma',
        mentaChecks: false,
      })
    ).toEqual({ kind: 'group', groupName: 'Morning Readers' });
  });

  it('groups several reviewers together', () => {
    expect(
      resolveProofChecker({
        summary: summary([
          member('emma', 'Emma', 'owner'),
          member('aroha', 'Aroha', 'reviewer'),
          member('sam', 'Sam', 'partner'),
        ]),
        viewerId: 'emma',
        mentaChecks: false,
      })
    ).toEqual({ kind: 'people' });
  });
});

describe('resolveReviewerStance', () => {
  const people = summary([
    member('emma', 'Emma', 'owner'),
    member('aroha', 'Aroha', 'reviewer'),
    member('sam', 'Sam', 'partner'),
    member('kiri', 'Kiri', 'supporter'),
  ]);

  it('gives supporters no decision to make', () => {
    expect(
      resolveReviewerStance({ summary: people, viewerId: 'kiri' })
    ).toEqual({ kind: 'supporter' });
  });

  it('separates reviewers from partners who also do the promise', () => {
    expect(
      resolveReviewerStance({ summary: people, viewerId: 'aroha' })
    ).toEqual({ kind: 'reviewer' });
    expect(resolveReviewerStance({ summary: people, viewerId: 'sam' })).toEqual(
      {
        kind: 'partner',
      }
    );
  });

  it('treats members of a saved group as checking for the group', () => {
    expect(
      resolveReviewerStance({
        summary: summary([member('emma', 'Emma', 'owner')], {
          group: { id: 'g', name: 'Morning Readers', kind: 'saved' },
        }),
        viewerId: 'someone-in-the-group',
      })
    ).toEqual({ kind: 'group', groupName: 'Morning Readers' });
  });
});
