import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  AlertCircleIcon,
  CameraIcon,
  CheckCircleIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { withReadableLeading } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';

const getSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getProofIcon = (verificationType?: string) => {
  if (verificationType === 'text') return FileTextIcon;
  if (verificationType === 'video') return VideoIcon;
  return CameraIcon;
};

export default function CameraCompatibilityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const params = useLocalSearchParams<{
    challengeId?: string | string[];
    verificationType?: string | string[];
    source?: string | string[];
  }>();
  const challengeId = getSingleParam(params.challengeId);
  const verificationType = getSingleParam(params.verificationType);
  const source = getSingleParam(params.source);
  const hasProofContext = Boolean(challengeId && verificationType);
  const ProofIcon = getProofIcon(verificationType);
  const proofLabel =
    verificationType === 'text'
      ? t('shared.camera.textProof')
      : verificationType === 'video'
        ? t('shared.camera.videoProof')
        : t('shared.camera.photoProof');

  const openVerification = useCallback(() => {
    if (!challengeId || !verificationType) {
      router.replace('/(tabs)');
      return;
    }

    router.replace({
      pathname: '/verification',
      params: {
        challengeId,
        verificationType,
        ...(source ? { source } : {}),
      },
    });
  }, [challengeId, verificationType, source, router]);

  useEffect(() => {
    if (hasProofContext) {
      openVerification();
    }
  }, [hasProofContext, openVerification]);

  return (
    <AppScreen
      lane="full"
      safeArea
      hasTabBar={false}
      padding={false}
      scrollable
      style={styles.screen}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[styles.content, { paddingHorizontal: phoneLayout.screenInset }]}
      >
        <AppTopBar
          title={hasProofContext ? proofLabel : t('shared.camera.proofLink')}
          subtitle={
            hasProofContext
              ? t('shared.camera.openingProofCapture')
              : t('shared.camera.needsContext')
          }
          onBack={() => backOrReplace(router, '/(tabs)')}
          trailing={
            <View style={styles.statusPill}>
              {hasProofContext ? (
                <SkeletonLoader
                  width={15}
                  height={15}
                  borderRadius={mentaRadii.round}
                  announce={false}
                />
              ) : (
                <AlertCircleIcon size={15} color={mentaColors.warning} />
              )}
              <Text style={styles.statusPillText}>
                {hasProofContext
                  ? t('shared.camera.ready')
                  : t('shared.camera.missing')}
              </Text>
            </View>
          }
        />

        <View style={styles.hero}>
          <View style={styles.proofIcon}>
            <ProofIcon size={26} color={mentaColors.text.primary} />
          </View>
          <Text
            style={[
              styles.heroTitle,
              withReadableLeading(mentaTypography.heading, phoneLayout),
            ]}
          >
            {hasProofContext
              ? t('shared.camera.openingProofCaptureTitle')
              : t('shared.camera.incompleteLinkTitle')}
          </Text>
          <Text
            style={[
              styles.heroCopy,
              withReadableLeading(mentaTypography.body, phoneLayout),
            ]}
          >
            {hasProofContext
              ? t('shared.camera.handoffDescription')
              : t('shared.camera.incompleteLinkDescription')}
          </Text>
        </View>

        <View style={styles.proofCard}>
          <View style={styles.proofCardHeader}>
            <Text style={styles.proofCardTitle}>
              {hasProofContext
                ? t('shared.camera.handoffCardTitle')
                : t('shared.camera.recoveryPath')}
            </Text>
            <Text style={styles.proofCardMeta}>
              {hasProofContext ? proofLabel : t('shared.camera.noUpload')}
            </Text>
          </View>

          <View style={styles.capturePreview}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
            <Text style={styles.capturePreviewLabel}>
              {hasProofContext
                ? t('shared.camera.preparingViewfinder')
                : t('shared.camera.noProofAttached')}
            </Text>
            <Text style={styles.capturePreviewText}>
              {hasProofContext
                ? t('shared.camera.nextScreenStates')
                : t('shared.camera.noSubmissionFromRoute')}
            </Text>
          </View>

          <View style={styles.proofRows}>
            <View style={styles.proofRow}>
              <ImageIcon size={17} color={mentaColors.text.secondary} />
              <Text style={styles.proofRowText}>
                {t('shared.camera.permissionFallback')}
              </Text>
            </View>
            <View style={styles.proofRow}>
              <CheckCircleIcon size={17} color={mentaColors.text.secondary} />
              <Text style={styles.proofRowText}>
                {t('shared.camera.notSavedUntilAccepted')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton
            title={
              hasProofContext
                ? t('shared.camera.openCapture')
                : t('shared.camera.backToToday')
            }
            onPress={openVerification}
            variant="primary"
            size="large"
            fullWidth
          />
          <AppButton
            title={t('shared.camera.goBack')}
            onPress={() => backOrReplace(router, '/(tabs)')}
            variant="ghost"
            size="large"
            fullWidth
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: mentaSpacing[6],
    paddingTop: mentaSpacing[2],
    paddingBottom: mentaSpacing[8],
    gap: mentaSpacing[6],
  },
  statusPill: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[1],
    paddingHorizontal: mentaSpacing[3],
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    borderColor: mentaColors.border,
    backgroundColor: mentaColors.raised,
  },
  statusPillText: {
    color: mentaColors.text.secondary,
    ...mentaTypography.labelBold,
  },
  hero: {
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[6],
  },
  proofIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: mentaColors.actionBorder,
    backgroundColor: mentaColors.actionSoft,
    marginBottom: mentaSpacing[2],
  },
  heroTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
  },
  heroCopy: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  proofCard: {
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  proofCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[4],
  },
  proofCardTitle: {
    flex: 1,
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  proofCardMeta: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmallMedium,
  },
  capturePreview: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[1],
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    borderColor: mentaColors.border,
    backgroundColor: mentaColors.surface,
    overflow: 'hidden',
  },
  capturePreviewLabel: {
    color: mentaColors.text.primary,
    ...mentaTypography.labelBold,
    textTransform: 'uppercase',
  },
  capturePreviewText: {
    maxWidth: 260,
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
    textAlign: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: mentaSpacing[6],
    left: mentaSpacing[6],
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: mentaColors.action,
  },
  cornerTopRight: {
    position: 'absolute',
    top: mentaSpacing[6],
    right: mentaSpacing[6],
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: mentaColors.action,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: mentaSpacing[6],
    left: mentaSpacing[6],
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: mentaColors.action,
  },
  cornerBottomRight: {
    position: 'absolute',
    right: mentaSpacing[6],
    bottom: mentaSpacing[6],
    width: 24,
    height: 24,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: mentaColors.action,
  },
  proofRows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  proofRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
  },
  proofRowText: {
    flex: 1,
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  actions: {
    marginTop: 'auto',
    gap: mentaSpacing[3],
  },
});
