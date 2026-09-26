import { trackProductEvent } from '@/lib/posthog';

// Callback and foreground recovery can finish the same confirmation together.
// Keep only a bounded, process-local receipt; no account data is an event property.
const completedReceipts = new Set<string>();

export const trackConfirmedEmailSignup = (
  userId: string,
  requestedAt: number
): void => {
  const receipt = `${userId}:${requestedAt}`;
  if (completedReceipts.has(receipt)) return;
  completedReceipts.add(receipt);
  if (completedReceipts.size > 64) {
    const oldest = completedReceipts.values().next().value;
    if (oldest) completedReceipts.delete(oldest);
  }
  trackProductEvent('Authentication Result', {
    flow: 'signup',
    method: 'password',
    outcome: 'succeeded',
  });
};
