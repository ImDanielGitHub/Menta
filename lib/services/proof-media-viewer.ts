import {
  ImageService,
  extractTrustedSupabaseStorageObject,
  type StorageBucket,
} from '@/lib/image-service';
import { STORAGE_BUCKETS } from '@/lib/supabase';

const resolveBucketKey = (bucketOrName: string): StorageBucket => {
  if (Object.prototype.hasOwnProperty.call(STORAGE_BUCKETS, bucketOrName)) {
    return bucketOrName as StorageBucket;
  }

  const entry = (
    Object.entries(STORAGE_BUCKETS) as [StorageBucket, string][]
  ).find(([, bucketName]) => bucketName === bucketOrName);

  return entry?.[0] ?? 'CHALLENGE_VERIFICATIONS';
};

/**
 * Resolve a proof-video object key or trusted Supabase URL into a short-lived
 * playable URL. Untrusted third-party URLs are rejected rather than handed to
 * the native player.
 */
export const resolveProofVideoUri = async (
  mediaUrl: string
): Promise<string> => {
  if (!mediaUrl.includes('://')) {
    return ImageService.getSignedUrl('CHALLENGE_VERIFICATIONS', mediaUrl);
  }

  const parsed = extractTrustedSupabaseStorageObject(
    mediaUrl,
    STORAGE_BUCKETS.CHALLENGE_VERIFICATIONS
  );
  if (!parsed) throw new Error('Untrusted proof media URL');

  return ImageService.getSignedUrl(
    resolveBucketKey(parsed.bucket),
    parsed.objectKey
  );
};
