import type { ProofConnectionMosaicItem } from '@/components/proof/ProofConnectionMosaic';

export type TodayRecentProofMedia = ProofConnectionMosaicItem & {
  challengeId: string;
  challengeTitle: string;
  groupId: string | null;
  visibility: 'only-you' | 'promise-people';
};

const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
      )
    : [];

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const timestamp = (value: unknown): string | null => {
  const candidate = text(value);
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
};

const formatRecentProofDate = (value: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));

export const decodeTodayRecentMedia = (
  value: unknown,
  locale: string
): TodayRecentProofMedia[] => {
  const decoded: TodayRecentProofMedia[] = [];
  const seenIds = new Set<string>();

  for (const row of records(value)) {
    const id = text(row.id);
    const challengeId = text(row.challenge_id);
    const challengeTitle = text(row.challenge_title);
    const mediaUrl = text(row.media_url);
    const submittedAt = timestamp(row.submitted_at);
    const contributorName = text(row.contributor_name);
    const mediaType = row.media_type === 'video' ? 'video' : 'photo';
    const groupId = text(row.group_id);
    const visibility =
      row.visibility === 'promise_people' ? 'promise-people' : 'only-you';

    if (
      !id ||
      seenIds.has(id) ||
      !challengeId ||
      !challengeTitle ||
      !mediaUrl ||
      !submittedAt ||
      !contributorName ||
      (row.media_type !== 'photo' && row.media_type !== 'video')
    ) {
      continue;
    }

    seenIds.add(id);
    decoded.push({
      id,
      challengeId,
      challengeTitle,
      groupId,
      mediaType,
      mediaUrl,
      thumbnailUrl: mediaType === 'photo' ? mediaUrl : null,
      contributorName,
      submittedLabel: formatRecentProofDate(submittedAt, locale),
      state: 'approved',
      canEncourage: false,
      visibility,
    });
  }

  return decoded;
};
