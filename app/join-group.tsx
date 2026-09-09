import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  JoinGroupActionNoticeSection,
  JoinGroupDetailsSection,
  JoinGroupFundingOptionsSection,
  JoinGroupReceiptSection,
  type JoinGroupNotice,
} from '@/components/groups/JoinGroupOutcomeSections';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import PaywallModal from '@/components/paywall/PaywallModal';
import ModalCard from '@/components/ui/modal/ModalCard';
import { useAdRewardAmount } from '@/lib/hooks/useAdReward';
import { useOperationalFlag } from '@/hooks/useOperationalFlag';
import { useMomentaStore } from '@/store/momenta-store';
import CameraFix from '@/components/CameraFix';
import { showToast } from '@/components/ui/Toast';
import {
  areVerifiedAdRewardsEnabled,
  showRewardedAdDetailed,
  type RewardAdResult,
} from '@/lib/ads';
import {
  resolveGroupInviteInput,
  type GroupInviteInputResolution,
} from '@/lib/invite-links';
import {
  resolveGroupJoinError,
  resolveGroupJoinOutcome,
} from '@/lib/groups/group-join-outcome';
import {
  describeJoinGroupPreviewSpend,
  resolveJoinGroupPreview,
  type JoinGroupQuote,
} from '@/lib/groups/join-group-copy';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTextField,
  AppTopBar,
  SkeletonButton,
  SkeletonLoader,
} from '@/components/ui';
import { useInviteStore } from '@/store/invite-store';
import { useGroupActions } from '@/store/selectors';
import { useGroupStore } from '@/store/group-store';
import type {
  GuestGroupInvitePreview,
  GroupInvitePreview,
} from '@/lib/groups/group-invite-contract';
import { trackProductEvent, trackProductOperation } from '@/lib/posthog';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
type GuestInvitePreviewDisplay = GuestGroupInvitePreview & {
  inviteCode: string;
};
type InvitePreviewDisplay = GroupInvitePreview | GuestInvitePreviewDisplay;

type InvitePreviewViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | {
      kind: 'ready';
      preview: InvitePreviewDisplay;
      previewAccountId: string | null;
    }
  | {
      kind: 'already_member';
      preview: GroupInvitePreview;
      previewAccountId: string;
    }
  | {
      kind: 'inactive' | 'unavailable' | 'auth_required';
      title: string;
      message: string;
      preview?: InvitePreviewDisplay;
    };

