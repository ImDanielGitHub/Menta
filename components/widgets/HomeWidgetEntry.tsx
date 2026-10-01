import {
  type MentaPalette,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { MentaMascot } from '@/components/ui/MentaMascot';

import { useTranslation } from '@/lib/localization';
import { useHomeWidgetStore } from '@/store/home-widget-store';

export function HomeWidgetEntry() {
  const { styles } = useMentaStyles(createPaletteStyles);

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

const createPaletteStyles = (mentaColors: MentaPalette) => {
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
  });
  return { styles };
};
