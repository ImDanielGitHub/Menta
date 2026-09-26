import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FreezeSlots } from '@/components/shop/FreezeSlots';
import { AppButton } from '@/components/ui/AppButton';
import { MentaMascot } from '@/components/ui/MentaMascot';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { CoachSnoozeControl } from '@/components/streak/CoachSnoozeControl';
import { ProofDueCountdown } from '@/components/streak/ProofDueCountdown';
import { useTranslation } from '@/lib/localization';

interface AtRiskBannerProps {
  visible: boolean;
  freezeCount: number;
  currentStreak?: number | null;
  queuedOnDevice?: boolean;
  submitLoading?: boolean;
  localDay?: string | null;
  timeZone?: string | null;
  preferredReminderTime?: string | null;
  promiseLabel?: string | null;
  onSubmitProof: () => void;
  onOpenFreezes: () => void;
  /** Offered instead of opening items when no freeze is held. */
  onGetFreeze?: (() => void) | null;
  onRemindLater?: (() => void | Promise<void>) | null;
}

export const AtRiskBanner: React.FC<AtRiskBannerProps> = ({
  visible,
  freezeCount,
  currentStreak,
  queuedOnDevice = false,
  submitLoading = false,
  localDay,
  timeZone,
  preferredReminderTime,
  promiseLabel,
  onSubmitProof,
  onOpenFreezes,
  onGetFreeze = null,
  onRemindLater = null,
}) => {
  const { t } = useTranslation();
  if (!visible) return null;

  const streakSentence =
    typeof currentStreak === 'number' && currentStreak > 0
      ? t('todayProof.streak.at_risk_streak', { count: currentStreak })
      : '';
  const freezeSentence =
    freezeCount > 0
      ? t('todayProof.streak.at_risk_freezes', { count: freezeCount })
      : '';

  return (
    <View style={styles.section}>
      <View style={styles.heroRow}>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{t('todayProof.streak.proof_due')}</Text>
          <Text style={styles.copy}>
            {t('todayProof.streak.at_risk_copy', {
              streakSentence,
              freezeSentence,
            })}
          </Text>
        </View>
        <MentaMascot state="risk-peek" size="sm" style={styles.mascot} />
      </View>

      <ProofDueCountdown
        visible={Boolean(localDay && timeZone)}
        localDay={localDay}
        timeZone={timeZone}
        preferredReminderTime={preferredReminderTime}
        promiseLabel={promiseLabel}
      />

      <AppButton
        title={t('todayProof.streak.add_proof')}
        disabled={submitLoading}
        loading={submitLoading}
        onPress={onSubmitProof}
        variant="accent"
        size="large"
        fullWidth
      />

      {freezeCount > 0 ? (
        <View style={styles.freezeRow}>
          <FreezeSlots
            count={freezeCount}
            size={30}
            testID="at-risk-freeze-slots"
          />
        </View>
      ) : null}

      <AppButton
        title={
          freezeCount > 0
            ? t('todayProof.streak.view_freezes')
            : onGetFreeze
              ? t('commerce.freeze.getFirst')
              : t('todayProof.streak.open_inventory')
        }
        onPress={freezeCount > 0 || !onGetFreeze ? onOpenFreezes : onGetFreeze}
        variant="outline"
        size="large"
        fullWidth
      />

      {onRemindLater ? (
        <CoachSnoozeControl onRemindLater={onRemindLater} />
      ) : null}

      {queuedOnDevice ? (
        <View style={styles.queuedNotice}>
          <Text style={styles.queuedText}>
            {t('todayProof.streak.queued_detail')}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: mentaSpacing[6],
    marginTop: mentaSpacing[6],
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.warningBorder,
    backgroundColor: mentaColors.warningSoft,
    padding: mentaSpacing[5],
    gap: mentaSpacing[4],
  },
  heroRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.journeyTitle,
  },
  copy: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
    marginTop: mentaSpacing[2],
  },
  mascot: {
    flexShrink: 0,
    marginRight: -mentaSpacing[2],
    marginTop: -mentaSpacing[2],
  },
  freezeRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  queuedNotice: {
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.canvas,
    padding: mentaSpacing[3],
  },
  queuedText: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySmall,
  },
});
