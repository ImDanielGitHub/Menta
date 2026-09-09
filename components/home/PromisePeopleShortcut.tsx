import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { ChevronRightIcon, UsersIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { usePromiseAccountability } from '@/hooks/usePromiseAccountability';
import { useTranslation } from '@/lib/localization';

type PromisePeopleShortcutProps = {
  challengeId: string;
  onPress: () => void;
  textScale?: number;
};

export function PromisePeopleShortcut({
  challengeId,
  onPress,
  textScale,
}: PromisePeopleShortcutProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data, isError, isLoading } = usePromiseAccountability(challengeId);
  const otherMembers =
    data?.members.filter(member => member.role !== 'owner') ?? [];
  const title = isError
    ? t('groups.source.accountability.people_check_failed')
    : otherMembers.length > 0
      ? t('groups.source.accountability.people_in_promise')
      : t('groups.source.accountability.bring_person');
  const detail = isLoading
    ? t('groups.source.accountability.checking_people')
    : isError
      ? t('groups.source.accountability.open_retry')
      : otherMembers.length > 0
        ? t('groups.source.accountability.open_roles_progress', {
            people: otherMembers.map(member => member.name).join(', '),
          })
        : t('groups.source.accountability.invite_methods');

  return (
    <Pressable
      accessibilityLabel={`${title}. ${detail}`}
      accessibilityHint={t('groups.source.accountability.people_shortcut_hint')}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      testID="today-promise-people"
    >
      <UsersIcon color={colors.accent.primary} size={20} />
      <View style={styles.copy}>
        <Text style={styles.title} textScale={textScale}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.detail} textScale={textScale}>
          {detail}
        </Text>
      </View>
      <ChevronRightIcon color={mentaColors.text.secondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    alignSelf: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    maxWidth: mentaLayout.taskLane,
    minHeight: 68,
    paddingVertical: mentaSpacing[3],
    width: '100%',
  },
  rowPressed: { backgroundColor: mentaColors.actionSoft },
  copy: { flex: 1, minWidth: 0 },
  title: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: 2,
  },
});
