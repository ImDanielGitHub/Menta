import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { CheckIcon, ChevronRightIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import type { CommitmentTemplateId } from '@/lib/commitments/templates';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';

const groupShapes: readonly {
  id: CommitmentTemplateId;
  titleKey:
    | 'groups.create.walking'
    | 'groups.create.study'
    | 'groups.create.creative';
  descriptionKey:
    | 'groups.create.walking_detail'
    | 'groups.create.study_detail'
    | 'groups.create.creative_detail';
}[] = [
  {
    id: 'move_daily',
    titleKey: 'groups.create.walking',
    descriptionKey: 'groups.create.walking_detail',
  },
  {
    id: 'study_block',
    titleKey: 'groups.create.study',
    descriptionKey: 'groups.create.study_detail',
  },
  {
    id: 'creative_minutes',
    titleKey: 'groups.create.creative',
    descriptionKey: 'groups.create.creative_detail',
  },
];

export const GroupTemplatePickerSheet = ({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (templateId: CommitmentTemplateId) => void;
}) => {
  const { t } = useTranslation();
  return (
    <SimpleBottomSheet
      visible={visible}
      onClose={onClose}
      testID="group-template-picker-sheet"
    >
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('groups.create.choose_start')}</Text>
        <Text style={styles.description}>
          {t('groups.create.choose_start_detail')}
        </Text>
        <View style={styles.rows}>
          {groupShapes.map(shape => (
            <Pressable
              key={shape.id}
              accessibilityRole="button"
              accessibilityLabel={
                shape.id === 'move_daily'
                  ? t('groups.create.walking')
                  : shape.id === 'study_block'
                    ? t('groups.create.study')
                    : t('groups.create.creative')
              }
              onPress={() => onSelect(shape.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>
                  {shape.id === 'move_daily'
                    ? t('groups.create.walking')
                    : shape.id === 'study_block'
                      ? t('groups.create.study')
                      : t('groups.create.creative')}
                </Text>
                <Text style={styles.rowDescription}>
                  {shape.id === 'move_daily'
                    ? t('groups.create.walking_detail')
                    : shape.id === 'study_block'
                      ? t('groups.create.study_detail')
                      : t('groups.create.creative_detail')}
                </Text>
              </View>
              <ChevronRightIcon color={mentaColors.text.muted} size={18} />
            </Pressable>
          ))}
        </View>
        <AppButton
          title={t('groups.create.blank_group')}
          onPress={onClose}
          fullWidth
          variant="ghost"
        />
      </View>
    </SimpleBottomSheet>
  );
};

export const SelectedGroupStartingPoint = ({
  title,
  description,
  onChange,
}: {
  title: string;
  description: string;
  onChange: () => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={styles.selectionReceipt}
      testID="selected-group-starting-point"
    >
      <View style={styles.selectionHeader}>
        <View accessibilityElementsHidden>
          <CheckIcon color={colors.accent.primary} size={18} />
        </View>
        <View style={styles.selectionCopy}>
          <Text style={styles.selectionLabel}>
            {t('groups.create.starting_point')}
          </Text>
          <Text style={styles.selectionTitle}>{title}</Text>
        </View>
        <AppButton
          accessibilityLabel={t('groups.create.change_start')}
          onPress={onChange}
          size="small"
          title={t('groups.create.change')}
          variant="ghost"
        />
      </View>
      <Text style={styles.selectionDescription}>{description}</Text>
    </View>
  );
};

export const FirstGroupCreatedReceipt = ({
  groupName,
  linkedPromiseTitle,
  linkedPromiseDurationDays,
  onInvitePeople,
  onCreateGroupPromise,
  onOpenGroup,
  showActions = true,
}: {
  groupName: string;
  linkedPromiseTitle?: string;
  linkedPromiseDurationDays?: number;
  onInvitePeople?: () => void;
  onCreateGroupPromise?: () => void;
  onOpenGroup?: () => void;
  showActions?: boolean;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.receipt} testID="first-group-created-receipt">
      <Text style={styles.title}>
        {t('groups.create.created_title', { group: groupName })}
      </Text>
      <Text style={styles.description}>
        {t('groups.create.created_detail')}
      </Text>
      <View style={styles.receiptRows}>
        <Text style={styles.receiptLabel}>
          {t('groups.create.group_details')}
        </Text>
        <View style={styles.receiptRow}>
          <Text style={styles.rowTitle}>{t('groups.create.membership')}</Text>
          <Text style={[styles.rowAction, { color: colors.accent.primary }]}>
            {t('groups.admin.owner')}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.rowTitle}>{t('groups.create.invitations')}</Text>
          <Text style={[styles.rowAction, { color: colors.accent.primary }]}>
            {t('groups.create.invitations_value')}
          </Text>
        </View>
        {linkedPromiseTitle ? (
          <View style={styles.receiptRow}>
            <Text style={styles.rowTitle}>
              {t('groups.create.first_promise')}
            </Text>
            <View style={styles.linkedPromiseDetails}>
              <Text
                numberOfLines={3}
                style={[styles.linkedPromise, { color: colors.accent.primary }]}
              >
                {linkedPromiseTitle}
              </Text>
              {linkedPromiseDurationDays ? (
                <Text style={styles.linkedPromiseDuration}>
                  {t('groups.create.days', {
                    count: linkedPromiseDurationDays,
                  })}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
      {showActions && onInvitePeople && onCreateGroupPromise && onOpenGroup ? (
        <View style={styles.actions}>
          <AppButton
            title={t('groups.create.add_promise')}
            onPress={onCreateGroupPromise}
            fullWidth
            size="large"
          />
          <AppButton
            title={t('groups.create.invite_people')}
            onPress={onInvitePeople}
            fullWidth
            variant="secondary"
          />
          <AppButton
            title={t('groups.create.open_group')}
            onPress={onOpenGroup}
            fullWidth
            variant="ghost"
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: { gap: mentaSpacing[4], paddingBottom: mentaSpacing[2] },
  title: { ...mentaTypography.heading, color: mentaColors.text.primary },
  description: { ...mentaTypography.body, color: mentaColors.text.secondary },
  rows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  rowCopy: { flex: 1, gap: mentaSpacing[1] },
  rowTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  rowDescription: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  rowAction: { ...mentaTypography.caption, color: mentaColors.action },
  linkedPromise: {
    ...mentaTypography.bodySmallMedium,
    textAlign: 'right',
  },
  linkedPromiseDetails: {
    flex: 1,
    alignItems: 'flex-end',
    gap: mentaSpacing[1],
  },
  linkedPromiseDuration: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  selectionReceipt: {
    gap: mentaSpacing[2],
    borderColor: mentaColors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: mentaSpacing[4],
    backgroundColor: mentaColors.surface,
  },
  selectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  selectionCopy: { flex: 1, gap: mentaSpacing[1], minWidth: 0 },
  selectionLabel: {
    ...mentaTypography.captionMedium,
    color: mentaColors.text.secondary,
  },
  selectionTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  selectionDescription: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  pressed: { opacity: 0.72 },
  receipt: { gap: mentaSpacing[4], paddingTop: mentaSpacing[6] },
  receiptRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  receiptLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.secondary,
    paddingVertical: mentaSpacing[3],
  },
  receiptRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  actions: { gap: mentaSpacing[2] },
});
