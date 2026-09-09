import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

import {
  APP_STORE_WRITE_REVIEW_URL,
  PLAY_STORE_WRITE_REVIEW_URL,
  STORE_REVIEW_RETRY_BACKOFF_MINUTES,
  getStoreReviewCapability,
  getStoreReviewDebugState,
  openStoreWriteReview,
  queuePositiveOutcomeReview,
  requestEligibleSystemStoreReview,
} from '@/lib/store-review';

const mockGetIosApplicationReleaseTypeAsync = jest.fn();
const mockFileSystemState = { sandboxExists: false };
const mockTrackProductEvent = jest.fn();

jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.9.2',
  ApplicationReleaseType: {
    UNKNOWN: 0,
    SIMULATOR: 1,
    ENTERPRISE: 2,
    DEVELOPMENT: 3,
    AD_HOC: 4,
    APP_STORE: 5,
  },
  getIosApplicationReleaseTypeAsync: (...args: unknown[]) =>
    mockGetIosApplicationReleaseTypeAsync(...args),
}));

jest.mock('expo-file-system', () => ({
  File: class {
    get exists() {
      return mockFileSystemState.sandboxExists;
    }
  },
  Paths: { bundle: {} },
}));

jest.mock('@/lib/e2e', () => ({
  isE2EMode: jest.fn(() => false),
}));

jest.mock('@/lib/posthog', () => ({
  trackProductEvent: (...args: unknown[]) => mockTrackProductEvent(...args),
}));

const mockedIsAvailable = jest.mocked(StoreReview.isAvailableAsync);
const mockedRequestReview = jest.mocked(StoreReview.requestReview);
const { isE2EMode } = jest.requireMock<{ isE2EMode: jest.Mock }>('@/lib/e2e');

