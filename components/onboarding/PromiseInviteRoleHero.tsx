import React from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';

import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import type { PromiseAccountabilityRole } from '@/lib/promises/accountability';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

const roleArtwork: Record<PromiseAccountabilityRole, ImageSourcePropType> = {
  partner: require('@/assets/images/mascot/roles/do-it-together.png'),
  reviewer: require('@/assets/images/mascot/roles/reviewer.png'),
  supporter: require('@/assets/images/mascot/roles/supporter.png'),
};

type PromiseInviteRoleHeroProps = {
  role: PromiseAccountabilityRole;
  title: string;
  detail: string;
  compact?: boolean;
  showCopy?: boolean;
  testID?: string;
};

export function PromiseInviteRoleHero({
  role,
  title,
  detail,
  compact = false,
  showCopy = true,
  testID = 'promise-invite-role-hero',
}: PromiseInviteRoleHeroProps) {
  const motion = useMotionPreferences();
  const entrance = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    entrance.stopAnimation();
    if (motion.reduceMotion) {
      entrance.setValue(1);
      return;
    }

    entrance.setValue(0);
    const animation = Animated.timing(entrance, {
      duration: motion.duration(190),
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, motion, role]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [motion.distance(8), 0],
  });

  return (
    <Animated.View
      accessible={showCopy}
      accessibilityLabel={showCopy ? `${title}. ${detail}` : undefined}
      importantForAccessibility={showCopy ? 'auto' : 'no'}
      style={[
        styles.shell,
        compact ? styles.shellCompact : null,
        !showCopy ? styles.shellArtOnly : null,
        { opacity: entrance, transform: [{ translateY }] },
      ]}
      testID={testID}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.artLane, compact ? styles.artLaneCompact : null]}
      >
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={roleArtwork[role]}
          style={[styles.art, compact ? styles.artCompact : null]}
        />
      </View>
      {showCopy ? (
        <View style={styles.copy}>
          <Text style={compact ? styles.titleCompact : styles.title}>
            {title}
          </Text>
          <Text style={[styles.detail, compact ? styles.detailCompact : null]}>
            {detail}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export function PromiseInviteContextLine({
  label,
  promise,
  detail,
  testID = 'promise-invite-context',
}: {
  label: string;
  promise: string;
  detail?: string | null;
  testID?: string;
}) {
  return (
    <View style={styles.context} testID={testID}>
      <Text style={styles.contextLabel}>{label}</Text>
      <Text style={styles.contextPromise}>{promise}</Text>
      {detail ? <Text style={styles.contextDetail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    gap: mentaSpacing[3],
    paddingVertical: mentaSpacing[2],
  },
  shellCompact: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingVertical: 0,
  },
  shellArtOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artLane: {
    alignItems: 'center',
    height: 178,
    justifyContent: 'center',
    width: '100%',
  },
  artLaneCompact: {
    flexShrink: 0,
    height: 108,
    width: 104,
  },
  art: {
    height: 178,
    width: 190,
  },
  artCompact: {
    height: 108,
    width: 104,
  },
  copy: {
    flex: 1,
    gap: mentaSpacing[1],
    minWidth: 0,
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    textAlign: 'center',
  },
  titleCompact: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    maxWidth: 342,
    textAlign: 'center',
  },
  detailCompact: {
    textAlign: 'left',
  },
  context: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[1],
    paddingVertical: mentaSpacing[4],
  },
  contextLabel: {
    ...mentaTypography.label,
    color: mentaColors.action,
  },
  contextPromise: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  contextDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
});
