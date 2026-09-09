import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppButton, SkeletonLoader } from '@/components/ui';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import { usePhoneLayout } from '@/constants/use-phone-layout';

export type ChallengeParticipant = {
  id: string;
  username: string;
  avatar_url?: string;
  currentStreak: number;
  joined_at: string;
};

type ChallengeParticipantsProps = {
  participants: ChallengeParticipant[];
  loading?: boolean;
  canInvite?: boolean;
  inviteLoading?: boolean;
  onInvite?: () => void;
};

export function ChallengeParticipants({
  participants,
  loading = false,
  canInvite = false,
  inviteLoading = false,
  onInvite,
}: ChallengeParticipantsProps) {
  const { t, locale } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const nameLines = useLargeTypeLineLimit(1);
  const sortedParticipants = [...participants].sort((a, b) => {
    if (b.currentStreak !== a.currentStreak) {
      return b.currentStreak - a.currentStreak;
    }
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });
  const isSoloPeople = !canInvite;

  return (
    <View
      style={[styles.section, { marginHorizontal: phoneLayout.screenInset }]}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isSoloPeople
            ? t('todayProof.promise.private')
            : t('todayProof.promise.people')}
        </Text>
        <Text style={styles.sectionCount}>
          {t('todayProof.promise.joined', { count: participants.length })}
        </Text>
      </View>

      {loading && sortedParticipants.length === 0 ? (
        <PeopleLoadingState />
      ) : sortedParticipants.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {isSoloPeople
              ? t('todayProof.promise.private_only')
              : t('todayProof.promise.no_people')}
          </Text>
          <Text style={styles.emptyText}>
            {isSoloPeople
              ? t('todayProof.promise.private_proof')
              : t('todayProof.promise.share_ready')}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sortedParticipants.map((participant, index) => {
            const joined = new Date(participant.joined_at).toLocaleDateString(
              locale,
              {
                month: 'short',
                day: 'numeric',
              }
            );

            return (
              <View key={participant.id || index} style={styles.row}>
                <Avatar
                  name={participant.username}
                  source={
                    participant.avatar_url
                      ? { uri: participant.avatar_url }
                      : undefined
                  }
                  size={42}
                />
                <View style={styles.personText}>
                  <Text style={styles.name} numberOfLines={nameLines}>
                    {participant.username}
                  </Text>
                  <Text style={styles.meta}>
                    {t('todayProof.promise.joined_on', { date: joined })}
                  </Text>
                </View>
                <Text
                  accessibilityLabel={t('todayProof.promise.day_streak', {
                    count: participant.currentStreak,
                  })}
                  style={styles.streakValue}
                >
                  {participant.currentStreak}
                  {t('todayProof.residual.d')}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {canInvite && onInvite ? (
        <AppButton
          title={
            inviteLoading
              ? t('todayProof.promise.opening_invite')
              : t('todayProof.create.invite_people')
          }
          onPress={onInvite}
          disabled={inviteLoading}
          loading={inviteLoading}
          fullWidth
          size="large"
          variant="accent"
          style={styles.inviteButton}
        />
      ) : null}
    </View>
  );
}

const PeopleLoadingState = () => {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('todayProof.promise.loading_people')}
      accessibilityRole="progressbar"
      style={styles.loadingState}
    >
      <View style={styles.loadingList}>
        {[0, 1, 2].map(item => (
          <View key={item} style={styles.loadingRow} accessible={false}>
            <SkeletonLoader
              announce={false}
              width={42}
              height={42}
              borderRadius={mentaRadii.round}
            />
            <View style={styles.loadingCopy}>
              <SkeletonLoader announce={false} width="52%" height={13} />
              <SkeletonLoader announce={false} width="36%" height={11} />
            </View>
            <SkeletonLoader announce={false} width={44} height={20} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: mentaSpacing[6],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    paddingTop: mentaSpacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: mentaSpacing[4],
    marginBottom: 10,
  },
  sectionTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    flex: 1,
  },
  sectionCount: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    textAlign: 'right',
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
    paddingVertical: 10,
  },
  personText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  name: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  meta: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: 2,
  },
  streakValue: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.secondary,
    flexShrink: 0,
    marginLeft: mentaSpacing[3],
  },
  empty: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    paddingVertical: 22,
  },
  emptyTitle: {
    ...mentaTypography.control,
    color: mentaColors.text.primary,
  },
  emptyText: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    marginTop: 6,
  },
  loadingState: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  loadingList: {
    borderTopWidth: 0,
  },
  loadingRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
    paddingVertical: 10,
  },
  loadingCopy: {
    flex: 1,
    marginLeft: 12,
    gap: 7,
  },
  inviteButton: {
    marginTop: mentaSpacing[5],
  },
});
