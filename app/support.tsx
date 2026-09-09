import { useTranslation } from '@/lib/localization';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Application from 'expo-application';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OfflineSupportNotice } from '@/components/support/OfflineSupportNotice';
import { SupportPageHeader } from '@/components/support/SupportPageHeader';
import { SupportActionRow } from '@/components/support/SupportSurface';
import { AppInlineNotice, AppScreen, SkeletonLoader } from '@/components/ui';
import {
  FileTextIcon,
  HelpCircleIcon,
  MessageSquareIcon,
  RefreshCcwIcon,
  SettingsIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useNetworkState } from '@/lib/network';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { restorePurchases } from '@/lib/paywall/revenuecat';
import { listResumableProofDrafts } from '@/lib/proof-drafts';
import {
  getReportDraftCopy,
  listOpenReportDraftsForUser,
  type ReportDraft,
} from '@/lib/report-drafts';
import { useAuthStore } from '@/store/auth-store';
import { trackProductOperation } from '@/lib/posthog';

type SupportNotice = {
  tone: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
} | null;

export default function SupportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const network = useNetworkState();
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?.id ?? null;
  const hasActiveSession = isAuthenticated && Boolean(userId);
  const [savedProofCount, setSavedProofCount] = useState<number | null>(null);
  const [savedProofOwnerId, setSavedProofOwnerId] = useState<string | null>(
    userId
  );
  const [savedReportDrafts, setSavedReportDrafts] = useState<
    ReportDraft[] | null
  >(hasActiveSession ? null : []);
  const [savedReportOwnerId, setSavedReportOwnerId] = useState<string | null>(
    userId
  );
  const [proofDraftsLoading, setProofDraftsLoading] = useState(true);
  const [reportDraftsLoading, setReportDraftsLoading] =
    useState(hasActiveSession);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [notice, setNotice] = useState<SupportNotice>(null);

  useEffect(() => {
    trackProductOperation({
      area: 'support',
      authority: 'client',
      operation: 'open_support',
      outcome: 'confirmed',
      phase: 'authority',
      source: 'support',
    });
  }, []);

  useEffect(() => {
    let active = true;
    if (!userId || !hasActiveSession) {
      setSavedProofCount(null);
      setSavedProofOwnerId(null);
      setProofDraftsLoading(false);
      return () => {
        active = false;
      };
    }

    setSavedProofCount(null);
    setSavedProofOwnerId(userId);
    setProofDraftsLoading(true);
    void listResumableProofDrafts()
      .then(drafts => {
        if (!active) return;
        setSavedProofCount(
          drafts.filter(draft => draft.userId === userId).length
        );
        setProofDraftsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSavedProofCount(null);
        setProofDraftsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasActiveSession, userId]);

  const visibleProofCount =
    savedProofOwnerId === userId ? savedProofCount : null;

  useEffect(() => {
    let active = true;
    if (!userId || !hasActiveSession) {
      setSavedReportDrafts([]);
      setSavedReportOwnerId(null);
      setReportDraftsLoading(false);
      return () => {
        active = false;
      };
    }

    setSavedReportDrafts(null);
    setSavedReportOwnerId(userId);
    setReportDraftsLoading(true);
    void listOpenReportDraftsForUser(userId)
      .then(drafts => {
        if (!active) return;
        setSavedReportDrafts(drafts);
        setReportDraftsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSavedReportDrafts(null);
        setReportDraftsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasActiveSession, userId]);

  const visibleReportDrafts =
    savedReportOwnerId === userId ? savedReportDrafts : null;
  const savedReportCount = visibleReportDrafts?.length ?? null;

  const openReportDraft = useCallback(
    (draftId: string) => {
      router.push({
        pathname: '/report-issue',
        params: { draftId },
      } as never);
    },
    [router]
  );

  const startReport = useCallback(() => {
    if (!hasActiveSession) {
      trackProductOperation({
        area: 'support',
        authority: 'client',
        operation: 'open_support',
        outcome: 'blocked',
        phase: 'eligibility',
        source: 'support',
      });
      router.push({
        pathname: '/auth-required',
        params: { next: '/report-issue' },
      } as never);
      return;
    }

    if (visibleReportDrafts && visibleReportDrafts.length > 0) {
      router.push({
        pathname: '/report-issue',
        params: { newReport: '1' },
      } as never);
      return;
    }

    router.push('/report-issue');
  }, [hasActiveSession, router, visibleReportDrafts]);

  const startFeedback = useCallback(() => {
    if (!hasActiveSession) return;
    router.push({
      pathname: '/report-issue',
      params: {
        mode: 'feedback',
        newReport: '1',
        source: 'settings_feedback',
      },
    } as never);
  }, [hasActiveSession, router]);

  const getDraftContext = useCallback(
    (draft: ReportDraft) => {
      const context =
        draft.contextLabel?.trim() ||
        (draft.source === 'settings_feedback'
          ? t('fullAuth.support.feedback')
          : draft.reportKind === 'challenge'
            ? t('fullAuth.support.promise_report')
            : draft.reportKind === 'group'
              ? t('fullAuth.support.group_report')
              : draft.reportKind === 'submission'
                ? t('fullAuth.support.proof_report')
                : t('fullAuth.support.app_issue'));
      return `${context}. ${getReportDraftCopy(draft.status).title}.`;
    },
    [t]
  );

  const appVersion = useMemo(() => {
    const version = Application.nativeApplicationVersion ?? 'development';
    const build = Application.nativeBuildVersion;
    return build ? `${version} (${build})` : version;
  }, []);

  const showTroubleshooting = useCallback(async () => {
    const savedCopy = proofDraftsLoading
      ? t('fullAuth.support.checking_saved_proof')
      : visibleProofCount === null
        ? t('fullAuth.support.saved_proof_count_unavailable')
        : visibleProofCount === 0
          ? t('fullAuth.support.no_proof_waiting')
          : t('fullAuth.support.proof_count_saved', {
              count: visibleProofCount,
              proofLabel:
                visibleProofCount === 1
                  ? t('fullAuth.support.proof_is')
                  : t('fullAuth.support.proofs_are'),
            });

    try {
      const latest = await network.refresh();
      const online =
        latest.isConnected !== false && latest.isInternetReachable !== false;
      setNotice({
        tone: online ? 'info' : 'warning',
        title: online
          ? t('fullAuth.support.connection_available')
          : t('fullAuth.support.menta_appears_offline'),
        description: t(
          'fullAuth.support.version_appversion_savedcopy_saved_proof_stays_o',
          { appVersion: appVersion, savedCopy: savedCopy }
        ),
      });
    } catch {
      setNotice({
        tone: 'warning',
        title: t('fullAuth.support.connection_check_did_not_finish'),
        description: t(
          'fullAuth.support.version_appversion_savedcopy_nothing_changed_try',
          { appVersion: appVersion, savedCopy: savedCopy }
        ),
      });
    }
  }, [appVersion, network, proofDraftsLoading, visibleProofCount]);

  const handleRestorePurchases = useCallback(async () => {
    if (restoreLoading) return;

    if (!hasActiveSession) {
      router.push({
        pathname: '/auth-required',
        params: { next: '/support' },
      } as never);
      return;
    }

    setRestoreLoading(true);
    trackProductOperation({
      area: 'pro',
      authority: 'provider',
      operation: 'restore_purchase',
      outcome: 'started',
      phase: 'intent',
      source: 'support',
    });
    setNotice({
      tone: 'info',
      title: t('fullAuth.support.looking_for_an_earlier_menta_pro_purchase'),
      description: t(
        'fullAuth.support.this_does_not_start_a_new_purchase_or_charge_thi'
      ),
    });

    try {
      const result = await restorePurchases();
      if (result.success) {
        trackProductOperation({
          area: 'pro',
          authority: 'provider',
          operation: 'restore_purchase',
          outcome: 'confirmed',
          phase: 'authority',
          source: 'support',
        });
        setNotice({
          tone: 'success',
          title: t('fullAuth.support.menta_pro_is_active_again'),
          description: t(
            'fullAuth.support.your_earlier_purchase_is_active_on_this_account'
          ),
        });
      } else if (result.entitlementPending) {
        trackProductOperation({
          area: 'pro',
          authority: 'provider',
          operation: 'restore_purchase',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'support',
        });
        setNotice({
          tone: 'warning',
          title: t('fullAuth.support.menta_pro_is_still_being_checked'),
          description: t(
            'fullAuth.support.do_not_buy_it_again_while_this_check_continues'
          ),
        });
      } else if (result.errorMessage) {
        trackProductOperation({
          area: 'pro',
          authority: 'provider',
          operation: 'restore_purchase',
          outcome: 'failed',
          phase: 'authority',
          source: 'support',
        });
        setNotice({
          tone: 'error',
          title: t('fullAuth.support.could_not_check_earlier_purchases'),
          description: t(
            'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne'
          ),
        });
      } else {
        trackProductOperation({
          area: 'pro',
          authority: 'provider',
          operation: 'restore_purchase',
          outcome: 'ineligible',
          phase: 'eligibility',
          source: 'support',
        });
        setNotice({
          tone: 'info',
          title: t('fullAuth.support.no_matching_purchase_was_found'),
          description: t(
            'fullAuth.support.check_the_apple_account_used_for_the_original_pu'
          ),
        });
      }
    } catch {
      trackProductOperation({
        area: 'pro',
        authority: 'provider',
        operation: 'restore_purchase',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: 'support',
      });
      setNotice({
        tone: 'error',
        title: t('fullAuth.support.could_not_check_earlier_purchases'),
        description: t(
          'fullAuth.support.nothing_was_purchased_or_changed_check_the_conne'
        ),
      });
    } finally {
      setRestoreLoading(false);
    }
  }, [hasActiveSession, restoreLoading, router]);

  const isOffline =
    network.isConnected === false || network.isInternetReachable === false;

  return (
    <AppScreen
      lane="working"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
      testID="support-screen"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <SupportPageHeader
        onBack={() =>
          backOrReplace(router, hasActiveSession ? '/settings' : '/login')
        }
        title={t('fullAuth.support.support')}
      />

      <Text style={styles.description}>
        {t('fullAuth.support.choose_what_you_need_you_can_review_everything_b')}
      </Text>

      {notice ? (
        <AppInlineNotice
          actionLabel={
            notice.tone === 'error' ? t('fullAuth.shared.try_again') : undefined
          }
          actionLoading={restoreLoading}
          description={notice.description}
          onAction={
            notice.tone === 'error'
              ? () => void handleRestorePurchases()
              : undefined
          }
          testID="support-notice"
          title={notice.title}
          tone={notice.tone}
        />
      ) : null}

      {isOffline ? (
        <OfflineSupportNotice onRetry={() => void showTroubleshooting()} />
      ) : null}

      {!proofDraftsLoading && visibleProofCount && visibleProofCount > 0 ? (
        <Text style={styles.savedState} testID="support-saved-proof-status">
          {t('fullAuth.support.saved_proof_waiting_to_be_sent', {
            count: visibleProofCount,
            proofLabel:
              visibleProofCount === 1
                ? t('fullAuth.support.proof_is')
                : t('fullAuth.support.proofs_are'),
          })}
        </Text>
      ) : null}

      {!hasActiveSession ? (
        <AppInlineNotice
          actionLabel={t('fullAuth.shared.sign_in')}
          description={t(
            'fullAuth.support.support_drafts_stay_private_to_the_account_that_'
          )}
          onAction={() => router.push('/login')}
          testID="support-session-notice"
          title={t('fullAuth.support.sign_in_required')}
          tone="warning"
        />
      ) : null}

      {hasActiveSession && visibleReportDrafts?.length ? (
        <View style={styles.actions} testID="support-saved-reports">
          <Text style={styles.sectionLabel}>
            {t('fullAuth.support.saved_reports')}
          </Text>
          <View style={styles.directRows}>
            {visibleReportDrafts.map((draft, index) => (
              <SupportActionRow
                icon={
                  <HelpCircleIcon
                    color={mentaColors.text.secondary}
                    size={16}
                  />
                }
                key={draft.id}
                onPress={() => openReportDraft(draft.id)}
                showDivider={index < visibleReportDrafts.length - 1}
                subtitle={getDraftContext(draft)}
                testID={`support-report-draft-${draft.id}`}
                title={
                  draft.title.trim() || t('fullAuth.support.untitled_report')
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {reportDraftsLoading ? (
        <View
          accessibilityLabel={t(
            'fullAuth.support.checking_private_report_drafts'
          )}
          accessibilityRole="progressbar"
          style={styles.primaryLoading}
        >
          <SkeletonLoader announce={false} height={24} width="58%" />
          <SkeletonLoader announce={false} height={16} width="86%" />
        </View>
      ) : (
        <View style={styles.actions}>
          <Text style={styles.sectionLabel}>
            {t('fullAuth.support.support')}
          </Text>
          <View style={styles.directRows}>
            <SupportActionRow
              icon={<FileTextIcon color={mentaColors.action} size={18} />}
              onPress={startReport}
              subtitle={t('fullAuth.residual.report.issue_description')}
              testID="support-report-issue"
              title={
                !hasActiveSession
                  ? t('fullAuth.support.sign_in_to_report_an_issue')
                  : savedReportCount && savedReportCount > 0
                    ? t('fullAuth.support.start_a_new_report')
                    : t('fullAuth.support.report_an_issue')
              }
            />
            {hasActiveSession ? (
              <SupportActionRow
                icon={
                  <MessageSquareIcon color={mentaColors.action} size={18} />
                }
                onPress={startFeedback}
                showDivider={false}
                subtitle={t('fullAuth.residual.report.feedback_description')}
                testID="support-share-feedback"
                title={t('fullAuth.support.share_feedback')}
              />
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.actions} testID="support-more-help">
        <Text style={styles.sectionLabel}>
          {t('fullAuth.support.more_help')}
        </Text>
        <View style={styles.directRows}>
          <SupportActionRow
            icon={<SettingsIcon color={mentaColors.text.secondary} size={16} />}
            onPress={() => void showTroubleshooting()}
            subtitle={t(
              'fullAuth.support.see_app_version_connection_and_saved_proof'
            )}
            title={t('fullAuth.support.check_app_and_connection')}
          />
          {hasActiveSession ? (
            <SupportActionRow
              icon={
                <SettingsIcon color={mentaColors.text.secondary} size={16} />
              }
              onPress={() => router.push('/system-settings')}
              subtitle={t(
                'fullAuth.support.change_menta_permissions_on_this_phone'
              )}
              title={t('fullAuth.support.open_phone_settings')}
            />
          ) : null}
          <SupportActionRow
            disabled={restoreLoading}
            icon={
              <RefreshCcwIcon color={mentaColors.text.secondary} size={16} />
            }
            onPress={() => void handleRestorePurchases()}
            right={
              restoreLoading ? (
                <SkeletonLoader
                  announce={false}
                  borderRadius={mentaRadii.round}
                  height={16}
                  width={16}
                />
              ) : undefined
            }
            subtitle={t('fullAuth.support.find_an_earlier_menta_pro_purchase')}
            testID="support-restore-purchases"
            title={
              restoreLoading
                ? t('fullAuth.support.checking_purchases')
                : t('fullAuth.support.restore_purchases')
            }
            showDivider={false}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    gap: mentaSpacing[6],
    flexGrow: 1,
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  description: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  actions: { gap: mentaSpacing[2] },
  savedState: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
    paddingVertical: mentaSpacing[1],
  },
  sectionLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmallMedium,
  },
  primaryLoading: {
    gap: mentaSpacing[3],
    justifyContent: 'center',
    minHeight: 72,
    paddingVertical: mentaSpacing[3],
  },
  directRows: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
