import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AppScreen, AppTopBar, AppInsetGroup } from '@/components/ui/AppShell';
import { AppFieldRow } from '@/components/ui/AppFields';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { mentaSpacing } from '@/constants/MentaDesignSystem';
import { useActivityInbox } from '@/hooks/use-activity-inbox';
import { useTranslation } from '@/lib/localization';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { resolveNotificationActionPath } from '@/lib/notifications/notification-actions';
import type { ActivityItem } from '@/lib/notifications/activity-inbox';
import { trackProductEvent } from '@/lib/posthog';

export default function ActivityInboxScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const inbox = useActivityInbox();
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [readFailed, setReadFailed] = useState(false);

  useEffect(() => {
    trackProductEvent('Activity Inbox', { stage: 'opened' });
  }, []);

  const open = async (item: ActivityItem) => {
    if (openingId !== null) return;
    setOpeningId(item.id);
    setReadFailed(false);
    try {
      if (!(await inbox.markRead(item.id))) return;
      trackProductEvent('Activity Inbox', { stage: 'receipt_opened' });
      const path = resolveNotificationActionPath(item.payload);
      router.push((path ? `/${path}` : '/(tabs)') as never);
    } catch {
      setReadFailed(true);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <AppScreen
      lane="working"
      safeArea
      scrollable
      hasTabBar={false}
      contentContainerStyle={{ gap: mentaSpacing[4] }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <AppTopBar
        title={t('notifications.inbox.title')}
        onBack={() => backOrReplace(router, '/(tabs)')}
      />
      <AppInsetGroup>
        <AppFieldRow
          title={t('notifications.inbox.settings')}
          onPress={() => router.push('/notification-settings')}
          showDivider={false}
        />
      </AppInsetGroup>
      {inbox.failed || readFailed ? (
        <AppInlineNotice
          title={t('notifications.inbox.error')}
          description={t('notifications.inbox.error_body')}
          tone="error"
          actionLabel={t('fullAuth.notification_settings.try_again')}
          onAction={() => {
            setReadFailed(false);
            void inbox.refresh();
          }}
        />
      ) : null}
      {inbox.loading ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('notifications.inbox.loading')}
          style={{ gap: mentaSpacing[4] }}
        >
          {[0, 1, 2, 3].map(index => (
            <SkeletonLoader key={index} height={80} width="100%" />
          ))}
        </View>
      ) : !inbox.failed && inbox.items.length === 0 ? (
        <AppInlineNotice
          title={t('notifications.inbox.empty')}
          description={t('notifications.inbox.empty_body')}
        />
      ) : inbox.items.length > 0 ? (
        <AppInsetGroup>
          {inbox.items.map((item, index) => (
            <AppFieldRow
              key={item.id}
              title={item.title ?? t('notifications.inbox.title')}
              subtitle={[
                item.body,
                new Intl.DateTimeFormat(locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(item.created_at)),
              ]
                .filter(Boolean)
                .join('\n')}
              value={item.is_read ? undefined : t('notifications.inbox.unread')}
              onPress={() => {
                void open(item);
              }}
              showDivider={index < inbox.items.length - 1}
              testID={`activity-item-${item.id}`}
            />
          ))}
        </AppInsetGroup>
      ) : null}
    </AppScreen>
  );
}
