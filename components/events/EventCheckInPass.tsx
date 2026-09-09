import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';

export function EventCheckInPass({
  code,
  size = 216,
}: {
  code: string;
  size?: number;
}) {
  const { t } = useTranslation();
  const qrSize = Math.min(224, Math.max(208, size));

  return (
    <View testID="event-check-in-pass" style={styles.card}>
      <View
        accessible
        accessibilityLabel={t('events.pass.qr_accessibility')}
        accessibilityRole="image"
        style={styles.qrShell}
      >
        <QRCode
          value={code}
          size={qrSize}
          color={mentaColors.text.onPaper}
          backgroundColor={mentaColors.paper}
          quietZone={8}
        />
      </View>
      <Text style={styles.label}>{t('events.pass.code_label')}</Text>
      <Text style={styles.help}>{t('events.pass.qr_help')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    gap: mentaSpacing[2],
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[5],
    width: '100%',
  },
  qrShell: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.medium,
    overflow: 'hidden',
  },
  label: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.onPaper,
    marginTop: mentaSpacing[1],
    textAlign: 'center',
  },
  help: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
    textAlign: 'center',
  },
});
