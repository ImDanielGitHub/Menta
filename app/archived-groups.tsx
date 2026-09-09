import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { GroupRouteChrome } from '@/components/group/GroupRouteChrome';
import {
  GroupListSurface,
  GroupMetricStrip,
  GroupSectionHeader,
  GroupStatePanel,
} from '@/components/group/GroupAdminPrimitives';
import { AppButton, AppInlineNotice, SkeletonLoader } from '@/components/ui';
import { ChevronRightIcon, FileTextIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useAuthStore } from '@/store/auth-store';
import { type Group, useGroupStore } from '@/store/group-store';

import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
const formatArchiveDate = (value?: string | null) => {
  if (!value) return 'Archived group';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Archived group';

  return `Archived ${new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
  }).format(date)}`;
};

export default function ArchivedGroupsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { fetchArchivedGroups } = useGroupStore();
  const groupNameLines = useLargeTypeLineLimit(1);
  const archiveMetaLines = useLargeTypeLineLimit(1);
  const [archivedGroups, setArchivedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const loadArchivedGroups = useCallback(
    async ({ initial = false }: { initial?: boolean } = {}) => {
      const requestedUserId = user?.id;
      if (!requestedUserId) {
        setArchivedGroups([]);
        setArchiveError(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (initial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const groups = await fetchArchivedGroups(requestedUserId);
        if (useAuthStore.getState().user?.id !== requestedUserId) return;
        setArchivedGroups(groups);
        setArchiveError(null);
      } catch (error) {
        if (useAuthStore.getState().user?.id !== requestedUserId) return;
        setArchiveError(
          error instanceof Error
            ? error.message
            : 'Could not load archived groups.'
        );
      } finally {
        if (useAuthStore.getState().user?.id !== requestedUserId) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchArchivedGroups, user?.id]
  );

  useEffect(() => {
    void loadArchivedGroups({ initial: true });
  }, [loadArchivedGroups]);

  const returnToGroups = useCallback(() => {
    router.push('/(tabs)/groups');
  }, [router]);

  const footer = isLoading ? null : archiveError &&
    archivedGroups.length === 0 ? (
    <>
      <AppButton
        fullWidth
        loading={isRefreshing}
        onPress={() => void loadArchivedGroups()}
        title={t('groups.tab.try_again')}
      />
      <AppButton
        fullWidth
        onPress={returnToGroups}
        title={t('groups.tab.back_groups')}
        variant="ghost"
      />
    </>
  ) : archivedGroups.length === 0 ? (
    <AppButton
      fullWidth
      onPress={returnToGroups}
      title={t('groups.tab.back_groups')}
    />
  ) : null;

  return (
    <GroupRouteChrome
      description={t('groups.archive.description')}
      footer={footer}
      onBack={() => backOrReplace(router, '/(tabs)/groups')}
      testID="archived-groups-screen"
      title={t('groups.tab.archived')}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {isLoading ? (
        <ArchiveSkeleton />
      ) : archiveError && archivedGroups.length === 0 ? (
        <ArchiveUnavailable />
      ) : archivedGroups.length === 0 ? (
        <EmptyArchive />
      ) : (
        <>
          {archiveError ? (
            <AppInlineNotice
              description={t('groups.archive.stale_detail')}
              title={t('groups.archive.stale_title')}
              tone="warning"
            />
          ) : null}
          <GroupMetricStrip
            metrics={[
              {
                label: t('groups.archive.groups'),
                value: String(archivedGroups.length),
              },
              {
                label: t('groups.admin.access'),
                value: t('groups.archive.read_only'),
              },
              {
                label: t('groups.archive.order'),
                value: t('groups.archive.recent'),
              },
            ]}
            testID="archived-groups-metrics"
          />
          <View style={styles.archiveList}>
            <GroupSectionHeader
              helper={t('groups.archive.newest_first')}
              label={t('groups.archive.history')}
            />
            <GroupListSurface>
              {archivedGroups.map(group => (
                <Pressable
                  accessibilityHint={t('groups.archive.open_hint')}
                  accessibilityLabel={t('groups.archive.open_label', {
                    group: group.name,
                  })}
                  accessibilityRole="button"
                  key={group.id}
                  onPress={() => router.push(`/groups/${group.id}`)}
                  style={({ pressed }) => [
                    styles.archiveRow,
                    pressed && styles.pressed,
                  ]}
                  testID={`archived-group-${group.id}`}
                >
                  <View style={styles.archiveIcon}>
                    <FileTextIcon
                      color={mentaColors.text.secondary}
                      size={20}
                    />
                  </View>
                  <View style={styles.archiveCopy}>
                    <Text
                      numberOfLines={groupNameLines}
                      style={styles.groupName}
                    >
                      {group.name}
                    </Text>
                    <Text
                      numberOfLines={archiveMetaLines}
                      style={styles.archiveMeta}
                    >
                      {formatArchiveDate(group.archived_at)}
                    </Text>
                    <Text style={styles.readOnly}>
                      {t('groups.board.read_only')}
                    </Text>
                  </View>
                  <View style={styles.chevronLane}>
                    <ChevronRightIcon
                      color={mentaColors.text.secondary}
                      size={18}
                    />
                  </View>
                </Pressable>
              ))}
            </GroupListSurface>
          </View>
          <AppButton
            fullWidth
            loading={isRefreshing}
            onPress={() => void loadArchivedGroups()}
            title={t('groups.archive.check_again')}
            variant="outline"
          />
        </>
      )}
    </GroupRouteChrome>
  );
}

const ArchiveSkeleton = () => {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('groups.archive.loading')}
      accessibilityRole="progressbar"
      style={styles.skeletonList}
    >
      <SkeletonLoader
        announce={false}
        borderRadius={mentaRadii.large}
        height={92}
      />
      <GroupSectionHeader label={t('groups.archive.history')} />
      <GroupListSurface>
        {[130, 140, 150, 160].map((nameWidth, index) => (
          <View key={nameWidth} style={styles.skeletonRow}>
            <SkeletonLoader
              announce={index === 0}
              borderRadius={mentaRadii.medium}
              height={mentaLayout.minimumTouchTarget}
              width={mentaLayout.minimumTouchTarget}
            />
            <View style={styles.skeletonCopy}>
              <SkeletonLoader announce={false} height={13} width={nameWidth} />
              <SkeletonLoader announce={false} height={10} width={112} />
            </View>
          </View>
        ))}
      </GroupListSurface>
    </View>
  );
};

const EmptyArchive = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyArchive}>
      <View
        accessible
        accessibilityLabel={t('groups.archive.empty_label')}
        accessibilityRole="text"
        style={styles.emptyArchiveCopy}
      >
        <Text style={styles.emptyArchiveTitle}>
          {t('groups.archive.empty_title')}
        </Text>
        <Text style={styles.emptyArchiveDetail}>
          {t('groups.archive.empty_detail')}
        </Text>
      </View>
    </View>
  );
};

