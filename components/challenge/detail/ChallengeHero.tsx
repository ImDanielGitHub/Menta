import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PromiseArtefact } from '@/components/challenge/PromiseArtefact';
import {
  ArrowLeftIcon,
  MoreVerticalIcon,
  Share2Icon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';

type ChallengeHeroProps = {
  accentColor?: string;
  title: string;
  description?: string | null;
  onBack: () => void;
  onShare?: () => void;
  onMore: () => void;
  canShare?: boolean;
};

/**
 * What the person promised, in their own words. Schedule, review and people
 * facts belong below the task they change, not between the promise and the
 * proof action.
 */
export function ChallengeHero({
  accentColor,
  title,
  description,
  onBack,
  onShare,
  onMore,
  canShare = true,
}: ChallengeHeroProps) {
  const phoneLayout = usePhoneLayout();
  const { t } = useTranslation();
  return (
    <View style={[styles.hero, { marginHorizontal: phoneLayout.screenInset }]}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('todayProof.solo.back')}
          style={({ pressed }) => [
            styles.iconButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <ArrowLeftIcon size={21} color={mentaColors.text.primary} />
        </Pressable>
        <View style={styles.topActions}>
          {canShare && onShare ? (
            <Pressable
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel={t('todayProof.promise.share_invite')}
              style={({ pressed }) => [
                styles.iconButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Share2Icon size={19} color={mentaColors.text.primary} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onMore}
            accessibilityRole="button"
            accessibilityLabel={t('todayProof.promise.actions')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <MoreVerticalIcon size={19} color={mentaColors.text.primary} />
          </Pressable>
        </View>
      </View>
      <PromiseArtefact
        accentColor={accentColor}
        compact
        isHeading
        promise={title}
        countsWhen={description}
        testID="promise-detail-artefact"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[2],
    paddingBottom: mentaSpacing[5],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: mentaSpacing[5],
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  iconButton: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    borderRadius: mentaRadii.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    backgroundColor: mentaColors.surface,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
