import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import { useIsFocused } from 'expo-router/react-navigation';
import { useTheme } from '@/constants/ThemeContext';
import {
  AlertCircleIcon,
  CameraIcon,
  RefreshCwIcon,
  XIcon,
} from '@/components/ui/icons';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { addBreadcrumb, captureError, captureMessage } from '@/lib/sentry';
import { useTranslation } from '@/lib/localization/use-translation';

const CAMERA_SLOW_START_MS = 3000;
const CAMERA_START_TIMEOUT_MS = 8000;

interface CameraFixProps {
  onBarCodeScanned?: (result: BarcodeScanningResult) => void;
  onClose?: () => void;
}

type ScannerAction = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  testID: string;
  icon?: React.ReactNode;
};

type ScannerStatePanelProps = {
  title: string;
  message: string;
  tone?: 'neutral' | 'error';
  icon?: React.ReactNode;
  busy?: boolean;
  primaryAction?: ScannerAction;
  secondaryAction?: ScannerAction;
  testID: string;
};

function ScannerLoadingVisual({
  light = false,
  testID,
}: {
  light?: boolean;
  testID: string;
}) {
  const { colors } = useTheme();
  const foreground = light ? colors.text.primary : colors.primary;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.loadingVisual}
      testID={testID}
    >
      <View style={[styles.loadingFrame, { borderColor: foreground }]}>
        <SkeletonLoader
          announce={false}
          borderRadius={18}
          height={52}
          width={52}
          style={styles.loadingLens}
        >
          <View style={styles.loadingLensIcon}>
            <CameraIcon color={foreground} size={24} />
          </View>
        </SkeletonLoader>
      </View>
      <SkeletonLoader announce={false} borderRadius={4} height={8} width={88} />
    </View>
  );
}

function ScannerStatePanel({
  title,
  message,
  tone = 'neutral',
  icon,
  busy = false,
  primaryAction,
  secondaryAction,
  testID,
}: ScannerStatePanelProps) {
  const { colors } = useTheme();
  const phoneLayout = usePhoneLayout();
  const messageColor =
    tone === 'error' ? colors.status.error : colors.text.secondary;

  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      style={[
        styles.statePanel,
        {
          maxWidth: Math.min(360, phoneLayout.contentWidth),
          padding: phoneLayout.screenInset,
        },
      ]}
      testID={testID}
    >
      {busy ? (
        <ScannerLoadingVisual testID={`${testID}-visual`} />
      ) : (
        <View style={styles.stateIcon}>{icon}</View>
      )}
      <Text
        style={[
          styles.stateTitle,
          {
            color: colors.text.primary,
            flexShrink: 1,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[styles.stateMessage, { color: messageColor, flexShrink: 1 }]}
      >
        {message}
      </Text>
      {primaryAction ? (
        <AppButton
          title={primaryAction.label}
          onPress={primaryAction.onPress}
          loading={primaryAction.loading}
          icon={primaryAction.icon}
          testID={primaryAction.testID}
          accessibilityLabel={primaryAction.label}
          style={styles.statePrimaryAction}
        />
      ) : null}
      {secondaryAction ? (
        <AppButton
          title={secondaryAction.label}
          onPress={secondaryAction.onPress}
          variant="ghost"
          icon={secondaryAction.icon}
          testID={secondaryAction.testID}
          accessibilityLabel={secondaryAction.label}
          style={styles.stateSecondaryAction}
        />
      ) : null}
    </View>
  );
}

function ScannerCloseButton({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!onPress) return null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('shared.camera.scannerClose')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      testID="invite-scanner-close"
      style={({ pressed }) => [
        styles.closeButton,
        pressed && styles.closeButtonPressed,
      ]}
    >
      <XIcon size={22} color={colors.text.primary} />
    </Pressable>
  );
}

function ScannerTopBar({
  topInset,
  onClose,
}: {
  topInset: number;
  onClose?: () => void;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.topBar, { top: topInset + 8 }]}
    >
      <ScannerCloseButton onPress={onClose} />
    </View>
  );
}

