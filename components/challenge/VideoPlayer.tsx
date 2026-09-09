import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { AppButton } from '@/components/ui/AppButton';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import {
  ExternalLinkIcon,
  PlayIcon,
  VideoIcon,
  XIcon,
} from '@/components/ui/icons';
import { showToast } from '@/components/ui/Toast';
import { useTranslation } from '@/lib/localization';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onClose?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('todayProof.promise.video_proof');
  const { colors, spacing, typography, borderRadius, shadows } = theme;
  const [modalVisible, setModalVisible] = useState(false);

  const styles = StyleSheet.create({
    container: {
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    thumbnail: {
      width: '100%',
      height: 200,
      backgroundColor: colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.medium,
    },
    videoLabel: {
      color: 'white',
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      ...shadows.large,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
      flex: 1,
    },
    closeButton: {
      minHeight: mentaLayout.minimumTouchTarget,
      minWidth: mentaLayout.minimumTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.secondary,
    },
    videoPlaceholder: {
      height: 250,
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    placeholderIcon: {
      marginBottom: spacing.md,
    },
    placeholderText: {
      fontSize: typography.sizes.base,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    placeholderSubtext: {
      fontSize: typography.sizes.sm,
      color: colors.text.tertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
    actionsContainer: {
      marginTop: spacing.sm,
    },
    actionButton: {
      width: '100%',
    },
  });

  const handlePlayVideo = () => {
    setModalVisible(true);
  };

  const handleOpenExternal = async () => {
    if (!videoUrl || !videoUrl.trim()) {
      showToast.error(
        t('todayProof.promise.video_unavailable'),
        t('todayProof.promise.video_unavailable_detail')
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
      } else {
        showToast.error(
          t('todayProof.promise.cannot_open_video'),
          t('todayProof.promise.cannot_open_video_detail')
        );
      }
    } catch {
      showToast.error(
        t('todayProof.promise.cannot_open_video'),
        t('todayProof.promise.open_video_error')
      );
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    onClose?.();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('todayProof.promise.open_video')}
        style={styles.container}
        onPress={handlePlayVideo}
      >
        <View style={styles.thumbnail}>
          <View style={styles.overlay}>
            <View style={styles.playButton}>
              <PlayIcon size={24} color={colors.text.primary} />
            </View>
            <Text style={styles.videoLabel}>
              {t('todayProof.promise.open_video')}
            </Text>
          </View>
        </View>
      </Pressable>

      <ModalCard
        visible={modalVisible}
        onClose={handleClose}
        maxWidth={420}
        accessibilityLabel={resolvedTitle}
        testID="proof-video-dialog"
        overlayStyle={styles.modalOverlay}
        cardStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Text accessibilityRole="header" style={styles.modalTitle}>
            {resolvedTitle}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('todayProof.promise.close_video')}
            hitSlop={10}
            style={styles.closeButton}
            onPress={handleClose}
          >
            <XIcon size={20} color={colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.videoPlaceholder}>
          <VideoIcon
            size={48}
            color={colors.text.tertiary}
            style={styles.placeholderIcon}
          />
          <Text style={styles.placeholderText}>
            {t('todayProof.promise.open_video_detail')}
          </Text>
          <Text style={styles.placeholderSubtext}>
            {t('todayProof.promise.device_player_detail')}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <AppButton
            title={t('todayProof.promise.open_device_player')}
            onPress={handleOpenExternal}
            variant="accent"
            fullWidth
            style={styles.actionButton}
            icon={<ExternalLinkIcon size={16} color={colors.text.inverse} />}
          />
        </View>
      </ModalCard>
    </>
  );
};
