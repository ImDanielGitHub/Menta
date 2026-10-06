import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MentaMascot } from '@/components/ui/MentaMascot';

import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';
import { mentaFonts } from '@/lib/menta-fonts';
import { useReferralStore } from '@/store/referral-store';

/**
 * Paper 19 / Y01: the Menta referral sits right under your name. The reward
 * line appears only while the server says rewards are active and uncapped.
 */
export function ProfileInviteCard({ onInvite }: { onInvite: () => void }) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const getProgramme = useReferralStore(
    state => state.getReferralProgramStatus
  );
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);

  useEffect(() => {
    let current = true;
    void getProgramme()
      .then(status => {
        if (!current) return;
        const earning =
          status.programmeEnabled &&
          status.rewardAmount > 0 &&
          status.inviterRewardsThisYear < status.inviterAnnualCap;
        setRewardAmount(earning ? status.rewardAmount : null);
      })
      .catch(() => {
        /* The card still works without the reward line. */
      });
    return () => {
      current = false;
    };
  }, [getProgramme]);

  const body =
    rewardAmount !== null
      ? t('fullAuth.tabs_profile.invite_reward', {
          amount: rewardAmount.toLocaleString(),
        })
      : t('fullAuth.tabs_profile.invite_body');

  return (
    <Pressable
      accessibilityHint={t(
        'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te'
      )}
      accessibilityLabel={t('fullAuth.tabs_profile.invite_accessibility', {
        title: t('fullAuth.tabs_profile.invite_title'),
        body,
      })}
      accessibilityRole="button"
      onPress={onInvite}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.accent.primary },
        pressed && isDark ? styles.pressed : null,
      ]}
      testID="profile-invite-card"
    >
      {({ pressed }) => (
        <>
          <View
            testID="profile-invite-wash"
            style={[styles.wash, { opacity: isDark ? 0.18 : 0.06 }]}
          />
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.onPrimary }]}>
              {t('fullAuth.tabs_profile.invite_title')}
            </Text>
            <Text style={[styles.body, { color: colors.onPrimary }]}>
              {body}
            </Text>
            <View
              style={[
                styles.action,
                pressed && !isDark ? styles.actionPressed : null,
              ]}
              testID="profile-invite-action"
            >
              <Text style={styles.actionText}>
                {t('fullAuth.tabs_profile.invite_action')}
              </Text>
            </View>
          </View>
          <MentaMascot
            size="xl"
            state="referral-invitation"
            style={styles.mascot}
          />
        </>
      )}
    </Pressable>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    card: {
      borderRadius: 22,
      flexDirection: 'row',
      marginBottom: mentaSpacing[2],
      minHeight: 190,
      overflow: 'hidden',
      padding: mentaSpacing[5],
    },
    // A soft lift toward the top-left, in place of a gradient dependency.
    wash: {
      backgroundColor: mentaColors.paper,
      borderRadius: mentaRadii.round,
      height: 260,
      left: -90,
      position: 'absolute',
      top: -140,
      width: 260,
    },
    pressed: {
      opacity: 0.9,
    },
    copy: {
      flex: 1,
      gap: mentaSpacing[2],
      maxWidth: 240,
      zIndex: 1,
    },
    title: {
      fontFamily: mentaFonts.newsreader.semibold,
      fontSize: 26,
      letterSpacing: -0.5,
      lineHeight: 30,
    },
    body: {
      fontFamily: mentaFonts.inter.regular,
      fontSize: 15,
      lineHeight: 21,
    },
    action: {
      alignSelf: 'flex-start',
      backgroundColor: mentaColors.text.onPaper,
      borderRadius: 14,
      marginTop: mentaSpacing[2],
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: mentaSpacing[4],
    },
    actionPressed: {
      backgroundColor: mentaColors.actionPressed,
    },
    actionText: {
      color: mentaColors.paper,
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 15,
    },
    mascot: {
      bottom: -12,
      position: 'absolute',
      right: -14,
    },
  });
  return { styles };
};
