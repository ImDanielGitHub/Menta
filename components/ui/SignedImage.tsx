import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image as RNImage, Platform } from 'react-native';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import {
  ImageService,
  ImageTransform,
  StorageBucket,
  extractBucketAndKeyFromSupabaseUrl,
} from '@/lib/image-service';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { captureError as sentryCapture } from '@/lib/sentry';
import { useTranslation } from '@/lib/localization/use-translation';

export type ImageVariant = 'thumb' | 'preview' | 'full';

interface SignedImageProps extends Omit<ExpoImageProps, 'source'> {
  // ––– Option A: bucket + objectKey –––
  bucket?: StorageBucket;
  objectKey?: string;
  // ––– Option B: already have a full Supabase URL (public or signed) –––
  uri?: string;
  variant?: ImageVariant;
  fallbackText?: string;
  // Performance optimizations
  lazy?: boolean;
  showSkeleton?: boolean;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  // Accessibility
  alt?: string;
  /** Low-cardinality lifecycle only; never receives a URI or object key. */
  onLoadStateChange?: (state: 'loading' | 'ready' | 'error') => void;
}

const transformForVariant: Record<ImageVariant, ImageTransform | undefined> = {
  thumb: { width: 150, height: 150, resize: 'cover', quality: 70 },
  preview: { width: 400, resize: 'contain', quality: 80 },
  full: { width: 1200, resize: 'contain', quality: 85 },
};

