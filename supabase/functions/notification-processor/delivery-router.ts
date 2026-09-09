export type DeliveryRouterResult = {
  kind: string;
  reason?: string;
};

export async function sendWithOneSignalCompatibilityFallback<
  TResult extends DeliveryRouterResult,
>(options: {
  providerName: 'expo' | 'onesignal';
  sendExpo: () => Promise<TResult>;
  sendOneSignal: () => Promise<TResult>;
}): Promise<{
  fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION' | null;
  providerName: 'expo' | 'onesignal';
  result: TResult;
}> {
  if (options.providerName === 'expo') {
    return {
      fallbackReason: null,
      providerName: 'expo',
      result: await options.sendExpo(),
    };
  }

  const oneSignalResult = await options.sendOneSignal();
  if (oneSignalResult.kind !== 'no-valid-subscription') {
    return {
      fallbackReason: null,
      providerName: 'onesignal',
      result: oneSignalResult,
    };
  }

  return {
    fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION',
    providerName: 'expo',
    result: await options.sendExpo(),
  };
}
