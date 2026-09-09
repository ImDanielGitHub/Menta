import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, MentaMascot } from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';

export const GroupSharedPromisesEmptyState = ({
  canManage,
  onAddPromise,
  onInvitePeople,
}: {
  canManage: boolean;
  onAddPromise?: () => void;
  onInvitePeople?: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container} testID="group-shared-promises-empty-state">
      <View style={styles.orientation}>
        <MentaMascot
          size="md"
          state="empty-guide"
          style={styles.mascot}
          testID="group-shared-promises-empty-mascot"
        />
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('groups.empty.shared_title')}
          </Text>
          <Text style={styles.body}>{t('groups.empty.shared_detail')}</Text>
        </View>
      </View>
      {canManage && (onAddPromise || onInvitePeople) ? (
        <View style={styles.actions}>
          {onAddPromise ? (
            <AppButton
              fullWidth
              onPress={onAddPromise}
              size="large"
              title={t('groups.empty.add_promise')}
            />
          ) : null}
          {onInvitePeople ? (
            <AppButton
              fullWidth
              onPress={onInvitePeople}
              size="large"
              title={t('groups.empty.invite_people')}
              variant="outline"
            />
          ) : null}
        </View>
      ) : null}
      <Text style={styles.note}>{t('groups.empty.shared_note')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    gap: mentaSpacing[5],
    maxWidth: mentaLayout.taskLane,
    paddingBottom: mentaSpacing[4],
    paddingTop: mentaSpacing[5],
    width: '100%',
  },
  orientation: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  mascot: { flexShrink: 0, height: 104, width: 104 },
  copy: { flex: 1, gap: mentaSpacing[2], minWidth: 0 },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  actions: { alignSelf: 'stretch', gap: mentaSpacing[2] },
  note: {
    ...mentaTypography.caption,
    color: mentaColors.text.muted,
  },
});
