import {
  type MentaPalette,
  mentaColors as mediaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {
  CameraView,
  type CameraType,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ProofVideoPlayer } from '@/components/proof/proof-video-player';
import { useIsFocused } from 'expo-router/react-navigation';

import { AppButton } from '@/components/ui/AppButton';
import {
  IPadTwoPaneWorkspace,
  useIPadPortraitWorkspace,
} from '@/components/ipad/ipad-workspace';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  CameraIcon,
  ImageIcon,
  RefreshCwIcon,
  VideoIcon,
  XIcon,
} from '@/components/ui/icons';
import { HoldToSendButton } from '@/components/proof';
import {
  getProofSendCopy,
  ProofCheckerLine,
} from '@/components/proof/ProofCheckerLine';
import type { ProofChecker } from '@/lib/proof/proof-roles';

import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  createProofDraft,
  getProofDraft,
  updateProofDraft,
  type ProofDraft,
} from '@/lib/proof-drafts';
import {
  getDurableProofMedia,
  persistProofMediaLocally,
  type DurableProofMedia,
} from '@/lib/services/proof-media-service';
import { addBreadcrumb, captureError, captureMessage } from '@/lib/sentry';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/localization/use-translation';

const CAMERA_SLOW_START_MS = 3000;
const CAMERA_START_TIMEOUT_MS = 8000;
const LOCAL_DRAFT_STATUS = 'saved-local' as const;

export type CapturedMediaProof = {
  clientEventId: string;
  localMediaUri: string;
  proofType: 'photo' | 'video';
  proofValue: string;
};

type CameraVerificationProps = {
  mentaRule?: string;
  /** The promise's own proof rule, shown on the preview before sending. */
  proofRule?: string | null;
  /** Who decides whether this proof counts (Paper page 25, S01–S04). */
  proofChecker?: ProofChecker;
  challengeId: string;
  groupId?: string | null;
  verificationType: 'photo' | 'video';
  clientEventId: string;
  clientTimeZone: string;
  initialLocalMediaUri?: string | null;
  onLocalDraftSaved?: (draft: ProofDraft) => void;
  onVerificationComplete: (proof: CapturedMediaProof) => void;
  onCaptureIssue?: (draft: ProofDraft | null, message: string) => void;
  onCancel: () => void;
  /** Lets the route hand the screen to the camera access step (Paper C01/C02). */
  onAccessGateChange?: (showing: boolean) => void;
  /** Lets the route title the hold-to-send preview (Paper page 25, S01). */
  onPreviewChange?: (showing: boolean) => void;
};

type PendingUpload = DurableProofMedia;

type ProofNotice = {
  title: string;
  description: string;
};

function ReviewVideoPreview({
  uri,
  style,
}: {
  uri: string;
  style: StyleProp<ViewStyle>;
}) {
  return <ProofVideoPlayer uri={uri} style={style} surface="capture_preview" />;
}

const UNKNOWN_CHECKER: ProofChecker = { kind: 'unknown' };

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message.trim() ? error.message : fallback;

function CameraLoadingPlaceholder() {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('shared.camera.scannerChecking')}
      accessibilityRole="progressbar"
      style={styles.cameraLoadingScreen}
    >
      <SkeletonLoader
        announce={false}
        width="100%"
        height={260}
        borderRadius={mentaRadii.large}
      />
      <Text style={styles.messageTitle}>
        {t('shared.camera.scannerChecking')}
      </Text>
      <Text style={styles.messageCopy}>
        {t('shared.camera.checkingTakesMoment')}
      </Text>
    </View>
  );
}

/**
 * Captures and previews media, persists the local draft before upload work,
 * and returns a stable storage reference to the verification route. It never
 * claims a submitted or accepted proof; that belongs to proof-submission-service.
 */
