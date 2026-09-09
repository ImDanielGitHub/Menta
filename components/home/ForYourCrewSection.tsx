import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@/components/ui/icons';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import type { PendingReview } from '@/store/group-store';
import { useTranslation } from '@/lib/localization';

type CrewPressureGroup = {
  id: string;
  name: string;
};

type ForYourCrewSectionProps = {
  reviews: PendingReview[];
  pressureGroups: CrewPressureGroup[];
  onOpenReviewQueue: () => void;
  onOpenReview: (review: PendingReview) => void;
  onOpenGroup: (groupId: string) => void;
};

const getFirstName = (name?: string | null) => {
  const cleanName = String(name || '').trim();
  if (!cleanName) return '';

  const withoutEmailDomain = cleanName.includes('@')
    ? cleanName.split('@')[0]
    : cleanName;
  return withoutEmailDomain
    .split(/[\s._-]+/)
    .filter(Boolean)[0]
    ?.trim();
};

const getPossessiveName = (name?: string | null) => {
  const firstName = getFirstName(name);
  if (!firstName) return '';

  return `${firstName}${firstName.endsWith('s') ? "'" : "'s"}`;
};

export const ForYourCrewSection: React.FC<ForYourCrewSectionProps> = ({
  reviews,
  pressureGroups,
  onOpenReviewQueue,
  onOpenReview,
  onOpenGroup,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const groupActionCount = reviews.length + pressureGroups.length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t('groupsHome.groupAction.title')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onOpenReviewQueue}
        >
          <Text style={styles.sectionAction}>
            {t('groupsHome.groupAction.waiting', { count: groupActionCount })}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {groupActionCount > 0 ? (
          <>
            {reviews.slice(0, 3).map(review => (
              <TouchableOpacity
                key={review.id}
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={() => onOpenReview(review)}
                style={styles.row}
              >
                <View style={styles.rowIcon}>
                  <EyeIcon size={17} color={theme.colors.text.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {getFirstName(review.submitterName)
                      ? t('groupsHome.groupAction.review_named', {
                          name: getFirstName(review.submitterName)!,
                          possessiveName: getPossessiveName(
                            review.submitterName
                          ),
                        })
                      : t('groupsHome.groupAction.review')}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {review.groupName
                      ? t('groupsHome.groupAction.review_group_meta', {
                          group: review.groupName,
                        })
                      : t('groupsHome.groupAction.review_meta')}
                  </Text>
                </View>
                <Text style={styles.rowActionLabel}>
                  {t('groupsHome.groupAction.review_action')}
                </Text>
              </TouchableOpacity>
            ))}

            {pressureGroups.map(group => (
              <TouchableOpacity
                key={`pressure-${group.id}`}
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={() => onOpenGroup(group.id)}
                style={styles.row}
              >
                <View style={styles.rowIcon}>
                  <AlertCircleIcon
                    size={17}
                    color={theme.colors.status.warning}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {t('groupsHome.groupAction.pressure_named', {
                      group: group.name,
                    })}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {t('groupsHome.groupAction.pressure_detail')}
                  </Text>
                </View>
                <Text style={styles.rowActionLabel}>
                  {t('groupsHome.groupAction.open_action')}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <CheckCircleIcon size={17} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {t('groupsHome.groupAction.empty_title')}
              </Text>
              <Text style={styles.rowMeta}>
                {t('groupsHome.groupAction.empty_detail')}
              </Text>
            </View>
          </View>
        )}
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
    rowActionLabel: {
      color: colors.text.secondary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      textTransform: 'uppercase',
      flexShrink: 0,
      textAlign: 'right',
      maxWidth: 92,
      minWidth: 58,
    },
  });
};

export default ForYourCrewSection;
