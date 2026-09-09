import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppInlineNotice,
  MentaMascot,
  SkeletonLoader,
} from '@/components/ui';
import {
  AlertCircleIcon,
  ChevronRightIcon,
  UsersIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { withReadableLeading } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTheme } from '@/constants/ThemeContext';
import {
  GROUP_IMAGE_PRESET_PREFIX,
  resolveGroupImagePreset,
} from '@/lib/groups/group-image-presets';
import type { Group, SharedPromiseSummary } from '@/store/group-store';
import { useTranslation, type TranslationKey } from '@/lib/localization';

export type GroupsListTab = 'mine' | 'discover';

type GroupsListSectionProps = {
  tab: GroupsListTab;
  userId?: string | null;
  myGroups: Group[];
  discoverGroups: Group[];
  initialLoading: boolean;
  fetchError: string | null;
  onRefreshGroups: () => void;
  onGoToToday: () => void;
  onJoinWithCode: () => void;
  onChoosePromise: () => void;
  onCreateGroup: () => void;
  onOpenPromise: (challengeId: string) => void;
  onOpenGroup: (groupId: string) => void;
  onPreviewGroup: (group: Group) => void;
};

const formatMemberCount = (
  count: number | null | undefined,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
) => {
  const value = count ?? 0;
  return t('groups.preview.member', { count: value });
};

const getMyGroupMeta = (
  group: Group,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
) => {
  if (group.status === 'failed') return t('groups.list.ended');
  if (group.status === 'expired') return t('groups.list.archived');
  if ((group.current_streak ?? 0) > 0) {
    return t('groups.list.streak', { count: group.current_streak ?? 0 });
  }
  return formatMemberCount(group.member_count, t);
};

const getGroupRole = (
  group: Group,
  userId: string | null | undefined,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
) =>
  group.owner_id === userId
    ? t('groups.admin.owner')
    : t('groups.admin.member');

const GroupMark = ({
  compact = false,
  group,
}: {
  compact?: boolean;
  group: Group;
}) => {
  const { colors } = useTheme();
  const imageUrl = group.image_url?.trim() || null;
  const imagePreset = resolveGroupImagePreset(imageUrl);
  const imageSource =
    imagePreset?.source ??
    (imageUrl && !imageUrl.startsWith(GROUP_IMAGE_PRESET_PREFIX)
      ? { uri: imageUrl }
      : null);
  const [imageFailed, setImageFailed] = React.useState(false);
  const groupInitial = group.name.trim().slice(0, 1).toLocaleUpperCase() || 'M';

  React.useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.groupMark,
        {
          backgroundColor:
            imageSource && !imageFailed
              ? colors.background.surface
              : colors.accent.primary,
        },
        compact ? styles.groupMarkCompact : null,
      ]}
      testID={compact ? 'groups-discover-mark' : 'groups-owned-mark'}
    >
      {imageSource && !imageFailed ? (
        <Image
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={imageSource}
          style={styles.groupMarkImage}
          testID={imagePreset ? 'group-preset-image' : 'group-image'}
        />
      ) : (
        <Text
          style={[
            styles.groupMarkInitial,
            { color: mentaColors.text.onPaper },
            compact ? styles.groupMarkInitialCompact : null,
          ]}
        >
          {groupInitial}
        </Text>
      )}
    </View>
  );
};

