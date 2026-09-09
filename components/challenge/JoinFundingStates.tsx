import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
  SkeletonLoader,
} from '@/components/ui';
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  CoinsIcon,
} from '@/components/ui/icons';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import type {
  ChallengeJoinQuote,
  ChallengeJoinReceipt,
} from '@/lib/challenges/join-funding-contract';
import {
  accountabilityInviteAcceptLabel,
  accountabilityInviteMeaning,
  accountabilityInviteRoleCopy,
} from '@/lib/promises/accountability';
import { useTranslation } from '@/lib/localization';
import {
  PromiseInviteContextLine,
  PromiseInviteRoleHero,
} from '@/components/onboarding/PromiseInviteRoleHero';
import { trackProductEvent } from '@/lib/posthog';

type JoinFrameProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  onBack: () => void;
  testID: string;
};

type JoinTone = 'muted' | 'action' | 'success' | 'warning' | 'danger';

const toneColors: Record<JoinTone, string> = {
  muted: mentaColors.text.muted,
  action: mentaColors.action,
  success: mentaColors.success,
  warning: mentaColors.warning,
  danger: mentaColors.danger,
};

const JoinFrame = ({
  title,
  description,
  children,
  actions,
  onBack,
  testID,
}: JoinFrameProps) => {
  const phoneLayout = usePhoneLayout();
  const { t } = useTranslation();
  return (
    <AppScreen
      lane="focused"
      safeArea
      scrollable
      showsVerticalScrollIndicator={false}
      hasTabBar={false}
      style={styles.screen}
      contentContainerStyle={styles.contentFrame}
      testID={testID}
    >
      <View style={styles.frame}>
        <AppTopBar
          title={t('groups.join.promise_title')}
          backLabel={t('groups.join.back')}
          onBack={onBack}
          style={styles.topBar}
        />

        <View style={styles.body}>
          <View style={styles.headingBlock}>
            <Text
              style={[
                styles.title,
                {
                  lineHeight: 38 + phoneLayout.headingLineHeightBoost,
                },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.description,
                {
                  lineHeight:
                    mentaTypography.body.lineHeight +
                    phoneLayout.bodyLineHeightBoost,
                },
              ]}
            >
              {description}
            </Text>
          </View>
          {children}
        </View>

        <View style={styles.actions}>{actions}</View>
      </View>
    </AppScreen>
  );
};

type ReceiptRowProps = {
  title: string;
  subtitle?: string;
  value: string;
  icon?: React.ReactNode;
  valueTone?: JoinTone;
  variant?: 'ledger' | 'receipt';
  last?: boolean;
};

