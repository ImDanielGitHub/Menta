import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ReferralInviteQRCode } from '@/components/referral/ReferralInviteQRCode';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  CalendarIcon,
  ChevronRightIcon,
  CopyIcon,
  GiftIcon,
  Share2Icon,
} from '@/components/ui/icons';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import {
  SettingsDirectRow,
  SettingsSectionLabel,
} from '@/components/settings/SettingsDirectRow';
import { useAuthStore } from '@/store/auth-store';
import {
  useReferralStore,
  type ReferralProgramStatus,
  type UserReferral,
} from '@/store/referral-store';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackMetaAdsInviteFriend } from '@/lib/meta-ads';
import { trackProductOperation } from '@/lib/posthog';
import { useTranslation } from '@/lib/localization';
import { addBreadcrumb } from '@/lib/sentry';

type InviteState =
  | 'ready'
  | 'preparing'
  | 'handoff'
  | 'returned'
  | 'copied'
  | 'unavailable';

type ReferralProgrammeState =
  | { kind: 'checking' }
  | { kind: 'ready'; status: ReferralProgramStatus }
  | { kind: 'unavailable' };

type ReferralQrState = 'preparing' | 'ready' | 'unavailable';

type ActiveLinkLoad = {
  accountId: string;
  promise: Promise<string>;
  requestId: number;
};

const resetMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const formatResetDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return `${date.getUTCDate()} ${resetMonths[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export default function ShareInviteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const insetPadding = screenInsetPadding(phoneLayout);
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const generateReferralLink = useReferralStore(
    state => state.generateReferralLink
  );
  const getReferralProgramStatus = useReferralStore(
    state => state.getReferralProgramStatus
  );
  const fetchUserReferrals = useReferralStore(
    state => state.fetchUserReferrals
  );
  const userReferrals = useReferralStore(state => state.userReferrals);
  const referralHistoryLoading = useReferralStore(state => state.isLoading);
  const referralHistoryError = useReferralStore(state => state.error);
  const [state, setState] = useState<InviteState>('preparing');
  const [link, setLink] = useState<string | null>(null);
  const [qrState, setQrState] = useState<ReferralQrState>('preparing');
  const [showQr, setShowQr] = useState(false);
  const [showProgramme, setShowProgramme] = useState(false);
  const [footerHeight, setFooterHeight] = useState(180);
  const [referralProgramme, setReferralProgramme] =
    useState<ReferralProgrammeState>({ kind: 'checking' });
  const accountIdRef = useRef<string | null>(user?.id ?? null);
  accountIdRef.current = user?.id ?? null;
  const requestRef = useRef(0);
  const handoffRequestRef = useRef(0);
  const linkAccountIdRef = useRef<string | null>(null);
  const activeLinkLoadRef = useRef<ActiveLinkLoad | null>(null);
  const programmeRequestRef = useRef(0);

  useEffect(() => {
    addBreadcrumb('route_destination_mounted', {
      destination: 'share_invite',
      journey: 'referral_invite',
      outcome: 'mounted',
    });
  }, []);

  // Invite links are account-scoped. A late completion from a former session
  // must not become visible after an account switch or session revocation.
  useEffect(() => {
    requestRef.current += 1;
    handoffRequestRef.current += 1;
    linkAccountIdRef.current = null;
    activeLinkLoadRef.current = null;
    setLink(null);
    setQrState(user?.id && isAuthenticated ? 'preparing' : 'unavailable');
    setState('ready');

    return () => {
      requestRef.current += 1;
      handoffRequestRef.current += 1;
    };
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    const accountId = user?.id ?? null;
    const requestId = ++programmeRequestRef.current;
    setReferralProgramme({ kind: 'checking' });

    if (!accountId || !isAuthenticated) {
      trackProductOperation({
        area: 'referral',
        authority: 'client',
        operation: 'validate_referral',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'settings',
      });
      setReferralProgramme({ kind: 'unavailable' });
      return;
    }

    void getReferralProgramStatus()
      .then(status => {
        if (
          requestId === programmeRequestRef.current &&
          accountIdRef.current === accountId
        ) {
          setReferralProgramme({ kind: 'ready', status });
          trackProductOperation({
            area: 'referral',
            authority: 'server',
            operation: 'validate_referral',
            outcome: status.programmeEnabled ? 'eligible' : 'ineligible',
            phase: 'eligibility',
            source: 'settings',
          });
        }
      })
      .catch(() => {
        if (
          requestId === programmeRequestRef.current &&
          accountIdRef.current === accountId
        ) {
          setReferralProgramme({ kind: 'unavailable' });
          trackProductOperation({
            area: 'referral',
            authority: 'server',
            operation: 'validate_referral',
            outcome: 'unknown',
            phase: 'reconciliation',
            source: 'settings',
          });
        }
      });

    void fetchUserReferrals(accountId);

    return () => {
      programmeRequestRef.current += 1;
    };
  }, [fetchUserReferrals, getReferralProgramStatus, isAuthenticated, user?.id]);

  const getActiveLink = useCallback(
    async (showRouteProgress = true) => {
      const accountId = user?.id ?? null;

      if (!accountId || !isAuthenticated) {
        trackProductOperation({
          area: 'referral',
          authority: 'client',
          operation: 'prepare_invite',
          outcome: 'blocked',
          phase: 'eligibility',
          source: 'settings',
        });
        linkAccountIdRef.current = null;
        activeLinkLoadRef.current = null;
        setLink(null);
        setQrState('unavailable');
        if (showRouteProgress) setState('unavailable');
        addBreadcrumb('route_destination_state', {
          destination: 'share_invite',
          journey: 'referral_invite',
          outcome: 'auth_required',
        });
        return null;
      }

      if (linkAccountIdRef.current === accountId && link) {
        setQrState('ready');
        return link;
      }

      if (showRouteProgress) setState('preparing');
      setQrState('preparing');
      addBreadcrumb('route_destination_state', {
        destination: 'share_invite',
        journey: 'referral_invite',
        outcome: 'loading',
      });

      let activeLoad = activeLinkLoadRef.current;
      if (!activeLoad || activeLoad.accountId !== accountId) {
        trackProductOperation({
          area: 'referral',
          authority: 'server',
          operation: 'prepare_invite',
          outcome: 'started',
          phase: 'intent',
          source: 'settings',
        });
        activeLoad = {
          accountId,
          promise: generateReferralLink(accountId),
          requestId: ++requestRef.current,
        };
        activeLinkLoadRef.current = activeLoad;
      }

      try {
        const activeLink = await activeLoad.promise;
        if (
          activeLoad.requestId !== requestRef.current ||
          accountIdRef.current !== accountId
        ) {
          return null;
        }
        linkAccountIdRef.current = accountId;
        setLink(activeLink);
        setQrState('ready');
        if (showRouteProgress) setState('ready');
        addBreadcrumb('route_destination_state', {
          destination: 'share_invite',
          journey: 'referral_invite',
          outcome: 'ready',
        });
        trackProductOperation({
          area: 'referral',
          authority: 'server',
          operation: 'prepare_invite',
          outcome: 'confirmed',
          phase: 'authority',
          source: 'settings',
        });
        return activeLink;
      } catch {
        if (
          activeLoad.requestId === requestRef.current &&
          accountIdRef.current === accountId
        ) {
          linkAccountIdRef.current = null;
          setLink(null);
          setQrState('unavailable');
          if (showRouteProgress) setState('unavailable');
          addBreadcrumb('route_destination_state', {
            destination: 'share_invite',
            journey: 'referral_invite',
            outcome: 'failed',
          });
        }
        trackProductOperation({
          area: 'referral',
          authority: 'server',
          operation: 'prepare_invite',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'settings',
        });
        return null;
      } finally {
        if (activeLinkLoadRef.current === activeLoad) {
          activeLinkLoadRef.current = null;
        }
      }
    },
    [generateReferralLink, isAuthenticated, link, user?.id]
  );

  useEffect(() => {
    void getActiveLink(false);
  }, [getActiveLink]);

  const handleShare = useCallback(async () => {
    if (state === 'preparing' || state === 'handoff') return;
    trackProductOperation({
      area: 'invite',
      authority: 'native',
      operation: 'prepare_invite',
      outcome: 'started',
      phase: 'intent',
      source: 'settings',
    });
    const accountId = accountIdRef.current;
    const cachedLink = linkAccountIdRef.current === accountId ? link : null;
    const activeLink = cachedLink ?? (await getActiveLink(true));
    if (!activeLink || !accountId || accountIdRef.current !== accountId) return;

    const handoffRequestId = ++handoffRequestRef.current;
    setState('handoff');
    try {
      await Share.share({
        title: t('groups.share.invite_someone_title'),
        message: t('groups.share.message', { link: activeLink }),
        url: activeLink,
      });
      // Share APIs can only tell Menta the handoff returned. They do not prove
      // a recipient, channel, delivery, or that anyone joined.
      if (
        handoffRequestId !== handoffRequestRef.current ||
        accountIdRef.current !== accountId
      ) {
        return;
      }
      trackMetaAdsInviteFriend();
      trackProductOperation({
        area: 'invite',
        authority: 'native',
        operation: 'prepare_invite',
        outcome: 'confirmed',
        phase: 'authority',
        source: 'settings',
      });
      setState('returned');
    } catch {
      trackProductOperation({
        area: 'invite',
        authority: 'native',
        operation: 'prepare_invite',
        outcome: 'failed',
        phase: 'authority',
        source: 'settings',
      });
      if (
        handoffRequestId === handoffRequestRef.current &&
        accountIdRef.current === accountId
      ) {
        setState('unavailable');
      }
    }
  }, [getActiveLink, link, state, t]);

  const handleCopy = useCallback(async () => {
    if (state === 'preparing' || state === 'handoff') return;
    trackProductOperation({
      area: 'invite',
      authority: 'native',
      operation: 'prepare_invite',
      outcome: 'started',
      phase: 'intent',
      source: 'settings',
    });
    const accountId = accountIdRef.current;
    const cachedLink = linkAccountIdRef.current === accountId ? link : null;
    const activeLink = cachedLink ?? (await getActiveLink(true));
    if (!activeLink || !accountId || accountIdRef.current !== accountId) return;

    const handoffRequestId = ++handoffRequestRef.current;
    try {
      const copied = await Clipboard.setStringAsync(activeLink);
      if (
        handoffRequestId !== handoffRequestRef.current ||
        accountIdRef.current !== accountId
      ) {
        return;
      }
      if (!copied) {
        trackProductOperation({
          area: 'invite',
          authority: 'native',
          operation: 'prepare_invite',
          outcome: 'failed',
          phase: 'authority',
          source: 'settings',
        });
        setState('unavailable');
        return;
      }
      trackMetaAdsInviteFriend();
      trackProductOperation({
        area: 'invite',
        authority: 'native',
        operation: 'prepare_invite',
        outcome: 'confirmed',
        phase: 'authority',
        source: 'settings',
      });
      setState('copied');
    } catch {
      trackProductOperation({
        area: 'invite',
        authority: 'native',
        operation: 'prepare_invite',
        outcome: 'failed',
        phase: 'authority',
        source: 'settings',
      });
      if (
        handoffRequestId === handoffRequestRef.current &&
        accountIdRef.current === accountId
      ) {
        setState('unavailable');
      }
    }
  }, [getActiveLink, link, state]);

  const retry = useCallback(() => {
    if (state === 'preparing' || state === 'handoff') return;
    void getActiveLink(true);
  }, [getActiveLink, state]);

  const backToYou = useCallback(
    () => backOrReplace(router, '/(tabs)/profile'),
    [router]
  );

  const busy = state === 'preparing' || state === 'handoff';
  const confirmedReward = userReferrals.find(
    referral =>
      referral.status === 'completed' && referral.rewardGranted === true
  );
  const availableReward =
    referralProgramme.kind === 'ready' &&
    referralProgramme.status.programmeEnabled &&
    referralProgramme.status.inviterRewardsThisYear <
      referralProgramme.status.inviterAnnualCap
      ? referralProgramme.status.rewardAmount
      : null;
  const titleByState: Record<InviteState, string> = {
    ready: t('groups.share.invite_someone'),
    preparing: t('groups.share.preparing'),
    handoff: t('groups.share.choose_where'),
    returned: t('groups.share.ready_after_return'),
    copied: t('groups.share.link_copied'),
    unavailable: t('groups.share.unavailable'),
  };
  const bodyByState: Record<InviteState, string> = {
    ready: t('groups.share.ready_detail'),
    preparing: t('groups.share.preparing_detail'),
    handoff: t('groups.share.choose_where_detail'),
    returned: t('groups.share.returned_detail'),
    copied: t('groups.share.copied_detail'),
    unavailable: t('groups.share.unavailable_detail'),
  };

  return (
    <View style={styles.route}>
      <AppScreen
        lane="focused"
        hasTabBar={false}
        scrollable
        contentContainerStyle={[
          styles.content,
          { paddingBottom: footerHeight + mentaSpacing[4] },
        ]}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <AppTopBar
            title={t('fullAuth.tabs_profile.invite_friends')}
            onBack={backToYou}
          />
          <View style={styles.referralIllustration}>
            <MentaMascot
              state="referral-invitation"
              size="hero"
              style={{ width: 194, height: 194 }}
            />
          </View>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={styles.title}>
              {state === 'ready' && availableReward !== null
                ? t('groups.share.both_earn', { amount: availableReward })
                : titleByState[state]}
            </Text>
            <Text style={styles.body}>
              {state === 'ready' && availableReward !== null
                ? t('commerce.wallet.inviteEarn', { amount: availableReward })
                : bodyByState[state]}
            </Text>
          </View>
        </View>
        {!busy && state !== 'unavailable' ? (
          <>
            {confirmedReward ? (
              <Text style={styles.body}>
                {t('groups.share.reward_confirmed', {
                  amount: confirmedReward.inviterRewardAmount,
                })}
              </Text>
            ) : null}
            <AppButton
              onPress={() => setShowQr(true)}
              title={t('groups.invite.show_qr')}
              variant="outline"
              fullWidth
            />
            {availableReward !== null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showProgramme }}
                onPress={() => setShowProgramme(value => !value)}
                style={styles.programmeDisclosure}
              >
                <Text style={styles.programmeDisclosureTitle}>
                  {t('groups.share.programme')}
                </Text>
                <ChevronRightIcon
                  color={mentaColors.text.secondary}
                  size={20}
                />
              </Pressable>
            ) : null}
            {showProgramme || availableReward === null ? (
              <ReferralProgrammeSummary
                historyError={referralHistoryError}
                historyLoading={referralHistoryLoading}
                referrals={userReferrals}
                state={referralProgramme}
              />
            ) : null}
          </>
        ) : null}
      </AppScreen>
      <View
        onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
        style={[
          styles.fixedFooter,
          insetPadding,
          { paddingBottom: insets.bottom + mentaSpacing[3] },
        ]}
      >
        <View style={styles.footerLane}>
          <InviteFooter
            busy={busy}
            onBack={backToYou}
            onCopy={() => void handleCopy()}
            onRetry={retry}
            onShare={() => void handleShare()}
            state={state}
          />
        </View>
      </View>
      <SimpleBottomSheet
        visible={showQr}
        onClose={() => setShowQr(false)}
        scrollableBody={
          <ErrorBoundary level="component">
            <ReferralInviteQRCode link={link} state={qrState} size={188} />
          </ErrorBoundary>
        }
        footer={
          <AppButton
            title={t('groups.invite.hide_qr')}
            onPress={() => setShowQr(false)}
            fullWidth
            variant="outline"
          />
        }
      />
    </View>
  );
}

const ReferralProgrammeSummary = ({
  state,
  referrals,
  historyLoading,
  historyError,
}: {
  state: ReferralProgrammeState;
  referrals: UserReferral[];
  historyLoading: boolean;
  historyError: string | null;
}) => {
  const { t } = useTranslation();
  if (state.kind === 'checking') {
    return (
      <AppInlineNotice
        description={t('groups.share.checking_rewards_detail')}
        testID="invite-referral-programme-checking"
        title={t('groups.share.checking_rewards')}
      />
    );
  }

  if (state.kind === 'unavailable') {
    return (
      <AppInlineNotice
        description={t('groups.share.terms_unavailable_detail')}
        testID="invite-referral-programme-unavailable"
        title={t('groups.share.terms_unavailable')}
        tone="warning"
      />
    );
  }

  const { status } = state;
  const resetDate = formatResetDate(status.inviterCapResetsAt);
  const inviterCapReached =
    status.inviterRewardsThisYear >= status.inviterAnnualCap;
  const latestConfirmedReward = referrals.find(
    referral =>
      referral.status === 'completed' && referral.rewardGranted === true
  );
  const pendingCount = referrals.filter(
    referral => referral.status === 'pending'
  ).length;

  return (
    <View style={styles.programme} testID="invite-referral-programme">
      <SettingsSectionLabel>{t('groups.share.programme')}</SettingsSectionLabel>
      {status.programmeEnabled ? (
        <>
          <Text style={styles.programmeTitle}>
            {inviterCapReached
              ? t('groups.share.limit_reached')
              : t('groups.share.both_earn', {
                  amount: status.rewardAmount.toLocaleString(),
                })}
          </Text>
          <Text style={styles.programmeBody}>
            {inviterCapReached
              ? t('groups.share.limit_detail', {
                  limit: status.inviterAnnualCap.toLocaleString(),
                  amount: status.rewardAmount.toLocaleString(),
                  date: resetDate,
                })
              : t('groups.share.eligible_detail', {
                  amount: status.rewardAmount.toLocaleString(),
                  limit: status.inviterAnnualCap.toLocaleString(),
                })}
          </Text>
        </>
      ) : (
        <AppInlineNotice
          description={t('groups.share.paused_detail')}
          testID="invite-referral-programme-paused"
          title={t('groups.share.rewards_paused')}
        />
      )}

      {latestConfirmedReward ? (
        <AppInlineNotice
          description={t('groups.share.eligible_detail', {
            amount: status.rewardAmount.toLocaleString(),
            limit: status.inviterAnnualCap.toLocaleString(),
          })}
          testID="invite-referral-reward-confirmed"
          title={t('groups.share.reward_confirmed', {
            amount: latestConfirmedReward.inviterRewardAmount,
          })}
          tone="success"
        />
      ) : historyLoading ? (
        <AppInlineNotice
          description={t('groups.share.checking_rewards_detail')}
          testID="invite-referral-history-checking"
          title={t('groups.share.checking_rewards')}
        />
      ) : historyError ? (
        <AppInlineNotice
          description={t('groups.share.terms_unavailable_detail')}
          testID="invite-referral-history-unavailable"
          title={t('groups.share.terms_unavailable')}
          tone="warning"
        />
      ) : pendingCount > 0 ? (
        <SettingsDirectRow
          icon={<GiftIcon color={mentaColors.text.secondary} size={18} />}
          showDivider={false}
          subtitle={t('groups.share.eligible_detail', {
            amount: status.rewardAmount.toLocaleString(),
            limit: status.inviterAnnualCap.toLocaleString(),
          })}
          title={t('fullAuth.onboarding.invite')}
          value={String(pendingCount)}
        />
      ) : null}

      <View style={styles.programmeFacts}>
        <SettingsDirectRow
          icon={<GiftIcon color={mentaColors.text.secondary} size={18} />}
          subtitle={t('groups.share.annual_limit')}
          title={t('groups.share.rewards_title')}
          value={`${status.inviterRewardsThisYear} of ${status.inviterAnnualCap}`}
        />
        <SettingsDirectRow
          icon={<CalendarIcon color={mentaColors.text.secondary} size={18} />}
          showDivider={false}
          subtitle={t('groups.share.at_midnight')}
          title={t('groups.share.limit_resets')}
          value={resetDate}
        />
      </View>
    </View>
  );
};

const InviteFooter = ({
  state,
  busy,
  onShare,
  onCopy,
  onRetry,
  onBack,
}: {
  state: InviteState;
  busy: boolean;
  onShare: () => void;
  onCopy: () => void;
  onRetry: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  if (state === 'ready') {
    return (
      <>
        <AppButton
          accessibilityHint={t('groups.share.share_hint')}
          disabled={busy}
          fullWidth
          leftIcon={<Share2Icon color={mentaColors.canvas} size={18} />}
          onPress={onShare}
          size="large"
          testID="invite-share-row"
          title={t('groups.share.share_link')}
          variant="accent"
        />
        <AppButton
          accessibilityHint={t('groups.share.copy_hint')}
          disabled={busy}
          fullWidth
          leftIcon={<CopyIcon color={mentaColors.text.primary} size={18} />}
          onPress={onCopy}
          size="large"
          testID="invite-copy-row"
          title={t('groups.share.copy_link')}
          variant="secondary"
        />
      </>
    );
  }
  if (state === 'unavailable') {
    return (
      <>
        <AppButton
          accessibilityHint={t('groups.share.retry_hint')}
          onPress={onRetry}
          size="large"
          testID="invite-retry"
          title={t('groups.tab.try_again')}
          variant="accent"
        />
        <AppButton
          onPress={onBack}
          size="large"
          title={t('groups.share.back_you')}
          variant="ghost"
        />
      </>
    );
  }

  if (state === 'copied') {
    return (
      <>
        <AppButton
          onPress={onShare}
          size="large"
          title={t('groups.invite.share')}
          variant="accent"
        />
        <AppButton
          onPress={onBack}
          size="large"
          title={t('groups.share.back_you')}
          variant="ghost"
        />
      </>
    );
  }

  if (state === 'returned') {
    return (
      <>
        <AppButton
          onPress={onShare}
          size="large"
          title={t('groups.share.share_again')}
          variant="accent"
        />
        <AppButton
          onPress={onCopy}
          size="large"
          title={t('groups.share.copy_link')}
          variant="ghost"
        />
      </>
    );
  }

  if (state === 'preparing') {
    return (
      <>
        <AppButton
          accessibilityLabel={t('groups.share.preparing_label')}
          disabled
          loading
          onPress={() => undefined}
          size="large"
          testID="invite-preparing"
          title={t('groups.share.preparing_action')}
          variant="accent"
        />
        <AppButton
          disabled
          onPress={onBack}
          size="large"
          title={t('groups.join.back')}
          variant="ghost"
        />
      </>
    );
  }

  if (state === 'handoff') {
    return (
      <>
        <AppButton
          accessibilityLabel={t('groups.share.opening_handoff')}
          disabled
          loading={busy}
          onPress={() => undefined}
          size="large"
          testID="invite-system-handoff"
          title={t('groups.share.opening_action')}
          variant="accent"
        />
        <View
          accessible={false}
          pointerEvents="none"
          style={styles.reservedFooterSlot}
          testID="invite-system-handoff-reserved-slot"
        />
      </>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  route: {
    backgroundColor: mentaColors.canvas,
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[8],
  },
  referralIllustration: {
    alignItems: 'center',
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
  },
  programmeDisclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: mentaLayout.minimumTouchTarget,
    gap: mentaSpacing[3],
  },
  programmeDisclosureTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  header: {
    gap: mentaSpacing[5],
  },
  headerCopy: { gap: mentaSpacing[2] },
  programme: {
    paddingBottom: mentaSpacing[2],
  },
  programmeTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    marginTop: mentaSpacing[2],
  },
  programmeBody: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[1],
    maxWidth: mentaLayout.readingMeasure,
  },
  programmeFacts: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: mentaSpacing[3],
  },
  title: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.primary,
  },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  fixedFooter: {
    backgroundColor: mentaColors.canvas,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[3],
  },
  footerLane: {
    alignSelf: 'center',
    gap: mentaSpacing[2],
    maxWidth: mentaLayout.phoneFrameMax,
    width: '100%',
  },
  reservedFooterSlot: {
    minHeight: 56,
  },
});
