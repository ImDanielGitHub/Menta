import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ConfirmActionButton from '@/components/ui/ConfirmActionButton';
import { AppTextField } from '@/components/ui/AppFields';
import { ArrowRightIcon, HashIcon, QrCodeIcon } from '@/components/ui/icons';
import { useTranslation } from '@/lib/localization';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

type JoinGroupScanSectionProps = {
  onOpenScanner: () => void;
  onEnterCode: () => void;
};

export const JoinGroupScanSection: React.FC<JoinGroupScanSectionProps> = ({
  onOpenScanner,
  onEnterCode,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionBody}>
      <Text style={styles.modeDescription}>
        {t('groups.join.scan_mode_detail')}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenScanner}
        style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
      >
        <QrCodeIcon size={30} color={mentaColors.action} />
        <Text style={styles.scanButtonText}>
          {t('groups.join.open_camera')}
        </Text>
        <Text style={styles.scanButtonSubtext}>
          {t('groups.join.scan_prompt')}
        </Text>
      </Pressable>
      <JoinGroupModeSwitch
        label={t('groups.join.enter_code_instead')}
        accessibilityLabel={t('groups.join.enter_code_instead')}
        onPress={onEnterCode}
        styles={styles}
      />
    </View>
  );
};

type JoinGroupCodeEntrySectionProps = {
  inviteCode: string;
  joinCost: number;
  balance: number;
  isJoining: boolean;
  signedIn: boolean;
  onInviteCodeChange: (value: string) => void;
  onJoin: () => void;
  onInsufficient: () => void;
  onScanInstead: () => void;
  onPasteCode: () => void;
};

export const JoinGroupCodeEntrySection: React.FC<
  JoinGroupCodeEntrySectionProps
> = ({
  inviteCode,
  joinCost,
  balance,
  isJoining,
  signedIn,
  onInviteCodeChange,
  onJoin,
  onInsufficient,
  onScanInstead,
  onPasteCode,
}) => {
  const { t } = useTranslation();
  const trimmedCodeLength = inviteCode.trim().length;

  return (
    <View style={styles.sectionBody}>
      <View style={styles.codePrompt}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldHeaderLabel}>
            {t('groups.join.code_required')}
          </Text>
          <Text style={styles.fieldHeaderCount}>{trimmedCodeLength}/32</Text>
        </View>
        <AppTextField
          accessibilityLabel={t('groups.join.code_accessibility')}
          value={inviteCode}
          onChangeText={onInviteCodeChange}
          placeholder={t('groups.join.code_placeholder')}
          maxLength={32}
          autoCapitalize="characters"
          autoCorrect={false}
          helperText={t('groups.join.code_helper')}
          right={<HashIcon size={18} color={mentaColors.text.secondary} />}
        />

        <View style={styles.quickActionRow}>
          <JoinGroupQuickAction
            label={t('groups.join.scan_qr')}
            accessibilityLabel={t('groups.join.scan_qr_accessibility')}
            onPress={onScanInstead}
            icon={<QrCodeIcon size={18} color={mentaColors.text.primary} />}
            styles={styles}
          />
          <JoinGroupQuickAction
            label={t('groups.join.paste_code')}
            accessibilityLabel={t('groups.join.paste_accessibility')}
            onPress={onPasteCode}
            icon={<HashIcon size={18} color={mentaColors.text.primary} />}
            styles={styles}
          />
        </View>

        <View style={styles.joinCostNotice}>
          <Text style={styles.joinCostNoticeText}>
            {t('groups.join.preview_intro')}{' '}
            {joinCost === 0
              ? t('groups.join.preview_free')
              : joinCost > 0
                ? t('groups.join.preview_paid', { cost: joinCost })
                : t('groups.join.preview_unknown')}
          </Text>
        </View>

        <ConfirmActionButton
          title={
            !signedIn
              ? t('groups.join.sign_in')
              : isJoining
                ? t('groups.join.joining')
                : t('groups.join.join_group')
          }
          cost={joinCost}
          balance={balance}
          processing={isJoining}
          disabled={!inviteCode.trim()}
          onConfirm={onJoin}
          onInsufficient={onInsufficient}
          showCostInTitle={signedIn && joinCost > 0}
        />
      </View>
    </View>
  );
};

type JoinGroupEntryStyles = typeof styles;

const JoinGroupModeSwitch = ({
  label,
  accessibilityLabel,
  onPress,
  styles,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  styles: JoinGroupEntryStyles;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
  >
    <Text style={styles.secondaryActionText}>{label}</Text>
    <ArrowRightIcon size={16} color={mentaColors.text.muted} />
  </Pressable>
);

const JoinGroupQuickAction = ({
  label,
  accessibilityLabel,
  icon,
  onPress,
  styles,
}: {
  label: string;
  accessibilityLabel: string;
  icon: React.ReactNode;
  onPress: () => void;
  styles: JoinGroupEntryStyles;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
  >
    {icon}
    <Text style={styles.quickActionText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  sectionBody: {
    gap: mentaSpacing[4],
  },
  modeDescription: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  codePrompt: {
    gap: mentaSpacing[4],
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  fieldHeaderLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.primary,
  },
  fieldHeaderCount: {
    ...mentaTypography.caption,
    color: mentaColors.text.muted,
  },
  scanButton: {
    minHeight: 150,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mentaSpacing[6],
    gap: mentaSpacing[2],
    backgroundColor: mentaColors.surface,
  },
  pressed: {
    opacity: 0.72,
  },
  scanButtonText: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  scanButtonSubtext: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    textAlign: 'center',
  },
  secondaryAction: {
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
    paddingVertical: mentaSpacing[2],
  },
  secondaryActionText: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.secondary,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  quickAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    backgroundColor: mentaColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[2],
    paddingHorizontal: mentaSpacing[3],
  },
  quickActionText: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
  },
  joinCostNotice: {
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    backgroundColor: mentaColors.raised,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: mentaSpacing[2],
  },
  joinCostNoticeText: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
});