const ReceiptRow = ({
  title,
  subtitle,
  value,
  icon,
  valueTone = 'muted',
  variant = 'receipt',
  last,
}: ReceiptRowProps) => {
  const phoneLayout = usePhoneLayout();
  const stacked = phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2;
  return (
    <View
      style={[
        styles.receiptRow,
        stacked && styles.receiptRowStacked,
        variant === 'ledger' ? styles.ledgerRow : null,
        last ? null : styles.receiptDivider,
      ]}
    >
      {icon ? <View style={styles.receiptIconLane}>{icon}</View> : null}
      <View style={styles.receiptCopy}>
        <Text
          style={
            variant === 'ledger' ? styles.ledgerTitle : styles.receiptTitle
          }
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.receiptSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Text
        style={[
          variant === 'ledger' ? styles.ledgerValue : styles.receiptValue,
          stacked && styles.receiptValueStacked,
          stacked && Boolean(icon) ? styles.receiptValueStackedWithIcon : null,
          { color: toneColors[valueTone] },
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

export const JoinFundingLoadingState = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  return (
    <JoinFrame
      title={t('groups.join.loading_title')}
      description={t('groups.join.loading_detail')}
      onBack={onBack}
      testID="join-funding-loading"
      actions={
        <AppButton
          title={t('groups.join.loading_action')}
          onPress={() => undefined}
          loading
          fullWidth
          variant="accent"
        />
      }
    >
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t('groups.join.loading_accessibility')}
        style={styles.loadingStack}
      >
        <SkeletonLoader
          announce={false}
          height={58}
          borderRadius={mentaRadii.small}
        />
        <SkeletonLoader
          announce={false}
          height={58}
          borderRadius={mentaRadii.small}
        />
        <SkeletonLoader
          announce={false}
          height={74}
          borderRadius={mentaRadii.medium}
        />
      </View>
    </JoinFrame>
  );
};

export const JoinFundingReviewState = ({
  quote,
  joining,
  onJoin,
  onMaybeLater,
  onBack,
}: {
  quote: ChallengeJoinQuote;
  joining: boolean;
  onJoin: () => void;
  onMaybeLater: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const roleCopy = quote.accountabilityRole
    ? accountabilityInviteRoleCopy(quote.accountabilityRole, t)
    : null;
  React.useEffect(() => {
    if (!quote.accountabilityRole) return;
    trackProductEvent('Promise Invite Journey', {
      action: 'viewed',
      authenticated: true,
      entry_point: 'acceptance_review',
      outcome: quote.eligible ? 'eligible' : 'already_joined',
      role: quote.accountabilityRole,
      stage: 'acceptance',
    });
  }, [quote.accountabilityRole, quote.eligibilityCode, quote.eligible]);
  return (
    <JoinFrame
      title={
        roleCopy
          ? quote.inviterName
            ? t('groups.join.invited_you', { inviter: quote.inviterName })
            : t('groups.join.promise_invite_title')
          : t('groups.join.review_title', {
              name: quote.groupName ?? quote.challengeTitle,
            })
      }
      description={
        roleCopy && quote.accountabilityRole
          ? accountabilityInviteMeaning(
              quote.accountabilityRole,
              quote.challengeTitle,
              t
            )
          : t('groups.join.review_detail')
      }
      onBack={onBack}
      testID="join-funding-JOIN-00"
      actions={
        <>
          <AppButton
            title={
              roleCopy && quote.accountabilityRole && quote.cost === 0
                ? accountabilityInviteAcceptLabel(quote.accountabilityRole, t)
                : t('groups.join.confirm', { cost: quote.cost })
            }
            onPress={() => {
              if (quote.accountabilityRole) {
                trackProductEvent('Promise Invite Journey', {
                  action: 'requested',
                  authenticated: true,
                  entry_point: 'acceptance_review',
                  outcome: 'pending',
                  role: quote.accountabilityRole,
                  stage: 'acceptance',
                });
              }
              onJoin();
            }}
            loading={joining}
            disabled={joining || !quote.eligible}
            preserveLabelPositionOnLoading
            fullWidth
            size="large"
            variant="accent"
            rightIcon={<ArrowRightIcon size={20} color={mentaColors.canvas} />}
            style={styles.compactPrimaryButton}
            testID="join-funding-confirm"
          />
          <AppButton
            title={t('groups.join.maybe_later')}
            onPress={onMaybeLater}
            disabled={joining}
            fullWidth
            variant="ghost"
          />
        </>
      }
    >
      {roleCopy && quote.accountabilityRole ? (
        <View style={styles.promiseInviteReview}>
          <PromiseInviteRoleHero
            compact
            role={quote.accountabilityRole}
            title={roleCopy.title}
            detail={accountabilityInviteMeaning(
              quote.accountabilityRole,
              quote.challengeTitle,
              t
            )}
            testID="join-funding-role-context"
          />
          <PromiseInviteContextLine
            label={t('fullAuth.shared.promise')}
            promise={quote.challengeTitle}
            detail={roleCopy.title}
            testID="join-funding-promise-context"
          />
          <ReceiptRow
            title={t('groups.join.cost')}
            value={t('groups.join.momenta_value', { amount: quote.cost })}
            variant="ledger"
            last
          />
        </View>
      ) : (
        <View style={styles.ledger}>
          <ReceiptRow
            title={t('groups.join.cost')}
            value={t('groups.join.momenta_value', { amount: quote.cost })}
            variant="ledger"
          />
          <ReceiptRow
            title={t('groups.join.available')}
            value={t('groups.join.momenta_value', {
              amount: quote.availableBalance,
            })}
            variant="ledger"
            last
          />
        </View>
      )}
    </JoinFrame>
  );
};

export const JoinInsufficientMomentaState = ({
  quote,
  onEarn,
  onKeepCreating,
  onBack,
}: {
  quote: ChallengeJoinQuote;
  onEarn: () => void;
  onKeepCreating: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <JoinFrame
      title={t('groups.join.need_more_title', { shortfall: quote.shortfall })}
      description={t('groups.join.need_more_detail')}
      onBack={onBack}
      testID="join-funding-JOIN-01"
      actions={
        <>
          <AppButton
            title={t('groups.join.earn')}
            onPress={onEarn}
            fullWidth
            size="large"
            variant="accent"
            style={styles.compactPrimaryButton}
          />
          <AppButton
            title={t('groups.join.back_today')}
            onPress={onKeepCreating}
            fullWidth
            variant="ghost"
          />
        </>
      }
    >
      <View style={styles.ledger}>
        <ReceiptRow
          title={t('groups.join.cost')}
          value={t('groups.join.momenta_value', { amount: quote.cost })}
          variant="ledger"
        />
        <ReceiptRow
          title={t('groups.join.available')}
          value={t('groups.join.momenta_value', {
            amount: quote.availableBalance,
          })}
          valueTone="danger"
          variant="ledger"
          last
        />
      </View>
      <AppInlineNotice
        title={t('groups.join.not_reserved_title')}
        description={t('groups.join.not_reserved_detail')}
        tone="warning"
        style={styles.safeRecoveryNotice}
        testID="join-funding-safe-recovery"
      />
    </JoinFrame>
  );
};

export const JoinConfirmedReceiptState = ({
  receipt,
  firstDueLabel,
  onOpen,
  onBackToToday,
  onBack,
}: {
  receipt: ChallengeJoinReceipt;
  firstDueLabel: string;
  onOpen: () => void;
  onBackToToday: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const roleCopy = receipt.accountabilityRole
    ? accountabilityInviteRoleCopy(receipt.accountabilityRole, t)
    : null;
  const destination = receipt.groupName
    ? t('groups.preview.group')
    : t('term.promise');
  const joinedName = roleCopy
    ? receipt.challengeTitle
    : (receipt.groupName ?? receipt.challengeTitle);
  React.useEffect(() => {
    if (!receipt.accountabilityRole) return;
    trackProductEvent('Promise Invite Journey', {
      action: 'completed',
      authenticated: true,
      entry_point: 'acceptance_receipt',
      outcome: 'confirmed',
      role: receipt.accountabilityRole,
      stage: 'acceptance',
    });
  }, [receipt.accountabilityRole, receipt.receiptId]);

  return (
    <JoinFrame
      title={t('groups.join.confirmed_title', { name: joinedName })}
      description={
        roleCopy
          ? accountabilityInviteMeaning(
              receipt.accountabilityRole as NonNullable<
                ChallengeJoinReceipt['accountabilityRole']
              >,
              receipt.challengeTitle,
              t
            )
          : t('groups.join.confirmed_detail', { destination })
      }
      onBack={onBack}
      testID="join-funding-JOIN-02"
      actions={
        <>
          <AppButton
            title={
              roleCopy
                ? t('groups.join.open_promise')
                : receipt.groupId
                  ? t('groups.join.open_group')
                  : t('groups.join.open_promise')
            }
            onPress={onOpen}
            fullWidth
            size="large"
            variant="accent"
            testID="join-funding-open-confirmed"
          />
          <AppButton
            title={t('groups.join.back_today')}
            onPress={onBackToToday}
            fullWidth
            variant="ghost"
          />
        </>
      }
    >
      {roleCopy && receipt.accountabilityRole ? (
        <PromiseInviteRoleHero
          compact
          role={receipt.accountabilityRole}
          title={roleCopy.title}
          detail={accountabilityInviteMeaning(
            receipt.accountabilityRole,
            receipt.challengeTitle,
            t
          )}
          testID="join-confirmed-role-context"
        />
      ) : null}
      <View style={[styles.receiptBlock, styles.confirmedReceiptBlock]}>
        <Text style={styles.receiptLabel}>
          {t('groups.join.receipt_label')}
        </Text>
        <ReceiptRow
          title={
            roleCopy ? t('groups.admin.your_role') : t('groups.join.membership')
          }
          subtitle={joinedName}
          value={roleCopy?.title ?? t('groups.join.joined')}
          icon={<CheckIcon size={18} color={mentaColors.success} />}
          valueTone="success"
          last={Boolean(roleCopy && receipt.accountabilityRole !== 'partner')}
        />
        {!roleCopy ? (
          <ReceiptRow
            title={t('groups.join.momenta')}
            subtitle={t('groups.join.new_balance', {
              balance: receipt.newBalance,
            })}
            value={
              receipt.debitAmount > 0
                ? t('groups.join.debit', { amount: receipt.debitAmount })
                : t('groups.join.no_charge')
            }
            icon={<CoinsIcon size={18} color={mentaColors.text.secondary} />}
          />
        ) : null}
        {roleCopy && receipt.accountabilityRole !== 'partner' ? null : (
          <ReceiptRow
            title={t('groups.join.first_proof')}
            subtitle={receipt.firstProofTitle}
            value={firstDueLabel}
            icon={<ClockIcon size={18} color={mentaColors.warning} />}
            valueTone="warning"
            last
          />
        )}
      </View>
    </JoinFrame>
  );
};

export const JoinResultUnknownRuntimeState = ({
  checking,
  message,
  onCheck,
  onBackToSafety,
  onBack,
}: {
  checking: boolean;
  message?: string | null;
  onCheck: () => void;
  onBackToSafety: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <JoinFrame
      title={t('groups.join.check_status_title')}
      description={t('groups.join.check_status_detail')}
      onBack={onBack}
      testID="join-funding-JOIN-03"
      actions={
        <>
          <AppButton
            title={t('groups.join.check_status')}
            onPress={onCheck}
            loading={checking}
            disabled={checking}
            fullWidth
            size="large"
            variant="accent"
            testID="join-funding-reconcile"
          />
          <AppButton
            title={t('groups.join.return_today')}
            onPress={onBackToSafety}
            disabled={checking}
            fullWidth
            variant="ghost"
          />
        </>
      }
    >
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.statusMessage}>
          {message}
        </Text>
      ) : null}
      <AppInlineNotice
        title={t('groups.join.second_paused_title')}
        description={t('groups.join.second_paused_detail')}
        tone="warning"
      />
    </JoinFrame>
  );
};

export const JoinFundingFailureState = ({
  title,
  message,
  actionLabel,
  onAction,
  onBack,
}: {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <JoinFrame
      title={title ?? t('groups.join.failed_title')}
      description={t('groups.join.failed_detail')}
      onBack={onBack}
      testID="join-funding-failed"
      actions={
        <>
          {actionLabel && onAction ? (
            <AppButton
              title={actionLabel}
              onPress={onAction}
              fullWidth
              size="large"
              variant="accent"
            />
          ) : null}
          <AppButton
            title={t('groups.join.back')}
            onPress={onBack}
            fullWidth
            variant="ghost"
          />
        </>
      }
    >
      <AppInlineNotice
        title={t('groups.join.no_change')}
        description={message}
        tone="warning"
        testID="join-funding-failure-message"
      />
    </JoinFrame>
  );
};

export const JoinMembershipWithoutReceiptState = ({
  message,
  onOpen,
  onBack,
}: {
  message: string;
  onOpen: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <JoinFrame
      title={t('groups.join.already_title')}
      description={message}
      onBack={onBack}
      testID="join-funding-membership-without-receipt"
      actions={
        <>
          <AppButton
            title={t('groups.join.open_promise')}
            onPress={onOpen}
            fullWidth
            size="large"
            variant="accent"
          />
          <AppButton
            title={t('groups.join.back')}
            onPress={onBack}
            fullWidth
            variant="ghost"
          />
        </>
      }
    >
      <Text style={styles.boundaryCopy}>{t('groups.join.boundary')}</Text>
    </JoinFrame>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
  },
  contentFrame: {
    width: '100%',
    alignSelf: 'center',
  },
  frame: {
    flex: 1,
    gap: mentaSpacing[6],
    minHeight: '100%',
  },
  topBar: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  body: {
    gap: mentaSpacing[6],
    paddingTop: mentaSpacing[6],
  },
  headingBlock: {
    gap: mentaSpacing[2],
  },
  title: {
    ...mentaTypography.heading,
    fontSize: 34,
    lineHeight: 38,
    color: mentaColors.text.primary,
  },
  description: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  ledger: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
  promiseInviteReview: {
    gap: mentaSpacing[4],
  },
  receiptBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.surface,
    paddingHorizontal: mentaSpacing[4],
  },
  receiptLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.muted,
    paddingTop: mentaSpacing[4],
  },
  confirmedReceiptBlock: {
    borderColor: mentaColors.border,
  },
  receiptRow: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  receiptRowStacked: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  ledgerRow: {
    minHeight: 58,
    paddingVertical: mentaSpacing[4],
  },
  receiptIconLane: {
    width: mentaLayout.iconLane,
    height: mentaLayout.iconLane,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  receiptDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  receiptCopy: {
    flex: 1,
    gap: mentaSpacing[1],
  },
  receiptTitle: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  receiptSubtitle: {
    ...mentaTypography.caption,
    color: mentaColors.text.primary,
  },
  receiptValue: {
    ...mentaTypography.caption,
    fontFamily: mentaTypography.bodySmallMedium.fontFamily,
    textAlign: 'right',
    flexShrink: 0,
  },
  receiptValueStacked: {
    textAlign: 'left',
    width: '100%',
  },
  receiptValueStackedWithIcon: {
    paddingLeft: mentaLayout.iconLane + mentaSpacing[4],
  },
  ledgerTitle: {
    ...mentaTypography.body,
    fontSize: 16,
    lineHeight: 20,
    color: mentaColors.text.primary,
  },
  ledgerValue: {
    ...mentaTypography.control,
    textAlign: 'right',
    flexShrink: 0,
  },
  actions: {
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
    paddingBottom: mentaSpacing[4],
  },
  loadingStack: {
    gap: mentaSpacing[4],
  },
  compactPrimaryButton: {
    minHeight: 54,
    borderRadius: mentaRadii.small,
  },
  safeRecoveryNotice: {
    borderRadius: mentaRadii.small,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  statusMessage: {
    ...mentaTypography.caption,
    color: mentaColors.warning,
  },
  boundaryCopy: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
});
