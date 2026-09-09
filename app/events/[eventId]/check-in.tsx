import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppTextField } from '@/components/ui/AppFields';
import { AppScreen } from '@/components/ui/AppShell';
import { ArrowLeftIcon, QrCodeIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { SkeletonLoader, SkeletonText } from '@/components/ui/SkeletonLoader';
import { createClientEventId } from '@/lib/client-event-id';
import {
  prepareEventAuthHandoff,
  transferEventCapability,
} from '@/lib/events/protected-auth-handoff';
import { useEventCapabilityHydration } from '@/lib/events/use-event-capability-hydration';
import { isEventCheckInWindowClosed } from '@/lib/events/check-in-window';
import { emitEventCheckInReceiptHaptic } from '@/lib/motion/event-receipt-haptics';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import type { EventCheckInConfirmed, EventReceipt } from '@/types/event';
import { useTranslation } from '@/lib/localization';
import { formatEventShortDateTime } from '@/lib/events/localized-formatting';

type CheckInStage = 'entry' | 'scanner' | 'confirmed';

const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const FactRow = ({
  label,
  detail,
  value,
  last = false,
}: {
  label: string;
  detail: string;
  value: string;
  last?: boolean;
}) => {
  const phoneLayout = usePhoneLayout();
  const stacked = phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2;
  return (
    <View
      style={[
        styles.factRow,
        stacked && styles.factRowStacked,
        last ? styles.factRowLast : null,
      ]}
    >
      <View style={styles.factCopy}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factDetail}>{detail}</Text>
      </View>
      <Text style={[styles.factValue, stacked && styles.factValueStacked]}>
        {value}
      </Text>
    </View>
  );
};

