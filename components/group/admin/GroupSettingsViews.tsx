import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { GroupStatePanel } from '@/components/group/GroupAdminPrimitives';
import { AppButton, SkeletonLoader } from '@/components/ui';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { CheckIcon, ChevronRightIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import { usePhoneLayout } from '@/constants/use-phone-layout';

export type PrivacyOption = 'public' | 'private';

export const privacyOptions: readonly {
  id: PrivacyOption;
  titleKey: 'groups.create.public_label' | 'groups.create.private_label';
  descriptionKey: 'groups.create.public_note' | 'groups.create.private_note';
}[] = [
  {
    id: 'public',
    titleKey: 'groups.create.public_label',
    descriptionKey: 'groups.create.public_note',
  },
  {
    id: 'private',
    titleKey: 'groups.create.private_label',
    descriptionKey: 'groups.create.private_note',
  },
];

export const SettingsSkeleton = () => {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('groups.admin.loading_settings')}
      accessibilityRole="progressbar"
      style={styles.skeleton}
    >
      <SkeletonLoader announce borderRadius={mentaRadii.large} height={92} />
      {[
        { rows: 1, field: true },
        { rows: 1, field: false },
        { rows: 1, field: false },
        { rows: 2, field: false },
        { rows: 2, field: false },
      ].map((section, index) => (
        <View key={index} style={styles.skeletonSection}>
          <SkeletonLoader announce={false} height={11} width={84 + index * 8} />
          {Array.from({ length: section.rows }, (_, rowIndex) => (
            <SkeletonLoader
              announce={false}
              borderRadius={mentaRadii.medium}
              height={section.field ? 78 : 72}
              key={rowIndex}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

export const SettingsNoticeState = ({
  actionLabel,
  detail,
  onAction,
  title,
}: {
  actionLabel: string;
  detail: string;
  onAction: () => void;
  title: string;
}) => (
  <GroupStatePanel
    actionLabel={actionLabel}
    detail={detail}
    onAction={onAction}
    title={title}
    tone="danger"
  />
);

export const SettingsRow = ({
  detail,
  disabled = false,
  icon,
  onPress,
  title,
  value,
}: {
  detail: string;
  disabled?: boolean;
  icon: React.ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  value?: string;
}) => {
  const phoneLayout = usePhoneLayout();
  const usesCompactValueLane =
    phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2;

  return (
    <Pressable
      accessibilityHint={detail}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        disabled && styles.disabledRow,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.iconLane}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <View
        style={[
          styles.valueLane,
          usesCompactValueLane ? styles.valueLaneCompact : null,
        ]}
      >
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <ChevronRightIcon color={mentaColors.text.secondary} size={18} />
      </View>
    </Pressable>
  );
};

export const PrivacySheet = ({
  onClose,
  onSelect,
  selected,
  visible,
}: {
  onClose: () => void;
  onSelect: (privacy: PrivacyOption) => void;
  selected: PrivacyOption;
  visible: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <SimpleBottomSheet
      onClose={onClose}
      testID="group-privacy-sheet"
      visible={visible}
      scrollableBody={
        <View style={styles.sheetCopy}>
          <Text style={styles.sheetTitle}>{t('groups.admin.who_join')}</Text>
          {privacyOptions.map(option => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: option.id === selected }}
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={styles.sheetRow}
            >
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{t(option.titleKey)}</Text>
                <Text style={styles.rowDetail}>{t(option.descriptionKey)}</Text>
              </View>
              {option.id === selected ? (
                <CheckIcon color={mentaColors.action} size={20} />
              ) : null}
            </Pressable>
          ))}
        </View>
      }
    />
  );
};

export const DiscardSheet = ({
  onClose,
  onDiscard,
  visible,
}: {
  onClose: () => void;
  onDiscard: () => void;
  visible: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <SimpleBottomSheet
      onClose={onClose}
      testID="group-settings-discard-sheet"
      visible={visible}
      scrollableBody={
        <View style={styles.sheetCopy}>
          <Text style={styles.sheetTitle}>
            {t('groups.admin.discard_question')}
          </Text>
          <Text style={styles.sheetDetail}>
            {t('groups.admin.discard_detail')}
          </Text>
        </View>
      }
      footer={
        <View style={styles.sheetActions}>
          <AppButton
            fullWidth
            onPress={onClose}
            title={t('groups.admin.keep_editing')}
          />
          <AppButton
            fullWidth
            onPress={onDiscard}
            title={t('groups.admin.discard')}
            variant="ghost"
          />
        </View>
      }
    />
  );
};

export const LeaveSheet = ({
  loading,
  onClose,
  onConfirm,
  owner,
  visible,
}: {
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  owner: boolean;
  visible: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <SimpleBottomSheet
      dismissOnBackdrop={!loading}
      onClose={onClose}
      testID="group-leave-sheet"
      visible={visible}
      scrollableBody={
        <View style={styles.sheetCopy}>
          <Text style={styles.sheetTitle}>
            {owner
              ? t('groups.admin.cannot_leave')
              : t('groups.admin.leave_question')}
          </Text>
          <Text style={styles.sheetDetail}>
            {owner
              ? t('groups.admin.transfer_warning')
              : t('groups.admin.leave_detail')}
          </Text>
        </View>
      }
      footer={
        <View style={styles.sheetActions}>
          <AppButton
            fullWidth
            onPress={onClose}
            title={owner ? t('groups.admin.close') : t('groups.admin.cancel')}
            variant="outline"
          />
          {!owner ? (
            <AppButton
              fullWidth
              loading={loading}
              onPress={onConfirm}
              title={t('groups.admin.leave')}
              variant="destructive"
            />
          ) : null}
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  settingsRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 72,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  iconLane: {
    alignItems: 'center',
    justifyContent: 'center',
    width: mentaLayout.iconLane,
  },
  rowCopy: { flex: 1, gap: mentaSpacing[1], minWidth: 0 },
  rowTitle: { ...mentaTypography.bodyMedium, color: mentaColors.text.primary },
  rowDetail: { ...mentaTypography.caption, color: mentaColors.text.secondary },
  valueLane: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexShrink: 0,
    gap: mentaSpacing[1],
    justifyContent: 'flex-end',
    width: 112,
  },
  valueLaneCompact: {
    maxWidth: 76,
    width: 'auto',
  },
  rowValue: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    textAlign: 'right',
  },
  disabledRow: { opacity: 0.56 },
  pressed: { opacity: 0.76 },
  skeleton: { gap: mentaSpacing[4] },
  skeletonSection: { gap: mentaSpacing[2] },
  sheetCopy: { gap: mentaSpacing[2], paddingBottom: mentaSpacing[2] },
  sheetActions: { gap: mentaSpacing[4] },
  sheetTitle: { ...mentaTypography.title, color: mentaColors.text.primary },
  sheetDetail: { ...mentaTypography.body, color: mentaColors.text.secondary },
  sheetRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    paddingVertical: mentaSpacing[3],
  },
});
