import React from 'react';
import { Text, View } from 'react-native';
import { AppOptionCard, AppTag } from '@/components/ui/AppChoice';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { ShieldIcon, UsersIcon } from '@/components/ui/icons';
import type { ThemeContextType } from '@/constants/ThemeContext';
import type {
  CreateChallengeFormData,
  CreateStep,
  FieldUpdater,
  GroupOption,
  GroupPolicy,
  StepStyles,
} from './types';
import { useTranslation } from '@/lib/localization';

interface ModeStepProps {
  step: CreateStep;
  showHeader?: boolean;
  styles: StepStyles;
  colors: ThemeContextType['colors'];
  formData: CreateChallengeFormData;
  userGroupsData: GroupOption[];
  isLoading: boolean;
  groupPolicy: GroupPolicy;
  updateField: FieldUpdater;
}

export function ModeStep({
  step,
  showHeader = true,
  styles,
  colors,
  formData,
  userGroupsData,
  isLoading,
  groupPolicy,
  updateField,
}: ModeStepProps) {
  const { t } = useTranslation();
  return (
    <View style={showHeader ? styles.stepContainer : styles.stepSubsection}>
      {showHeader ? (
        <>
          <View style={styles.stepIcon}>{step.icon}</View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t('todayProof.create.loading_groups')}
          </Text>
        </View>
      ) : userGroupsData.length > 0 ? (
        <View style={styles.groupGrid}>
          <AppOptionCard
            title={t('todayProof.create.keep_solo')}
            description={t('todayProof.create.private_streak')}
            selected={formData.allowSelfReview}
            onPress={() => {
              updateField('allowSelfReview', true);
              updateField('selectedGroupId', null);
            }}
            icon={
              <ShieldIcon
                size={24}
                color={
                  formData.allowSelfReview
                    ? colors.primary
                    : colors.text.secondary
                }
              />
            }
            style={styles.groupOption}
          />

          {userGroupsData.map(group => {
            const isSelected = formData.selectedGroupId === group.id;
            return (
              <AppOptionCard
                key={group.id}
                title={group.name}
                description={
                  group.description ||
                  t('todayProof.create.group_commitment', {
                    count: group.duration_days || 30,
                  })
                }
                selected={isSelected}
                onPress={() => {
                  updateField('selectedGroupId', group.id);
                  updateField('allowSelfReview', false);
                }}
                icon={
                  <UsersIcon
                    size={24}
                    color={isSelected ? colors.primary : colors.text.secondary}
                  />
                }
                style={styles.groupOption}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.noGroupsContainer}>
          <Text style={styles.noGroupsTitle}>
            {t('todayProof.create.start_solo')}
          </Text>
          <Text style={styles.noGroupsText}>
            {t('todayProof.create.start_solo_detail')}
          </Text>

          <AppOptionCard
            title={t('todayProof.create.keep_solo')}
            description={t('todayProof.create.private_promise')}
            selected={formData.allowSelfReview}
            onPress={() => {
              updateField('allowSelfReview', true);
              updateField('selectedGroupId', null);
            }}
            icon={
              <ShieldIcon
                size={24}
                color={
                  formData.allowSelfReview
                    ? colors.primary
                    : colors.text.secondary
                }
              />
            }
            style={styles.groupOption}
          />

          <AppInlineNotice
            title={t('todayProof.create.want_group')}
            description={t('todayProof.create.finish_first')}
          />
        </View>
      )}

      {formData.selectedGroupId ? (
        <View
          style={[
            styles.policyCard,
            {
              backgroundColor: 'transparent',
              borderColor: colors.border.secondary,
              borderWidth: 1,
              borderRadius: 10,
            },
          ]}
        >
          <View style={styles.policyHeader}>
            <ShieldIcon size={18} color={colors.status.info} />
            <Text style={[styles.policyTitle, { color: colors.text.primary }]}>
              {t('todayProof.create.selected_rules')}
            </Text>
          </View>
          <View style={styles.policyBadges}>
            <View style={styles.policyBadgeItem}>
              <AppTag
                label={t('todayProof.create.target', {
                  percent: Math.round(groupPolicy.target * 100),
                })}
                tone="share"
              />
              <Text
                style={[
                  styles.policyBadgeLabel,
                  { color: colors.text.secondary },
                ]}
              >
                {t('todayProof.create.days_with_proof')}
              </Text>
            </View>
            <View style={styles.policyBadgeItem}>
              <AppTag
                label={
                  groupPolicy.graceDays === 1
                    ? t('todayProof.create.day_unit', {
                        count: groupPolicy.graceDays,
                      })
                    : t('todayProof.create.days_unit', {
                        count: groupPolicy.graceDays,
                      })
                }
                tone="streak"
              />
              <Text
                style={[
                  styles.policyBadgeLabel,
                  { color: colors.text.secondary },
                ]}
              >
                {t('todayProof.create.misses_allowed')}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.policyDescription, { color: colors.text.tertiary }]}
          >
            {t('todayProof.create.group_policy', {
              percent: Math.round(groupPolicy.target * 100),
              count: groupPolicy.graceDays,
            })}
          </Text>
        </View>
      ) : formData.allowSelfReview ? (
        <View
          style={[
            styles.policyRow,
            {
              backgroundColor: colors.surface.secondary,
              padding: 12,
              borderRadius: 8,
            },
          ]}
        >
          <Text style={[styles.policyText, { color: colors.text.secondary }]}>
            {t('todayProof.create.personal_policy')}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.policyRow,
            {
              backgroundColor: colors.surface.secondary,
              padding: 12,
              borderRadius: 8,
            },
          ]}
        >
          <Text style={[styles.policyText, { color: colors.text.secondary }]}>
            {t('todayProof.create.choose_group_policy')}
          </Text>
        </View>
      )}
    </View>
  );
}