export function CameraVerification({
  mentaRule,
  proofRule = null,
  proofChecker = UNKNOWN_CHECKER,
  challengeId,
  groupId,
  verificationType,
  clientEventId,
  clientTimeZone,
  initialLocalMediaUri = null,
  onLocalDraftSaved,
  onVerificationComplete,
  onCaptureIssue,
  onCancel,
  onAccessGateChange,
  onPreviewChange,
}: CameraVerificationProps) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionRequestPending, setPermissionRequestPending] =
    useState(false);
  const [proofNotice, setProofNotice] = useState<ProofNotice | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(
    null
  );

  const cameraRef = useRef<CameraView | null>(null);
  const cameraMountStartedAtRef = useRef<number | null>(null);
  const cameraSlowReportedRef = useRef(false);
  const cameraTimeoutReportedRef = useRef(false);
  const initialMediaPreparedRef = useRef(false);
  const isFocused = useIsFocused();
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const usesIPadWorkspace = useIPadPortraitWorkspace();
  const compactScreenInset = { paddingHorizontal: phoneLayout.screenInset };

  const hasAllPermissions = Boolean(
    cameraPermission?.granted &&
    (verificationType === 'photo' || microphonePermission?.granted)
  );
  const showsAccessGate = Boolean(
    !pendingUpload &&
    cameraPermission &&
    (verificationType === 'photo' || microphonePermission) &&
    !hasAllPermissions
  );

  useEffect(() => {
    onAccessGateChange?.(showsAccessGate);
  }, [onAccessGateChange, showsAccessGate]);

  const showsPreview = Boolean(pendingUpload);
  useEffect(() => {
    onPreviewChange?.(showsPreview);
  }, [onPreviewChange, showsPreview]);

  const preparePendingUpload = useCallback(
    async (mediaUri: string, mediaType: 'photo' | 'video') =>
      persistProofMediaLocally({
        sourceUri: mediaUri,
        mediaType,
        clientEventId,
      }),
    [clientEventId]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (
      !initialLocalMediaUri ||
      initialMediaPreparedRef.current ||
      pendingUpload
    ) {
      return;
    }

    initialMediaPreparedRef.current = true;
    Promise.resolve()
      .then(() =>
        getDurableProofMedia({
          localMediaUri: initialLocalMediaUri,
          mediaType: verificationType,
        })
      )
      .then(setPendingUpload)
      .catch(error => {
        onCaptureIssue?.(
          null,
          getErrorMessage(error, t('shared.camera.reopenSavedProofFailed'))
        );
      });
  }, [
    initialLocalMediaUri,
    onCaptureIssue,
    pendingUpload,
    t,
    verificationType,
  ]);

  useEffect(() => {
    if (
      !hasAllPermissions ||
      isReady ||
      cameraError ||
      pendingUpload ||
      !isFocused ||
      appState !== 'active'
    ) {
      return;
    }

    if (cameraMountStartedAtRef.current === null) {
      cameraMountStartedAtRef.current = Date.now();
    }

    const timeout = setTimeout(() => {
      const durationMs = cameraMountStartedAtRef.current
        ? Date.now() - cameraMountStartedAtRef.current
        : CAMERA_START_TIMEOUT_MS;
      if (!cameraTimeoutReportedRef.current) {
        cameraTimeoutReportedRef.current = true;
        captureMessage('camera_start_timeout', 'warning', {
          extras: {
            surface: 'proof_camera',
            platform: Platform.OS,
            durationMs,
            retryCount,
            permissionGranted: true,
            verificationType,
          },
          tags: {
            camera_surface: 'proof_camera',
            camera_phase: 'startup',
          },
        });
      }
      setCameraError(t('shared.camera.proofCameraTimeout'));
    }, CAMERA_START_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [
    appState,
    cameraError,
    hasAllPermissions,
    isFocused,
    isReady,
    pendingUpload,
    retryCount,
    t,
    verificationType,
  ]);

  const persistLocalDraft = useCallback(
    async (upload: PendingUpload): Promise<ProofDraft> => {
      if (!user) {
        throw new Error(t('shared.camera.signInBeforeSending'));
      }

      const existing = await getProofDraft(clientEventId);
      const draft = existing
        ? await updateProofDraft(clientEventId, {
            proofType: upload.mediaType,
            proofValue: upload.localMediaUri,
            localMediaUri: upload.localMediaUri,
            remoteMediaUrl: null,
            status: LOCAL_DRAFT_STATUS,
            sendRequestedAt: null,
            lastError: null,
          })
        : await createProofDraft({
            userId: user.id,
            challengeId,
            groupId,
            proofType: upload.mediaType,
            proofValue: upload.localMediaUri,
            localMediaUri: upload.localMediaUri,
            clientTimeZone,
            clientEventId,
          });

      onLocalDraftSaved?.(draft);
      return draft;
    },
    [
      challengeId,
      clientEventId,
      clientTimeZone,
      groupId,
      onLocalDraftSaved,
      t,
      user,
    ]
  );

  const handlePickFromLibrary = useCallback(async () => {
    if (isProcessing || pendingUpload) return;

    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: verificationType === 'photo' ? ['images'] : ['videos'],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 30,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const prepared = await preparePendingUpload(
        result.assets[0].uri,
        verificationType
      );
      await persistLocalDraft(prepared);
      setPendingUpload(prepared);
      setProofNotice(null);
      setCameraError(null);
    } catch (error) {
      setProofNotice({
        title: t('shared.camera.proofCouldNotOpen'),
        description: getErrorMessage(
          error,
          t('shared.camera.proofPrepareFailed')
        ),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    pendingUpload,
    persistLocalDraft,
    preparePendingUpload,
    t,
    verificationType,
  ]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isProcessing || !isReady || pendingUpload) return;

    if (verificationType === 'video' && isRecording) {
      try {
        await cameraRef.current.stopRecording();
      } catch {
        setCameraError(t('shared.camera.videoFinishFailed'));
      }
      return;
    }

    if (verificationType === 'video') {
      setIsRecording(true);
      try {
        const recording = await cameraRef.current.recordAsync({
          maxDuration: 30,
        });
        if (!recording?.uri) {
          throw new Error(t('shared.camera.videoFileMissing'));
        }

        setIsProcessing(true);
        const prepared = await preparePendingUpload(recording.uri, 'video');
        await persistLocalDraft(prepared);
        setPendingUpload(prepared);
      } catch (error) {
        setCameraError(
          getErrorMessage(error, t('shared.camera.videoSaveFailed'))
        );
      } finally {
        setIsRecording(false);
        setIsProcessing(false);
      }
      return;
    }

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
        exif: false,
      });
      if (!photo?.uri) {
        throw new Error(t('shared.camera.photoFileMissing'));
      }

      const prepared = await preparePendingUpload(photo.uri, 'photo');
      await persistLocalDraft(prepared);
      setPendingUpload(prepared);
    } catch (error) {
      setCameraError(
        getErrorMessage(error, t('shared.camera.photoCaptureFailed'))
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    isReady,
    isRecording,
    pendingUpload,
    persistLocalDraft,
    preparePendingUpload,
    t,
    verificationType,
  ]);

  const confirmUpload = useCallback(async () => {
    if (!pendingUpload || isProcessing) return;

    if (!user) {
      onCaptureIssue?.(null, t('shared.camera.signInBeforeSending'));
      return;
    }

    setIsProcessing(true);
    try {
      const consentedDraft = await updateProofDraft(clientEventId, {
        sendRequestedAt: new Date().toISOString(),
        lastError: null,
      });
      onLocalDraftSaved?.(consentedDraft);

      onVerificationComplete({
        clientEventId,
        localMediaUri: pendingUpload.localMediaUri,
        proofType: pendingUpload.mediaType,
        proofValue: pendingUpload.localMediaUri,
      });
    } catch (error) {
      const message = getErrorMessage(
        error,
        t('shared.camera.proofUploadFailed')
      );
      let preservedDraft: ProofDraft | null = null;
      try {
        preservedDraft = await getProofDraft(clientEventId);
      } catch {
        // Keep the original consent/storage error as the useful user-facing fact.
      }
      onCaptureIssue?.(preservedDraft, message);
    } finally {
      setIsProcessing(false);
      setIsRecording(false);
    }
  }, [
    clientEventId,
    isProcessing,
    onCaptureIssue,
    onLocalDraftSaved,
    onVerificationComplete,
    pendingUpload,
    t,
    user,
  ]);

  const retryCamera = useCallback(() => {
    cameraMountStartedAtRef.current = null;
    cameraSlowReportedRef.current = false;
    cameraTimeoutReportedRef.current = false;
    setCameraError(null);
    setIsReady(false);
    setRetryCount(value => value + 1);
  }, []);

  const toggleCameraType = useCallback(() => {
    if (isRecording || isProcessing || !isReady) return;
    cameraMountStartedAtRef.current = null;
    cameraSlowReportedRef.current = false;
    cameraTimeoutReportedRef.current = false;
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
    setIsReady(false);
  }, [isProcessing, isReady, isRecording]);

  if (pendingUpload) {
    const mediaPreview =
      pendingUpload.mediaType === 'photo' ? (
        <Image
          source={{ uri: pendingUpload.localMediaUri }}
          style={styles.previewMedia}
          accessibilityLabel={t('shared.camera.capturedPhotoProof')}
        />
      ) : (
        <ReviewVideoPreview
          uri={pendingUpload.localMediaUri}
          style={styles.previewMedia}
        />
      );
    const sendCopy = getProofSendCopy(proofChecker, t);
    const previewRule = (mentaRule ?? proofRule)?.trim() || null;
    const previewTitle =
      pendingUpload.mediaType === 'photo'
        ? t('proofRoles.send.check_photo')
        : t('proofRoles.send.check_video');
    const holdToSend = (
      <HoldToSendButton
        onComplete={() => void confirmUpload()}
        disabled={isProcessing}
        label={t('shared.camera.holdToSend')}
        holdingLabel={t('shared.camera.keepHolding')}
        hint={sendCopy?.hint ?? t('shared.camera.releaseToCancel')}
        tapAlternativeLabel={t('shared.camera.sendOneTap')}
        leadingAction={{
          label: t('proofRoles.send.retake'),
          onPress: () => setPendingUpload(null),
          disabled: isProcessing,
          testID: 'media-proof-retake',
        }}
        testID="media-proof-hold-to-send"
      />
    );
    const framedPreview = (
      <View style={styles.previewFrame}>
        {mediaPreview}
        {previewRule ? (
          <Text style={styles.previewRuleText} numberOfLines={2}>
            {t('proofRoles.send.rule', { rule: previewRule })}
          </Text>
        ) : null}
      </View>
    );
    const reviewActions = (
      <>
        <Text style={styles.previewTitle}>{previewTitle}</Text>
        <View style={styles.localDraftReceipt}>
          <Text style={styles.localDraftLabel}>
            {t('shared.camera.savedOnIPad')}
          </Text>
          <Text style={styles.localDraftCopy}>
            {t('shared.camera.notSentYetIPad')}
          </Text>
        </View>
        <ProofCheckerLine checker={proofChecker} />
        <View style={styles.previewActions}>{holdToSend}</View>
      </>
    );

    if (usesIPadWorkspace) {
      return (
        <IPadTwoPaneWorkspace
          enabled
          primary={
            <View style={styles.iPadMediaPane}>
              <Text style={styles.iPadMediaLabel}>
                {pendingUpload.mediaType === 'photo'
                  ? t('shared.camera.photoProof').toUpperCase()
                  : t('shared.camera.videoProof').toUpperCase()}
              </Text>
              {framedPreview}
            </View>
          }
          secondary={<View style={styles.iPadReviewPane}>{reviewActions}</View>}
          primaryStyle={styles.iPadPrimaryPane}
          secondaryStyle={styles.iPadSecondaryPane}
          testID="media-proof-ipad-workspace"
        />
      );
    }

    return (
      <View style={styles.previewScreen}>
        {onPreviewChange ? null : (
          <Text style={styles.previewTitle}>{previewTitle}</Text>
        )}
        {framedPreview}
        <ProofCheckerLine checker={proofChecker} />
        <View style={styles.previewActions}>{holdToSend}</View>
      </View>
    );
  }

  if (
    !cameraPermission ||
    (verificationType === 'video' && !microphonePermission)
  ) {
    return <CameraLoadingPlaceholder />;
  }

  if (!hasAllPermissions) {
    const needsCamera = !cameraPermission.granted;
    const needsMicrophone =
      verificationType === 'video' && !microphonePermission?.granted;
    const hasBlockedPermission = Boolean(
      (needsCamera && cameraPermission.canAskAgain === false) ||
      (needsMicrophone && microphonePermission?.canAskAgain === false)
    );
    const neededPermissions =
      needsCamera && needsMicrophone
        ? t('shared.camera.cameraAndMicrophoneAccess')
        : needsMicrophone
          ? t('shared.camera.microphoneAccess')
          : t('shared.camera.cameraAccess');
    const accessTitle = hasBlockedPermission
      ? needsCamera && needsMicrophone
        ? t('cameraAccess.cameraAndMicrophoneOff')
        : needsMicrophone
          ? t('cameraAccess.microphoneOff')
          : t('cameraAccess.cameraOff')
      : verificationType === 'photo'
        ? t('cameraAccess.photoTitle')
        : t('cameraAccess.videoTitle');
    const accessBody = hasBlockedPermission
      ? verificationType === 'photo'
        ? t('cameraAccess.photoOffBody')
        : t('cameraAccess.videoOffBody', { permissions: neededPermissions })
      : verificationType === 'photo'
        ? t('cameraAccess.photoBody')
        : t('cameraAccess.videoBody');
    const accessActionLabel = hasBlockedPermission
      ? permissionRequestPending
        ? t('shared.camera.openingSettings')
        : t('shared.camera.openSettings')
      : permissionRequestPending
        ? t('shared.camera.requestingAccess')
        : needsCamera && needsMicrophone
          ? t('cameraAccess.allowCameraAndMicrophone')
          : needsMicrophone
            ? t('cameraAccess.allowMicrophone')
            : t('cameraAccess.allowCamera');

    const requestMissingPermission = async () => {
      if (permissionRequestPending) return;

      setProofNotice(null);
      setPermissionRequestPending(true);
      try {
        if (hasBlockedPermission) {
          await Linking.openSettings();
          return;
        }

        // A refusal the system will not ask about again switches this screen
        // to the Settings state on its own; only a soft refusal needs a note.
        if (needsCamera) {
          const result = await requestCameraPermission();
          if (!result.granted && result.canAskAgain !== false) {
            setProofNotice({
              title: t('shared.camera.cameraAccessOff'),
              description: t('shared.camera.cameraAccessOffDescription'),
            });
          }
          if (!result.granted || !needsMicrophone) return;
        }

        const result = await requestMicrophonePermission();
        if (!result.granted && result.canAskAgain !== false) {
          setProofNotice({
            title: t('shared.camera.microphoneAccessOff'),
            description: t('shared.camera.microphoneAccessOffDescription'),
          });
        }
      } catch (error) {
        captureError(error, {
          surface: 'proof_camera',
          phase: 'permission_request',
          platform: Platform.OS,
          permissionBlocked: hasBlockedPermission,
          verificationType,
        });
        setProofNotice({
          title: t('shared.camera.permissionCheckFailed'),
          description: t('shared.camera.permissionCheckFailedDescription'),
        });
      } finally {
        setPermissionRequestPending(false);
      }
    };

    return (
      <View
        style={[styles.accessScreen, compactScreenInset]}
        testID="camera-proof-permission"
      >
        <View style={styles.accessHero}>
          <MentaMascot
            state={
              hasBlockedPermission ? 'camera-access-off' : 'today-proof-due'
            }
            size="hero"
          />
          <Text style={styles.accessTitle} accessibilityRole="header">
            {accessTitle}
          </Text>
          <Text style={styles.accessBody}>{accessBody}</Text>
          {proofNotice ? (
            <View style={styles.notice} testID="camera-proof-notice">
              <Text style={styles.noticeTitle}>{proofNotice.title}</Text>
              <Text style={styles.messageCopy}>{proofNotice.description}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.accessActions}>
          <AppButton
            title={accessActionLabel}
            onPress={() => void requestMissingPermission()}
            size="large"
            fullWidth
            disabled={permissionRequestPending}
            loading={permissionRequestPending}
            testID="camera-proof-permission-action"
          />
          <AppButton
            title={
              verificationType === 'photo'
                ? t('cameraAccess.chooseSavedPhoto')
                : t('cameraAccess.chooseSavedVideo')
            }
            onPress={() => void handlePickFromLibrary()}
            variant="secondary"
            size="large"
            fullWidth
            disabled={isProcessing || permissionRequestPending}
            testID="camera-proof-library"
          />
          <AppButton
            title={t('cameraAccess.notNow')}
            onPress={onCancel}
            variant="ghost"
            size="large"
            fullWidth
            testID="camera-proof-not-now"
          />
        </View>
      </View>
    );
  }

  if (cameraError) {
    return (
      <View style={[styles.messageScreen, compactScreenInset]}>
        <ImageIcon size={32} color={mentaColors.warning} />
        <Text style={styles.messageTitle}>
          {t('shared.camera.cameraNeedsReset')}
        </Text>
        <Text style={styles.messageCopy}>{cameraError}</Text>
        <AppButton
          title={t('shared.camera.retryProofCamera')}
          onPress={retryCamera}
          size="large"
          fullWidth
        />
        <AppButton
          title={t('shared.camera.chooseFromLibrary')}
          onPress={() => void handlePickFromLibrary()}
          variant="secondary"
          size="large"
          fullWidth
        />
        <AppButton
          title={t('shared.camera.leaveCapture')}
          onPress={onCancel}
          variant="ghost"
          size="large"
          fullWidth
        />
      </View>
    );
  }

  const shouldShowCamera = isFocused && appState === 'active';

  if (!shouldShowCamera) {
    return (
      <View style={[styles.messageScreen, compactScreenInset]}>
        <CameraIcon size={32} color={mentaColors.text.secondary} />
        <Text style={styles.messageTitle}>
          {t('shared.camera.capturePaused')}
        </Text>
        <Text style={styles.messageCopy}>
          {t('shared.camera.capturePausedDescription')}
        </Text>
        <AppButton
          title={t('shared.camera.retryProofCamera')}
          onPress={retryCamera}
          size="large"
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.cameraShell}>
      <CameraView
        key={`camera-${cameraType}-${retryCount}`}
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        onCameraReady={() => {
          const durationMs = cameraMountStartedAtRef.current
            ? Date.now() - cameraMountStartedAtRef.current
            : 0;
          addBreadcrumb('camera_ready', {
            surface: 'proof_camera',
            platform: Platform.OS,
            durationMs,
            retryCount,
            verificationType,
          });
          if (
            durationMs >= CAMERA_SLOW_START_MS &&
            !cameraSlowReportedRef.current
          ) {
            cameraSlowReportedRef.current = true;
            captureMessage('camera_start_slow', 'warning', {
              extras: {
                surface: 'proof_camera',
                platform: Platform.OS,
                durationMs,
                retryCount,
                permissionGranted: true,
                verificationType,
              },
              tags: {
                camera_surface: 'proof_camera',
                camera_phase: 'startup',
              },
            });
          }
          setIsReady(true);
          setCameraError(null);
        }}
        onMountError={error => {
          captureError(error, {
            surface: 'proof_camera',
            phase: 'mount',
            platform: Platform.OS,
            retryCount,
            verificationType,
          });
          setCameraError(t('shared.camera.proofCameraMountFailed'));
          setIsReady(false);
        }}
      />

      {!isReady ? (
        <View style={styles.initialisingOverlay}>
          <SkeletonLoader
            announce={false}
            width={120}
            height={8}
            borderRadius={4}
          />
          <Text style={styles.initialisingText}>
            {t('shared.camera.wakingCamera')}
          </Text>
        </View>
      ) : null}

      {mentaRule ? (
        <View style={styles.mentaRule} pointerEvents="none">
          <Text style={styles.mentaRuleLabel}>
            {t('mentaCheck.camera.lookFor')}
          </Text>
          <Text style={styles.mentaRuleText}>{mentaRule}</Text>
        </View>
      ) : null}
      <View style={[styles.cameraToolbar, compactScreenInset]}>
        <Pressable
          onPress={toggleCameraType}
          disabled={isRecording || isProcessing || !isReady}
          style={({ pressed }) => [
            styles.cameraIconButton,
            pressed ? styles.cameraIconButtonPressed : null,
            isRecording || isProcessing || !isReady
              ? styles.cameraIconButtonDisabled
              : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('shared.camera.switchCamera')}
          accessibilityHint={t('shared.camera.switchCameraHint')}
        >
          <RefreshCwIcon size={24} color={mentaColors.paper} />
        </Pressable>

        <Pressable
          onPress={() => void handleCapture()}
          disabled={isProcessing || (!isReady && !isRecording)}
          style={({ pressed }) => [
            styles.shutterButton,
            isRecording ? styles.shutterButtonRecording : null,
            pressed ? styles.shutterButtonPressed : null,
            isProcessing || (!isReady && !isRecording)
              ? styles.cameraIconButtonDisabled
              : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            verificationType === 'video'
              ? isRecording
                ? t('shared.camera.stopRecordingVideo')
                : t('shared.camera.startRecordingVideo')
              : t('shared.camera.capturePhoto')
          }
          accessibilityHint={
            verificationType === 'video'
              ? t('shared.camera.recordVideoHint')
              : t('shared.camera.capturePhotoHint')
          }
        >
          {isProcessing ? (
            <SkeletonLoader
              announce={false}
              width={22}
              height={22}
              borderRadius={mentaRadii.round}
            />
          ) : verificationType === 'video' ? (
            <VideoIcon
              size={28}
              color={isRecording ? mentaColors.paper : mentaColors.text.onPaper}
            />
          ) : (
            <CameraIcon size={28} color={mentaColors.text.onPaper} />
          )}
        </Pressable>

        <Pressable
          onPress={onCancel}
          disabled={isRecording || isProcessing}
          style={({ pressed }) => [
            styles.cameraIconButton,
            pressed ? styles.cameraIconButtonPressed : null,
            isRecording || isProcessing
              ? styles.cameraIconButtonDisabled
              : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('shared.camera.cancelCapture')}
          accessibilityHint={t('shared.camera.cancelCaptureHint')}
        >
          <XIcon size={24} color={mentaColors.paper} />
        </Pressable>
      </View>
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    mentaRule: {
      position: 'absolute',
      top: mentaSpacing[4],
      left: mentaSpacing[4],
      right: mentaSpacing[4],
      padding: mentaSpacing[4],
      gap: mentaSpacing[2],
      backgroundColor: 'rgba(8, 9, 9, 0.8)',
      borderRadius: mentaRadii.large,
    },
    mentaRuleLabel: {
      ...mentaTypography.bodySmall,
      color: mediaColors.text.secondary,
    },
    mentaRuleText: {
      ...mentaTypography.bodyMedium,
      color: mediaColors.text.primary,
    },
    cameraShell: {
      flex: 1,
      minHeight: 420,
      overflow: 'hidden',
      borderRadius: mentaRadii.large,
      backgroundColor: mentaColors.canvas,
      position: 'relative',
    },
    camera: {
      flex: 1,
    },
    cameraToolbar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      minHeight: 112,
      paddingHorizontal: mentaSpacing[6],
      paddingBottom: mentaSpacing[6],
      paddingTop: mentaSpacing[4],
      backgroundColor: 'rgba(8, 9, 9, 0.68)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cameraIconButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: mentaRadii.round,
      backgroundColor: 'rgba(248, 247, 241, 0.16)',
      borderWidth: 1,
      borderColor: 'rgba(248, 247, 241, 0.32)',
    },
    cameraIconButtonPressed: {
      opacity: 0.72,
    },
    cameraIconButtonDisabled: {
      opacity: 0.42,
    },
    shutterButton: {
      width: 72,
      height: 72,
      borderRadius: mentaRadii.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mentaColors.paper,
      borderWidth: 4,
      borderColor: 'rgba(248, 247, 241, 0.55)',
    },
    shutterButtonRecording: {
      backgroundColor: mentaColors.danger,
      borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    shutterButtonPressed: {
      transform: [{ scale: 0.98 }],
    },
    initialisingOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(8, 9, 9, 0.74)',
      gap: mentaSpacing[2],
    },
    initialisingText: {
      ...mentaTypography.body,
      color: mentaColors.paper,
    },
    previewScreen: {
      width: '100%',
      gap: mentaSpacing[4],
      paddingTop: mentaSpacing[2],
    },
    iPadPrimaryPane: {
      flex: 1.65,
    },
    iPadSecondaryPane: {
      flex: 1,
    },
    iPadMediaPane: {
      gap: mentaSpacing[3],
      width: '100%',
    },
    iPadMediaLabel: {
      ...mentaTypography.labelBold,
      color: mentaColors.text.secondary,
    },
    iPadReviewPane: {
      gap: mentaSpacing[5],
      paddingTop: mentaSpacing[2],
    },
    localDraftReceipt: {
      borderBottomColor: mentaColors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: mentaColors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: mentaSpacing[2],
      paddingVertical: mentaSpacing[4],
    },
    localDraftLabel: {
      ...mentaTypography.labelBold,
      color: mentaColors.action,
    },
    localDraftCopy: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
    },
    previewTitle: {
      ...mentaTypography.title,
      color: mentaColors.text.primary,
    },
    previewFrame: {
      width: '100%',
      gap: mentaSpacing[2],
    },
    previewMedia: {
      width: '100%',
      // Paper S01: tall enough to judge the proof, short enough to keep the
      // hold-to-send control on screen on a standard phone.
      aspectRatio: 382 / 440,
      borderRadius: mentaRadii.large,
      backgroundColor: mentaColors.canvas,
      overflow: 'hidden',
    },
    previewRuleText: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
    },
    previewActions: {
      gap: mentaSpacing[2],
    },
    cameraLoadingScreen: {
      width: '100%',
      gap: mentaSpacing[4],
      paddingTop: mentaSpacing[2],
    },
    messageScreen: {
      width: '100%',
      minHeight: 340,
      alignItems: 'center',
      justifyContent: 'center',
      gap: mentaSpacing[4],
      paddingHorizontal: mentaSpacing[6],
      paddingVertical: mentaSpacing[8],
      backgroundColor: mentaColors.raised,
      borderWidth: 1,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
    },
    messageTitle: {
      ...mentaTypography.title,
      color: mentaColors.text.primary,
      textAlign: 'center',
    },
    messageCopy: {
      ...mentaTypography.body,
      color: mentaColors.text.secondary,
      textAlign: 'center',
      marginBottom: mentaSpacing[2],
    },
    accessScreen: {
      flexGrow: 1,
      width: '100%',
      justifyContent: 'space-between',
      gap: mentaSpacing[8],
      paddingBottom: mentaSpacing[2],
    },
    accessHero: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: mentaSpacing[3],
    },
    accessTitle: {
      ...mentaTypography.heading,
      color: mentaColors.text.primary,
      textAlign: 'center',
    },
    accessBody: {
      ...mentaTypography.lead,
      color: mentaColors.text.secondary,
      textAlign: 'center',
      maxWidth: 340,
    },
    accessActions: {
      width: '100%',
      gap: mentaSpacing[3],
    },
    notice: {
      width: '100%',
      gap: mentaSpacing[1],
      padding: mentaSpacing[4],
      borderWidth: 1,
      borderColor: mentaColors.warning,
      borderRadius: mentaRadii.medium,
      backgroundColor: mentaColors.warningSoft,
    },
    noticeTitle: {
      ...mentaTypography.bodySmallMedium,
      color: mentaColors.warning,
      textAlign: 'center',
    },
  });
  return { styles };
};
