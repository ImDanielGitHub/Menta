import type { TranslationKey } from '@/lib/localization/en-NZ';
import type { TranslationValues } from '@/lib/localization/translate';

type Translate = (key: TranslationKey, values?: TranslationValues) => string;

export type ProtectedAuthCopy = {
  title: string;
  description: string;
};

const pathAndQuery = (
  next: string
): { path: string; query: URLSearchParams; segments: string[] } => {
  const trimmed = next.trim();
  const hashIndex = trimmed.indexOf('#');
  const withoutHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const queryIndex = withoutHash.indexOf('?');
  const rawPath =
    queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const rawQuery = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
  const path =
    (rawPath.startsWith('/') ? rawPath : `/${rawPath}`).replace(/\/+$/, '') ||
    '/';
  return {
    path,
    query: new URLSearchParams(rawQuery),
    segments: path.split('/').filter(Boolean),
  };
};

const hasSegment = (segments: string[], name: string): boolean =>
  segments.includes(name);

const isGroupPath = (segments: string[]): boolean =>
  segments.some(
    segment =>
      segment === 'groups' ||
      segment === 'join-group' ||
      segment.startsWith('group-')
  );

export const getProtectedAuthCopy = ({
  next,
  explicitContext,
  t,
}: {
  next?: string | null;
  explicitContext?: string | null;
  t: Translate;
}): ProtectedAuthCopy => {
  if (explicitContext === 'events') {
    return {
      title: t('fullAuth.auth_required.sign_in_to_continue_with_this_event'),
      description: t(
        'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t'
      ),
    };
  }

  const raw = (next ?? '').trim();
  if (!raw) {
    return {
      title: t('fullAuth.auth_required.sign_in_to_continue'),
      description: t(
        'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with'
      ),
    };
  }

  const { path, query, segments } = pathAndQuery(raw);

  if (hasSegment(segments, 'verification') || hasSegment(segments, 'camera')) {
    return {
      title: t('fullAuth.auth_required.sign_in_to_add_proof'),
      description: t(
        'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an'
      ),
    };
  }

  if (hasSegment(segments, 'join-event') || hasSegment(segments, 'events')) {
    return {
      title: t('fullAuth.auth_required.sign_in_to_continue_with_this_event'),
      description: t(
        'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t'
      ),
    };
  }

  const challengeInvite =
    hasSegment(segments, 'join-promise') ||
    hasSegment(segments, 'join-funding') ||
    Boolean(query.get('challenge')) ||
    query.get('type') === 'challenge' ||
    path.includes('/join/challenge');

  if (challengeInvite) {
    return {
      title: t('auth.login.required.join_promise_title'),
      description: t('auth.login.required.join_promise_detail'),
    };
  }

  if (hasSegment(segments, 'create-challenge')) {
    return {
      title: t('auth.login.required.create_promise_title'),
      description: t('auth.login.required.create_promise_detail'),
    };
  }

  if (hasSegment(segments, 'challenges')) {
    return {
      title: t('auth.login.required.open_promise_title'),
      description: t('auth.login.required.open_promise_detail'),
    };
  }

  if (
    hasSegment(segments, 'review-queue') ||
    hasSegment(segments, 'review') ||
    hasSegment(segments, 'group-review')
  ) {
    return {
      title: t('fullAuth.auth_required.sign_in_to_review_proof'),
      description: t(
        'fullAuth.auth_required.menta_records_the_review_under_your_account'
      ),
    };
  }

  if (isGroupPath(segments) || hasSegment(segments, 'join')) {
    return {
      title: t('fullAuth.auth_required.sign_in_to_join_this_group'),
      description: t(
        'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you'
      ),
    };
  }

  if (hasSegment(segments, 'momenta') || hasSegment(segments, 'shop')) {
    return {
      title: t('fullAuth.auth_required.sign_in_to_use_momenta'),
      description: t(
        'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_'
      ),
    };
  }

  return {
    title: t('fullAuth.auth_required.sign_in_to_continue'),
    description: t(
      'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_'
    ),
  };
};
