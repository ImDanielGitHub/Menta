import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { MentaMascot } from '@/components/ui/MentaMascot';
import { AppButton } from '@/components/ui/AppButton';
import { XIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import {
  saveHomeWidgetPreferences,
  useHomeWidgetStore,
} from '@/store/home-widget-store';

export function HomeWidgetEntry() {
  const available = useHomeWidgetStore(
    state => state.available && Boolean(state.ownerId)
  );
  const { t } = useTranslation();
  const router = useRouter();
  if (!available) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('widgets.title')}
      onPress={() => router.push('/home-widget')}
      style={({ pressed }) => [styles.entry, pressed && styles.pressed]}
    >
      <MentaMascot state="today-clear" size="md" style={styles.mascot} />
      <View style={styles.copy}>
        <Text style={styles.title}>{t('widgets.title')}</Text>
        <Text style={styles.body}>{t('widgets.entryDetail')}</Text>
        <Text style={styles.link}>{t('widgets.choose')} →</Text>
      </View>
    </Pressable>
  );
}

export function TodayWidgetInvitation({ eligible }: { eligible: boolean }) {
  const show = useHomeWidgetStore(
    state =>
      state.available &&
      state.ready &&
      Boolean(state.ownerId) &&
      !state.preferences.dismissed &&
      !state.preferences.promiseId
  );
  const saving = useHomeWidgetStore(state => state.saving);
  const { t } = useTranslation();
  const router = useRouter();
  if (!eligible || !show) return null;
  return (
    <View style={styles.invitation} testID="today-widget-invitation">
      <View style={styles.headingRow}>
        <Text accessibilityRole="header" style={styles.invitationTitle}>
          {t('widgets.heading')}
        </Text>
        <AppButton
          title=""
          accessibilityLabel={t('widgets.dismiss')}
          variant="ghost"
          size="small"
          icon={<XIcon size={20} color={mentaColors.text.secondary} />}
          disabled={saving}
          onPress={() => {
            void saveHomeWidgetPreferences({ dismissed: true });
          }}
        />
      </View>
      <Text style={styles.body}>{t('widgets.inviteDetail')}</Text>
      <AppButton
        title={`${t('widgets.seeWidget')} →`}
        variant="ghost"
        onPress={() => router.push('/home-widget')}
        style={styles.inviteAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    minHeight: mentaLayout.minimumTouchTarget,
    paddingVertical: mentaSpacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[4],
  },
  mascot: { width: 76, height: 76, flexShrink: 0 },
  copy: { flex: 1, minWidth: 0, gap: 7 },
  title: { ...mentaTypography.bodySemibold, color: mentaColors.text.primary },
  body: { ...mentaTypography.bodySmall, color: mentaColors.text.secondary },
  link: { ...mentaTypography.bodySmall, color: mentaColors.action },
  pressed: { opacity: 0.7 },
  invitation: { gap: mentaSpacing[3], paddingVertical: mentaSpacing[5] },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  invitationTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    flex: 1,
  },
  inviteAction: { alignSelf: 'flex-start' },
});
