import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from '@/lib/localization';

import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';

type ReferralInviteQRCodeProps = {
  link: string | null;
  state: 'preparing' | 'ready' | 'unavailable';
  size?: number;
};

const DEFAULT_QR_SIZE = 220;

export function ReferralInviteQRCode({
  link,
  state,
  size = DEFAULT_QR_SIZE,
}: ReferralInviteQRCodeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          alignItems: 'center',
          gap: mentaSpacing[2],
          paddingVertical: mentaSpacing[4],
        },
        title: {
          ...mentaTypography.title,
          color: colors.text.primary,
          textAlign: 'center',
        },
        body: {
          ...mentaTypography.bodySmall,
          color: colors.text.secondary,
          maxWidth: 300,
          textAlign: 'center',
        },
        paper: {
          alignItems: 'center',
          backgroundColor: mentaColors.paper,
          borderColor: colors.border.primary,
          borderRadius: mentaRadii.large,
          borderWidth: StyleSheet.hairlineWidth,
          height: size + mentaSpacing[4] * 2,
          justifyContent: 'center',
          marginTop: mentaSpacing[2],
          padding: mentaSpacing[4],
          width: size + mentaSpacing[4] * 2,
        },
        placeholder: {
          alignItems: 'center',
          backgroundColor: colors.background.secondary,
          height: size,
          justifyContent: 'center',
          padding: mentaSpacing[5],
          width: size,
        },
        placeholderText: {
          ...mentaTypography.bodySmall,
          color: colors.text.secondary,
          textAlign: 'center',
        },
      }),
    [colors, size]
  );

  const isReady = state === 'ready' && Boolean(link);

  return (
    <View style={styles.section} testID="referral-invite-qr-section">
      <Text style={styles.title}>{t('groups.referral.title')}</Text>
      <Text style={styles.body}>{t('groups.referral.body')}</Text>
      <View
        accessible={isReady}
        accessibilityLabel={isReady ? t('groups.referral.qr_label') : undefined}
        style={styles.paper}
        testID="referral-invite-qr-paper"
      >
        {isReady && link ? (
          <QRCode
            backgroundColor={mentaColors.paper}
            color={mentaColors.text.onPaper}
            quietZone={Math.max(12, Math.round(size * 0.06))}
            size={size}
            value={link}
          />
        ) : (
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
            style={styles.placeholder}
            testID="referral-invite-qr-placeholder"
          >
            <Text style={styles.placeholderText}>
              {state === 'unavailable'
                ? t('groups.referral.qr_unavailable')
                : t('groups.referral.qr_preparing')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