export default function JoinGroupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string }>();
  const { user } = useAuthStore();
  const setPendingChallenge = useInviteStore(
    state => state.setPendingChallenge
  );
  const setPendingGroup = useInviteStore(state => state.setPendingGroup);
  const clearPendingInvite = useInviteStore(state => state.clearPending);
  const dismissPendingInvite = useInviteStore(state => state.dismissPending);
  const pendingInvite = useInviteStore(state => state.pending);
  const previewGroupInvite = useGroupStore(state => state.previewGroupInvite);
  const previewGuestGroupInvite = useGroupStore(
    state => state.previewGuestGroupInvite
  );
  const getJoinGroupQuote = useGroupStore(state => state.getJoinGroupQuote);
  const { fetchDiscoverGroups, fetchUserGroups } = useGroupActions();
  const adReward = useAdRewardAmount();
  const { enabled: adsEnabled } = useOperationalFlag('ads_enabled');
  const { enabled: safeMode } = useOperationalFlag('safe_mode');
  const canWatchSponsors =
    adsEnabled && !safeMode && areVerifiedAdRewardsEnabled();
  const fetchBalance = useMomentaStore(s => s.fetchBalance);
  const claimAdReward = useMomentaStore(s => s.claimAdReward);
  const balance = useMomentaStore(s => s.balance);

  const pendingGroupCode =
    pendingInvite?.type === 'group' &&
    (!pendingInvite.ownerUserId || pendingInvite.ownerUserId === user?.id)
      ? pendingInvite.code
      : '';

  // Pre-fill invite code from route params (e.g., from deep links)
  const [inviteCode, setInviteCode] = useState(params.code || pendingGroupCode);
  const [isJoining, setIsJoining] = useState(false);
  const joinLockRef = useRef(false);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);
  activeUserIdRef.current = user?.id ?? null;
  const [showCamera, setShowCamera] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallVariant, setPaywallVariant] = useState<
    'default' | 'insufficient' | 'quota'
  >('default');
  const [showFundingOptions, setShowFundingOptions] = useState(false);
  const [showJoinDetails, setShowJoinDetails] = useState(false);
  const [joinNotice, setJoinNotice] = useState<JoinGroupNotice | null>(null);
  const [joinQuote, setJoinQuote] = useState<JoinGroupQuote | null>(null);
  const [receiptSpend, setReceiptSpend] = useState<number | null>(null);
  const [previewState, setPreviewState] = useState<InvitePreviewViewState>({
    kind: 'idle',
  });
  const previewStateRef = useRef(previewState);
  previewStateRef.current = previewState;
  const previewRequestRef = useRef(0);
  const automaticPreviewKeyRef = useRef<string | null>(null);
  const automaticPreviewSourceRef = useRef<'route' | 'pending' | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setJoinQuote(null);
      return () => undefined;
    }

    void getJoinGroupQuote(user.id)
      .then(quote => {
        if (!cancelled) setJoinQuote(quote);
      })
      .catch(() => {
        if (!cancelled) setJoinQuote(null);
      });

    return () => {
      cancelled = true;
    };
  }, [getJoinGroupQuote, user?.id]);

  const resolveInviteToUse = useCallback(
    (code?: string): GroupInviteInputResolution =>
      resolveGroupInviteInput(code ?? inviteCode),
    [inviteCode]
  );

  const holdInviteForSignIn = useCallback(
    (code?: string) => {
      const inviteToUse = resolveInviteToUse(code);
      if (inviteToUse.status === 'challenge') {
        setPendingChallenge(inviteToUse.code, user?.id ?? null);
      } else if (inviteToUse.status === 'group') {
        setPendingGroup(inviteToUse.code, user?.id ?? null);
      }
      return inviteToUse;
    },
    [resolveInviteToUse, setPendingChallenge, setPendingGroup, user?.id]
  );

  const handlePasteInviteCode = useCallback(async () => {
    try {
      const clipboardText = (await Clipboard.getStringAsync()).trim();

      if (!clipboardText) {
        showToast.info(
          t('groups.join.clipboard_empty'),
          t('groups.join.clipboard_empty_detail')
        );
        return;
      }

      const resolvedInvite = resolveGroupInviteInput(clipboardText);

      if (resolvedInvite.status === 'challenge') {
        setPendingChallenge(resolvedInvite.code, user?.id ?? null);
        setJoinNotice({
          tone: 'info',
          title: t('groups.join.promise_invite_found'),
          description: t('groups.join.promise_invite_detail'),
        });
        return;
      }

      setShowFundingOptions(false);
      setPreviewState({ kind: 'idle' });

      if (resolvedInvite.status === 'group') {
        setInviteCode(resolvedInvite.code);
        setJoinNotice(null);
        showToast.success(
          t('groups.join.code_pasted'),
          t('groups.join.invite_ready')
        );
        return;
      }

      setInviteCode(clipboardText.toUpperCase().slice(0, 12));
      setJoinNotice(null);
      showToast.info(t('groups.join.code_pasted'), t('groups.join.check_code'));
    } catch (error) {
      console.error('Clipboard paste error:', error);
      showToast.error(
        t('groups.join.paste_failed'),
        t('groups.join.clipboard_error')
      );
    }
  }, [setPendingChallenge, t, user?.id]);

  const handlePreviewGroup = useCallback(
    async (code?: string) => {
      const rawInvite = code ?? inviteCode;
      const inviteToUse = resolveInviteToUse(code);
      const previewRequestId = previewRequestRef.current + 1;
      previewRequestRef.current = previewRequestId;

      setJoinNotice(null);
      setShowFundingOptions(false);

      if (inviteToUse.status === 'invalid') {
        setPreviewState({
          kind: 'unavailable',
          title: rawInvite.trim()
            ? t('groups.join.invalid_title')
            : t('groups.join.enter_code_title'),
          message: rawInvite.trim()
            ? t('groups.join.invalid_detail')
            : t('groups.join.enter_code_detail'),
        });
        return;
      }

      if (inviteToUse.status === 'challenge') {
        setPendingChallenge(inviteToUse.code, user?.id ?? null);
        setPreviewState({
          kind: 'unavailable',
          title: t('groups.join.promise_invite_title'),
          message: t('groups.join.promise_invite_saved'),
        });
        return;
      }

      setInviteCode(inviteToUse.code);

      setPreviewState({ kind: 'loading' });
      const previewAccountId = user?.id ?? null;

      try {
        if (!user) {
          const guestPreview = await previewGuestGroupInvite(inviteToUse.code);
          if (
            previewRequestRef.current !== previewRequestId ||
            activeUserIdRef.current !== previewAccountId
          ) {
            return;
          }
          setPreviewState({
            kind: 'ready',
            preview: { ...guestPreview, inviteCode: inviteToUse.code },
            previewAccountId: null,
          });
          return;
        }

        const preview = await previewGroupInvite(inviteToUse.code);
        if (
          previewRequestRef.current !== previewRequestId ||
          activeUserIdRef.current !== previewAccountId
        ) {
          return;
        }

        if (preview.status === 'ACTIVE') {
          setPreviewState({
            kind: 'ready',
            preview,
            previewAccountId,
          });
          return;
        }

        if (preview.status === 'ALREADY_MEMBER') {
          const currentPending = useInviteStore.getState().pending;
          if (
            currentPending?.type === 'group' &&
            currentPending.code === preview.inviteCode
          ) {
            dismissPendingInvite(currentPending);
          }
          setPreviewState({
            kind: 'already_member',
            preview,
            previewAccountId: user.id,
          });
          return;
        }

        const inactiveCopy = (() => {
          switch (preview.status) {
            case 'EXPIRED':
              return {
                title: t('groups.join.expired_title'),
                message: t('groups.join.expired_detail'),
              };
            case 'REPLACED':
              return {
                title: t('groups.join.replaced_title'),
                message: t('groups.join.replaced_detail'),
              };
            case 'GROUP_INACTIVE':
              return {
                title: t('groups.join.inactive_title'),
                message: t('groups.join.inactive_detail'),
              };
            default:
              return {
                title: t('groups.join.invalid_title'),
                message: t('groups.join.invalid_invite_detail'),
              };
          }
        })();

        const currentPending = useInviteStore.getState().pending;
        if (
          currentPending?.type === 'group' &&
          currentPending.code === preview.inviteCode
        ) {
          dismissPendingInvite(currentPending);
        }

        setPreviewState({ kind: 'inactive', ...inactiveCopy });
      } catch (error: unknown) {
        if (
          previewRequestRef.current !== previewRequestId ||
          activeUserIdRef.current !== previewAccountId
        ) {
          return;
        }
        const candidate = error as { code?: unknown } | null;
        const code = String(candidate?.code || '').toUpperCase();

        if (code === 'AUTH_REQUIRED' || code === 'AUTH_SESSION_REVOKED') {
          setPreviewState({
            kind: 'auth_required',
            title: t('groups.join.sign_in_title'),
            message: t('groups.join.sign_in_detail'),
          });
          return;
        }

        setPreviewState({
          kind: 'unavailable',
          title: t('groups.join.preview_unavailable_title'),
          message: t('groups.join.preview_unavailable_detail'),
        });
      }
    },
    [
      inviteCode,
      dismissPendingInvite,
      previewGroupInvite,
      previewGuestGroupInvite,
      resolveInviteToUse,
      setPendingChallenge,
      user,
      t,
    ]
  );

  useEffect(() => {
    const automaticInviteCode = params.code || pendingGroupCode;

    if (!automaticInviteCode) {
      const activeAutomaticKey = `${user?.id ?? 'guest'}:${inviteCode}`;
      const currentPreviewState = previewStateRef.current;
      const matchingResolvedPreview =
        (currentPreviewState.kind === 'ready' ||
          currentPreviewState.kind === 'already_member') &&
        currentPreviewState.preview.inviteCode === inviteCode;
      const keepConsumedPendingInvite =
        automaticPreviewSourceRef.current === 'pending' &&
        automaticPreviewKeyRef.current === activeAutomaticKey &&
        (currentPreviewState.kind === 'loading' ||
          currentPreviewState.kind === 'inactive' ||
          matchingResolvedPreview);

      // A confirmed account preview consumes the persisted invite. Keep the
      // matching code only inside this mounted, account-scoped flow so the
      // resulting receipt is not erased by that expected store update.
      if (keepConsumedPendingInvite) return;

      if (automaticPreviewKeyRef.current !== null) {
        previewRequestRef.current += 1;
        automaticPreviewKeyRef.current = null;
        automaticPreviewSourceRef.current = null;
        setInviteCode('');
        setPreviewState({ kind: 'idle' });
      }
      return;
    }

    const resolvedInvite = resolveGroupInviteInput(automaticInviteCode);
    if (resolvedInvite.status === 'challenge') {
      previewRequestRef.current += 1;
      automaticPreviewKeyRef.current = `challenge:${resolvedInvite.code}`;
      setPendingChallenge(resolvedInvite.code, user?.id ?? null);
      setInviteCode(resolvedInvite.code);
      setPreviewState({
        kind: 'unavailable',
        title: t('groups.join.promise_invite_title'),
        message: t('groups.join.promise_invite_saved'),
      });
      return;
    }

    if (resolvedInvite.status !== 'group') {
      previewRequestRef.current += 1;
      automaticPreviewKeyRef.current = `invalid:${automaticInviteCode}`;
      setInviteCode('');
      setPreviewState({
        kind: 'unavailable',
        title: t('groups.join.unavailable_title'),
        message: t('groups.join.unavailable_detail'),
      });
      return;
    }

    const automaticPreviewKey = `${user?.id ?? 'guest'}:${resolvedInvite.code}`;
    if (automaticPreviewKeyRef.current === automaticPreviewKey) return;

    setPendingGroup(resolvedInvite.code, user?.id ?? null);
    automaticPreviewKeyRef.current = automaticPreviewKey;
    automaticPreviewSourceRef.current = params.code ? 'route' : 'pending';
    void handlePreviewGroup(resolvedInvite.code);
  }, [
    handlePreviewGroup,
    inviteCode,
    params.code,
    pendingGroupCode,
    setPendingChallenge,
    setPendingGroup,
    t,
    user?.id,
  ]);

  const handleQRScan = useCallback(
    (data: string) => {
      setShowCamera(false);
      const resolvedInvite = resolveGroupInviteInput(data);

      if (resolvedInvite.status === 'challenge') {
        setPendingChallenge(resolvedInvite.code, user?.id ?? null);
        setPreviewState({
          kind: 'unavailable',
          title: t('groups.join.promise_invite_found'),
          message: t('groups.join.promise_invite_saved'),
        });
        return;
      }

      if (resolvedInvite.status === 'invalid') {
        setPreviewState({
          kind: 'unavailable',
          title: t('groups.join.qr_invalid_title'),
          message: t('groups.join.qr_invalid_detail'),
        });
        return;
      }

      setInviteCode(resolvedInvite.code);
      void handlePreviewGroup(resolvedInvite.code);
    },
    [handlePreviewGroup, setPendingChallenge, t, user?.id]
  );

  const handleSignInNow = useCallback(() => {
    const inviteToUse = holdInviteForSignIn();
    if (inviteToUse.status === 'group') {
      const next = `/join-group?code=${encodeURIComponent(inviteToUse.code)}`;
      router.replace({
        pathname: '/auth-required',
        params: { next },
      });
      return;
    }
    router.push('/login');
  }, [holdInviteForSignIn, router]);

  const handleKeepBrowsing = useCallback(() => {
    clearPendingInvite();
    backOrReplace(router, '/onboarding-again');
  }, [clearPendingInvite, router]);

  const handleJoinGroup = async (code?: string) => {
    trackProductOperation({
      area: 'invite',
      authority: 'client',
      operation: 'join_group',
      outcome: 'started',
      phase: 'intent',
      source: 'invite',
    });
    const rawInput = code ?? inviteCode;
    const inviteToUse = resolveInviteToUse(code);

    if (inviteToUse.status === 'invalid') {
      trackProductOperation({
        area: 'invite',
        authority: 'client',
        operation: 'join_group',
        outcome: 'ineligible',
        phase: 'eligibility',
        source: 'invite',
      });
      const hasTypedInput = rawInput.trim().length > 0;
      if (!hasTypedInput) {
        setJoinNotice({
          tone: 'error',
          title: t('groups.join.missing_code_title'),
          description: t('groups.join.missing_code_detail'),
        });
        return;
      }

      setJoinNotice({
        tone: 'error',
        title: t('groups.join.invalid_code_title'),
        description: t('groups.join.invalid_code_detail'),
      });
      return;
    }

    if (inviteToUse.status === 'challenge') {
      trackProductOperation({
        area: 'invite',
        authority: 'client',
        operation: 'join_group',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'invite',
      });
      setPendingChallenge(inviteToUse.code, user?.id ?? null);
      setJoinNotice({
        tone: 'info',
        title: t('groups.join.promise_invite_found'),
        description: t('groups.join.promise_invite_detail'),
      });
      return;
    }

    const codeToUse = inviteToUse.code;

    if (!user) {
      trackProductOperation({
        area: 'invite',
        authority: 'client',
        operation: 'join_group',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'invite',
      });
      setPreviewState({
        kind: 'auth_required',
        title: t('groups.join.sign_in_title'),
        message: t('groups.join.sign_in_detail'),
        preview:
          previewState.kind === 'ready' ? previewState.preview : undefined,
      });
      return;
    }

    if (
      previewState.kind !== 'ready' ||
      !('groupId' in previewState.preview) ||
      previewState.previewAccountId !== user.id ||
      previewState.preview.inviteCode !== codeToUse
    ) {
      trackProductOperation({
        area: 'invite',
        authority: 'client',
        operation: 'join_group',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'invite',
      });
      setPreviewState({
        kind: 'unavailable',
        title: t('groups.join.preview_first_title'),
        message: t('groups.join.preview_first_detail'),
      });
      return;
    }

    const preview = resolveJoinGroupPreview(joinQuote);
    if (!preview) {
      setJoinNotice({
        tone: 'warning',
        title: t('groups.join.preview_first_title'),
        description: t('groups.join.preview_unknown'),
      });
      return;
    }
    if (preview?.kind === 'quota') {
      void emitHaptic({ type: 'blocked', reason: 'quota' });
      trackProductOperation({
        area: 'invite',
        authority: 'server',
        operation: 'join_group',
        outcome: 'ineligible',
        phase: 'eligibility',
        source: 'invite',
      });
      setPaywallVariant('quota');
      setJoinNotice({
        tone: 'warning',
        title: t('groups.join.quota_title'),
        description: t('groups.join.quota_detail'),
        action: 'quota',
      });
      return;
    }

    if (
      preview?.kind === 'paid' &&
      typeof balance === 'number' &&
      preview.cost > balance
    ) {
      void emitHaptic({
        type: 'blocked',
        reason: 'insufficient-momenta',
      });
      trackProductOperation({
        area: 'invite',
        authority: 'server',
        operation: 'join_group',
        outcome: 'ineligible',
        phase: 'eligibility',
        source: 'invite',
      });
      setPaywallVariant('insufficient');
      setJoinNotice({
        tone: 'warning',
        title: t('groups.join.momenta_needed'),
        description: t('groups.join.momenta_detail', {
          cost: preview.cost,
          balance,
        }),
        action: 'funding',
      });
      setShowFundingOptions(true);
      return;
    }

    if (joinLockRef.current) return;
    joinLockRef.current = true;
    setIsJoining(true);
    try {
      // Edge function owns verification + payment + join operations for security hardening.
      const { data, error } = await supabase.functions.invoke(
        'consume-join-code',
        {
          body: {
            code: codeToUse,
            type: 'group',
            cost: joinQuote?.cost,
          },
        }
      );

      if (error) throw error;

      if (data?.code === 'QUOTE_STALE') {
        const currentQuote = await getJoinGroupQuote(user.id);
        if (useAuthStore.getState().user?.id !== user.id) return;
        setJoinQuote(currentQuote);
        setJoinNotice({
          tone: 'warning',
          title: t('groups.join.preview_first_title'),
          description: describeJoinGroupPreviewSpend(currentQuote.cost, t),
        });
        return;
      }

      const outcome = resolveGroupJoinOutcome(data, t);

      if (outcome.kind !== 'joined') {
        if (outcome.kind === 'funding_required') {
          void emitHaptic({
            type: 'blocked',
            reason: 'insufficient-momenta',
          });
          trackProductOperation({
            area: 'invite',
            authority: 'server',
            operation: 'join_group',
            outcome: 'ineligible',
            phase: 'authority',
            source: 'invite',
          });
          setPaywallVariant('insufficient');
          setJoinNotice({
            tone: 'warning',
            title: outcome.title,
            description: outcome.message,
            action: 'funding',
          });
          setShowFundingOptions(true);
          return;
        }

        if (outcome.kind === 'quota_limit') {
          void emitHaptic({ type: 'blocked', reason: 'quota' });
          trackProductOperation({
            area: 'invite',
            authority: 'server',
            operation: 'join_group',
            outcome: 'ineligible',
            phase: 'authority',
            source: 'invite',
          });
          setPaywallVariant('quota');
          setJoinNotice({
            tone: 'warning',
            title: outcome.title,
            description: outcome.message,
            action: 'quota',
          });
          return;
        }

        if (outcome.kind === 'already_member') {
          trackProductOperation({
            area: 'invite',
            authority: 'server',
            operation: 'join_group',
            outcome: 'confirmed',
            phase: 'authority',
            source: 'invite',
          });
          setReceiptSpend(0);
          setJoinNotice({
            tone: 'info',
            title: t('groups.join.receipt.already'),
            description: t('groups.join.receipt.already_detail'),
            action: 'open_group',
            receipt: 'already_member',
            groupId: outcome.groupId,
            groupName: outcome.groupName,
          });
          return;
        }

        if (outcome.kind === 'session_required') {
          trackProductOperation({
            area: 'invite',
            authority: 'server',
            operation: 'join_group',
            outcome: 'blocked',
            phase: 'authority',
            source: 'invite',
          });
          holdInviteForSignIn(codeToUse);
          setJoinNotice({
            tone: 'warning',
            title: outcome.title,
            description: outcome.message,
            action: 'sign_in',
          });
          return;
        }

        const tone = outcome.kind === 'retryable_error' ? 'warning' : 'error';
        if (outcome.kind !== 'retryable_error') {
          void emitHaptic({ type: 'failed', operation: 'join' });
        }
        trackProductOperation({
          area: 'invite',
          authority: 'server',
          operation: 'join_group',
          outcome: outcome.kind === 'retryable_error' ? 'unknown' : 'failed',
          phase:
            outcome.kind === 'retryable_error' ? 'reconciliation' : 'authority',
          source: 'invite',
        });
        setJoinNotice({
          tone,
          title: outcome.title,
          description: outcome.message,
        });
        return;
      }

      // Refresh the membership and discovery lanes before exposing the board.
      // A refresh failure does not undo a server-confirmed join receipt.
      await Promise.allSettled([
        fetchBalance(user.id),
        fetchUserGroups(user.id),
        fetchDiscoverGroups(user.id),
      ]);

      void emitConfirmedOutcome(
        'group-joined',
        createConfirmedReceipt(
          'group-membership',
          `group-join:${outcome.groupId}:${codeToUse}`
        )
      );
      trackProductEvent('Group Joined', { join_method: 'invite' });
      trackProductOperation({
        area: 'invite',
        authority: 'server',
        operation: 'join_group',
        outcome: 'confirmed',
        phase: 'authority',
        source: 'invite',
      });
      setReceiptSpend(outcome.cost ?? joinQuote?.cost ?? null);
      setJoinNotice({
        tone: 'success',
        title: t('groups.join.receipt.joined'),
        description: t('groups.join.receipt.joined_title', {
          group: outcome.groupName,
        }),
        action: 'open_group',
        receipt: 'joined',
        groupId: outcome.groupId,
        groupName: outcome.groupName,
      });
      const currentPending = useInviteStore.getState().pending;
      if (
        currentPending?.type === 'group' &&
        currentPending.code === codeToUse
      ) {
        dismissPendingInvite(currentPending);
      }
    } catch (error: unknown) {
      console.error('Error joining group:', error);
      const outcome = resolveGroupJoinError(error, t);
      if (outcome.kind === 'session_required') {
        trackProductOperation({
          area: 'invite',
          authority: 'server',
          operation: 'join_group',
          outcome: 'blocked',
          phase: 'authority',
          source: 'invite',
        });
        holdInviteForSignIn(codeToUse);
        setJoinNotice({
          tone: 'warning',
          title: outcome.title,
          description: outcome.message,
          action: 'sign_in',
        });
        return;
      }

      if (outcome.kind === 'funding_required') {
        void emitHaptic({
          type: 'blocked',
          reason: 'insufficient-momenta',
        });
        trackProductOperation({
          area: 'invite',
          authority: 'server',
          operation: 'join_group',
          outcome: 'ineligible',
          phase: 'authority',
          source: 'invite',
        });
        setPaywallVariant('insufficient');
        setJoinNotice({
          tone: 'warning',
          title: outcome.title,
          description: outcome.message,
          action: 'funding',
        });
        setShowFundingOptions(true);
        return;
      }

      if (outcome.kind === 'quota_limit') {
        void emitHaptic({ type: 'blocked', reason: 'quota' });
        trackProductOperation({
          area: 'invite',
          authority: 'server',
          operation: 'join_group',
          outcome: 'ineligible',
          phase: 'authority',
          source: 'invite',
        });
        setPaywallVariant('quota');
        setJoinNotice({
          tone: 'warning',
          title: outcome.title,
          description: outcome.message,
          action: 'quota',
        });
        setPaywallVisible(true);
        return;
      }

      if (outcome.kind === 'retryable_error') {
        trackProductOperation({
          area: 'invite',
          authority: 'server',
          operation: 'join_group',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'invite',
        });
        setJoinNotice({
          tone: 'warning',
          title: outcome.title,
          description: outcome.message,
        });
        return;
      }

      const tone = outcome.kind === 'stale_code' ? 'warning' : 'error';
      void emitHaptic({ type: 'failed', operation: 'join' });
      trackProductOperation({
        area: 'invite',
        authority: 'server',
        operation: 'join_group',
        outcome: 'failed',
        phase: 'authority',
        source: 'invite',
      });
      setJoinNotice({
        tone,
        title: outcome.title,
        description: outcome.message,
      });
    } finally {
      joinLockRef.current = false;
      setIsJoining(false);
    }
  };

  const handleWatchAd = useCallback(async (): Promise<RewardAdResult> => {
    if (!canWatchSponsors) {
      return { earned: false, amount: 0, ['reason']: 'module_missing' };
    }

    if (!user?.id) {
      return { earned: false, amount: 0, ['reason']: 'reward_unconfirmed' };
    }

    try {
      const detailed = await showRewardedAdDetailed({
        appUserId: user?.id ?? '',
        placement: 'join_group',
      });
      const fallback: RewardAdResult =
        detailed && typeof detailed === 'object'
          ? detailed
          : { earned: false, amount: 0, ['reason']: 'error' };

      if (!detailed || !detailed.earned) {
        return fallback;
      }

      const claim = await claimAdReward(detailed.clientTransactionId);
      if (!claim.earned) {
        const reason: RewardAdResult['reason'] =
          claim.reason === 'daily-limit'
            ? 'daily_limit'
            : claim.reason === 'cooldown'
              ? 'cooldown'
              : 'reward_unconfirmed';
        return { earned: false, amount: 0, reason };
      }

      return { earned: true, amount: claim.amount, type: detailed.type };
    } catch (error) {
      console.error('Rewarded ad error:', error);
      return { earned: false, amount: 0, ['reason']: 'error' };
    }
  }, [canWatchSponsors, claimAdReward, user?.id]);

  const receiptJoinNotice =
    joinNotice?.action === 'open_group' && joinNotice.receipt
      ? joinNotice
      : null;
  const hasJoinReceipt = Boolean(receiptJoinNotice);
  const screenTitle = hasJoinReceipt
    ? t('groups.join.join_group_title')
    : previewState.kind === 'loading'
      ? t('groups.join.checking_invite')
      : previewState.kind === 'ready'
        ? t('groups.join.group_invite')
        : previewState.kind === 'already_member'
          ? t('groups.join.receipt.already')
          : previewState.kind === 'auth_required'
            ? t('groups.join.sign_in_title')
            : previewState.kind === 'inactive' ||
                previewState.kind === 'unavailable'
              ? previewState.title
              : t('groups.join.join_group_title');
  const screenSubtitle = hasJoinReceipt
    ? undefined
    : previewState.kind === 'idle'
      ? t('groups.join.screen_subtitle')
      : undefined;
  const showScreenHeading =
    hasJoinReceipt ||
    previewState.kind === 'idle' ||
    previewState.kind === 'inactive' ||
    previewState.kind === 'unavailable';
  const previewNeedsAccountCheck =
    (previewState.kind === 'ready' || previewState.kind === 'already_member') &&
    previewState.previewAccountId !== (user?.id ?? null);
  const isGuestReady =
    previewState.kind === 'ready' && previewState.previewAccountId === null;

  const handleOpenJoinedGroup = useCallback(
    (groupId?: string | null) => {
      if (groupId) {
        router.replace(`/groups/${groupId}` as never);
        return;
      }
      router.replace('/(tabs)/groups');
    },
    [router]
  );

  const handleResetJoinFlow = useCallback(() => {
    previewRequestRef.current += 1;
    automaticPreviewKeyRef.current = null;
    automaticPreviewSourceRef.current = null;
    setInviteCode('');
    setJoinNotice(null);
    setReceiptSpend(null);
    setShowFundingOptions(false);
    setPaywallVariant('default');
    setPreviewState({ kind: 'idle' });
  }, []);

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      safeArea
      scrollable
      automaticallyAdjustKeyboardInsets
      style={{ backgroundColor: mentaColors.canvas }}
      contentContainerStyle={styles.content}
    >
      <AppTopBar
        title={showScreenHeading ? undefined : t('groups.invite.group_invite')}
        onBack={() => backOrReplace(router, '/(tabs)/groups')}
        backLabel={t('groups.join.back')}
      />
      {showScreenHeading ? (
        <View style={styles.screenHeading}>
          <Text accessibilityRole="header" style={styles.screenTitle}>
            {screenTitle}
          </Text>
          {screenSubtitle ? (
            <Text style={styles.screenSubtitle}>{screenSubtitle}</Text>
          ) : null}
        </View>
      ) : null}
      {!hasJoinReceipt && previewState.kind === 'idle' ? (
        <View style={styles.entryStack}>
          <Text style={styles.fieldLabel}>{t('groups.join.link_or_code')}</Text>
          <AppTextField
            accessibilityLabel={t('groups.join.link_or_code')}
            value={inviteCode}
            placeholder={t('groups.join.code_placeholder_long')}
            maxLength={512}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            dismissKeyboardOnSubmit
            onSubmitEditing={() => {
              if (inviteCode.trim()) void handlePreviewGroup();
            }}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('groups.join.paste_accessibility')}
                onPress={() => void handlePasteInviteCode()}
                style={styles.pasteAction}
              >
                <Text style={styles.pasteActionText}>
                  {t('groups.join.paste_code')}
                </Text>
              </Pressable>
            }
            onChangeText={text => {
              previewRequestRef.current += 1;
              setInviteCode(text);
              setJoinNotice(null);
              setPreviewState({ kind: 'idle' });
            }}
          />
          <AppButton
            title={t('groups.join.find_invite')}
            disabled={!inviteCode.trim()}
            onPress={() => void handlePreviewGroup()}
            fullWidth
            size="large"
            variant="accent"
          />
          <View style={styles.authGateActions}>
            <AppButton
              title={t('groups.join.scan_qr')}
              fullWidth
              variant="outline"
              onPress={() => setShowCamera(true)}
            />
          </View>
        </View>
      ) : !hasJoinReceipt &&
        (previewState.kind === 'loading' || previewNeedsAccountCheck) ? (
        <View
          style={styles.previewActions}
          accessibilityRole="progressbar"
          accessibilityLabel={t('groups.join.checking_invite')}
          testID="join-group-invite-loading"
        >
          <View style={styles.previewCard}>
            <SkeletonLoader announce={false} height={28} width="62%" />
            <SkeletonLoader announce={false} height={14} width="48%" />
            <View style={styles.previewMeta}>
              <SkeletonLoader
                announce={false}
                borderRadius={mentaRadii.round}
                height={28}
                width={88}
              />
              <SkeletonLoader
                announce={false}
                borderRadius={mentaRadii.round}
                height={28}
                width={96}
              />
            </View>
            <View style={styles.previewDivider} />
            <SkeletonLoader announce={false} height={12} width="38%" />
            <SkeletonLoader announce={false} height={16} width="84%" />
            <View style={styles.previewDivider} />
            <SkeletonLoader announce={false} height={12} width="92%" />
            <SkeletonLoader announce={false} height={12} width="64%" />
          </View>
          <SkeletonButton />
          <SkeletonButton />
        </View>
      ) : !hasJoinReceipt &&
        !previewNeedsAccountCheck &&
        (previewState.kind === 'ready' ||
          previewState.kind === 'already_member') ? (
        <View
          style={[
            styles.previewActions,
            isGuestReady && styles.guestPreviewScreen,
          ]}
        >
          {isGuestReady && previewState.preview.inviterName ? (
            <Text style={styles.guestInviteCue}>
              {t('groups.join.invited_you', {
                inviter: previewState.preview.inviterName,
              })}
            </Text>
          ) : null}
          <View style={styles.previewCard} testID="group-invite-preview-card">
            <View style={styles.previewIdentity}>
              <View
                accessible={false}
                importantForAccessibility="no"
                style={styles.previewIdentityMark}
              />
              <View style={styles.previewIdentityCopy}>
                <Text accessibilityRole="header" style={styles.previewTitle}>
                  {previewState.preview.groupName || t('groups.preview.group')}
                </Text>
                {previewState.previewAccountId === null ? (
                  <Text style={styles.previewBody}>
                    {t('groups.join.group_invite')}
                  </Text>
                ) : previewState.preview.inviterName ? (
                  <Text style={styles.previewBody}>
                    {t('groups.join.invited_by', {
                      inviter: previewState.preview.inviterName,
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
            {'groupDescription' in previewState.preview &&
            previewState.preview.groupDescription ? (
              <Text style={styles.previewBody}>
                {previewState.preview.groupDescription}
              </Text>
            ) : null}
            {'memberCount' in previewState.preview ? (
              <View style={styles.previewMeta}>
                <View style={styles.previewPill}>
                  <Text style={styles.previewPillText}>
                    {previewState.preview.privacy === 'public'
                      ? t('groups.preview.public')
                      : t('groups.preview.private')}
                  </Text>
                </View>
                <View style={styles.previewPill}>
                  <Text style={styles.previewPillText}>
                    {t('groups.preview.member', {
                      count: previewState.preview.memberCount,
                    })}
                  </Text>
                </View>
              </View>
            ) : previewState.preview.privacy ? (
              <View style={styles.previewMeta}>
                <View style={styles.previewPill}>
                  <Text style={styles.previewPillText}>
                    {previewState.preview.privacy === 'public'
                      ? t('groups.preview.public')
                      : t('groups.preview.private')}
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={styles.previewRoleRow}>
              <Text style={styles.promiseLabel}>
                {t('groups.source.accountability.join_promise.your_role')}
              </Text>
              <Text style={styles.previewRoleValue}>
                {t('groups.source.role.member')}
              </Text>
            </View>
            {previewState.preview.sharedPromise ? (
              <>
                <View style={styles.previewDivider} />
                <Text style={styles.promiseLabel}>
                  {t('groups.join.shared_promise')}
                </Text>
                <Text style={styles.promiseText}>
                  {previewState.preview.sharedPromise}
                </Text>
              </>
            ) : null}
            {previewState.kind === 'ready' ? (
              <>
                <View style={styles.previewDivider} />
                <Text style={styles.promiseLabel}>
                  {t('groups.join.how_it_works')}
                </Text>
                <Text style={styles.previewBody}>
                  {t('groups.join.how_it_works_detail')}
                </Text>
              </>
            ) : null}
            {previewState.kind === 'already_member' ? (
              <>
                <View style={styles.previewDivider} />
                <Text style={styles.previewBody}>
                  {t('groups.join.already_member_detail')}
                </Text>
              </>
            ) : null}
            {previewState.kind === 'ready' &&
            previewState.previewAccountId !== null ? (
              <>
                <View style={styles.previewDivider} />
                <Text style={styles.previewBody}>
                  {describeJoinGroupPreviewSpend(joinQuote?.cost ?? null, t)}
                </Text>
              </>
            ) : null}
          </View>

          {previewState.kind === 'ready' ? (
            <Text style={styles.guestInviteHelper}>
              {previewState.previewAccountId === null
                ? 'Joining adds you to this group.'
                : joinQuote
                  ? `Joining costs ${joinQuote.cost} Momenta. Nothing is spent until you tap Join group.`
                  : 'Menta will confirm the exact Momenta cost before anything is spent.'}
            </Text>
          ) : null}

          {previewState.kind === 'already_member' ? (
            <AppButton
              title={t('groups.join.open_group')}
              onPress={() =>
                handleOpenJoinedGroup(previewState.preview.groupId)
              }
            />
          ) : isGuestReady ? (
            <View
              style={styles.guestPreviewFooter}
              testID="join-group-guest-footer"
            >
              <AppButton
                fullWidth
                size="large"
                testID="join-group-guest-join"
                title={t('groups.join.join_group')}
                onPress={() => void handleJoinGroup()}
              />
              <AppButton
                fullWidth
                size="small"
                testID="join-group-guest-not-now"
                title={t('groups.join.not_now')}
                variant="ghost"
                onPress={handleKeepBrowsing}
              />
            </View>
          ) : (
            <AppButton
              title={
                isJoining
                  ? t('groups.join.joining_long')
                  : t('groups.join.join_group')
              }
              loading={isJoining}
              disabled={isJoining}
              onPress={() => void handleJoinGroup()}
            />
          )}
          {!isGuestReady ? (
            <AppButton
              title={t('groups.join.receipt.use_another')}
              variant="secondary"
              disabled={isJoining}
              onPress={handleResetJoinFlow}
            />
          ) : null}
        </View>
      ) : !hasJoinReceipt && previewState.kind === 'auth_required' ? (
        <View style={styles.authInviteScreen}>
          {previewState.preview ? (
            <View
              accessible
              accessibilityLabel={`${previewState.preview.groupName || 'Group'} invite${
                previewState.preview.inviterName
                  ? ` from ${previewState.preview.inviterName}`
                  : ''
              }`}
              style={styles.authInviteSummary}
              testID="join-group-auth-invite-summary"
            >
              <View
                accessible={false}
                importantForAccessibility="no"
                style={styles.authInviteMark}
              />
              <View style={styles.authInviteCopy}>
                <Text style={styles.authInviteName}>
                  {previewState.preview.groupName || t('groups.preview.group')}
                </Text>
                {previewState.preview.inviterName ? (
                  <Text style={styles.authInviteMeta}>
                    {t('groups.join.inviter_invite', {
                      inviter: previewState.preview.inviterName,
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
          <View style={styles.authInviteHeading}>
            <Text accessibilityRole="header" style={styles.screenTitle}>
              {previewState.title}
            </Text>
            <Text style={styles.screenSubtitle}>{previewState.message}</Text>
          </View>
          <View style={styles.authInviteFooter}>
            <AppButton
              fullWidth
              size="large"
              title={t('groups.join.continue_sign_in')}
              onPress={handleSignInNow}
              testID="join-group-continue-to-sign-in"
            />
            <AppButton
              fullWidth
              size="small"
              title={t('groups.join.not_now')}
              variant="ghost"
              onPress={handleKeepBrowsing}
              testID="join-group-auth-not-now"
            />
          </View>
        </View>
      ) : !hasJoinReceipt &&
        (previewState.kind === 'inactive' ||
          previewState.kind === 'unavailable') ? (
        <View style={[styles.directSection, styles.sectionBody]}>
          <AppInlineNotice
            title={previewState.title}
            description={previewState.message}
            tone={previewState.kind === 'inactive' ? 'warning' : 'error'}
            testID="group-invite-preview-recovery"
          />
          {previewState.kind === 'unavailable' ? (
            <AppButton
              title={t('groups.join.retry_preview')}
              onPress={() => void handlePreviewGroup()}
            />
          ) : null}
          <AppButton
            title={t('groups.join.receipt.use_another')}
            variant="secondary"
            onPress={handleResetJoinFlow}
          />
        </View>
      ) : null}

      {receiptJoinNotice ? (
        <JoinGroupReceiptSection
          notice={receiptJoinNotice}
          joinCost={receiptSpend ?? joinQuote?.cost ?? 0}
          onOpenGroup={handleOpenJoinedGroup}
          onJoinAnother={handleResetJoinFlow}
        />
      ) : joinNotice ? (
        <JoinGroupActionNoticeSection
          notice={joinNotice}
          onOpenGroup={handleOpenJoinedGroup}
          onShowFunding={() => {
            setPaywallVariant('insufficient');
            if (canWatchSponsors) {
              setShowFundingOptions(true);
            } else {
              setPaywallVisible(true);
            }
          }}
          onShowQuota={() => {
            setPaywallVariant('quota');
            setPaywallVisible(true);
          }}
          onTryAnotherCode={() => {
            setJoinNotice(null);
            setShowFundingOptions(false);
          }}
          onSignIn={handleSignInNow}
        />
      ) : null}

      <JoinGroupFundingOptionsSection
        visible={canWatchSponsors && showFundingOptions && !hasJoinReceipt}
        joinCost={joinQuote?.cost}
        onWatchAd={() => {
          setShowFundingOptions(false);
          setPaywallVisible(true);
        }}
        onShowPro={() => setPaywallVisible(true)}
      />

      {!hasJoinReceipt ? (
        <JoinGroupDetailsSection
          expanded={showJoinDetails}
          onToggle={() => setShowJoinDetails(current => !current)}
        />
      ) : null}

      <ModalCard
        testID="group-invite-scanner-dialog"
        visible={showCamera}
        animationType="slide"
        surface="full_screen"
        dismissOnBackdrop={false}
        accessibilityLabel={t('groups.join.close_scanner')}
        onClose={() => setShowCamera(false)}
        cardStyle={styles.scannerModalCard}
      >
        <CameraFix
          onClose={() => setShowCamera(false)}
          onBarCodeScanned={res => {
            try {
              const data = typeof res?.data === 'string' ? res.data : '';
              if (data) handleQRScan(data);
            } catch {}
          }}
        />
      </ModalCard>
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onBuyPro={() => setPaywallVisible(false)}
        onBuyCredits={() => setPaywallVisible(false)}
        onWatchAd={canWatchSponsors ? handleWatchAd : undefined}
        context="member"
        variant={paywallVariant}
        quotaContext="group"
        quotaLimit={2}
        shortfall={Math.max((joinQuote?.cost ?? 0) - (balance || 0), 0)}
        adRewardAmount={canWatchSponsors ? adReward : 0}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: mentaSpacing[5],
    paddingBottom: mentaSpacing[10],
  },
  screenHeading: {
    gap: mentaSpacing[2],
    paddingVertical: mentaSpacing[3],
  },
  screenTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  screenSubtitle: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  directSection: {
    gap: mentaSpacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    paddingVertical: mentaSpacing[5],
  },
  sectionBody: {
    gap: mentaSpacing[4],
  },
  authGateActions: {
    gap: mentaSpacing[2],
  },
  scannerModalCard: {
    flex: 1,
    backgroundColor: mentaColors.canvas,
  },
  entryStack: {
    gap: mentaSpacing[4],
  },
  fieldLabel: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
  },
  pasteAction: {
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteActionText: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.action,
  },
  previewCard: {
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    backgroundColor: mentaColors.paper,
    padding: mentaSpacing[5],
    gap: mentaSpacing[4],
  },
  previewIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  previewIdentityMark: {
    width: 58,
    height: 58,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.action,
    backgroundColor: mentaColors.actionSoft,
  },
  previewIdentityCopy: {
    flex: 1,
    gap: 3,
  },
  previewTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.onPaper,
  },
  previewBody: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
  },
  previewDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: mentaColors.borderPaper,
  },
  previewMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
  },
  previewPill: {
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: 6,
  },
  previewPillText: {
    ...mentaTypography.caption,
    color: mentaColors.text.onPaper,
  },
  promiseLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.mutedOnPaper,
    textTransform: 'uppercase',
  },
  promiseText: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.onPaper,
  },
  previewRoleRow: {
    alignItems: 'center',
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 48,
  },
  previewRoleValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.onPaper,
  },
  previewActions: {
    gap: mentaSpacing[2],
  },
  guestPreviewScreen: {
    flexGrow: 1,
  },
  guestPreviewFooter: {
    gap: mentaSpacing[2],
    marginTop: 'auto',
    paddingTop: mentaSpacing[8],
  },
  guestInviteCue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.action,
    marginBottom: mentaSpacing[2],
  },
  guestInviteHelper: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
    marginVertical: mentaSpacing[2],
  },
  authInviteScreen: {
    flexGrow: 1,
    gap: mentaSpacing[6],
  },
  authInviteSummary: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    backgroundColor: mentaColors.surface,
    padding: mentaSpacing[3],
  },
  authInviteMark: {
    width: 42,
    height: 42,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.action,
    backgroundColor: mentaColors.actionSoft,
  },
  authInviteCopy: {
    flex: 1,
    gap: 2,
  },
  authInviteName: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  authInviteMeta: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  authInviteHeading: {
    gap: mentaSpacing[2],
  },
  authInviteFooter: {
    gap: mentaSpacing[2],
    marginTop: 'auto',
    paddingTop: mentaSpacing[8],
  },
});
