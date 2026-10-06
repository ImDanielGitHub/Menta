/** Authentication interactions stay inside the app, including when a journey
 * event carries the same metadata under a different event name. */
export const shouldExportProductAnalyticsEvent = (
  event: string,
  properties: unknown
): boolean => {
  if (event === 'Authentication Result') return false;
  const value =
    properties && typeof properties === 'object'
      ? (properties as Record<string, unknown>)
      : {};

  if (event === 'Onboarding Journey') {
    return (
      value.stage !== 'auth' &&
      value.stage !== 'auth_cancelled' &&
      !['apple', 'google', 'password', 'existing_account'].includes(
        String(value.selection ?? '')
      )
    );
  }
  if (event === 'Promise Invite Journey') {
    return (
      value.stage !== 'auth_handoff' &&
      value.entry_point !== 'authentication' &&
      value.entry_point !== 'password_authentication' &&
      value.method === undefined &&
      value.mode === undefined
    );
  }
  return true;
};
