import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/constants/ThemeContext';
import { AppMemberStack, AppTag } from './AppChoice';
import { useTranslation } from '@/lib/localization/use-translation';

export interface InvitePosterCardProps {
  title: string;
  subtitle: string;
  meta: string;
  badge?: string;
  footer?: string;
}

export const InvitePosterCard: React.FC<InvitePosterCardProps> = ({
  title,
  subtitle,
  meta,
  badge,
  footer,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <LinearGradient
      colors={
        theme.gradients.share.card as unknown as readonly [
          string,
          string,
          ...string[],
        ]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.poster}
    >
      <View style={styles.posterHeader}>
        <AppTag label={badge ?? t('shared.share.inviteBadge')} tone="share" />
        <Text style={[styles.posterMeta, { color: theme.colors.text.primary }]}>
          {meta}
        </Text>
      </View>
      <Text style={[styles.posterTitle, { color: theme.colors.text.primary }]}>
        {title}
      </Text>
      <Text
        style={[styles.posterSubtitle, { color: 'rgba(247, 250, 252, 0.88)' }]}
      >
        {subtitle}
      </Text>
      {footer ? (
        <Text
          style={[styles.posterFooter, { color: 'rgba(247, 250, 252, 0.8)' }]}
        >
          {footer}
        </Text>
      ) : null}
    </LinearGradient>
  );
};

export const GroupInviteCard: React.FC<{
  groupName: string;
  inviteCode: string;
  memberCount: number;
}> = ({ groupName, inviteCode, memberCount }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.detailCard,
        {
          backgroundColor: theme.colors.background.card,
          borderColor: theme.colors.border.primary,
        },
      ]}
    >
      <Text style={[styles.detailTitle, { color: theme.colors.text.primary }]}>
        {groupName}
      </Text>
      <Text style={[styles.detailMeta, { color: theme.colors.text.secondary }]}>
        {t('shared.share.members', { count: memberCount })}
      </Text>
      <Text style={[styles.code, { color: theme.colors.brand.secondary }]}>
        {inviteCode}
      </Text>
    </View>
  );
};

export const ReferralProgressCard: React.FC<{
  completed: number;
  target: number;
  reward: string;
}> = ({ completed, target, reward }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const progress = t('shared.share.progress', { completed, target });
  return (
    <View
      style={[
        styles.detailCard,
        {
          backgroundColor: theme.colors.background.card,
          borderColor: theme.colors.border.primary,
        },
      ]}
    >
      <Text style={[styles.detailTitle, { color: theme.colors.text.primary }]}>
        {t('shared.share.referralProgress')}
      </Text>
      <Text style={[styles.detailMeta, { color: theme.colors.text.secondary }]}>
        {t('shared.share.referralDescription')}
      </Text>
      <View style={styles.progressRow}>
        <Text style={[styles.code, { color: theme.colors.brand.primary }]}>
          {progress}
        </Text>
        <Text style={[styles.reward, { color: theme.colors.text.primary }]}>
          {reward}
        </Text>
      </View>
    </View>
  );
};

export const StreakMilestoneCard: React.FC<{
  title: string;
  dayCount: number;
  subtitle: string;
  badge?: string;
}> = ({ title, dayCount, subtitle, badge }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={
        theme.gradients.streak.highlight as unknown as readonly [
          string,
          string,
          ...string[],
        ]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.poster}
    >
      <View style={styles.posterHeader}>
        <AppTag
          label={badge ?? t('shared.share.milestoneBadge')}
          tone="streak"
        />
        <Text style={[styles.posterMeta, { color: theme.colors.text.inverse }]}>
          {t('shared.share.day', { day: dayCount })}
        </Text>
      </View>
      <Text style={[styles.posterTitle, { color: theme.colors.text.inverse }]}>
        {title}
      </Text>
      <Text style={[styles.posterSubtitle, { color: 'rgba(7, 9, 11, 0.76)' }]}>
        {subtitle}
      </Text>
    </LinearGradient>
  );
};

export const ProofReceiptCard: React.FC<{
  title: string;
  proofType: string;
  dayLabel: string;
  groupName?: string;
}> = ({ title, proofType, dayLabel, groupName }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.detailCard,
        {
          backgroundColor: theme.colors.background.card,
          borderColor: theme.colors.border.primary,
        },
      ]}
    >
      <AppTag label={t('shared.share.proofPosted')} tone="success" />
      <Text
        style={[
          styles.detailTitle,
          { color: theme.colors.text.primary, marginTop: 14 },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.detailMeta, { color: theme.colors.text.secondary }]}>
        {groupName
          ? t('shared.share.proofMetaWithGroup', {
              proof: proofType,
              day: dayLabel,
              group: groupName,
            })
          : t('shared.share.proofMeta', {
              proof: proofType,
              day: dayLabel,
            })}
      </Text>
    </View>
  );
};

export const ProofSharePreviewCard: React.FC<{
  dayCount: number;
  title: string;
  subtitle: string;
  meta?: string;
  badge?: string;
}> = ({ dayCount, title, subtitle, meta, badge }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedMeta = meta ?? t('shared.share.inviteBadge');
  const resolvedBadge = badge ?? t('shared.share.proofReceipt');

  return (
    <LinearGradient
      colors={
        theme.gradients.share.card as unknown as readonly [
          string,
          string,
          ...string[],
        ]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.proofShareCard,
        {
          borderColor: theme.colors.border.secondary,
        },
      ]}
    >
      <View style={styles.posterHeader}>
        <Text
          style={[styles.proofShareLabel, { color: theme.colors.text.primary }]}
        >
          {resolvedMeta}
        </Text>
        <Text
          style={[
            styles.proofShareBadge,
            { color: theme.colors.status.success },
          ]}
        >
          {resolvedBadge}
        </Text>
      </View>
      <View>
        <Text
          style={[styles.proofShareDays, { color: theme.colors.text.primary }]}
        >
          {dayCount}
        </Text>
        <Text
          style={[styles.proofShareTitle, { color: theme.colors.text.primary }]}
        >
          {title}
        </Text>
      </View>
      <Text
        style={[
          styles.proofShareSubtitle,
          { color: theme.colors.text.secondary },
        ]}
      >
        {subtitle}
      </Text>
    </LinearGradient>
  );
};

export const GroupSnapshotCard: React.FC<{
  groupName: string;
  memberCount: number;
  streakDays: number;
  names?: string[];
}> = ({ groupName, memberCount, streakDays, names = [] }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.detailCard,
        {
          backgroundColor: theme.colors.background.card,
          borderColor: theme.colors.border.primary,
        },
      ]}
    >
      <Text style={[styles.detailTitle, { color: theme.colors.text.primary }]}>
        {groupName}
      </Text>
      <Text style={[styles.detailMeta, { color: theme.colors.text.secondary }]}>
        {t('shared.share.groupStreak', {
          members: memberCount,
          days: streakDays,
        })}
      </Text>
      <View style={styles.snapshotRow}>
        <AppMemberStack names={names} />
        <Text style={[styles.reward, { color: theme.colors.text.primary }]}>
          {t('shared.share.groupLabel')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  poster: {
    minHeight: 220,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  posterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  posterMeta: {
    fontSize: 13,
    fontWeight: '600',
  },
  posterTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
    marginTop: 12,
  },
  posterSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 10,
  },
  posterFooter: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  detailMeta: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  proofShareCard: {
    minHeight: 220,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  proofShareLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  proofShareBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  proofShareDays: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '900',
  },
  proofShareTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  proofShareSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  code: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  reward: {
    fontSize: 14,
    fontWeight: '600',
  },
});
