import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import {
  type ImageStyle,
  StyleSheet,
  type StyleProp,
  Text,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import type { EventAlbumItem } from '@/types/event';
import { translate, useTranslation } from '@/lib/localization';

type EventAlbumMosaicProps = {
  items: readonly EventAlbumItem[];
  onImageError?: (postId: string) => void;
};

const AlbumImage = ({
  item,
  style,
  onImageError,
  locale,
}: {
  item: EventAlbumItem;
  style: StyleProp<ImageStyle>;
  onImageError?: (postId: string) => void;
  locale: string;
}) => {
  const { styles } = useMentaStyles(createPaletteStyles);
  return (
    <ExpoImage
      accessibilityLabel={translate(
        locale,
        'events.album.photo_accessibility',
        {
          attendee: item.attendeeUsername,
        }
      )}
      cachePolicy="memory"
      contentFit="cover"
      onError={() => onImageError?.(item.postId)}
      source={{ uri: item.mediaPreviewUrl }}
      style={[styles.image, style]}
      testID={`event-album-image-${item.postId}`}
    />
  );
};

/**
 * Paper's 226×198 + 108×95 album composition, rendered only when signed
 * server media exists. One- and two-image albums expand rather than showing
 * decorative placeholders for moments that do not exist.
 */
export const EventAlbumMosaic = ({
  items,
  onImageError,
}: EventAlbumMosaicProps) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { locale } = useTranslation();
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <AlbumImage
        item={items[0]}
        locale={locale}
        onImageError={onImageError}
        style={styles.single}
      />
    );
  }

  if (items.length === 2) {
    return (
      <View style={styles.twoUp}>
        {items.map(item => (
          <AlbumImage
            key={item.postId}
            item={item}
            locale={locale}
            onImageError={onImageError}
            style={styles.half}
          />
        ))}
      </View>
    );
  }

  const remaining = items.length - 3;
  return (
    <View style={styles.mosaic} testID="event-album-mosaic">
      <AlbumImage
        item={items[0]}
        locale={locale}
        onImageError={onImageError}
        style={styles.lead}
      />
      <View style={styles.stack}>
        <AlbumImage
          item={items[1]}
          locale={locale}
          onImageError={onImageError}
          style={styles.small}
        />
        <View style={styles.stackItem}>
          <AlbumImage
            item={items[2]}
            locale={locale}
            onImageError={onImageError}
            style={styles.small}
          />
          {remaining > 0 ? (
            <View
              accessible
              accessibilityLabel={translate(
                locale,
                'events.album.more_accessibility',
                {
                  count: remaining,
                }
              )}
              accessibilityRole="text"
              style={styles.remaining}
              testID="event-album-more-count"
            >
              <Text style={styles.remainingText}>+{remaining}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    image: {
      backgroundColor: mentaColors.surface,
      borderRadius: mentaRadii.small,
    },
    single: {
      aspectRatio: 342 / 198,
      width: '100%',
    },
    twoUp: {
      aspectRatio: 342 / 198,
      flexDirection: 'row',
      gap: mentaSpacing[2],
      width: '100%',
    },
    half: {
      flex: 1,
      height: '100%',
    },
    mosaic: {
      aspectRatio: 342 / 198,
      flexDirection: 'row',
      gap: mentaSpacing[2],
      width: '100%',
    },
    lead: {
      flex: 226,
      height: '100%',
    },
    stack: {
      flex: 108,
      gap: mentaSpacing[2],
    },
    small: {
      flex: 1,
      width: '100%',
    },
    stackItem: { flex: 1 },
    remaining: {
      alignItems: 'center',
      backgroundColor: mentaColors.scrim,
      borderRadius: mentaRadii.small,
      justifyContent: 'center',
      ...StyleSheet.absoluteFill,
    },
    remainingText: {
      ...mentaTypography.bodySemibold,
      color: mentaColors.text.primary,
    },
  });
  return { styles };
};
