import type {
  AnalyticsEventProperties,
  MentaAnalyticsEvent,
} from '@/lib/product-analytics';
import { retentionNotificationClient } from '@/lib/notifications/retention-notification-client';

/**
 * Mirror only bounded lifecycle facts that are useful for OneSignal audience
 * entry. Product analytics remains canonical; OneSignal never receives proof
 * text, promise text, route identifiers, group identifiers, or account data.
 */
export const forwardProductEventToRetentionProvider = async <
  TEvent extends MentaAnalyticsEvent,
>(
  event: TEvent,
  properties: AnalyticsEventProperties[TEvent] | undefined
): Promise<boolean> => {
  switch (event) {
    case 'Promise Created': {
      const value = properties as AnalyticsEventProperties['Promise Created'];
      const [eventRecorded] = await Promise.all([
        retentionNotificationClient.recordEvent('promise_created', {
          has_active_promise: true,
          source:
            value.creation_source === 'onboarding' ? 'onboarding' : 'today',
        }),
        retentionNotificationClient.syncAudienceTags({
          has_active_promise: true,
        }),
      ]);
      return eventRecorded;
    }
    case 'Proof Submitted':
      return retentionNotificationClient.recordEvent('proof_submitted', {
        source: 'today',
      });
    case 'Proof Reviewed': {
      const value = properties as AnalyticsEventProperties['Proof Reviewed'];
      if (value.review_outcome !== 'approved') return false;
      return retentionNotificationClient.recordEvent('proof_approved', {
        source: 'today',
      });
    }
    case 'Subscription Started': {
      const [eventRecorded] = await Promise.all([
        retentionNotificationClient.recordEvent('subscription_started', {
          is_pro: true,
          source: 'system',
        }),
        retentionNotificationClient.syncAudienceTags({ is_pro: true }),
      ]);
      return eventRecorded;
    }
    case 'Notification Permission Updated': {
      const value =
        properties as AnalyticsEventProperties['Notification Permission Updated'];
      return retentionNotificationClient.recordEvent(
        'notification_permission_changed',
        {
          permission_status: value.permission_granted ? 'granted' : 'denied',
          source: value.source === 'education' ? 'onboarding' : 'system',
        }
      );
    }
    case 'Notification Opened':
      return retentionNotificationClient.recordEvent('notification_opened', {
        source: 'notification',
      });
    default:
      return false;
  }
};
