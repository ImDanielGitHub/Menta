export interface RemoteNotificationProvider<TRecord, TResult> {
  readonly configured: boolean;
  readonly name: string;
  send(record: TRecord): Promise<TResult>;
}

export type RemoteProviderSelection<TRecord, TResult> =
  | {
      kind: 'active';
      provider: RemoteNotificationProvider<TRecord, TResult>;
    }
  | {
      kind: 'noop';
      providerName: string;
      reason:
        | 'SKIPPED_REMOTE_DELIVERY_DISABLED'
        | 'SKIPPED_REMOTE_PROVIDER_NOT_CONFIGURED';
    };

const SAFE_PROVIDER_NAME = /^[a-z][a-z0-9_-]{0,31}$/;

export type NotificationDeliveryPolicy = {
  schemaVersion: 1;
  ios: 'expo' | 'onesignal';
  android: 'expo';
};

export const SAFE_NOTIFICATION_DELIVERY_POLICY: NotificationDeliveryPolicy = {
  schemaVersion: 1,
  ios: 'expo',
  android: 'expo',
};

export const parseNotificationDeliveryPolicy = (
  value: unknown
): NotificationDeliveryPolicy => {
  if (typeof value !== 'string' || value.length > 512) {
    return SAFE_NOTIFICATION_DELIVERY_POLICY;
  }

  try {
    const parsed = JSON.parse(value) as {
      schema_version?: unknown;
      ios?: unknown;
      android?: unknown;
    };
    if (
      parsed.schema_version !== 1 ||
      (parsed.ios !== 'expo' && parsed.ios !== 'onesignal') ||
      parsed.android !== 'expo'
    ) {
      return SAFE_NOTIFICATION_DELIVERY_POLICY;
    }
    return {
      schemaVersion: 1,
      ios: parsed.ios,
      android: 'expo',
    };
  } catch {
    return SAFE_NOTIFICATION_DELIVERY_POLICY;
  }
};

/** Unknown, Android, and unconfigured iOS registrations stay on Expo. */
export const resolveNotificationDeliveryProvider = (options: {
  oneSignalConfigured: boolean;
  platform: unknown;
  policy: NotificationDeliveryPolicy;
}): 'expo' | 'onesignal' =>
  options.platform === 'ios' &&
  options.policy.ios === 'onesignal' &&
  options.oneSignalConfigured
    ? 'onesignal'
    : 'expo';

const normalizeProviderName = (
  requestedName: unknown,
  defaultName: string
): string => {
  const candidate =
    typeof requestedName === 'string' ? requestedName.trim().toLowerCase() : '';
  return SAFE_PROVIDER_NAME.test(candidate) ? candidate : defaultName;
};

/** Select exactly one provider for a queued notification. */
export function selectRemoteNotificationProvider<TRecord, TResult>(options: {
  defaultProviderName: string;
  providers: Readonly<
    Record<string, RemoteNotificationProvider<TRecord, TResult>>
  >;
  requestedProviderName: unknown;
}): RemoteProviderSelection<TRecord, TResult> {
  const providerName = normalizeProviderName(
    options.requestedProviderName,
    options.defaultProviderName
  );

  if (providerName === 'disabled' || providerName === 'none') {
    return {
      kind: 'noop',
      providerName,
      reason: 'SKIPPED_REMOTE_DELIVERY_DISABLED',
    };
  }

  const provider = options.providers[providerName];
  if (!provider?.configured) {
    return {
      kind: 'noop',
      providerName,
      reason: 'SKIPPED_REMOTE_PROVIDER_NOT_CONFIGURED',
    };
  }

  return { kind: 'active', provider };
}
