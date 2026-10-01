import React, { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { Stack, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppListRow, AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { useTheme, type AppColors } from '@/constants/ThemeContext';
import { MentaConsent } from '@/components/menta-check/menta-consent';
import { useMentaCheckOverview } from '@/hooks/use-menta-check';
import { useTranslation } from '@/lib/localization';
import {
  buyMentaCheckPass,
  setMentaCheckConsent,
  setPromiseReviewMode,
  stopMentaCheckPass,
} from '@/lib/menta-check/api';
import type {
  MentaPromiseSetting,
  MentaRpcResult,
} from '@/lib/menta-check/types';
import { openPaywall } from '@/lib/paywall/manager';
import { RevenueCatAPI } from '@/lib/paywall/revenuecat';
import { mentaTypography, mentaSpacing } from '@/constants/MentaDesignSystem';

export default function MentaCheckScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useMentaCheckOverview();
  const [consent, setConsent] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [selected, setSelected] = useState<MentaPromiseSetting | null>(null);
  const [history, setHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = query.data;
  const run = async (operation: () => Promise<MentaRpcResult>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await operation();
      if (!result.success) {
        if (result.code === 'CONSENT_REQUIRED') setConsent(true);
        else if (result.code === 'ACCESS_REQUIRED')
          openPaywall({
            context: 'menta_check',
            onProConfirmed: () => {
              void query.refetch();
            },
          });
        else setError(t('mentaCheck.error.generic'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['menta-check'] });
      setSelected(null);
    } catch {
      setError(t('mentaCheck.error.generic'));
    } finally {
      setBusy(false);
    }
  };
  const withdraw = () => setWithdrawVisible(true);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="working"
        scrollable
        hasTabBar={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
          />
        }
      >
        <AppTopBar
          title={t(
            history ? 'mentaCheck.history.title' : 'mentaCheck.settings.title'
          )}
          onBack={() =>
            history
              ? setHistory(false)
              : backOrReplace(router, '/(tabs)/profile')
          }
        />
        {query.isPending ? (
          <View style={styles.content}>
            <SkeletonLoader width="100%" height={120} />
            <SkeletonLoader width="100%" height={240} />
          </View>
        ) : query.isError || !data ? (
          <AppButton
            title={t('mentaCheck.settings.loadFailed')}
            onPress={() => {
              void query.refetch();
            }}
          />
        ) : history ? (
          <View style={styles.content}>
            {data.history.length === 0 ? (
              <Text style={styles.body}>{t('mentaCheck.history.empty')}</Text>
            ) : (
              data.history.map(item => (
                <AppListRow
                  key={item.submissionId}
                  title={item.title}
                  subtitle={`${item.localDay} · ${t(item.status === 'rejected' ? 'mentaCheck.history.notYet' : item.reviewSource === 'self_override' ? 'mentaCheck.today.countedByYouTitle' : item.reviewSource === 'menta_backup' ? 'mentaCheck.history.countedBackup' : 'mentaCheck.history.counted')}`}
                  onPress={() =>
                    router.push({
                      pathname: '/challenges/[id]',
                      params: { id: item.challengeId },
                    })
                  }
                />
              ))
            )}
            <Text style={styles.body}>{t('mentaCheck.history.footnote')}</Text>
          </View>
        ) : (
          <View style={styles.settings}>
            <View style={styles.status}>
              <MentaMascot state="menta-check" size="md" />
              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>
                  {t(
                    data.isPro
                      ? 'mentaCheck.settings.statusPro'
                      : 'mentaCheck.intro.title'
                  )}
                </Text>
                <Text style={styles.detail}>
                  {data.stats.checks
                    ? t('mentaCheck.settings.stats', data.stats)
                    : t('mentaCheck.settings.statsNone')}
                </Text>
                {data.isPro ? (
                  <AppButton
                    variant="text"
                    style={styles.statusAction}
                    title={t('commerce.paywall.manageSubscription')}
                    onPress={() => {
                      void RevenueCatAPI.showManageSubscriptions();
                    }}
                  />
                ) : null}
                {!data.isPro ? (
                  <AppButton
                    variant="text"
                    style={styles.statusAction}
                    title={t('mentaCheck.settings.getPro')}
                    onPress={() =>
                      openPaywall({
                        context: 'menta_check',
                        onProConfirmed: () => {
                          void query.refetch();
                        },
                      })
                    }
                  />
                ) : null}
              </View>
            </View>
            <View style={styles.promiseList}>
              {data.promises.map(promise => (
                <AppListRow
                  key={promise.challengeId}
                  title={promise.title}
                  subtitle={t(
                    promise.reviewMode === 'menta'
                      ? 'mentaCheck.settings.rowEvery'
                      : promise.reviewMode === 'people'
                        ? 'mentaCheck.settings.rowFriends'
                        : 'mentaCheck.settings.rowSelf'
                  )}
                  onPress={
                    !promise.isCreator || busy
                      ? undefined
                      : () => {
                          setError(null);
                          setSelected(promise);
                        }
                  }
                />
              ))}
            </View>
            <View style={styles.utilityList}>
              <AppListRow
                title={t('mentaCheck.settings.history')}
                value={String(data.stats.checks)}
                onPress={() => setHistory(true)}
              />
              <AppListRow
                title={t('mentaCheck.settings.whatMentaSees')}
                onPress={() => setConsent(true)}
              />
            </View>
            <View style={styles.footer}>
              {data.consented ? (
                <AppButton
                  variant="text"
                  textStyle={styles.destructive}
                  disabled={busy}
                  title={t('mentaCheck.settings.stop')}
                  onPress={withdraw}
                />
              ) : (
                <AppButton
                  title={t('mentaCheck.settings.turnOn')}
                  onPress={() => setConsent(true)}
                />
              )}
              {data.consented ? (
                <Text style={styles.footerNote}>
                  {t('mentaCheck.settings.stopBody')}
                </Text>
              ) : null}
            </View>
          </View>
        )}
        {error ? (
          <Text style={styles.body} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </AppScreen>
      <MentaConsent
        visible={consent}
        source="settings"
        onClose={() => setConsent(false)}
        onAccepted={() => {
          setConsent(false);
          void query.refetch();
        }}
      />
      <SimpleBottomSheet
        visible={withdrawVisible}
        onClose={() => {
          if (!busy) setWithdrawVisible(false);
        }}
        scrollableBody
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {t('mentaCheck.settings.stopConfirmTitle')}
          </Text>
          <Text style={styles.body}>{t('mentaCheck.settings.stopBody')}</Text>
          <AppButton
            title={t('mentaCheck.settings.stopConfirm')}
            loading={busy}
            onPress={() => {
              void run(async () => {
                const result = await setMentaCheckConsent(false, 'settings');
                if (result.success) setWithdrawVisible(false);
                return result;
              });
            }}
          />
          <AppButton
            title={t('mentaCheck.settings.cancel')}
            variant="text"
            disabled={busy}
            onPress={() => setWithdrawVisible(false)}
          />
        </View>
      </SimpleBottomSheet>
      <SimpleBottomSheet
        visible={Boolean(selected)}
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        scrollableBody
      >
        {selected ? (
          <View style={styles.content}>
            <Text style={styles.title}>{selected.title}</Text>
            {selected.isSolo ? (
              <>
                <AppButton
                  disabled={busy}
                  title={t('mentaCheck.option.title')}
                  onPress={() => {
                    void run(() =>
                      setPromiseReviewMode(selected.challengeId, 'menta')
                    );
                  }}
                />
                {!data?.isPro ? (
                  <>
                    <Text style={styles.body}>
                      {t('mentaCheck.option.passNote', {
                        cost: data?.passCost ?? 20,
                      })}
                    </Text>
                    <AppButton
                      variant="secondary"
                      disabled={busy}
                      title={t('mentaCheck.keep.ctaPass')}
                      onPress={() => {
                        if (!data?.consented) {
                          setConsent(true);
                          return;
                        }
                        void run(async () => {
                          const result = await buyMentaCheckPass(
                            selected.challengeId
                          );
                          return result.success
                            ? setPromiseReviewMode(
                                selected.challengeId,
                                'menta'
                              )
                            : result;
                        });
                      }}
                    />
                  </>
                ) : null}
                {selected.passAutoRenew ? (
                  <AppButton
                    variant="text"
                    disabled={busy}
                    title={t('mentaCheck.pass.stopRenewing')}
                    onPress={() => {
                      void run(() => stopMentaCheckPass(selected.challengeId));
                    }}
                  />
                ) : null}
                <AppButton
                  variant="secondary"
                  disabled={busy}
                  title={t('mentaCheck.settings.rowSelf')}
                  onPress={() => {
                    void run(() =>
                      setPromiseReviewMode(selected.challengeId, 'self')
                    );
                  }}
                />
              </>
            ) : (
              <Text style={styles.body}>
                {t('mentaCheck.settings.groupOnly')}
              </Text>
            )}
            <View style={styles.timingSection}>
              <Text style={styles.sectionTitle}>
                {t('mentaCheck.group.stepInTitle')}
              </Text>
              {([12, 24, 48, null] as const).map(hours => (
                <AppListRow
                  key={hours ?? 'off'}
                  showChevron={false}
                  selected={
                    selected.reviewMode === 'people' &&
                    selected.backupHours === hours
                  }
                  style={styles.timingRow}
                  title={t(
                    hours === 12
                      ? 'mentaCheck.group.after12'
                      : hours === 24
                        ? 'mentaCheck.group.after24'
                        : hours === 48
                          ? 'mentaCheck.group.after48'
                          : 'mentaCheck.group.never'
                  )}
                  onPress={
                    busy
                      ? undefined
                      : () => {
                          void run(() =>
                            setPromiseReviewMode(
                              selected.challengeId,
                              'people',
                              hours
                            )
                          );
                        }
                  }
                />
              ))}
              <Text style={styles.body}>
                {t('mentaCheck.group.stepInFootnote')}
              </Text>
            </View>
            {error ? (
              <Text style={styles.body} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
          </View>
        ) : null}
      </SimpleBottomSheet>
    </>
  );
}
const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    settings: { flexGrow: 1, paddingTop: mentaSpacing[6] },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[4],
    },
    statusCopy: { flex: 1, minWidth: 0, gap: mentaSpacing[1] },
    statusTitle: {
      ...mentaTypography.bodySemibold,
      fontSize: 20,
      lineHeight: 26,
      color: colors.text.primary,
    },
    detail: { ...mentaTypography.bodySmall, color: colors.text.secondary },
    statusAction: { alignSelf: 'flex-start', marginLeft: -mentaSpacing[3] },
    promiseList: { marginTop: mentaSpacing[6] },
    utilityList: { marginTop: mentaSpacing[4] },
    footer: {
      marginTop: 'auto',
      paddingTop: mentaSpacing[10],
      gap: mentaSpacing[2],
    },
    footerNote: {
      ...mentaTypography.bodySmall,
      color: colors.text.muted,
      textAlign: 'center',
    },
    destructive: { color: colors.status.error },
    timingSection: { marginTop: mentaSpacing[4], gap: mentaSpacing[2] },
    timingRow: { paddingHorizontal: mentaSpacing[3] },
    sectionTitle: {
      ...mentaTypography.bodySemibold,
      color: colors.text.primary,
      marginBottom: mentaSpacing[2],
    },
    content: { gap: mentaSpacing[4], paddingVertical: mentaSpacing[5] },
    title: { ...mentaTypography.title, color: colors.text.primary },
    body: { ...mentaTypography.body, color: colors.text.secondary },
  });
