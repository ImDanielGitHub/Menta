import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppButton } from '@/components/ui/AppButton';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { ArrowRightIcon } from '@/components/ui/icons';
import { useTranslation, type TranslationKey } from '@/lib/localization';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

export type JoinGroupNotice = {
  tone: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  action?: 'open_group' | 'funding' | 'sign_in' | 'quota';
  receipt?: 'joined' | 'already_member';
  groupId?: string | null;
  groupName?: string;
};

export const getJoinGroupReceiptCopy = ({
  alreadyMember,
  joinCost,
  groupName,
  translateCopy,
}: {
  alreadyMember: boolean;
  joinCost: number;
  groupName?: string;
  translateCopy?: (key: TranslationKey, values?: TranslationValues) => string;
}) => ({
  label: alreadyMember
    ? translateCopy
      ? translateCopy('groups.join.receipt.already')
      : translate('en-NZ', 'groups.join.receipt.already')
    : translateCopy
      ? translateCopy('groups.join.receipt.joined')
      : translate('en-NZ', 'groups.join.receipt.joined'),
  title: alreadyMember
    ? translateCopy
      ? translateCopy('groups.join.receipt.already_title')
      : translate('en-NZ', 'groups.join.receipt.already_title')
    : translateCopy
      ? translateCopy('groups.join.receipt.joined_title', {
          group:
            groupName ||
            (translateCopy
              ? translateCopy('groups.join.receipt.group_fallback')
              : translate('en-NZ', 'groups.join.receipt.group_fallback')),
        })
      : translate('en-NZ', 'groups.join.receipt.joined_title', {
          group:
            groupName ||
            translate('en-NZ', 'groups.join.receipt.group_fallback'),
        }),
  description: alreadyMember
    ? translateCopy
      ? translateCopy('groups.join.receipt.already_detail')
      : translate('en-NZ', 'groups.join.receipt.already_detail')
    : joinCost === 0
      ? translateCopy
        ? translateCopy('groups.join.receipt.free_detail')
        : translate('en-NZ', 'groups.join.receipt.free_detail')
      : translateCopy
        ? translateCopy('groups.join.receipt.spent_detail', { cost: joinCost })
        : translate('en-NZ', 'groups.join.receipt.spent_detail', {
            cost: joinCost,
          }),
  spendLabel: translateCopy
    ? translateCopy('groups.join.receipt.spent_label')
    : translate('en-NZ', 'groups.join.receipt.spent_label'),
  spendValue:
    alreadyMember || joinCost === 0
      ? translateCopy
        ? translateCopy('groups.join.receipt.zero')
        : translate('en-NZ', 'groups.join.receipt.zero')
      : translateCopy
        ? translateCopy('groups.join.receipt.spent_value', { cost: joinCost })
        : translate('en-NZ', 'groups.join.receipt.spent_value', {
            cost: joinCost,
          }),
  nextMove: alreadyMember
    ? translateCopy
      ? translateCopy('groups.join.open_group')
      : translate('en-NZ', 'groups.join.open_group')
    : translateCopy
      ? translateCopy('groups.join.receipt.view_group')
      : translate('en-NZ', 'groups.join.receipt.view_group'),
});

type JoinGroupReceiptSectionProps = {
  notice: JoinGroupNotice;
  joinCost: number;
  onOpenGroup: (groupId?: string | null) => void;
  onJoinAnother: () => void;
};

export const JoinGroupReceiptSection: React.FC<
  JoinGroupReceiptSectionProps
> = ({ notice, joinCost, onOpenGroup, onJoinAnother }) => {
  const { t } = useTranslation();
  const isAlreadyMemberReceipt = notice.receipt === 'already_member';
  const copy = getJoinGroupReceiptCopy({
    alreadyMember: isAlreadyMemberReceipt,
    joinCost,
    groupName: notice.groupName,
    translateCopy: t,
  });

  return (
    <View style={styles.receiptShell}>
      <View style={styles.receiptHeader}>
        <MentaMascot
          state={isAlreadyMemberReceipt ? 'quiet-anchor' : 'celebration'}
          size="md"
        />
        <Text style={styles.receiptLabel}>{copy.label}</Text>
        <Text style={styles.receiptTitle}>{copy.title}</Text>
        <Text style={styles.receiptDescription}>{copy.description}</Text>
      </View>

      <View style={styles.receiptRows}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptRowLabel}>
            {t('groups.preview.group')}
          </Text>
          <Text style={styles.receiptRowValue}>
            {notice.groupName || t('groups.create.open_group')}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptRowLabel}>{copy.spendLabel}</Text>
          <Text style={styles.receiptRowValue}>{copy.spendValue}</Text>
        </View>
        <View style={[styles.receiptRow, styles.receiptRowLast]}>
          <Text style={styles.receiptRowLabel}>
            {t('groups.join.receipt.next_move')}
          </Text>
          <Text style={styles.receiptRowValue}>{copy.nextMove}</Text>
        </View>
      </View>

      <View style={styles.receiptActions}>
        <AppButton
          title={
            notice.groupId
              ? isAlreadyMemberReceipt
                ? t('groups.join.open_group')
                : t('groups.join.receipt.view_group')
              : t('groups.join.receipt.view_groups')
          }
          onPress={() => onOpenGroup(notice.groupId)}
        />
        <AppButton
          title={
            isAlreadyMemberReceipt
              ? t('groups.join.receipt.use_another')
              : t('groups.join.receipt.join_another')
          }
          variant="secondary"
          onPress={onJoinAnother}
        />
      </View>
    </View>
  );
};