export default function EventCheckInScreen() {
  const { locale, t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId?: string | string[];
    shareToken?: string | string[];
    inviteToken?: string | string[];
  }>();
  const eventId = firstParam(params.eventId);
  const user = useAuthStore(state => state.user);
  const routeShareToken = firstParam(params.shareToken);
  const routeInviteToken = firstParam(params.inviteToken);
  const replaceSafeEventRoute = useCallback(
    (href: { pathname: string; params: { eventId: string } }) =>
      router.replace(href as never),
    [router]
  );
  const {
    ready: capabilityReady,
    invalid: capabilityInvalid,
    shareToken,
    inviteToken,
  } = useEventCapabilityHydration({
    userId: user?.id,
    eventId,
    surface: 'check-in',
    explicitShareToken: routeShareToken,
    explicitInviteToken: routeInviteToken,
    replace: replaceSafeEventRoute,
  });
  const summary = useEventStore(state => state.summary);
  const myOccurrence = useEventStore(state => state.myOccurrence);
  const loading = useEventStore(state => state.loading);
  const error = useEventStore(state => state.error);
  const loadSummary = useEventStore(state => state.loadSummary);
  const loadMyOccurrence = useEventStore(state => state.loadMyOccurrence);
  const checkIn = useEventStore(state => state.checkIn);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [stage, setStage] = useState<CheckInStage>('entry');
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState<
    string | null
  >(null);
  const [checkInReceipt, setCheckInReceipt] =
    useState<EventReceipt<EventCheckInConfirmed> | null>(null);
  const checkInClientEventId = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const hasScannedRef = useRef(false);
  const activeSummary = summary?.eventId === eventId ? summary : null;
  const attendance =
    myOccurrence &&
    myOccurrence.summary.occurrenceId === activeSummary?.occurrenceId
      ? myOccurrence.attendance
      : null;
  const checkedInAt = useMemo(
    () =>
      attendance?.checkedInAt
        ? formatEventShortDateTime({
            value: attendance.checkedInAt,
            locale,
            fallback: t('events.check_in.time_unavailable'),
          })
        : null,
    [attendance?.checkedInAt, locale, t]
  );
  const load = useCallback(async () => {
    if (!eventId || !capabilityReady) return;
    setSessionExpired(false);
    const summaryReceipt = await loadSummary({
      eventId,
      shareToken: shareToken ?? null,
      inviteToken: inviteToken ?? null,
    });
    if (summaryReceipt.outcome !== 'completed' || !summaryReceipt.data) return;

    if (!user) {
      setSessionExpired(true);
      return;
    }

    const mine = await loadMyOccurrence(summaryReceipt.data.occurrenceId);
    if (mine.code === 'AUTHENTICATION_REQUIRED') setSessionExpired(true);
  }, [
    capabilityReady,
    eventId,
    inviteToken,
    loadMyOccurrence,
    loadSummary,
    shareToken,
    user,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (attendance?.checkedInAt) setStage('confirmed');
  }, [attendance?.checkedInAt]);

  const returnToEvent = useCallback(() => {
    if (!eventId) {
      router.replace('/events');
      return;
    }
    transferEventCapability({
      userId: user?.id,
      eventId,
      from: 'check-in',
      to: 'detail',
    });
    router.replace({
      pathname: '/events/[eventId]',
      params: { eventId },
    });
  }, [eventId, router, user?.id]);

  const openSignIn = useCallback(() => {
    const destination = prepareEventAuthHandoff({
      eventId,
      surface: 'check-in',
      shareToken,
      inviteToken,
    });
    router.push(destination ?? '/login');
  }, [eventId, inviteToken, router, shareToken]);

  const updateToken = useCallback((nextToken: string) => {
    setToken(nextToken);
    setLocalMessage(null);
    setCheckInReceipt(null);
    checkInClientEventId.current = null;
  }, []);

  const submitCheckIn = useCallback(
    async (scannedToken?: string) => {
      if (!activeSummary || isSubmittingRef.current) return;
      if (!user) {
        setSessionExpired(true);
        return;
      }

      const trimmedToken = (scannedToken ?? token).trim();
      if (!trimmedToken) {
        setLocalMessage(t('events.check_in.enter_before_check'));
        return;
      }

      isSubmittingRef.current = true;
      setSubmitting(true);
      setSessionExpired(false);
      setLocalMessage(null);
      const clientEventId =
        checkInClientEventId.current ??
        (checkInClientEventId.current = createClientEventId());
      try {
        const receipt = await checkIn({
          occurrenceId: activeSummary.occurrenceId,
          clientEventId,
          token: trimmedToken,
        });
        setCheckInReceipt(receipt);
        void emitEventCheckInReceiptHaptic(receipt);

        if (receipt.outcome === 'completed') {
          setStage('confirmed');
          await loadMyOccurrence(activeSummary.occurrenceId);
        } else if (receipt.code === 'AUTHENTICATION_REQUIRED') {
          setSessionExpired(true);
        }
      } finally {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    },
    [activeSummary, checkIn, loadMyOccurrence, t, token, user]
  );

  const openScanner = useCallback(() => {
    setLocalMessage(null);
    setCameraPermissionError(null);
    setCheckInReceipt(null);
    hasScannedRef.current = false;
    setStage('scanner');
  }, []);

  const requestScannerPermission = useCallback(async () => {
    setCameraPermissionError(null);
    try {
      await requestCameraPermission();
    } catch {
      setCameraPermissionError(t('events.check_in.camera_request_failed_body'));
    }
  }, [requestCameraPermission, t]);

  const useManualCode = useCallback(() => {
    hasScannedRef.current = false;
    setStage('entry');
  }, []);

  const enterDifferentCode = useCallback(() => {
    updateToken('');
    hasScannedRef.current = false;
    setStage('entry');
  }, [updateToken]);

  const handleScannedCode = useCallback(
    (value: string) => {
      if (hasScannedRef.current || submitting) return;
      hasScannedRef.current = true;
      updateToken(value);
      setStage('entry');
      void submitCheckIn(value);
    },
    [submitting, submitCheckIn, updateToken]
  );

  if (!eventId) {
    return (
      <AppScreen
        lane="immersive"
        safeArea
        padding={false}
        hasTabBar={false}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.missingState, screenInsetPadding(phoneLayout)]}>
          <Text style={styles.stateTitle}>
            {t('events.check_in.link.incomplete')}
          </Text>
          <AppButton
            title={t('events.index.title')}
            onPress={() => router.replace('/events')}
            variant="primary"
          />
        </View>
      </AppScreen>
    );
  }

  if (capabilityInvalid) {
    return (
      <AppScreen
        lane="immersive"
        safeArea
        padding={false}
        hasTabBar={false}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.missingState, screenInsetPadding(phoneLayout)]}>
          <Text style={styles.stateTitle}>
            {t('events.check_in.link.invalid')}
          </Text>
          <Text style={styles.stateBody}>
            {t('events.check_in.link.invalid_body')}
          </Text>
          <AppButton
            title={t('events.index.title')}
            onPress={() => router.replace('/events')}
            variant="primary"
          />
        </View>
      </AppScreen>
    );
  }

  const unknownResult = checkInReceipt?.outcome === 'unknown_result';
  const failedCheckIn = checkInReceipt?.outcome === 'failed' && !sessionExpired;
  const rejectedCheckInCopy = isEventCheckInWindowClosed(checkInReceipt?.code)
    ? {
        title: t('events.check_in.closed_title'),
        description: t('events.check_in.closed_body'),
      }
    : {
        title: t('events.check_in.rejected_title'),
        description: t('events.check_in.rejected_body', {
          reason:
            checkInReceipt?.message ?? t('events.check_in.rejected_reason'),
        }),
      };
  const requiresSignIn = !user || sessionExpired;
  const connectionUnconfirmed =
    unknownResult && checkInReceipt?.code === 'FUNCTION_TRANSPORT_FAILED';
  const noJoinedAttendance = Boolean(
    activeSummary && (!attendance || attendance.state !== 'joined')
  );

  return (
    <AppScreen
      lane="immersive"
      safeArea
      padding={false}
      hasTabBar={false}
      style={styles.screen}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          screenInsetPadding(phoneLayout),
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('events.check_in.back')}
            onPress={returnToEvent}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeftIcon color={mentaColors.text.primary} size={20} />
          </Pressable>
          <Text style={styles.topLabel}>{t('events.check_in.title')}</Text>
          <View style={styles.trailingLane} />
        </View>

        {!activeSummary && loading ? (
          <View
            accessible
            accessibilityLabel={t('events.check_in.loading')}
            accessibilityRole="progressbar"
            style={styles.loadingState}
          >
            <SkeletonLoader
              announce={false}
              height={mentaLayout.minimumTouchTarget}
              width="38%"
            />
            <SkeletonText announce={false} lines={2} width="86%" />
            <View style={styles.loadingRows}>
              <SkeletonLoader
                announce={false}
                height={mentaLayout.iconLane}
                width={mentaLayout.iconLane}
              />
              <SkeletonLoader announce={false} height={mentaSpacing[8]} />
            </View>
          </View>
        ) : null}

        {!activeSummary && !loading ? (
          <View accessibilityRole="alert" style={styles.loadingState}>
            <Text style={styles.stateTitle}>
              {t('events.check_in.unavailable')}
            </Text>
            <Text style={styles.stateBody}>
              {error ?? t('events.check_in.unavailable_body')}
            </Text>
            <AppButton
              title={t('events.check_in.browse_public')}
              onPress={() => router.replace('/events')}
              variant="secondary"
            />
          </View>
        ) : null}

        {activeSummary && stage === 'confirmed' ? (
          <>
            <View style={styles.detailLead}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('events.check_in.confirmed_title')}
              </Text>
              <Text style={styles.stateBody}>
                {checkedInAt
                  ? t('events.check_in.confirmed_body', { time: checkedInAt })
                  : t('events.check_in.confirmed_body_no_time')}
              </Text>
            </View>
            <View style={styles.receiptSurface}>
              <Text style={styles.sectionLabel}>
                {t('events.check_in.event')}
              </Text>
              <Text style={styles.receiptTitle}>{activeSummary.title}</Text>
              <Text style={styles.receiptBody}>
                {t('events.check_in.confirmed_receipt')}
              </Text>
            </View>
            {error ? (
              <AppInlineNotice
                actionLabel={t('events.check_in.refresh')}
                description={t('events.check_in.refresh_body', { error })}
                onAction={() =>
                  void loadMyOccurrence(activeSummary.occurrenceId)
                }
                testID="event-check-in-refresh-error"
                title={t('events.check_in.refresh_title')}
                tone="warning"
              />
            ) : null}
            <AppButton
              title={t('events.check_in.back')}
              onPress={returnToEvent}
              variant="primary"
              fullWidth
            />
          </>
        ) : null}

        {activeSummary && stage === 'scanner' ? (
          <>
            {!cameraPermission?.granted ? (
              <View style={styles.permissionLead}>
                <Text accessibilityRole="header" style={styles.title}>
                  {t('events.check_in.allow_camera')}
                </Text>
                <Text style={styles.stateBody}>
                  {t('events.check_in.camera_body')}
                </Text>
                <View style={styles.factRows}>
                  <FactRow
                    label={t('events.check_in.event')}
                    detail={activeSummary.title}
                    value={t('events.check_in.this_event')}
                  />
                  <FactRow
                    label={t('events.check_in.camera_does')}
                    detail={t('events.check_in.scans_qr')}
                    value={t('events.check_in.no_photo')}
                    last
                  />
                </View>
                <AppButton
                  title={
                    cameraPermission?.canAskAgain === false
                      ? t('events.check_in.camera_blocked')
                      : t('events.check_in.allow_camera_button')
                  }
                  onPress={() => void requestScannerPermission()}
                  disabled={cameraPermission?.canAskAgain === false}
                  variant="primary"
                  fullWidth
                />
                {cameraPermission?.canAskAgain === false ? (
                  <AppInlineNotice
                    title={t('events.check_in.camera_off')}
                    description={t('events.check_in.camera_off_body')}
                    tone="warning"
                  />
                ) : null}
                {cameraPermissionError ? (
                  <AppInlineNotice
                    title={t('events.check_in.camera_request_failed')}
                    description={cameraPermissionError}
                    tone="warning"
                  />
                ) : null}
                <AppButton
                  title={t('events.check_in.enter_code')}
                  onPress={useManualCode}
                  variant="secondary"
                  fullWidth
                />
              </View>
            ) : (
              <View style={styles.scannerLead}>
                <Text accessibilityRole="header" style={styles.title}>
                  {t('events.check_in.scan_title')}
                </Text>
                <Text style={styles.stateBody}>
                  {t('events.check_in.scan_body')}
                </Text>
                <View style={styles.cameraFrame}>
                  <CameraView
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={result => handleScannedCode(result.data)}
                    style={StyleSheet.absoluteFill}
                  />
                  <View pointerEvents="none" style={styles.scanGuide} />
                </View>
                <View style={styles.factRows}>
                  <FactRow
                    label={t('events.check_in.event')}
                    detail={activeSummary.title}
                    value={t('events.check_in.this_event')}
                  />
                  <FactRow
                    label={t('events.check_in.check_in')}
                    detail={t('events.check_in.fact_detail')}
                    value={t('events.check_in.not_confirmed')}
                    last
                  />
                </View>
                <AppButton
                  title={t('events.check_in.enter_manually')}
                  onPress={useManualCode}
                  variant="secondary"
                  fullWidth
                />
              </View>
            )}
          </>
        ) : null}

        {activeSummary && stage === 'entry' ? (
          <>
            <View style={styles.detailLead}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('events.check_in.enter_title')}
              </Text>
              <Text style={styles.stateBody}>
                {t('events.check_in.enter_body', {
                  event: activeSummary.title,
                  details: t('events.check_in.entry_details'),
                })}
              </Text>
            </View>

            {requiresSignIn ? (
              <AppInlineNotice
                actionLabel={t('events.detail.sign_in')}
                description={t('events.check_in.sign_in_body')}
                onAction={openSignIn}
                testID="event-check-in-auth-required"
                title={
                  sessionExpired
                    ? t('events.detail.session_ended')
                    : t('events.check_in.sign_in_to_check')
                }
                tone="info"
              />
            ) : null}

            {noJoinedAttendance && !requiresSignIn ? (
              <AppInlineNotice
                actionLabel={t('events.check_in.back')}
                description={t('events.check_in.join_required_body')}
                onAction={returnToEvent}
                testID="event-check-in-join-required"
                title={t('events.check_in.join_required')}
                tone="warning"
              />
            ) : null}

            {!requiresSignIn && !noJoinedAttendance ? (
              <>
                {!unknownResult ? (
                  <AppButton
                    title={t('events.check_in.scan_button')}
                    onPress={() => void openScanner()}
                    variant="secondary"
                    fullWidth
                    leftIcon={
                      <QrCodeIcon color={mentaColors.text.primary} size={18} />
                    }
                    accessibilityHint={t('events.check_in.scan_hint')}
                  />
                ) : null}
                <AppTextField
                  label={t('events.check_in.code_label')}
                  helperText={t('events.check_in.code_helper')}
                  accessibilityLabel={t('events.check_in.code_accessibility')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting && !unknownResult}
                  maxLength={512}
                  onChangeText={updateToken}
                  placeholder={t('events.check_in.code_placeholder')}
                  returnKeyType="done"
                  onSubmitEditing={() => void submitCheckIn()}
                  spellCheck={false}
                  textContentType="oneTimeCode"
                  value={token}
                />

                {localMessage ? (
                  <AppInlineNotice
                    description={localMessage}
                    testID="event-check-in-code-needed"
                    title={t('events.check_in.code_needed')}
                    tone="warning"
                  />
                ) : null}

                {unknownResult ? (
                  <AppInlineNotice
                    description={
                      connectionUnconfirmed
                        ? t('events.check_in.unknown_connection_body')
                        : checkInReceipt?.message
                          ? t('events.check_in.unknown_with_message', {
                              message: checkInReceipt.message,
                            })
                          : t('events.check_in.unknown_body')
                    }
                    testID={
                      connectionUnconfirmed
                        ? 'event-check-in-connection-needed'
                        : 'event-check-in-unknown'
                    }
                    title={
                      connectionUnconfirmed
                        ? t('events.check_in.unknown_connection_title')
                        : t('events.check_in.unknown_title')
                    }
                    tone="warning"
                  />
                ) : null}

                {unknownResult ? (
                  <AppButton
                    title={t('events.check_in.different_code')}
                    onPress={enterDifferentCode}
                    variant="secondary"
                    fullWidth
                    accessibilityHint={t('events.check_in.different_code_hint')}
                  />
                ) : null}

                {failedCheckIn ? (
                  <AppInlineNotice
                    description={rejectedCheckInCopy.description}
                    testID="event-check-in-rejected"
                    title={rejectedCheckInCopy.title}
                    tone="error"
                  />
                ) : null}

                <AppButton
                  title={
                    unknownResult
                      ? t('events.check_in.check_status')
                      : t('events.check_in.confirm')
                  }
                  onPress={() => void submitCheckIn()}
                  loading={submitting}
                  variant={unknownResult ? 'primary' : 'accent'}
                  fullWidth
                  accessibilityHint={t('events.check_in.confirm_hint')}
                />
                {failedCheckIn ? (
                  <AppButton
                    title={t('events.check_in.scan_another')}
                    onPress={() => void openScanner()}
                    variant="secondary"
                    fullWidth
                  />
                ) : null}
              </>
            ) : null}

            <Text style={styles.helperCopy}>{t('events.check_in.helper')}</Text>
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mentaColors.canvas },
  content: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[6],
    paddingBottom: mentaSpacing[12],
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: mentaLayout.trailingActionLane,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: mentaLayout.trailingActionLane,
    justifyContent: 'center',
    width: mentaLayout.trailingActionLane,
  },
  topLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.secondary,
  },
  trailingLane: { width: mentaLayout.trailingActionLane },
  loadingState: {
    alignItems: 'flex-start',
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[12],
  },
  loadingRows: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  missingState: {
    flex: 1,
    gap: mentaSpacing[4],
    justifyContent: 'center',
    padding: mentaLayout.screenInset,
  },
  detailLead: { gap: mentaSpacing[3] },
  permissionLead: { gap: mentaSpacing[4] },
  scannerLead: { gap: mentaSpacing[4] },
  cameraFrame: {
    aspectRatio: 4 / 3,
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: 320,
    minHeight: 220,
    overflow: 'hidden',
  },
  scanGuide: {
    borderColor: mentaColors.action,
    borderRadius: mentaRadii.medium,
    borderWidth: 2,
    bottom: mentaSpacing[8],
    left: mentaSpacing[8],
    position: 'absolute',
    right: mentaSpacing[8],
    top: mentaSpacing[8],
  },
  factRows: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  factRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 58,
    paddingVertical: mentaSpacing[2],
  },
  factRowStacked: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingVertical: mentaSpacing[3],
  },
  factRowLast: { borderBottomWidth: 0 },
  factCopy: { flex: 1, gap: mentaSpacing[1] },
  factLabel: { ...mentaTypography.body, color: mentaColors.text.primary },
  factDetail: {
    ...mentaTypography.micro,
    color: mentaColors.text.secondary,
  },
  factValue: {
    ...mentaTypography.micro,
    color: mentaColors.text.secondary,
    maxWidth: 120,
    textAlign: 'right',
  },
  factValueStacked: {
    maxWidth: '100%',
    textAlign: 'left',
  },
  title: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.primary,
  },
  stateTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  stateBody: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  helperCopy: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  receiptSurface: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    gap: mentaSpacing[4],
    padding: mentaSpacing[5],
  },
  sectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.onPaper,
  },
  receiptTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
  },
  receiptBody: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
  },
  pressed: { opacity: 0.72 },
});
