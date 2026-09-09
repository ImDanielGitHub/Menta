import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRightIcon, UsersIcon } from '@/components/ui/icons';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import type { PendingInvite } from '@/store/invite-store';
import type { Group } from '@/store/group-store';
import { useTranslation } from '@/lib/localization';

type OpenInvitesSectionProps = {
  groups: Group[];
  pendingInvite?: PendingInvite | null;
  expanded: boolean;
  onToggle: () => void;
  onOpenSavedInvite?: () => void;
  onClearSavedInvite?: () => void;
  onPreviewGroup: (group: Group) => void;
  onRefreshInvites: () => void;
  onJoinWithCode: () => void;
  onStartSolo: () => void;
};

type Localise = ReturnType<typeof useTranslation>['t'];

const inviteTypeLabels: Record<PendingInvite['type'], (t: Localise) => string> =
  {
    challenge: t => t('groupsHome.invites.type.promise'),
    group: t => t('groupsHome.invites.type.group'),
  };

export const OpenInvitesSection: React.FC<OpenInvitesSectionProps> = ({
  groups,
  pendingInvite,
  expanded,
  onToggle,
  onOpenSavedInvite,
  onClearSavedInvite,
  onPreviewGroup,
  onRefreshInvites,
  onJoinWithCode,
  onStartSolo,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rowLines = useLargeTypeLineLimit(1);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('groupsHome.invites.title')}
        </Text>
        <TouchableOpacity
          accessibilityLabel={
            expanded
              ? t('groupsHome.invites.hide_accessibility')
              : t('groupsHome.invites.browse_accessibility')
          }
          accessibilityRole="button"
          onPress={onToggle}
          style={styles.sectionActionHit}
        >
          <Text style={styles.sectionAction}>
            {expanded
              ? t('groupsHome.invites.hide')
              : t('groupsHome.invites.browse')}
          </Text>
        </TouchableOpacity>
      </View>

      {pendingInvite ? (
        <View style={styles.savedInvite}>
          <View style={styles.savedInviteIcon}>
            <UsersIcon size={17} color={theme.colors.text.primary} />
          </View>
          <View style={styles.savedInviteCopy}>
            <Text style={styles.savedInviteTitle}>
              {t('groupsHome.invites.saved_title', {
                type: inviteTypeLabels[pendingInvite.type](t),
              })}
            </Text>
            <Text style={styles.savedInviteText}>
              {t('groupsHome.invites.saved_detail', {
                code: pendingInvite.code,
              })}
            </Text>
            <View style={styles.savedInviteActions}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={onOpenSavedInvite}
                style={styles.primaryAction}
              >
                <Text style={styles.primaryActionText}>
                  {t('groupsHome.invites.open_saved')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={onClearSavedInvite}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>
                  {t('groupsHome.invites.clear')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.list}>
          {groups.length > 0 ? (
            groups.slice(0, 3).map(group => (
              <TouchableOpacity
                key={group.id}
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={() => onPreviewGroup(group)}
                style={styles.row}
              >
                <View style={styles.rowIcon}>
                  <UsersIcon size={17} color={theme.colors.text.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={rowLines}>
                    {group.name}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={rowLines}>
                    {t('groupsHome.invites.row_meta', {
                      members: t('groupsHome.count.members', {
                        count: group.member_count ?? 0,
                      }),
                      streak: t('groupsHome.count.streak', {
                        count: group.current_streak ?? 0,
                      }),
                    })}
                  </Text>
                </View>
                <ChevronRightIcon
                  size={18}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyHeader}>
                <View style={styles.emptyIcon}>
                  <UsersIcon size={17} color={theme.colors.text.secondary} />
                </View>
                <View style={styles.emptyCopy}>
                  <Text style={styles.emptyTitle}>
                    {t('groupsHome.invites.empty_title')}
                  </Text>
                  <Text style={styles.emptyText}>
                    {t('groupsHome.invites.empty_detail')}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.82}
                  onPress={onRefreshInvites}
                  style={styles.primaryAction}
                >
                  <Text style={styles.primaryActionText}>
                    {t('groupsHome.invites.check_again')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.82}
                  onPress={onJoinWithCode}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>
                    {t('groupsHome.invites.join_code')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.82}
                  onPress={onStartSolo}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>
                    {t('groupsHome.invites.personal_promise')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (theme: ThemeContextType) => {
  const { colors, spacing, borderRadius, typography } = theme;

  return StyleSheet.create({
    section: {
      gap: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    sectionTitle: {
      color: colors.text.primary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    sectionActionHit: {
      minHeight: mentaLayout.minimumTouchTarget,
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    sectionAction: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    list: {
      gap: spacing.sm,
    },
    savedInvite: {
      flexDirection: 'row',
      gap: spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border.secondary,
      paddingVertical: spacing.md,
    },
    savedInviteIcon: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.secondary,
      backgroundColor: colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedInviteCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.sm,
    },
    savedInviteTitle: {
      color: colors.text.primary,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
    },
    savedInviteText: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      lineHeight: 20,
    },
    savedInviteActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 58,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: colors.text.primary,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
    },
    rowMeta: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      lineHeight: 19,
      marginTop: 3,
    },
    empty: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border.secondary,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    emptyHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    emptyIcon: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.secondary,
      backgroundColor: colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCopy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    emptyTitle: {
      color: colors.text.primary,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
    },
    emptyText: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    primaryAction: {
      minHeight: mentaLayout.minimumTouchTarget,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text.primary,
    },
    secondaryAction: {
      minHeight: mentaLayout.minimumTouchTarget,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.primary,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryActionText: {
      color: colors.text.inverse,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    secondaryActionText: {
      color: colors.text.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
  });
};

export default OpenInvitesSection;
