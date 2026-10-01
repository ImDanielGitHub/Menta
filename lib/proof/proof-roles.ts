import type { PromiseAccountabilitySummary } from '@/lib/promises/accountability';

/**
 * Who decides whether a person's proof counts (Paper page 25, S01–S04).
 *
 * The order mirrors the server: Menta Check owns its promises, a self-review
 * promise is approved inside submit_challenge_verification, a saved group
 * reviews as a group, and otherwise the other non-supporter members review.
 * Supporters follow progress and cheer; they never count as a checker.
 */
export type ProofChecker =
  | { kind: 'menta' }
  | { kind: 'self' }
  | { kind: 'group'; groupName: string }
  | { kind: 'person'; name: string; avatarUrl: string | null }
  | { kind: 'people' }
  | { kind: 'unknown' };

export const resolveProofChecker = ({
  summary,
  viewerId,
  mentaChecks,
}: {
  summary: PromiseAccountabilitySummary | null | undefined;
  viewerId: string | null | undefined;
  mentaChecks: boolean;
}): ProofChecker => {
  if (mentaChecks) return { kind: 'menta' };
  if (!summary) return { kind: 'unknown' };
  if (summary.promise.allowSelfReview) return { kind: 'self' };
  if (summary.group?.kind === 'saved') {
    return { kind: 'group', groupName: summary.group.name };
  }

  const checkers = summary.members.filter(
    member => member.id !== viewerId && member.role !== 'supporter'
  );
  if (checkers.length === 1) {
    return {
      kind: 'person',
      name: checkers[0].name,
      avatarUrl: checkers[0].avatarUrl,
    };
  }
  if (checkers.length > 1) return { kind: 'people' };
  return { kind: 'unknown' };
};

/**
 * The viewer's job when they open someone else's proof (R01, R02, U01).
 * Reviewers decide, partners check each other, group members check for the
 * group, and supporters only cheer.
 */
export type ReviewerStance =
  | { kind: 'reviewer' }
  | { kind: 'partner' }
  | { kind: 'group'; groupName: string }
  | { kind: 'supporter' }
  | { kind: 'unknown' };

export const resolveReviewerStance = ({
  summary,
  viewerId,
}: {
  summary: PromiseAccountabilitySummary | null | undefined;
  viewerId: string | null | undefined;
}): ReviewerStance => {
  if (!summary || !viewerId) return { kind: 'unknown' };

  const viewer = summary.members.find(member => member.id === viewerId);
  if (viewer?.role === 'supporter') return { kind: 'supporter' };
  if (viewer?.role === 'reviewer') return { kind: 'reviewer' };
  if (viewer?.role === 'partner' || viewer?.role === 'owner') {
    return { kind: 'partner' };
  }
  if (summary.group?.kind === 'saved') {
    return { kind: 'group', groupName: summary.group.name };
  }
  return { kind: 'unknown' };
};