const SignedImageComponent = ({
  bucket,
  objectKey,
  uri,
  variant = 'preview',
  style,
  fallbackText,
  lazy = false,
  showSkeleton: _showSkeleton = true,
  cachePolicy = 'memory-disk',
  alt,
  onLoadStateChange,
  contentFit = 'cover',
  ...expoProps
}: SignedImageProps) => {
  const { t } = useTranslation();
  const resolvedFallbackText = fallbackText ?? t('shared.image.notAvailable');
  const resolvedAlt = alt ?? t('shared.image.alt');

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!lazy); // Don't load immediately if lazy
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const [retryKey, setRetryKey] = useState(0);
  const displayedRef = useRef(false);
  const loadStateCallbackRef = useRef(onLoadStateChange);
  loadStateCallbackRef.current = onLoadStateChange;
  const notifyLoadState = useCallback(
    (state: 'loading' | 'ready' | 'error') =>
      loadStateCallbackRef.current?.(state),
    []
  );

  // Map a Supabase bucket string (either key or name) to our StorageBucket key
  const resolveBucketKey = (bucketOrName: string): StorageBucket => {
    // If already a key, return as-is
    if (Object.prototype.hasOwnProperty.call(STORAGE_BUCKETS, bucketOrName))
      return bucketOrName as StorageBucket;
    // Otherwise find the key by matching the name value
    const entry = (
      Object.entries(STORAGE_BUCKETS) as [StorageBucket, string][]
    ).find(([_, name]) => name === bucketOrName);
    return (entry?.[0] ?? 'CHALLENGE_VERIFICATIONS') as StorageBucket;
  };

  useEffect(() => {
    if (!shouldLoad) return; // Skip if lazy loading and not triggered

    let cancelled = false;

    async function sign() {
      try {
        setLoading(true);
        setError(false);
        notifyLoadState('loading');

        let url: string | null = null;

        if (bucket && objectKey) {
          url = await ImageService.getSignedUrl(
            bucket,
            objectKey,
            transformForVariant[variant]
          );
        } else if (uri && uri.trim()) {
          // Check if uri is just a storage key (no protocol/domain)
          if (!uri.includes('://')) {
            // URI is a storage key, use challenge-verifications bucket
            url = await ImageService.getSignedUrl(
              'CHALLENGE_VERIFICATIONS',
              uri,
              transformForVariant[variant]
            );
          } else {
            // Try to parse bucket/key from full URL so we can re-sign (handles expired tokens)
            const parsed = extractBucketAndKeyFromSupabaseUrl(uri);
            if (parsed) {
              const bucketKey = resolveBucketKey(parsed.bucket);
              url = await ImageService.getSignedUrl(
                bucketKey,
                parsed.objectKey,
                transformForVariant[variant]
              );
            } else {
              // Check if it's a Supabase public URL that needs signing
              if (
                uri.includes('supabase.co') &&
                uri.includes('/storage/v1/object/public/')
              ) {
                // Extract bucket and object key from public URL
                const publicUrlMatch = uri.match(
                  /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/
                );
                if (publicUrlMatch) {
                  const [, bucketName, objectKey] = publicUrlMatch;
                  const bucketKey = resolveBucketKey(bucketName);
                  url = await ImageService.getSignedUrl(
                    bucketKey,
                    objectKey,
                    transformForVariant[variant]
                  );
                } else {
                  url = uri; // fallback
                }
              } else {
                // not a supabase URL – just use as is
                url = uri;
              }
            }
          }
        }

        if (!cancelled) {
          setSignedUrl(url);
          if (!url) {
            setError(true);
            setLoading(false);
            notifyLoadState('error');
          }
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
          notifyLoadState('error');
          sentryCapture(new Error('Signed image URL preparation failed'), {
            context: 'signed_image_url',
            source_kind: bucket && objectKey ? 'storage_object' : 'uri',
          });
        }
      }
    }

    sign();
    return () => {
      cancelled = true;
    };
  }, [bucket, notifyLoadState, objectKey, retryKey, shouldLoad, uri, variant]);

  // Trigger lazy loading
  const triggerLoad = () => {
    if (lazy && !shouldLoad) {
      setShouldLoad(true);
    }
  };

  // Show skeleton or placeholder while lazy loading
  if (lazy && !shouldLoad) {
    return (
      <View style={[style, styles.frame]}>
        <ImagePlaceholder
          state="idle"
          label={t('shared.image.tapToLoad')}
          onPress={triggerLoad}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[style, styles.frame]}>
        <ImagePlaceholder
          state="error"
          label={resolvedFallbackText}
          onPress={() => {
            displayedRef.current = false;
            setError(false);
            setLoading(true);
            setSignedUrl(null);
            setRetryKey(value => value + 1);
          }}
        />
      </View>
    );
  }

  const handleImageError = (_message?: string) => {
    setError(true);
    notifyLoadState('error');
    sentryCapture(new Error('Signed image display failed'), {
      context: 'signed_image_load',
    });
  };

  const handleImageReady = () => {
    displayedRef.current = true;
    setLoading(false);
    notifyLoadState('ready');
  };

  return (
    <View style={[style, styles.frame]}>
      {signedUrl ? (
        Platform.OS === 'android' ? (
          <RNImage
            accessibilityLabel={resolvedAlt}
            onError={event => handleImageError(event.nativeEvent.error)}
            onLoad={handleImageReady}
            onLoadStart={() => {
              if (displayedRef.current) return;
              setLoading(true);
              notifyLoadState('loading');
            }}
            resizeMode={
              contentFit === 'contain'
                ? 'contain'
                : contentFit === 'fill'
                  ? 'stretch'
                  : contentFit === 'cover'
                    ? 'cover'
                    : 'center'
            }
            source={{ uri: signedUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <ExpoImage
            {...expoProps}
            alt={resolvedAlt}
            cachePolicy={cachePolicy}
            contentFit={contentFit}
            onError={event => handleImageError(event.error)}
            onDisplay={handleImageReady}
            onLoadStart={() => {
              if (displayedRef.current) return;
              setLoading(true);
              notifyLoadState('loading');
            }}
            source={{ uri: signedUrl }}
            style={StyleSheet.absoluteFill}
          />
        )
      ) : null}
      {loading && (
        <ImagePlaceholder label={t('shared.accessibility.loadingImage')} />
      )}
    </View>
  );
};

export const SignedImage = memo((props: SignedImageProps) => (
  <SignedImageComponent
    key={JSON.stringify([
      props.bucket,
      props.objectKey,
      props.uri,
      props.variant,
    ])}
    {...props}
  />
));
SignedImage.displayName = 'SignedImage';

const styles = StyleSheet.create({ frame: { overflow: 'hidden' } });
