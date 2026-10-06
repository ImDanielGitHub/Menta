import {
  logUpdatesContextAtStartup,
  attachUpdatesListeners,
} from '@/lib/updates-diagnostics';
import { addBreadcrumb, captureMessage, captureError } from '@/lib/sentry';
import * as Updates from 'expo-updates';
const mockListeners: ((event: unknown) => void)[] = [];
jest.mock('expo-updates', () => ({
  updateId: 'test-update',
  channel: 'production',
  runtimeVersion: '1.9.8',
  isEmbeddedLaunch: false,
  manifest: { extra: { privateFutureValue: 'private-manifest-value' } },
  addListener: (listener: (event: unknown) => void) => {
    mockListeners.push(listener);
    return { remove: jest.fn() };
  },
}));
jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
  captureError: jest.fn(),
}));
it('retains basic update diagnostics without the full manifest or event payload', async () => {
  await logUpdatesContextAtStartup();
  const unsubscribe = attachUpdatesListeners();
  mockListeners[0]({
    type: 'updateAvailable',
    manifest: Updates.manifest,
    extra: 'private-event-value',
  });
  const captured = JSON.stringify([
    jest.mocked(addBreadcrumb).mock.calls,
    jest.mocked(captureMessage).mock.calls,
    jest.mocked(captureError).mock.calls,
  ]);
  expect(captured).toContain('test-update');
  expect(captured).toContain('production');
  expect(captured).not.toContain('private-manifest-value');
  expect(captured).not.toContain('private-event-value');
  unsubscribe();
});