export default function CameraFix({
  onBarCodeScanned,
  onClose,
}: CameraFixProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const cameraMountStartedAtRef = useRef<number | null>(null);
  const cameraSlowReportedRef = useRef(false);
  const cameraTimeoutReportedRef = useRef(false);
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();
  const { t } = useTranslation();

  // Initialize camera state
  useEffect(() => {
    const initializeCamera = async () => {
      setIsInitializing(true);
      try {
        // Add delay for Android stability
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        setIsInitializing(false);
      } catch (error) {
        captureError(error, {
          surface: 'invite_scanner',
          phase: 'initialization',
          platform: Platform.OS,
        });
        setCameraError(t('shared.camera.scannerInitialisationFailed'));
        setIsInitializing(false);
      }
    };

    if (isFocused) {
      initializeCamera();
    }
  }, [isFocused, t]);

  // Handle camera lifecycle based on screen focus
  useEffect(() => {
    if (!isFocused) {
      setIsCameraActive(false);
    } else {
      // Small delay before reactivating camera to prevent crashes
      const timer = setTimeout(() => {
        setIsCameraActive(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  const shouldShowCamera = isFocused && isCameraActive && !isInitializing;

  useEffect(() => {
    if (!permission?.granted || !shouldShowCamera || isReady || cameraError) {
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
            surface: 'invite_scanner',
            platform: Platform.OS,
            durationMs,
            retryCount,
            permissionGranted: true,
          },
          tags: {
            camera_surface: 'invite_scanner',
            camera_phase: 'startup',
          },
        });
      }
      setCameraError(t('shared.camera.scannerTimeout'));
    }, CAMERA_START_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [
    cameraError,
    isReady,
    permission?.granted,
    retryCount,
    shouldShowCamera,
    t,
  ]);

  const handleCameraReady = () => {
    const durationMs = cameraMountStartedAtRef.current
      ? Date.now() - cameraMountStartedAtRef.current
      : 0;
    addBreadcrumb('camera_ready', {
      surface: 'invite_scanner',
      platform: Platform.OS,
      durationMs,
      retryCount,
    });
    if (durationMs >= CAMERA_SLOW_START_MS && !cameraSlowReportedRef.current) {
      cameraSlowReportedRef.current = true;
      captureMessage('camera_start_slow', 'warning', {
        extras: {
          surface: 'invite_scanner',
          platform: Platform.OS,
          durationMs,
          retryCount,
          permissionGranted: true,
        },
        tags: {
          camera_surface: 'invite_scanner',
          camera_phase: 'startup',
        },
      });
    }
    setIsReady(true);
    setCameraError(null);
  };

  const handleCameraError = (error: unknown) => {
    captureError(error, {
      surface: 'invite_scanner',
      phase: 'mount',
      platform: Platform.OS,
      retryCount,
    });
    setCameraError(t('shared.camera.scannerMountFailed'));
    setIsReady(false);
  };

  const retryCamera = () => {
    cameraMountStartedAtRef.current = null;
    cameraSlowReportedRef.current = false;
    cameraTimeoutReportedRef.current = false;
    setCameraError(null);
    setIsReady(false);
    setIsInitializing(true);
    setRetryCount(prev => prev + 1);
    setIsCameraActive(false);

    // Reset camera after delay
    setTimeout(() => {
      setIsCameraActive(true);
      setIsInitializing(false);
    }, 300);
  };

  const handleRequestPermission = async () => {
    setPermissionError(null);
    setIsRequestingPermission(true);

    try {
      if (permission?.canAskAgain === false) {
        await Linking.openSettings();
        return;
      }

      await requestPermission();
    } catch (error) {
      captureError(error, {
        surface: 'invite_scanner',
        phase: 'permission_request',
        platform: Platform.OS,
        permissionBlocked: permission?.canAskAgain === false,
      });
      setPermissionError(
        permission?.canAskAgain === false
          ? t('shared.camera.settingsDidNotOpen')
          : t('shared.camera.permissionDidNotOpen')
      );
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Handle QR code scanning with debounce
  const scanLockRef = useRef(false);
  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanLockRef.current || !onBarCodeScanned) return;

    scanLockRef.current = true;

    // Pause preview to stabilise native module before we unmount (crash-prevention)
    try {
      cameraRef.current?.pausePreview();
    } catch {
      // Unsupported on some platforms, but safe to ignore.
    }

    onBarCodeScanned(result);

    // Reset scan lock after 2 seconds to prevent multiple scans
    setTimeout(() => {
      scanLockRef.current = false;
    }, 2000);
  };

  if (!permission) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <ScannerTopBar topInset={insets.top} onClose={onClose} />
        <ScannerStatePanel
          busy
          title={t('shared.camera.scannerChecking')}
          message={t('shared.camera.scannerPreparing')}
          testID="invite-scanner-loading"
          secondaryAction={
            onClose
              ? {
                  label: t('shared.camera.scannerCloseShort'),
                  onPress: onClose,
                  testID: 'invite-scanner-loading-close',
                }
              : undefined
          }
        />
      </View>
    );
  }

  if (!permission.granted) {
    const isBlocked = permission.canAskAgain === false;
    const permissionMessage = permissionError
      ? permissionError
      : isBlocked
        ? t('shared.camera.scannerBlockedDescription')
        : t('shared.camera.scannerPermissionDescription');

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <ScannerTopBar topInset={insets.top} onClose={onClose} />
        <ScannerStatePanel
          title={
            isBlocked
              ? t('shared.camera.scannerAccessOff')
              : t('shared.camera.scanInvite')
          }
          message={permissionMessage}
          tone={permissionError ? 'error' : 'neutral'}
          icon={<CameraIcon size={48} color={colors.text.secondary} />}
          testID="invite-scanner-permission"
          primaryAction={{
            label: isBlocked
              ? t('shared.camera.scannerOpenSettings')
              : t('shared.camera.scannerAllowCamera'),
            onPress: handleRequestPermission,
            loading: isRequestingPermission,
            testID: 'invite-scanner-permission-action',
          }}
          secondaryAction={
            onClose
              ? {
                  label: t('shared.camera.scannerCloseShort'),
                  onPress: onClose,
                  testID: 'invite-scanner-permission-close',
                }
              : undefined
          }
        />
      </View>
    );
  }

  if (cameraError) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <ScannerTopBar topInset={insets.top} onClose={onClose} />
        <ScannerStatePanel
          title={t('shared.camera.scannerReset')}
          message={cameraError}
          tone="error"
          icon={<AlertCircleIcon size={48} color={colors.status.error} />}
          testID="invite-scanner-error"
          primaryAction={{
            label: t('shared.camera.scannerRetry'),
            onPress: retryCamera,
            testID: 'invite-scanner-retry',
            icon: <RefreshCwIcon size={18} color={colors.text.inverse} />,
          }}
          secondaryAction={
            onClose
              ? {
                  label: t('shared.camera.scannerCloseShort'),
                  onPress: onClose,
                  testID: 'invite-scanner-error-close',
                }
              : undefined
          }
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      {shouldShowCamera ? (
        <>
          <CameraView
            key={`camera-qr-${retryCount}`} // Force re-mount on retry
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            onCameraReady={handleCameraReady}
            onMountError={handleCameraError}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            // Android stability improvements
            {...(Platform.OS === 'android' && {
              useCamera2Api: true,
              lowLatency: true,
            })}
          />

          {/* Scanning overlay */}
          <View style={styles.overlay}>
            <View
              accessibilityLabel={t('shared.camera.qrFrame')}
              pointerEvents="none"
              style={styles.scanArea}
              testID="invite-scanner-frame"
            >
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.scanText}>{t('shared.camera.alignQr')}</Text>
          </View>

          {!isReady && (
            <View style={styles.initializingOverlay}>
              <ScannerLoadingVisual
                light
                testID="invite-scanner-initializing-visual"
              />
              <Text style={styles.initializingText}>
                {t('shared.camera.wakingScanner')}
              </Text>
            </View>
          )}

          <ScannerTopBar topInset={insets.top} onClose={onClose} />
        </>
      ) : (
        <View
          style={[
            styles.inactiveContainer,
            {
              backgroundColor: colors.background.primary,
              paddingHorizontal: phoneLayout.screenInset,
            },
          ]}
        >
          {isInitializing ? (
            <ScannerLoadingVisual
              light
              testID="invite-scanner-preparing-visual"
            />
          ) : (
            <View style={styles.pausedIcon} testID="invite-scanner-paused-icon">
              <CameraIcon color={colors.text.secondary} size={36} />
            </View>
          )}
          <Text style={[styles.inactiveText, { color: colors.text.primary }]}>
            {isInitializing
              ? t('shared.camera.preparingScanner')
              : t('shared.camera.scannerPaused')}
          </Text>
          {onClose ? (
            <AppButton
              title={t('shared.camera.scannerCloseShort')}
              onPress={onClose}
              variant="ghost"
              testID="invite-scanner-inactive-close"
              style={styles.stateSecondaryAction}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: 16,
    textAlign: 'center',
  },
  statePanel: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 360,
    padding: 24,
  },
  stateIcon: {
    minHeight: 48,
    justifyContent: 'center',
  },
  loadingVisual: {
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  loadingFrame: {
    width: 112,
    height: 88,
    borderWidth: 1,
    borderRadius: mentaRadii.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLens: {
    overflow: 'hidden',
  },
  loadingLensIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateMessage: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 12,
  },
  statePrimaryAction: {
    marginTop: 24,
    minWidth: 190,
  },
  stateSecondaryAction: {
    marginTop: 8,
  },
  initializingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initializingText: {
    color: mentaColors.text.primary,
    fontSize: 16,
    marginTop: 16,
  },
  inactiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: mentaColors.canvas,
    paddingHorizontal: 24,
  },
  inactiveText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
  pausedIcon: {
    width: 72,
    height: 72,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    borderColor: mentaColors.border,
    backgroundColor: mentaColors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: mentaColors.text.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanText: {
    color: mentaColors.text.primary,
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
