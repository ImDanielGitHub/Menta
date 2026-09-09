import { translate } from '@/lib/localization';

/**
 * Published event photo posting window.
 *
 * Authoring SQL writes `posting_opens_at = starts_at` and
 * `posting_closes_at = ends_at + 2 hours`. EventSummary does not include
 * those timestamps, so attendee copy names the contract rather than inventing
 * a client clock.
 */

export const EVENT_PHOTO_POSTING_UNAVAILABLE_CODE = 'POSTING_UNAVAILABLE';

export const EVENT_PHOTO_POSTING_WINDOW_COPY = translate(
  'en-NZ',
  'events.proof.posting_window'
);

export const EVENT_PHOTO_POSTING_RULE_COPY = translate(
  'en-NZ',
  'events.create.photos_detail'
);

export const EVENT_PHOTO_POSTING_UNAVAILABLE_COPY = translate(
  'en-NZ',
  'events.proof.posting_unavailable'
);

export const EVENT_PHOTO_POSTING_ALBUM_FACT = translate(
  'en-NZ',
  'events.album.photo_posting_value'
);

export const EVENT_PHOTO_POSTING_AGREEMENT_COPY = translate(
  'en-NZ',
  'events.detail.post_agreement'
);

export const EVENT_PHOTO_POSTING_COMPOSE_COPY = translate(
  'en-NZ',
  'events.proof.compose_body'
);

export function isEventPhotoPostingUnavailable(
  code: string | null | undefined
): boolean {
  return code === EVENT_PHOTO_POSTING_UNAVAILABLE_CODE;
}

export function eventPhotoPostingReceiptMessage(
  code: string | null | undefined,
  fallback: string | null | undefined,
  unavailableCopy = EVENT_PHOTO_POSTING_UNAVAILABLE_COPY
): string {
  if (isEventPhotoPostingUnavailable(code)) {
    return unavailableCopy;
  }

  const message = fallback?.trim();
  return message && message.length > 0 ? message : unavailableCopy;
}