describe('store review request contract', () => {
  const originalOs = Platform.OS;

  beforeEach(async () => {
    jest.clearAllMocks();
    isE2EMode.mockReturnValue(false);
    mockFileSystemState.sandboxExists = false;
    Platform.OS = 'ios';
    mockGetIosApplicationReleaseTypeAsync.mockResolvedValue(5);
    mockedIsAvailable.mockResolvedValue(true);
    mockedRequestReview.mockResolvedValue();
    await AsyncStorage.clear();
  });

  afterAll(() => {
    Platform.OS = originalOs;
  });

  const makeEligible = async () => {
    await queuePositiveOutcomeReview();
    await queuePositiveOutcomeReview();
    await expect(queuePositiveOutcomeReview()).resolves.toBe(true);
  };

  it('waits for three accepted proofs before becoming eligible', async () => {
    await queuePositiveOutcomeReview();
    await queuePositiveOutcomeReview();
    expect((await getStoreReviewDebugState()).eligible).toBe(false);

    await queuePositiveOutcomeReview();
    expect((await getStoreReviewDebugState()).eligible).toBe(true);
    expect(mockedRequestReview).not.toHaveBeenCalled();
  });

  it('issues one system request outside a button flow', async () => {
    await makeEligible();
    await expect(requestEligibleSystemStoreReview()).resolves.toEqual({
      capability: 'system',
      outcome: 'requested',
      requested: true,
    });
    expect(mockedRequestReview).toHaveBeenCalledTimes(1);
    const requestedState = await getStoreReviewDebugState();
    expect(requestedState.eligible).toBe(false);
    expect(requestedState.lastRequestedAt).not.toBeNull();
    expect(requestedState.lastRequestedVersion).toBe('1.9.2');

    await makeEligible();
    await expect(requestEligibleSystemStoreReview()).resolves.toEqual({
      capability: 'system',
      outcome: 'same_version',
      requested: false,
    });
    expect(mockedRequestReview).toHaveBeenCalledTimes(1);
  });

  it('preserves eligibility and avoids long markers when native review rejects', async () => {
    const now = Date.parse('2026-08-31T00:00:00.000Z');
    mockedRequestReview.mockRejectedValueOnce(new Error('native failure'));
    await makeEligible();

    await expect(requestEligibleSystemStoreReview(now)).resolves.toEqual({
      capability: 'system',
      outcome: 'failed',
      requested: false,
    });

    const state = await getStoreReviewDebugState();
    expect(state.eligible).toBe(true);
    expect(state.lastRequestedAt).toBeNull();
    expect(state.lastRequestedVersion).toBeNull();
    expect(state.nativeRequestRetryAfter).toBe(
      new Date(
        now + STORE_REVIEW_RETRY_BACKOFF_MINUTES * 60 * 1000
      ).toISOString()
    );
    expect(mockTrackProductEvent).toHaveBeenCalledWith(
      'Store Review Request',
      expect.objectContaining({
        error_code: 'native_request_rejected',
        failure_stage: 'native_request',
        outcome: 'failed',
      })
    );
    expect(JSON.stringify(mockTrackProductEvent.mock.calls)).not.toContain(
      'native failure'
    );
  });

  it('backs off after rejection and succeeds after the short retry window', async () => {
    const now = Date.parse('2026-08-31T00:00:00.000Z');
    mockedRequestReview.mockRejectedValueOnce(new Error('native failure'));
    await makeEligible();
    await requestEligibleSystemStoreReview(now);

    await expect(
      requestEligibleSystemStoreReview(now + 60 * 1000)
    ).resolves.toEqual({
      capability: 'system',
      outcome: 'retry_backoff',
      requested: false,
    });
    expect(mockedRequestReview).toHaveBeenCalledTimes(1);

    const afterBackoff = now + STORE_REVIEW_RETRY_BACKOFF_MINUTES * 60 * 1000;
    await expect(
      requestEligibleSystemStoreReview(afterBackoff)
    ).resolves.toEqual({
      capability: 'system',
      outcome: 'requested',
      requested: true,
    });
    expect(mockedRequestReview).toHaveBeenCalledTimes(2);

    const state = await getStoreReviewDebugState();
    expect(state.eligible).toBe(false);
    expect(state.lastRequestedAt).toBe(new Date(afterBackoff).toISOString());
    expect(state.lastRequestedVersion).toBe('1.9.2');
    expect(state.nativeRequestRetryAfter).toBeNull();
  });

  it('does not pretend TestFlight can show the StoreKit sheet', async () => {
    mockFileSystemState.sandboxExists = true;
    await makeEligible();

    await expect(getStoreReviewCapability()).resolves.toBe('testflight');
    await expect(requestEligibleSystemStoreReview()).resolves.toEqual({
      capability: 'testflight',
      outcome: 'testflight',
      requested: false,
    });
    expect(mockedRequestReview).not.toHaveBeenCalled();
  });

  it('enforces the 120-day cooldown across app versions', async () => {
    const now = Date.parse('2026-08-28T00:00:00.000Z');
    await makeEligible();
    await AsyncStorage.multiSet([
      ['@menta/store-review:last-system-request-version:v3', '1.9.1'],
      [
        '@menta/store-review:last-system-request-at:v3',
        new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      ],
    ]);

    await expect(requestEligibleSystemStoreReview(now)).resolves.toEqual({
      capability: 'system',
      outcome: 'cooldown',
      requested: false,
    });
  });

  it('allows only one request call in flight', async () => {
    let finishRequest: (() => void) | null = null;
    let markRequestStarted: (() => void) | null = null;
    const requestStarted = new Promise<void>(resolve => {
      markRequestStarted = resolve;
    });
    mockedRequestReview.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finishRequest = resolve;
          markRequestStarted?.();
        })
    );
    await makeEligible();

    const first = requestEligibleSystemStoreReview();
    await requestStarted;
    const pendingState = await getStoreReviewDebugState();
    expect(pendingState.lastRequestedAt).toBeNull();
    expect(pendingState.lastRequestedVersion).toBeNull();
    expect(pendingState.eligible).toBe(true);
    const second = requestEligibleSystemStoreReview();

    await expect(second).resolves.toEqual({
      capability: 'unavailable',
      outcome: 'in_flight',
      requested: false,
    });
    finishRequest!();
    await expect(first).resolves.toEqual({
      capability: 'system',
      outcome: 'requested',
      requested: true,
    });
  });

  it('keeps the request inert in end-to-end runs', async () => {
    isE2EMode.mockReturnValue(true);
    await expect(requestEligibleSystemStoreReview()).resolves.toEqual({
      capability: 'system',
      outcome: 'e2e',
      requested: false,
    });
    expect(mockedRequestReview).not.toHaveBeenCalled();
  });

  it('opens the platform review pages from Settings', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    Platform.OS = 'ios';
    await expect(openStoreWriteReview()).resolves.toBe(true);
    expect(openURL).toHaveBeenLastCalledWith(APP_STORE_WRITE_REVIEW_URL);

    Platform.OS = 'android';
    await expect(openStoreWriteReview()).resolves.toBe(true);
    expect(openURL).toHaveBeenLastCalledWith(PLAY_STORE_WRITE_REVIEW_URL);
    expect(PLAY_STORE_WRITE_REVIEW_URL).toContain('showAllReviews=true');
    openURL.mockRestore();
  });
});
