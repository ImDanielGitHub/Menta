import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  StyleSheet,
  View,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useIsFocused } from 'expo-router/react-navigation';
import { AppButton } from '@/components/ui/AppButton';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { useTranslation } from '@/lib/localization';
import { useTheme } from '@/constants/ThemeContext';
import { trackProductEvent } from '@/lib/posthog';
import type { AnalyticsEventProperties } from '@/lib/product-analytics';

export const trackProofVideoPlayback = (
  properties: AnalyticsEventProperties['Proof Video Playback']
) => trackProductEvent('Proof Video Playback', properties);

/** One native playback surface for captures, history and reviewer evidence. */
export function ProofVideoPlayer({
  uri,
  style,
  onAvailable,
  onUnavailable,
  onRetry,
  surface,
}: {
  uri: string;
  style: StyleProp<ViewStyle>;
  onAvailable?: () => void;
  onUnavailable?: () => void;
  onRetry?: () => void;
  surface: AnalyticsEventProperties['Proof Video Playback']['surface'];
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const focused = useIsFocused();
  const view = useRef<VideoView>(null);
  const mounted = useRef(true);
  const [opening, setOpening] = useState(false);
  const [fullscreenFailed, setFullscreenFailed] = useState(false);
  const player = useVideoPlayer({ uri }, instance => {
    instance.loop = false;
    instance.staysActiveInBackground = false;
  });
  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });
  const available = useRef(onAvailable);
  const unavailable = useRef(onUnavailable);
  available.current = onAvailable;
  unavailable.current = onUnavailable;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (status === 'readyToPlay') available.current?.();
    if (status === 'error') {
      unavailable.current?.();
      trackProofVideoPlayback({ surface, stage: 'error', reason: 'playback' });
    }
  }, [status, surface]);

  useEffect(() => {
    if (!focused) player.pause();
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') player.pause();
    });
    return () => subscription.remove();
  }, [focused, player]);

  const openFullscreen = async () => {
    if (opening || !view.current) return;
    setOpening(true);
    setFullscreenFailed(false);
    trackProofVideoPlayback({
      surface,
      stage: 'fullscreen_requested',
      reason: 'none',
    });
    try {
      player.play();
      await view.current.enterFullscreen();
    } catch {
      if (!mounted.current) return;
      player.pause();
      setFullscreenFailed(true);
      trackProofVideoPlayback({
        surface,
        stage: 'error',
        reason: 'fullscreen',
      });
    } finally {
      if (mounted.current) setOpening(false);
    }
  };

  const retry = async () => {
    trackProofVideoPlayback({ surface, stage: 'retry', reason: 'playback' });
    if (onRetry) {
      onRetry();
      return;
    }
    try {
      await player.replaceAsync({ uri });
    } catch {
      // The status event owns the visible error; never leak a rejected retry.
      unavailable.current?.();
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.frame, style]}>
        <VideoView
          ref={view}
          player={player}
          nativeControls
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          onFirstFrameRender={() => available.current?.()}
          onFullscreenEnter={() =>
            trackProofVideoPlayback({
              surface,
              stage: 'fullscreen_opened',
              reason: 'none',
            })
          }
          onFullscreenExit={() => {
            player.pause();
            trackProofVideoPlayback({
              surface,
              stage: 'fullscreen_closed',
              reason: 'none',
            });
          }}
          accessibilityLabel={t('todayProof.promise.video_proof')}
          style={StyleSheet.absoluteFill}
        />
        {status !== 'readyToPlay' ? (
          <ImagePlaceholder
            label={t(
              status === 'error'
                ? 'todayProof.proof.video_unavailable_short'
                : 'todayProof.proof.loading_video'
            )}
            state={status === 'error' ? 'error' : 'loading'}
            onPress={status === 'error' ? () => void retry() : undefined}
          />
        ) : null}
      </View>
      {fullscreenFailed ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{ color: theme.colors.text.secondary }}
        >
          {t('todayProof.promise.cannot_open_video')}
        </Text>
      ) : null}
      <AppButton
        title={t(
          fullscreenFailed
            ? 'todayProof.promise.try_again'
            : 'todayProof.promise.watch_full_screen'
        )}
        onPress={() => void openFullscreen()}
        loading={opening}
        disabled={status !== 'readyToPlay'}
        variant="secondary"
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 12 },
  frame: { backgroundColor: '#000000', overflow: 'hidden' },
});
