import {
  type MentaPalette,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { TodayPressable } from '@/components/today/TodayPressable';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { ChevronRightIcon, UsersIcon } from '@/components/ui/icons';

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
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

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
    <TodayPressable
      accessibilityLabel={`${title}. ${detail}`}
      accessibilityHint={t('groups.source.accountability.people_shortcut_hint')}
      onPress={onPress}
      pressedStyle={styles.rowPressed}
      style={styles.row}
      testID="today-promise-people"
    >
      <View style={styles.tile}>
        <UsersIcon color={colors.accent.primary} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} textScale={textScale}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.detail} textScale={textScale}>
          {detail}
        </Text>
      </View>
      <ChevronRightIcon color={mentaColors.text.secondary} size={18} />
    </TodayPressable>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    row: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: mentaColors.surface,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      flexDirection: 'row',
      gap: mentaSpacing[4],
      maxWidth: mentaLayout.taskLane,
      minHeight: 76,
      paddingHorizontal: mentaSpacing[4],
      paddingVertical: mentaSpacing[3],
      width: '100%',
    },
    tile: {
      alignItems: 'center',
      backgroundColor: mentaColors.actionSoft,
      borderRadius: mentaRadii.medium,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    rowPressed: {
      backgroundColor: mentaColors.raised,
      borderColor: mentaColors.actionBorder,
    },
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
  return { styles };
};
