import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { buildInviteShareUrl } from '@/lib/invite-links';
import { useTranslation } from '@/lib/localization';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';

interface GroupInviteQRCodeProps {
  inviteCode: string;
  /** Overall frame size. The scannable matrix fills it minus padding. */
  size?: number;
  showCode?: boolean;
  /** Render the matrix on paper with no surrounding card. */
  bare?: boolean;
}

const FRAME_PADDING = 16;
const CODE_LINE_HEIGHT = 34;

export function GroupInviteQRCode({
  inviteCode,
  size = 200,
  showCode = true,
  bare = false,
}: GroupInviteQRCodeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  // The matrix takes everything the frame is not using, so a 268pt frame gives a
  // 236pt scannable code rather than the 186pt the old arithmetic produced.
  const qrSize = Math.max(
    96,
    size - FRAME_PADDING * 2 - (showCode ? CODE_LINE_HEIGHT : 0)
  );

  useEffect(() => {
    if (!inviteCode) {
      setError(t('groups.invite.no_code'));
    } else {
      setError(null);
    }
  }, [inviteCode, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: size,
          minHeight: size,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: bare ? mentaColors.paper : colors.background.surface,
          borderWidth: bare ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border.primary,
          borderRadius: mentaRadii.large,
          padding: FRAME_PADDING,
        },
        qrContainer: {
          backgroundColor: mentaColors.paper,
          borderRadius: bare ? 0 : mentaRadii.medium,
          marginBottom: showCode ? mentaSpacing[2] : 0,
        },
        errorText: {
          ...mentaTypography.caption,
          color: mentaColors.danger,
          textAlign: 'center',
          padding: mentaSpacing[3],
        },
        codeText: {
          ...mentaTypography.control,
          color: bare ? mentaColors.text.onPaper : colors.text.primary,
          letterSpacing: 2,
          textAlign: 'center',
        },
      }),
    [
      bare,
      colors.background.surface,
      colors.border.primary,
      colors.text.primary,
      showCode,
      size,
    ]
  );

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!inviteCode) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('groups.invite.no_code')}</Text>
      </View>
    );
  }

  const inviteUrl = buildInviteShareUrl('group', inviteCode);

  return (
    <View
      accessible
      accessibilityLabel={t('groups.invite.qr_label', { code: inviteCode })}
      style={styles.container}
      testID="group-invite-qr-container"
    >
      <View style={styles.qrContainer} testID="group-invite-qr-paper">
        <QRCode
          value={inviteUrl}
          size={qrSize}
          color={mentaColors.text.onPaper}
          backgroundColor={mentaColors.paper}
          // A scanner needs a light margin of at least four modules around the
          // matrix, so the quiet zone scales with the code rather than staying
          // at a fixed 10pt.
          quietZone={Math.max(12, Math.round(qrSize * 0.06))}
        />
      </View>
      {showCode ? <Text style={styles.codeText}>{inviteCode}</Text> : null}
    </View>
  );
}