const GroupsSkeleton = ({ tab }: { tab: GroupsListTab }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityLabel={t('groups.source.accountability.loading_together')}
      accessibilityRole="progressbar"
      style={styles.loadingState}
      testID="groups-paper-GRP-00"
    >
      <View
        style={[
          styles.segmentShell,
          { backgroundColor: colors.background.surface },
        ]}
      >
        <SkeletonLoader announce={false} style={styles.loadingSegment} />
        <SkeletonLoader announce={false} style={styles.loadingSegment} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        {tab === 'mine'
          ? t('groups.source.accountability.shared_promises')
          : t('groups.list.public_groups')}
      </Text>
      <View
        style={[
          tab === 'mine' ? styles.sharedPromiseList : styles.loadingList,
          tab === 'discover'
            ? {
                backgroundColor: colors.background.surface,
                borderColor: colors.border.primary,
              }
            : null,
        ]}
      >
        {[0, 1, 2].map(index => (
          <View
            key={index}
            style={[
              tab === 'mine' ? styles.sharedPromiseLoading : styles.loadingRow,
              tab === 'discover'
                ? { borderBottomColor: colors.border.primary }
                : null,
              tab === 'discover' && index === 2 ? styles.lastRow : null,
            ]}
          >
            {tab === 'discover' ? (
              <SkeletonLoader
                announce={false}
                width={48}
                height={48}
                borderRadius={mentaRadii.large}
              />
            ) : null}
            <View style={styles.loadingCopy}>
              <SkeletonLoader
                announce={false}
                width={index === 0 ? '68%' : index === 1 ? '58%' : '74%'}
                height={tab === 'mine' ? 28 : 16}
                borderRadius={mentaRadii.small}
                style={tab === 'mine' ? styles.paperSkeleton : undefined}
              />
              <SkeletonLoader
                announce={false}
                width={index === 0 ? '88%' : index === 1 ? '72%' : '80%'}
                height={12}
                borderRadius={mentaRadii.small}
                style={tab === 'mine' ? styles.paperSkeleton : undefined}
              />
              {tab === 'mine' ? (
                <SkeletonLoader
                  announce={false}
                  width="30%"
                  height={12}
                  borderRadius={mentaRadii.small}
                  style={styles.paperSkeleton}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const GroupsUnavailable = ({
  onRefreshGroups,
  onGoToToday,
}: Pick<GroupsListSectionProps, 'onRefreshGroups' | 'onGoToToday'>) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();

  return (
    <View
      style={[
        styles.blockingState,
        { minHeight: phoneLayout.groupsBlockingMinHeight },
      ]}
      testID="groups-paper-GRP-05"
    >
      <View accessibilityElementsHidden style={styles.errorMark}>
        <AlertCircleIcon size={26} color={mentaColors.danger} />
      </View>
      <View style={styles.blockingCopy}>
        <Text
          accessibilityRole="header"
          style={[
            styles.blockingTitle,
            withReadableLeading(mentaTypography.heading, phoneLayout),
            { color: colors.text.primary },
          ]}
        >
          {t('groups.source.accountability.together_load_failed')}
        </Text>
        <Text
          style={[
            styles.blockingDescription,
            withReadableLeading(mentaTypography.body, phoneLayout),
            { color: colors.text.secondary },
          ]}
        >
          {t('groups.list.load_failed_detail')}
        </Text>
      </View>
      <View style={styles.blockingActions}>
        <AppButton
          fullWidth
          size="large"
          title={t('groups.tab.try_again')}
          onPress={onRefreshGroups}
        />
        <AppButton
          fullWidth
          variant="ghost"
          title={t('groups.tab.go_today')}
          onPress={onGoToToday}
        />
      </View>
    </View>
  );
};

const MyGroupsEmpty = ({
  onChoosePromise,
  onCreateGroup,
  onJoinWithCode,
}: Pick<
  GroupsListSectionProps,
  'onChoosePromise' | 'onCreateGroup' | 'onJoinWithCode'
>) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();

  return (
    <View
      style={[
        styles.emptyState,
        { minHeight: phoneLayout.groupsEmptyMinHeight },
      ]}
      testID="groups-paper-GRP-02"
    >
      <View style={styles.emptyBody}>
        <MentaMascot
          state="empty-guide"
          size={phoneLayout.isCompactHeight ? 'sm' : 'md'}
          style={styles.emptyMascot}
        />
        <View style={styles.emptyCopy}>
          <Text
            accessibilityRole="header"
            style={[
              styles.emptyTitle,
              withReadableLeading(mentaTypography.heading, phoneLayout),
              { color: colors.text.primary },
            ]}
          >
            {t('groups.source.accountability.empty_title')}
          </Text>
          <Text
            style={[
              styles.emptyDescription,
              withReadableLeading(mentaTypography.body, phoneLayout),
              { color: colors.text.secondary },
            ]}
          >
            {t('groups.source.accountability.empty_detail')}
          </Text>
        </View>
      </View>
      <View style={styles.emptyActions}>
        <AppButton
          fullWidth
          size="large"
          title={t('groups.source.accountability.choose_promise')}
          onPress={onChoosePromise}
        />
        <AppButton
          fullWidth
          variant="ghost"
          title={t('groups.tab.join_action')}
          onPress={onJoinWithCode}
        />
        <AppButton
          fullWidth
          variant="ghost"
          title={t('groups.source.accountability.create_saved_group')}
          onPress={onCreateGroup}
        />
      </View>
    </View>
  );
};

type SharedPromiseItem = {
  group: Group;
  promise: SharedPromiseSummary;
};

const SharedPromisesList = ({
  items,
  stale = false,
  onOpenPromise,
}: {
  items: SharedPromiseItem[];
  stale?: boolean;
  onOpenPromise: (challengeId: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.section} testID="together-shared-promises">
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('groups.source.accountability.shared_promises')}
        </Text>
        <Text style={[styles.sectionCount, { color: colors.text.muted }]}>
          {items.length}
        </Text>
      </View>
      <View style={styles.sharedPromiseList}>
        {items.map(({ group, promise }) => {
          const people = group.member_count ?? 1;
          const needsInvite = people <= 1;
          return (
            <Pressable
              key={`${group.id}:${promise.id}`}
              accessibilityRole="button"
              accessibilityLabel={t(
                'groups.source.accountability.shared_promise_accessibility',
                { promise: promise.title, count: people }
              )}
              accessibilityHint={t(
                'groups.source.accountability.open_shared_promise_hint'
              )}
              onPress={() => onOpenPromise(promise.id)}
              style={({ pressed }) => [
                styles.sharedPromiseRow,
                {
                  backgroundColor: pressed
                    ? mentaColors.paperPressed
                    : mentaColors.paper,
                  borderColor: mentaColors.borderPaper,
                },
              ]}
              testID={`shared-promise-${promise.id}`}
            >
              <View style={styles.sharedPromiseCopy}>
                <View style={styles.sharedPromiseTitleRow}>
                  <Text numberOfLines={3} style={styles.sharedPromiseTitle}>
                    {promise.title}
                  </Text>
                  <ChevronRightIcon
                    size={20}
                    color={mentaColors.actionOnPaper}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.sharedPromiseStatus,
                    needsInvite && !stale
                      ? { color: mentaColors.actionOnPaper }
                      : null,
                  ]}
                >
                  {stale
                    ? t('groups.tab.known_group')
                    : needsInvite
                      ? t('groups.source.accountability.bring_person')
                      : t('groups.source.accountability.open_roles_progress', {
                          people: t('groups.source.member.count', {
                            count: people,
                          }),
                        })}
                </Text>
                <View style={styles.sharedPromiseFooter}>
                  <UsersIcon size={17} color={mentaColors.text.mutedOnPaper} />
                  <Text style={styles.sharedPromisePeople}>
                    {t('groups.source.member.count', { count: people })}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const MyGroupsList = ({
  groups,
  userId,
  stale = false,
  onOpenGroup,
}: {
  groups: Group[];
  userId?: string | null;
  stale?: boolean;
  onOpenGroup: (groupId: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const useLargeTextLayout = phoneLayout.fontScale >= 1.3;

  return (
    <View style={styles.section} testID="groups-paper-GRP-01">
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('groups.source.accountability.saved_groups')}
        </Text>
        <Text style={[styles.sectionCount, { color: colors.text.muted }]}>
          {groups.length}
        </Text>
      </View>
      <View style={[styles.list, styles.ownedList]} testID="groups-owned-list">
        {groups.map(group => (
          <Pressable
            key={group.id}
            accessibilityRole="button"
            accessibilityLabel={`${group.name}, ${getGroupRole(group, userId, t)}`}
            accessibilityHint={t('groups.tab.list_open_hint')}
            onPress={() => onOpenGroup(group.id)}
            style={({ pressed }) => [
              styles.groupRow,
              {
                backgroundColor: pressed
                  ? colors.accent.background
                  : colors.background.surface,
                borderColor: pressed
                  ? colors.border.focus || colors.accent.primary
                  : colors.border.primary,
              },
            ]}
            testID={`owned-group-card-${group.id}`}
          >
            <GroupMark group={group} />
            <View style={styles.groupCopy}>
              <View
                style={[
                  styles.groupTitleRow,
                  useLargeTextLayout && styles.groupTitleRowLargeText,
                ]}
              >
                <Text
                  numberOfLines={useLargeTextLayout ? undefined : 1}
                  style={[styles.groupTitle, { color: colors.text.primary }]}
                >
                  {group.name}
                </Text>
                <View
                  style={[
                    styles.groupRoleChip,
                    { backgroundColor: colors.accent.background },
                  ]}
                >
                  <Text
                    style={[styles.groupRole, { color: colors.accent.primary }]}
                  >
                    {getGroupRole(group, userId, t)}
                  </Text>
                </View>
              </View>
              {group.description?.trim() ? (
                <Text
                  numberOfLines={useLargeTextLayout ? undefined : 2}
                  style={[
                    styles.groupDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {group.description.trim()}
                </Text>
              ) : null}
              <View style={styles.groupFooter}>
                <Text
                  numberOfLines={useLargeTextLayout ? undefined : 1}
                  style={[
                    styles.groupMeta,
                    {
                      color: stale
                        ? mentaColors.warning
                        : group.status === 'active'
                          ? colors.text.secondary
                          : colors.text.muted,
                    },
                  ]}
                >
                  {stale
                    ? t('groups.tab.known_group')
                    : getMyGroupMeta(group, t)}
                </Text>
                <View style={styles.groupOpenAffordance}>
                  <ChevronRightIcon size={16} color={colors.accent.primary} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const DiscoverEmpty = ({
  onRefreshGroups,
  onJoinWithCode,
}: Pick<GroupsListSectionProps, 'onRefreshGroups' | 'onJoinWithCode'>) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.discoverEmpty}>
      <Text
        accessibilityRole="header"
        style={[styles.discoverEmptyTitle, { color: colors.text.primary }]}
      >
        {t('groups.tab.discover_empty_title')}
      </Text>
      <Text
        style={[
          styles.discoverEmptyDescription,
          { color: colors.text.secondary },
        ]}
      >
        {t('groups.tab.discover_empty_detail')}
      </Text>
      <AppButton
        fullWidth
        size="large"
        variant="accent"
        title={t('groups.tab.join_action')}
        onPress={onJoinWithCode}
      />
      <AppButton
        fullWidth
        variant="ghost"
        title={t('groups.tab.try_again')}
        onPress={onRefreshGroups}
      />
    </View>
  );
};

const DiscoverGroupsList = ({
  groups,
  onPreviewGroup,
}: {
  groups: Group[];
  onPreviewGroup: (group: Group) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section} testID="groups-paper-GRP-03">
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        {t('groups.list.public_groups')}
      </Text>
      <View
        style={[
          styles.list,
          {
            backgroundColor: colors.background.surface,
            borderColor: colors.border.primary,
          },
        ]}
        testID="groups-discover-list"
      >
        {groups.map((group, index) => (
          <Pressable
            key={group.id}
            accessibilityRole="button"
            accessibilityLabel={t('groups.list.view_before_joining', {
              group: group.name,
            })}
            accessibilityHint={t('groups.tab.discover_open_hint')}
            onPress={() => onPreviewGroup(group)}
            style={({ pressed }) => [
              styles.discoverRow,
              { borderBottomColor: colors.border.primary },
              index === groups.length - 1 ? styles.lastRow : null,
              pressed ? { backgroundColor: colors.accent.background } : null,
            ]}
          >
            <View style={styles.discoverHeader}>
              <GroupMark compact group={group} />
              <View style={styles.discoverCopy}>
                <Text
                  numberOfLines={1}
                  style={[styles.groupTitle, { color: colors.text.primary }]}
                >
                  {group.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.discoverMeta, { color: colors.text.muted }]}
                >
                  {formatMemberCount(group.member_count, t)} ·{' '}
                  {t('groups.preview.public')}
                </Text>
              </View>
              <ChevronRightIcon size={18} color={colors.text.muted} />
            </View>
            <Text
              numberOfLines={2}
              style={[
                styles.discoverDescription,
                { color: colors.text.secondary },
              ]}
            >
              {group.description?.trim() ||
                t('groups.tab.discover_before_join')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export const GroupsListSection: React.FC<GroupsListSectionProps> = props => {
  const { t } = useTranslation();
  const {
    tab,
    userId,
    myGroups,
    discoverGroups,
    initialLoading,
    fetchError,
    onRefreshGroups,
    onGoToToday,
    onJoinWithCode,
    onChoosePromise,
    onCreateGroup,
    onOpenPromise,
    onOpenGroup,
    onPreviewGroup,
  } = props;

  const visibleGroups = tab === 'mine' ? myGroups : discoverGroups;
  const sharedPromises = React.useMemo(() => {
    const seen = new Set<string>();
    return myGroups.flatMap(group =>
      (group.shared_promises ?? []).flatMap(promise => {
        if (seen.has(promise.id)) return [];
        seen.add(promise.id);
        return [{ group, promise }];
      })
    );
  }, [myGroups]);
  const savedGroups = React.useMemo(
    () => myGroups.filter(group => group.kind !== 'promise'),
    [myGroups]
  );

  if (initialLoading) return <GroupsSkeleton tab={tab} />;

  if (fetchError && visibleGroups.length === 0) {
    return (
      <GroupsUnavailable
        onRefreshGroups={onRefreshGroups}
        onGoToToday={onGoToToday}
      />
    );
  }

  return (
    <View style={styles.contentState}>
      {fetchError ? (
        <AppInlineNotice
          title={t('groups.tab.offline_title')}
          description={t('groups.source.accountability.offline_detail')}
          tone="warning"
          actionLabel={t('groups.tab.try_again')}
          onAction={onRefreshGroups}
          testID="groups-paper-GRP-04"
        />
      ) : null}
      {tab === 'mine' ? (
        sharedPromises.length > 0 || savedGroups.length > 0 ? (
          <>
            {sharedPromises.length > 0 ? (
              <SharedPromisesList
                items={sharedPromises}
                stale={Boolean(fetchError)}
                onOpenPromise={onOpenPromise}
              />
            ) : null}
            {savedGroups.length > 0 ? (
              <MyGroupsList
                groups={savedGroups}
                userId={userId}
                stale={Boolean(fetchError)}
                onOpenGroup={onOpenGroup}
              />
            ) : sharedPromises.length > 0 ? (
              <AppButton
                title={t('groups.source.accountability.create_saved_group')}
                onPress={onCreateGroup}
                fullWidth
                variant="ghost"
              />
            ) : null}
          </>
        ) : (
          <MyGroupsEmpty
            onChoosePromise={onChoosePromise}
            onCreateGroup={onCreateGroup}
            onJoinWithCode={onJoinWithCode}
          />
        )
      ) : discoverGroups.length > 0 ? (
        <DiscoverGroupsList
          groups={discoverGroups}
          onPreviewGroup={onPreviewGroup}
        />
      ) : (
        <DiscoverEmpty
          onRefreshGroups={onRefreshGroups}
          onJoinWithCode={onJoinWithCode}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentState: { flex: 1, gap: mentaSpacing[5] },
  loadingState: { gap: mentaSpacing[3] },
  segmentShell: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    gap: mentaSpacing[1],
    padding: mentaSpacing[1],
    borderRadius: mentaRadii.medium,
  },
  loadingSegment: {
    flex: 1,
    height: 36,
    borderRadius: mentaRadii.small,
    width: 'auto',
  },
  loadingList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.large,
    overflow: 'hidden',
  },
  loadingRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  loadingCopy: { flex: 1, gap: mentaSpacing[2] },
  blockingState: {
    flex: 1,
    justifyContent: 'center',
    gap: mentaSpacing[5],
  },
  errorMark: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    borderColor: mentaColors.danger,
    backgroundColor: mentaColors.dangerSoft,
  },
  blockingCopy: { gap: mentaSpacing[2] },
  blockingTitle: {
    ...mentaTypography.heading,
  },
  blockingDescription: {
    ...mentaTypography.body,
    width: '100%',
  },
  blockingActions: { gap: mentaSpacing[2], marginTop: 'auto' },
  emptyState: { flex: 1, justifyContent: 'space-between' },
  emptyBody: { flex: 1, justifyContent: 'center', gap: 22 },
  emptyMascot: { width: 104, height: 104 },
  emptyCopy: { gap: 10 },
  emptyTitle: {
    ...mentaTypography.heading,
  },
  emptyDescription: {
    ...mentaTypography.body,
  },
  emptyActions: { gap: 10, paddingTop: mentaSpacing[3] },
  section: { gap: mentaSpacing[3] },
  sectionHeader: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...mentaTypography.labelBold,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCount: { ...mentaTypography.caption },
  sharedPromiseList: { gap: mentaSpacing[3] },
  sharedPromiseLoading: {
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.large,
    minHeight: 168,
    padding: mentaSpacing[5],
    justifyContent: 'center',
  },
  paperSkeleton: { backgroundColor: mentaColors.borderPaper },
  sharedPromiseRow: {
    alignItems: 'stretch',
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 168,
    padding: mentaSpacing[5],
  },
  sharedPromiseCopy: { flex: 1, gap: mentaSpacing[2], minWidth: 0 },
  sharedPromiseTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  sharedPromiseTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
    flex: 1,
  },
  sharedPromiseFooter: {
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[2],
    paddingTop: mentaSpacing[3],
  },
  sharedPromisePeople: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
    flexShrink: 0,
  },
  sharedPromiseStatus: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.large,
    overflow: 'hidden',
  },
  ownedList: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    gap: mentaSpacing[3],
    overflow: 'visible',
  },
  groupRow: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[4],
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[4],
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  groupMark: {
    width: 56,
    height: 56,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.medium,
  },
  groupMarkCompact: { width: 44, height: 44, borderRadius: mentaRadii.medium },
  groupMarkInitial: {
    ...mentaTypography.title,
    fontSize: 24,
    lineHeight: 28,
  },
  groupMarkInitialCompact: { fontSize: 19, lineHeight: 22 },
  groupMarkImage: {
    borderRadius: mentaRadii.medium,
    height: '100%',
    width: '100%',
  },
  groupCopy: { flex: 1, minWidth: 0, gap: mentaSpacing[2] },
  groupTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  groupTitleRowLargeText: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  groupTitle: {
    ...mentaTypography.bodySemibold,
    fontSize: 18,
    lineHeight: 24,
    flex: 1,
  },
  groupRoleChip: {
    borderRadius: mentaRadii.round,
    paddingHorizontal: mentaSpacing[2],
    paddingVertical: 3,
  },
  groupRole: { ...mentaTypography.caption },
  groupDescription: { ...mentaTypography.bodySmall, minHeight: 21 },
  groupFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
  },
  groupMeta: { ...mentaTypography.caption },
  groupOpenAffordance: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[1],
  },
  trailingLane: {
    width: mentaLayout.iconLane,
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  discoverRow: {
    minHeight: 104,
    gap: 14,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  discoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  discoverCopy: { flex: 1, minWidth: 0, gap: mentaSpacing[1] },
  discoverMeta: { ...mentaTypography.caption },
  discoverDescription: {
    ...mentaTypography.bodySmall,
  },
  discoverEmpty: {
    gap: mentaSpacing[4],
    paddingVertical: mentaSpacing[8],
  },
  discoverEmptyTitle: {
    ...mentaTypography.heading,
  },
  discoverEmptyDescription: {
    ...mentaTypography.body,
  },
  lastRow: { borderBottomWidth: 0 },
});
