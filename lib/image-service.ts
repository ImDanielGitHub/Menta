/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, prefer-const -- Legacy upload adapters remain outside this security patch. */
import { supabase, STORAGE_BUCKETS, SUPABASE_URL } from '@/lib/supabase';
import { LRUCache } from 'lru-cache';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { useAuthStore } from '@/store/auth-store';

export type StorageBucket = keyof typeof STORAGE_BUCKETS;

export interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'origin'; // 'origin' disables auto-optimization, omit for auto WebP
}

const cache = new LRUCache<string, string>({ max: 200 }); // ~200 signed URLs per session

function cacheKey(bucket: string, path: string, transform?: ImageTransform) {
  return `${bucket}/${path}|${transform ? JSON.stringify(transform) : 'orig'}`;
}

/**
 * Extract bucket and object key from a Supabase storage URL
 */
export function extractBucketAndKeyFromSupabaseUrl(
  url: string
): { bucket: string; objectKey: string } | null {
  try {
    // Handle different Supabase URL formats:
    // 1. https://project.supabase.co/storage/v1/object/public/bucket/path/to/file
    // 2. https://project.supabase.co/storage/v1/object/sign/bucket/path/to/file
    // 3. https://project.supabase.co/storage/v1/object/bucket/path/to/file

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find the bucket and path after /storage/v1/object/
    const storageIndex = pathParts.findIndex(part => part === 'storage');
    if (storageIndex === -1) return null;

    const objectIndex = pathParts.findIndex(
      (part, index) => index > storageIndex && part === 'object'
    );
    if (objectIndex === -1) return null;

    // Skip 'public' or 'sign' if present
    let bucketIndex = objectIndex + 1;
    if (
      pathParts[bucketIndex] === 'public' ||
      pathParts[bucketIndex] === 'sign'
    ) {
      bucketIndex++;
    }

    if (bucketIndex >= pathParts.length) return null;

    const bucket = pathParts[bucketIndex];
    const objectKey = pathParts.slice(bucketIndex + 1).join('/');

    // Handle URL-encoded characters in the object key
    const decodedObjectKey = decodeURIComponent(objectKey);

    return { bucket, objectKey: decodedObjectKey };
  } catch {
    return null;
  }
}