type JoinGroupActionNoticeSectionProps = {
  notice: JoinGroupNotice;
  onOpenGroup: (groupId?: string | null) => void;
  onShowFunding: () => void;
  onShowQuota?: () => void;
  onTryAnotherCode: () => void;
  onSignIn: () => void;
};

export const JoinGroupActionNoticeSection: React.FC<
  JoinGroupActionNoticeSectionProps
> = ({
  notice,
  onOpenGroup,
  onShowFunding,
  onShowQuota,
  onTryAnotherCode,
  onSignIn,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionShell}>
      <AppInlineNotice
        title={notice.title}
        description={notice.description}
        tone={notice.tone}
        testID="join-group-action-notice"
      />
      {notice.action ? (
        <View style={styles.noticeActions}>
          {notice.action === 'open_group' ? (
            <AppButton
              title={
                notice.groupId
                  ? t('groups.join.open_group')
                  : t('groups.join.receipt.view_groups')
              }
              onPress={() => onOpenGroup(notice.groupId)}
            />
          ) : null}
          {notice.action === 'funding' ? (
            <AppButton
              title={t('groups.join.show_momenta')}
              onPress={onShowFunding}
            />
          ) : null}
          {notice.action === 'quota' && onShowQuota ? (
            <AppButton title={t('groups.join.see_pro')} onPress={onShowQuota} />
          ) : null}
          {notice.action === 'sign_in' ? (
            <AppButton
              title={t('groups.join.sign_in_now')}
              onPress={onSignIn}
            />
          ) : null}
          <AppButton
            title={t('groups.join.try_another')}
            variant="secondary"
            onPress={onTryAnotherCode}
          />
        </View>
      ) : null}
    </View>
  );
};

type JoinGroupFundingOptionsSectionProps = {
  visible: boolean;
  /** A cost is only rendered when it came from a server quote. */
  joinCost?: number | null;
  onWatchAd: () => void;
  onShowPro: () => void;
};

export const JoinGroupFundingOptionsSection: React.FC<
  JoinGroupFundingOptionsSectionProps
> = ({ visible, joinCost, onWatchAd, onShowPro }) => {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.sectionShell}>
      <Text style={styles.sectionTitle}>{t('groups.join.momenta_needed')}</Text>
      <Text style={styles.sectionDescription}>
        {typeof joinCost === 'number'
          ? t('groups.join.cost_needed', { cost: joinCost })
          : t('groups.join.cost_missing')}
      </Text>
      <View style={styles.sectionBody}>
        <AppButton
          title={t('groups.join.watch_ad')}
          onPress={onWatchAd}
          variant="secondary"
        />
        <AppButton
          title={t('groups.join.see_pro_options')}
          onPress={onShowPro}
        />
      </View>
    </View>
  );
};

type JoinGroupDetailsSectionProps = {
  expanded: boolean;
  onToggle: () => void;
};

export const JoinGroupDetailsSection: React.FC<
  JoinGroupDetailsSectionProps
> = ({ expanded, onToggle }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.disclosure} testID="join-group-details-disclosure">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded
            ? t('groups.join.details_toggle_hide')
            : t('groups.join.details_toggle_show')
        }
        onPress={onToggle}
        style={({ pressed }) => [
          styles.disclosureAction,
          pressed && styles.disclosureActionPressed,
        ]}
      >
        <Text style={styles.disclosureActionText}>
          {t('groups.join.details_toggle')}
        </Text>
        <ArrowRightIcon
          size={16}
          color={mentaColors.text.muted}
          style={{
            transform: [{ rotate: expanded ? '-90deg' : '90deg' }],
          }}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.detailPanel}>
          <Text style={styles.finePrint}>{t('groups.join.details')}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionBody: {
    gap: mentaSpacing[4],
  },
  sectionShell: {
    gap: mentaSpacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    paddingVertical: mentaSpacing[4],
  },
  sectionTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  sectionDescription: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  detailPanel: {
    paddingBottom: mentaSpacing[4],
  },
  disclosure: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  receiptShell: {
    gap: mentaSpacing[6],
    paddingVertical: mentaSpacing[5],
  },
  receiptHeader: {
    gap: mentaSpacing[4],
    alignItems: 'center',
  },
  receiptLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.success,
  },
  receiptTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
    textAlign: 'center',
  },
  receiptDescription: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    textAlign: 'center',
  },
  receiptRows: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.surface,
    overflow: 'hidden',
  },
  receiptRow: {
    minHeight: 40,
    paddingHorizontal: mentaSpacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  receiptRowLast: {
    borderBottomWidth: 0,
  },
  receiptRowLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  receiptRowValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
    textAlign: 'right',
    flexShrink: 1,
  },
  receiptActions: {
    gap: mentaSpacing[2],
  },
  noticeActions: {
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[2],
  },
  disclosureAction: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
    paddingVertical: mentaSpacing[3],
  },
  disclosureActionPressed: {
    opacity: 0.72,
  },
  disclosureActionText: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  finePrint: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
});