const ArchiveUnavailable = () => {
  const { t } = useTranslation();
  return (
    <GroupStatePanel
      detail={t('groups.list.load_failed_detail')}
      title={t('groups.archive.load_failed')}
      tone="danger"
    />
  );
};

const styles = StyleSheet.create({
  archiveList: {
    gap: mentaSpacing[3],
  },
  emptyArchive: {
    alignItems: 'flex-start',
    gap: mentaSpacing[4],
    justifyContent: 'center',
    minHeight: 440,
    paddingVertical: mentaSpacing[8],
  },
  emptyArchiveCopy: {
    gap: mentaSpacing[2],
    width: '100%',
  },
  emptyArchiveTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  emptyArchiveDetail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  archiveRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 92,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  archiveIcon: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    height: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
    width: mentaLayout.minimumTouchTarget,
  },
  archiveCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  groupName: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  archiveMeta: {
    ...mentaTypography.micro,
    color: mentaColors.text.secondary,
  },
  readOnly: {
    ...mentaTypography.label,
    color: mentaColors.warning,
  },
  chevronLane: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
    width: mentaLayout.iconLane,
  },
  skeletonList: {
    gap: mentaSpacing[3],
  },
  skeletonRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    height: 82,
  },
  skeletonCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  pressed: {
    opacity: 0.76,
  },
});