export function extractTrustedSupabaseStorageObject(
  url: string,
  expectedBucket: string
): { bucket: string; objectKey: string } | null {
  try {
    const candidate = new URL(url);
    const trusted = new URL(SUPABASE_URL);
    if (candidate.protocol !== 'https:' || candidate.host !== trusted.host) {
      return null;
    }
    const parsed = extractBucketAndKeyFromSupabaseUrl(url);
    if (!parsed || parsed.bucket !== expectedBucket || !parsed.objectKey) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Creates an optimized version for preview display
 */
export function createPreviewUrl(originalUrl: string): string {
  // If it's already a Supabase URL with transforms or tokens, return as-is
  const hasTransforms =
    originalUrl.includes('width=') || originalUrl.includes('height=');
  const hasSignedToken =
    originalUrl.includes('token=') || originalUrl.includes('Signature=');

  if (hasTransforms || hasSignedToken) {
    return originalUrl;
  }

  // Add transformation parameters for preview
  const params = new URLSearchParams();
  params.append('width', '400');
  params.append('quality', '80');
  params.append('format', 'auto');
  params.append('resize', 'contain');

  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${params.toString()}`;
}

/**
 * Creates a thumbnail version of the image URL
 */
export function createThumbnailUrl(
  originalUrl: string,
  size: number = 150
): string {
  const hasTransforms =
    originalUrl.includes('width=') || originalUrl.includes('height=');
  const hasSignedToken =
    originalUrl.includes('token=') || originalUrl.includes('Signature=');

  if (hasTransforms || hasSignedToken) {
    return originalUrl;
  }

  const params = new URLSearchParams();
  params.append('width', size.toString());
  params.append('height', size.toString());
  params.append('quality', '70');
  params.append('format', 'auto');
  params.append('resize', 'cover');

  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${params.toString()}`;
}

/**
 * Creates a full-screen optimized version
 */
export function createFullScreenUrl(originalUrl: string): string {
  const hasTransforms =
    originalUrl.includes('width=') || originalUrl.includes('height=');
  const hasSignedToken =
    originalUrl.includes('token=') || originalUrl.includes('Signature=');

  if (hasTransforms || hasSignedToken) {
    return originalUrl;
  }

  const params = new URLSearchParams();
  params.append('width', '1200');
  params.append('quality', '85');
  params.append('format', 'auto');
  params.append('resize', 'contain');

  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}${params.toString()}`;
}

/**
 * Hook for managing image URLs with transformations
 */
export const useOptimizedImage = (originalUrl: string | null) => {
  if (!originalUrl) {
    return {
      thumbnailUrl: null,
      previewUrl: null,
      fullScreenUrl: null,
      originalUrl: null,
    };
  }

  return {
    thumbnailUrl: createThumbnailUrl(originalUrl),
    previewUrl: createPreviewUrl(originalUrl),
    fullScreenUrl: createFullScreenUrl(originalUrl),
    originalUrl,
  };
};

const imageDebugLog = (..._args: unknown[]) => {};

export const ImageService = {
  /**
   * Upload raw data or base64 string to a bucket – returns objectKey (path inside bucket)
   * Based on official Supabase React Native storage tutorial + GitHub issue fixes
   */
  async upload(
    bucket: StorageBucket,
    objectKey: string,
    file: Blob | string,
    contentType: string
  ): Promise<string> {
    const bucketName = STORAGE_BUCKETS[bucket];

    imageDebugLog(
      `🚀 Uploading to bucket: ${bucketName}, objectKey: ${objectKey}, contentType: ${contentType}`
    );
    imageDebugLog(`📱 Platform: ${Platform.OS}`);

    // Verify authentication before upload (critical for mobile)
    // Following best practices: Use auth store instead of direct getSession()
    const { user, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) {
      console.error(
        `🔐 Authentication error (${Platform.OS}): User not authenticated`
      );
      throw new Error(
        `Authentication required for file upload on ${Platform.OS}`
      );
    }
    imageDebugLog(`✅ Auth verified (${Platform.OS}): User ${user.id}`);

    let uploadData: any;
    let uploadOptions: any = {
      contentType,
      upsert: false,
      cacheControl: '3600',
    };

    if (Platform.OS === 'web') {
      // Web platform - handle Blobs and data URLs
      if (typeof file === 'string') {
        if (file.startsWith('data:')) {
          // Data URL - convert to blob
          const response = await fetch(file);
          uploadData = await response.blob();
        } else {
          // Raw base64 - convert to blob
          try {
            const binaryString = globalThis.atob(file);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            uploadData = new Blob([bytes], { type: contentType });
          } catch (error) {
            console.error('Error processing base64 data:', error);
            throw new Error('Invalid base64 data format');
          }
        }
      } else {
        uploadData = file; // Already a Blob
      }
    } else {
      // React Native platform - use proven GitHub issue fix pattern
      if (typeof file === 'string') {
        imageDebugLog(
          `📤 Converting base64 to ArrayBuffer (${Platform.OS})...`
        );
        imageDebugLog(`🔤 Base64 input analysis:`, {
          length: file.length,
          firstChars: file.substring(0, 30),
          lastChars: file.substring(file.length - 30),
          platform: Platform.OS,
          hasValidBase64Chars: /^[A-Za-z0-9+/=]*$/.test(file),
          endsWithPadding: file.endsWith('=') || file.endsWith('=='),
        });

        // Validate base64 string quality (prevents zero byte uploads)
        if (!file || file.length < 100) {
          throw new Error(`${Platform.OS}: Base64 string too short or empty`);
        }

        if (!/^[A-Za-z0-9+/=]*$/.test(file)) {
          throw new Error(`${Platform.OS}: Invalid base64 characters detected`);
        }

        try {
          // Use the official Supabase pattern: decode base64 to ArrayBuffer
          const startTime = Date.now();
          uploadData = decode(file);
          const decodeTime = Date.now() - startTime;

          imageDebugLog(`✅ Decoded to ArrayBuffer (${Platform.OS}):`, {
            arrayBufferSize: uploadData.byteLength,
            decodeTimeMs: decodeTime,
            isValidArrayBuffer: uploadData instanceof ArrayBuffer,
            firstBytes: new Uint8Array(uploadData.slice(0, 10)),
            platform: Platform.OS,
          });

          // Critical validation to prevent zero byte uploads
          if (uploadData.byteLength === 0) {
            throw new Error(
              `${Platform.OS}: Decoded ArrayBuffer is empty - this would result in zero byte upload`
            );
          }

          if (uploadData.byteLength < 1000) {
            console.warn(
              `⚠️ ${Platform.OS}: Small ArrayBuffer (${uploadData.byteLength} bytes) - verify image quality`
            );
          }

          // Additional Android-specific checks based on GitHub issues
          if (Platform.OS === 'android') {
            imageDebugLog(`🤖 Android-specific validation:`, {
              byteLength: uploadData.byteLength,
              isValidSize: uploadData.byteLength > 1000,
              constructor: uploadData.constructor.name,
              authState: isAuthenticated ? 'authenticated' : 'unauthenticated',
            });
          }
        } catch (error: any) {
          console.error(
            `❌ Error decoding base64 to ArrayBuffer (${Platform.OS}):`,
            {
              error: error.message,
              errorType: error.constructor.name,
              platform: Platform.OS,
              base64Length: file.length,
              base64Sample: file.substring(0, 100),
            }
          );
          throw new Error(
            `${Platform.OS}: Invalid base64 data format - ${error.message}`
          );
        }
      } else {
        throw new Error(
          `${Platform.OS}: React Native platform only supports base64 string uploads`
        );
      }

      // Remove the decode option since we're uploading ArrayBuffer directly
      delete uploadOptions.decode;
    }

    imageDebugLog(`📤 Upload data type: ${typeof uploadData}`);
    imageDebugLog(`⚙️ Upload options:`, uploadOptions);

    // Add retry logic for network issues (common on mobile)
    let lastError: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        imageDebugLog(`🔄 Upload attempt ${attempt}/3 (${Platform.OS})`);

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(objectKey, uploadData, uploadOptions);

        if (error) {
          console.error(
            `❌ Supabase upload error attempt ${attempt} (${Platform.OS}):`,
            error
          );
          lastError = error;

          // Don't retry on certain errors
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('not found')
          ) {
            throw error;
          }

          if (attempt < 3) {
            imageDebugLog(`⏳ Retrying upload in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
        } else {
          imageDebugLog(
            `✅ Upload successful on attempt ${attempt} (${Platform.OS}):`,
            data
          );
          return objectKey;
        }
      } catch (networkError: any) {
        console.error(
          `🌐 Network error on attempt ${attempt} (${Platform.OS}):`,
          networkError
        );
        lastError = networkError;

        if (attempt < 3) {
          imageDebugLog(
            `⏳ Retrying after network error in ${attempt * 1000}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }

    // All attempts failed
    throw (
      lastError ||
      new Error(`Failed to upload after 3 attempts on ${Platform.OS}`)
    );
  },

  /**
   * Always returns a fresh signed URL, cached for the given ttl (seconds)
   */
  async getSignedUrl(
    bucket: StorageBucket,
    objectKey: string,
    transform?: ImageTransform,
    ttlSeconds: number = 60 * 60 * 6 // 6 h
  ): Promise<string> {
    // Check cache first
    const key = cacheKey(bucket, objectKey, transform);
    const cached = cache.get(key);
    if (cached) return cached;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .createSignedUrl(
        objectKey,
        ttlSeconds,
        transform ? { transform } : undefined
      );

    if (error || !data?.signedUrl) {
      throw error || new Error('Failed to sign URL');
    }

    cache.set(key, data.signedUrl, { ttl: ttlSeconds * 1000 });
    return data.signedUrl;
  },
};
