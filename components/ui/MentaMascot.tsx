import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  MentaMascotSheet,
  type MascotSheetRow,
} from '@/components/ui/menta-mascot-sheet';

/**
 * Menta mascot — companion at emotional transitions, never wallpaper.
 *
 * Mascot artwork is deliberately static. Earlier transform and sprite-frame
 * animation was visually unstable on devices, so every route now renders a
 * still PNG or the first frame of an explicitly selected sprite sheet.
 */
export type MascotState =
  | 'proof-proud'
  | 'celebration'
  | 'notification-bell-guide'
  | 'notification-hero'
  | 'notification-phone-guide'
  | 'momenta-gift'
  | 'referral-invitation'
  | 'first-miss-recovery'
  | 'closing-soon'
  | 'promise-confirmed'
  | 'promise-guide'
  | 'today-proof-due'
  | 'today-review-wait'
  | 'today-accepted'
  | 'today-correction'
  | 'today-at-risk'
  | 'today-clear'
  | 'pro-active'
  | 'empty-guide'
  | 'group-nudge'
  | 'quiet-anchor'
  | 'calm-warning'
  | 'risk-peek'
  | 'review-needed'
  | 'welcome-hero'
  | 'welcome-back';

const MASCOT_SPRITES: Record<MascotState, number> = {
  'proof-proud': require('@/assets/images/mascot/proof-proud.png'),
  celebration: require('@/assets/images/mascot/celebration.png'),
  'notification-bell-guide': require('@/assets/images/mascot/notification-bell-guide.png'),
  'notification-hero': require('@/assets/images/mascot/notification-hero.png'),
  'notification-phone-guide': require('@/assets/images/mascot/notification-phone-guide.png'),
  'momenta-gift': require('@/assets/images/mascot/momenta-gift.png'),
  'referral-invitation': require('@/assets/images/mascot/referral-invitation.png'),
  'first-miss-recovery': require('@/assets/images/mascot/first-miss-recovery.png'),
  'closing-soon': require('@/assets/images/mascot/closing-soon.png'),
  'promise-confirmed': require('@/assets/images/mascot/promise-confirmed.png'),
  'promise-guide': require('@/assets/images/mascot/promise-guide.png'),
  'today-proof-due': require('@/assets/images/mascot/today-proof-due.png'),
  'today-review-wait': require('@/assets/images/mascot/today-review-wait.png'),
  'today-accepted': require('@/assets/images/mascot/today-accepted.png'),
  'today-correction': require('@/assets/images/mascot/today-correction.png'),
  'today-at-risk': require('@/assets/images/mascot/today-at-risk.png'),
  'today-clear': require('@/assets/images/mascot/today-clear.png'),
  'pro-active': require('@/assets/images/mascot/proof-standard-guide.png'),
  'empty-guide': require('@/assets/images/mascot/empty-guide.png'),
  'group-nudge': require('@/assets/images/mascot/group-nudge.png'),
  'quiet-anchor': require('@/assets/images/mascot/welcome-back.png'),
  'calm-warning': require('@/assets/images/mascot/calm-warning.png'),
  'risk-peek': require('@/assets/images/mascot/calm-warning.png'),
  'review-needed': require('@/assets/images/mascot/review-needed.png'),
  'welcome-hero': require('@/assets/images/mascot/welcome-hero.png'),
  'welcome-back': require('@/assets/images/mascot/welcome-back.png'),
};

const SIZE_PRESETS = {
  sm: 56,
  md: 96,
  lg: 132,
  xl: 180,
  hero: 208,
} as const;

export type MascotSize = keyof typeof SIZE_PRESETS;
export type MascotSheetKind = MascotSheetRow | 'auto';

export type { MascotSheetRow };

type MentaMascotProps = {
  state: MascotState;
  /** sm: rows, md: empty states, lg/xl: receipts, hero: Paper Today */
  size?: MascotSize;
  /** Render the first frame of a generated sprite sheet instead of a PNG. */
  sheet?: MascotSheetKind;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function MentaMascot({
  state,
  size = 'md',
  sheet = 'auto',
  accessibilityLabel,
  style,
  testID,
}: MentaMascotProps) {
  const dimension = SIZE_PRESETS[size];
  const labelled = Boolean(accessibilityLabel);
  const usesExplicitSheet = sheet !== 'auto';

  return (
    <View
      style={[{ width: dimension, height: dimension }, style]}
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
      testID={testID ?? `menta-mascot-${state}`}
    >
      <View style={styles.image}>
        {usesExplicitSheet ? (
          <MentaMascotSheet row={sheet} />
        ) : (
          <Image
            source={MASCOT_SPRITES[state]}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
