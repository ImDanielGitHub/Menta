import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { addBreadcrumb, captureMessage } from '@/lib/sentry';
import { useTranslation } from '@/lib/localization/use-translation';

const safelyRecordToastTelemetry = (record: () => void) => {
  try {
    record();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Toast] Telemetry unavailable', error);
    }
  }
};

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: (id: string) => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  repeatCount?: number;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  duration = 4200,
  onDismiss,
  action,
  repeatCount,
}) => {
  const translateY = useRef(new Animated.Value(-18)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const motion = useMotionPreferences();
  const { t } = useTranslation();

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: motion.distance(-12),
        duration: motion.duration(160),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: motion.duration(140),
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss?.(id));
  }, [id, motion, onDismiss, opacity, translateY]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.duration(210),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration(180),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss, motion, opacity, translateY]);

  const handleAction = useCallback(() => {
    action?.onPress();
    handleDismiss();
  }, [action, handleDismiss]);

  const trimmedTitle = title.trim();
  const announcement = message?.trim()
    ? t('shared.accessibility.toastAnnouncement', {
        title: trimmedTitle,
        message: message.trim(),
      })
    : trimmedTitle;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          top: insets.top + mentaSpacing[2],
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        accessible
        accessibilityLabel={announcement}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      />
      <View style={styles.card}>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text selectable style={styles.title}>
              {title}
            </Text>
            {!!repeatCount && repeatCount > 1 ? (
              <Text
                accessibilityLabel={t('shared.accessibility.toastRepeated', {
                  count: repeatCount,
                })}
                style={styles.repeat}
              >
                {t('shared.accessibility.toastCount', { count: repeatCount })}
              </Text>
            ) : null}
          </View>
          {message ? (
            <Text selectable style={styles.message}>
              {message}
            </Text>
          ) : null}
        </View>
        <View style={styles.actionDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            action?.label || t('shared.accessibility.dismissNotification')
          }
          onPress={action ? handleAction : handleDismiss}
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>
            {action?.label || t('shared.accessibility.dismiss')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

class ToastManager {
  private listeners: ((toasts: ToastProps[]) => void)[] = [];
  private toasts: ToastProps[] = [];
  private recentByKey = new Map<
    string,
    { id: string; lastShownAt: number; count: number }
  >();

  private static readonly THROTTLE_WINDOW_MS = 8000;
  private static readonly SENTRY_AGGREGATE_THRESHOLD = 3;
  private static readonly MAX_VISIBLE = 2;

  subscribe(listener: (toasts: ToastProps[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(
        candidate => candidate !== listener
      );
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private buildKey(toast: Omit<ToastProps, 'id' | 'onDismiss'>) {
    const normalise = (value?: string) => (value || '').trim().toLowerCase();
    return `${toast.type}|${normalise(toast.title)}|${normalise(toast.message)}`;
  }

  show(toast: Omit<ToastProps, 'id' | 'repeatCount' | 'onDismiss'>) {
    const key = this.buildKey(toast);
    const now = Date.now();
    const recent = this.recentByKey.get(key);

    if (recent && now - recent.lastShownAt < ToastManager.THROTTLE_WINDOW_MS) {
      const index = this.toasts.findIndex(
        candidate => candidate.id === recent.id
      );
      if (index >= 0) {
        const existing = this.toasts[index];
        const nextCount = (existing.repeatCount || 1) + 1;
        this.toasts[index] = { ...existing, repeatCount: nextCount };
        this.recentByKey.set(key, {
          id: recent.id,
          lastShownAt: now,
          count: nextCount,
        });
        if (
          toast.type === 'error' &&
          nextCount === ToastManager.SENTRY_AGGREGATE_THRESHOLD
        ) {
          safelyRecordToastTelemetry(() => {
            if (typeof captureMessage !== 'function') return;
            captureMessage(
              'ui_error_toast_repeated',
              __DEV__ ? 'warning' : 'debug',
              {
                tags: { toast_type: toast.type },
                extras: {
                  title: toast.title,
                  message: toast.message,
                  count: nextCount,
                },
              }
            );
          });
        }
        this.notify();
        return recent.id;
      }
    }

    const id = `${Date.now()}${Math.random().toString(36).slice(2, 11)}`;
    const nextToast: ToastProps = {
      ...toast,
      id,
      onDismiss: this.dismiss,
      repeatCount: 1,
    };

    this.toasts = [
      ...this.toasts.slice(-(ToastManager.MAX_VISIBLE - 1)),
      nextToast,
    ];
    this.recentByKey.set(key, { id, lastShownAt: now, count: 1 });

    if (toast.type === 'error') {
      safelyRecordToastTelemetry(() => {
        if (typeof addBreadcrumb === 'function') {
          addBreadcrumb('Error toast shown', {
            title: toast.title,
            message: toast.message,
          });
        }
        if (typeof captureMessage === 'function') {
          captureMessage('ui_error_toast', __DEV__ ? 'info' : 'debug', {
            tags: { toast_type: toast.type },
            extras: { title: toast.title, message: toast.message },
          });
        }
      });
    }

    this.notify();
    return id;
  }

  dismiss = (id: string) => {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  };

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const phoneLayout = usePhoneLayout();

  useEffect(() => toastManager.subscribe(setToasts), []);

  const toastViewport = toasts.length ? (
    <View
      pointerEvents="box-none"
      style={[
        styles.toastOverlay,
        { paddingHorizontal: phoneLayout.screenInset },
      ]}
    >
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </View>
  ) : null;

  return (
    <View style={styles.providerRoot}>
      {children}
      {toastViewport && Platform.OS === 'ios' ? (
        <FullWindowOverlay unstable_accessibilityContainerViewIsModal={false}>
          {toastViewport}
        </FullWindowOverlay>
      ) : (
        toastViewport
      )}
    </View>
  );
};

export const showToast = {
  success: (title: string, message?: string, options?: Partial<ToastProps>) =>
    toastManager.show({ type: 'success', title, message, ...options }),
  error: (title: string, message?: string, options?: Partial<ToastProps>) =>
    toastManager.show({ type: 'error', title, message, ...options }),
  warning: (title: string, message?: string, options?: Partial<ToastProps>) =>
    toastManager.show({ type: 'warning', title, message, ...options }),
  info: (title: string, message?: string, options?: Partial<ToastProps>) =>
    toastManager.show({ type: 'info', title, message, ...options }),
};

const styles = StyleSheet.create({
  providerRoot: { flex: 1 },
  toastOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 999999,
    elevation: 999999,
    paddingHorizontal: mentaLayout.screenInset,
  },
  container: {
    alignSelf: 'center',
    marginBottom: mentaSpacing[2],
    maxWidth: mentaLayout.taskLane,
    width: '100%',
  },
  card: {
    backgroundColor: mentaColors.paper,
    borderCurve: 'continuous',
    borderRadius: mentaRadii.large,
    overflow: 'hidden',
  },
  copy: {
    gap: mentaSpacing[1],
    paddingHorizontal: mentaSpacing[4],
    paddingTop: mentaSpacing[4],
    paddingBottom: mentaSpacing[3],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
    fontSize: 21,
    lineHeight: 27,
    flexShrink: 1,
  },
  message: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
    flexShrink: 1,
  },
  repeat: {
    ...mentaTypography.captionMedium,
    color: mentaColors.text.mutedOnPaper,
    fontVariant: ['tabular-nums'],
  },
  actionDivider: {
    backgroundColor: mentaColors.borderPaper,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: mentaSpacing[4],
  },
  actionRow: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[4],
  },
  actionText: {
    ...mentaTypography.captionMedium,
    color: mentaColors.text.mutedOnPaper,
  },
  pressed: { opacity: 0.62 },
});
