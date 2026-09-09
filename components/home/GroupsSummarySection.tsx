import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRightIcon, UsersIcon } from '@/components/ui/icons';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';
import type {
  GroupRiskLevel,
  GroupWithRisk,
} from '@/utils/group-risk-calculator';

type GroupsSummarySectionProps = {
  groups: GroupWithRisk[];
  onViewAll: () => void;
  onOpenGroup: (groupId: string) => void;
};

type Localise = ReturnType<typeof useTranslation>['t'];

const riskLabels: Record<GroupRiskLevel['level'], (t: Localise) => string> = {
  safe: t => t('groupsHome.summary.risk.safe'),
  at_risk: t => t('groupsHome.summary.risk.at_risk'),
  critical: t => t('groupsHome.summary.risk.critical'),
  failed: t => t('groupsHome.summary.risk.failed'),
  expired: t => t('groupsHome.summary.risk.expired'),
};

export const GroupsSummarySection: React.FC<GroupsSummarySectionProps> = ({
  groups,
  onViewAll,
  onOpenGroup,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rowLines = useLargeTypeLineLimit(1);

  if (!groups.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {t('groupsHome.summary.title')}
        </Text>
        <TouchableOpacity
          accessibilityLabel={t('groupsHome.summary.view_all_accessibility')}
          accessibilityRole="button"
          onPress={onViewAll}
          style={styles.sectionActionHit}
        >
          <Text style={styles.sectionAction}>
            {t('groupsHome.summary.view_all')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {groups.slice(0, 4).map(group => (
          <TouchableOpacity
            key={group.id}
            accessibilityRole="button"
            activeOpacity={0.82}
            onPress={() => onOpenGroup(group.id)}
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
                {t('groupsHome.summary.meta', {
                  members: t('groupsHome.count.members', {
                    count: group.member_count ?? 0,
                  }),
                  streak: t('groupsHome.count.streak', {
                    count: group.current_streak ?? 0,
                  }),
                  risk: riskLabels[
                    (group.riskLevel?.level ??
                      'safe') as GroupRiskLevel['level']
                  ](t),
                })}
              </Text>
            </View>
            <ChevronRightIcon size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>
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
  });
};

export default GroupsSummarySection;
