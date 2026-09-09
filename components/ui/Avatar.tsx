import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/constants/ThemeContext';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { useMomentaStore } from '@/store/momenta-store';
import { getAvatarFrameAppearance } from '@/lib/shop/catalogSupport';

interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  online?: boolean;
  frameSku?: string | null;
  testID?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 40,
  style,
  showBorder = false,
  borderColor,
  borderWidth = 2,
  online,
  frameSku,
  testID,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const { equippedItems, equippedItemSkus } = useMomentaStore();

  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string' || name.length === 0) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name?: string): string => {
    const safeName = name || '?';
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const fills = [mentaColors.surface, mentaColors.raised, mentaColors.border];

    return fills[Math.abs(hash) % fills.length];
  };

  const avatarSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const equippedFrame =
    frameSku ||
    equippedItemSkus?.avatar_frame ||
    equippedItemSkus?.avatar_skin ||
    equippedItems?.avatar_frame ||
    equippedItems?.avatar_skin;
  const frame = getAvatarFrameAppearance(equippedFrame);
  const ringWidth = frame?.width || (showBorder ? borderWidth : 0);
  const innerSize = Math.max(size - ringWidth * 2, 1);

  const fontSize = size * 0.4;

  const initials = getInitials(name);
  const avatarBackground = getAvatarColor(name);

  const avatarStyle = [
    styles.container,
    avatarSize,
    ringWidth > 0 && !frame?.gradientColors
      ? {
          borderWidth: ringWidth,
          borderColor: frame?.borderColor || borderColor || colors.text.inverse,
        }
      : null,
    style,
  ];

  const textStyle = [
    styles.initials,
    {
      fontSize: Math.max(fontSize - ringWidth, 10),
      color: mentaColors.text.primary,
    },
  ];

  return (
    <View style={avatarStyle} testID={testID}>
      {frame?.gradientColors ? (
        <LinearGradient
          colors={frame.gradientColors}
          style={[styles.gradientBorder, avatarSize]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      ) : null}

      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
          onError={() => {
            console.warn('[Avatar] Failed to load image:', source);
          }}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              backgroundColor: avatarBackground,
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Text style={textStyle}>{initials}</Text>
        </View>
      )}

      {frame?.artworkSource ? (
        <Image
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          resizeMode="contain"
          source={frame.artworkSource}
          style={[styles.frameArtwork, avatarSize]}
          testID={
            equippedFrame ? `avatar-frame-artwork-${equippedFrame}` : undefined
          }
        />
      ) : null}

      {online !== undefined && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: Math.max(size * 0.22, 8),
              height: Math.max(size * 0.22, 8),
              backgroundColor: online
                ? colors.status.success
                : colors.background.tertiary,
              borderWidth: Math.max(size * 0.04, 2),
              borderColor: colors.background.primary,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    resizeMode: 'cover',
  },
  frameArtwork: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 3,
    borderRadius: 100,
    borderColor: '#000',
  },
});
